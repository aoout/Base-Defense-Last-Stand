
import { GameState, AppMode, GameMode, GameEventType, FloatingTextType, PlanetBuildingType, GalaxyConfig, UserAction, IGameSystem } from '../types';
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
import { SessionManager } from './managers/SessionManager';
import { DataManager } from './DataManager';
import { StateBuilder } from './StateBuilder';
import { PhysicsSystem } from './PhysicsSystem';
import { CombatSystem } from './systems/CombatEvaluator';
import { CameraSystem } from './systems/CameraSystem';
import { DropSequenceSystem } from './systems/DropSequenceSystem';
import { InputRouter } from './input/InputRouter';
import { TRANSLATIONS } from '../data/locales';

export class GameEngine {
    public state: GameState;
    public eventBus: EventBus;
    public inputManager: InputManager;
    public audio: AudioService;
    public time: TimeManager;
    public dataManager: DataManager;
    public statManager: StatManager;

    // Managers (Publicly accessible for direct usage)
    public sessionManager: SessionManager;
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
    public combatSystem: CombatSystem;
    public cameraSystem: CameraSystem;
    public dropSequenceSystem: DropSequenceSystem;
    
    // Input Router
    public inputRouter: InputRouter;

    private systems: IGameSystem[] = [];
    private loopListeners: ((dt: number, time: number) => void)[] = [];

    constructor() {
        this.eventBus = new EventBus();
        this.inputManager = new InputManager();
        this.audio = new AudioService(this.eventBus);
        this.time = new TimeManager();
        this.dataManager = new DataManager();
        this.statManager = new StatManager();

        // 1. Initialize State Container
        const getState = () => this.state;

        // 2. Initialize Managers
        this.fxManager = new FXManager(getState, this.eventBus);
        this.playerManager = new PlayerManager(getState, this.eventBus, this.inputManager, this.statManager, this.dataManager);
        this.projectileManager = new ProjectileManager(getState, this.eventBus, this.dataManager);
        this.spaceshipManager = new SpaceshipManager(getState, this.eventBus, this.statManager);
        
        // High-level Coordinators
        this.sessionManager = new SessionManager(this);
        this.shopManager = new ShopManager(this);
        this.saveManager = new SaveManager(this);
        this.galaxyManager = new GalaxyManager(this);
        this.missionManager = new MissionManager(this);
        this.enemyManager = new EnemyManager(this, this.eventBus, this.statManager, this.dataManager);

        // Core Systems
        this.physicsSystem = new PhysicsSystem(getState, this.eventBus, this.statManager, this.dataManager);
        this.combatSystem = new CombatSystem(getState, this.statManager, this.eventBus, this.physicsSystem.spatialGrid);
        this.defenseManager = new DefenseManager(getState, this.eventBus, this.physicsSystem.spatialGrid, this.statManager);
        this.cameraSystem = new CameraSystem(getState, this.audio);
        this.dropSequenceSystem = new DropSequenceSystem(getState, this.eventBus, this.fxManager);

        // 3. Register Systems
        this.initializeSystems();

        // 4. Build Initial State
        this.state = StateBuilder.build({
            mode: GameMode.SURVIVAL,
            fullReset: true,
            viewportW: typeof window !== 'undefined' ? window.innerWidth : 1200,
            viewportH: typeof window !== 'undefined' ? window.innerHeight : 900,
            playerManager: this.playerManager,
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

        // 5. Post-Init Setup
        this.state.appMode = AppMode.START_MENU;
        this.physicsSystem.resize(this.state.worldWidth, this.state.worldHeight);
        this.spaceshipManager.registerModifiers();
        
        // 6. Input Routing
        this.inputRouter = new InputRouter(this);
        if (typeof window !== 'undefined') {
            this.inputManager.attach(window, (action) => this.inputRouter.route(action));
        }

        // 7. Event Listeners
        this.eventBus.on(GameEventType.GAME_OVER, () => this.sessionManager.handleGameOver());
    }

    private initializeSystems() {
        this.systems = [
            this.playerManager,
            this.enemyManager,
            this.projectileManager,
            this.fxManager,
            this.defenseManager,
            this.physicsSystem, 
            this.combatSystem, 
            this.missionManager,
            this.spaceshipManager,
            this.dropSequenceSystem
        ];
    }

    public update(realTime: number) {
        // 1. Calculate Real Delta Time
        this.time.update(realTime);
        const dt = this.time.delta;
        
        if (dt < 0 || dt > 1000) return; // Skip invalid frames or huge lag spikes
        
        const shouldUpdateLogic = this.state.appMode === AppMode.GAMEPLAY && !this.state.isPaused;
        const timeScale = shouldUpdateLogic ? 1 : 0;
        
        // 2. Advance Game Time only if logic is running
        if (shouldUpdateLogic) {
            this.time.tickGameTime();
        }

        // 3. Update Systems with correct Time Context
        // Use gameTime for simulation logic (physics, cooldowns)
        // Use realTime for UI animations (handled by React/CSS mostly, but some canvas UI might need it)
        const simTime = this.time.gameTime;

        if (shouldUpdateLogic) {
            for (const system of this.systems) {
                system.update(dt, simTime, timeScale);
            }
            // Update internal state time for persistence
            this.state.time = simTime;
        }
        
        // Camera updates even when paused (for smoothing/shake decay if we had it), 
        // but generally follows player.
        this.cameraSystem.update(dt);
        
        // Loop listeners (e.g. React Hooks) might want RealTime for UI animations
        // or GameTime for gameplay sync. We pass both ideally, but existing signature is (dt, time).
        // We pass realTime here because UI animations usually want to keep playing (like glowing buttons) even if paused.
        this.loopListeners.forEach(l => l(dt, realTime));
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

    // --- UTILS ---

    public t(key: string, params?: Record<string, string | number>): string {
        const lang = this.state?.settings?.language || 'EN';
        // @ts-ignore
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
        // @ts-ignore
        let str = dict[key];
        if (str === undefined) str = TRANSLATIONS.EN[key] || key;
        if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
        return str;
    }

    public addMessage(text: string, x: number, y: number, color: string, type: FloatingTextType) {
        this.fxManager.addFloatingText(text, x, y, color, type);
    }

    public notifyUI(reason?: string) {
        this.eventBus.emit(GameEventType.UI_UPDATE, { reason });
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
    
    public togglePause() {
        this.sessionManager.togglePause();
    }
    
    public skipWave() {
        this.missionManager.skipWave();
    }
    
    public activateBackdoor() {
        this.sessionManager.activateBackdoor();
    }
    
    public selectPlanet(id: string | null) { this.state.selectedPlanetId = id; this.notifyUI(); }
    public deployToPlanet(id: string) { this.galaxyManager.deployToPlanet(id); }
    public constructBuilding(planetId: string, type: PlanetBuildingType, slotIndex: number) { this.galaxyManager.constructBuilding(planetId, type, slotIndex); this.notifyUI(); }
    public claimYields() { this.sessionManager.claimYields(); }
    public closeGalacticEvent() { this.state.activeGalacticEvent = null; this.notifyUI(); }
    public emergencyEvac() { this.sessionManager.emergencyEvac(); }
    public ascendToOrbit() { this.sessionManager.ascendToOrbit(); }
}
