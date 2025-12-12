
import { BaseEnemyBehavior, AIContext } from './AIBehavior';
import { Enemy, GameEventType, DamageSource, EnemySummonEvent, EnemyType, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType, SpawnProjectileEvent, SpawnBloodStainEvent, PlaySoundEvent, WeaponType, GameMode } from '../../types';
import { GAS_INFO } from '../../data/world';

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
    public update(enemy: Enemy, context: AIContext): void {
        // Standard Movement & Attack
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        this.performMeleeAttack(enemy, target, context);

        // Reactive Shell Regeneration Logic
        enemy.shellRegenTimer = (enemy.shellRegenTimer || 0) + context.dt;
        const regenDelay = 10000; // 10s
        const regenAmount = 10;

        if (enemy.shellRegenTimer >= regenDelay) {
            const current = enemy.shellValue || 0;
            const max = enemy.maxShell || 100;
            if (current < max) {
                enemy.shellValue = Math.min(max, current + regenAmount);
            }
            enemy.shellRegenTimer = 0;
        }
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // Tank Shell Logic:
        // - Flamethrower ignores shell completely.
        // - Pulse Rifle reduces shell by 1.
        // - Other weapons reduce shell by 8.
        // - While Shell > 0, incoming damage is reduced by 30%.

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
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        
        this.updateDashCooldown(enemy, context.dt);
        
        // Try Dash or Move
        if (!this.attemptDash(enemy, target, context)) {
            this.moveTowards(enemy, target, enemy.speed, context.timeScale);
        }

        this.performMeleeAttack(enemy, target, context);
    }

    private updateDashCooldown(enemy: Enemy, dt: number) {
        enemy.dashTimer = (enemy.dashTimer || 0) + dt;
        const dashCharges = enemy.dashCharges || 0;
        
        if (enemy.dashTimer >= 10000) {
            if (dashCharges < 2) {
                enemy.dashCharges = dashCharges + 1;
            }
            enemy.dashTimer = 0;
        }
    }

    private attemptDash(enemy: Enemy, target: any, context: AIContext): boolean {
        if (!enemy.dashCharges || enemy.dashCharges <= 0) return false;

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

        const dx = Math.cos(angle) * dashDist;
        const dy = Math.sin(angle) * dashDist;
        
        enemy.x += dx;
        enemy.y += dy;
        
        // Clamp bounds
        enemy.x = Math.max(0, Math.min(context.state.worldWidth, enemy.x));
        enemy.y = Math.max(0, Math.min(context.state.worldHeight, enemy.y));

        // FX
        context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
            x: oldX, y: oldY, color: '#94a3b8', count: 6, speed: 3
        });

        const trailSteps = 5;
        for(let i=1; i<=trailSteps; i++) {
            const t = i / trailSteps;
            context.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                x: oldX + dx * t, y: oldY + dy * t, color: 'rgba(245, 158, 11, 0.6)', count: 1, speed: 0.5 
            });
        }
    }
}

export class KamikazeBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        const target = this.acquireTarget(enemy, context);
        this.moveTowards(enemy, target, enemy.speed, context.timeScale);
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
            this.tryShoot(enemy, target, context);
        }
    }

    private tryShoot(enemy: Enemy, target: any, context: AIContext) {
        const { time, events } = context;
        if (time - enemy.lastAttackTime < 2000) return;

        events.emit(GameEventType.SPAWN_PROJECTILE, {
            x: enemy.x, y: enemy.y, targetX: target.x, targetY: target.y, speed: 8, damage: enemy.damage, fromPlayer: false, color: '#10B981', isHoming: false, createsToxicZone: false, maxRange: 1000, source: DamageSource.ENEMY
        });
        events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
        enemy.lastAttackTime = time;
    }
}

