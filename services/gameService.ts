
import { GameState, AppMode, GameMode, GameEventType, FloatingTextType, PlanetBuildingType, GalaxyConfig, UserAction } from '../types';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import { AudioService } from './audioService';
import { TimeManager } from './managers/TimeManager';
import { SaveManager } from './managers/SaveManager';
import { PlayerManager } from './managers/PlayerManager';
import { EnemyManager } from './managers/EnemyManager';
import { ProjectileManager } from './managers/ProjectileManager';
import { FXManager } from './managers/FXManager';
import { ShopManager } from './managers/ShopManager';
import { DefenseManager } from './managers/DefenseManager';
import { SpaceshipManager } from './managers/SpaceshipManager';
import { GalaxyManager } from './managers/GalaxyManager';
import { MissionManager } from './managers/MissionManager';
import { StatManager } from './managers/StatManager';
import { DataManager } from './DataManager';
import { StateBuilder } from './StateBuilder';
import { PhysicsSystem } from './PhysicsSystem';
import { CameraSystem } from './systems/CameraSystem';
import { DropSequenceSystem } from './systems/DropSequenceSystem';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { TRANSLATIONS } from '../data/locales';

export class GameEngine {
    public state: GameState;
    public eventBus: EventBus;
    public inputManager: InputManager;
    public audio: AudioService;
    public time: TimeManager;
    public dataManager: DataManager;
    public statManager: StatManager;

    // Managers
    public playerManager: PlayerManager;
    public enemyManager: EnemyManager;
    public projectileManager: ProjectileManager;
    public fxManager: FXManager;
    public saveManager: SaveManager;
    public shopManager: ShopManager;
    public defenseManager: DefenseManager;
    public spaceshipManager: SpaceshipManager;
    public galaxyManager: GalaxyManager;
    public missionManager: MissionManager;

    // Systems
    public physicsSystem: PhysicsSystem;
    public cameraSystem: CameraSystem;
    public dropSequenceSystem: DropSequenceSystem;

    private loopListeners: ((dt: number, time: number) => void)[] = [];

    constructor() {
        this.eventBus = new EventBus();
        this.inputManager = new InputManager();
        this.audio = new AudioService(this.eventBus);
        this.time = new TimeManager();
        this.dataManager = new DataManager();
        this.statManager = new StatManager();

        const getState = () => this.state;

        // 1. Initialize Managers FIRST so they are available for StateBuilder
        this.fxManager = new FXManager(getState, this.eventBus);
        this.playerManager = new PlayerManager(getState, this.eventBus, this.inputManager, this.statManager, this.dataManager);
        this.projectileManager = new ProjectileManager(getState, this.eventBus, this.dataManager);
        this.spaceshipManager = new SpaceshipManager(getState, this.eventBus, this.statManager);
        
        // These take 'this' (GameEngine) reference
        this.shopManager = new ShopManager(this);
        this.saveManager = new SaveManager(this);
        this.galaxyManager = new GalaxyManager(this);
        this.missionManager = new MissionManager(this);
        this.enemyManager = new EnemyManager(this, this.eventBus, this.statManager, this.dataManager);

        // Dependent Systems
        this.physicsSystem = new PhysicsSystem(getState, this.eventBus, this.statManager, this.dataManager);
        this.defenseManager = new DefenseManager(getState, this.eventBus, this.physicsSystem.spatialGrid, this.statManager);
        this.cameraSystem = new CameraSystem(getState, this.audio);
        this.dropSequenceSystem = new DropSequenceSystem(getState, this.eventBus, this.fxManager);

        // 2. NOW Build Initial State with valid PlayerManager
        // We pass default settings here manually since 'this.state' doesn't exist yet to read from.
        this.state = StateBuilder.build({
            mode: GameMode.SURVIVAL,
            fullReset: true,
            viewportW: typeof window !== 'undefined' ? window.innerWidth : 1200,
            viewportH: typeof window !== 'undefined' ? window.innerHeight : 900,
            playerManager: this.playerManager, // Correctly passed instance
            dataManager: this.dataManager,
            settings: {
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
            }
        });

        // 3. Post-State Initialization
        // CRITICAL: Ensure we start at the Main Menu, not directly in Gameplay
        this.state.appMode = AppMode.START_MENU;

        this.physicsSystem.resize(this.state.worldWidth, this.state.worldHeight);
        this.spaceshipManager.registerModifiers();

        if (typeof window !== 'undefined') {
            this.inputManager.attach(window, (action) => this.handleInputAction(action));
        }
    }

