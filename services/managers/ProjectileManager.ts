
import { GameState, Projectile, WeaponType, WeaponModule, GameEventType, SpawnProjectileEvent, DamageSource, IGameSystem, DamageAreaEvent, PlaySoundEvent, SpawnParticleEvent } from '../../types';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';
import { DataManager } from '../DataManager';
import { PROJECTILE_PRESETS } from '../../data/registry';

export class ProjectileManager implements IGameSystem {
    public readonly systemId = 'PROJECTILE_SYSTEM';

    private getState: () => GameState;
    private events: EventBus;
    private data: DataManager;
    private pool: ObjectPool<Projectile>;

    constructor(getState: () => GameState, eventBus: EventBus, dataManager: DataManager) {
        this.getState = getState;
        this.events = eventBus;
        this.data = dataManager;

        // Initialize Pool
        this.pool = new ObjectPool<Projectile>(
            () => ({
                id: '',
                x: 0, y: 0, radius: 4, angle: 0, color: '#fff',
                vx: 0, vy: 0,
                speed: 0,
                damage: 0,
                rangeRemaining: 0,
                fromPlayer: false,
                source: DamageSource.ENEMY
            }),
            (p) => {
                // Reset transient properties
                p.isExplosive = false;
                p.explosionRadius = undefined;
                p.isPiercing = false;
                p.weaponType = undefined;
                p.hitIds = undefined;
                p.isHoming = false;
                p.createsToxicZone = false;
                p.activeModules = undefined;
                p.targetId = undefined;
                p.turnSpeed = undefined;
            }
        );

        this.events.on<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, (e) => {
            this.spawnProjectile(e);
        });
    }

    public registerProjectile(projectile: Projectile) {
        this.getState().projectiles.push(projectile);
    }

    /**
     * Spawns a projectile using a configuration object.
     * Uses Preset ID to hydrate default stats, then applies overrides.
     */
    public spawnProjectile(props: SpawnProjectileEvent) {
        const { x, y, targetX, targetY, damage, presetId } = props;

        // Hydrate configuration
        let config: any = {};
        
        if (presetId && PROJECTILE_PRESETS[presetId]) {
            config = { ...PROJECTILE_PRESETS[presetId] };
        }

        // Apply overrides from props
        if (props.speed !== undefined) config.speed = props.speed;
        if (props.fromPlayer !== undefined) config.fromPlayer = props.fromPlayer;
        if (props.color !== undefined) config.color = props.color;
        if (props.source !== undefined) config.source = props.source;
        if (props.maxRange !== undefined) config.maxRange = props.maxRange;
        if (props.isHoming !== undefined) config.isHoming = props.isHoming;
        if (props.createsToxicZone !== undefined) config.createsToxicZone = props.createsToxicZone;
        if (props.isExplosive !== undefined) config.isExplosive = props.isExplosive;
        if (props.explosionRadius !== undefined) config.explosionRadius = props.explosionRadius;
        if (props.isPiercing !== undefined) config.isPiercing = props.isPiercing;
        if (props.weaponType !== undefined) config.weaponType = props.weaponType;

        // Fallbacks for critical missing data (if no preset used)
        if (config.speed === undefined) config.speed = 10;
        if (config.maxRange === undefined) config.maxRange = 1000;
        if (config.fromPlayer === undefined) config.fromPlayer = false;
        if (config.source === undefined) config.source = DamageSource.ENEMY;
        if (config.color === undefined) config.color = '#fff';

        const angle = Math.atan2(targetY - y, targetX - x);
        
        const proj = this.pool.get();
        proj.id = generateId('p');
        
        // Physics
        proj.x = x; 
        proj.y = y;
        proj.speed = config.speed;
        proj.vx = Math.cos(angle) * config.speed;
        proj.vy = Math.sin(angle) * config.speed;
        proj.angle = angle;
        
        // Stats
        proj.damage = damage;
        proj.rangeRemaining = config.maxRange;
        proj.maxRange = config.maxRange;
        proj.source = config.source;
        proj.fromPlayer = config.fromPlayer;
        
        // Visuals
        proj.color = config.color;
        proj.radius = config.radius || 4;
        
        // Logic Flags
        proj.targetId = props.homingTargetId;
        proj.isHoming = !!config.isHoming;
        proj.createsToxicZone = !!config.createsToxicZone;
        proj.activeModules = props.activeModules;
        proj.isExplosive = !!config.isExplosive;
        proj.explosionRadius = config.explosionRadius;
        proj.isPiercing = !!config.isPiercing;
        
        if (config.weaponType) {
            proj.weaponType = config.weaponType;
        }

        // Apply Module Effects (Global Logic)
        if (proj.activeModules) {
             if (proj.activeModules.some(m => m.type === 'KINETIC_STABILIZER')) proj.isPiercing = true;
        }

        this.getState().projectiles.push(proj);
    }

    public update(dt: number, time: number, timeScale: number) {
        const state = this.getState();
        const projectiles = state.projectiles;
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let shouldRemove = false;

            // Homing Steering
            if (p.isHoming && p.targetId) {
                const target = state.enemies.find(e => e.id === p.targetId);
                if (target) {
                    const angle = Math.atan2(target.y - p.y, target.x - p.x);
                    const speed = Math.sqrt(p.vx**2 + p.vy**2);
                    // Instant turn for now
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

            // Removal Check
            if (p.rangeRemaining <= 0) {
                // If it's an explosive projectile (like a grenade) and hits max range (destination), trigger explosion manually
                if (p.isExplosive) {
                    this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, {
                        x: p.x, y: p.y,
                        radius: p.explosionRadius || 100,
                        damage: p.damage,
                        source: p.source
                    });
                    this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: p.x, y: p.y,
                        color: '#f87171', count: 10, speed: 10
                    });
                    this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: p.x, y: p.y });
                }
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
