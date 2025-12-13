
import { GameState, Enemy, GameEventType, Projectile, IGameSystem, EnemyType, CollisionProjectileEnemyEvent, CollisionProjectilePlayerEvent, CollisionProjectileBaseEvent, CollisionProjectileAllyEvent, CollisionKamikazeEvent, Entity } from '../types';
import { EventBus } from './EventBus';
import { StatManager } from './managers/StatManager';
import { DataManager } from './DataManager';
import { SpatialHashGrid } from '../utils/spatialHash';
import { circlesIntersect, circleIntersectsAABB } from '../utils/collision';

interface CollisionDefinition {
    id: string;
    sourceGroup: () => any[]; // Dynamic getter for source entities
    targetGroup: () => any[] | SpatialHashGrid<any> | any; // Dynamic getter for targets
    spatial: boolean; // Whether to use SpatialHash optimization
    condition?: (source: any, target: any) => boolean; // Optional pre-check
    handler: (source: any, target: any) => void;
    radius?: number; // Override collision radius
}

/**
 * PhysicsSystem (Refactored)
 * Role: The "Eyes" of the engine. It ONLY detects overlaps.
 * Uses a configuration-based pipeline to process collisions generically.
 */
export class PhysicsSystem implements IGameSystem {
    public readonly systemId = 'PHYSICS_SYSTEM';

    private getState: () => GameState;
    private events: EventBus;
    
    public spatialGrid: SpatialHashGrid<Enemy>;
    private nearbyCache: Enemy[] = [];
    
    // Collision Definitions Pipeline
    private collisionPipeline: CollisionDefinition[];

