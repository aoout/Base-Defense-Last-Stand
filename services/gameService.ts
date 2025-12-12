
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
import { DataManager } from './DataManager'; 
import { TRANSLATIONS } from '../data/locales';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import { StateBuilder } from './StateBuilder';

// NEW SYSTEMS
import { CameraSystem } from './systems/CameraSystem';
import { DropSequenceSystem } from './systems/DropSequenceSystem';

export class GameEngine {
  state!: GameState;
  inputManager: InputManager;
  audio: AudioService;
  eventBus: EventBus;
  statManager: StatManager;
  dataManager: DataManager; 
  
  // Systems
  physics: PhysicsSystem;
  cameraSystem: CameraSystem;
  dropSystem: DropSequenceSystem;

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
    this.dataManager = new DataManager(); 
    
    // Initialize Core Systems
    this.time = new TimeManager();
    
    // Initialize Physics System
    this.physics = new PhysicsSystem(() => this.state, this.eventBus, this.statManager, this.dataManager);

    // --- INSTANTIATE MANAGERS ---
    this.saveManager = new SaveManager(this);
    this.shopManager = new ShopManager(this);
    this.spaceshipManager = new SpaceshipManager(() => this.state, this.eventBus, this.statManager);
    this.fxManager = new FXManager(() => this.state, this.eventBus);
    this.projectileManager = new ProjectileManager(() => this.state, this.eventBus, this.dataManager);
    this.enemyManager = new EnemyManager(this, this.eventBus, this.statManager, this.dataManager);
    this.playerManager = new PlayerManager(() => this.state, this.eventBus, this.inputManager, this.statManager, this.dataManager);
    this.defenseManager = new DefenseManager(() => this.state, this.eventBus, this.spatialGrid, this.statManager);
    this.missionManager = new MissionManager(this);
    this.galaxyManager = new GalaxyManager(this);

    // --- INSTANTIATE LOGIC SYSTEMS (NEW) ---
    this.cameraSystem = new CameraSystem(() => this.state, this.audio);
    this.dropSystem = new DropSequenceSystem(() => this.state, this.eventBus, this.fxManager);

    // Initialize state
    const vpW = typeof window !== 'undefined' ? window.innerWidth : CANVAS_WIDTH;
    const vpH = typeof window !== 'undefined' ? window.innerHeight : CANVAS_HEIGHT;
    
    this.reset(true, GameMode.SURVIVAL, vpW, vpH); 
    
    this.setupEventListeners();

    if (typeof window !== 'undefined') {
        this.inputManager.attach(window, (action) => this.handleAction(action));
        window.addEventListener('game-action', this.handleCustomEvent.bind(this));
    }

