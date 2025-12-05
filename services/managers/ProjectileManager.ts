
import { GameState, Projectile, WeaponType, WeaponModule, GameEventType, SpawnProjectileEvent, DamageSource } from '../../types';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';

export class ProjectileManager {
    private getState: () => GameState;
    private events: EventBus;
    private pool: ObjectPool<Projectile>;

    constructor(getState: () => GameState, eventBus: EventBus) {
        this.getState = getState;
        this.events = eventBus;

        // Initialize Pool
        this.pool = new ObjectPool<Projectile>(
            () => ({
                id: '',
                x: 0, y: 0, radius: 4, angle: 0, color: '#fff',
                vx: 0, vy: 0,
                damage: 0,
                rangeRemaining: 0,
                fromPlayer: false,
                source: DamageSource.ENEMY
            }),
            (p) => {
                p.isExplosive = false;
                p.isPiercing = false;
                p.weaponType = undefined;
                p.hitIds = undefined;
                p.isHoming = false;
                p.createsToxicZone = false;
                p.activeModules = undefined;
                p.targetId = undefined;
            }
        );

        this.events.on<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, (e) => {
            this.spawnProjectile(e.x, e.y, e.targetX, e.targetY, e.speed, e.damage, e.fromPlayer, e.color, e.homingTargetId, e.isHoming, e.createsToxicZone, e.maxRange, e.source, e.activeModules, e.isExplosive);
        });
    }

    public registerProjectile(projectile: Projectile) {
        this.getState().projectiles.push(projectile);
    }

    public spawnProjectile(x: number, y: number, tx: number, ty: number, speed: number, dmg: number, fromPlayer: boolean, color: string, homingTarget?: string, isHoming?: boolean, createsToxicZone?: boolean, maxRange: number = 1000, source: DamageSource = DamageSource.ENEMY, activeModules?: WeaponModule[], isExplosive?: boolean) {
        const angle = Math.atan2(ty - y, tx - x);
        
        const proj = this.pool.get();
        proj.id = generateId('p');
        proj.x = x; proj.y = y;
        proj.vx = Math.cos(angle) * speed;
        proj.vy = Math.sin(angle) * speed;
        proj.damage = dmg;
        proj.color = color;
        proj.radius = 4;
        proj.rangeRemaining = maxRange;
        proj.fromPlayer = fromPlayer;
        proj.angle = angle;
        proj.maxRange = maxRange;
        proj.source = source;
        
        proj.targetId = homingTarget;
        proj.isHoming = !!isHoming;
        proj.createsToxicZone = !!createsToxicZone;
        proj.activeModules = activeModules;
        proj.isExplosive = !!isExplosive;

        // Auto-detect flags based on modules or legacy color mapping if not explicitly set
        if (activeModules) {
             if (activeModules.some(m => m.type === 'KINETIC_STABILIZER')) proj.isPiercing = true;
        }
        if (color === '#22D3EE') { proj.isPiercing = true; proj.weaponType = WeaponType.PULSE_RIFLE; } // Pulse
        if (color === '#F97316') { proj.isPiercing = true; proj.weaponType = WeaponType.FLAMETHROWER; } // Flame
        if (color === '#1F2937') { proj.isExplosive = true; proj.weaponType = WeaponType.GRENADE_LAUNCHER; } // GL

        this.getState().projectiles.push(proj);
    }

    public update(dt: number, timeScale: number) {
        const state = this.getState();
        const projectiles = state.projectiles;
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let shouldRemove = false;

            // Homing Steering
            if (p.isHoming && p.targetId) {
                const target = state.enemies.find(e => e.id === p.targetId);
                if (target) {
                    // Simple steering
                    const angle = Math.atan2(target.y - p.y, target.x - p.x);
                    // Instant turn for arcade feel, or use turnSpeed for smooth
                    const speed = Math.sqrt(p.vx**2 + p.vy**2);
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    p.angle = angle;
                }
            }
            
            // Integration
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            // Lifecycle
            const distTravelled = Math.sqrt((p.vx * timeScale)**2 + (p.vy * timeScale)**2);
            p.rangeRemaining -= distTravelled;

            // Removal Check (Range or Externally marked by PhysicsSystem via negative range)
            if (p.rangeRemaining <= 0) {
                shouldRemove = true;
            }

            if (shouldRemove) {
                this.pool.release(p);
                projectiles[i] = projectiles[projectiles.length - 1];
                projectiles.pop();
            }
        }
    }
}
