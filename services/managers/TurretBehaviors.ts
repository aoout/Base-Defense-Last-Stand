
import { Turret, Enemy, GameEventType, SpawnProjectileEvent, PlaySoundEvent, DamageSource, TurretType, SpawnParticleEvent, ProjectileID } from '../../types';
import { EventBus } from '../EventBus';
import { SpatialHashGrid } from '../../utils/spatialHash';

export interface TurretContext {
    events: EventBus;
    spatialGrid: SpatialHashGrid<Enemy>;
    enemies: Enemy[]; // Fallback for global range
    time: number;
    dt: number;
}

export interface TurretBehavior {
    update(turret: Turret, context: TurretContext): void;
}

abstract class BaseTurretBehavior implements TurretBehavior {
    protected targetCache: Enemy[] = [];

    public update(turret: Turret, context: TurretContext): void {
        const { time } = context;

        // Spin-down logic for Gauss (common enough to keep here or override)
        if (turret.type === TurretType.GAUSS && turret.spinUp && turret.spinUp > 0) {
            if (time - turret.lastFireTime > 2000) {
                turret.spinUp = 0;
            }
        }

        const effectiveRate = this.getFireRate(turret);

        if (time - turret.lastFireTime > effectiveRate) {
            const target = this.acquireTarget(turret, context);
            if (target) {
                turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x);
                this.fire(turret, target, context);
                turret.lastFireTime = time;
                this.onFire(turret);
            }
        }
    }

    protected getFireRate(turret: Turret): number {
        return turret.fireRate;
    }

    protected acquireTarget(turret: Turret, context: TurretContext): Enemy | null {
        const { spatialGrid, enemies } = context;
        let target: Enemy | null = null;
        let minDistSq = turret.range * turret.range;

        // Global Targeting Optimization
        if (turret.range > 2000) {
            for (const e of enemies) {
                const dSq = (e.x - turret.x)**2 + (e.y - turret.y)**2;
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    target = e;
                }
            }
        } else {
            // Spatial Grid Targeting
            this.targetCache.length = 0;
            spatialGrid.query(turret.x, turret.y, turret.range, this.targetCache);
            for (const e of this.targetCache) {
                const dSq = (e.x - turret.x)**2 + (e.y - turret.y)**2;
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    target = e;
                }
            }
        }
        return target;
    }

    protected abstract fire(turret: Turret, target: Enemy, context: TurretContext): void;

    protected onFire(turret: Turret): void {
        // Optional hook
    }
}

export class StandardBehavior extends BaseTurretBehavior {
    protected fire(turret: Turret, target: Enemy, context: TurretContext): void {
        context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
            presetId: ProjectileID.T_STANDARD,
            x: turret.x, 
            y: turret.y, 
            targetX: target.x, 
            targetY: target.y, 
            damage: turret.damage, 
            maxRange: turret.range
        });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: TurretType.STANDARD });
    }
}

export class GaussBehavior extends BaseTurretBehavior {
    protected getFireRate(turret: Turret): number {
        // Rate accelerates as spinUp increases (Base / (1 + Bonus))
        return turret.fireRate / (1 + (turret.spinUp || 0));
    }

    protected fire(turret: Turret, target: Enemy, context: TurretContext): void {
        context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
            presetId: ProjectileID.T_GAUSS,
            x: turret.x, 
            y: turret.y, 
            targetX: target.x, 
            targetY: target.y, 
            damage: turret.damage, 
            maxRange: turret.range
        });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: TurretType.GAUSS });
    }

    protected onFire(turret: Turret): void {
        // Increment Spin Up (Max 2.0 = +200% Speed)
        turret.spinUp = Math.min(2.0, (turret.spinUp || 0) + 0.015);
    }
}

export class SniperBehavior extends BaseTurretBehavior {
    protected fire(turret: Turret, target: Enemy, context: TurretContext): void {
        context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
            presetId: ProjectileID.T_SNIPER,
            x: turret.x, 
            y: turret.y, 
            targetX: target.x, 
            targetY: target.y, 
            damage: turret.damage, 
            maxRange: turret.range
        });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: TurretType.SNIPER });
    }
}

export class MissileBehavior extends BaseTurretBehavior {
    protected fire(turret: Turret, target: Enemy, context: TurretContext): void {
        context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
            presetId: ProjectileID.T_MISSILE,
            x: turret.x, 
            y: turret.y, 
            targetX: target.x, 
            targetY: target.y, 
            damage: turret.damage, 
            maxRange: turret.range, 
            homingTargetId: target.id
        });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: TurretType.MISSILE });
    }
}
