
import { GameEngine } from '../gameService';
import { GameMode, AppMode, GameEventType, FloatingTextType, EnemyKilledEvent } from '../../types';
import { StateBuilder } from '../StateBuilder';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class SessionManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.engine.eventBus.on<EnemyKilledEvent>(GameEventType.ENEMY_KILLED, (e) => {
            this.handleEnemyKill(e);
        });
    }

    private handleEnemyKill(e: EnemyKilledEvent) {
        const state = this.engine.state;
        
        // 1. Award Score
        let finalScore = e.scoreReward;
        
        // 2. Handle Stored Score (Tube Worm mechanics)
        if (e.storedScore && e.storedScore > 0) {
            let geneMultiplier = 1;
            if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet) {
                geneMultiplier = state.currentPlanet.geneStrength;
            }
            const recoveredAmount = Math.floor(e.storedScore * geneMultiplier);
            finalScore += recoveredAmount;

            if (e.storedScore > 50) {
                this.engine.fxManager.addFloatingText(
                    this.engine.t('HOARD_RECOVERED', {0: recoveredAmount}), 
                    e.x, e.y - 20, '#fbbf24', FloatingTextType.LOOT
                );
            }
        }

        state.player.score += finalScore;

        // 3. Update Stats
        if (e.isBoss) state.stats.killsByType['BOSS']++;
        else state.stats.killsByType[e.type]++;
    }

    // --- LIFECYCLE MANAGEMENT ---

    public reset(full: boolean = true, mode: GameMode = GameMode.SURVIVAL) {
        const newState = StateBuilder.build({
            mode,
            fullReset: full,
            viewportW: typeof window !== 'undefined' ? window.innerWidth : 1200,
            viewportH: typeof window !== 'undefined' ? window.innerHeight : 900,
            playerManager: this.engine.playerManager,
            dataManager: this.engine.dataManager,
            currentState: this.engine.state,
            settings: this.engine.state.settings
        });

        this.engine.state = newState;

        if (this.engine.physicsSystem) {
            this.engine.physicsSystem.resize(newState.worldWidth, newState.worldHeight);
        }
        
        if (this.engine.spaceshipManager) {
            this.engine.spaceshipManager.registerModifiers();
        }

        this.engine.eventBus.emit(GameEventType.UI_UPDATE, { reason: 'RESET' });
    }

    public handleGameOver() {
        const state = this.engine.state;
        if (state.isGameOver) return; 
        
        state.isGameOver = true;
        state.isPaused = true;

        const details = state.gameMode === GameMode.EXPLORATION 
            ? state.currentPlanet?.name || "Unknown World" 
            : `Wave ${state.wave.index}`;

        this.engine.saveManager.addHistoryEntry({
            mode: state.gameMode,
            result: 'DEFEAT',
            details: details,
            subDetails: "K.I.A.",
            score: Math.floor(state.player.score)
        });

        this.engine.notifyUI('GAME_OVER');
    }

    public emergencyEvac() {
        const state = this.engine.state;
        state.isGameOver = false; 
        state.isPaused = false; 
        
        this.engine.saveManager.addHistoryEntry({
            mode: state.gameMode,
            result: 'EXTRACTION',
            details: state.gameMode === GameMode.EXPLORATION ? state.currentPlanet?.name || "Unknown World" : `Wave ${state.wave.index}`,
            subDetails: "EMERGENCY EVACUATION",
            score: Math.floor(state.player.score)
        });

        // Reset Scene for Map View
        state.appMode = AppMode.EXPLORATION_MAP; 
        state.currentPlanet = null; 
        state.selectedPlanetId = null; 
        state.enemies = []; 
        state.projectiles = []; 
        state.allies = []; 
        state.toxicZones = []; 
        state.bloodStains = []; 
        
        this.engine.notifyUI('EVAC'); 
    }

    public ascendToOrbit() {
        const state = this.engine.state;
        const wasSuccess = state.missionComplete; 
        
        state.missionComplete = false; 
        state.isPaused = false; 
        state.isGameOver = false; 
        
        // Clear Combat Entities
        state.currentPlanet = null; 
        state.selectedPlanetId = null; 
        state.enemies = []; 
        state.projectiles = []; 
        state.allies = []; 
        state.toxicZones = []; 
        state.bloodStains = []; 
        state.turretSpots.forEach(s => s.builtTurret = undefined); 

        // Yield Calculation or Return
        if (wasSuccess && state.gameMode === GameMode.EXPLORATION) { 
            const yields = this.engine.galaxyManager.calculateYields();
            if (yields.length > 0) {
                const total = yields.reduce((a,b) => a + b.total, 0);
                state.pendingYieldReport = { items: yields, totalYield: total };
                state.appMode = AppMode.YIELD_REPORT; 
            } else {
                state.appMode = AppMode.EXPLORATION_MAP;
            }
            this.engine.galaxyManager.triggerGalacticEvent();
        } else { 
            state.appMode = AppMode.EXPLORATION_MAP; 
        } 
        
        this.engine.notifyUI('ASCEND'); 
    }

    public completeMission() {
        const state = this.engine.state;
        state.missionComplete = true;
        if (state.currentPlanet) {
            state.currentPlanet.completed = true;
        }
        this.engine.saveManager.addHistoryEntry({
            mode: state.gameMode,
            result: 'VICTORY',
            details: state.gameMode === GameMode.EXPLORATION ? state.currentPlanet?.name || "Unknown World" : `Wave ${state.wave.index}`,
            score: Math.floor(state.player.score)
        });
        this.engine.notifyUI('MISSION_COMPLETE');
    }

    public claimYields() { 
        if (this.engine.state.pendingYieldReport) {
            this.engine.state.player.score += this.engine.state.pendingYieldReport.totalYield;
            this.engine.state.pendingYieldReport = null;
            this.setMode(AppMode.EXPLORATION_MAP);
        }
    }

    // --- MODE & UI FLOW ---

    public setMode(mode: AppMode) {
        this.engine.state.appMode = mode;
        this.engine.notifyUI('MODE_SWITCH');
    }

    public togglePause() { 
        this.engine.state.isPaused = !this.engine.state.isPaused; 
        this.engine.notifyUI('PAUSE_TOGGLE');
    }

    public returnToMainMenu() {
        this.engine.state.appMode = AppMode.START_MENU;
        this.engine.state.isPaused = false;
        this.engine.notifyUI('RETURN_MAIN_MENU');
    }

    // --- SETTINGS MANAGEMENT ---

    public toggleSetting<K extends keyof import('../../types').GameSettings>(key: K) {
        const state = this.engine.state;
        if (typeof state.settings[key] === 'boolean') {
            (state.settings as any)[key] = !state.settings[key];
        } else if (key === 'language') {
            state.settings.language = state.settings.language === 'EN' ? 'CN' : 'EN';
        } else if (key === 'lightingQuality') {
            state.settings.lightingQuality = state.settings.lightingQuality === 'HIGH' ? 'LOW' : 'HIGH';
        } else if (key === 'performanceMode') {
            const modes = ['QUALITY', 'BALANCED', 'PERFORMANCE'];
            const idx = modes.indexOf(state.settings.performanceMode);
            state.settings.performanceMode = modes[(idx + 1) % 3] as any;
        } else if (key === 'resolutionScale') {
            const scales = [1.0, 0.75, 0.5];
            const idx = scales.indexOf(state.settings.resolutionScale || 1.0);
            state.settings.resolutionScale = scales[(idx + 1) % 3];
        }
        this.engine.notifyUI('SETTING_CHANGE');
    }

    // --- DEBUG / CHEATS ---

    public activateBackdoor() { 
        this.engine.state.player.score += 99999999; 
        this.engine.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 }); 
        this.engine.fxManager.addFloatingText("CHEAT ACTIVATED", this.engine.state.player.x, this.engine.state.player.y, 'yellow', FloatingTextType.SYSTEM); 
        this.engine.notifyUI('CHEAT'); 
    }
}
