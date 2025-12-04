
import { GameEngine } from '../gameService';
import { AllyOrder, TurretType, Enemy, FloatingTextType, DamageSource, BioBuffType } from '../../types';
import { ALLY_STATS, TURRET_STATS, TURRET_COSTS } from '../../data/registry';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class DefenseManager {
    private engine: GameEngine;
    private targetCache: Enemy[] = []; // Reusable array for targeting

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number, time: number, timeScale: number) {
        // Use engine time instead of generic time for consistency
        const gameTime = this.engine.time.now;
        this.updateAllies(dt, gameTime, timeScale);
        this.updateTurrets(gameTime);
    }

    private updateAllies(dt: number, time: number, timeScale: number) {
        const state = this.engine.state;
        const player = state.player;
        
        // Spawn Reinforcements
        if (Date.now() - state.lastAllySpawnTime > 60000 && state.allies.length < ALLY_STATS.maxCount) {
            const spawnX = state.base.x + (Math.random() > 0.5 ? 60 : -60);
            
            // Calculate Bio-Sequencing Buffs
            const hpBuff = this.engine.spaceshipManager.getBioBuffTotal(BioBuffType.ALLY_HP);
            const dmgBuff = this.engine.spaceshipManager.getBioBuffTotal(BioBuffType.ALLY_DMG);
            
            const finalMaxHp = ALLY_STATS.hp * (1 + hpBuff);
            const finalDamage = ALLY_STATS.damage * (1 + dmgBuff);

            state.allies.push({
                id: `ally-${Date.now()}`,
                x: spawnX, y: state.base.y,
                radius: 12, angle: -Math.PI/2, color: '#3b82f6',
                hp: finalMaxHp, maxHp: finalMaxHp,
                speed: ALLY_STATS.speed,
                damage: finalDamage,
                currentOrder: 'PATROL',
                state: 'PATROL',
                lastFireTime: 0,
                patrolPoint: { x: spawnX, y: state.base.y - 100 }
            });
            state.lastAllySpawnTime = Date.now();
            this.engine.addMessage("REINFORCEMENTS ARRIVED", spawnX, state.base.y - 20, '#3b82f6', FloatingTextType.SYSTEM);
        }

        // Ally Logic
        state.allies.forEach(a => {
            let target: Enemy | null = null;
            let minDistSq = Infinity;
            
            // 1. Determine Behavior Params
            let scanRange = 400;
            if (a.currentOrder === 'FOLLOW') scanRange = 500;
            if (a.currentOrder === 'ATTACK') scanRange = 3000; // Effective Global

            // 2. Find Target
            if (scanRange > 1000) {
                // Global Scan (Iterate all enemies for ATTACK mode)
                // Filter by simple distance to avoid checking everything if extremely far, but 3000 covers most valid targets
                for (const e of state.enemies) {
                    const dSq = (e.x - a.x)**2 + (e.y - a.y)**2;
                    if (dSq < scanRange**2 && dSq < minDistSq) {
                        minDistSq = dSq;
                        target = e;
                    }
                }
            } else {
                // Local Scan (Spatial Grid)
                this.targetCache.length = 0;
                this.engine.spatialGrid.query(a.x, a.y, scanRange, this.targetCache);

                for (const e of this.targetCache) {
                    const dSq = (e.x - a.x)**2 + (e.y - a.y)**2;
                    if (dSq < scanRange**2 && dSq < minDistSq) {
                        minDistSq = dSq;
                        target = e;
                    }
                }
            }

            // 3. Order Override Logic
            let shouldEngage = !!target;

            // FOLLOW TETHER: If too far from player, ignore combat and run to player
            if (a.currentOrder === 'FOLLOW') {
                const distToPlayerSq = (a.x - player.x)**2 + (a.y - player.y)**2;
                if (distToPlayerSq > 600 * 600) {
                    shouldEngage = false;
                }
            }

            if (shouldEngage && target) {
                a.state = 'COMBAT';
                const d = Math.sqrt(minDistSq);
                const idealDist = 200;
                
                // Combat Movement (Kiting/Chasing)
                let moveAngle = Math.atan2(target.y - a.y, target.x - a.x);
                
                if (d < idealDist) {
                    moveAngle += Math.PI; // Back away
                }
                
                // Only move if not in sweet spot
                if (Math.abs(d - idealDist) > 30) {
                    a.x += Math.cos(moveAngle) * a.speed * timeScale;
                    a.y += Math.sin(moveAngle) * a.speed * timeScale;
                }
                
                a.angle = Math.atan2(target.y - a.y, target.x - a.x);

                // Only shoot if actually in range (prevent cross-map shooting during approach)
                if (d < ALLY_STATS.range && time - a.lastFireTime > 500) {
                    this.engine.spawnProjectile(a.x, a.y, target.x, target.y, 15, a.damage, true, '#60a5fa', undefined, false, false, ALLY_STATS.range + 50, DamageSource.ALLY);
                    a.lastFireTime = time;
                    this.engine.audio.playAllyFire();
                }
            } else {
                // Non-Combat Movement
                a.state = a.currentOrder === 'ATTACK' ? 'ATTACK' : a.currentOrder === 'FOLLOW' ? 'FOLLOW' : 'PATROL';
                
                let destX = a.patrolPoint.x;
                let destY = a.patrolPoint.y;
                let stopDist = 10;

                if (a.currentOrder === 'FOLLOW') {
                    destX = player.x;
                    destY = player.y;
                    stopDist = 120; // Don't sit exactly on player
                }

                const dx = destX - a.x;
                const dy = destY - a.y;
                const distSq = dx*dx + dy*dy;

                if (distSq > stopDist * stopDist) {
                    const angle = Math.atan2(dy, dx);
                    a.x += Math.cos(angle) * a.speed * timeScale;
                    a.y += Math.sin(angle) * a.speed * timeScale;
                    a.angle = angle;
                }
            }

            // Clamp to Map Boundaries
            a.x = Math.max(0, Math.min(WORLD_WIDTH, a.x));
            a.y = Math.max(0, Math.min(WORLD_HEIGHT, a.y));
        });
        
        state.allies = state.allies.filter(a => a.hp > 0);
    }

    private updateTurrets(time: number) {
        const state = this.engine.state;
        state.turretSpots.forEach(spot => {
            const t = spot.builtTurret;
            if (!t) return;

            // Check for destruction
            if (t.hp <= 0) {
                this.engine.spawnParticle(spot.x, spot.y, '#ef4444', 10, 5);
                this.engine.spawnParticle(spot.x, spot.y, '#9ca3af', 8, 3); // Debris
                this.engine.audio.playExplosion();
                spot.builtTurret = undefined;
                return;
            }
            
            if (time - t.lastFireTime > t.fireRate) {
                let target: Enemy | null = null;
                let minDistSq = t.range * t.range;
                
                // Spatial Grid Optimization
                
                let possibleTargets: Enemy[] = [];
                if (t.range > 2000) {
                    // Global Range (Missile) - Scan all
                    possibleTargets = state.enemies;
                } else {
                    this.targetCache.length = 0;
                    this.engine.spatialGrid.query(spot.x, spot.y, t.range, this.targetCache);
                    possibleTargets = this.targetCache;
                }

                for (const e of possibleTargets) {
                    const dSq = (e.x - spot.x)**2 + (e.y - spot.y)**2;
                    if (dSq < minDistSq) {
                        minDistSq = dSq;
                        target = e;
                    }
                }

                if (target) {
                    t.angle = Math.atan2(target.y - spot.y, target.x - spot.x);
                    this.engine.spawnProjectile(spot.x, spot.y, target.x, target.y, 20, t.damage, true, '#10b981', t.type === TurretType.MISSILE ? target.id : undefined, t.type === TurretType.MISSILE, undefined, t.range, DamageSource.TURRET);
                    t.lastFireTime = time;
                    this.engine.audio.playTurretFire(t.level);
                }
            }
        });
    }

    public interact() {
        const p = this.engine.state.player;
        const state = this.engine.state;
        const sm = this.engine.spaceshipManager;
        
        let closestSpot = -1;
        let minDstSq = 60 * 60;
        
        state.turretSpots.forEach((s, i) => {
            const dSq = (s.x - p.x)**2 + (s.y - p.y)**2;
            if (dSq < minDstSq) {
                minDstSq = dSq;
                closestSpot = i;
            }
        });

        if (closestSpot !== -1) {
            const spot = state.turretSpots[closestSpot];
            if (!spot.builtTurret) {
                const currentCount = state.turretSpots.filter(s => s.builtTurret).length;
                let cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);
                
                // Apply Infrastructure Cost Reduction
                const costReduction = sm.getInfrastructureBonus('COST', TurretType.STANDARD);
                cost = Math.floor(cost * (1 - costReduction));

                if (p.score >= cost) {
                    p.score -= cost;
                    
                    // Apply Bonuses
                    const hpBonus = sm.getInfrastructureBonus('HP', TurretType.STANDARD);
                    const dmgBonusPct = sm.getInfrastructureBonus('DMG', TurretType.STANDARD);
                    const rateBonusPct = sm.getInfrastructureBonus('RATE', TurretType.STANDARD); // Probably 0 for standard

                    const baseStats = TURRET_STATS[TurretType.STANDARD];
                    const finalHp = baseStats.hp + hpBonus;
                    const finalDmg = baseStats.damage * (1 + dmgBonusPct);
                    const finalRate = baseStats.fireRate / (1 + rateBonusPct);

                    spot.builtTurret = {
                        id: `t-${Date.now()}`,
                        x: spot.x,
                        y: spot.y,
                        radius: 12, angle: 0, color: '', 
                        level: 1,
                        type: TurretType.STANDARD,
                        lastFireTime: 0,
                        range: baseStats.range,
                        hp: finalHp,
                        maxHp: finalHp,
                        damage: finalDmg,
                        fireRate: finalRate
                    };
                    this.engine.audio.playTurretFire(1); 
                } else {
                    this.engine.addMessage("INSUFFICIENT FUNDS", p.x, p.y - 50, 'red', FloatingTextType.SYSTEM);
                }
            } else {
                // Prevent interaction for upgrades on max level turrets
                if (spot.builtTurret.level < 2) {
                    state.activeTurretId = closestSpot;
                }
            }
        }
    }

    public confirmTurretUpgrade(type: TurretType) {
        const state = this.engine.state;
        const sm = this.engine.spaceshipManager;
        if (state.activeTurretId === undefined) return;
        const spot = state.turretSpots[state.activeTurretId];
        if (!spot.builtTurret) return;
        
        let cost = 0;
        if (type === TurretType.GAUSS) cost = TURRET_COSTS.upgrade_gauss;
        if (type === TurretType.SNIPER) cost = TURRET_COSTS.upgrade_sniper;
        if (type === TurretType.MISSILE) cost = TURRET_COSTS.upgrade_missile;

        if (state.player.score >= cost) {
            state.player.score -= cost;
            spot.builtTurret.type = type;
            spot.builtTurret.level = 2;
            const baseStats = TURRET_STATS[type];

            // Apply Bonuses
            const hpBonus = sm.getInfrastructureBonus('HP', type);
            const dmgBonusPct = sm.getInfrastructureBonus('DMG', type);
            const rateBonusPct = sm.getInfrastructureBonus('RATE', type);
            const rangeBonusPct = sm.getInfrastructureBonus('RANGE', type);

            spot.builtTurret.maxHp = baseStats.hp + hpBonus;
            spot.builtTurret.hp = spot.builtTurret.maxHp;
            spot.builtTurret.damage = baseStats.damage * (1 + dmgBonusPct);
            spot.builtTurret.range = baseStats.range * (1 + rangeBonusPct);
            spot.builtTurret.fireRate = baseStats.fireRate / (1 + rateBonusPct);
            
            this.closeTurretUpgrade();
        }
    }

    public closeTurretUpgrade() { this.engine.state.activeTurretId = undefined; }
    public issueOrder(order: AllyOrder) { this.engine.state.allies.forEach(a => a.currentOrder = order); }
}
