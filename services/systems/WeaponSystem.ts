
import { 
    GameState, 
    WeaponState, 
    WeaponType, 
    ModuleType, 
    GameEventType, 
    SpawnProjectileEvent, 
    PlaySoundEvent, 
    ShowFloatingTextEvent, 
    FloatingTextType, 
    StatId, 
    Entity 
} from '../../types';
import { EventBus } from '../EventBus';
import { DataManager } from '../DataManager';
import { StatManager } from '../managers/StatManager';

export class WeaponSystem {
    private events: EventBus;
    private data: DataManager;
    private stats: StatManager;

    constructor(events: EventBus, dataManager: DataManager, statManager: StatManager) {
        this.events = events;
        this.data = dataManager;
        this.stats = statManager;
    }

    /**
     * Handles the generic update loop for a weapon (e.g. processing reload timers).
     * Should be called every frame for the active weapon.
     */
    public update(weaponState: WeaponState, time: number): void {
        if (weaponState.reloading) {
            const weaponStats = this.data.getWeaponStats(weaponState.type);
            let reloadTime = weaponStats.reloadTime;
            
            // Module Logic: Tension Spring
            if (weaponState.modules.some(m => m.type === ModuleType.TENSION_SPRING)) {
                reloadTime *= 0.8;
            }
            
            // Stat Logic: Global Reload Speed
            const reloadMod = this.stats.get(StatId.PLAYER_RELOAD_SPEED, 0); 
            reloadTime = reloadTime * (1 + reloadMod);

            if (time - weaponState.reloadStartTime >= reloadTime) {
                this.finishReload(weaponState, weaponStats.magSize);
            }
        }
    }

    /**
     * Attempts to fire the weapon. Handles ammo checks, fire rate, and projectile spawning.
     */
    public fire(
        shooter: Entity & { isAiming?: boolean }, 
        weaponState: WeaponState, 
        time: number,
        sourceType: 'PLAYER' | 'ENEMY' = 'PLAYER'
    ): void {
        const weaponStats = this.data.getWeaponStats(weaponState.type);

        // 1. Validation Checks
        if (weaponState.reloading || time - weaponState.lastFireTime < weaponStats.fireRate) return;

        if (weaponState.ammoInMag <= 0) {
            this.reload(shooter, weaponState, time);
            return;
        }

        // 2. State Update
        weaponState.ammoInMag--;
        weaponState.lastFireTime = time;
        
        // 3. Audio Feedback
        this.events.emit(GameEventType.PLAY_SOUND, { 
            type: 'WEAPON', 
            variant: weaponState.type, 
            x: shooter.x, 
            y: shooter.y 
        });

        // 4. Ballistics Calculation
        const spread = shooter.isAiming ? weaponStats.spread * 0.5 : weaponStats.spread;
        const { damage, projectileId, isPiercing } = this.calculateBallistics(weaponStats, weaponState);

        // 5. Visuals
        const barrelLen = weaponStats.visuals?.muzzleOffset || 20;

        // 6. Spawn Logic
        const spawnProjectile = (angleOffset: number = 0) => {
            const finalAngle = shooter.angle + (Math.random() - 0.5) * spread + angleOffset;
            
            const spawnX = shooter.x + Math.cos(shooter.angle) * barrelLen;
            const spawnY = shooter.y + Math.sin(shooter.angle) * barrelLen;

            const targetX = spawnX + Math.cos(finalAngle) * 1000;
            const targetY = spawnY + Math.sin(finalAngle) * 1000;
            
            this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                presetId: projectileId,
                x: spawnX,
                y: spawnY,
                targetX,
                targetY,
                damage,
                activeModules: weaponState.modules,
                fromPlayer: sourceType === 'PLAYER',
                isPiercing: isPiercing // Override preset if module adds piercing
            });
        };

        if (weaponStats.pellets) {
            for (let i = 0; i < weaponStats.pellets; i++) {
                spawnProjectile();
            }
        } else {
            spawnProjectile();
        }
    }

    /**
     * Initiates the reload process.
     */
    public reload(shooter: Entity, weaponState: WeaponState, time: number): void {
        const weaponStats = this.data.getWeaponStats(weaponState.type);

        if (weaponState.reloading || weaponState.ammoInMag >= weaponStats.magSize) return;
        
        // Infinite ammo check (ammoReserve === Infinity) or valid reserve
        if (weaponState.ammoReserve !== Infinity && weaponState.ammoReserve <= 0) {
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { 
                text: "NO AMMO", 
                x: shooter.x, 
                y: shooter.y - 50, 
                color: 'red', 
                type: FloatingTextType.SYSTEM 
            });
            return;
        }

        weaponState.reloading = true;
        weaponState.reloadStartTime = time;
        this.events.emit(GameEventType.PLAY_SOUND, { 
            type: 'RELOAD', 
            variant: weaponState.type, 
            x: shooter.x, 
            y: shooter.y 
        });
    }

    private finishReload(weaponState: WeaponState, magSize: number): void {
        const needed = magSize - weaponState.ammoInMag;
        const available = weaponState.ammoReserve === Infinity ? needed : Math.min(needed, weaponState.ammoReserve);
        
        weaponState.ammoInMag += available;
        if (weaponState.ammoReserve !== Infinity) {
            weaponState.ammoReserve -= available;
        }
        weaponState.reloading = false;
    }

    private calculateBallistics(weaponStats: any, weaponState: WeaponState) {
        // 1. Base Damage
        let damage = this.stats.get(StatId.PLAYER_DAMAGE, weaponStats.damage); 
        
        // 2. Module Modifiers
        let forcePiercing = false;

        weaponState.modules.forEach((m: any) => {
            if (m.type === ModuleType.GEL_BARREL) damage *= 1.4;
            if (m.type === ModuleType.MICRO_RUPTURER) damage *= 1.6;
            if (m.type === ModuleType.TENSION_SPRING) damage *= 1.2;
            if (m.type === ModuleType.KINETIC_STABILIZER) forcePiercing = true;
        });

        // 3. Resolve Projectile ID
        const projectileId = weaponStats.projectilePresetId;

        return { 
            damage, 
            projectileId,
            isPiercing: weaponStats.isPiercing || forcePiercing
        };
    }
}