    public handleInputAction(action: UserAction) {
        const state = this.state;

        // --- GLOBAL SYSTEM INPUTS ---
        if (action === UserAction.PAUSE) {
            this.togglePause();
            return;
        }

        if (action === UserAction.ESCAPE) {
            if (state.isShopOpen) { this.closeShop(); return; }
            if (state.isInventoryOpen) { this.toggleInventory(); return; }
            if (state.isTacticalMenuOpen) { this.toggleTacticalMenu(); return; }
            if (state.activeTurretId !== undefined) { this.defenseManager.closeTurretUpgrade(); return; }
            
            if (state.appMode === AppMode.EXPLORATION_MAP && state.selectedPlanetId) {
                this.selectPlanet(null);
                return;
            }
            if (state.appMode === AppMode.GAMEPLAY) {
                this.togglePause();
                return;
            }
            // If in sub-menus (Ship, Tech, etc.), return to hub
            if ([AppMode.SPACESHIP_VIEW, AppMode.ORBITAL_UPGRADES, AppMode.CARAPACE_GRID, AppMode.BIO_SEQUENCING, AppMode.INFRASTRUCTURE_RESEARCH, AppMode.SHIP_COMPUTER].includes(state.appMode)) {
                if (state.appMode === AppMode.SPACESHIP_VIEW) this.exitSpaceshipView();
                else this.enterSpaceshipView();
                return;
            }
            return;
        }

        // --- EXPLORATION MODE INTERACTION ---
        if (state.appMode === AppMode.EXPLORATION_MAP) {
            if (action === UserAction.FIRE) {
                // Raycast for Planet
                // Scale mouse position to internal resolution if resolutionScale is active
                const resScale = state.settings.resolutionScale || 1.0;
                const mx = this.inputManager.mouse.x * resScale;
                const my = this.inputManager.mouse.y * resScale;
                
                let clickedPlanetId: string | null = null;

                // Simple circle hit test
                for (const p of state.planets) {
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    // Add buffer to radius for easier clicking
                    if (dx*dx + dy*dy < (p.radius + 15) ** 2) {
                        clickedPlanetId = p.id;
                        break;
                    }
                }

                if (clickedPlanetId) {
                    this.selectPlanet(clickedPlanetId);
                    this.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
                } else {
                    this.selectPlanet(null);
                }
            }
            return;
        }

        // --- GAMEPLAY INPUTS ---
        if (state.appMode === AppMode.GAMEPLAY) {
            if (state.isPaused || state.isGameOver) return;

            switch(action) {
                case UserAction.INVENTORY: this.toggleInventory(); break;
                case UserAction.TACTICAL_MENU: this.toggleTacticalMenu(); break;
                case UserAction.SHOP: 
                    // Check distance to base
                    if (Math.sqrt((state.player.x - state.base.x)**2 + (state.player.y - state.base.y)**2) < 300) {
                        if (state.isShopOpen) this.closeShop();
                        else {
                            state.isShopOpen = true;
                            this.notifyUI('SHOP_OPEN');
                        }
                    } else {
                        this.addMessage("TOO FAR FROM BASE", state.player.x, state.player.y - 50, 'red', FloatingTextType.SYSTEM);
                    }
                    break;
                case UserAction.INTERACT:
                    this.eventBus.emit(GameEventType.DEFENSE_INTERACT, {});
                    break;
                case UserAction.RELOAD:
                    this.eventBus.emit(GameEventType.PLAYER_RELOAD, { time: this.time.now });
                    break;
                case UserAction.GRENADE:
                    this.eventBus.emit(GameEventType.PLAYER_THROW_GRENADE, {});
                    break;
                case UserAction.WEAPON_1: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 0 }); break;
                case UserAction.WEAPON_2: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 1 }); break;
                case UserAction.WEAPON_3: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 2 }); break;
                case UserAction.WEAPON_4: this.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 3 }); break;
                case UserAction.SKIP_WAVE: this.skipWave(); break;
                case UserAction.ORDER_1: this.defenseManager.issueOrder('PATROL'); this.notifyUI(); break;
                case UserAction.ORDER_2: this.defenseManager.issueOrder('FOLLOW'); this.notifyUI(); break;
                case UserAction.ORDER_3: this.defenseManager.issueOrder('ATTACK'); this.notifyUI(); break;
            }
        }
    }

    public update(time: number) {
        const dt = time - this.time.now;
        if (dt < 0) return; 
        
        this.time.sync(time);
        
        const timeScale = this.state.isPaused ? 0 : 1;
        
        if (!this.state.isPaused) {
            this.playerManager.update(dt, time, timeScale);
            this.enemyManager.update(dt, timeScale);
            this.projectileManager.update(dt, timeScale);
            this.fxManager.update(dt, timeScale);
            this.defenseManager.update(dt, time, timeScale);
            this.physicsSystem.update(dt);
            this.missionManager.update(dt);
            this.spaceshipManager.update(dt);
            this.dropSequenceSystem.update(dt, timeScale);
        }
        
        this.cameraSystem.update(dt);
        
        // Loop listeners
        this.loopListeners.forEach(l => l(dt, time));
    }

    public resize(w: number, h: number) {
        this.state.viewportWidth = w;
        this.state.viewportHeight = h;
    }

    public registerLoopListener(cb: (dt: number, time: number) => void) {
        this.loopListeners.push(cb);
    }

    public unregisterLoopListener(cb: (dt: number, time: number) => void) {
        this.loopListeners = this.loopListeners.filter(l => l !== cb);
    }

    // --- Actions ---

    public t(key: string, params?: Record<string, string | number>): string {
        const lang = this.state?.settings?.language || 'EN';
        // @ts-ignore
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
        // @ts-ignore
        let str = dict[key];
        if (str === undefined) {
            // @ts-ignore
            str = TRANSLATIONS.EN[key] || key;
        }

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    }

    public reset(full: boolean = true, mode: GameMode = GameMode.SURVIVAL) {
        this.state = StateBuilder.build({
            mode,
            fullReset: full,
            viewportW: typeof window !== 'undefined' ? window.innerWidth : 1200,
            viewportH: typeof window !== 'undefined' ? window.innerHeight : 900,
            playerManager: this.playerManager,
            dataManager: this.dataManager,
            currentState: this.state,
            settings: this.state.settings
        });
        
        // Re-link physics grid size
        if (this.physicsSystem) {
            this.physicsSystem.resize(this.state.worldWidth, this.state.worldHeight);
        }
        
        // Re-register stats if spaceship manager exists
        if (this.spaceshipManager) {
            this.spaceshipManager.registerModifiers();
        }
        
        this.eventBus.emit(GameEventType.UI_UPDATE, { reason: 'RESET' });
    }

    public saveGame() { this.saveManager.saveGame(); }
    public loadGame(id: string) { this.saveManager.loadGame(id); }
    public importSave(json: string) { this.saveManager.importSave(json); }
    public exportSave(id: string) { return this.saveManager.exportSaveString(id); }
    public deleteSave(id: string) { this.saveManager.deleteSave(id); }
    public togglePin(id: string) { this.saveManager.togglePin(id); }

    public togglePause() { 
        this.state.isPaused = !this.state.isPaused; 
        this.notifyUI('PAUSE_TOGGLE');
    }

    public toggleInventory() {
        this.state.isInventoryOpen = !this.state.isInventoryOpen;
        this.notifyUI('INVENTORY_TOGGLE');
    }

    public toggleTacticalMenu() {
        this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen;
        this.notifyUI('TACTICAL_TOGGLE');
    }

    public closeShop() {
        this.state.isShopOpen = false;
        this.notifyUI('SHOP_CLOSE');
    }

    public returnToMainMenu() {
        this.state.appMode = AppMode.START_MENU;
        this.state.isPaused = false;
        this.notifyUI('RETURN_MAIN_MENU');
    }

    public enterSurvivalMode() { this.reset(true, GameMode.SURVIVAL); }
    public enterCampaignMode() { this.reset(true, GameMode.CAMPAIGN); }
    public enterExplorationMode() { this.reset(true, GameMode.EXPLORATION); }

    public enterSpaceshipView() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }
    public exitSpaceshipView() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI(); }
    
    public enterOrbitalUpgradeMenu() { this.state.appMode = AppMode.ORBITAL_UPGRADES; this.notifyUI(); }
    public exitOrbitalUpgradeMenu() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }

    public enterCarapaceGrid() { this.state.appMode = AppMode.CARAPACE_GRID; this.notifyUI(); }
    public exitCarapaceGrid() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }

    public enterInfrastructureResearch() { this.state.appMode = AppMode.INFRASTRUCTURE_RESEARCH; this.notifyUI(); }
    public exitInfrastructureResearch() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }

    public enterBioSequencing() { this.state.appMode = AppMode.BIO_SEQUENCING; this.notifyUI(); }
    public exitBioSequencing() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }

    public enterShipComputer() { this.state.appMode = AppMode.SHIP_COMPUTER; this.notifyUI(); }
    public exitShipComputer() { this.state.appMode = AppMode.SPACESHIP_VIEW; this.notifyUI(); }

    public enterPlanetConstruction() { this.state.appMode = AppMode.PLANET_CONSTRUCTION; this.notifyUI(); }
    public exitPlanetConstruction() { this.state.appMode = AppMode.EXPLORATION_MAP; this.notifyUI(); }

    public deployToPlanet(id: string) { this.galaxyManager.deployToPlanet(id); }
    public selectPlanet(id: string | null) { this.state.selectedPlanetId = id; this.notifyUI(); }
    public constructBuilding(planetId: string, type: PlanetBuildingType, slotIndex: number) { this.galaxyManager.constructBuilding(planetId, type, slotIndex); this.notifyUI(); }
    
    public claimYields() { 
        if (this.state.pendingYieldReport) {
            this.state.player.score += this.state.pendingYieldReport.totalYield;
            this.state.pendingYieldReport = null;
            this.state.appMode = AppMode.EXPLORATION_MAP;
            this.notifyUI();
        }
    }
    public closeGalacticEvent() { this.state.activeGalacticEvent = null; this.notifyUI(); }

    public skipWave() { this.missionManager.skipWave(); }
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
        this.notifyUI('EVAC'); 
    }

    public ascendToOrbit() { 
        const wasSuccess = this.state.missionComplete; 
        this.state.missionComplete = false; this.state.isPaused = false; this.state.isGameOver = false; 
        this.state.currentPlanet = null; this.state.selectedPlanetId = null; 
        this.state.enemies = []; this.state.projectiles = []; this.state.allies = []; this.state.toxicZones = []; this.state.bloodStains = []; 
        this.state.turretSpots.forEach(s => s.builtTurret = undefined); 
        if (wasSuccess && this.state.gameMode === GameMode.EXPLORATION) { 
            const yields = this.galaxyManager.calculateYields();
            if (yields.length > 0) {
                const total = yields.reduce((a,b) => a + b.total, 0);
                this.state.pendingYieldReport = { items: yields, totalYield: total };
                this.state.appMode = AppMode.YIELD_REPORT; 
            } else {
                this.state.appMode = AppMode.EXPLORATION_MAP;
            }
            if (this.state.currentPlanet) this.state.currentPlanet.completed = true;
            this.galaxyManager.triggerGalacticEvent();
        } else { 
            this.state.appMode = AppMode.EXPLORATION_MAP; 
        } 
        this.notifyUI('ASCEND'); 
    }

    public completeMission() {
        this.state.missionComplete = true;
        this.saveManager.addHistoryEntry({
            mode: this.state.gameMode,
            result: 'VICTORY',
            details: this.state.gameMode === GameMode.EXPLORATION ? this.state.currentPlanet?.name || "Unknown World" : `Wave ${this.state.wave.index}`,
            score: Math.floor(this.state.player.score)
        });
        this.notifyUI('MISSION_COMPLETE');
    }

    public activateBackdoor() { 
        this.state.player.score += 99999999; 
        this.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 }); 
        this.addMessage("CHEAT ACTIVATED", this.state.player.x, this.state.player.y, 'yellow', FloatingTextType.SYSTEM); 
        this.notifyUI('CHEAT'); 
    }

    public generateOrbitalUpgradeTree() { this.spaceshipManager.generateOrbitalUpgradeTree(); }
    public purchaseOrbitalUpgrade(nodeId: string) { this.spaceshipManager.purchaseOrbitalUpgrade(nodeId); this.notifyUI('UPGRADE'); }
    public generateCarapaceGrid() { this.spaceshipManager.generateCarapaceGrid(); }
    public purchaseCarapaceNode(r: number, c: number) { this.spaceshipManager.purchaseCarapaceNode(r,c); this.notifyUI(); }
    public generateInfrastructureOptions() { this.spaceshipManager.generateInfrastructureOptions(); }
    public purchaseInfrastructureUpgrade(id: string) { this.spaceshipManager.purchaseInfrastructureUpgrade(id); this.notifyUI(); }
    public generateBioGrid() { this.spaceshipManager.generateBioGrid(); }
    public conductBioResearch() { this.spaceshipManager.conductBioResearch(); this.notifyUI(); }
    public unlockBioNode(id: number) { this.spaceshipManager.unlockBioNode(id); this.notifyUI(); }
    public acceptBioTask(id: string) { this.spaceshipManager.acceptBioTask(id); this.notifyUI(); }
    public abortBioTask() { this.spaceshipManager.abortBioTask(); this.notifyUI(); }
    public generateHeroicGrid() { this.spaceshipManager.generateHeroicGrid(); }
    public purchaseHeroicNode(id: number) { this.spaceshipManager.purchaseHeroicNode(id); this.notifyUI(); }

    public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType) {
        this.fxManager.addFloatingText(text, x, y, color, type);
    }

    public notifyUI(reason?: string) {
        this.eventBus.emit(GameEventType.UI_UPDATE, { reason });
    }

    public toggleSetting<K extends keyof import('../types').GameSettings>(key: K) {
        if (typeof this.state.settings[key] === 'boolean') {
            (this.state.settings as any)[key] = !this.state.settings[key];
        } else if (key === 'language') {
            this.state.settings.language = this.state.settings.language === 'EN' ? 'CN' : 'EN';
        } else if (key === 'lightingQuality') {
            this.state.settings.lightingQuality = this.state.settings.lightingQuality === 'HIGH' ? 'LOW' : 'HIGH';
        } else if (key === 'performanceMode') {
            const modes = ['QUALITY', 'BALANCED', 'PERFORMANCE'];
            const idx = modes.indexOf(this.state.settings.performanceMode);
            this.state.settings.performanceMode = modes[(idx + 1) % 3] as any;
        } else if (key === 'resolutionScale') {
            const scales = [1.0, 0.75, 0.5];
            const idx = scales.indexOf(this.state.settings.resolutionScale || 1.0);
            this.state.settings.resolutionScale = scales[(idx + 1) % 3];
        }
        this.notifyUI('SETTING_CHANGE');
    }
}
