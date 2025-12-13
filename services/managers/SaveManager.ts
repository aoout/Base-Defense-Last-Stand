
import { GameState, SaveFile, PersistentPlayerState, GameMode, AppMode, MissionType, FloatingTextType, WeaponType, CombatRecord, WeaponState } from '../../types';
import { MAX_SAVE_SLOTS, MAX_PINNED_SLOTS, WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { GameEngine } from '../gameService';
import { CURRENT_VERSION } from '../../data/changelog';
import { MigrationService } from '../MigrationService';

export class SaveManager {
    private engine: GameEngine;
    private storageKey = 'BASE_DEFENSE_SAVES_V1';
    private historyKey = 'VANGUARD_HISTORY_V1';

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    // --- SAVE SLOT MANAGEMENT ---

    public loadSavesFromStorage(): SaveFile[] {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : [];
    }

    public persistSaves() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.engine.state.saveSlots));
    }

    private enforceSlotLimit() {
        const slots = this.engine.state.saveSlots;
        const pinned = slots.filter(s => s.isPinned);
        const unpinned = slots.filter(s => !s.isPinned);

        // Sort unpinned by timestamp descending (newest first)
        unpinned.sort((a, b) => b.timestamp - a.timestamp);

        // Calculate how many unpinned we can keep
        const availableSlots = MAX_SAVE_SLOTS - pinned.length;
        
        if (availableSlots < 0) {
            this.engine.state.saveSlots = pinned;
        } else if (unpinned.length > availableSlots) {
            const keptUnpinned = unpinned.slice(0, availableSlots);
            this.engine.state.saveSlots = [...pinned, ...keptUnpinned];
        }
        
        // Final sort for display
        this.engine.state.saveSlots.sort((a, b) => b.timestamp - a.timestamp);
    }

    public saveGame() {
        // Create Persistent State
        const p = this.engine.state.player;
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
        
        this.engine.state.savedPlayerState = persistent;

        const stateToSave = JSON.parse(JSON.stringify(this.engine.state));
        
        // Store current SIMULATION time to restore exact state
        // Note: state.time is already updated in GameEngine loop, but explicitly saving meta just in case
        (stateToSave as any).metaGameTime = this.engine.time.gameTime;

        // Clean up transient entities
        stateToSave.projectiles = [];
        stateToSave.particles = [];
        stateToSave.floatingTexts = [];
        
        const newSave: SaveFile = {
            id: `save-${Date.now()}`,
            timestamp: Date.now(), // Real World Time
            label: this.engine.state.gameMode === GameMode.EXPLORATION 
                ? `EXPLORATION - ${this.engine.state.currentPlanet?.name || 'SECTOR MAP'}` 
                : `SURVIVAL - WAVE ${this.engine.state.wave.index}`,
            isPinned: false,
            data: JSON.stringify(stateToSave),
            mode: this.engine.state.gameMode,
            version: CURRENT_VERSION
        };

        this.engine.state.saveSlots.unshift(newSave);
        this.enforceSlotLimit();
        this.persistSaves();
        this.engine.addMessage(this.engine.t('GAME_SAVED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
        this.engine.notifyUI('SAVE_UPDATE');
    }

    public importSave(jsonString: string): boolean {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.label || !parsed.data || !parsed.mode) {
                throw new Error("Invalid Save Format");
            }
            const newSave: SaveFile = {
                id: `import-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                timestamp: Date.now(),
                label: parsed.label + " (IMP)",
                isPinned: false,
                data: parsed.data,
                mode: parsed.mode,
                version: parsed.version || "0.9.0"
            };
            this.engine.state.saveSlots.unshift(newSave);
            this.enforceSlotLimit();
            this.persistSaves();
            this.engine.notifyUI('SAVE_UPDATE');
            return true;
        } catch (e) {
            console.error("Import Failed", e);
            return false;
        }
    }

    public exportSaveString(id: string): string | null {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (!slot) return null;
        return JSON.stringify({
            label: slot.label,
            data: slot.data,
            mode: slot.mode,
            version: slot.version
        }, null, 2);
    }

    public loadGame(id: string) {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (slot) {
            try {
                // 1. Parse raw data
                let data = JSON.parse(slot.data);
                
                // 2. Run Migration Service
                const currentContext = {
                    settings: this.engine.state.settings
                };
                
                const saveVersion = slot.version || "0.9.0";
                data = MigrationService.migrate(data, saveVersion, currentContext);

                // 3. Hydrate State
                Object.assign(this.engine.state, data);
                
                // --- TIME SYNCHRONIZATION ---
                // Crucial fix: Set the Engine's Simulation Time to the saved time.
                // This ensures all absolute timestamps (like reloadStartTime) in the save file
                // remain valid relative to 'now'.
                const savedTime = data.time || (data as any).metaGameTime || 0;
                this.engine.time.sync(savedTime);

                this.engine.state.isPaused = false;
                this.engine.state.appMode = AppMode.GAMEPLAY;
                this.engine.state.camera = { x: 0, y: 0 };
                
                if (this.engine.state.gameMode === GameMode.EXPLORATION && !this.engine.state.currentPlanet) {
                     this.engine.state.appMode = AppMode.EXPLORATION_MAP;
                }

                // 4. Sanitize Timestamps
                // Even with sync, if logic changed, we ensure no negative delays
                const currentNow = this.engine.time.gameTime;

                // Player Regen
                if (!this.engine.state.player.lastHitTime) {
                    this.engine.state.player.lastHitTime = currentNow - 999999;
                }

                // Weapons
                Object.values(this.engine.state.player.weapons).forEach((w: WeaponState) => {
                    w.lastFireTime = 0; // Unjam
                    if (w.type === WeaponType.PISTOL || w.ammoReserve === null) {
                        w.ammoReserve = Infinity;
                    }
                    // If mid-reload, ensure it doesn't get stuck in past
                    if (w.reloading && w.reloadStartTime > currentNow) {
                        w.reloadStartTime = currentNow;
                    }
                });

                // Clear transient timers that shouldn't persist
                this.engine.state.enemies.forEach(e => {
                    e.lastAttackTime = currentNow - 1000;
                });

                // 5. Re-register Stats
                if (this.engine.spaceshipManager) {
                    this.engine.statManager.clear(); 
                    this.engine.spaceshipManager.registerModifiers(); 
                }

                this.engine.addMessage(this.engine.t('GAME_LOADED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
            } catch (e) {
                console.error("Failed to load save", e);
                this.engine.addMessage(this.engine.t('LOAD_FAIL_CORRUPT'), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red', FloatingTextType.SYSTEM);
            }
        }
    }

    public deleteSave(id: string) {
        this.engine.state.saveSlots = this.engine.state.saveSlots.filter(s => s.id !== id);
        this.persistSaves();
        this.engine.notifyUI('SAVE_UPDATE');
    }

    public togglePin(id: string) {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (slot) {
            if (!slot.isPinned && this.engine.state.saveSlots.filter(s => s.isPinned).length >= MAX_PINNED_SLOTS) {
                return;
            }
            slot.isPinned = !slot.isPinned;
            this.persistSaves();
            this.engine.notifyUI('SAVE_UPDATE');
        }
    }

    // --- COMBAT HISTORY MANAGEMENT ---

    public getHistory(): CombatRecord[] {
        try {
            const raw = localStorage.getItem(this.historyKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    }

    public addHistoryEntry(record: Omit<CombatRecord, 'id' | 'timestamp'>) {
        const history = this.getHistory();
        
        const newRecord: CombatRecord = {
            id: `hist-${Date.now()}`,
            timestamp: Date.now(),
            ...record
        };

        // Add to top
        history.unshift(newRecord);

        // Limit to 50 entries to prevent bloat
        if (history.length > 50) {
            history.length = 50;
        }

        localStorage.setItem(this.historyKey, JSON.stringify(history));
    }
}
