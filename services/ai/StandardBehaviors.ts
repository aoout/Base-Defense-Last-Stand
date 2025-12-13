
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType, SpawnBloodStainEvent, PlaySoundEvent, WeaponType, ProjectileID, EnemySpawnOptions, GameMode } from '../../types';
import { GAS_INFO } from '../../data/world';
import { TargetingLogic } from './TargetingLogic';

// Behavior for Grunt (and default fallback)
export class StandardBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        this.performMeleeAttack(enemy, target, context);
    }
}

// Behavior for Tank (Heavy Armor with Reactive Shell)
export class TankBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.shellValue = 100;
        enemy.maxShell = 100;
        enemy.shellRegenTimer = 0;
    }

    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        this.performMeleeAttack(enemy, target, context);

        // Reactive Shell Regeneration Logic
        enemy.shellRegenTimer = (enemy.shellRegenTimer || 0) + context.dt;
        if (enemy.shellRegenTimer >= 10000) { // 10s
            const current = enemy.shellValue || 0;
            const max = enemy.maxShell || 100;
            if (current < max) {
                enemy.shellValue = Math.min(max, current + 10);
            }
            enemy.shellRegenTimer = 0;
        }
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        if (enemy.shellValue && enemy.shellValue > 0) {
            // Fire bypasses armor
            if (weaponType === WeaponType.FLAMETHROWER) return amount;

            // Determine Shell Degradation
            const degradation = weaponType === WeaponType.PULSE_RIFLE ? 1 : 8;
            enemy.shellValue = Math.max(0, enemy.shellValue - degradation);
            
            // Return Reduced Damage
            return amount * 0.7;
        }
        return amount;
    }
}

// Behavior for Rusher
export class RusherBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.dashCharges = 0;
        enemy.dashTimer = 0;
    }

    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        
        // Dash Cooldown Management
        enemy.dashTimer = (enemy.dashTimer || 0) + context.dt;
        if (enemy.dashTimer >= 10000) {
            if ((enemy.dashCharges || 0) < 2) enemy.dashCharges = (enemy.dashCharges || 0) + 1;
            enemy.dashTimer = 0;
        }
        
        // AI Decision Tree
        if (!this.attemptDash(enemy, target, context)) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        }

        this.performMeleeAttack(enemy, target, context);
    }

    private attemptDash(enemy: Enemy, target: any, context: AIContext): boolean {
        if (!enemy.dashCharges || enemy.dashCharges <= 0) return false;

        // Conditions to Dash: Low random chance OR Target is in sight but not in melee range
        const randomChance = Math.random() < (0.01 * (context.dt / 1000));
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const inSight = enemy.detectionRange && distSq < enemy.detectionRange ** 2;
        const notInMelee = distSq > 60 * 60; 
        
        if (randomChance || (inSight && notInMelee)) {
            this.performDash(enemy, target, context);
            enemy.dashCharges--;
            return true;
        }
        return false;
    }

    private performDash(enemy: Enemy, target: any, context: AIContext) {
        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.angle = angle;
        const oldX = enemy.x;
        const oldY = enemy.y;
        
        let dashDist = 65; 
        const o2Gas = context.state.currentPlanet?.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
        if (o2Gas) dashDist = 65 * (1 + 0.6 * o2Gas.percentage);

        enemy.x = Math.max(0, Math.min(context.state.worldWidth, enemy.x + Math.cos(angle) * dashDist));
        enemy.y = Math.max(0, Math.min(context.state.worldHeight, enemy.y + Math.sin(angle) * dashDist));

        // FX
        context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
            x: oldX, y: oldY, color: '#94a3b8', count: 6, speed: 3
        });
        
        // Trail
        for(let i=1; i<=5; i++) {
            const t = i / 5;
            context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                x: oldX + (enemy.x - oldX) * t, 
                y: oldY + (enemy.y - oldY) * t, 
                color: 'rgba(245, 158, 11, 0.6)', count: 1, speed: 0.5 
            });
        }
    }
}

export class KamikazeBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        // Collision/Explosion logic handled by PhysicsSystem for instant feedback
    }
}

export class ViperBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const attackRange = 450;
        const stopDist = 400;

        if (distSq > stopDist * stopDist) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        } else {
            enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        }

        if (distSq <= attackRange * attackRange) {
            if (context.time - enemy.lastAttackTime > 2000) {
                context.events.emit(GameEventType.SPAWN_PROJECTILE, {
                    presetId: ProjectileID.E_VIPER,
                    x: enemy.x, 
                    y: enemy.y, 
                    targetX: target.x, 
                    targetY: target.y, 
                    damage: enemy.damage
                });
                context.events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
                enemy.lastAttackTime = context.time;
            }
        }
    }
}