    // Configuration
    private readonly COL_RADIUS = {
        PLAYER: 15,
        ALLY: 12,
        TURRET: 15,
        PROJECTILE_CHECK: 60
    };

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager, dataManager: DataManager) {
        this.getState = getState;
        this.events = eventBus;
        this.spatialGrid = new SpatialHashGrid<Enemy>(100);

        // Initialize Collision Rules
        this.collisionPipeline = this.buildCollisionPipeline();
    }

    public resize(width: number, height: number) {
        this.spatialGrid.resize(width, height);
    }

    public update(dt: number) {
        this.updateSpatialHash();
        
        // Execute Generic Pipeline
        for (const rule of this.collisionPipeline) {
            this.processCollisionRule(rule);
        }
    }

    private updateSpatialHash() {
        this.spatialGrid.clear();
        const enemies = this.getState().enemies;
        for (let i = 0; i < enemies.length; i++) {
            this.spatialGrid.insert(enemies[i]);
        }
    }

    /**
     * Builds the list of all collision interactions in the game.
     * Easy to extend: just push a new rule.
     */
    private buildCollisionPipeline(): CollisionDefinition[] {
        return [
            // 1. Player Projectiles -> Enemies (Spatial)
            {
                id: 'PROJ_VS_ENEMY',
                sourceGroup: () => this.getState().projectiles.filter(p => p.fromPlayer && p.rangeRemaining > 0),
                targetGroup: () => this.spatialGrid,
                spatial: true,
                condition: (p: Projectile, e: Enemy) => !p.isPiercing || !p.hitIds?.includes(e.id),
                handler: (p: Projectile, e: Enemy) => {
                    this.events.emit<CollisionProjectileEnemyEvent>(GameEventType.COLLISION_PROJECTILE_ENEMY, { projectile: p, enemy: e });
                }
            },
            // 2. Enemy Projectiles -> Player
            {
                id: 'E_PROJ_VS_PLAYER',
                sourceGroup: () => this.getState().projectiles.filter(p => !p.fromPlayer && p.rangeRemaining > 0),
                targetGroup: () => [this.getState().player],
                spatial: false,
                handler: (p: Projectile) => {
                    this.events.emit<CollisionProjectilePlayerEvent>(GameEventType.COLLISION_PROJECTILE_PLAYER, { projectile: p });
                }
            },
            // 3. Enemy Projectiles -> Allies
            {
                id: 'E_PROJ_VS_ALLY',
                sourceGroup: () => this.getState().projectiles.filter(p => !p.fromPlayer && p.rangeRemaining > 0),
                targetGroup: () => this.getState().allies,
                spatial: false,
                handler: (p: Projectile, a: any) => {
                    this.events.emit<CollisionProjectileAllyEvent>(GameEventType.COLLISION_PROJECTILE_ALLY, { projectile: p, allyId: a.id });
                }
            },
            // 4. Enemy Projectiles -> Base Structures (Turrets & Base)
            {
                id: 'E_PROJ_VS_BASE',
                sourceGroup: () => this.getState().projectiles.filter(p => !p.fromPlayer && p.rangeRemaining > 0),
                targetGroup: () => this.getBaseColliders(),
                spatial: false,
                handler: (p: Projectile) => {
                    this.events.emit<CollisionProjectileBaseEvent>(GameEventType.COLLISION_PROJECTILE_BASE, { projectile: p });
                }
            },
            // 5. Kamikaze -> Player Side Entities
            {
                id: 'KAMIKAZE_IMPACT',
                sourceGroup: () => this.getState().enemies.filter(e => e.type === EnemyType.KAMIKAZE && e.hp > 0),
                targetGroup: () => this.getAllPlayerEntities(),
                spatial: false,
                handler: (k: Enemy, target: any) => {
                    // Map target back to type string
                    let type: 'PLAYER' | 'ALLY' | 'BASE' = 'BASE';
                    
                    // Safely check ID existence
                    if (target.id === 'player') {
                        type = 'PLAYER';
                    } else if (target.id && typeof target.id === 'string' && target.id.startsWith('ally')) {
                        type = 'ALLY';
                    }
                    // Default is BASE (which might not have an ID)
                    
                    this.events.emit<CollisionKamikazeEvent>(GameEventType.COLLISION_KAMIKAZE_IMPACT, { enemy: k, targetType: type });
                }
            }
        ];
    }

    private processCollisionRule(rule: CollisionDefinition) {
        const sources = rule.sourceGroup();
        // Skip if no sources
        if (sources.length === 0) return;

        const targets = rule.targetGroup(); // Resolve targets once

        // Spatial Grid Logic
        if (rule.spatial && targets instanceof SpatialHashGrid) {
            const grid = targets as SpatialHashGrid<any>;
            
            for (const source of sources) {
                if (this.isDestroyed(source)) continue;

                this.nearbyCache.length = 0;
                grid.query(source.x, source.y, this.COL_RADIUS.PROJECTILE_CHECK, this.nearbyCache);

                for (const target of this.nearbyCache) {
                    if (circlesIntersect(source.x, source.y, source.radius, target.x, target.y, target.radius)) {
                        if (!rule.condition || rule.condition(source, target)) {
                            rule.handler(source, target);
                            if (this.isDestroyed(source)) break; // Stop checking this source if handled
                        }
                    }
                }
            }
        } 
        // Array Logic
        else if (Array.isArray(targets)) {
            for (const source of sources) {
                if (this.isDestroyed(source)) continue;

                for (const target of targets) {
                    if (this.checkCollisionGeneric(source, target)) {
                        rule.handler(source, target);
                        if (this.isDestroyed(source)) break;
                    }
                }
            }
        }
    }

    // --- HELPERS ---

    private isDestroyed(entity: any): boolean {
        // Projectile specific check (primary use case for breaking loops)
        if (entity.rangeRemaining !== undefined) return entity.rangeRemaining <= 0;
        return false;
    }

    private checkCollisionGeneric(source: any, target: any): boolean {
        // AABB check for Base
        if (target.width && target.height) {
            return circleIntersectsAABB(source.x, source.y, source.radius, target.x - target.width/2, target.y - target.height/2, target.width, target.height);
        }
        // Circle check for everything else
        return circlesIntersect(source.x, source.y, source.radius, target.x, target.y, target.radius || 15);
    }

    private getBaseColliders() {
        const s = this.getState();
        const targets: any[] = [...s.turretSpots.filter(t => t.builtTurret).map(t => t.builtTurret)];
        if (s.base) targets.push(s.base);
        if (s.secondaryBase) targets.push(s.secondaryBase);
        return targets;
    }

    private getAllPlayerEntities() {
        const s = this.getState();
        return [
            s.player,
            ...s.allies,
            ...this.getBaseColliders()
        ];
    }
}