    this.state.appMode = AppMode.START_MENU;
    this.state.saveSlots = this.saveManager.loadSavesFromStorage();
  }

  // Getter helper for DefenseManager
  private get spatialGrid() {
      return this.physics.spatialGrid;
  }

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

  private handleCustomEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.type === 'SCAN_SECTOR') {
          this.galaxyManager.scanSector(detail.config);
      }
      this.audio.resume();
  }

  public handleAction(action: UserAction) {
      this.audio.resume();

      if (this.state.appMode === AppMode.EXPLORATION_MAP && action === UserAction.FIRE) {
          const mx = this.inputManager.mouse.x;
          const my = this.inputManager.mouse.y;
          let clickedPlanetId = null;
          for (const p of this.state.planets) {
              const dx = p.x - mx; const dy = p.y - my;
              if (dx * dx + dy * dy < 70 * 70) { clickedPlanetId = p.id; break; }
          }
          this.selectPlanet(clickedPlanetId);
          return;
      }

      if (this.state.appMode !== AppMode.GAMEPLAY) return;

      // Clean Action Dispatch
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
          case UserAction.SHOP: this.handleShopToggle(); break;
          case UserAction.INTERACT: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen && !this.state.activeTurretId) { this.eventBus.emit(GameEventType.DEFENSE_INTERACT, {}); this.notifyUI('INTERACT'); } break;
          case UserAction.SKIP_WAVE: if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) { if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet?.missionType === MissionType.OFFENSE) return; this.skipWave(); } break;
          case UserAction.PAUSE: if (!this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && this.state.activeTurretId === undefined) { if (this.state.isShopOpen) { this.closeShop(); } else { this.togglePause(); } } break;
          case UserAction.ESCAPE: this.handleEscape(); break;
          case UserAction.GRENADE: if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) this.eventBus.emit(GameEventType.PLAYER_THROW_GRENADE, {}); break;
          case UserAction.RELOAD: if (!this.state.isPaused) this.eventBus.emit(GameEventType.PLAYER_RELOAD, { time: this.time.now }); break;
      }
  }

  private handleShopToggle() {
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
  }

  private handleEscape() {
      let updated = false;
      if (this.state.isShopOpen) { this.closeShop(); updated = true; }
      if (this.state.isTacticalMenuOpen) { this.toggleTacticalMenu(); updated = true; }
      if (this.state.isInventoryOpen) { this.toggleInventory(); updated = true; }
      if (this.state.activeTurretId !== undefined) { this.eventBus.emit(GameEventType.DEFENSE_CLOSE_MENU, {}); updated = true; } 
      if (this.state.isPaused && !updated && this.state.activeTurretId === undefined) { this.togglePause(); updated = true; }
      if (updated) this.notifyUI('ESCAPE');
  }

  public t(key: string, params?: Record<string, any>): string {
      const lang = this.state.settings.language;
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key];
      if (str === undefined) str = (TRANSLATIONS.EN as any)[key] || key;
      if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
      return str;
  }

  private loadSettings(): GameSettings {
      const defaultSettings: GameSettings = { 
          showHUD: true, 
          showBlood: true, 
          showDamageNumbers: true, 
          language: 'CN', 
          lightingQuality: 'HIGH', 
          particleIntensity: 'HIGH', 
          animatedBackground: true, 
          performanceMode: 'BALANCED', 
          resolutionScale: 1.0, 
          showShadows: true,
          autoReturnToMenu: false
      };
      try { const raw = localStorage.getItem('VANGUARD_SETTINGS_V1'); if (raw) { const parsed = JSON.parse(raw); return { ...defaultSettings, ...parsed }; } } catch (e) { console.error("Failed to load settings:", e); }
      return defaultSettings;
  }
  private persistSettings() { if (this.state && this.state.settings) localStorage.setItem('VANGUARD_SETTINGS_V1', JSON.stringify(this.state.settings)); }

  public reset(fullReset: boolean = false, mode: GameMode = GameMode.SURVIVAL, customViewportW?: number, customViewportH?: number) {
    this.audio.stopAmbience();
    const viewportW = customViewportW || (typeof window !== 'undefined' ? window.innerWidth : CANVAS_WIDTH);
    const viewportH = customViewportH || (typeof window !== 'undefined' ? window.innerHeight : CANVAS_HEIGHT);

    let currentSettings = !fullReset && this.state?.settings ? this.state.settings : this.loadSettings();

    this.state = StateBuilder.build({
        mode,
        fullReset,
        viewportW,
        viewportH,
        playerManager: this.playerManager,
        dataManager: this.dataManager,
        currentState: this.state,
        settings: currentSettings
    });

    if (this.physics) this.physics.resize(this.state.worldWidth, this.state.worldHeight);
    if (!fullReset) { if (this.spaceshipManager) this.spaceshipManager.registerModifiers(); }
    
    this.lastTime = 0;
    this.accumulator = 0;
    this.time.sync(performance.now());
    this.notifyUI('RESET');
  }

  public update(time: number) {
    if (this.lastTime === 0) { this.lastTime = time; this.time.sync(time); return; }
    
    let frameTime = time - this.lastTime;
    this.lastTime = time;
    if (frameTime > 250) frameTime = 250;

    this.loopListeners.forEach(cb => cb(frameTime, time));

    if (this.state.isPaused || this.state.isShopOpen || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) return;

    this.accumulator += frameTime;
    while (this.accumulator >= this.FIXED_STEP) {
        this.time.advance(this.FIXED_STEP);
        this.fixedUpdate(this.FIXED_STEP);
        this.accumulator -= this.FIXED_STEP;
    }
  }

  // --- MAIN PHYSICS LOOP ---
  private fixedUpdate(dt: number) {
    const timeScale = 1.0; 
    this.state.time += dt;

    // 1. Drop Animation Logic (Delegate)
    this.dropSystem.update(dt, timeScale);

    // 2. Systems Update
    this.physics.update(dt);
    this.missionManager.update(dt);
    this.fxManager.update(dt, timeScale);
    this.spaceshipManager.update(dt);
    
    // 3. Entity Update (Only if dropped)
    if (!this.state.baseDrop || !this.state.baseDrop.active) {
        this.playerManager.update(dt, this.time.now, timeScale);
    }
    
    this.projectileManager.update(dt, timeScale);
    this.enemyManager.update(dt, timeScale);
    this.defenseManager.update(dt, this.time.now, timeScale);

    // 4. Camera Logic (Delegate)
    this.cameraSystem.update(dt);
  }

  // --- EXPOSED DELEGATES ---
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
      
      this.saveManager.addHistoryEntry({
          mode: this.state.gameMode,
          result: 'VICTORY',
          details: this.state.gameMode === GameMode.EXPLORATION ? this.state.currentPlanet?.name || "Unknown World" : `Wave ${this.state.wave.index}`,
          subDetails: this.state.gameMode === GameMode.EXPLORATION ? "PLANET CLEARED" : "SURVIVAL EXTRACT",
          score: Math.floor(this.state.player.score)
      });

      this.notifyUI('MISSION_COMPLETE');
  }
  public claimYields() { if (this.state.pendingYieldReport) { this.state.player.score += this.state.pendingYieldReport.totalYield; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.state.pendingYieldReport = null; } this.finalizeMissionReturn(); }
  private finalizeMissionReturn() { this.state.appMode = AppMode.EXPLORATION_MAP; this.galaxyManager.triggerGalacticEvent(); this.audio.stopAmbience(); this.notifyUI('RETURN_MAP'); }
  public skipWave() { this.missionManager.skipWave(); this.notifyUI('WAVE_UPDATE'); }
  public damageEnemy(enemy: Enemy, amount: number, source: DamageSource) { this.enemyManager.damageEnemy(enemy, amount, source); }
  
  public spawnProjectile(props: SpawnProjectileEvent) { this.eventBus.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, props); }
  public spawnParticle(x: number, y: number, color: string, count: number, speed: number) { this.eventBus.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x, y, color, count, speed }); }
  
  public damageBase(amount: number) { 
      this.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BASE_DAMAGE' }); 
      if (this.state.base.hp <= 0) { 
          this.state.isGameOver = true; 
          this.state.isPaused = true; 
          this.saveManager.addHistoryEntry({
              mode: this.state.gameMode,
              result: 'DEFEAT',
              details: this.state.gameMode === GameMode.EXPLORATION ? this.state.currentPlanet?.name || "Unknown World" : `Wave ${this.state.wave.index}`,
              subDetails: "BASE DESTROYED",
              score: Math.floor(this.state.player.score)
          });
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
      if (key === 'language') { this.state.settings.language = this.state.settings.language === 'EN' ? 'CN' : 'EN'; } 
      else if (key === 'lightingQuality') { this.state.settings.lightingQuality = this.state.settings.lightingQuality === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'particleIntensity') { this.state.settings.particleIntensity = this.state.settings.particleIntensity === 'HIGH' ? 'LOW' : 'HIGH'; } 
      else if (key === 'performanceMode') { const modes: PerformanceMode[] = ['QUALITY', 'BALANCED', 'PERFORMANCE']; const idx = modes.indexOf(this.state.settings.performanceMode || 'BALANCED'); this.state.settings.performanceMode = modes[(idx + 1) % modes.length]; } 
      else if (key === 'resolutionScale') { const cur = this.state.settings.resolutionScale || 1.0; if (cur === 1.0) this.state.settings.resolutionScale = 0.75; else if (cur === 0.75) this.state.settings.resolutionScale = 0.5; else this.state.settings.resolutionScale = 1.0; } 
      else { (this.state.settings as any)[key] = !(this.state.settings as any)[key]; }
      this.persistSettings(); this.notifyUI('SETTING_CHANGE');
  }
  
  public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType, time: number = 1000) { this.fxManager.addFloatingText(text, x, y, color, type, time); }

  public saveGame() { this.saveManager.saveGame(); this.notifyUI('SAVE'); }
  public loadGame(id: string) { this.saveManager.loadGame(id); this.notifyUI('LOAD'); }
  public deleteSave(id: string) { this.saveManager.deleteSave(id); this.notifyUI('SAVE_DELETE'); }
  public togglePin(id: string) { this.saveManager.togglePin(id); this.notifyUI('SAVE_PIN'); }
  public exportSave(id: string) { return this.saveManager.exportSaveString(id); }
  public importSave(json: string) { const res = this.saveManager.importSave(json); if(res) this.notifyUI('SAVE_IMPORT'); return res; }
  public returnToMainMenu() { this.state.appMode = AppMode.START_MENU; this.notifyUI('RETURN_MAIN_MENU'); }
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
  public checkBioTaskProgress(type: EnemyType) { this.spaceshipManager.checkBioTaskProgress(type); }
  
  public ascendToOrbit() { 
      const wasSuccess = this.state.missionComplete; 
      this.state.missionComplete = false; this.state.isPaused = false; this.state.isGameOver = false; 
      this.state.currentPlanet = null; this.state.selectedPlanetId = null; 
      this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; 
      this.state.turretSpots.forEach(s => s.builtTurret = undefined); 
      if (wasSuccess && this.state.gameMode === GameMode.EXPLORATION) { 
          if (this.state.pendingYieldReport && this.state.pendingYieldReport.totalYield > 0) { this.state.appMode = AppMode.YIELD_REPORT; } 
          else { this.finalizeMissionReturn(); } 
      } else { this.state.appMode = AppMode.EXPLORATION_MAP; this.audio.stopAmbience(); } 
      this.notifyUI('ASCEND'); 
  }
  public emergencyEvac() { 
      this.state.isGameOver = false; this.state.isPaused = false; 
      this.saveManager.addHistoryEntry({
          mode: this.state.gameMode,
          result: 'EXTRACTION',
          details: this.state.gameMode === GameMode.EXPLORATION ? this.state.currentPlanet?.name || "Unknown World" : `Wave ${this.state.wave.index}`,
          subDetails: "EMERGENCY EVACUATION",
          score: Math.floor(this.state.player.score)
      });
      this.state.appMode = AppMode.EXPLORATION_MAP; this.state.currentPlanet = null; this.state.selectedPlanetId = null; 
      this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; 
      this.audio.stopAmbience(); this.notifyUI('EVAC'); 
  }
  public activateBackdoor() { this.state.player.score += 9999999; this.audio.play('TURRET_2', this.state.base.x, this.state.base.y); this.addMessage("CHEAT ACTIVATED", this.state.player.x, this.state.player.y, 'yellow', FloatingTextType.SYSTEM); this.notifyUI('CHEAT'); }
  public generateOrbitalUpgradeTree() { this.spaceshipManager.generateOrbitalUpgradeTree(); }
  public purchaseOrbitalUpgrade(nodeId: string) { this.spaceshipManager.purchaseOrbitalUpgrade(nodeId); this.notifyUI('UPGRADE'); }
  public generateCarapaceGrid() { this.spaceshipManager.generateCarapaceGrid(); }
  public purchaseCarapaceNode(row: number, col: number) { this.spaceshipManager.purchaseCarapaceNode(row, col); this.notifyUI('UPGRADE'); }
  public generateInfrastructureOptions() { this.spaceshipManager.generateInfrastructureOptions(); }
  public purchaseInfrastructureUpgrade(optionId: string) { this.spaceshipManager.purchaseInfrastructureUpgrade(optionId); this.notifyUI('UPGRADE'); }
  public equipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.equipModule(target, modId); this.notifyUI('EQUIP'); }
  public unequipModule(target: WeaponType | 'GRENADE', modId: string) { this.shopManager.unequipModule(target, modId); this.notifyUI('EQUIP'); }
  
  public generateHeroicGrid() { this.spaceshipManager.generateHeroicGrid(); }
  public purchaseHeroicNode(id: number) { this.spaceshipManager.purchaseHeroicNode(id); this.notifyUI('UPGRADE'); }
}