export class PustuleBehavior extends BaseEnemyBehavior {
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

export class TubeWormBehavior extends BaseEnemyBehavior {
    public update(enemy: Enemy, context: AIContext): void {
        // Dispatch to Boss Logic if applicable
        if (enemy.isBoss) {
            this.handleBossBehavior(enemy, context);
            return;
        }

        // Initialize Defaults
        if (enemy.visualScaleY === undefined) enemy.visualScaleY = 1;
        if (enemy.cannibalTimer === undefined) enemy.cannibalTimer = 0;

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
                this.findPrey(enemy, context.state);
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

    private findPrey(enemy: Enemy, state: any) {
        const range = (enemy.detectionRange || 600) * 2; 
        let closestPrey: Enemy | null = null;
        let minDst = range * range;

        for (const other of state.enemies) {
            if (other.id !== enemy.id && other.type === EnemyType.GRUNT) {
                const dst = (enemy.x - other.x)**2 + (enemy.y - other.y)**2;
                if (dst < minDst) {
                    minDst = dst;
                    closestPrey = other;
                }
            }
        }

        if (closestPrey) {
            enemy.huntingTargetId = closestPrey.id;
        }
    }

    private consumePrey(predator: Enemy, prey: Enemy, context: AIContext) {
        prey.hp = 0; 
        
        context.events.emit<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, { x: prey.x, y: prey.y, color: prey.color, maxHp: prey.maxHp });
        context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'MELEE_HIT', x: predator.x, y: predator.y });
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { text: "CONSUMED", x: predator.x, y: predator.y - 20, color: '#ef4444', type: FloatingTextType.SYSTEM });

        // Growth
        predator.maxHp += 200;
        predator.hp += 200;
        predator.radius += 5;
        predator.radius = Math.min(predator.radius, 60);
        predator.visualScaleY = 1.3; // Bulge effect
        
        predator.huntingTargetId = undefined;
        predator.eatingTimer = 500;
    }

    // --- BOSS LOGIC ("The Devourer") ---

    private handleBossBehavior(enemy: Enemy, context: AIContext) {
        const { dt, events, state } = context;
        
        // Init State
        if (!enemy.burrowState) {
            enemy.burrowState = 'SURFACING';
            enemy.burrowTimer = 0;
            enemy.visualScaleY = 0;
            enemy.activeTime = 0;
        }

        // Global Timer to force retreat
        enemy.activeTime = (enemy.activeTime || 0) + dt;
        if (enemy.activeTime >= 60000 && enemy.burrowState !== 'DIVING' && enemy.burrowState !== 'UNDERGROUND') {
            this.triggerBossRetreat(enemy, context);
        }

        // State Machine
        switch (enemy.burrowState) {
            case 'SURFACING':
                this.updateBossSurfacing(enemy, context);
                break;
            case 'DIVING':
                this.updateBossDiving(enemy, context);
                break;
            case 'IDLE': // Active on surface
                this.updateBossActive(enemy, context);
                break;
        }
    }

    private triggerBossRetreat(enemy: Enemy, context: AIContext) {
        enemy.burrowState = 'DIVING';
        enemy.burrowTimer = 0;
        enemy.isWandering = true; 
        context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
            text: "DEVOURER RETREATING", 
            x: enemy.x, y: enemy.y - 100, 
            color: '#FACC15', type: FloatingTextType.SYSTEM
        });
    }

    private updateBossSurfacing(enemy: Enemy, context: AIContext) {
        enemy.burrowTimer = (enemy.burrowTimer || 0) + context.dt;
        const progress = Math.min(1, enemy.burrowTimer / 1000); 
        enemy.visualScaleY = progress;
        
        if (enemy.burrowTimer > 1000) {
            enemy.burrowState = 'IDLE';
            enemy.burrowTimer = 0;
            if (!enemy.wanderPoint && enemy.isWandering) {
                // Pick a new spot while underground logic was active
                enemy.wanderPoint = { 
                    x: 100 + Math.random() * (context.state.worldWidth - 200), 
                    y: 100 + Math.random() * (context.state.worldHeight - 200) 
                };
            }
        }
    }

    private updateBossDiving(enemy: Enemy, context: AIContext) {
        enemy.burrowTimer = (enemy.burrowTimer || 0) + context.dt;
        const progress = Math.min(1, enemy.burrowTimer / 1500); 
        enemy.visualScaleY = 1 - progress;
        
        if (enemy.burrowTimer > 1500) {
            enemy.burrowState = 'UNDERGROUND';
            context.state.campaign.bossHp = enemy.hp; // Persist HP
            // Remove entity from world (it's gone underground)
            const idx = context.state.enemies.indexOf(enemy);
            if (idx > -1) context.state.enemies.splice(idx, 1);
        }
    }

    private updateBossActive(enemy: Enemy, context: AIContext) {
        if (enemy.isWandering) {
            this.handleWandering(enemy, context);
        } else {
            const target = this.acquireTarget(enemy, context);
            const distSq = (enemy.x - target.x)**2 + (enemy.y - target.y)**2;
            const attackRange = 550;
            
            if (distSq > attackRange * attackRange) {
                this.moveTowards(enemy, target, enemy.speed, context.timeScale);
            } else {
                enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            }

            this.performMeleeAttack(enemy, target, context, 1000);
            this.attemptBossRangedAttack(enemy, target, distSq, attackRange, context);
        }
    }

    private attemptBossRangedAttack(enemy: Enemy, target: any, distSq: number, rangeSq: number, context: AIContext) {
        const shotCooldown = 3300;
        if (context.time - enemy.lastAttackTime > shotCooldown) {
            if (distSq <= rangeSq) {
                context.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                    x: enemy.x, y: enemy.y, 
                    targetX: target.x, targetY: target.y, 
                    speed: 12, damage: 55, 
                    fromPlayer: false, color: '#FACC15', 
                    isHoming: false, createsToxicZone: true, 
                    maxRange: 550, source: DamageSource.ENEMY
                });
                enemy.lastAttackTime = context.time;
                context.events.emit(GameEventType.PLAY_SOUND, { type: 'VIPER_SHOOT' });
            }
        }
    }

    public onTakeDamage(enemy: Enemy, amount: number, weaponType: WeaponType | undefined, context: AIContext): number {
        // Enrage if wandering boss takes damage
        if (enemy.isBoss && enemy.isWandering) {
            enemy.isWandering = false;
            enemy.wanderTimer = 0;
            enemy.wanderPoint = undefined;
            
            context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: "THREAT DETECTED - ENGAGING", 
                x: enemy.x,
                y: enemy.y - 50,
                color: '#ef4444', 
                type: FloatingTextType.SYSTEM
            });
            context.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BOSS_DEATH', x: enemy.x, y: enemy.y }); 
        }
        return amount;
    }

    public onDeath(enemy: Enemy, context: AIContext): void {
        if (enemy.isBoss && context.state.gameMode === GameMode.CAMPAIGN) {
            context.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, { 
                text: "DEVOURER ELIMINATED", x: enemy.x, y: enemy.y, color: '#FACC15', type: FloatingTextType.SYSTEM 
            });
            context.state.campaign.bossHp = 0; 
            context.events.emit(GameEventType.MISSION_COMPLETE, {}); 
        }
    }
}
