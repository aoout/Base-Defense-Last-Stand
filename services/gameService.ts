

import {
  GameState,
  InputState,
  WeaponType,
  EnemyType,
  Enemy,
  Projectile,
  Turret,
  Ally,
  WeaponState,
  Entity,
  TerrainFeature,
  BloodStain,
  GameStats,
  AllyOrder,
  InventoryItem,
  TurretType,
  SpecialEventType,
  BossType,
  AppMode,
  GameMode,
  Planet,
  PersistentPlayerState,
  SaveFile,
  BiomeType
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_STATS,
  WEAPONS,
  INITIAL_AMMO,
  ENEMY_STATS,
  BASE_STATS,
  TURRET_COSTS,
  TURRET_STATS,
  ALLY_STATS,
  SHOP_PRICES,
  INVENTORY_SIZE,
  BOSS_STATS,
  TOXIC_ZONE_STATS,
  MAX_SAVE_SLOTS,
  MAX_PINNED_SLOTS,
  BIOME_STYLES
} from '../constants';
import { AudioService } from './audioService';

const TURRET_POSITIONS = [
  // Relative to Base Position at bottom of world
  { x: -150, y: -150 },
  { x: 150, y: -150 },
  { x: -250, y: -100 },
  { x: 250, y: -100 },
  { x: 0, y: -250 },
  { x: -350, y: -300 }, // Added more forward spots
  { x: 350, y: -300 },
  { x: 0, y: -450 },
];

export class GameEngine {
  state!: GameState;
  input: InputState;
  audio: AudioService;
  private lastTime: number = 0;
  private storageKey = 'BASE_DEFENSE_SAVES_V1';

