
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType, SpawnBloodStainEvent, PlaySoundEvent, WeaponType, ProjectileID, EnemySpawnOptions } from '../../types';
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
    public initialize(enemy: Enemy, context: AIContext, options?: EnemySpawnOptions): void {
        super.initialize(enemy, context, options);
        enemy.visualScaleY = 1;
        enemy.cannibalTimer = 0;
        if (options && options.burrowState) {
            enemy.burrowState = options.burrowState;
        }
    }

    public update(enemy: Enemy, context: AIContext): void {
        // 1. Try to find Grunts to eat (Cannibalism)
        this.handleCannibalismSearch(enemy, context);

        // 2. Resolve Movement & Target
        const { target, isHunting } = this.determineMovementTarget(enemy, context);
        
        // 3. Move or Attack based on distance
        const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
        const attackRange = 30; 
        const isMoving = distSq > attackRange * attackRange;

        if (isMoving) {
            this.performBurrowMovement(enemy, target, isHunting, context);
        } else {
            this.performSurfaceAction(enemy, target, isHunting, context);
        }
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

    private performBurrowMovement(enemy: Enemy, target: any, isHunting: boolean, context: AIContext) {
        const { events, timeScale } = context;
        
        // Dive visual
        if (enemy.visualScaleY! > 0.2) enemy.visualScaleY! -= 0.05 * timeScale;
        
        // Speed boost when hunting
        const currentSpeed = isHunting ? enemy.speed * 2.5 : enemy.speed;
        
        this.moveTowards(enemy, target, currentSpeed, timeScale);
        
        // Dust Particles
        if (Math.random() < 0.3) {
            events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: enemy.x, y: enemy.y, color: '#a16207', count: 1, speed: 1 });
        }
    }

    private performSurfaceAction(enemy: Enemy, target: any, isHunting: boolean, context: AIContext) {
        const { timeScale } = context;

        // Surface visual
        if (enemy.visualScaleY! < 1) enemy.visualScaleY! += 0.1 * timeScale;
        enemy.visualScaleY = Math.min(1, enemy.visualScaleY!);

        // Only attack when fully surfaced
        if (enemy.visualScaleY! > 0.8) {
            if (isHunting) {
                this.consumePrey(enemy, target as Enemy, context);
            } else {
                this.performMeleeAttack(enemy, target, context);
            }
        }
    }

    private consumePrey(predator: Enemy, prey: Enemy, context: AIContext) {
        prey.hp = 0; // Instakill
        
        context.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, { x: prey.x, y: prey.y, color: prey.color, maxHp: prey.maxHp });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT', x: predator.x, y: predator.y });
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { text: context.t('CONSUMED'), x: predator.x, y: predator.y - 20, color: '#ef4444', type: FloatingTextType.SYSTEM });

        // Growth
        predator.maxHp += 200;
        predator.hp += 200;
        predator.radius += 5;
        predator.radius = Math.min(predator.radius, 60);
        predator.visualScaleY = 1.3; // Bulge effect
        
        predator.huntingTargetId = undefined;
        predator.eatingTimer = 500;
    }
}
