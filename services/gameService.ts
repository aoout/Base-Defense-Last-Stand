
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
  MissionType,
  FloatingText,
  FloatingTextType,
  GameSettings,
  DamageSource
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
  BASE_STATS,
  TURRET_COSTS,
  TOXIC_ZONE_STATS
} from '../data/registry';
import { AudioService } from './audioService';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { SaveManager } from './managers/SaveManager';
import { ShopManager } from './managers/ShopManager';
import { EnemyManager } from './managers/EnemyManager';
import { ProjectileManager } from './managers/ProjectileManager';
import { PlayerManager } from './managers/PlayerManager';
import { DefenseManager } from './managers/DefenseManager';
import { FXManager } from './managers/FXManager';
import { SpaceshipManager } from './managers/SpaceshipManager';
import { TimeManager } from './managers/TimeManager';
import { TRANSLATIONS } from '../data/locales';

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
  
  // Managers
  time: TimeManager;
  saveManager: SaveManager;
  shopManager: ShopManager;
  enemyManager: EnemyManager;
  projectileManager: ProjectileManager;
  playerManager: PlayerManager;
  defenseManager: DefenseManager;
  fxManager: FXManager;
  spaceshipManager: SpaceshipManager;

  private lastTime: number = 0;

  constructor() {
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, down: false, rightDown: false },
    };
    this.audio = new AudioService();
    
    // Initialize Core Systems
    this.time = new TimeManager();

    // Initialize temporary state
    this.reset(true); 
    
    // Instantiate Managers
    this.saveManager = new SaveManager(this);
    this.shopManager = new ShopManager(this);
    this.enemyManager = new EnemyManager(this);
    this.projectileManager = new ProjectileManager(this);
    this.playerManager = new PlayerManager(this);
    this.defenseManager = new DefenseManager(this);
    this.fxManager = new FXManager(this);
    this.spaceshipManager = new SpaceshipManager(this);
    
    // Override defaults for Startup
    this.state.appMode = AppMode.START_MENU;
    
    // Load saves
    this.state.saveSlots = this.saveManager.loadSavesFromStorage();
  }

  // Translation Helper
  public t(key: string, params?: Record<string, any>): string {
      const lang = this.state.settings.language;
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key] || key;
      if (params) {
          Object.entries(params).forEach(([k, v]) => {
              str = str.replace(`{${k}}`, String(v));
          });
      }
      return str;
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
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen && !this.state.activeTurretId) {
                  this.interact();
              }
          }

          // Skip Wave (L)
          if (key === 'l' || key === 'L') {
               if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) {
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
          if ((key === 'r' || key === 'R') && !this.state.isPaused) this.reloadWeapon(this.time.now);
      }
  }

  public reset(fullReset: boolean = false) {
    const basePos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 };
    
    const existingPlanets = !fullReset && this.state?.planets ? this.state.planets : generatePlanets();
    const existingSaveSlots = !fullReset && this.state?.saveSlots ? this.state.saveSlots : [];
    const existingSpaceship = !fullReset && this.state?.spaceship ? this.state.spaceship : { 
        installedModules: [],
        orbitalUpgradeTree: [],
        orbitalDamageMultiplier: 1,
        orbitalRateMultiplier: 1,
        carapaceGrid: null
    };

    // Preserve settings (especially language) across resets
    const currentSettings = this.state?.settings || {
        showHUD: true,
        showBlood: true,
        showDamageNumbers: true,
        language: 'EN'
    };

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
      orbitalBeams: [],
      turretSpots: initialTurretSpots,
      toxicZones: [],
      activeSpecialEvent: SpecialEventType.NONE,

      wave: 1,
      waveTimeRemaining: 30000, 
      waveDuration: 30000, 
      spawnTimer: 0,
      enemiesPendingSpawn: 17, 
      enemiesSpawnedInWave: 0,
      totalEnemiesInWave: 99999, 
      lastAllySpawnTime: 0,

      isGameOver: false,
      missionComplete: false,
      isPaused: false,
      isTacticalMenuOpen: false,
      isInventoryOpen: false,
      isShopOpen: false,
      floatingTexts: [],
      
      settings: currentSettings, // Use preserved settings
      stats: {
        shotsFired: 0,
        shotsHit: 0,
        damageDealt: 0,
        damageBySource: {
            [DamageSource.PLAYER]: 0,
            [DamageSource.TURRET]: 0,
            [DamageSource.ALLY]: 0,
            [DamageSource.ORBITAL]: 0,
            [DamageSource.ENEMY]: 0
        },
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

    // Apply Persistent Bonuses
    if (!fullReset) {
        if (this.spaceshipManager) {
            this.spaceshipManager.applyPassiveBonuses();
        }
    }
  }

  public deployToPlanet(id: string) {
      const targetPlanet = this.state.planets.find(p => p.id === id);
      
      if (!targetPlanet) {
          console.error("Planet not found for deployment:", id);
          return;
      }

      const currentScraps = this.state.player.score;
      let dropCostPercent = targetPlanet.landingDifficulty / 100;

      if (this.state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
          dropCostPercent *= 0.5;
      }

      const dropCost = Math.floor(currentScraps * dropCostPercent);
      const remainingScraps = Math.max(0, currentScraps - dropCost);

      // Preserve persistent state BEFORE reset
      const persistentState = {
          weapons: this.state.player.weapons,
          loadout: this.state.player.loadout,
          inventory: this.state.player.inventory,
          upgrades: this.state.player.upgrades,
          freeModules: this.state.player.freeModules,
          grenadeModules: this.state.player.grenadeModules,
          grenades: this.state.player.grenades,
      };

      // Reset the world state
      this.reset(false);
      
      // Restore player state & set new score
      this.state.player.score = remainingScraps;
      this.state.player.weapons = persistentState.weapons;
      this.state.player.loadout = persistentState.loadout;
      this.state.player.inventory = persistentState.inventory;
      this.state.player.upgrades = persistentState.upgrades;
      this.state.player.freeModules = persistentState.freeModules;
      this.state.player.grenadeModules = persistentState.grenadeModules;
      this.state.player.grenades = persistentState.grenades;

      this.state.gameMode = GameMode.EXPLORATION;
      this.state.selectedPlanetId = id;
      this.state.currentPlanet = targetPlanet;
      this.state.appMode = AppMode.GAMEPLAY;
      
      this.spaceshipManager.applyPassiveBonuses();
      
      // Full heal the base
      this.state.base.hp = this.state.base.maxHp;

      if (targetPlanet.missionType === MissionType.OFFENSE) {
          this.state.enemiesPendingSpawn = 0; 
          this.state.wave = 0; 
          this.spawnHiveMother(targetPlanet);
      } else {
          this.state.enemiesPendingSpawn = 12 + 5 * 1; 
      }

      setTimeout(() => {
        this.addMessage(this.t('ORBITAL_DROP_COST', {0: dropCost}), this.state.player.x, this.state.player.y - 100, '#F87171', FloatingTextType.SYSTEM);
        if (this.state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
             setTimeout(() => {
                 this.addMessage(this.t('DEFLECTOR_ACTIVE'), this.state.player.x, this.state.player.y - 120, '#06b6d4', FloatingTextType.SYSTEM);
             }, 1000);
        }
        
        if (targetPlanet.missionType === MissionType.OFFENSE) {
             setTimeout(() => {
                 this.addMessage(this.t('MISSION_ASSAULT'), this.state.player.x, this.state.player.y - 140, '#fca5a5', FloatingTextType.SYSTEM);
             }, 2000);
        }
      }, 1000);
      
      this.state.terrain = generateTerrain(targetPlanet.visualType, targetPlanet.biome);
  }
  
  public update(time: number) {
    // Update Time Manager
    this.time.update(time);

    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }
    
    let dt = time - this.lastTime;
    this.lastTime = time;

    if (dt > 100) dt = 100;
    const TARGET_MS_PER_FRAME = 1000 / 60; 
    const timeScale = dt / TARGET_MS_PER_FRAME;

    if (this.state.isPaused || this.state.isShopOpen || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) return;

    // --- Wave Management ---
    if (!this.state.missionComplete) {
        if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) {
            // Offense Mode Logic (handled in EnemyManager via boss death trigger)
        } else {
            // Standard Defense Logic
            this.state.waveTimeRemaining -= dt;
            this.state.spawnTimer += dt;
            const SPAWN_INTERVAL = 500; 

            if (this.state.spawnTimer > SPAWN_INTERVAL) {
                if (this.state.enemiesPendingSpawn > 0) {
                    this.spawnEnemy();
                    this.state.enemiesPendingSpawn--;
                }
                this.state.spawnTimer = 0;
            }

            if (this.state.waveTimeRemaining <= 0) {
                const isExplorationDefense = this.state.gameMode === GameMode.EXPLORATION &&
                                             this.state.currentPlanet?.missionType === MissionType.DEFENSE;
                const isLastWave = isExplorationDefense && this.state.wave >= (this.state.currentPlanet?.totalWaves || 0);

                if (isLastWave) {
                    // VICTORY CONDITION CHECK
                    const allEnemiesSpawned = this.state.enemiesPendingSpawn <= 0;
                    const allEnemiesDefeated = this.state.enemies.length === 0;

                    if (allEnemiesSpawned && allEnemiesDefeated) {
                        this.completeMission();
                    }
                } else {
                    this.nextWave();
                }
            }
        }
    }

    // --- Message / Floating Text Lifecycle ---
    this.state.floatingTexts.forEach(m => {
        m.life -= dt;
        m.x += m.vx * timeScale;
        m.y += m.vy * timeScale;
        
        if (m.type === FloatingTextType.DAMAGE || m.type === FloatingTextType.CRIT) {
            m.vx *= 0.92; 
            m.vy *= 0.92;
        } else if (m.type === FloatingTextType.LOOT) {
            m.vy -= 0.05 * timeScale; 
        } else {
            m.vy = -0.5 * timeScale; 
        }
    });
    this.state.floatingTexts = this.state.floatingTexts.filter(m => m.life > 0);

    // --- Managers Update ---
    this.spaceshipManager.update(dt);
    this.playerManager.update(dt, this.time.now, timeScale);
    this.projectileManager.update(dt, timeScale);
    this.enemyManager.update(dt, timeScale);
    this.defenseManager.update(dt, this.time.now, timeScale);
    this.fxManager.update(dt, timeScale);

    // --- Camera Follow ---
    const targetCamX = this.state.player.x - CANVAS_WIDTH / 2;
    const targetCamY = this.state.player.y - CANVAS_HEIGHT / 2;
    this.state.camera.x = Math.max(0, Math.min(targetCamX, WORLD_WIDTH - CANVAS_WIDTH));
    this.state.camera.y = Math.max(0, Math.min(targetCamY, WORLD_HEIGHT - CANVAS_HEIGHT));
  }
  
  public nextWave() {
      this.state.wave++;
      this.state.activeSpecialEvent = SpecialEventType.NONE; 

      let duration = 30;
      if (this.state.wave <= 10) {
          duration = 30 + (this.state.wave - 1) * 2;
      } else {
          duration = 30 + (9 * 2) + (this.state.wave - 10) * 1;
      }
      this.state.waveDuration = duration * 1000;
      this.state.waveTimeRemaining = duration * 1000;
      this.state.spawnTimer = 0;

      let isFrenzy = false;
      if (this.state.wave % 5 === 0) {
          const roll = Math.random();
          if (roll < 0.3) {
              this.state.activeSpecialEvent = SpecialEventType.FRENZY;
              isFrenzy = true;
              this.addMessage(this.t('FRENZY_DETECTED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red', FloatingTextType.SYSTEM);
          } else {
              if (this.state.gameMode === GameMode.SURVIVAL || (this.state.currentPlanet?.missionType === MissionType.DEFENSE)) {
                this.state.activeSpecialEvent = SpecialEventType.BOSS;
                this.spawnBoss(); 
                this.addMessage(this.t('BOSS_DETECTED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'purple', FloatingTextType.SYSTEM);
              }
          }
      } else {
          this.addMessage(this.t('WAVE_STARTED', {0: this.state.wave}), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'yellow', FloatingTextType.SYSTEM);
      }

      let newEnemies = 12 + 5 * this.state.wave;
      if (isFrenzy) {
          newEnemies *= 3;
      }
      
      this.state.enemiesPendingSpawn += newEnemies;
  }

  public skipWave() {
      const isExplorationDefense = this.state.gameMode === GameMode.EXPLORATION &&
                                   this.state.currentPlanet?.missionType === MissionType.DEFENSE;
      const isLastWave = isExplorationDefense && this.state.wave >= (this.state.currentPlanet?.totalWaves || 0);

      const elapsed = this.state.waveDuration - this.state.waveTimeRemaining;
      
      if (elapsed >= 10000) {
          const remainingSeconds = Math.max(0, Math.floor(this.state.waveTimeRemaining / 1000));
          const reward = remainingSeconds * this.state.wave;
          
          this.state.player.score += reward;
          this.addMessage(this.t('LURE_REWARD', {0: reward}), this.state.player.x, this.state.player.y - 80, '#fbbf24', FloatingTextType.LOOT);
          this.audio.playBaseDamage(); 
          
          if (isLastWave) {
              this.state.waveTimeRemaining = 0;
              this.addMessage(this.t('FINAL_WAVE'), this.state.player.x, this.state.player.y - 80, 'red', FloatingTextType.SYSTEM);
          } else {
              this.nextWave();
          }
      } else {
          this.addMessage(this.t('LURE_PENDING'), this.state.player.x, this.state.player.y - 80, 'red', FloatingTextType.SYSTEM);
      }
  }

  // --- Manager Delegations ---
  private spawnEnemy() { this.enemyManager.spawnEnemy(); }
  private spawnBoss() { this.enemyManager.spawnBoss(); }
  private spawnHiveMother(planet: Planet) { this.enemyManager.spawnHiveMother(planet); }
  
  public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) { 
      this.state.stats.damageDealt += amount;
      if (this.state.stats.damageBySource) {
          this.state.stats.damageBySource[source] += amount;
      }
      this.enemyManager.damageEnemy(enemy, amount, source); 
  }
  public damagePlayer(amount: number) { this.playerManager.damagePlayer(amount); }
  public switchWeapon(index: number) { this.playerManager.switchWeapon(index); }
  public reloadWeapon(time: number) { this.playerManager.reloadWeapon(time); }
  public throwGrenade() { this.playerManager.throwGrenade(); }
  
  public issueOrder(order: AllyOrder) { this.defenseManager.issueOrder(order); }
  public confirmTurretUpgrade(type: TurretType) { this.defenseManager.confirmTurretUpgrade(type); }
  public interact() {
      this.defenseManager.interact(); 
  }
  public closeTurretUpgrade() { this.defenseManager.closeTurretUpgrade(); }
  
  public spawnToxicZone(x: number, y: number) { this.fxManager.spawnToxicZone(x, y); }
  
  public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange?: number, source: DamageSource = DamageSource.ENEMY) {
      this.projectileManager.spawnProjectile(x, y, tx, ty, speed, dmg, fromPlayer, color, homingTarget, isHoming, createsToxicZone, maxRange, source);
  }
  
  public spawnParticle(x: number, y: number, color: string, count: number, speed: number) { this.fxManager.spawnParticle(x, y, color, count, speed); }
  public spawnBloodStain(x: number, y: number, color: string, maxHp: number = 100) { this.fxManager.spawnBloodStain(x, y, color, maxHp); }
  public purchaseItem(itemKey: string) { this.shopManager.purchaseItem(itemKey); }
  public addToInventory(type: WeaponType) { this.shopManager.addToInventory(type); }
  public equipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.equipModule(target, modId); }
  public unequipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.unequipModule(target, modId); }

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
              this.damageEnemy(e, damage, DamageSource.PLAYER); 
          }
      });
  }

  public toggleTacticalMenu() { this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen; }
  public toggleInventory() { this.state.isInventoryOpen = !this.state.isInventoryOpen; }
  public togglePause() { this.state.isPaused = !this.state.isPaused; }
  
  public swapLoadoutAndInventory(loadoutIdx: number, invIdx: number) { this.shopManager.swapLoadoutAndInventory(loadoutIdx, invIdx); }
  
  public toggleSetting(key: keyof GameSettings) { 
      if (key === 'language') {
          this.state.settings.language = this.state.settings.language === 'EN' ? 'CN' : 'EN';
      } else {
          (this.state.settings as any)[key] = !(this.state.settings as any)[key]; 
      }
  }

  public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType, time: number = 1000) {
      // Enhanced physics for different types
      let vx = 0;
      let vy = -0.5;
      let size = 12;

      if (type === FloatingTextType.DAMAGE) {
          vx = (Math.random() - 0.5) * 4;
          vy = (Math.random() * -2) - 1; 
          time = 600;
          size = 14;
      } else if (type === FloatingTextType.CRIT) {
          vx = (Math.random() - 0.5) * 6;
          vy = -3;
          time = 1000;
          size = 20;
      } else if (type === FloatingTextType.LOOT) {
          vx = 0;
          vy = -1.5;
          time = 1500;
          size = 12;
      } else {
          vx = 0;
          vy = -0.2;
          size = 16;
      }

      this.state.floatingTexts.push({ 
          id: `ft-${Date.now()}-${Math.random()}`,
          text, x, y, vx, vy, color, maxLife: time, type, size, life: time
      });
  }

  public saveGame() { this.saveManager.saveGame(); }
  public loadGame(id: string) { this.saveManager.loadGame(id); }
  public deleteSave(id: string) { this.saveManager.deleteSave(id); }
  public togglePin(id: string) { this.saveManager.togglePin(id); }
  public exportSave(id: string) { return this.saveManager.exportSaveString(id); }
  public importSave(json: string) { return this.saveManager.importSave(json); }

  public enterSurvivalMode() {
      this.reset(true);
      this.state.appMode = AppMode.GAMEPLAY;
      this.state.gameMode = GameMode.SURVIVAL;
  }

  public enterExplorationMode() {
      this.reset(true); 
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.gameMode = GameMode.EXPLORATION;
  }
  
  public enterSpaceshipView() { this.state.appMode = AppMode.SPACESHIP_VIEW; }
  public exitSpaceshipView() { this.state.appMode = AppMode.EXPLORATION_MAP; }
  public enterOrbitalUpgradeMenu() { this.state.appMode = AppMode.ORBITAL_UPGRADES; }
  public exitOrbitalUpgradeMenu() { this.state.appMode = AppMode.SPACESHIP_VIEW; }
  public enterCarapaceGrid() { this.state.appMode = AppMode.CARAPACE_GRID; }
  public exitCarapaceGrid() { this.state.appMode = AppMode.SPACESHIP_VIEW; }
  public enterShipComputer() { this.state.appMode = AppMode.SHIP_COMPUTER; }
  public exitShipComputer() { this.state.appMode = AppMode.SPACESHIP_VIEW; }
  public selectPlanet(id: string | null) { this.state.selectedPlanetId = id; }

  public completeMission() {
      this.state.missionComplete = true;
      this.state.isPaused = true;
      if (this.state.currentPlanet) {
          const pIdx = this.state.planets.findIndex(p => p.id === this.state.currentPlanet?.id);
          if (pIdx !== -1) {
              this.state.planets[pIdx].completed = true;
          }
      }
  }

  public ascendToOrbit() {
      this.state.missionComplete = false;
      this.state.isPaused = false;
      this.state.isGameOver = false;
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.currentPlanet = null;
      this.state.selectedPlanetId = null;
      
      this.state.enemies = [];
      this.state.projectiles = [];
      this.state.allies = [];
      this.state.toxicZones = [];
      this.state.bloodStains = [];
      this.state.turretSpots.forEach(s => s.builtTurret = undefined);
  }

  public emergencyEvac() {
      this.state.isGameOver = false;
      this.state.isPaused = false;
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.currentPlanet = null; 
      this.state.selectedPlanetId = null;
      
      this.state.enemies = [];
      this.state.projectiles = [];
      this.state.allies = [];
      this.state.toxicZones = [];
      this.state.bloodStains = [];
  }

  public activateBackdoor() {
      this.state.player.score += 99999;
      this.audio.playTurretFire(2);
  }
  
  public generateOrbitalUpgradeTree() { this.spaceshipManager.generateOrbitalUpgradeTree(); }
  public purchaseOrbitalUpgrade(nodeId: string) { this.spaceshipManager.purchaseOrbitalUpgrade(nodeId); }
  
  public generateCarapaceGrid() { this.spaceshipManager.generateCarapaceGrid(); }
  public purchaseCarapaceNode(row: number, col: number) { this.spaceshipManager.purchaseCarapaceNode(row, col); }
}
