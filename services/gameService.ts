
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
  DefenseUpgradeType,
  ModuleType,
  WeaponModule,
  AtmosphereGas,
  SpaceshipModuleType,
  PlanetVisualType,
  OrbitalUpgradeNode,
  OrbitalUpgradeEffect,
  SpaceshipState,
  MissionType
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  INVENTORY_SIZE,
  MAX_SAVE_SLOTS,
  MAX_PINNED_SLOTS,
} from '../constants';
import {
  PLAYER_STATS,
  WEAPONS,
  INITIAL_AMMO,
  ENEMY_STATS,
  BASE_STATS,
  TURRET_COSTS,
  TURRET_STATS,
  ALLY_STATS,
  SHOP_PRICES,
  BOSS_STATS,
  TOXIC_ZONE_STATS,
  DEFENSE_UPGRADE_INFO,
  MODULE_STATS,
  SPACESHIP_MODULES
} from '../data/registry';
import { AudioService } from './audioService';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { calculateEnemyStats, selectEnemyType } from '../utils/enemyUtils';
import { GAS_INFO } from '../data/world';

const TURRET_POSITIONS = [
  { x: -150, y: -150 },
  { x: 150, y: -150 },
  { x: -250, y: -100 },
  { x: 250, y: -100 },
  { x: 0, y: -250 },
  { x: -350, y: -300 },
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
    this.reset(true); // Initial full reset
    
    // Override defaults for Startup
    this.state.appMode = AppMode.START_MENU;
    
    // Load saves
    this.state.saveSlots = this.loadSavesFromStorage();
  }

  public handleInput(key: string, isDown: boolean) {
      this.input.keys[key] = isDown;

      if (isDown && this.state.appMode === AppMode.GAMEPLAY) {
          // Weapon Switching
          if (key === '1') this.switchWeapon(0);
          if (key === '2') this.switchWeapon(1);
          if (key === '3') this.switchWeapon(2);
          if (key === '4') this.switchWeapon(3);

          // Tactical Menu (Tab)
          if (key === 'Tab') {
              if (!this.state.isPaused && !this.state.isShopOpen && !this.state.isInventoryOpen) {
                  this.toggleTacticalMenu();
              }
          }

          // Tactical Commands Hotkeys (When menu is open)
          if (this.state.isTacticalMenuOpen) {
              if (key === 'F1') { this.issueOrder('PATROL'); this.toggleTacticalMenu(); }
              if (key === 'F2') { this.issueOrder('FOLLOW'); this.toggleTacticalMenu(); }
              if (key === 'F3') { this.issueOrder('ATTACK'); this.toggleTacticalMenu(); }
          }

          // Inventory / Backpack (C)
          if (key === 'c' || key === 'C') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isShopOpen) {
                  this.toggleInventory();
              }
          }

          // Shop (B)
          if (key === 'b' || key === 'B') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) {
                  const p = this.state.player;
                  const dist = Math.sqrt(Math.pow(p.x - this.state.base.x, 2) + Math.pow(p.y - this.state.base.y, 2));
                  
                  if (dist < 300 || this.state.isShopOpen) {
                      this.state.isShopOpen = !this.state.isShopOpen;
                  }
              }
          }

          // Interact (E)
          if (key === 'e' || key === 'E') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen) {
                  this.interact();
              }
          }

          // Skip Wave (L)
          if (key === 'l' || key === 'L') {
               if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) {
                   // Skip wave only allowed in DEFENSE mode
                   if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) {
                       return;
                   }
                   this.skipWave();
               }
          }
          
          // Toggle Pause (Stats Terminal)
          if (key === 'p' || key === 'P') {
              if (!this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && this.state.activeTurretId === undefined) {
                  this.togglePause();
              }
          }

          if (key === 'Escape') {
              this.state.isShopOpen = false;
              if (this.state.isTacticalMenuOpen) this.toggleTacticalMenu();
              if (this.state.isInventoryOpen) this.toggleInventory();
              if (this.state.activeTurretId !== undefined) this.closeTurretUpgrade(); 
              if (this.state.isPaused && this.state.activeTurretId === undefined) this.togglePause();
          }

          // Grenade
          if ((key === 'g' || key === 'G') && !this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) this.throwGrenade();
          
          // Reload
          if ((key === 'r' || key === 'R') && !this.state.isPaused) this.reloadWeapon(Date.now());
      }
  }

  public switchWeapon(index: number) {
      if (index >= 0 && index < 4) {
          this.state.player.currentWeaponIndex = index;
          // Cancel reload if switching
          const p = this.state.player;
          Object.values(p.weapons).forEach(w => w.reloading = false);
      }
  }

  public reset(fullReset: boolean = false) {
    const basePos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 };
    
    // Preserve persistent data across resets if not a full reset
    const existingPlanets = !fullReset && this.state?.planets ? this.state.planets : generatePlanets();
    const existingSaveSlots = !fullReset && this.state?.saveSlots ? this.state.saveSlots : [];
    const existingSpaceship = !fullReset && this.state?.spaceship ? this.state.spaceship : { 
        installedModules: [],
        orbitalUpgradeTree: [],
        orbitalDamageMultiplier: 1,
        orbitalRateMultiplier: 1
    };

    // Initialize Weapons
    const initialWeapons: Record<string, WeaponState> = {};
    Object.values(WeaponType).forEach(type => {
      initialWeapons[type] = {
        type,
        ammoInMag: WEAPONS[type].magSize,
        ammoReserve: INITIAL_AMMO[type],
        lastFireTime: 0,
        reloading: false,
        reloadStartTime: 0,
        modules: [],
        consecutiveShots: 0
      };
    });

    const initialTurretSpots = TURRET_POSITIONS.map((pos, idx) => ({
      id: idx,
      x: basePos.x + pos.x,
      y: basePos.y + pos.y,
    }));

    // Start with Barren terrain, deployToPlanet will overwrite if needed
    const terrain = generateTerrain(PlanetVisualType.BARREN, 'BARREN' as any);

    this.state = {
      appMode: AppMode.GAMEPLAY,
      gameMode: GameMode.SURVIVAL,
      
      planets: existingPlanets,
      currentPlanet: null,
      selectedPlanetId: null,
      savedPlayerState: null,
      spaceship: existingSpaceship,
      orbitalSupportTimer: 0,
      saveSlots: existingSaveSlots,

      camera: { x: 0, y: 0 },
      player: {
        id: 'player',
        x: basePos.x,
        y: basePos.y - 150,
        radius: 15,
        angle: -Math.PI / 2,
        color: '#3B82F6',
        hp: PLAYER_STATS.maxHp,
        maxHp: PLAYER_STATS.maxHp,
        armor: PLAYER_STATS.maxArmor,
        maxArmor: PLAYER_STATS.maxArmor,
        speed: PLAYER_STATS.speed,
        lastHitTime: 0,
        weapons: initialWeapons as Record<WeaponType, WeaponState>,
        loadout: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL],
        inventory: new Array(INVENTORY_SIZE).fill(null),
        upgrades: [],
        freeModules: [],
        grenadeModules: [],
        currentWeaponIndex: 0,
        grenades: PLAYER_STATS.maxGrenades,
        score: PLAYER_STATS.initialScore,
        isAiming: false
      },
      base: {
        x: basePos.x,
        y: basePos.y,
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
      turretSpots: initialTurretSpots,
      toxicZones: [],
      activeSpecialEvent: SpecialEventType.NONE,

      wave: 1,
      waveTimeRemaining: 30000, // Wave 1 is 30s
      waveDuration: 30000, 
      spawnTimer: 0,
      enemiesPendingSpawn: 17, // Wave 1: 12 + 5*1 = 17
      enemiesSpawnedInWave: 0,
      totalEnemiesInWave: 99999, // Unused with new queue logic
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
      stats: {
        shotsFired: 0,
        shotsHit: 0,
        damageDealt: 0,
        killsByType: {
            [EnemyType.GRUNT]: 0,
            [EnemyType.RUSHER]: 0,
            [EnemyType.TANK]: 0,
            [EnemyType.KAMIKAZE]: 0,
            [EnemyType.VIPER]: 0,
            'BOSS': 0
        },
        encounteredEnemies: []
      }
    };
  }

  public deployToPlanet(id: string) {
      // Capture the target planet from the existing state BEFORE reset
      const targetPlanet = this.state.planets.find(p => p.id === id);
      
      if (!targetPlanet) {
          console.error("Planet not found for deployment:", id);
          return;
      }

      // Calculate Drop Cost
      const currentScraps = this.state.player.score;
      let dropCostPercent = targetPlanet.landingDifficulty / 100;

      // Module: Atmospheric Drag Adaptive Deflector (50% reduction)
      if (this.state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
          dropCostPercent *= 0.5;
      }

      const dropCost = Math.floor(currentScraps * dropCostPercent);

      this.reset(false); // Do not wipe planets
      
      // Apply Cost
      this.state.player.score -= dropCost;
      this.state.player.score = Math.max(0, this.state.player.score);

      this.state.gameMode = GameMode.EXPLORATION;
      this.state.selectedPlanetId = id;
      this.state.currentPlanet = targetPlanet;
      this.state.appMode = AppMode.GAMEPLAY;
      
      if (targetPlanet.missionType === MissionType.OFFENSE) {
          this.state.enemiesPendingSpawn = 0; // Handled by Hive Mother mechanics
          this.state.wave = 0; // Use wave as shed counter for Hive Mother
          this.spawnHiveMother(targetPlanet);
      } else {
          // Defense Mode
          this.state.enemiesPendingSpawn = 12 + 5 * 1; 
      }

      // Add a message about the drop cost
      setTimeout(() => {
        this.addMessage(`ORBITAL DROP COST: -${dropCost} SCRAPS`, this.state.player.x, this.state.player.y - 100, '#F87171');
        if (this.state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
             setTimeout(() => {
                 this.addMessage(`ADAPTIVE DEFLECTOR ACTIVE`, this.state.player.x, this.state.player.y - 120, '#06b6d4');
             }, 1000);
        }
        
        if (targetPlanet.missionType === MissionType.OFFENSE) {
             setTimeout(() => {
                 this.addMessage(`MISSION: ASSAULT HIVE MOTHER`, this.state.player.x, this.state.player.y - 140, '#fca5a5');
             }, 2000);
        }
      }, 1000);
      
      // Generate Terrain
      this.state.terrain = generateTerrain(targetPlanet.visualType, targetPlanet.biome);
  }
  
  public update(time: number) {
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }
    
    // Delta Time in Milliseconds
    let dt = time - this.lastTime;
    this.lastTime = time;

    // Prevent spiral of death / teleportation on lag spikes
    if (dt > 100) dt = 100;

    // Calculate Time Scale relative to 60 FPS (approx 16.67ms per frame)
    const TARGET_MS_PER_FRAME = 1000 / 60; 
    const timeScale = dt / TARGET_MS_PER_FRAME;

    if (this.state.isPaused || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) return;

    // --- Wave Management ---
    if (!this.state.missionComplete) {
        if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) {
            // Offense Mode Logic (No waves)
            // Hive Mother logic handled in updateEnemies
        } else {
            // Standard Defense Logic
            this.state.waveTimeRemaining -= dt;
            
            // Spawn Logic (Fixed Queue)
            this.state.spawnTimer += dt;
            const SPAWN_INTERVAL = 500; // Fixed 0.5s spawn rate for items in queue

            if (this.state.spawnTimer > SPAWN_INTERVAL) {
                if (this.state.enemiesPendingSpawn > 0) {
                    this.spawnEnemy();
                    this.state.enemiesPendingSpawn--;
                }
                this.state.spawnTimer = 0;
            }

            // Timer ended -> Next Wave
            if (this.state.waveTimeRemaining <= 0) {
                this.nextWave();
            }
        }
    }

    // --- Spaceship Systems ---
    this.updateSpaceshipSystems(dt);

    // --- Player Logic ---
    this.updatePlayer(dt, time, timeScale);

    // --- Entity Updates ---
    this.updateProjectiles(dt, timeScale);
    this.updateEnemies(dt, timeScale);
    this.updateAllies(dt, time, timeScale);
    this.updateTurrets(time);
    this.updateParticles(dt, timeScale);
    this.updateToxicZones(dt);

    // --- Camera ---
    const targetCamX = this.state.player.x - CANVAS_WIDTH / 2;
    const targetCamY = this.state.player.y - CANVAS_HEIGHT / 2;
    this.state.camera.x = Math.max(0, Math.min(targetCamX, WORLD_WIDTH - CANVAS_WIDTH));
    this.state.camera.y = Math.max(0, Math.min(targetCamY, WORLD_HEIGHT - CANVAS_HEIGHT));
  }
  
  private updateSpaceshipSystems(dt: number) {
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.spaceship.installedModules.includes(SpaceshipModuleType.ORBITAL_CANNON)) {
          this.state.orbitalSupportTimer += dt;
          
          // Apply Upgraded Fire Rate: Base 8000ms divided by multiplier
          const baseRate = 8000;
          const rateMultiplier = this.state.spaceship.orbitalRateMultiplier || 1;
          const effectiveRate = baseRate / rateMultiplier;

          if (this.state.orbitalSupportTimer > effectiveRate) {
              // Find nearest enemy to base
              const b = this.state.base;
              let closest: Enemy | null = null;
              let minDist = Infinity;
              
              this.state.enemies.forEach(e => {
                  const dist = Math.sqrt((e.x - b.x)**2 + (e.y - b.y)**2);
                  if (dist < minDist) {
                      minDist = dist;
                      closest = e;
                  }
              });

              if (closest) {
                  // Fire Orbital Laser
                  // Apply Upgraded Damage: Base 400 * multiplier
                  const baseDamage = 400;
                  const damageMultiplier = this.state.spaceship.orbitalDamageMultiplier || 1;
                  const finalDamage = baseDamage * damageMultiplier;

                  this.damageEnemy(closest, finalDamage);
                  this.spawnParticle(closest.x, closest.y, '#06b6d4', 5, 2);
                  this.addMessage(`ORBITAL STRIKE: ${Math.floor(finalDamage)}`, closest.x, closest.y - 40, '#06b6d4');
                  this.audio.playTurretFire(2); // Heavy impact sound
              }
              
              this.state.orbitalSupportTimer = 0;
          }
      }
  }

  // Generate the 7-layer upgrade tree if it doesn't exist
  private generateOrbitalUpgradeTree() {
      if (this.state.spaceship.orbitalUpgradeTree && this.state.spaceship.orbitalUpgradeTree.length > 0) return;

      const tree: OrbitalUpgradeNode[][] = [];
      
      for (let layer = 1; layer <= 7; layer++) {
          const layerNodes: OrbitalUpgradeNode[] = [];
          for (let i = 0; i < layer; i++) {
              // Cost: 1000 * (1 + n) * (0.8 ~ 1.2)
              const baseCost = 1000 * (1 + layer);
              const variance = 0.8 + Math.random() * 0.4;
              const cost = Math.floor(baseCost * variance);

              // Effect: 20% Rate, 80% Damage
              const isRate = Math.random() < 0.2;
              const effectType = isRate ? OrbitalUpgradeEffect.RATE : OrbitalUpgradeEffect.DAMAGE;
              
              // Value: Rate (0.05 - 0.12), Damage (0.08 - 0.14)
              let effectValue = 0;
              if (isRate) {
                  effectValue = 0.05 + Math.random() * 0.07;
              } else {
                  effectValue = 0.08 + Math.random() * 0.06;
              }

              layerNodes.push({
                  id: `orb-upg-${layer}-${i}`,
                  layer,
                  index: i,
                  cost,
                  effectType,
                  effectValue,
                  purchased: false
              });
          }
          tree.push(layerNodes);
      }
      
      this.state.spaceship.orbitalUpgradeTree = tree;
      this.state.spaceship.orbitalDamageMultiplier = 1;
      this.state.spaceship.orbitalRateMultiplier = 1;
  }

  public purchaseOrbitalUpgrade(nodeId: string) {
      const p = this.state.player;
      const s = this.state.spaceship;
      
      // Find node
      let node: OrbitalUpgradeNode | null = null;
      let layerIndex = -1;
      
      for(let i=0; i<s.orbitalUpgradeTree.length; i++) {
          const found = s.orbitalUpgradeTree[i].find(n => n.id === nodeId);
          if (found) {
              node = found;
              layerIndex = i; // 0-based index (Layer 1 is index 0)
              break;
          }
      }

      if (!node || node.purchased) return;

      // Check Funds
      if (p.score < node.cost) {
          return; // UI should handle feedback via disabled button usually
      }

      // Check Unlock Requirement
      if (layerIndex > 0) {
          const prevLayer = s.orbitalUpgradeTree[layerIndex - 1];
          const purchasedCount = prevLayer.filter(n => n.purchased).length;
          const prevLayerNum = layerIndex; // Previous layer number is actually the index + 1 - 1 = index
          const required = Math.ceil(prevLayerNum / 2);
          
          if (purchasedCount < required) {
              // Locked
              return;
          }
      }

      // Execute Purchase
      p.score -= node.cost;
      node.purchased = true;
      
      // Apply Effect
      if (node.effectType === OrbitalUpgradeEffect.DAMAGE) {
          s.orbitalDamageMultiplier += node.effectValue;
      } else {
          s.orbitalRateMultiplier += node.effectValue;
      }
      
      this.audio.playTurretFire(2); // Success sound
  }

  public nextWave() {
      // Exploration Mode Victory Check (Defense)
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet && this.state.currentPlanet.missionType === MissionType.DEFENSE) {
          if (this.state.wave >= this.state.currentPlanet.totalWaves) {
              this.completeMission();
              return;
          }
      }

      this.state.wave++;
      this.state.activeSpecialEvent = SpecialEventType.NONE; // Reset event

      // Time Calculation
      let duration = 30;
      if (this.state.wave <= 10) {
          duration = 30 + (this.state.wave - 1) * 2;
      } else {
          duration = 30 + (9 * 2) + (this.state.wave - 10) * 1;
      }
      this.state.waveDuration = duration * 1000;
      this.state.waveTimeRemaining = duration * 1000;
      this.state.spawnTimer = 0;

      // New Event Logic: Every 5 waves
      let isFrenzy = false;
      if (this.state.wave % 5 === 0) {
          const roll = Math.random();
          if (roll < 0.3) {
              // 30% Chance: Frenzy
              this.state.activeSpecialEvent = SpecialEventType.FRENZY;
              isFrenzy = true;
              this.addMessage("WARNING: FRENZY DETECTED", WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red');
          } else {
              // 70% Chance: Boss Incubation
              // Bosses only spawn in Defense mode or Survival
              if (this.state.gameMode === GameMode.SURVIVAL || (this.state.currentPlanet?.missionType === MissionType.DEFENSE)) {
                this.state.activeSpecialEvent = SpecialEventType.BOSS;
                this.spawnBoss(); 
                this.addMessage("WARNING: APEX LIFEFORM", WORLD_WIDTH/2, WORLD_HEIGHT/2, 'purple');
              }
          }
      } else {
          this.addMessage(`WAVE ${this.state.wave} STARTED`, WORLD_WIDTH/2, WORLD_HEIGHT/2, 'yellow');
      }

      // Add enemies to queue
      // Formula: 12 + 5 * Wave.
      // If Frenzy: 3x count.
      let newEnemies = 12 + 5 * this.state.wave;
      if (isFrenzy) {
          newEnemies *= 3;
      }
      
      this.state.enemiesPendingSpawn += newEnemies;
  }

  public skipWave() {
      // Logic: If at least 10 seconds have passed in current wave
      // Elapsed Time = Duration - Remaining
      const elapsed = this.state.waveDuration - this.state.waveTimeRemaining;
      
      if (elapsed >= 10000) {
          // Calculate Reward: (Remaining Seconds) * Current Wave
          const remainingSeconds = Math.max(0, Math.floor(this.state.waveTimeRemaining / 1000));
          const reward = remainingSeconds * this.state.wave;
          
          this.state.player.score += reward;
          this.addMessage(`LURE DEPLOYED: +${reward} SCRAPS`, this.state.player.x, this.state.player.y - 80, '#22d3ee');
          this.audio.playBaseDamage(); // Reuse sound or add new sound
          
          // Trigger next wave immediately
          this.nextWave();
      } else {
          // Feedback that it's too early?
          this.addMessage("LURE RECHARGE PENDING...", this.state.player.x, this.state.player.y - 80, 'red');
      }
  }

  private spawnEnemy() {
      // Determine Type
      const type = selectEnemyType(this.state.wave, this.state.gameMode, this.state.currentPlanet, this.state.activeSpecialEvent);
      
      // Determine Position (Edge of world)
      let x = 0, y = 0;
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { x = Math.random() * WORLD_WIDTH; y = 0; }
      else if (side === 1) { x = WORLD_WIDTH; y = Math.random() * WORLD_HEIGHT; }
      else if (side === 2) { x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT; }
      else { x = 0; y = Math.random() * WORLD_HEIGHT; }

      this.spawnSpecificEnemy(type, x, y);
  }

  private spawnSpecificEnemy(type: EnemyType, x: number, y: number) {
      const baseStats = ENEMY_STATS[type];
      const stats = calculateEnemyStats(type, baseStats, this.state.currentPlanet, this.state.gameMode);

      this.state.enemies.push({
          id: `e-${Date.now()}-${Math.random()}`,
          type,
          x,
          y,
          angle: 0,
          hp: stats.maxHp,
          maxHp: stats.maxHp,
          damage: stats.damage,
          speed: baseStats.speed,
          scoreReward: baseStats.scoreReward,
          radius: baseStats.radius,
          color: baseStats.color,
          lastAttackTime: 0,
          detectionRange: baseStats.detectionRange
      });

      if (!this.state.stats.encounteredEnemies.includes(type)) {
          this.state.stats.encounteredEnemies.push(type);
      }
  }

  private spawnBoss() {
      // Determine Boss Type
      const roll = Math.random();
      let bossType = BossType.RED_SUMMONER;
      if (roll > 0.6) bossType = BossType.BLUE_BURST;
      if (roll > 0.85) bossType = BossType.PURPLE_ACID;

      // Position (Top Center usually)
      const x = WORLD_WIDTH / 2;
      const y = 100;

      const stats = BOSS_STATS[bossType];
      
      // Boss Scaling for Exploration
      let hp = stats.hp;
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
          hp *= this.state.currentPlanet.geneStrength;
      }

      this.state.enemies.push({
          id: `boss-${Date.now()}`,
          type: EnemyType.TANK, // Placeholder type for rendering logic fallback
          isBoss: true,
          bossType: bossType,
          x, y, angle: Math.PI/2,
          hp: hp,
          maxHp: hp,
          speed: stats.speed,
          damage: stats.damage,
          scoreReward: stats.scoreReward,
          radius: stats.radius,
          color: stats.color,
          lastAttackTime: 0,
          detectionRange: stats.detectionRange,
          bossSummonTimer: 0,
          bossBurstCount: 0,
          bossNextShotTime: 0
      });

      if (!this.state.stats.encounteredEnemies.includes(bossType)) {
          this.state.stats.encounteredEnemies.push(bossType);
      }
  }

  private spawnHiveMother(planet: Planet) {
      const stats = BOSS_STATS[BossType.HIVE_MOTHER];
      
      // HP: 8000 * GeneStrength * (1 + 0.1 * SulfurIndex)
      let hp = 8000 * planet.geneStrength * (1 + 0.1 * planet.sulfurIndex);

      this.state.enemies.push({
          id: `hive-mother-${Date.now()}`,
          type: EnemyType.TANK, // Placeholder
          isBoss: true,
          bossType: BossType.HIVE_MOTHER,
          x: WORLD_WIDTH / 2,
          y: 400, // Shifted down as requested
          angle: Math.PI/2,
          hp: hp,
          maxHp: hp,
          speed: 0,
          damage: stats.damage,
          scoreReward: stats.scoreReward,
          radius: stats.radius,
          color: stats.color,
          lastAttackTime: 0,
          detectionRange: 2000,
          
          // Mechanics
          armorValue: 90, // Starts at 90%
          shedTimer: 0,
          shedCount: 0
      });

       if (!this.state.stats.encounteredEnemies.includes(BossType.HIVE_MOTHER)) {
          this.state.stats.encounteredEnemies.push(BossType.HIVE_MOTHER);
      }
  }

  private spawnHiveMinions(mother: Enemy) {
      const shedCount = mother.shedCount || 0;
      // Use shedCount as equivalent to wave number for difficulty scaling
      const simulatedWave = Math.max(1, shedCount);
      
      // Count: 12 * (GeneStrength + ShedCount)
      const geneStrength = this.state.currentPlanet?.geneStrength || 1;
      const count = Math.ceil(12 * (geneStrength + shedCount));

      for (let i = 0; i < count; i++) {
          // Spawn around mother
          const angle = Math.random() * Math.PI * 2;
          const dist = 100 + Math.random() * 100;
          const x = mother.x + Math.cos(angle) * dist;
          const y = mother.y + Math.sin(angle) * dist;

          // NEW LOGIC: Use selectEnemyType
          // This ensures that minion types (Vipers, Kamikazes, etc.) appear based on planet stats
          const type = selectEnemyType(
              simulatedWave,
              this.state.gameMode,
              this.state.currentPlanet,
              SpecialEventType.NONE // No special event override for minions
          );
          
          this.spawnSpecificEnemy(type, x, y);
      }
  }

  private updateEnemies(dt: number, timeScale: number) {
      // Hive Mother Logic
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) {
          const mother = this.state.enemies.find(e => e.bossType === BossType.HIVE_MOTHER);
          if (mother) {
              mother.shedTimer = (mother.shedTimer || 0) + dt;
              if (mother.shedTimer > 30000) {
                  mother.shedTimer = 0;
                  
                  // Shed Armor
                  mother.armorValue = Math.max(0, (mother.armorValue || 90) - 3);
                  mother.shedCount = (mother.shedCount || 0) + 1;
                  
                  // Heal based on Oxygen: 0.4 * OxygenPercent * MaxHP 
                  // (Interpreted "0.4 oxygen content" as scaling factor)
                  const o2 = this.state.currentPlanet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id)?.percentage || 0;
                  const healAmount = mother.maxHp * (0.4 * o2);
                  mother.hp = Math.min(mother.maxHp, mother.hp + healAmount);
                  
                  this.addMessage("HIVE MOTHER SHEDDING CARAPACE", mother.x, mother.y - 100, '#fca5a5');
                  this.spawnHiveMinions(mother);
              }
          }
      }

      this.state.enemies.forEach(e => {
          // Movement Logic
          let target = { x: this.state.base.x, y: this.state.base.y };
          
          // Aggro Logic: Check if player or ally is closer
          const distToBase = Math.sqrt((e.x - this.state.base.x)**2 + (e.y - this.state.base.y)**2);
          
          let closestUnit: Entity | null = null;
          let minDist = e.detectionRange || 400;

          // Check Player
          const distPlayer = Math.sqrt((e.x - this.state.player.x)**2 + (e.y - this.state.player.y)**2);
          if (distPlayer < minDist) {
              minDist = distPlayer;
              closestUnit = this.state.player;
          }

          // Check Allies
          this.state.allies.forEach(ally => {
               const d = Math.sqrt((e.x - ally.x)**2 + (e.y - ally.y)**2);
               if (d < minDist) {
                   minDist = d;
                   closestUnit = ally;
               }
          });

          if (closestUnit) {
              target = { x: closestUnit.x, y: closestUnit.y };
          } else if (distToBase > 2000) {
              // If very far from base and no target, maybe idle? For now, move to base.
          }

          if (e.isBoss && e.bossType === BossType.HIVE_MOTHER) {
               // Stationary
               return;
          }
          
          const angle = Math.atan2(target.y - e.y, target.x - e.x);
          e.angle = angle;
          
          const distToTarget = Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2);
          
          // Stop if within attack range
          let stopDist = e.radius + 10;
          if (e.type === EnemyType.VIPER) stopDist = 400; // Ranged unit
          if (e.bossType === BossType.BLUE_BURST) stopDist = 600;
          if (e.bossType === BossType.PURPLE_ACID) stopDist = 500;
          
          if (distToTarget > stopDist) {
              e.x += Math.cos(angle) * e.speed * timeScale;
              e.y += Math.sin(angle) * e.speed * timeScale;
          }

          // Attack Logic
          if (Date.now() - e.lastAttackTime > (e.bossType ? 100 : 1000)) { // Bosses manage their own rates
               this.handleEnemyAttack(e, target, distToTarget, closestUnit || { x: this.state.base.x, y: this.state.base.y, radius: 200 } as any);
          }
      });
  }

  private handleEnemyAttack(e: Enemy, targetPos: {x: number, y: number}, dist: number, targetEntity: Entity) {
      const now = Date.now();

      // Boss Logic
      if (e.isBoss) {
           if (e.bossType === BossType.RED_SUMMONER) {
               if (now - e.lastAttackTime > (BOSS_STATS[BossType.RED_SUMMONER].summonRate || 2000)) {
                   // Summon Grunts
                   for(let i=0; i<3; i++) {
                       const a = Math.random() * Math.PI*2;
                       this.spawnSpecificEnemy(EnemyType.GRUNT, e.x + Math.cos(a)*50, e.y + Math.sin(a)*50);
                   }
                   e.lastAttackTime = now;
               }
           }
           else if (e.bossType === BossType.BLUE_BURST) {
               if (now - e.lastAttackTime > (BOSS_STATS[BossType.BLUE_BURST].fireRate || 1000)) {
                   // Fire Burst
                   e.bossBurstCount = 3;
                   e.bossNextShotTime = now;
                   e.lastAttackTime = now;
               }
               // Handle Burst
               if (e.bossBurstCount && e.bossBurstCount > 0 && now >= (e.bossNextShotTime || 0)) {
                   this.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 10, e.damage, false, '#60a5fa');
                   e.bossBurstCount--;
                   e.bossNextShotTime = now + (BOSS_STATS[BossType.BLUE_BURST].burstDelay || 100);
               }
           }
           else if (e.bossType === BossType.PURPLE_ACID) {
               if (now - e.lastAttackTime > (BOSS_STATS[BossType.PURPLE_ACID].fireRate || 4000)) {
                   // Lob Acid Blob
                   // Fix: Pass undefined for homingTarget and isHoming, then true for createsToxicZone
                   this.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#a855f7', undefined, false, true); 
                   e.lastAttackTime = now;
               }
           }
           return;
      }

      // Normal Units
      if (e.type === EnemyType.VIPER) {
          if (dist < 450 && now - e.lastAttackTime > 2000) {
              this.spawnProjectile(e.x, e.y, targetPos.x, targetPos.y, 8, e.damage, false, '#10B981');
              e.lastAttackTime = now;
          }
      }
      else if (e.type === EnemyType.KAMIKAZE) {
          if (dist < 30) {
              // Explode
              this.damageArea(e.x, e.y, 100, e.damage);
              this.spawnToxicZone(e.x, e.y);
              this.spawnParticle(e.x, e.y, '#a855f7', 10, 20);
              e.hp = 0; // Suicide
              this.audio.playExplosion();
          }
      }
      else {
          // Melee
          if (dist < e.radius + (targetEntity.radius || 20) + 10 && now - e.lastAttackTime > 1000) {
              // Deal Damage
              if (targetEntity.id === 'player') {
                  this.damagePlayer(e.damage);
              } else if ((targetEntity as any).maxHp && (targetEntity as any).width) { // Base
                  this.damageBase(e.damage);
              } else if ((targetEntity as any).hp !== undefined) { // Ally/Turret
                  (targetEntity as any).hp -= e.damage;
              }
              e.lastAttackTime = now;
              this.audio.playMeleeHit();
          }
      }
  }

  public damageEnemy(enemy: Enemy, amount: number) {
      let dmg = amount;
      
      // Hive Mother Armor Reduction
      if (enemy.bossType === BossType.HIVE_MOTHER && enemy.armorValue) {
          const mitigation = enemy.armorValue / 100; // 90% -> 0.9
          dmg = dmg * (1 - mitigation);
          // Min damage 1 to give feedback
          dmg = Math.max(1, dmg);
      }

      enemy.hp -= dmg;
      if (this.state.settings.showDamageNumbers) {
          this.addMessage(`${Math.ceil(dmg)}`, enemy.x, enemy.y - 20, '#fff', 500);
      }

      if (enemy.hp <= 0) {
          this.killEnemy(enemy);
      }
  }

  private killEnemy(e: Enemy) {
      // Reward
      let score = e.scoreReward;
      
      // Hive Mother Victory Logic
      if (e.bossType === BossType.HIVE_MOTHER) {
          // Bonus: 20 * GeneStrength * Armor^2
          // High armor kills = massive reward
          const gene = this.state.currentPlanet?.geneStrength || 1;
          const armor = e.armorValue || 0;
          const bonus = Math.floor(20 * gene * (armor * armor));
          score += bonus;
          
          this.addMessage(`HIVE MOTHER ELIMINATED`, e.x, e.y, '#ffff00');
          this.addMessage(`DOMINANCE BONUS: +${bonus}`, e.x, e.y + 20, '#ffff00');
          
          this.completeMission();
      }

      this.state.player.score += score;
      
      // Remove from list
      this.state.enemies = this.state.enemies.filter(en => en !== e);
      
      // Stats
      if (e.isBoss) this.state.stats.killsByType['BOSS']++;
      else this.state.stats.killsByType[e.type]++;

      // FX
      this.spawnBloodStain(e.x, e.y, e.color);
      this.audio.playEnemyDeath(e.isBoss);
  }

  private updateProjectiles(dt: number, timeScale: number) {
      this.state.projectiles.forEach(p => {
          // Logic
          if (p.isHoming && p.targetId) {
              const target = this.state.enemies.find(e => e.id === p.targetId);
              if (target) {
                  const angle = Math.atan2(target.y - p.y, target.x - p.x);
                  // Lerp angle for turn speed could go here, for now instant turn
                  p.vx = Math.cos(angle) * (p.vx**2 + p.vy**2)**0.5;
                  p.vy = Math.sin(angle) * (p.vx**2 + p.vy**2)**0.5;
              }
          }
          
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          
          const distTravelled = Math.sqrt((p.vx * timeScale)**2 + (p.vy * timeScale)**2);
          p.rangeRemaining -= distTravelled;

          // Collision
          if (p.fromPlayer) {
              // Check Enemy Hits
              for (const e of this.state.enemies) {
                  const d = Math.sqrt((p.x - e.x)**2 + (p.y - e.y)**2);
                  if (d < e.radius + 5) {
                      // Hit
                      this.damageEnemy(e, p.damage);
                      // Piercing Logic
                      if (p.isPiercing) {
                          if (!p.hitIds) p.hitIds = [];
                          if (!p.hitIds.includes(e.id)) {
                              p.hitIds.push(e.id);
                              // Reduce damage per pierce?
                          }
                      } else if (p.isExplosive) {
                           this.damageArea(p.x, p.y, 100, p.damage);
                           this.spawnParticle(p.x, p.y, '#f87171', 10, 10);
                           p.rangeRemaining = 0; // Destroy
                      } else {
                           p.rangeRemaining = 0; // Destroy single target
                      }
                      
                      if (p.rangeRemaining <= 0) break;
                  }
              }
          } else {
              // Check Player/Base/Ally Hits
              // Simplified: Only Player and Base
              const dPlayer = Math.sqrt((p.x - this.state.player.x)**2 + (p.y - this.state.player.y)**2);
              if (dPlayer < this.state.player.radius) {
                  this.damagePlayer(p.damage);
                  p.rangeRemaining = 0;
                  // If toxic projectile
                  if (p.createsToxicZone) this.spawnToxicZone(p.x, p.y);
              }
              // Check Base
              if (p.x > this.state.base.x - this.state.base.width/2 && p.x < this.state.base.x + this.state.base.width/2 &&
                  p.y > this.state.base.y - this.state.base.height/2 && p.y < this.state.base.y + this.state.base.height/2) {
                      this.damageBase(p.damage);
                      p.rangeRemaining = 0;
              }
          }
      });
      
      this.state.projectiles = this.state.projectiles.filter(p => p.rangeRemaining > 0);
  }

  private updateAllies(dt: number, time: number, timeScale: number) {
      // Spawn Logic
      if (Date.now() - this.state.lastAllySpawnTime > 60000 && this.state.allies.length < ALLY_STATS.maxCount) {
          const spawnX = this.state.base.x + (Math.random() > 0.5 ? 60 : -60);
          this.state.allies.push({
              id: `ally-${Date.now()}`,
              x: spawnX, y: this.state.base.y,
              radius: 12, angle: -Math.PI/2, color: '#3b82f6',
              hp: ALLY_STATS.hp, maxHp: ALLY_STATS.hp,
              speed: ALLY_STATS.speed,
              damage: ALLY_STATS.damage,
              currentOrder: 'PATROL',
              state: 'PATROL',
              lastFireTime: 0,
              patrolPoint: { x: spawnX, y: this.state.base.y - 100 }
          });
          this.state.lastAllySpawnTime = Date.now();
          this.addMessage("REINFORCEMENTS ARRIVED", spawnX, this.state.base.y - 20, '#3b82f6');
      }

      this.state.allies.forEach(a => {
          // AI Logic
          // Find target
          let target: Enemy | null = null;
          let minDist = 400; // Visual range
          this.state.enemies.forEach(e => {
              const d = Math.sqrt((e.x - a.x)**2 + (e.y - a.y)**2);
              if (d < minDist) {
                  minDist = d;
                  target = e;
              }
          });

          // Move
          if (target) {
              a.state = 'COMBAT';
              // Kite
              const d = Math.sqrt((target.x - a.x)**2 + (target.y - a.y)**2);
              const idealDist = 200;
              let moveAngle = Math.atan2(target.y - a.y, target.x - a.x);
              
              if (d < idealDist) {
                  moveAngle += Math.PI; // Retreat
              }
              
              a.x += Math.cos(moveAngle) * a.speed * timeScale;
              a.y += Math.sin(moveAngle) * a.speed * timeScale;
              a.angle = Math.atan2(target.y - a.y, target.x - a.x);

              // Shoot
              if (time - a.lastFireTime > 500) {
                  this.spawnProjectile(a.x, a.y, target.x, target.y, 15, a.damage, true, '#60a5fa');
                  a.lastFireTime = time;
                  this.audio.playAllyFire();
              }
          } else {
              // Idle/Patrol
              a.state = 'PATROL';
              const dx = a.patrolPoint.x - a.x;
              const dy = a.patrolPoint.y - a.y;
              if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                  const angle = Math.atan2(dy, dx);
                  a.x += Math.cos(angle) * a.speed * timeScale;
                  a.y += Math.sin(angle) * a.speed * timeScale;
                  a.angle = angle;
              }
          }
      });
      
      this.state.allies = this.state.allies.filter(a => a.hp > 0);
  }

  private updateTurrets(time: number) {
      this.state.turretSpots.forEach(spot => {
          const t = spot.builtTurret;
          if (!t) return;
          
          if (time - t.lastFireTime > t.fireRate) {
              // Find Target
              let target: Enemy | null = null;
              let minDist = t.range;
              
              this.state.enemies.forEach(e => {
                  const d = Math.sqrt((e.x - spot.x)**2 + (e.y - spot.y)**2);
                  if (d < minDist) {
                      minDist = d;
                      target = e;
                  }
              });

              if (target) {
                  t.angle = Math.atan2(target.y - spot.y, target.x - spot.x);
                  this.spawnProjectile(spot.x, spot.y, target.x, target.y, 20, t.damage, true, '#10b981', t.type === TurretType.MISSILE ? target.id : undefined, t.type === TurretType.MISSILE);
                  t.lastFireTime = time;
                  this.audio.playTurretFire(t.level);
              }
          }
      });
  }

  private updatePlayer(dt: number, time: number, timeScale: number) {
      const p = this.state.player;
      
      // Move
      let dx = 0; let dy = 0;
      if (this.input.keys['w'] || this.input.keys['W']) dy -= 1;
      if (this.input.keys['s'] || this.input.keys['S']) dy += 1;
      if (this.input.keys['a'] || this.input.keys['A']) dx -= 1;
      if (this.input.keys['d'] || this.input.keys['D']) dx += 1;
      
      if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx*dx + dy*dy);
          p.x += (dx/len) * p.speed * timeScale;
          p.y += (dy/len) * p.speed * timeScale;
          
          // World Bounds
          p.x = Math.max(0, Math.min(WORLD_WIDTH, p.x));
          p.y = Math.max(0, Math.min(WORLD_HEIGHT, p.y));
      }

      // Aim
      p.angle = Math.atan2(this.input.mouse.y - (p.y - this.state.camera.y), this.input.mouse.x - (p.x - this.state.camera.x));

      // Right Click Aim
      p.isAiming = this.input.mouse.rightDown;

      // Fire
      const currentWep = p.loadout[p.currentWeaponIndex];
      const wepState = p.weapons[currentWep];
      const wepStats = WEAPONS[currentWep];

      if (wepState.reloading) {
          if (time - wepState.reloadStartTime > wepStats.reloadTime) {
              wepState.reloading = false;
              wepState.ammoInMag = wepStats.magSize; // Simplify reserve logic for now
          }
      } else if (this.input.mouse.down) {
          if (wepState.ammoInMag <= 0) {
              this.reloadWeapon(time);
          } else if (time - wepState.lastFireTime > wepStats.fireRate) {
               // Handle Modules
               let dmgMult = 1;
               let fireRateMod = 1;
               
               // Module: Gel
               if (wepState.modules.some(m => m.type === ModuleType.GEL_BARREL)) dmgMult += 0.4;
               // Module: Rupturer
               if (wepState.modules.some(m => m.type === ModuleType.MICRO_RUPTURER)) dmgMult += 0.6;
               // Module: Pressurized Bolt
               if (wepState.modules.some(m => m.type === ModuleType.PRESSURIZED_BOLT)) {
                   wepState.consecutiveShots = Math.min(5, wepState.consecutiveShots + 1);
                   fireRateMod = 1 / (1 + wepState.consecutiveShots * 0.1);
               } else {
                   wepState.consecutiveShots = 0;
               }
               // Spaceship Module: Carapace Analyzer
               if (this.state.spaceship.installedModules.includes(SpaceshipModuleType.CARAPACE_ANALYZER)) {
                   dmgMult += 0.2;
               }

               const finalDmg = wepStats.damage * dmgMult;

               if (time - wepState.lastFireTime > wepStats.fireRate * fireRateMod) {
                   // Create Projectiles
                   if (currentWep === WeaponType.SG) {
                       for(let i=0; i<8; i++) {
                           this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*0.3, finalDmg, wepStats);
                       }
                   } else if (currentWep === WeaponType.FLAMETHROWER) {
                       this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*0.2, finalDmg, wepStats);
                   } else {
                       this.firePlayerProjectile(p.x, p.y, p.angle, finalDmg, wepStats);
                   }
                   
                   wepState.ammoInMag--;
                   wepState.lastFireTime = time;
                   this.state.stats.shotsFired++;
                   this.audio.playWeaponFire(currentWep);
               }
          }
      } else {
          // Reset consecutive shots if not firing
          if (time - wepState.lastFireTime > 500) wepState.consecutiveShots = 0;
      }

      // Regen
      if (time - p.lastHitTime > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
          p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
      }
  }

  private firePlayerProjectile(x: number, y: number, angle: number, dmg: number, stats: any) {
      const vx = Math.cos(angle) * stats.projectileSpeed;
      const vy = Math.sin(angle) * stats.projectileSpeed;
      
      this.state.projectiles.push({
          id: `p-${Date.now()}-${Math.random()}`,
          x: x + Math.cos(angle)*20, 
          y: y + Math.sin(angle)*20,
          vx, vy,
          radius: 3,
          color: '#fff',
          damage: dmg,
          rangeRemaining: stats.range,
          fromPlayer: true,
          isExplosive: stats.isExplosive,
          isPiercing: stats.isPiercing,
          weaponType: stats.type,
          maxRange: stats.range,
          angle // for rendering orientation
      });
  }

  private updateParticles(dt: number, timeScale: number) {
      this.state.particles.forEach(p => {
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          p.life -= dt * 0.05; // Fade out
      });
      this.state.particles = this.state.particles.filter(p => p.life > 0);
  }

  private updateToxicZones(dt: number) {
      this.state.toxicZones.forEach(z => {
          z.life -= dt;
          if (z.life % 500 < dt) { // Tick damage
              const p = this.state.player;
              const d = Math.sqrt((p.x - z.x)**2 + (p.y - z.y)**2);
              if (d < z.radius) {
                  this.damagePlayer(z.damagePerSecond * 0.5);
              }
          }
      });
      this.state.toxicZones = this.state.toxicZones.filter(z => z.life > 0);
  }

  public damagePlayer(amount: number) {
      const p = this.state.player;
      
      // Mitigation Upgrades
      if (p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)) {
          amount *= 0.8; 
      }
      
      let actualDmg = amount;
      
      // Armor Absorption
      if (p.armor > 0) {
          let mitigation = 0.5; // Base 50%
          if (p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL)) mitigation = 0.9;
          
          const armorDmg = amount * mitigation;
          const hpDmg = amount * (1 - mitigation);
          
          if (p.armor >= armorDmg) {
              p.armor -= armorDmg;
              actualDmg = hpDmg;
          } else {
              actualDmg = amount - p.armor;
              p.armor = 0;
          }
      }

      p.hp -= actualDmg;
      p.lastHitTime = Date.now();
      
      if (p.hp <= 0) {
          this.state.isGameOver = true;
          this.state.isPaused = true;
      }
  }

  public damageBase(amount: number) {
      this.state.base.hp -= amount;
      this.audio.playBaseDamage();
      if (this.state.base.hp <= 0) {
           this.state.isGameOver = true;
           this.state.isPaused = true;
      }
  }

  public damageArea(x: number, y: number, radius: number, damage: number) {
      this.state.enemies.forEach(e => {
          if (Math.sqrt((e.x - x)**2 + (e.y - y)**2) < radius) {
              this.damageEnemy(e, damage);
          }
      });
  }

  public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean) {
      const angle = Math.atan2(ty - y, tx - x);
      this.state.projectiles.push({
          id: `proj-${Date.now()}-${Math.random()}`,
          x, y, 
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: dmg,
          color,
          radius: 4,
          rangeRemaining: 1000,
          fromPlayer,
          angle,
          targetId: homingTarget,
          isHoming,
          createsToxicZone
      });
  }

  public spawnParticle(x: number, y: number, color: string, count: number, speed: number) {
      for(let i=0; i<count; i++) {
          const a = Math.random() * Math.PI*2;
          const s = Math.random() * speed;
          this.state.particles.push({
              id: `pt-${Math.random()}`,
              x, y,
              vx: Math.cos(a) * s,
              vy: Math.sin(a) * s,
              life: 1.0,
              maxLife: 1.0,
              color,
              radius: Math.random() * 3,
              angle: 0
          });
      }
  }

  public spawnBloodStain(x: number, y: number, color: string) {
      if (!this.state.settings.showBlood) return;
      this.state.bloodStains.push({
          id: `bs-${Math.random()}`,
          x, y, color,
          life: 30000,
          maxLife: 30000,
          blotches: Array.from({length: 5}, () => ({
              x: (Math.random()-0.5)*20,
              y: (Math.random()-0.5)*20,
              r: 2 + Math.random()*8
          }))
      });
  }

  public spawnToxicZone(x: number, y: number) {
      this.state.toxicZones.push({
          id: `${Math.random()}`,
          x, y,
          radius: TOXIC_ZONE_STATS.radius,
          damagePerSecond: TOXIC_ZONE_STATS.dps,
          life: TOXIC_ZONE_STATS.duration,
          createdAt: Date.now()
      });
  }

  public throwGrenade() {
      const p = this.state.player;
      if (p.grenades > 0) {
          p.grenades--;
          const targetX = p.x + Math.cos(p.angle) * 300;
          const targetY = p.y + Math.sin(p.angle) * 300;
          
          this.spawnProjectile(p.x, p.y, targetX, targetY, 12, PLAYER_STATS.grenadeDamage, true, '#f97316');
          // Actually grenade logic is projectile with isExplosive
          // But here we simulate it for now as a simple projectile that will explode
          this.state.projectiles[this.state.projectiles.length-1].isExplosive = true;
          this.audio.playGrenadeThrow();
      }
  }

  public reloadWeapon(time: number) {
      const p = this.state.player;
      const w = p.weapons[p.loadout[p.currentWeaponIndex]];
      if (!w.reloading && w.ammoInMag < WEAPONS[w.type].magSize) {
          w.reloading = true;
          w.reloadStartTime = time;
      }
  }

  // Interaction Logic (Turrets, Shop)
  public interact() {
      const p = this.state.player;
      
      // Check Turret Spots
      let closestSpot = -1;
      let minDst = 60;
      this.state.turretSpots.forEach((s, i) => {
          const d = Math.sqrt((s.x - p.x)**2 + (s.y - p.y)**2);
          if (d < minDst) {
              minDst = d;
              closestSpot = i;
          }
      });

      if (closestSpot !== -1) {
          const spot = this.state.turretSpots[closestSpot];
          if (!spot.builtTurret) {
              // Build
              const currentCount = this.state.turretSpots.filter(s => s.builtTurret).length;
              const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);
              if (p.score >= cost) {
                  p.score -= cost;
                  spot.builtTurret = {
                      id: `t-${Date.now()}`,
                      x: 0, y: 0, radius: 0, angle: 0, color: '', // Entity props
                      level: 1,
                      type: TurretType.STANDARD,
                      lastFireTime: 0,
                      range: TURRET_STATS[TurretType.STANDARD].range,
                      hp: TURRET_STATS[TurretType.STANDARD].hp,
                      maxHp: TURRET_STATS[TurretType.STANDARD].hp,
                      damage: TURRET_STATS[TurretType.STANDARD].damage,
                      fireRate: TURRET_STATS[TurretType.STANDARD].fireRate
                  };
                  this.audio.playTurretFire(1); // Building sound placeholder
              } else {
                  this.addMessage("INSUFFICIENT FUNDS", p.x, p.y - 50, 'red');
              }
          } else {
              // Open Upgrade Menu
              this.state.activeTurretId = closestSpot;
          }
      }
  }

  public confirmTurretUpgrade(type: TurretType) {
      if (this.state.activeTurretId === undefined) return;
      const spot = this.state.turretSpots[this.state.activeTurretId];
      if (!spot.builtTurret) return;
      
      let cost = 0;
      if (type === TurretType.GAUSS) cost = TURRET_COSTS.upgrade_gauss;
      if (type === TurretType.SNIPER) cost = TURRET_COSTS.upgrade_sniper;
      if (type === TurretType.MISSILE) cost = TURRET_COSTS.upgrade_missile;

      if (this.state.player.score >= cost) {
          this.state.player.score -= cost;
          spot.builtTurret.type = type;
          spot.builtTurret.level = 2;
          // Apply Stats
          const s = TURRET_STATS[type];
          spot.builtTurret.range = s.range;
          spot.builtTurret.damage = s.damage;
          spot.builtTurret.fireRate = s.fireRate;
          spot.builtTurret.maxHp = s.hp;
          spot.builtTurret.hp = s.hp;
          
          this.closeTurretUpgrade();
      }
  }

  public closeTurretUpgrade() {
      this.state.activeTurretId = undefined;
  }

  public purchaseItem(itemKey: string) {
      const p = this.state.player;
      
      // Ammo
      if (itemKey === 'AR_AMMO' && p.score >= SHOP_PRICES.AR_AMMO) { p.score -= SHOP_PRICES.AR_AMMO; p.weapons[WeaponType.AR].ammoReserve += 60; }
      if (itemKey === 'SG_AMMO' && p.score >= SHOP_PRICES.SG_AMMO) { p.score -= SHOP_PRICES.SG_AMMO; p.weapons[WeaponType.SG].ammoReserve += 16; }
      if (itemKey === 'SR_AMMO' && p.score >= SHOP_PRICES.SR_AMMO) { p.score -= SHOP_PRICES.SR_AMMO; p.weapons[WeaponType.SR].ammoReserve += 10; }
      if (itemKey === 'GRENADE' && p.score >= SHOP_PRICES.GRENADE) { p.score -= SHOP_PRICES.GRENADE; p.grenades++; }
      
      // New Ammo
      if (itemKey === 'PULSE_AMMO' && p.score >= SHOP_PRICES.PULSE_AMMO) { p.score -= SHOP_PRICES.PULSE_AMMO; p.weapons[WeaponType.PULSE_RIFLE].ammoReserve += 90; }
      if (itemKey === 'FLAME_AMMO' && p.score >= SHOP_PRICES.FLAME_AMMO) { p.score -= SHOP_PRICES.FLAME_AMMO; p.weapons[WeaponType.FLAMETHROWER].ammoReserve += 200; }
      if (itemKey === 'GL_AMMO' && p.score >= SHOP_PRICES.GL_AMMO) { p.score -= SHOP_PRICES.GL_AMMO; p.weapons[WeaponType.GRENADE_LAUNCHER].ammoReserve += 12; }

      // Weapons
      if (itemKey === 'WEAPON_PULSE' && p.score >= SHOP_PRICES.WEAPON_PULSE) {
          p.score -= SHOP_PRICES.WEAPON_PULSE;
          this.addToInventory(WeaponType.PULSE_RIFLE);
      }
      if (itemKey === 'WEAPON_FLAME' && p.score >= SHOP_PRICES.WEAPON_FLAME) {
          p.score -= SHOP_PRICES.WEAPON_FLAME;
          this.addToInventory(WeaponType.FLAMETHROWER);
      }
      if (itemKey === 'WEAPON_GL' && p.score >= SHOP_PRICES.WEAPON_GL) {
          p.score -= SHOP_PRICES.WEAPON_GL;
          this.addToInventory(WeaponType.GRENADE_LAUNCHER);
      }

      // Upgrades
      if (itemKey === DefenseUpgradeType.INFECTION_DISPOSAL || itemKey === DefenseUpgradeType.SPORE_BARRIER || itemKey === DefenseUpgradeType.IMPACT_PLATE) {
           const info = DEFENSE_UPGRADE_INFO[itemKey as DefenseUpgradeType];
           if (p.score >= info.cost && !p.upgrades.includes(itemKey as DefenseUpgradeType)) {
               p.score -= info.cost;
               p.upgrades.push(itemKey as DefenseUpgradeType);
               // Apply Immediate Effects
               if (itemKey === DefenseUpgradeType.SPORE_BARRIER) {
                   const bonus = (info as any).maxArmorBonus;
                   p.maxArmor += bonus;
                   p.armor += bonus;
               }
           }
      }

      // Modules
      if (Object.values(ModuleType).includes(itemKey as ModuleType)) {
          const m = MODULE_STATS[itemKey as ModuleType];
          if (p.score >= m.cost) {
              p.score -= m.cost;
              p.freeModules.push({ id: `mod-${Date.now()}-${Math.random()}`, type: itemKey as ModuleType });
          }
      }

      // Spaceship Modules
      if (Object.values(SpaceshipModuleType).includes(itemKey as SpaceshipModuleType)) {
          const m = SPACESHIP_MODULES[itemKey as SpaceshipModuleType];
          if (p.score >= m.cost) {
               p.score -= m.cost;
               this.state.spaceship.installedModules.push(itemKey as SpaceshipModuleType);
               // Apply immediate effects
               if (itemKey === SpaceshipModuleType.BASE_REINFORCEMENT) {
                   this.state.base.maxHp += 3000;
                   this.state.base.hp += 3000;
               }
               // Unlock tree if cannon purchased
               if (itemKey === SpaceshipModuleType.ORBITAL_CANNON) {
                   this.generateOrbitalUpgradeTree();
               }
          }
      }
  }

  public addToInventory(type: WeaponType) {
      const idx = this.state.player.inventory.findIndex(i => i === null);
      if (idx !== -1) {
          this.state.player.inventory[idx] = { id: `w-${Date.now()}`, type };
      }
  }

  public toggleTacticalMenu() { this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen; }
  public toggleInventory() { this.state.isInventoryOpen = !this.state.isInventoryOpen; }
  public togglePause() { this.state.isPaused = !this.state.isPaused; }
  public issueOrder(order: AllyOrder) { this.state.allies.forEach(a => a.currentOrder = order); }
  
  public swapLoadoutAndInventory(loadoutIdx: number, invIdx: number) {
      const p = this.state.player;
      const invItem = p.inventory[invIdx];
      if (!invItem) return;

      const oldWeapon = p.loadout[loadoutIdx];
      p.loadout[loadoutIdx] = invItem.type;
      p.inventory[invIdx] = { id: `w-${Date.now()}`, type: oldWeapon };
  }

  public toggleSetting(key: any) { (this.state.settings as any)[key] = !(this.state.settings as any)[key]; }

  public addMessage(text: string, x: number, y: number, color: string, time: number = 1000) {
      this.state.messages.push({ text, x, y, color, time });
  }

  // --- SAVE SYSTEM ---
  public saveGame() {
      // Create Persistent State
      const p = this.state.player;
      const persistent: PersistentPlayerState = {
          score: p.score,
          weapons: p.weapons,
          loadout: p.loadout,
          inventory: p.inventory,
          grenades: p.grenades,
          upgrades: p.upgrades,
          freeModules: p.freeModules,
          grenadeModules: p.grenadeModules
      };
      
      // Update SavedPlayerState in global state (for Exploration map persistence)
      this.state.savedPlayerState = persistent;

      const saveData: Partial<GameState> = {
          ...this.state,
          // Don't save transient things
          projectiles: [],
          particles: [],
          messages: []
      };

      const newSave: SaveFile = {
          id: `save-${Date.now()}`,
          timestamp: Date.now(),
          label: this.state.gameMode === GameMode.EXPLORATION 
            ? `EXPLORATION - ${this.state.currentPlanet?.name || 'SECTOR MAP'}` 
            : `SURVIVAL - WAVE ${this.state.wave}`,
          isPinned: false,
          data: JSON.stringify(saveData),
          mode: this.state.gameMode
      };

      // Add to list
      this.state.saveSlots.unshift(newSave);
      
      // Manage Limits
      const pinned = this.state.saveSlots.filter(s => s.isPinned);
      const unpinned = this.state.saveSlots.filter(s => !s.isPinned);
      
      if (unpinned.length > (MAX_SAVE_SLOTS - pinned.length)) {
          // Remove oldest unpinned
          const toKeep = unpinned.slice(0, MAX_SAVE_SLOTS - pinned.length);
          this.state.saveSlots = [...pinned, ...toKeep].sort((a,b) => b.timestamp - a.timestamp);
      }

      this.persistSaves();
      this.addMessage("GAME SAVED", WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981');
  }

  public loadGame(id: string) {
      const slot = this.state.saveSlots.find(s => s.id === id);
      if (slot) {
          const data = JSON.parse(slot.data);
          // Restore
          Object.assign(this.state, data);
          // Re-hydrate helpers if needed (not needed for simple POJOs)
          this.state.isPaused = false;
          this.state.appMode = AppMode.GAMEPLAY;
          // Fix camera if needed
          this.state.camera = { x: 0, y: 0 }; 
      }
  }

  public deleteSave(id: string) {
      this.state.saveSlots = this.state.saveSlots.filter(s => s.id !== id);
      this.persistSaves();
  }

  public togglePin(id: string) {
      const slot = this.state.saveSlots.find(s => s.id === id);
      if (slot) {
          if (!slot.isPinned && this.state.saveSlots.filter(s => s.isPinned).length >= MAX_PINNED_SLOTS) {
              return; // Max pins reached
          }
          slot.isPinned = !slot.isPinned;
          this.persistSaves();
      }
  }

  private loadSavesFromStorage(): SaveFile[] {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
  }

  private persistSaves() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.saveSlots));
  }

  // --- MODES ---
  public enterSurvivalMode() {
      this.reset(true);
      this.state.appMode = AppMode.GAMEPLAY;
      this.state.gameMode = GameMode.SURVIVAL;
  }

  public enterExplorationMode() {
      this.reset(true); // Generates planets
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.gameMode = GameMode.EXPLORATION;
  }
  
  public enterSpaceshipView() {
      this.state.appMode = AppMode.SPACESHIP_VIEW;
  }
  public exitSpaceshipView() {
      this.state.appMode = AppMode.EXPLORATION_MAP;
  }

  public enterOrbitalUpgradeMenu() {
      this.state.appMode = AppMode.ORBITAL_UPGRADES;
  }
  public exitOrbitalUpgradeMenu() {
      this.state.appMode = AppMode.SPACESHIP_VIEW;
  }

  public selectPlanet(id: string | null) {
      this.state.selectedPlanetId = id;
  }

  public completeMission() {
      this.state.missionComplete = true;
      this.state.isPaused = true;
      
      // Mark planet complete
      if (this.state.currentPlanet) {
          const pIdx = this.state.planets.findIndex(p => p.id === this.state.currentPlanet?.id);
          if (pIdx !== -1) {
              this.state.planets[pIdx].completed = true;
          }
      }
  }

  // --- CHEATS ---
  public activateBackdoor() {
      this.state.player.score += 99999;
      this.audio.playTurretFire(2);
  }

  // --- Module System ---
  public equipModule(target: WeaponType | 'GRENADE', modId: string) {
      const p = this.state.player;
      const modIndex = p.freeModules.findIndex(m => m.id === modId);
      if (modIndex === -1) return;
      
      const mod = p.freeModules[modIndex];

      if (target === 'GRENADE') {
          if (p.grenadeModules.length < 2) {
              p.freeModules.splice(modIndex, 1);
              p.grenadeModules.push(mod);
          }
      } else {
          const w = p.weapons[target];
          const limit = target === WeaponType.PISTOL ? 2 : 3;
          if (w.modules.length < limit) {
              p.freeModules.splice(modIndex, 1);
              w.modules.push(mod);
          }
      }
  }

  public unequipModule(target: WeaponType | 'GRENADE', modId: string) {
      const p = this.state.player;
      if (target === 'GRENADE') {
          const idx = p.grenadeModules.findIndex(m => m.id === modId);
          if (idx !== -1) {
              const mod = p.grenadeModules.splice(idx, 1)[0];
              p.freeModules.push(mod);
          }
      } else {
          const w = p.weapons[target];
          const idx = w.modules.findIndex(m => m.id === modId);
          if (idx !== -1) {
              const mod = w.modules.splice(idx, 1)[0];
              p.freeModules.push(mod);
          }
      }
  }
}