  constructor() {
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, down: false, rightDown: false },
    };
    this.audio = new AudioService();
    this.reset();
    
    // Override defaults for Startup
    this.state.appMode = AppMode.START_MENU;
    this.state.planets = this.generatePlanets();

    // Load saves
    this.state.saveSlots = this.loadSavesFromStorage();
  }

  private loadSavesFromStorage(): SaveFile[] {
      try {
          const raw = localStorage.getItem(this.storageKey);
          if (raw) {
              return JSON.parse(raw);
          }
      } catch (e) {
          console.error("Failed to load saves", e);
      }
      return [];
  }

  public saveGame() {
      // Create a snapshot
      // We need to exclude saveSlots from the data being saved to avoid recursion size
      const { saveSlots, ...stateToSave } = this.state;
      
      const snapshot = JSON.stringify(stateToSave);
      
      let label = "";
      if (this.state.gameMode === GameMode.SURVIVAL) {
          label = `SURVIVAL - WAVE ${this.state.wave}`;
      } else {
          const pName = this.state.currentPlanet ? this.state.currentPlanet.name : "DEEP SPACE";
          label = `EXP - ${pName} - W${this.state.wave}`;
      }

      const newSave: SaveFile = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          label: label,
          isPinned: false,
          data: snapshot,
          mode: this.state.gameMode
      };

      const saves = [...this.state.saveSlots];

      // Logic: Max 7 saves.
      // If < 7, just add.
      // If >= 7, remove oldest UNPINNED.
      // If all 7 are pinned (logic prevents more than 3 pinned), this shouldn't fail.

      if (saves.length >= MAX_SAVE_SLOTS) {
          // Sort by time ascending
          saves.sort((a, b) => a.timestamp - b.timestamp);
          
          const unpinnedIdx = saves.findIndex(s => !s.isPinned);
          if (unpinnedIdx !== -1) {
              saves.splice(unpinnedIdx, 1);
          } else {
              // Should not happen if MAX_PINNED_SLOTS < MAX_SAVE_SLOTS
              // But as fallback, remove the absolute oldest even if pinned
              saves.shift();
          }
      }

      saves.push(newSave);
      // Sort desc for display
      saves.sort((a, b) => b.timestamp - a.timestamp);
      
      this.state.saveSlots = saves;
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
      this.addMessage("STATE ARCHIVED", this.state.player.x, this.state.player.y - 50, 'cyan');
  }

  public loadGame(id: string) {
      const save = this.state.saveSlots.find(s => s.id === id);
      if (!save) return;

      try {
          const loadedState: GameState = JSON.parse(save.data);
          
          // Restore state, but keep the current save slots and system settings
          const currentSettings = this.state.settings;
          const currentSaves = this.state.saveSlots;

          this.state = {
              ...loadedState,
              saveSlots: currentSaves,
              settings: { ...loadedState.settings, language: currentSettings.language } // Keep language preference? Or load? Let's keep preference
          };
          
          // --- FIX TIME DELTA AND INFINITY SERIALIZATION ISSUES ---
          const p = this.state.player;
          
          // Reset weapon timings because 'time' in engine starts from 0 on a new session/load
          // but the saved state has 'lastFireTime' from the old session (e.g., 50000ms).
          // This causes (time - lastFireTime) to be negative, locking the weapon.
          Object.values(p.weapons).forEach(w => {
              w.lastFireTime = 0;
              w.reloadStartTime = 0;
              w.reloading = false;
              // JSON.stringify converts Infinity to null. Restore it for Pistol.
              if (w.type === WeaponType.PISTOL && (w.ammoReserve === null || w.ammoReserve === undefined)) {
                  w.ammoReserve = Infinity;
              }
          });

          // Reset Ally timings
          this.state.allies.forEach(a => a.lastFireTime = 0);

          // Reset Turret timings
          this.state.turretSpots.forEach(s => {
              if (s.builtTurret) s.builtTurret.lastFireTime = 0;
          });

          // Reset Global Timers
          this.state.spawnTimer = 0;
          this.state.lastAllySpawnTime = 0;
          this.state.waveTimeRemaining = Math.max(0, this.state.waveTimeRemaining); // Keep remaining but safe
          
          this.lastTime = 0; // Reset engine clock
          this.state.isPaused = false; 
          this.state.appMode = AppMode.GAMEPLAY; 
          
          this.audio.resume();
          this.addMessage("MEMORY EXTRACTED", p.x, p.y - 50, 'cyan');

      } catch (e) {
          console.error("Failed to load save", e);
      }
  }

  public deleteSave(id: string) {
      const idx = this.state.saveSlots.findIndex(s => s.id === id);
      if (idx !== -1) {
          this.state.saveSlots.splice(idx, 1);
          localStorage.setItem(this.storageKey, JSON.stringify(this.state.saveSlots));
      }
  }

  public togglePin(id: string) {
      const save = this.state.saveSlots.find(s => s.id === id);
      if (!save) return;

      if (save.isPinned) {
          save.isPinned = false;
      } else {
          const pinnedCount = this.state.saveSlots.filter(s => s.isPinned).length;
          if (pinnedCount < MAX_PINNED_SLOTS) {
              save.isPinned = true;
          }
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.saveSlots));
  }

  private generatePlanets(): Planet[] {
      const planets: Planet[] = [];
      const prefixes = ["PX", "KE", "SOL", "VE", "TR", "GZ"];
      
      const biomes = Object.values(BiomeType);

      for (let i = 0; i < 15; i++) {
          const id = `p-${i}`;
          const num = 10 + Math.floor(Math.random() * 90);
          const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${num}`;
          
          // Difficulty Scaling
          // Gene Strength: 0.8 to 3.2
          const geneStrength = parseFloat((0.8 + Math.random() * 2.4).toFixed(2));
          
          // Waves: Weighted Distribution
          let totalWaves;
          const roll = Math.random();
          if (roll < 0.7) {
              totalWaves = 8 + Math.floor(Math.random() * 13); // 8 to 20
          } else {
              totalWaves = 21 + Math.floor(Math.random() * 20); // 21 to 40
          }

          // Assign Random Biome
          const biome = biomes[Math.floor(Math.random() * biomes.length)];
          const biomeStyle = BIOME_STYLES[biome];

          planets.push({
              id,
              name,
              x: Math.random() * (CANVAS_WIDTH - 100) + 50,
              y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
              radius: 15 + Math.random() * 25,
              color: biomeStyle.planetColor,
              totalWaves,
              geneStrength,
              completed: false,
              biome: biome
          });
      }
      return planets;
  }

  public reset(preservePlayer: boolean = false) {
    this.lastTime = 0;

    let initialWeapons: Record<WeaponType, WeaponState>;
    let initialLoadout: [WeaponType, WeaponType, WeaponType, WeaponType];
    let initialInventory: (InventoryItem | null)[];
    let initialScore: number;
    let initialGrenades: number;

    // Persist logic
    if (preservePlayer && this.state?.savedPlayerState) {
        const saved = this.state.savedPlayerState;
        initialWeapons = JSON.parse(JSON.stringify(saved.weapons)); // Deep copy to detach refs
        
        // Restore Infinity if lost in JSON
        Object.values(initialWeapons).forEach(w => {
            if (w.type === WeaponType.PISTOL && (w.ammoReserve === null || w.ammoReserve === undefined)) {
                w.ammoReserve = Infinity;
            }
        });

        initialLoadout = [...saved.loadout];
        initialInventory = JSON.parse(JSON.stringify(saved.inventory));
        initialScore = saved.score;
        initialGrenades = saved.grenades;
    } else {
        // Defaults
        initialWeapons = Object.values(WeaponType).reduce((acc, type) => {
            acc[type] = {
                type,
                ammoInMag: WEAPONS[type].magSize,
                ammoReserve: INITIAL_AMMO[type],
                lastFireTime: 0,
                reloading: false,
                reloadStartTime: 0,
            };
            return acc;
        }, {} as Record<WeaponType, WeaponState>);
        initialLoadout = [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL];
        initialInventory = new Array(INVENTORY_SIZE).fill(null);
        initialScore = PLAYER_STATS.initialScore;
        initialGrenades = 3;
    }

    const baseX = WORLD_WIDTH / 2;
    const baseY = WORLD_HEIGHT - 100;

    // Generate Terrain
    const terrain: TerrainFeature[] = [];
    
    // 1. Craters
    for (let i = 0; i < 40; i++) {
        terrain.push({
            id: `crater-${i}`,
            type: 'CRATER',
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: 20 + Math.random() * 60,
            opacity: 0.3 + Math.random() * 0.4
        });
    }

    // 2. Rocks
    for (let i = 0; i < 80; i++) {
        const r = 5 + Math.random() * 15;
        const points = [];
        const numPoints = 5 + Math.floor(Math.random() * 4);
        for (let j = 0; j < numPoints; j++) {
            const angle = (j / numPoints) * Math.PI * 2;
            const dist = r * (0.8 + Math.random() * 0.4);
            points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
        }

        terrain.push({
            id: `rock-${i}`,
            type: 'ROCK',
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: r,
            rotation: Math.random() * Math.PI * 2,
            points
        });
    }

    // 3. Dust / Texture specks
    for (let i = 0; i < 400; i++) {
        terrain.push({
            id: `dust-${i}`,
            type: 'DUST',
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: 1 + Math.random() * 2,
            opacity: 0.1 + Math.random() * 0.3
        });
    }

    // Initialize Stats
    const initialStats: GameStats = {
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
      killsByType: {
        [EnemyType.GRUNT]: 0,
        [EnemyType.RUSHER]: 0,
        [EnemyType.TANK]: 0,
        [EnemyType.KAMIKAZE]: 0,
        [EnemyType.VIPER]: 0,
        'BOSS': 0,
      },
      encounteredEnemies: this.state?.stats?.encounteredEnemies || [] // Keep database
    };

    // KEEP PLANETS / MODE DATA if re-initializing
    const prevPlanets = this.state?.planets || [];
    const prevAppMode = this.state?.appMode || AppMode.START_MENU;
    const prevGameMode = this.state?.gameMode || GameMode.SURVIVAL;
    const prevCurrentPlanet = this.state?.currentPlanet || null;
    const prevSavedState = this.state?.savedPlayerState || null;
    const prevSelectedPlanetId = this.state?.selectedPlanetId || null;
    const prevSaves = this.state?.saveSlots || [];

    this.state = {
      appMode: prevAppMode,
      gameMode: prevGameMode,
      planets: prevPlanets,
      currentPlanet: prevCurrentPlanet,
      selectedPlanetId: prevSelectedPlanetId,
      savedPlayerState: prevSavedState,
      saveSlots: prevSaves,

      camera: { x: 0, y: WORLD_HEIGHT - CANVAS_HEIGHT }, // Start camera at bottom
      player: {
        id: 'player',
        x: baseX,
        y: baseY - 150,
        radius: 15,
        angle: 0,
        color: '#3B82F6', // Blue 500
        hp: PLAYER_STATS.maxHp,
        maxHp: PLAYER_STATS.maxHp,
        armor: PLAYER_STATS.maxArmor,
        maxArmor: PLAYER_STATS.maxArmor,
        speed: PLAYER_STATS.speed,
        lastHitTime: 0,
        weapons: initialWeapons,
        loadout: initialLoadout,
        currentWeaponIndex: 0,
        inventory: initialInventory,
        grenades: initialGrenades,
        score: initialScore,
        isAiming: false,
      },
      base: {
        x: baseX,
        y: baseY,
        width: BASE_STATS.width,
        height: BASE_STATS.height,
        hp: BASE_STATS.maxHp,
        maxHp: BASE_STATS.maxHp,
      },
      terrain,
      bloodStains: [],
      enemies: [],
      allies: [],
      projectiles: [],
      particles: [],
      turretSpots: TURRET_POSITIONS.map((pos, i) => ({ 
        id: i, 
        x: baseX + pos.x, 
        y: baseY + pos.y 
      })),
      wave: 1,
      waveTimeRemaining: 30000, 
      spawnTimer: 0,
      enemiesSpawnedInWave: 0,
      totalEnemiesInWave: 12 + 5,
      activeSpecialEvent: SpecialEventType.NONE,
      toxicZones: [],
      lastAllySpawnTime: 0,
      isGameOver: false,
      missionComplete: false,
      isPaused: false,
      isTacticalMenuOpen: false,
      isInventoryOpen: false,
      isShopOpen: false,
      messages: [],
      settings: {
        showHUD: true,
        showBlood: true,
        showDamageNumbers: true,
        language: 'EN'
      },
      stats: initialStats,
    };
  }

  // --- MODE TRANSITIONS ---

  public enterSurvivalMode() {
      this.state.gameMode = GameMode.SURVIVAL;
      this.state.appMode = AppMode.GAMEPLAY;
      this.state.currentPlanet = null;
      this.state.savedPlayerState = null; // Clear saved state
      this.reset(false); // Clean reset
  }

  public enterExplorationMode() {
      this.state.appMode = AppMode.EXPLORATION_MAP;
      if (this.state.planets.length === 0) {
          this.state.planets = this.generatePlanets();
      }
  }

  public selectPlanet(planetId: string | null) {
      this.state.selectedPlanetId = planetId;
  }

  public deployToPlanet(planetId: string) {
      const planet = this.state.planets.find(p => p.id === planetId);
      if (!planet) return;

      this.state.gameMode = GameMode.EXPLORATION;
      this.state.currentPlanet = planet;
      this.state.appMode = AppMode.GAMEPLAY;

      // If we have a saved state, we are continuing the exploration run
      // Otherwise, it's the first planet, so start fresh
      const preserve = !!this.state.savedPlayerState;
      this.reset(preserve);
  }

  public completeMission() {
      // Save Player State
      const p = this.state.player;
      this.state.savedPlayerState = {
          score: p.score,
          grenades: p.grenades,
          inventory: p.inventory,
          loadout: p.loadout,
          weapons: p.weapons
      };

      // Mark planet complete
      if (this.state.currentPlanet) {
          this.state.currentPlanet.completed = true;
      }

      // Return to Map
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.gameMode = GameMode.EXPLORATION;
      this.state.missionComplete = false;
  }

  public exitToMainMenu() {
      this.state.appMode = AppMode.START_MENU;
  }


  // --- Helpers ---
  private distance(e1: { x: number; y: number }, e2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(e2.x - e1.x, 2) + Math.pow(e2.y - e1.y, 2));
  }

  public spawnParticle(x: number, y: number, color: string, speed = 2, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.state.particles.push({
        id: Math.random().toString(),
        x,
        y,
        radius: Math.random() * 2 + 1,
        color,
        angle: 0,
        vx: Math.cos(angle) * Math.random() * speed,
        vy: Math.sin(angle) * Math.random() * speed,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  }

  private spawnBloodStain(enemy: Enemy) {
      if (!this.state.settings.showBlood) return;
      const life = 5000 + (enemy.maxHp * 20); 
      const blotches = [];
      const numBlotches = 3 + Math.floor(Math.random() * 3);
      const baseRadius = enemy.radius;
      
      for(let i=0; i<numBlotches; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * baseRadius * 0.8;
          blotches.push({
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              r: (baseRadius * 0.5) + Math.random() * (baseRadius * 0.8)
          });
      }

      this.state.bloodStains.push({
          id: `blood-${Math.random()}`,
          x: enemy.x,
          y: enemy.y,
          color: enemy.color,
          life: life,
          maxLife: life,
          blotches
      });
  }

  private addMessage(text: string, x: number, y: number, color: string = 'white') {
    if (!this.state.settings.showDamageNumbers && (text.startsWith('-') || text.startsWith('+'))) return;
    this.state.messages.push({
      text,
      x,
      y,
      color,
      time: 2000, 
    });
  }

  public togglePause() {
    this.state.isPaused = !this.state.isPaused;
    if (!this.state.isPaused) this.lastTime = 0;
  }

  public toggleTacticalMenu() {
    this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen;
    if (!this.state.isTacticalMenuOpen) this.lastTime = 0;
  }

  public toggleInventory() {
    this.state.isInventoryOpen = !this.state.isInventoryOpen;
    if (!this.state.isInventoryOpen) this.lastTime = 0;
  }

  public issueOrder(order: AllyOrder) {
      this.state.allies.forEach(ally => {
          ally.currentOrder = order;
          if (ally.state !== 'COMBAT') {
              ally.state = order;
          }
      });
  }

  public toggleSetting(key: keyof typeof this.state.settings) {
    if (key === 'language') {
        this.cycleLanguage();
        return;
    }
    (this.state.settings as any)[key] = !(this.state.settings as any)[key];
  }

  public cycleLanguage() {
      this.state.settings.language = this.state.settings.language === 'EN' ? 'CN' : 'EN';
  }

  public swapLoadoutAndInventory(loadoutIdx: number, inventoryIdx: number) {
      const p = this.state.player;
      const invItem = p.inventory[inventoryIdx];
      if (!invItem) return;

      const oldLoadoutType = p.loadout[loadoutIdx];
      p.loadout[loadoutIdx] = invItem.type;
      p.inventory[inventoryIdx] = { id: invItem.id, type: oldLoadoutType }; 
  }

  public closeTurretUpgrade() {
      this.state.activeTurretId = undefined;
      this.state.isPaused = false;
  }

  public confirmTurretUpgrade(type: TurretType) {
      const id = this.state.activeTurretId;
      if (id === undefined) return;
      
      const spot = this.state.turretSpots[id];
      const p = this.state.player;
      
      let cost = 0;
      if (type === TurretType.GAUSS) cost = TURRET_COSTS.upgrade_gauss;
      if (type === TurretType.SNIPER) cost = TURRET_COSTS.upgrade_sniper;
      if (type === TurretType.MISSILE) cost = TURRET_COSTS.upgrade_missile;

      if (p.score >= cost && spot.builtTurret) {
          p.score -= cost;
          spot.builtTurret.level = 2;
          spot.builtTurret.type = type;
          
          const stats = TURRET_STATS[type];
          spot.builtTurret.hp = stats.hp;
          spot.builtTurret.maxHp = stats.hp;
          spot.builtTurret.damage = stats.damage;
          spot.builtTurret.range = stats.range;

          this.addMessage("System Upgraded", spot.x, spot.y - 20, '#059669');
          this.closeTurretUpgrade();
      } else {
          this.addMessage("Insufficient Scraps", p.x, p.y - 50, 'red');
      }
  }

  public purchaseItem(item: string) {
      const p = this.state.player;
      
      if (item.startsWith('WEAPON_')) {
          let type: WeaponType | null = null;
          let cost = 0;
          if (item === 'WEAPON_PULSE') { type = WeaponType.PULSE_RIFLE; cost = SHOP_PRICES.WEAPON_PULSE; }
          if (item === 'WEAPON_FLAME') { type = WeaponType.FLAMETHROWER; cost = SHOP_PRICES.WEAPON_FLAME; }
          if (item === 'WEAPON_GL') { type = WeaponType.GRENADE_LAUNCHER; cost = SHOP_PRICES.WEAPON_GL; }

          if (type && p.score >= cost) {
              const emptyIdx = p.inventory.findIndex(s => s === null);
              if (emptyIdx !== -1) {
                  p.score -= cost;
                  p.inventory[emptyIdx] = { id: Math.random().toString(), type: type };
                  this.addMessage("Weapon Acquired", p.x, p.y - 50, 'cyan');
              } else {
                  this.addMessage("Inventory Full!", p.x, p.y - 50, 'red');
              }
          } else if (p.score < cost) {
               this.addMessage("Need Scraps!", p.x, p.y - 50, 'red');
          }
          return;
      }

      if (item === 'AR_AMMO' && p.score >= SHOP_PRICES.AR_AMMO) {
          p.score -= SHOP_PRICES.AR_AMMO;
          p.weapons[WeaponType.AR].ammoReserve += 60;
      }
      else if (item === 'SG_AMMO' && p.score >= SHOP_PRICES.SG_AMMO) {
          p.score -= SHOP_PRICES.SG_AMMO;
          p.weapons[WeaponType.SG].ammoReserve += 16;
      }
      else if (item === 'SR_AMMO' && p.score >= SHOP_PRICES.SR_AMMO) {
          p.score -= SHOP_PRICES.SR_AMMO;
          p.weapons[WeaponType.SR].ammoReserve += 10;
      }
      else if (item === 'PULSE_AMMO' && p.score >= SHOP_PRICES.PULSE_AMMO) {
          p.score -= SHOP_PRICES.PULSE_AMMO;
          p.weapons[WeaponType.PULSE_RIFLE].ammoReserve += 90;
      }
      else if (item === 'FLAME_AMMO' && p.score >= SHOP_PRICES.FLAME_AMMO) {
          p.score -= SHOP_PRICES.FLAME_AMMO;
          p.weapons[WeaponType.FLAMETHROWER].ammoReserve += 200;
      }
      else if (item === 'GL_AMMO' && p.score >= SHOP_PRICES.GL_AMMO) {
          p.score -= SHOP_PRICES.GL_AMMO;
          p.weapons[WeaponType.GRENADE_LAUNCHER].ammoReserve += 12;
      }
      else if (item === 'GRENADE' && p.score >= SHOP_PRICES.GRENADE) {
          if (p.grenades < PLAYER_STATS.maxGrenades) {
             p.score -= SHOP_PRICES.GRENADE;
             p.grenades++;
          }
      }
  }

  // --- Core Update ---
  update(time: number) {
    // Only update gameplay logic if in game mode
    if (this.state.appMode !== AppMode.GAMEPLAY) {
        this.lastTime = time;
        return;
    }

    if (this.state.isGameOver || this.state.missionComplete) return;

    if (this.state.isPaused || this.state.isTacticalMenuOpen || this.state.isInventoryOpen || this.state.activeTurretId !== undefined) {
        this.lastTime = time;
        return;
    }
    
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }

    const dt = time - this.lastTime;
    this.lastTime = time;

    this.handleCamera();
    this.handlePlayer(dt, time);
    this.handleWeapons(dt, time);
    this.handleWave(dt, time);
    this.handleEnemies(dt, time);
    this.handleAllies(dt, time);
    this.handleTurrets(dt, time);
    this.handleProjectiles(dt, time);
    this.handleParticles(dt);
    this.handleBloodStains(dt);
    this.handleToxicZones(dt);
    this.handleMessages(dt);
    this.handleRegen(dt, time);
  }

  private handleCamera() {
    const p = this.state.player;
    let targetY = p.y - CANVAS_HEIGHT / 2;
    let targetX = p.x - CANVAS_WIDTH / 2;

    if (p.isAiming) {
        const mx = this.input.mouse.x - CANVAS_WIDTH / 2;
        const my = this.input.mouse.y - CANVAS_HEIGHT / 2;
        targetX += mx * 0.7; 
        targetY += my * 0.7;
    }

    targetY = Math.max(0, Math.min(targetY, WORLD_HEIGHT - CANVAS_HEIGHT));
    targetX = Math.max(0, Math.min(targetX, WORLD_WIDTH - CANVAS_WIDTH));

    this.state.camera.y += (targetY - this.state.camera.y) * 0.1;
    this.state.camera.x += (targetX - this.state.camera.x) * 0.1;
  }

  private handlePlayer(dt: number, time: number) {
    const p = this.state.player;
    if (p.hp <= 0) {
      this.state.isGameOver = true;
      return;
    }

    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    p.isAiming = currentWeaponType === WeaponType.SR && this.input.mouse.rightDown;
    const speed = p.isAiming ? p.speed * 0.3 : p.speed;

    let dx = 0;
    let dy = 0;
    if (this.input.keys['w'] || this.input.keys['W']) dy -= 1;
    if (this.input.keys['s'] || this.input.keys['S']) dy += 1;
    if (this.input.keys['a'] || this.input.keys['A']) dx -= 1;
    if (this.input.keys['d'] || this.input.keys['D']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      p.x += (dx / len) * speed;
      p.y += (dy / len) * speed;
    }

    p.x = Math.max(p.radius, Math.min(WORLD_WIDTH - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(WORLD_HEIGHT - p.radius, p.y));

    const worldMouseX = this.input.mouse.x + this.state.camera.x;
    const worldMouseY = this.input.mouse.y + this.state.camera.y;
    p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    if (this.input.keys['1']) p.currentWeaponIndex = 0;
    if (this.input.keys['2']) p.currentWeaponIndex = 1;
    if (this.input.keys['3']) p.currentWeaponIndex = 2;
    if (this.input.keys['4']) p.currentWeaponIndex = 3;

    if ((this.input.keys['r'] || this.input.keys['R'])) {
      this.reloadWeapon(time);
    }
  }

  private handleRegen(dt: number, time: number) {
    const p = this.state.player;
    const timeSinceHit = time - p.lastHitTime;
    if (timeSinceHit > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
      p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate);
    }
    if (timeSinceHit > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate);
    }
  }

  private reloadWeapon(time: number) {
    const p = this.state.player;
    const weaponType = p.loadout[p.currentWeaponIndex];
    const weapon = p.weapons[weaponType];
    const stats = WEAPONS[weaponType];

    if (!weapon.reloading && weapon.ammoInMag < stats.magSize && weapon.ammoReserve > 0) {
      weapon.reloading = true;
      weapon.reloadStartTime = time;
    }
  }

  private handleWeapons(dt: number, time: number) {
    const p = this.state.player;
    const weaponType = p.loadout[p.currentWeaponIndex];
    const weapon = p.weapons[weaponType];
    const stats = WEAPONS[weaponType];

    if (weapon.reloading) {
      if (time - weapon.reloadStartTime >= stats.reloadTime) {
        const needed = stats.magSize - weapon.ammoInMag;
        const toLoad = weapon.ammoReserve === Infinity ? needed : Math.min(needed, weapon.ammoReserve);
        
        weapon.ammoInMag += toLoad;
        if (weapon.ammoReserve !== Infinity) {
          weapon.ammoReserve -= toLoad;
        }
        weapon.reloading = false;
      }
      return;
    }

    if (this.input.mouse.down && !this.state.isShopOpen && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) {
      if (time - weapon.lastFireTime >= stats.fireRate) {
        if (weapon.ammoInMag > 0) {
          weapon.lastFireTime = time;
          weapon.ammoInMag--;
          this.state.stats.shotsFired++;
          this.audio.playWeaponFire(weaponType);

          const count = stats.pellets || 1;
          for (let i = 0; i < count; i++) {
             let currentSpread = stats.spread;
             if (p.isAiming) currentSpread = 0;
             let speedVariance = 0;
             if (weaponType === WeaponType.FLAMETHROWER) {
                 speedVariance = (Math.random() - 0.5) * 4;
             }

             const spreadAngle = (Math.random() - 0.5) * currentSpread;
             const finalAngle = p.angle + spreadAngle;
             
             let color = '#FDE047'; 
             if (weaponType === WeaponType.FLAMETHROWER) color = '#F97316';
             if (weaponType === WeaponType.PULSE_RIFLE) color = '#06B6D4';
             if (weaponType === WeaponType.GRENADE_LAUNCHER) color = '#4B5563';

             this.state.projectiles.push({
               id: Math.random().toString(),
               x: p.x + Math.cos(p.angle) * 20,
               y: p.y + Math.sin(p.angle) * 20,
               radius: weaponType === WeaponType.GRENADE_LAUNCHER ? 6 : (weaponType === WeaponType.PULSE_RIFLE ? 4 : 3),
               angle: finalAngle,
               color,
               vx: Math.cos(finalAngle) * (stats.projectileSpeed + speedVariance),
               vy: Math.sin(finalAngle) * (stats.projectileSpeed + speedVariance),
               damage: stats.damage,
               rangeRemaining: stats.range,
               maxRange: stats.range,
               fromPlayer: true,
               isExplosive: stats.isExplosive,
               isPiercing: stats.isPiercing,
               weaponType: weaponType,
               hitIds: []
             });

             if (weaponType === WeaponType.FLAMETHROWER) {
                 this.spawnParticle(p.x + Math.cos(p.angle)*30, p.y + Math.sin(p.angle)*30, 'orange', 3, 2);
             }
          }
        } else {
           this.reloadWeapon(time);
        }
      }
    }
  }

  private handleEnemies(dt: number, time: number) {
    const base = this.state.base;
    const p = this.state.player;

    this.state.enemies.forEach(enemy => {
      let target: { x: number, y: number } = base;
      const distToPlayer = this.distance(enemy, p);
      
      if (enemy.isBoss) {
          target = base;
      } else {
          if (distToPlayer < 500) target = p;
      }

      let tx = target.x - enemy.x;
      let ty = target.y - enemy.y;
      let dist = Math.sqrt(tx*tx + ty*ty);
      
      if (dist > 0) {
        tx /= dist;
        ty /= dist;
        enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      }

      if (enemy.type === EnemyType.VIPER || enemy.bossType === BossType.BLUE_BURST || enemy.bossType === BossType.PURPLE_ACID) {
          let range = 400;
          if (enemy.type === EnemyType.VIPER) range = ENEMY_STATS.VIPER.range || 400;
          if (enemy.bossType === BossType.BLUE_BURST) range = 600;
          if (enemy.bossType === BossType.PURPLE_ACID) range = 500;

          if (dist < range - 50) {
             tx = -tx;
             ty = -ty;
          } else if (dist < range + 50) {
             tx = 0;
             ty = 0; 
          }
      }
      
      enemy.x += tx * enemy.speed;
      enemy.y += ty * enemy.speed;

      if (enemy.isBoss) {
          // Boss Logic (Spawn, Burst, Acid)
          // ... (Existing Logic, omitted for brevity as it's unchanged largely)
          if (enemy.bossType === BossType.RED_SUMMONER) {
              enemy.bossSummonTimer = (enemy.bossSummonTimer || 0) + dt;
              if (enemy.bossSummonTimer > BOSS_STATS.RED_SUMMONER.summonRate) {
                  enemy.bossSummonTimer = 0;
                  this.spawnEnemy(EnemyType.GRUNT, enemy.x, enemy.y);
                  this.spawnParticle(enemy.x, enemy.y, '#F87171', 2, 10);
              }
          }
          if (enemy.bossType === BossType.BLUE_BURST) {
              const stats = BOSS_STATS.BLUE_BURST;
              if (time - enemy.lastAttackTime > stats.fireRate) {
                  enemy.lastAttackTime = time;
                  enemy.bossBurstCount = 3;
                  enemy.bossNextShotTime = time;
              }
              if ((enemy.bossBurstCount || 0) > 0 && time >= (enemy.bossNextShotTime || 0)) {
                  enemy.bossBurstCount!--;
                  enemy.bossNextShotTime = time + stats.burstDelay;
                  this.audio.playViperShoot(); 
                  const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                  this.state.projectiles.push({
                      id: Math.random().toString(),
                      x: enemy.x,
                      y: enemy.y,
                      radius: 5,
                      angle: angle,
                      color: '#60A5FA',
                      vx: Math.cos(angle) * 12,
                      vy: Math.sin(angle) * 12,
                      damage: stats.damage,
                      rangeRemaining: 700,
                      fromPlayer: false,
                  });
              }
          }
          if (enemy.bossType === BossType.PURPLE_ACID) {
              const stats = BOSS_STATS.PURPLE_ACID;
              if (time - enemy.lastAttackTime > stats.fireRate) {
                  enemy.lastAttackTime = time;
                  this.audio.playGrenadeThrow();
                  const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                  this.state.projectiles.push({
                      id: Math.random().toString(),
                      x: enemy.x,
                      y: enemy.y,
                      radius: 8,
                      angle: angle,
                      color: '#A855F7',
                      vx: Math.cos(angle) * 14,
                      vy: Math.sin(angle) * 14,
                      damage: stats.projectileDamage, 
                      rangeRemaining: 600, 
                      maxRange: 600,
                      fromPlayer: false,
                      createsToxicZone: true,
                  });
              }
          }
      }
      else if (enemy.type === EnemyType.VIPER) {
          const stats = ENEMY_STATS[EnemyType.VIPER];
          if (time - enemy.lastAttackTime > (stats.attackRate || 2000)) {
             enemy.lastAttackTime = time;
             this.audio.playViperShoot();
             const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
             this.state.projectiles.push({
               id: Math.random().toString(),
               x: enemy.x,
               y: enemy.y,
               radius: 4,
               angle: angle,
               color: '#10B981',
               vx: Math.cos(angle) * 10,
               vy: Math.sin(angle) * 10,
               damage: stats.damage,
               rangeRemaining: (stats.range || 400) + 100,
               fromPlayer: false,
             });
          }
      }

      this.state.enemies.forEach(other => {
        if (enemy === other) return;
        const d = this.distance(enemy, other);
        const minDist = enemy.radius + other.radius;
        if (d < minDist) {
           const pushX = enemy.x - other.x;
           const pushY = enemy.y - other.y;
           const len = Math.sqrt(pushX*pushX + pushY*pushY);
           if (len > 0) {
               enemy.x += (pushX/len) * 0.5;
               enemy.y += (pushY/len) * 0.5;
           }
        }
      });

      if (this.distance(enemy, p) < enemy.radius + p.radius) {
        if (enemy.type === EnemyType.KAMIKAZE) {
          this.damagePlayer(enemy.damage);
          this.spawnParticle(enemy.x, enemy.y, '#A855F7', 5, 20);
          this.spawnBloodStain(enemy);
          this.audio.playExplosion();
          enemy.hp = 0;
        } else if (time - enemy.lastAttackTime > 800) {
          this.damagePlayer(enemy.damage);
          this.audio.playMeleeHit();
          enemy.lastAttackTime = time;
        }
      }

      if (enemy.x > base.x - base.width/2 - enemy.radius &&
          enemy.x < base.x + base.width/2 + enemy.radius &&
          enemy.y > base.y - base.height/2 - enemy.radius &&
          enemy.y < base.y + base.height/2 + enemy.radius) {
            
        if (enemy.type === EnemyType.KAMIKAZE) {
            base.hp -= enemy.damage;
            this.addMessage(`-${enemy.damage}`, base.x, base.y, 'red');
            enemy.hp = 0;
            this.spawnParticle(enemy.x, enemy.y, 'orange', 5, 20);
            this.spawnBloodStain(enemy);
            this.audio.playExplosion();
            this.audio.playBaseDamage();
        } else if (time - enemy.lastAttackTime > 800) {
            base.hp -= enemy.damage;
            this.addMessage(`-${enemy.damage}`, base.x, base.y, 'red');
            this.audio.playMeleeHit();
            this.audio.playBaseDamage();
            enemy.lastAttackTime = time;
        }
      }

      if (base.hp <= 0) this.state.isGameOver = true;
    });

    this.state.enemies = this.state.enemies.filter(e => e.hp > 0);
  }

  private handleProjectiles(dt: number, time: number) {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const proj = this.state.projectiles[i];
      let hit = false;
      let destroyProjectile = false;
      
      if (proj.isHoming) {
          let target = this.state.enemies.find(e => e.id === proj.targetId);
          if (!target || target.hp <= 0) {
              let minDist = 2000;
              let newTarget: Enemy | null = null;
              this.state.enemies.forEach(e => {
                  const d = this.distance(proj, e);
                  if (d < minDist) {
                      minDist = d;
                      newTarget = e;
                  }
              });
              if (newTarget) {
                  proj.targetId = (newTarget as Enemy).id;
                  target = newTarget;
              }
          }

          if (target) {
              const targetAngle = Math.atan2(target.y - proj.y, target.x - proj.x);
              let diff = targetAngle - proj.angle;
              while (diff > Math.PI) diff -= Math.PI*2;
              while (diff < -Math.PI) diff += Math.PI*2;
              const turnSpeed = proj.turnSpeed || 0.1;
              if (Math.abs(diff) < turnSpeed) {
                  proj.angle = targetAngle;
              } else {
                  proj.angle += Math.sign(diff) * turnSpeed;
              }
              const speed = Math.sqrt(proj.vx*proj.vx + proj.vy*proj.vy);
              proj.vx = Math.cos(proj.angle) * speed;
              proj.vy = Math.sin(proj.angle) * speed;
          }
      }

      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.rangeRemaining -= Math.sqrt(proj.vx*proj.vx + proj.vy*proj.vy);

      if (proj.createsToxicZone) {
          if (proj.rangeRemaining <= 0) {
              destroyProjectile = true;
              this.state.toxicZones.push({
                  id: Math.random().toString(),
                  x: proj.x,
                  y: proj.y,
                  radius: TOXIC_ZONE_STATS.radius,
                  life: TOXIC_ZONE_STATS.duration,
                  damagePerSecond: TOXIC_ZONE_STATS.dps,
                  createdAt: time
              });
              this.spawnParticle(proj.x, proj.y, '#A855F7', 2, 20);
          }
      }
      else if (proj.rangeRemaining <= 0) {
          destroyProjectile = true;
      }

      if (proj.x < 0 || proj.x > WORLD_WIDTH || proj.y < 0 || proj.y > WORLD_HEIGHT) {
          destroyProjectile = true;
      }

      if (!destroyProjectile) {
          if (proj.fromPlayer) {
            for (const enemy of this.state.enemies) {
              if (this.distance(proj, enemy) < enemy.radius + proj.radius) {
                if (proj.isPiercing && proj.hitIds) {
                    if (proj.hitIds.includes(enemy.id)) {
                        continue;
                    }
                    proj.hitIds.push(enemy.id);
                } else {
                    destroyProjectile = true;
                }

                if (proj.isExplosive) {
                     this.audio.playExplosion();
                     this.spawnParticle(proj.x, proj.y, 'orange', 3, 20);
                     this.state.enemies.forEach(e => {
                         if (this.distance(proj, e) < 100) {
                             this.damageEnemy(e, proj.damage);
                         }
                     });
                     destroyProjectile = true;
                } else {
                     this.damageEnemy(enemy, proj.damage);
                }
                
                hit = true;
                this.state.stats.shotsHit++;
                this.state.stats.damageDealt += proj.damage;
                this.spawnParticle(proj.x, proj.y, enemy.color, 1, 3);
                
                if (!proj.isPiercing) break;
              }
            }
          } else {
            if (this.distance(proj, this.state.player) < this.state.player.radius + proj.radius) {
               this.damagePlayer(proj.damage);
               hit = true;
               destroyProjectile = true;
            }
            const b = this.state.base;
             if (proj.x > b.x - b.width/2 && proj.x < b.x + b.width/2 &&
                 proj.y > b.y - b.height/2 && proj.y < b.y + b.height/2) {
                b.hp -= proj.damage;
                hit = true;
                destroyProjectile = true;
                this.addMessage(`-${proj.damage}`, proj.x, proj.y, 'red');
                this.audio.playBaseDamage();
             }

             if (hit && proj.createsToxicZone) {
                  this.state.toxicZones.push({
                      id: Math.random().toString(),
                      x: proj.x,
                      y: proj.y,
                      radius: TOXIC_ZONE_STATS.radius,
                      life: TOXIC_ZONE_STATS.duration,
                      damagePerSecond: TOXIC_ZONE_STATS.dps,
                      createdAt: time
                  });
             }
          }
      }

      if (destroyProjectile) {
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  private handleToxicZones(dt: number) {
      for (let i = this.state.toxicZones.length - 1; i >= 0; i--) {
          const zone = this.state.toxicZones[i];
          zone.life -= dt;
          
          if (zone.life <= 0) {
              this.state.toxicZones.splice(i, 1);
              continue;
          }

          const damageTick = (zone.damagePerSecond * dt) / 1000;
          if (this.distance(this.state.player, zone) < zone.radius) {
              this.damagePlayer(damageTick);
          }
          this.state.allies.forEach(ally => {
              if (this.distance(ally, zone) < zone.radius) {
                  ally.hp -= damageTick;
              }
          });
      }
  }

  private damageEnemy(enemy: Enemy, amount: number) {
      enemy.hp -= amount;
      if (enemy.hp <= 0) {
          this.state.player.score += enemy.scoreReward;
          if (enemy.isBoss) {
              this.state.stats.killsByType['BOSS']++;
              this.addMessage(`BOSS DEFEATED`, enemy.x, enemy.y, '#FCD34D');
          } else {
              this.state.stats.killsByType[enemy.type]++;
          }
          this.addMessage(`+${enemy.scoreReward}`, enemy.x, enemy.y, '#fbbf24');
          this.spawnParticle(enemy.x, enemy.y, enemy.color, 3, 10);
          this.spawnBloodStain(enemy);
          this.audio.playEnemyDeath(enemy.type === EnemyType.TANK || enemy.isBoss); 
      }
  }

  private damagePlayer(amount: number) {
    const p = this.state.player;
    p.lastHitTime = this.lastTime;
    let armorDmg = 0;
    if (p.armor > 0) {
      armorDmg = Math.min(p.armor, amount * 0.8);
      p.armor -= armorDmg;
    }
    const healthDmg = amount - armorDmg;
    p.hp -= healthDmg;
    if (healthDmg + armorDmg > 1) {
        this.addMessage(`-${Math.floor(healthDmg + armorDmg)}`, p.x, p.y - 30, 'red');
    }
    this.spawnParticle(p.x, p.y, 'red', 2, 5);
  }

  private calculateWaveDuration(wave: number) {
      if (wave <= 10) return 30 + (wave - 1) * 2;
      return 48 + (wave - 10);
  }

  private handleWave(dt: number, time: number) {
    this.state.waveTimeRemaining -= dt;

    if (this.state.waveTimeRemaining <= 0) {
        
        // EXPLORATION MODE WIN CONDITION
        if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
            if (this.state.wave >= this.state.currentPlanet.totalWaves) {
                // Mission Complete
                this.state.missionComplete = true;
                return;
            }
        }

        this.state.wave++;
        this.state.enemiesSpawnedInWave = 0;
        let baseEnemyCount = 12 + Math.floor(5 * this.state.wave);
        
        this.state.activeSpecialEvent = SpecialEventType.NONE;
        if (this.state.wave % 5 === 0) {
            const roll = Math.random();
            if (roll < 0.3) {
                this.state.activeSpecialEvent = SpecialEventType.FRENZY;
                baseEnemyCount *= 3;
                this.addMessage("FRENZY EVENT!", this.state.player.x, this.state.player.y - 150, '#F87171');
            } else {
                this.state.activeSpecialEvent = SpecialEventType.BOSS;
                this.spawnBoss();
                this.addMessage("BOSS DETECTED!", this.state.player.x, this.state.player.y - 150, '#A855F7');
            }
        }

        this.state.totalEnemiesInWave = baseEnemyCount;
        const durationSeconds = this.calculateWaveDuration(this.state.wave);
        this.state.waveTimeRemaining = durationSeconds * 1000;
        this.addMessage(`Wave ${this.state.wave}`, this.state.player.x, this.state.player.y - 100, '#FCD34D');
        this.audio.playBaseDamage();
    }

    if (this.state.enemiesSpawnedInWave < this.state.totalEnemiesInWave) {
      this.state.spawnTimer += dt;
      const spawnRate = this.state.activeSpecialEvent === SpecialEventType.FRENZY ? 200 : 500;
      if (this.state.spawnTimer > spawnRate) { 
        this.spawnEnemy();
        this.state.spawnTimer = 0;
        this.state.enemiesSpawnedInWave++;
      }
    }
  }

  private spawnBoss() {
      const wave = this.state.wave;
      const rand = Math.random();
      let bossType: BossType;

      if (rand < 0.33) bossType = BossType.RED_SUMMONER;
      else if (rand < 0.66) bossType = BossType.BLUE_BURST;
      else bossType = BossType.PURPLE_ACID;

      if (!this.state.stats.encounteredEnemies.includes(bossType)) {
          this.state.stats.encounteredEnemies.push(bossType);
      }

      const stats = BOSS_STATS[bossType];
      
      // HP Multiplier: Base Wave Scaling * Gene Strength (if Exploration)
      let hpMultiplier = 1 + (0.01 * wave);
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
          hpMultiplier *= this.state.currentPlanet.geneStrength;
      }

      const maxHp = Math.floor(stats.hp * hpMultiplier);
      const x = WORLD_WIDTH / 2 + (Math.random() - 0.5) * 200;

      this.state.enemies.push({
          id: `boss-${Math.random()}`,
          type: EnemyType.TANK, 
          x,
          y: -50, 
          radius: stats.radius,
          color: stats.color,
          angle: Math.PI / 2,
          hp: maxHp,
          maxHp: maxHp,
          damage: stats.damage,
          speed: stats.speed,
          scoreReward: stats.score,
          lastAttackTime: 0,
          isBoss: true,
          bossType: bossType,
          bossSummonTimer: 0,
          bossBurstCount: 0,
          bossNextShotTime: 0
      });
  }

  private spawnEnemy(specificType?: EnemyType, xOverride?: number, yOverride?: number) {
    const wave = this.state.wave;
    let type = EnemyType.GRUNT;

    if (specificType) {
        type = specificType;
    } else {
        const rand = Math.random();
        if (wave >= 4 && rand < 0.1) type = EnemyType.TANK;
        else if (wave >= 4 && rand < 0.25) type = EnemyType.VIPER;
        else if (wave >= 3 && rand < 0.35) type = EnemyType.KAMIKAZE;
        else if (wave >= 2 && rand < 0.6) type = EnemyType.RUSHER;
    }

    if (!this.state.stats.encounteredEnemies.includes(type)) {
        this.state.stats.encounteredEnemies.push(type);
    }

    const stats = ENEMY_STATS[type];
    const x = xOverride !== undefined ? xOverride : Math.random() * (WORLD_WIDTH - 40) + 20;
    const y = yOverride !== undefined ? yOverride : 0;
    
    // Apply Gene Strength if in Exploration Mode
    let finalHp = stats.hp;
    if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
        finalHp *= this.state.currentPlanet.geneStrength;
    }

    this.state.enemies.push({
      id: Math.random().toString(),
      type,
      x,
      y, 
      radius: stats.radius,
      color: stats.color,
      angle: Math.PI / 2, 
      hp: finalHp,
      maxHp: finalHp,
      damage: stats.damage,
      speed: stats.speed,
      scoreReward: stats.score,
      lastAttackTime: 0
    });
  }

  private handleAllies(dt: number, time: number) {
    // Spawn Ally logic ... (unchanged)
    if (time - this.state.lastAllySpawnTime > 60000) {
      if (this.state.allies.length < ALLY_STATS.maxCount) {
        this.state.allies.push({
          id: 'ally-' + Math.random(),
          x: this.state.base.x,
          y: this.state.base.y,
          radius: 12,
          color: '#93C5FD',
          angle: -Math.PI/2,
          hp: ALLY_STATS.hp,
          maxHp: ALLY_STATS.hp,
          speed: ALLY_STATS.speed,
          currentOrder: 'PATROL', 
          state: 'PATROL',
          lastFireTime: 0,
          patrolPoint: { x: this.state.base.x + (Math.random()-0.5)*300, y: this.state.base.y - 100 - Math.random()*200 }
        });
        this.addMessage("Reinforcement Arrived!", this.state.base.x, this.state.base.y - 50, '#93C5FD');
      }
      this.state.lastAllySpawnTime = time;
    }

    this.state.allies = this.state.allies.filter(a => a.hp > 0);

    this.state.allies.forEach(ally => {
      let target: Enemy | null = null;
      let minDist = 1000;
      this.state.enemies.forEach(e => {
        const d = this.distance(ally, e);
        if (d < minDist) {
          minDist = d;
          target = e;
        }
      });

      if (target && minDist < 500) {
          ally.state = 'COMBAT';
      } else {
          ally.state = ally.currentOrder;
      }

      let moveX = 0;
      let moveY = 0;

      if (ally.state === 'COMBAT' && target) {
        const dx = target.x - ally.x;
        const dy = target.y - ally.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const nx = dx/dist;
        const ny = dy/dist;
        ally.angle = Math.atan2(target.y - ally.y, target.x - ally.x);

        if (dist < 150) {
          moveX = -nx;
          moveY = -ny;
        } else if (dist > 300) {
          moveX = nx;
          moveY = ny;
        }

        if (time - ally.lastFireTime > 500) {
          ally.lastFireTime = time;
          this.audio.playAllyFire(); 
          const angle = ally.angle + (Math.random()-0.5)*0.1;
          this.state.projectiles.push({
            id: Math.random().toString(),
            x: ally.x,
            y: ally.y,
            radius: 3,
            angle,
            color: '#60A5FA',
            vx: Math.cos(angle) * 15,
            vy: Math.sin(angle) * 15,
            damage: ALLY_STATS.damage,
            rangeRemaining: ALLY_STATS.range,
            fromPlayer: true
          });
        }
      } 
      else if (ally.state === 'PATROL') {
        const dx = ally.patrolPoint.x - ally.x;
        const dy = ally.patrolPoint.y - ally.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 1) {
            ally.angle = Math.atan2(dy, dx);
        }
        if (dist < 10) {
           ally.patrolPoint = { x: this.state.base.x + (Math.random()-0.5)*400, y: this.state.base.y - 100 - Math.random()*300 };
        } else {
           moveX = dx/dist;
           moveY = dy/dist;
        }
      }
      else if (ally.state === 'FOLLOW') {
          const p = this.state.player;
          const dx = p.x - ally.x;
          const dy = p.y - ally.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 1) ally.angle = Math.atan2(dy, dx);
          if (dist > 150) {
              moveX = dx/dist;
              moveY = dy/dist;
          }
      }
      else if (ally.state === 'ATTACK') {
          ally.angle = -Math.PI / 2;
          moveY = -1;
      }

      this.state.toxicZones.forEach(zone => {
          const d = this.distance(ally, zone);
          const safeDist = zone.radius + 50;
          if (d < safeDist) {
              const ax = ally.x - zone.x;
              const ay = ally.y - zone.y;
              const dist = Math.sqrt(ax*ax + ay*ay);
              if (dist > 0) {
                  moveX += (ax/dist) * 2; 
                  moveY += (ay/dist) * 2;
              }
          }
      });

      if (moveX !== 0 || moveY !== 0) {
          const len = Math.sqrt(moveX*moveX + moveY*moveY);
          if (len > 0.1) {
              ally.x += (moveX / len) * ally.speed;
              ally.y += (moveY / len) * ally.speed;
          }
      }
      
      ally.x = Math.max(0, Math.min(WORLD_WIDTH, ally.x));
      ally.y = Math.max(0, Math.min(WORLD_HEIGHT, ally.y));
    });
  }

  private handleTurrets(dt: number, time: number) {
      // ... (unchanged)
    this.state.turretSpots.forEach(spot => {
      if (spot.builtTurret) {
        const t = spot.builtTurret;
        if (t.hp <= 0) {
          spot.builtTurret = undefined; 
          return;
        }

        let target: Enemy | null = null;
        const stats = TURRET_STATS[t.type];
        const fireRate = stats.fireRate;

        if (t.type === TurretType.MISSILE) {
            let minDist = 99999;
            this.state.enemies.forEach(e => {
                const d = this.distance(this.state.base, e);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            });
        } 
        else {
            let minDist = t.range;
            this.state.enemies.forEach(e => {
                const d = this.distance(spot, e);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            });
        }

        if (target) {
            t.angle = Math.atan2(target.y - spot.y, target.x - spot.x);

            if (time - t.lastFireTime > fireRate) {
                t.lastFireTime = time;
                this.audio.playTurretFire(t.level); 

                if (t.type === TurretType.MISSILE) {
                    const startX = spot.x;
                    const startY = spot.y - 10;
                    const angle = -Math.PI/2; 
                    this.state.projectiles.push({
                        id: Math.random().toString(),
                        x: startX,
                        y: startY,
                        radius: 6,
                        angle: angle,
                        color: '#FCA5A5', 
                        vx: Math.cos(angle) * 8, 
                        vy: Math.sin(angle) * 8,
                        damage: t.damage,
                        rangeRemaining: 9999, 
                        fromPlayer: true,
                        isExplosive: true, 
                        isHoming: true,
                        targetId: target.id,
                        turnSpeed: 0.15 
                    });

                } else {
                    const barrelLen = 20;
                    const bx = spot.x + Math.cos(t.angle) * barrelLen;
                    const by = spot.y + Math.sin(t.angle) * barrelLen;

                    let speed = 25;
                    let color = '#14B8A6'; 
                    let radius = 4;
                    if (t.type === TurretType.SNIPER) {
                        speed = 40;
                        color = '#FCD34D'; 
                        radius = 3;
                    }

                    this.state.projectiles.push({
                        id: Math.random().toString(),
                        x: bx,
                        y: by,
                        radius: radius,
                        angle: t.angle + (Math.random()-0.5)*0.05,
                        color: color,
                        vx: Math.cos(t.angle) * speed,
                        vy: Math.sin(t.angle) * speed,
                        damage: t.damage,
                        rangeRemaining: t.range,
                        fromPlayer: true
                    });
                }
            }
        }
      }
    });
  }

  private handleParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private handleBloodStains(dt: number) {
      for (let i = this.state.bloodStains.length - 1; i >= 0; i--) {
          const bs = this.state.bloodStains[i];
          bs.life -= dt;
          if (bs.life <= 0) {
              this.state.bloodStains.splice(i, 1);
          }
      }
  }

  private handleMessages(dt: number) {
      this.state.messages = this.state.messages.filter(m => {
          m.time -= dt;
          m.y -= 0.5; 
          return m.time > 0;
      });
  }

  public throwGrenade() {
    const p = this.state.player;
    if (p.grenades > 0) {
      p.grenades--;
      this.state.stats.shotsFired++;
      this.audio.playGrenadeThrow();
      
      const worldMouseX = this.input.mouse.x + this.state.camera.x;
      const worldMouseY = this.input.mouse.y + this.state.camera.y;
      
      const r = PLAYER_STATS.grenadeRadius;
      const explosionCenter = { x: worldMouseX, y: worldMouseY };
      
      this.spawnParticle(worldMouseX, worldMouseY, 'orange', 5, 50);

      setTimeout(() => {
          this.audio.playExplosion(); 
      }, 200);

      this.state.enemies.forEach(e => {
        if (this.distance(e, explosionCenter) < r) {
          e.hp -= PLAYER_STATS.grenadeDamage;
          this.state.stats.damageDealt += PLAYER_STATS.grenadeDamage;
          this.addMessage(`-${PLAYER_STATS.grenadeDamage}`, e.x, e.y, 'orange');
          if (e.hp <= 0) {
             p.score += e.scoreReward;
             this.state.stats.killsByType[e.type]++;
             this.spawnBloodStain(e);
             this.audio.playEnemyDeath(e.type === EnemyType.TANK); 
          }
        }
      });

      if (this.distance(p, explosionCenter) < r) {
        this.damagePlayer(PLAYER_STATS.grenadeDamage * 0.2);
      }
    }
  }

  public interact() {
    const p = this.state.player;
    let closestSpotIdx = -1;
    let minDist = 100;

    this.state.turretSpots.forEach((spot, idx) => {
      const d = this.distance(p, spot);
      if (d < minDist) {
        minDist = d;
        closestSpotIdx = idx;
      }
    });

    if (closestSpotIdx !== -1) {
      const closestSpot = this.state.turretSpots[closestSpotIdx];
      
      if (!closestSpot.builtTurret) {
        const currentTurretCount = this.state.turretSpots.filter(s => s.builtTurret).length;
        const buildCost = TURRET_COSTS.baseCost + (currentTurretCount * TURRET_COSTS.costIncrement);

        if (p.score >= buildCost) {
          p.score -= buildCost;
          closestSpot.builtTurret = {
            id: 't-' + Math.random(),
            x: closestSpot.x,
            y: closestSpot.y,
            radius: 15,
            angle: -Math.PI/2,
            color: '#059669',
            level: 1,
            type: TurretType.STANDARD,
            hp: TURRET_STATS[TurretType.STANDARD].hp,
            maxHp: TURRET_STATS[TurretType.STANDARD].hp,
            damage: TURRET_STATS[TurretType.STANDARD].damage,
            range: TURRET_STATS[TurretType.STANDARD].range,
            lastFireTime: 0
          };
          this.addMessage("Turret Built", closestSpot.x, closestSpot.y - 20, '#059669');
        } else {
            this.addMessage("Need Scraps!", p.x, p.y - 50, 'red');
        }
      } else if (closestSpot.builtTurret.level === 1) {
        this.state.activeTurretId = closestSpotIdx;
        this.state.isPaused = true; 
      }
    }
  }
}