export class PustuleBehavior extends BaseEnemyBehavior {
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        // Boss Summon Timer can be passed via options, or use default
        if (options && options.bossSummonTimer) {
            enemy.bossSummonTimer = options.bossSummonTimer;
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        // Pustules are stationary nodes. 
        // We override to PREVENT moveTowards() which rotates the entity.
        // It simply exists, checks melee collision (thorns), and summons units.
        
        const target = this.acquireTarget(enemy, context);
        this.performMeleeAttack(enemy, target, context, 500);

        const spawnInterval = enemy.bossSummonTimer || 15000;
        if (context.time - enemy.lastAttackTime > spawnInterval) {
            enemy.lastAttackTime = context.time; 
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const types = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.VIPER];
                const type = types[Math.floor(Math.random() * types.length)];
                
                context.events.emit<EnemySummonEvent>(GameEventType.ENEMY_SUMMON, {
                    type: type,
                    x: enemy.x + Math.cos(angle) * dist,
                    y: enemy.y + Math.sin(angle) * dist
                });
            }
        }
    }
}

// Refactored: Pure Tube Worm logic. Boss logic moved to BossBehaviors.ts
export class TubeWormBehavior extends BaseEnemyBehavior {
    
    private readonly MAX_HOP_DISTANCE = 500; // Increased from 250 for better mobility
    private readonly UNDERGROUND_TIME = 800; // Time spent moving invisibly
    private readonly SURFACE_DURATION = 2000; // Forced time to stay surfaced before diving again

    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.visualScaleY = 1;
        enemy.cannibalTimer = 0;
        enemy.burrowState = 'IDLE'; // Start surfaced
        enemy.burrowTimer = 0;

        // CAMPAIGN LOGIC: Passive chance
        if (context.state.gameMode === GameMode.CAMPAIGN) {
            // 90% chance to wait 65-115s
            if (Math.random() < 0.9) {
                enemy.passiveTimer = 65000 + Math.random() * 50000;
                enemy.isWandering = true;
                // No wanderDuration needed as processPassiveState handles it
            }
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        const { dt, timeScale, events } = context;

        // 1. Check for Passive/Wandering state (Campaign Mode)
        // If passive, we just wander and ignore combat until timer expires or damaged
        if (this.processPassiveState(enemy, context)) return;

        // 2. Handle Eating Animation (Blocks all other actions)
        if (enemy.eatingTimer && enemy.eatingTimer > 0) {
            enemy.eatingTimer -= dt * timeScale;
            // Pulse effect to simulate swallowing
            const progress = enemy.eatingTimer / 1000; // Normalized 0-1
            enemy.visualScaleY = 1 + Math.sin(progress * Math.PI) * 0.4; // Bulge up to 1.4x

            if (enemy.eatingTimer <= 0) {
                enemy.visualScaleY = 1; // Reset to normal size
                enemy.eatingTimer = 0;
            }
            return; // Block movement/diving/attacking while eating
        }

        // 3. Try to find Grunts to eat (Cannibalism) - Only when idle
        if (enemy.burrowState === 'IDLE') {
            this.handleCannibalismSearch(enemy, context);
        }

        // 4. Resolve Movement & Target
        const { target, isHunting } = this.determineMovementTarget(enemy, context);
        
        // 5. State Machine
        switch (enemy.burrowState) {
            case 'IDLE':
                // Decrement the "Stay Surfaced" timer
                enemy.burrowTimer = (enemy.burrowTimer || 0) - (dt * timeScale);

                const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
                
                // Ranges logic:
                // Eating Range: 80px (Forgiving range for cannibalism animation)
                // Dive Range: 40px (If target is further than this, consider diving)
                const eatRange = 80;
                const diveRange = 40;
                
                if (isHunting && distSq <= eatRange * eatRange) {
                    // Priority 1: Eat if hunting and in generous range
                    this.consumePrey(enemy, target as Enemy, context);
                } 
                else if (distSq > diveRange * diveRange) {
                    // Priority 2: Dive if target is far AND allowed to dive
                    if ((enemy.burrowTimer || 0) <= 0) {
                        enemy.burrowState = 'DIVING';
                        enemy.burrowTimer = 0;
                        // Calculate hop destination
                        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                        const dist = Math.min(Math.sqrt(distSq), this.MAX_HOP_DISTANCE);
                        
                        enemy.burrowTarget = {
                            x: Math.max(0, Math.min(context.state.worldWidth, enemy.x + Math.cos(angle) * dist)),
                            y: Math.max(0, Math.min(context.state.worldHeight, enemy.y + Math.sin(angle) * dist))
                        };
                    }
                } 
                else {
                    // Priority 3: Standard Melee (Player/Base/Non-food or too close to dive)
                    if (!isHunting) {
                        this.performMeleeAttack(enemy, target, context);
                    }
                }
                break;

            case 'DIVING':
                // Shrink
                enemy.visualScaleY = Math.max(0, (enemy.visualScaleY || 1) - 0.1 * timeScale);
                if ((enemy.visualScaleY || 0) <= 0) {
                    enemy.burrowState = 'UNDERGROUND';
                    enemy.burrowTimer = this.UNDERGROUND_TIME;
                    
                    // FX
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: enemy.x, y: enemy.y, color: '#a16207', count: 3, speed: 2 });
                }
                break;

