
import { GameManifest, UnitStatsDef, WeaponDef, EnemyType, BossType, WeaponType } from '../types';
import { ENEMY_STATS, BOSS_STATS } from '../data/config/enemies';
import { WEAPONS } from '../data/config/weapons';

export class DataManager {
    private manifest: GameManifest;

    constructor() {
        // In a real scenario, this could be loaded from a JSON file or API.
        // For now, we hydrate it from the existing static config files.
        this.manifest = {
            enemies: { ...ENEMY_STATS },
            bosses: { ...BOSS_STATS },
            weapons: { ...WEAPONS }
        };
    }

    public getEnemyStats(type: EnemyType): UnitStatsDef {
        const stats = this.manifest.enemies[type];
        if (!stats) {
            console.error(`[DataManager] Missing stats for enemy type: ${type}`);
            // Return fallback to prevent crash
            return this.manifest.enemies[EnemyType.GRUNT];
        }
        return stats;
    }

    public getBossStats(type: BossType): UnitStatsDef {
        const stats = this.manifest.bosses[type];
        if (!stats) {
            console.error(`[DataManager] Missing stats for boss type: ${type}`);
            return this.manifest.bosses[BossType.RED_SUMMONER];
        }
        return stats;
    }

    public getWeaponStats(type: WeaponType): WeaponDef {
        const stats = this.manifest.weapons[type];
        if (!stats) {
            console.error(`[DataManager] Missing stats for weapon type: ${type}`);
            return this.manifest.weapons[WeaponType.AR];
        }
        return stats;
    }

    // --- Dev Tools: Hot Reload Capability ---
    public updateWeaponStat(type: WeaponType, key: keyof WeaponDef, value: any) {
        if (this.manifest.weapons[type]) {
            (this.manifest.weapons[type] as any)[key] = value;
            console.log(`[DataManager] Hot-patched ${type}.${String(key)} = ${value}`);
        }
    }
}
