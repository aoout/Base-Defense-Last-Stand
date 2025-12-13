
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

        // --- TIME NORMALIZATION (Hydration Prep) ---
        // We inject a special 'savedAtGameTime' field into the data blob (using JSON magic)
        // This helps us calculate relative offsets on load.
        // However, a simpler, more robust approach for this codebase is to save
        // relative durations for CRITICAL timers (Reload, Regen) directly in the objects 
        // or ensure we handle the offset on load.
        
        // We will perform a deep copy and modify timestamps to be "relative to now" 
        // where preserving exact timing matters.
        const stateToSave = JSON.parse(JSON.stringify(this.engine.state));
        
        // Store the game time at save moment
        (stateToSave as any).metaGameTime = this.engine.time.now;

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
            version: CURRENT_VERSION // Stamp with current system version
        };

        this.engine.state.saveSlots.unshift(newSave);
        this.enforceSlotLimit();
        this.persistSaves();
        this.engine.addMessage(this.engine.t('GAME_SAVED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
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
                version: parsed.version || "0.9.0" // Default to base if missing on import
            };
            this.engine.state.saveSlots.unshift(newSave);
            this.enforceSlotLimit();
            this.persistSaves();
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
                // We pass current settings to preserve language preference/performance settings
                const currentContext = {
                    settings: this.engine.state.settings
                };
                
                const saveVersion = slot.version || "0.9.0";
                data = MigrationService.migrate(data, saveVersion, currentContext);

                // 3. Hydrate State
                // Sync Time Manager to current fresh time
                this.engine.time.sync(performance.now());
                const currentNow = this.engine.time.now;
                const oldSaveTime = (data as any).metaGameTime || 0; // The time when save happened

                Object.assign(this.engine.state, data);
                
                this.engine.state.isPaused = false;
                this.engine.state.appMode = AppMode.GAMEPLAY;
                this.engine.state.camera = { x: 0, y: 0 };
                
                if (this.engine.state.gameMode === GameMode.EXPLORATION && !this.engine.state.currentPlanet) {
                     this.engine.state.appMode = AppMode.EXPLORATION_MAP;
                }

                // --- TIMESTAMP HYDRATION & FIXES ---
                
                // 1. Player Regeneration Logic (Sanitization)
                let loadedHitTime = this.engine.state.player.lastHitTime;
                
                // Detection for Legacy Unix Timestamp saves (numbers > 1 trillion)
                // OR null/undefined values
                if (!loadedHitTime || loadedHitTime > 1000000000000) {
                    // Reset to a safe value so regen can start immediately
                    this.engine.state.player.lastHitTime = currentNow - 999999;
                } else {
                    // Standard Sim Time Hydration
                    const timeSinceHit = oldSaveTime - loadedHitTime;
                    this.engine.state.player.lastHitTime = currentNow - timeSinceHit;
                }

                // 2. Weapon Reloading & Ammo Fixes
                Object.values(this.engine.state.player.weapons).forEach((w: WeaponState) => {
                    // Prevent jamming: Reset fire timer to allow shooting immediately
                    w.lastFireTime = 0; 

                    // FIX: JSON serializes Infinity as null. Restore it for Pistol.
                    if (w.type === WeaponType.PISTOL || w.ammoReserve === null) {
                        w.ammoReserve = Infinity;
                    }

                    // Reloading hydration
                    if (w.reloading) {
                        const timeSinceReloadStart = oldSaveTime - w.reloadStartTime;
                        w.reloadStartTime = currentNow - timeSinceReloadStart;
                    } else {
                        w.reloadStartTime = 0;
                    }
                });

                // 3. Enemy Attack Cooldowns
                this.engine.state.enemies.forEach(e => {
                    e.lastAttackTime = 0;
                    if (e.bossNextShotTime) e.bossNextShotTime = currentNow + 1000; // Small delay
                });

                // 4. Allies & Turrets
                this.engine.state.allies.forEach(a => { a.lastFireTime = 0; });
                this.engine.state.turretSpots.forEach(s => {
                    if (s.builtTurret) s.builtTurret.lastFireTime = 0;
                });
                
                // 5. Re-register Stats
                if (this.engine.spaceshipManager) {
                    this.engine.statManager.clear(); // Clear old stats
                    this.engine.spaceshipManager.registerModifiers(); // Rebuild from persistent data
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
    }

    public togglePin(id: string) {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (slot) {
            if (!slot.isPinned && this.engine.state.saveSlots.filter(s => s.isPinned).length >= MAX_PINNED_SLOTS) {
                return;
            }
            slot.isPinned = !slot.isPinned;
            this.persistSaves();
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
