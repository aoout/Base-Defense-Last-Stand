
import { CURRENT_VERSION } from "../data/changelog";
import { GameState } from "../types";

/**
 * Handles the evolution of save data across different game versions.
 * Ensures that loading an old save file doesn't crash the game due to missing fields.
 */
export class MigrationService {
    
    /**
     * Entry point for migrating raw save data to the current GameState schema.
     * @param data The raw JSON object parsed from the save file.
     * @param fromVersion The version string stored in the save file (defaults to "0.9.0" if missing).
     * @param currentContext Optional: Current game context (like current settings) to merge/preserve.
     */
    public static migrate(data: any, fromVersion: string = "0.9.0", currentContext?: Partial<GameState>): any {
        console.log(`[Migration] Checking save data. Archive Version: ${fromVersion} | System Version: ${CURRENT_VERSION}`);

        // 1. Basic Structural Patches (The "Always Run" Safety Net)
        // Ensure critical objects exist even if migration logic below misses them
        if (!data.settings) {
            console.warn("[Migration] Missing settings object. Re-initializing.");
            data.settings = currentContext?.settings || {};
        } else if (currentContext?.settings) {
            // Preserve language setting from the *current* session rather than the save
            // This prevents loading a save from switching your language back unintentionally
            data.settings.language = currentContext.settings.language;
        }

        // Ensure Stats object exists
        if (!data.stats) {
            data.stats = {
                shotsFired: 0,
                shotsHit: 0,
                damageDealt: 0,
                damageBySource: {},
                killsByType: {},
                encounteredEnemies: []
            };
        }

        // 2. Version-Specific Migrations
        // We use a simple semver-like comparison or direct string checks if versions are strictly linear.
        // For now, we assume linear history: 0.9.0 -> 0.9.5 -> 0.9.6
        
        // Migration: Pre-0.9.5 (Before Galaxy Index)
        if (this.isOlder(fromVersion, "0.9.5")) {
            this.migrateTo_0_9_5(data);
        }

        // Migration: Pre-0.9.6 (Before StatManager refactor)
        if (this.isOlder(fromVersion, "0.9.6")) {
            this.migrateTo_0_9_6(data);
        }

        // Future migrations go here...
        
        return data;
    }

    // --- Helpers ---

    private static isOlder(current: string, target: string): boolean {
        // Simple comparator for "x.y.z" format
        const cParts = current.split('.').map(Number);
        const tParts = target.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (cParts[i] < tParts[i]) return true;
            if (cParts[i] > tParts[i]) return false;
        }
        return false;
    }

    // --- Specific Migration Scripts ---

    private static migrateTo_0_9_5(data: any) {
        console.log("[Migration] Applying v0.9.5 patches (Galaxy Index)...");
        // Example: If 0.9.5 added 'sectorName', ensure it exists
        if (!data.sectorName) {
            data.sectorName = "UNKNOWN SECTOR";
        }
    }

    private static migrateTo_0_9_6(data: any) {
        console.log("[Migration] Applying v0.9.6 patches (StatManager Refactor)...");
        // 0.9.6 Introduced StatManager and decoupled systems.
        // We need to ensure that any legacy 'passive' bonuses that might have been hardcoded
        // are ready to be recalculated by the SpaceshipManager.registerModifiers().
        
        // Ensure spaceship object has new fields if they were added recently
        if (!data.spaceship) {
            data.spaceship = { installedModules: [] };
        }
        if (!data.spaceship.bioResources) {
            data.spaceship.bioResources = { ALPHA: 0, BETA: 0, GAMMA: 0 };
        }
        
        // Clean up any deprecated fields if necessary (optional)
    }
}