            case 'UNDERGROUND':
                // Wait while invisible
                enemy.burrowTimer = (enemy.burrowTimer || 0) - (dt * timeScale);
                if ((enemy.burrowTimer || 0) <= 0 && enemy.burrowTarget) {
                    // Teleport
                    enemy.x = enemy.burrowTarget.x;
                    enemy.y = enemy.burrowTarget.y;
                    enemy.burrowState = 'SURFACING';
                    enemy.burrowTimer = 0;
                    enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x); // Face target on exit
                    
                    // FX
                    events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: enemy.x, y: enemy.y, color: '#a16207', count: 5, speed: 4 });
                }
                break;

            case 'SURFACING':
                // Grow
                enemy.visualScaleY = Math.min(1, (enemy.visualScaleY || 0) + 0.1 * timeScale);
                if ((enemy.visualScaleY || 0) >= 1) {
                    enemy.burrowState = 'IDLE';
                    // Force it to stay surfaced for a while to give player a chance
                    enemy.burrowTimer = this.SURFACE_DURATION;
                }
                break;
        }
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // Base logic breaks passive state
        super.onTakeDamage(enemy, amount, weaponType, context);

        // Invulnerable while underground or fully dived
        if (enemy.burrowState === 'UNDERGROUND' || (enemy.visualScaleY || 1) < 0.3) {
            return 0;
        }
        return amount;
    }

    private handleCannibalismSearch(enemy: Enemy, context: AIContext) {
        if (enemy.huntingTargetId) return; // Already hunting

        enemy.cannibalTimer = (enemy.cannibalTimer || 0) + context.dt;
        if (enemy.cannibalTimer >= 2000) {
            enemy.cannibalTimer = 0;
            // 50% Chance to look for food
            if (Math.random() < 0.5) {
                const prey = TargetingLogic.findPrey(enemy, context.state, (enemy.detectionRange || 600) * 2);
                if (prey) enemy.huntingTargetId = prey.id;
            }
        }
    }

    private determineMovementTarget(enemy: Enemy, context: AIContext): { target: any, isHunting: boolean } {
        let target: any = null;
        let isHunting = false;

        // Check if hunting target is valid
        if (enemy.huntingTargetId) {
            const prey = context.state.enemies.find(e => e.id === enemy.huntingTargetId);
            if (prey && prey.hp > 0) {
                target = prey;
                isHunting = true;
            } else {
                enemy.huntingTargetId = undefined; // Target lost/dead
            }
        } 
        
        // Fallback to standard target (Player/Base)
        if (!target) {
            target = this.acquireTarget(enemy, context);
        }

        return { target, isHunting };
    }

    private consumePrey(predator: Enemy, prey: Enemy, context: AIContext) {
        prey.hp = 0; // Instakill
        
        // Visual polish: Spawn blood halfway between predator and prey to simulate suction/dragging
        const midX = (predator.x + prey.x) / 2;
        const midY = (predator.y + prey.y) / 2;

        context.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, { x: midX, y: midY, color: prey.color, maxHp: prey.maxHp });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT', x: predator.x, y: predator.y });
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { text: context.t('CONSUMED'), x: predator.x, y: predator.y - 20, color: '#ef4444', type: FloatingTextType.SYSTEM });

        // Growth
        predator.maxHp += 200;
        predator.hp += 200;
        predator.radius += 5;
        predator.radius = Math.min(predator.radius, 60);
        
        predator.huntingTargetId = undefined;
        // Set eating timer to block movement and trigger swallow animation
        predator.eatingTimer = 1000;
    }
}
