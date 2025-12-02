

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
        
        // Update SavedPlayerState in global state (for Exploration map persistence)
        this.engine.state.savedPlayerState = persistent;

        // Create a deep copy of state to sanitize
        const stateToSave = { ...this.engine.state };
        
        // Don't save transient/heavy things
        stateToSave.projectiles = [];
        stateToSave.particles = [];
        stateToSave.floatingTexts = []; // CHANGED: Reset new floatingTexts array
        // Enemies and Allies can be saved to resume mid-wave, but let's keep it simple for now
        // or allow them. Currently saving full state.

        const newSave: SaveFile = {
            id: `save-${Date.now()}`,
            timestamp: Date.now(),
            label: this.engine.state.gameMode === GameMode.EXPLORATION 
                ? `EXPLORATION - ${this.engine.state.currentPlanet?.name || 'SECTOR MAP'}` 
                : `SURVIVAL - WAVE ${this.engine.state.wave}`,
            isPinned: false,
            data: JSON.stringify(stateToSave),
            mode: this.engine.state.gameMode
        };

        // Add to list
        this.engine.state.saveSlots.unshift(newSave);
        
        // Manage Limits
        const pinned = this.engine.state.saveSlots.filter(s => s.isPinned);
        const unpinned = this.engine.state.saveSlots.filter(s => !s.isPinned);
        
        if (unpinned.length > (MAX_SAVE_SLOTS - pinned.length)) {
            // Remove oldest unpinned
            const toKeep = unpinned.slice(0, MAX_SAVE_SLOTS - pinned.length);
            this.engine.state.saveSlots = [...pinned, ...toKeep].sort((a,b) => b.timestamp - a.timestamp);
        }

        this.persistSaves();
        this.engine.addMessage("GAME SAVED", WORLD_WIDTH/2, WORLD_HEIGHT/2, '#10B981', FloatingTextType.SYSTEM);
    }

    public loadGame(id: string) {
        const slot = this.engine.state.saveSlots.find(s => s.id === id);
        if (slot) {
            try {
                const data = JSON.parse(slot.data);
                
                // Ensure settings object exists and has language (fallback for old saves)
                if (!data.settings) data.settings = { ...this.engine.state.settings };
                if (!data.settings.language) data.settings.language = 'EN';

                // Restore
                Object.assign(this.engine.state, data);
                
                // Re-hydrate helpers/state
                this.engine.state.isPaused = false;
                this.engine.state.appMode = AppMode.GAMEPLAY;
                this.engine.state.camera = { x: 0, y: 0 };
                
                // If loaded in Exploration Map mode, ensure mode is set correctly
                if (this.engine.state.gameMode === GameMode.EXPLORATION && !this.engine.state.currentPlanet) {
                     this.engine.state.appMode = AppMode.EXPLORATION_MAP;
                }

                // --- CRITICAL FIX: Reset Timestamps ---
                // Timestamps like lastFireTime are performance.now() based which resets on page reload.
                // Saved timestamps from previous sessions will be huge relative to new performance.now().
                // We reset them to 0 to allow immediate action.
                
                // 1. Player Weapons
                Object.values(this.engine.state.player.weapons).forEach(w => {
                    w.lastFireTime = 0;
                    w.reloading = false; // Cancel reload on load to prevent timer issues
                });

                // 2. Enemies
                this.engine.state.enemies.forEach(e => {
                    e.lastAttackTime = 0;
                    if (e.bossNextShotTime) e.bossNextShotTime = 0;
                });

                // 3. Allies
                this.engine.state.allies.forEach(a => {
                    a.lastFireTime = 0;
                });

                // 4. Turrets
                this.engine.state.turretSpots.forEach(s => {
                    if (s.builtTurret) {
                        s.builtTurret.lastFireTime = 0;
                    }
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
                return; // Max pins reached
            }
            slot.isPinned = !slot.isPinned;
            this.persistSaves();
        }
    }
}
