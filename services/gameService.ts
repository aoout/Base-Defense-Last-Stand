
import {
  GameState,
  WeaponType,
  EnemyType,
  Enemy,
  Projectile,
  GameStats,
  InventoryItem,
  SpecialEventType,
  BossType,
  AppMode,
  GameMode,
  Planet,
  PersistentPlayerState,
  SaveFile,
  DefenseUpgradeType,
  SpaceshipModuleType,
  PlanetVisualType,
  OrbitalUpgradeNode,
  OrbitalUpgradeEffect,
  MissionType,
  FloatingText,
  FloatingTextType,
  GameSettings,
  DamageSource,
  PlanetBuildingType,
  GalacticEventType,
  PlanetYieldInfo,
  PerformanceMode,
  BioResource,
  GameEventType,
  SpawnProjectileEvent,
  PlaySoundEvent,
  ShowFloatingTextEvent,
  SpawnParticleEvent,
  DamagePlayerEvent,
  DamageBaseEvent,
  DamageAreaEvent,
  GalaxyConfig,
  UserAction,
  WeaponState,
  WeaponModule
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMPAIGN_WIDTH,
  CAMPAIGN_HEIGHT,
  INVENTORY_SIZE,
} from '../constants';
import {
  PLAYER_STATS,
  INITIAL_AMMO,
  BASE_STATS,
} from '../data/registry';
import { AudioService } from './audioService';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { generateSectorName } from '../utils/nameGenerator';
import { SaveManager } from './managers/SaveManager';
import { ShopManager } from './managers/ShopManager';
import { EnemyManager } from './managers/EnemyManager';
import { ProjectileManager } from './managers/ProjectileManager';
import { PlayerManager } from './managers/PlayerManager';
import { DefenseManager } from './managers/DefenseManager';
import { FXManager } from './managers/FXManager';
import { SpaceshipManager } from './managers/SpaceshipManager';
import { TimeManager } from './managers/TimeManager';
import { MissionManager } from './managers/MissionManager';
import { GalaxyManager } from './managers/GalaxyManager';
import { StatManager } from './managers/StatManager';
import { PhysicsSystem } from './PhysicsSystem';
import { DataManager } from './DataManager'; // IMPORT
import { TRANSLATIONS } from '../data/locales';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';

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
  inputManager: InputManager;
  audio: AudioService;
  eventBus: EventBus;
  statManager: StatManager;
  dataManager: DataManager; // ADDED
  
  // Systems
  physics: PhysicsSystem;

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
  missionManager: MissionManager;
  galaxyManager: GalaxyManager;

  // Shared Systems
  private floatingTextPool: FloatingText[] = [];
  private aoeCache: Enemy[] = []; 
  
  // Performance: Loop Listeners for Transient UI
  private loopListeners: Set<(dt: number, time: number) => void> = new Set();

  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_STEP: number = 1000 / 60;

  constructor() {
    this.inputManager = new InputManager();
    this.audio = new AudioService();
    this.eventBus = new EventBus();
    this.statManager = new StatManager();
    this.dataManager = new DataManager(); // INITIALIZE
    
    // Initialize Core Systems
    this.time = new TimeManager();
    
    // Initialize Physics System
    this.physics = new PhysicsSystem(() => this.state, this.eventBus, this.statManager, this.dataManager);

    // Initialize state
    // Use window dimensions for initial Viewport, but constants for World
    const vpW = typeof window !== 'undefined' ? window.innerWidth : CANVAS_WIDTH;
    const vpH = typeof window !== 'undefined' ? window.innerHeight : CANVAS_HEIGHT;
    
    this.reset(true, GameMode.SURVIVAL, vpW, vpH); 
    
    // --- INSTANTIATE MANAGERS (With Dependency Injection) ---
    this.saveManager = new SaveManager(this);
    this.shopManager = new ShopManager(this);
    
    this.spaceshipManager = new SpaceshipManager(() => this.state, this.eventBus, this.statManager);
    
    this.fxManager = new FXManager(() => this.state, this.eventBus);
    
    this.projectileManager = new ProjectileManager(() => this.state, this.eventBus, this.dataManager);
    
    // Pass DataManager to EnemyManager
    this.enemyManager = new EnemyManager(this, this.eventBus, this.statManager, this.dataManager);
    
    // Pass DataManager to PlayerManager
    this.playerManager = new PlayerManager(() => this.state, this.eventBus, this.inputManager, this.statManager, this.dataManager);
    
    this.defenseManager = new DefenseManager(() => this.state, this.eventBus, this.physics.spatialGrid, this.statManager);
    
    this.missionManager = new MissionManager(this);
    this.galaxyManager = new GalaxyManager(this);
    
    this.setupEventListeners();

    this.state.appMode = AppMode.START_MENU;
    this.state.saveSlots = this.saveManager.loadSavesFromStorage();
  }

  // ... (Rest of the file remains largely unchanged, just ensuring WEAPONS usage is replaced in reset if necessary, though WEAPONS usage in reset is minimal for initialization)
  
  // Need to update reset() because it accesses WEAPONS for initial ammo count
  public resize(width: number, height: number) {
      if (this.state) {
          this.state.viewportWidth = width;
          this.state.viewportHeight = height;
          
          if (this.state.appMode === AppMode.EXPLORATION_MAP || this.state.appMode === AppMode.START_MENU) {
              this.state.worldWidth = width;
              this.state.worldHeight = height;
          }
          
          if (this.physics) {
              this.physics.resize(this.state.worldWidth, this.state.worldHeight);
          }
      }
  }

  public registerLoopListener(cb: (dt: number, time: number) => void) { this.loopListeners.add(cb); }
  public unregisterLoopListener(cb: (dt: number, time: number) => void) { this.loopListeners.delete(cb); }
  public notifyUI(reason?: string) { this.eventBus.emit(GameEventType.UI_UPDATE, { reason }); }
  public closeShop() { this.state.isShopOpen = false; this.notifyUI('SHOP_CLOSE'); }

  private setupEventListeners() {
      // Data-Driven Audio Mapping
      this.eventBus.on<PlaySoundEvent>(GameEventType.PLAY_SOUND, (e) => {
          switch (e.type) {
              case 'WEAPON': this.audio.play(`WEAPON_${e.variant}`, e.x, e.y); break;
              case 'RELOAD': this.audio.play(`RELOAD_${e.variant}`, e.x, e.y); break;
              case 'TURRET': this.audio.play(`TURRET_${e.variant}`, e.x, e.y); break;
              case 'ALLY': this.audio.play('ALLY_SHOOT', e.x, e.y); break;
              case 'EXPLOSION': this.audio.play('EXPLOSION', e.x, e.y); break;
              case 'GRENADE': case 'GRENADE_THROW': this.audio.play('GRENADE_THROW', e.x, e.y); break;
              case 'ENEMY_DEATH': this.audio.play(e.variant ? 'BOSS_DEATH' : 'ENEMY_DEATH', e.x, e.y); break;
              case 'VIPER_SHOOT': this.audio.play('VIPER_SHOOT', e.x, e.y); break;
              case 'MELEE_HIT': this.audio.play('MELEE_HIT', e.x, e.y); break;
              case 'BASE_DAMAGE': this.audio.play('BASE_DAMAGE', e.x, e.y); break;
              case 'BULLET_HIT': this.audio.play('BULLET_HIT', e.x, e.y); break;
              case 'ORBITAL_STRIKE': this.audio.play('ORBITAL_STRIKE', e.x, e.y); break;
              case 'BOSS_DEATH': this.audio.play('BOSS_DEATH', e.x, e.y); break;
          }
      });

      this.eventBus.on<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, (e) => { this.playerManager.damagePlayer(e.amount); });
      this.eventBus.on<DamageBaseEvent>(GameEventType.DAMAGE_BASE, (e) => { this.damageBase(e.amount); });
      this.eventBus.on<DamageAreaEvent>(GameEventType.DAMAGE_AREA, (e) => { this.damageArea(e.x, e.y, e.radius, e.damage, e.source); });
      this.eventBus.on<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, (e) => { this.addMessage(e.text, e.x, e.y, e.color, e.type, e.time); });
      this.eventBus.on(GameEventType.MISSION_COMPLETE, () => { this.completeMission(); });
      this.eventBus.on(GameEventType.PLAYER_SWITCH_WEAPON, () => this.notifyUI('WEAPON_SWITCH'));
      this.eventBus.on(GameEventType.SHOP_PURCHASE, () => this.notifyUI('SHOP_ACTION'));
      this.eventBus.on(GameEventType.SHOP_SWAP_LOADOUT, () => this.notifyUI('SHOP_ACTION'));
      this.eventBus.on(GameEventType.SHOP_EQUIP_MODULE, () => this.notifyUI('EQUIP'));
      this.eventBus.on(GameEventType.SHOP_UNEQUIP_MODULE, () => this.notifyUI('EQUIP'));
  }

  public t(key: string, params?: Record<string, any>): string {
      const lang = this.state.settings.language;
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key];
      if (str === undefined) str = (TRANSLATIONS.EN as any)[key] || key;
      if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
      return str;
  }

  public handleInput(code: string, isDown: boolean) {
      const action = isDown ? this.inputManager.handleKeyDown(code) : this.inputManager.handleKeyUp(code);
      if (isDown && action && this.state.appMode === AppMode.GAMEPLAY) {
          switch (action) {
              case UserAction.WEAPON_1: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 0 }); break;
              case UserAction.WEAPON_2: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 1 }); break;
              case UserAction.WEAPON_3: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 2 }); break;
              case UserAction.WEAPON_4: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 3 }); break;
              case UserAction.TACTICAL_MENU: if (!this.state.isPaused && !this.state.isShopOpen && !this.state.isInventoryOpen) this.toggleTacticalMenu(); break;
              case UserAction.ORDER_1: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'PATROL' }); this.toggleTacticalMenu(); } break;
              case UserAction.ORDER_2: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'FOLLOW' }); this.toggleTacticalMenu(); } break;
              case UserAction.ORDER_3: if (this.state.isTacticalMenuOpen) { this.eventBus.emit(GameEventType.DEFENSE_ISSUE_ORDER, { order: 'ATTACK' }); this.toggleTacticalMenu(); } break;
              case UserAction.INVENTORY: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isShopOpen) this.toggleInventory(); break;
              case UserAction.SHOP: 
                  if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) {
                      const p = this.state.player;
                      const bases = [this.state.base];
                      if (this.state.secondaryBase) bases.push(this.state.secondaryBase);
                      let canOpen = false;
                      for (const base of bases) {
                          const dist = Math.sqrt(Math.pow(p.x - base.x, 2) + Math.pow(p.y - base.y, 2));
                          if (dist < 300) { canOpen = true; break; }
                      }
                      if (canOpen || this.state.isShopOpen) { 
                          if (this.state.isShopOpen) this.closeShop(); 
                          else { this.state.isShopOpen = true; this.notifyUI('SHOP_OPEN'); }
                      }
                  }
                  break;
              case UserAction.INTERACT: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen && !this.state.activeTurretId) { this.eventBus.emit(GameEventType.DEFENSE_INTERACT, {}); this.notifyUI('INTERACT'); } break;
              case UserAction.SKIP_WAVE: if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) { if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) return; this.skipWave(); } break;
              case UserAction.PAUSE: 
                  if (!this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && this.state.activeTurretId === undefined) {
                      if (this.state.isShopOpen) { this.closeShop(); } else { this.togglePause(); }
                  }
                  break;
              case UserAction.ESCAPE: 
                  let updated = false;
                  if (this.state.isShopOpen) { this.closeShop(); updated = true; }
                  if (this.state.isTacticalMenuOpen) { this.toggleTacticalMenu(); updated = true; }
                  if (this.state.isInventoryOpen) { this.toggleInventory(); updated = true; }
                  if (this.state.activeTurretId !== undefined) { this.eventBus.emit(GameEventType.DEFENSE_CLOSE_MENU, {}); updated = true; } 
                  if (this.state.isPaused && !updated && this.state.activeTurretId === undefined) { this.togglePause(); updated = true; }
                  if (updated) this.notifyUI('ESCAPE');
                  break;
              case UserAction.GRENADE: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) this.eventBus.emit(GameEventType.PLAYER_THROW_GRENADE, {}); break;
              case UserAction.RELOAD: if (!this.state.isPaused) this.eventBus.emit(GameEventType.PLAYER_RELOAD, { time: this.time.now }); break;
          }
      }
  }

  // ... (loadSettings, persistSettings methods)

  private loadSettings(): GameSettings {
      const defaultSettings: GameSettings = { showHUD: true, showBlood: true, showDamageNumbers: true, language: 'CN', lightingQuality: 'HIGH', particleIntensity: 'HIGH', animatedBackground: true, performanceMode: 'BALANCED', resolutionScale: 1.0, showShadows: true };
      try { const raw = localStorage.getItem('VANGUARD_SETTINGS_V1'); if (raw) { const parsed = JSON.parse(raw); return { ...defaultSettings, ...parsed }; } } catch (e) { console.error("Failed to load settings:", e); }
      return defaultSettings;
  }
  private persistSettings() { if (this.state && this.state.settings) localStorage.setItem('VANGUARD_SETTINGS_V1', JSON.stringify(this.state.settings)); }

  public reset(fullReset: boolean = false, mode: GameMode = GameMode.SURVIVAL, customViewportW?: number, customViewportH?: number) {
    this.audio.stopAmbience();
    const isCampaign = mode === GameMode.CAMPAIGN;
    
    // Viewport Size (What the user sees)
    const vpW = customViewportW || (typeof window !== 'undefined' ? window.innerWidth : CANVAS_WIDTH);
    const vpH = customViewportH || (typeof window !== 'undefined' ? window.innerHeight : CANVAS_HEIGHT);

    // World Size (The play area) - Strictly defined by mode
    let w = WORLD_WIDTH; 
    let h = WORLD_HEIGHT;

    if (isCampaign) {
        w = CAMPAIGN_WIDTH;
        h = CAMPAIGN_HEIGHT;
    }
    
    if (this.physics) {
        this.physics.resize(w, h);
    }
    
    // Position entities relative to the FIXED World Size, not the screen size
    let basePos = { x: w / 2, y: h - 150 };
    let playerPos = { x: w / 2, y: h - 300 };
    
    if (isCampaign) {
        const cx = w / 2;
        const cy = h / 2;
        basePos = { x: cx, y: cy }; 
        playerPos = { x: cx, y: cy + 150 };
    }

    // GENERATE PLANETS FOR MAP VIEW (Use Viewport dimensions to ensure they are visible on map)
    const existingPlanets = !fullReset && this.state?.planets ? this.state.planets : generatePlanets(undefined, vpW, vpH);
    existingPlanets.forEach(p => { if (!p.buildings) p.buildings = []; });
    
    const existingSaveSlots = !fullReset && this.state?.saveSlots ? this.state.saveSlots : [];
    
    const existingSpaceship = !fullReset && this.state?.spaceship ? this.state.spaceship : { 
        installedModules: [], 
        orbitalUpgradeTree: [], 
        orbitalDamageMultiplier: 1, 
        orbitalRateMultiplier: 1, 
        carapaceGrid: null, 
        infrastructureUpgrades: [], 
        infrastructureOptions: [], 
        infrastructureLocked: false, 
        bioNodes: [], 
        bioResources: { [BioResource.ALPHA]: 0, [BioResource.BETA]: 0, [BioResource.GAMMA]: 0 }, 
        bioTasks: [], 
        activeBioTask: null,
        heroicNodes: [], // Init empty
        snakeRewardClaimed: false
    };
    
    let currentSettings: GameSettings;
    if (!fullReset && this.state?.settings) currentSettings = this.state.settings; else currentSettings = this.loadSettings();

    const initialWeapons: Record<string, WeaponState> = {};
    Object.values(WeaponType).forEach(type => { 
        // USE DATAMANAGER HERE
        const stats = this.dataManager.getWeaponStats(type);
        initialWeapons[type] = { type, ammoInMag: stats.magSize, ammoReserve: INITIAL_AMMO[type], lastFireTime: 0, reloading: false, reloadStartTime: 0, modules: [], consecutiveShots: 0 }; 
    });
    
    let initialTurretSpots = [];
    if (isCampaign) {
        const offsets = [
            { x: 0, y: -180 }, { x: 0, y: 180 },
            { x: -220, y: 0 }, { x: 220, y: 0 },
            { x: -150, y: -150 }, { x: 150, y: -150 },
            { x: -150, y: 150 }, { x: 150, y: 150 }
        ];
        initialTurretSpots = offsets.map((pos, idx) => ({ id: idx, x: basePos.x + pos.x, y: basePos.y + pos.y }));
    } else {
        initialTurretSpots = TURRET_POSITIONS.map((pos, idx) => ({ id: idx, x: basePos.x + pos.x, y: basePos.y + pos.y }));
    }

    const terrain = generateTerrain(PlanetVisualType.BARREN, 'BARREN' as any, w, h);
    const sectorName = !fullReset && this.state?.sectorName ? this.state.sectorName : generateSectorName();

    const initialAppMode = mode === GameMode.EXPLORATION ? AppMode.EXPLORATION_MAP : AppMode.GAMEPLAY;

    this.state = {
      appMode: initialAppMode, gameMode: mode, sectorName, planets: existingPlanets, currentPlanet: null, selectedPlanetId: null, savedPlayerState: null, spaceship: existingSpaceship, orbitalSupportTimer: 0, saveSlots: existingSaveSlots, activeGalacticEvent: null, pendingYieldReport: null,
      worldWidth: w, worldHeight: h,
      viewportWidth: vpW, viewportHeight: vpH,
      baseDrop: null,
      camera: { x: 0, y: 0 },
      player: { id: 'player', x: playerPos.x, y: playerPos.y, radius: 15, angle: -Math.PI / 2, color: '#3B82F6', hp: PLAYER_STATS.maxHp, maxHp: PLAYER_STATS.maxHp, armor: PLAYER_STATS.maxArmor, maxArmor: PLAYER_STATS.maxArmor, speed: PLAYER_STATS.speed, lastHitTime: 0, weapons: initialWeapons as Record<WeaponType, WeaponState>, loadout: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL], inventory: new Array(INVENTORY_SIZE).fill(null), upgrades: [], freeModules: [], grenadeModules: [], currentWeaponIndex: 0, grenades: PLAYER_STATS.maxGrenades, score: PLAYER_STATS.initialScore, isAiming: false },
      base: { x: basePos.x, y: basePos.y, width: BASE_STATS.width, height: BASE_STATS.height, hp: BASE_STATS.maxHp, maxHp: BASE_STATS.maxHp, },
      secondaryBase: undefined,
      terrain, bloodStains: [], enemies: [], allies: [], projectiles: [], particles: [], orbitalBeams: [], turretSpots: initialTurretSpots, toxicZones: [],
      
      // New Sub-States
      wave: {
          index: 1,
          timer: 30000,
          duration: 30000,
          spawnTimer: 0,
          pendingCount: 17,
          spawnedCount: 0,
          totalCount: 99999,
          activeEvent: SpecialEventType.NONE
      },
      campaign: {
          pustuleTimer: 0,
          nextPustuleSpawnTime: 65000 + Math.random() * 130000,
          bossTimer: 0,
          bossHp: 4000000
      },
      
      lastAllySpawnTime: 0,
      isGameOver: false, missionComplete: false, isPaused: false, isTacticalMenuOpen: false, isInventoryOpen: false, isShopOpen: false, floatingTexts: [],
      settings: currentSettings, stats: { shotsFired: 0, shotsHit: 0, damageDealt: 0, damageBySource: { [DamageSource.PLAYER]: 0, [DamageSource.TURRET]: 0, [DamageSource.ALLY]: 0, [DamageSource.ORBITAL]: 0, [DamageSource.ENEMY]: 0 }, killsByType: { [EnemyType.GRUNT]: 0, [EnemyType.RUSHER]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 0, [EnemyType.VIPER]: 0, [EnemyType.PUSTULE]: 0, [EnemyType.TUBE_WORM]: 0, 'BOSS': 0 }, encounteredEnemies: [] },
      time: 0
    };

    if (isCampaign) {
        this.state.wave.timer = 0;
        this.state.wave.index = 0;
        this.state.wave.pendingCount = 0;
        this.state.base.maxHp *= 2; 
        this.state.base.hp = this.state.base.maxHp;
    }

    if (!fullReset) { if (this.spaceshipManager) this.spaceshipManager.registerModifiers(); }
    
    this.lastTime = 0;
    this.accumulator = 0;
    this.time.sync(performance.now());
    
    this.notifyUI('RESET');
  }

  public update(time: number) {
    if (this.lastTime === 0) { 
        this.lastTime = time; 
        this.time.sync(time); 
        return; 
    }
    
    let frameTime = time - this.lastTime;
    this.lastTime = time;
    
    if (frameTime > 250) frameTime = 250;

    this.loopListeners.forEach(cb => cb(frameTime, time));

    if (this.state.isPaused || this.state.isShopOpen || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) {
        return;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.FIXED_STEP) {
        this.time.advance(this.FIXED_STEP);
        this.fixedUpdate(this.FIXED_STEP);
        this.accumulator -= this.FIXED_STEP;
    }
  }

  // ... (fixedUpdate, spawnProjectile, etc. delegates unchanged but context of wrapper class)
  private fixedUpdate(dt: number) {
    const timeScale = 1.0; 
    this.state.time += dt;

    if (this.state.baseDrop && this.state.baseDrop.active) {
        const bd = this.state.baseDrop;
        if (bd.phase === 'ENTRY') {
            const dist = bd.targetY - bd.y;
            const retroBurnHeight = 600;

            if (dist > retroBurnHeight) {
                bd.velocity += 0.5 * timeScale;
                if (bd.velocity > 45) bd.velocity = 45;
                if (Math.random() < 0.4) {
                    this.spawnParticle(this.state.base.x + (Math.random()-0.5)*90, bd.y - 60, '#f97316', 2, 20);
                }
            } 
            else {
                bd.velocity -= 1.8 * timeScale;
                if (bd.velocity < 15) bd.velocity = 15;
                if (Math.random() < 0.8) {
                     const bx = this.state.base.x;
                     this.spawnParticle(bx - 40, bd.y + 50, '#60a5fa', 1, 15);
                     this.spawnParticle(bx - 20, bd.y + 50, '#93c5fd', 1, 15);
                     this.spawnParticle(bx + 40, bd.y + 50, '#60a5fa', 1, 15);
                     this.spawnParticle(bx + 20, bd.y + 50, '#93c5fd', 1, 15);
                }
            }

            bd.y += bd.velocity * timeScale;

            if (bd.y >= bd.targetY) {
                bd.y = bd.targetY;
                bd.phase = 'IMPACT';
                this.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: this.state.base.x, y: bd.targetY });
                for(let i=0; i<30; i++) {
                    const a = Math.random() * Math.PI;
                    const s = 10 + Math.random() * 20;
                    this.spawnParticle(this.state.base.x, bd.targetY, '#94a3b8', 1, s);
                }
                this.damageArea(this.state.base.x, bd.targetY, 350, 2000, DamageSource.ORBITAL);
                setTimeout(() => { 
                    if(this.state.baseDrop) this.state.baseDrop.phase = 'DEPLOY'; 
                }, 800);
            }
        } else if (bd.phase === 'DEPLOY') {
            bd.deployTimer += dt;
            if (bd.deployTimer < 1000 && Math.random() < 0.2) {
                 this.spawnParticle(this.state.base.x + (Math.random()-0.5)*100, this.state.base.y - 20, '#ffffff', 1, 2);
            }
            if (bd.deployTimer > 2000) {
                bd.active = false;
                this.state.player.x = this.state.base.x;
                this.state.player.y = this.state.base.y + 50; 
                this.spawnParticle(this.state.player.x, this.state.player.y, '#3b82f6', 20, 5);
                this.addMessage("OPERATIVE DEPLOYED", this.state.player.x, this.state.player.y - 60, '#3b82f6', FloatingTextType.SYSTEM);
            }
        }
    }

    this.physics.update(dt);
    this.missionManager.update(dt);

    const floatingTexts = this.state.floatingTexts;
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const m = floatingTexts[i];
        m.life -= dt;
        m.x += m.vx * timeScale;
        m.y += m.vy * timeScale;
        if (m.type === FloatingTextType.DAMAGE || m.type === FloatingTextType.CRIT) { m.vx *= 0.92; m.vy *= 0.92; } 
        else if (m.type === FloatingTextType.LOOT) { m.vy -= 0.05 * timeScale; } 
        else { m.vy = -0.5 * timeScale; }
        if (m.life <= 0) { this.floatingTextPool.push(m); floatingTexts[i] = floatingTexts[floatingTexts.length - 1]; floatingTexts.pop(); }
    }

    this.spaceshipManager.update(dt);
    
    if (!this.state.baseDrop || !this.state.baseDrop.active) {
        this.playerManager.update(dt, this.time.now, timeScale);
    }
    
    this.projectileManager.update(dt, timeScale);
    this.enemyManager.update(dt, timeScale);
    this.defenseManager.update(dt, this.time.now, timeScale);
    this.fxManager.update(dt, timeScale);

    // Camera Logic
    const vw = this.state.viewportWidth;
    const vh = this.state.viewportHeight;
    const ww = this.state.worldWidth;
    const wh = this.state.worldHeight;

    const targetCamX = this.state.player.x - vw / 2;
    const targetCamY = this.state.player.y - vh / 2;

    if (ww < vw) {
        this.state.camera.x = -(vw - ww) / 2;
    } else {
        this.state.camera.x = Math.max(0, Math.min(targetCamX, ww - vw));
    }

    if (wh < vh) {
        this.state.camera.y = -(vh - wh) / 2;
    } else {
        let maxY = wh - vh;
        let y = Math.max(0, Math.min(targetCamY, maxY));
        
        if (this.state.baseDrop && this.state.baseDrop.active) {
            const baseCamY = this.state.baseDrop.y - vh / 2;
            y = Math.max(0, Math.min(baseCamY, maxY));
        }
        
        this.state.camera.y = y;
    }
    
    this.audio.updateCamera(this.state.camera.x, this.state.camera.y, vw);
  }

  // ... (Exposed Delegates unchanged)
  // --- Exposed Delegates ---
  public deployToPlanet(id: string) { this.galaxyManager.deployToPlanet(id); this.notifyUI('DEPLOY'); }
  public constructBuilding(planetId: string, type: PlanetBuildingType, slotIndex: number) { this.galaxyManager.constructBuilding(planetId, type, slotIndex); this.notifyUI('CONSTRUCT'); }
  public completeMission() { 
      this.state.missionComplete = true;
      this.state.isPaused = true;
      if (this.state.currentPlanet) { const pIdx = this.state.planets.findIndex(p => p.id === this.state.currentPlanet?.id); if (pIdx !== -1) { this.state.planets[pIdx].completed = true; } }
      if (this.state.spaceship.infrastructureLocked) { this.state.spaceship.infrastructureLocked = false; this.state.spaceship.infrastructureOptions = []; }
      const yieldItems = this.galaxyManager.calculateYields();
      const totalYield = yieldItems.reduce((sum, item) => sum + item.total, 0);
      if (totalYield > 0) { this.state.pendingYieldReport = { items: yieldItems, totalYield }; } else { this.state.pendingYieldReport = null; }
      this.notifyUI('MISSION_COMPLETE');
  }
  public claimYields() { if (this.state.pendingYieldReport) { this.state.player.score += this.state.pendingYieldReport.totalYield; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.state.pendingYieldReport = null; } this.finalizeMissionReturn(); }
  private finalizeMissionReturn() { this.state.appMode = AppMode.EXPLORATION_MAP; this.galaxyManager.triggerGalacticEvent(); this.audio.stopAmbience(); this.notifyUI('RETURN_MAP'); }
  public skipWave() { this.missionManager.skipWave(); this.notifyUI('WAVE_UPDATE'); }
  public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) { this.enemyManager.damageEnemy(enemy, amount, source); }
  public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange?: number, source: DamageSource = DamageSource.ENEMY, activeModules?: WeaponModule[]) { this.eventBus.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, { x, y, targetX: tx, targetY: ty, speed, damage: dmg, fromPlayer, color, homingTargetId: homingTarget, isHoming, createsToxicZone, maxRange, source, activeModules }); }
  public spawnParticle(x: number, y: number, color: string, count: number, speed: number) { this.eventBus.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x, y, color, count, speed }); }
  
  public damageBase(amount: number) { 
      this.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BASE_DAMAGE' }); 
      if (this.state.base.hp <= 0) { 
          this.state.isGameOver = true; 
          this.state.isPaused = true; 
          this.notifyUI('GAME_OVER'); 
      } 
  }
  
  public damageArea(x: number, y: number, radius: number, damage: number, source: DamageSource = DamageSource.PLAYER) {
      this.aoeCache.length = 0;
      this.physics.spatialGrid.query(x, y, radius, this.aoeCache);
      for (const e of this.aoeCache) {
          const dSq = (e.x - x)**2 + (e.y - y)**2;
          if (dSq < radius * radius) { this.damageEnemy(e, damage, source); }
      }
  }

  public toggleTacticalMenu() { this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen; this.notifyUI('TACTICAL_TOGGLE'); }
  public toggleInventory() { this.state.isInventoryOpen = !this.state.isInventoryOpen; this.notifyUI('INVENTORY_TOGGLE'); }
  public togglePause() { this.state.isPaused = !this.state.isPaused; this.notifyUI('PAUSE_TOGGLE'); }
  public toggleSetting(key: keyof GameSettings) { 
      if (key === 'language') { const newLang = this.state.settings.language === 'EN' ? 'CN' : 'EN'; this.state.settings.language = newLang; } 
      else if (key === 'lightingQuality') { this.state.settings.lightingQuality = this.state.settings.lightingQuality === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'particleIntensity') { this.state.settings.particleIntensity = this.state.settings.particleIntensity === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'performanceMode') { const modes: PerformanceMode[] = ['QUALITY', 'BALANCED', 'PERFORMANCE']; const idx = modes.indexOf(this.state.settings.performanceMode || 'BALANCED'); this.state.settings.performanceMode = modes[(idx + 1) % modes.length]; } 
      else if (key === 'resolutionScale') { const cur = this.state.settings.resolutionScale || 1.0; if (cur === 1.0) this.state.settings.resolutionScale = 0.75; else if (cur === 0.75) this.state.settings.resolutionScale = 0.5; else this.state.settings.resolutionScale = 1.0; } 
      else { (this.state.settings as any)[key] = !(this.state.settings as any)[key]; }
      this.persistSettings(); this.notifyUI('SETTING_CHANGE');
  }
  public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType, time: number = 1000) {
      if (!this.state.settings.showDamageNumbers && (type === FloatingTextType.DAMAGE || type === FloatingTextType.CRIT)) return;
      let vx = 0; let vy = -0.5; let size = 12;
      if (type === FloatingTextType.DAMAGE) { vx = (Math.random() - 0.5) * 4; vy = (Math.random() * -2) - 1; time = 600; size = 14; } 
      else if (type === FloatingTextType.CRIT) { vx = (Math.random() - 0.5) * 6; vy = -3; time = 1000; size = 20; } 
      else if (type === FloatingTextType.LOOT) { vx = 0; vy = -1.5; time = 1500; size = 12; } 
      else { vx = 0; vy = -0.2; size = 16; }
      let ft: FloatingText;
      if (this.floatingTextPool.length > 0) { ft = this.floatingTextPool.pop()!; ft.id = `ft-${Date.now()}-${Math.random()}`; ft.text = text; ft.x = x; ft.y = y; ft.vx = vx; ft.vy = vy; ft.color = color; ft.maxLife = time; ft.life = time; ft.type = type; ft.size = size; } 
      else { ft = { id: `ft-${Date.now()}-${Math.random()}`, text, x, y, vx, vy, color, maxLife: time, type, size, life: time }; }
      this.state.floatingTexts.push(ft);
  }
  public saveGame() { this.saveManager.saveGame(); this.notifyUI('SAVE'); }
  public loadGame(id: string) { this.saveManager.loadGame(id); this.notifyUI('LOAD'); }
  public deleteSave(id: string) { this.saveManager.deleteSave(id); this.notifyUI('SAVE_DELETE'); }
  public togglePin(id: string) { this.saveManager.togglePin(id); this.notifyUI('SAVE_PIN'); }
  public exportSave(id: string) { return this.saveManager.exportSaveString(id); }
  public importSave(json: string) { const res = this.saveManager.importSave(json); if(res) this.notifyUI('SAVE_IMPORT'); return res; }
  public enterSurvivalMode() { this.reset(true, GameMode.SURVIVAL); this.notifyUI('MODE_SWITCH'); }
  public enterExplorationMode() { this.reset(true, GameMode.EXPLORATION); this.notifyUI('MODE_SWITCH'); }
  public enterCampaignMode() { this.reset(true, GameMode.CAMPAIGN); this.notifyUI('MODE_SWITCH'); }
  
  public enterSpaceshipView() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.audio.stopAmbience(); this.notifyUI('MODE_SWITCH'); }
  public exitSpaceshipView() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI('MODE_SWITCH'); }
  public enterOrbitalUpgradeMenu() { this.state.appMode = AppMode.ORBITAL_UPGRADES; this.notifyUI('MODE_SWITCH'); }
  public exitOrbitalUpgradeMenu() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterCarapaceGrid() { this.state.appMode = AppMode.CARAPACE_GRID; this.notifyUI('MODE_SWITCH'); }
  public exitCarapaceGrid() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterShipComputer() { this.state.appMode = AppMode.SHIP_COMPUTER; this.notifyUI('MODE_SWITCH'); }
  public exitShipComputer() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterInfrastructureResearch() { this.state.appMode = AppMode.INFRASTRUCTURE_RESEARCH; this.notifyUI('MODE_SWITCH'); }
  public exitInfrastructureResearch() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public enterPlanetConstruction() { this.state.appMode = AppMode.PLANET_CONSTRUCTION; this.notifyUI('MODE_SWITCH'); }
  public exitPlanetConstruction() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI('MODE_SWITCH'); }
  public selectPlanet(id: string | null) { this.state.selectedPlanetId = id; this.notifyUI('PLANET_SELECT'); }
  public closeGalacticEvent() { this.state.activeGalacticEvent = null; this.notifyUI('EVENT_CLOSE'); }
  public enterBioSequencing() { this.state.appMode = AppMode.BIO_SEQUENCING; this.notifyUI('MODE_SWITCH'); }
  public exitBioSequencing() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI('MODE_SWITCH'); }
  public generateBioGrid() { this.spaceshipManager.generateBioGrid(); }
  public conductBioResearch() { this.spaceshipManager.conductBioResearch(); this.notifyUI('BIO_RESEARCH'); }
  public unlockBioNode(nodeId: number) { this.spaceshipManager.unlockBioNode(nodeId); this.notifyUI('BIO_UNLOCK'); }
  public acceptBioTask(taskId: string) { this.spaceshipManager.acceptBioTask(taskId); this.notifyUI('BIO_TASK'); }
  public abortBioTask() { this.spaceshipManager.abortBioTask(); this.notifyUI('BIO_TASK'); }
  public ascendToOrbit() { const wasSuccess = this.state.missionComplete; this.state.missionComplete = false; this.state.isPaused = false; this.state.isGameOver = false; this.state.currentPlanet = null; this.state.selectedPlanetId = null; this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; this.state.turretSpots.forEach(s => s.builtTurret = undefined); if (wasSuccess && this.state.gameMode === GameMode.EXPLORATION) { if (this.state.pendingYieldReport && this.state.pendingYieldReport.totalYield > 0) { this.state.appMode = AppMode.YIELD_REPORT; } else { this.finalizeMissionReturn(); } } else { this.state.appMode = AppMode.EXPLORATION_MAP; this.audio.stopAmbience(); } this.notifyUI('ASCEND'); }
  public emergencyEvac() { this.state.isGameOver = false; this.state.isPaused = false; this.state.appMode = AppMode.EXPLORATION_MAP; this.state.currentPlanet = null; this.state.selectedPlanetId = null; this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; this.audio.stopAmbience(); this.notifyUI('EVAC'); }
  public activateBackdoor() { this.state.player.score += 9999999; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.addMessage("CHEAT ACTIVATED: FUNDS ADDED", this.state.player.x, this.state.player.y, 'yellow', FloatingTextType.SYSTEM); this.notifyUI('CHEAT'); }
  public generateOrbitalUpgradeTree() { this.spaceshipManager.generateOrbitalUpgradeTree(); }
  public purchaseOrbitalUpgrade(nodeId: string) { this.spaceshipManager.purchaseOrbitalUpgrade(nodeId); this.notifyUI('UPGRADE'); }
  public generateCarapaceGrid() { this.spaceshipManager.generateCarapaceGrid(); }
  public purchaseCarapaceNode(row: number, col: number) { this.spaceshipManager.purchaseCarapaceNode(row, col); this.notifyUI('UPGRADE'); }
  public generateInfrastructureOptions() { this.spaceshipManager.generateInfrastructureOptions(); }
  public purchaseInfrastructureUpgrade(optionId: string) { this.spaceshipManager.purchaseInfrastructureUpgrade(optionId); this.notifyUI('UPGRADE'); }
  public equipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.equipModule(target, modId); this.notifyUI('EQUIP'); }
  public unequipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.unequipModule(target, modId); this.notifyUI('EQUIP'); }
  
  // Heroic Zeal Delegates
  public generateHeroicGrid() { this.spaceshipManager.generateHeroicGrid(); }
  public purchaseHeroicNode(id: number) { this.spaceshipManager.purchaseHeroicNode(id); this.notifyUI('UPGRADE'); }
}
