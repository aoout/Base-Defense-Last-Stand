
import { GameState, SaveFile, PersistentPlayerState, GameMode, AppMode, MissionType, FloatingTextType } from '../../types';
import { MAX_SAVE_SLOTS, MAX_PINNED_SLOTS, WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { GameEngine } from '../gameService';

export class SaveManager {
    private engine: GameEngine;
    private storageKey = 'BASE_DEFENSE_SAVES_V1';

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

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
                : `SURVIVAL - WAVE ${this.engine.state.wave}`,
            isPinned: false,
            data: JSON.stringify(stateToSave),
            mode: this.engine.state.gameMode
        };

        this.engine.state.saveSlots.unshift(newSave);
        this.enforceSlotLimit();
        this.persistSaves();
        this.engine.addMessage("GAME SAVED", WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
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
                mode: parsed.mode
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
            mode: slot.mode
        }, null, 2);
    }

    public loadGame(id: string) {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (slot) {
            try {
                const data = JSON.parse(slot.data);
                
                // Sync Time Manager to current fresh time
                this.engine.time.sync();
                const currentNow = this.engine.time.now;
                const oldSaveTime = (data as any).metaGameTime || 0; // The time when save happened

                // Apply State
                if (!data.settings) data.settings = { ...this.engine.state.settings };
                if (!data.settings.language) data.settings.language = 'EN';
                Object.assign(this.engine.state, data);
                
                this.engine.state.isPaused = false;
                this.engine.state.appMode = AppMode.GAMEPLAY;
                this.engine.state.camera = { x: 0, y: 0 };
                
                if (this.engine.state.gameMode === GameMode.EXPLORATION && !this.engine.state.currentPlanet) {
                     this.engine.state.appMode = AppMode.EXPLORATION_MAP;
                }

                // --- TIMESTAMP HYDRATION (Crucial Fix) ---
                
                // 1. Player Regeneration Logic
                // We need to preserve how long ago we were hit relative to the game state.
                // timeSinceHit = oldSaveTime - oldLastHitTime
                // newLastHitTime = currentNow - timeSinceHit
                const timeSinceHit = oldSaveTime - this.engine.state.player.lastHitTime;
                this.engine.state.player.lastHitTime = currentNow - timeSinceHit;

                // 2. Weapon Reloading & Cooldowns
                Object.values(this.engine.state.player.weapons).forEach(w => {
                    // Prevent jamming: Reset fire timer to allow shooting immediately (or after minimal delay)
                    // It's safer to just set lastFireTime to 0 than try to calculate fire rate offsets which might be negative
                    w.lastFireTime = 0; 

                    // Reloading is critical to preserve
                    if (w.reloading) {
                        const timeSinceReloadStart = oldSaveTime - w.reloadStartTime;
                        w.reloadStartTime = currentNow - timeSinceReloadStart;
                    } else {
                        w.reloadStartTime = 0;
                    }
                });

                // 3. Enemy Attack Cooldowns
                // Resetting to 0 is fine, they can attack immediately or wait a full cycle. 
                // Preventing negative overflow is key.
                this.engine.state.enemies.forEach(e => {
                    e.lastAttackTime = 0;
                    if (e.bossNextShotTime) e.bossNextShotTime = currentNow + 1000; // Small delay
                });

                // 4. Allies & Turrets
                this.engine.state.allies.forEach(a => { a.lastFireTime = 0; });
                this.engine.state.turretSpots.forEach(s => {
                    if (s.builtTurret) s.builtTurret.lastFireTime = 0;
                });

                this.engine.addMessage("GAME LOADED", WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
            } catch (e) {
                console.error("Failed to load save", e);
                this.engine.addMessage("LOAD FAILED: CORRUPT DATA", WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red', FloatingTextType.SYSTEM);
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
}
