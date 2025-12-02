
import { GameEngine } from '../gameService';
import { AllyOrder, TurretType, Enemy, FloatingTextType, DamageSource } from '../../types';
import { ALLY_STATS, TURRET_STATS, TURRET_COSTS } from '../../data/registry';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class DefenseManager {
    private engine: GameEngine;

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
        
        // Spawn Reinforcements
        if (Date.now() - state.lastAllySpawnTime > 60000 && state.allies.length < ALLY_STATS.maxCount) {
            const spawnX = state.base.x + (Math.random() > 0.5 ? 60 : -60);
            state.allies.push({
                id: `ally-${Date.now()}`,
                x: spawnX, y: state.base.y,
                radius: 12, angle: -Math.PI/2, color: '#3b82f6',
                hp: ALLY_STATS.hp, maxHp: ALLY_STATS.hp,
                speed: ALLY_STATS.speed,
                damage: ALLY_STATS.damage,
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
            let minDist = 400; 
            state.enemies.forEach(e => {
                const d = Math.sqrt((e.x - a.x)**2 + (e.y - a.y)**2);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                }
            });

            if (target) {
                a.state = 'COMBAT';
                const d = Math.sqrt((target.x - a.x)**2 + (target.y - a.y)**2);
                const idealDist = 200;
                let moveAngle = Math.atan2(target.y - a.y, target.x - a.x);
                
                // Kite logic
                if (d < idealDist) {
                    moveAngle += Math.PI; 
                }
                
                a.x += Math.cos(moveAngle) * a.speed * timeScale;
                a.y += Math.sin(moveAngle) * a.speed * timeScale;
                a.angle = Math.atan2(target.y - a.y, target.x - a.x);

                if (time - a.lastFireTime > 500) {
                    this.engine.spawnProjectile(a.x, a.y, target.x, target.y, 15, a.damage, true, '#60a5fa', undefined, false, false, 1000, DamageSource.ALLY);
                    a.lastFireTime = time;
                    this.engine.audio.playAllyFire();
                }
            } else {
                a.state = 'PATROL';
                // Return to patrol point logic could be improved here, but keeping basic for now
                const dx = a.patrolPoint.x - a.x;
                const dy = a.patrolPoint.y - a.y;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
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
            
            if (time - t.lastFireTime > t.fireRate) {
                let target: Enemy | null = null;
                let minDist = t.range;
                
                state.enemies.forEach(e => {
                    const d = Math.sqrt((e.x - spot.x)**2 + (e.y - spot.y)**2);
                    if (d < minDist) {
                        minDist = d;
                        target = e;
                    }
                });

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
        
        let closestSpot = -1;
        let minDst = 60;
        state.turretSpots.forEach((s, i) => {
            const d = Math.sqrt((s.x - p.x)**2 + (s.y - p.y)**2);
            if (d < minDst) {
                minDst = d;
                closestSpot = i;
            }
        });

        if (closestSpot !== -1) {
            const spot = state.turretSpots[closestSpot];
            if (!spot.builtTurret) {
                const currentCount = state.turretSpots.filter(s => s.builtTurret).length;
                const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);
                if (p.score >= cost) {
                    p.score -= cost;
                    spot.builtTurret = {
                        id: `t-${Date.now()}`,
                        x: spot.x,
                        y: spot.y,
                        radius: 0, angle: 0, color: '', 
                        level: 1,
                        type: TurretType.STANDARD,
                        lastFireTime: 0,
                        range: TURRET_STATS[TurretType.STANDARD].range,
                        hp: TURRET_STATS[TurretType.STANDARD].hp,
                        maxHp: TURRET_STATS[TurretType.STANDARD].hp,
                        damage: TURRET_STATS[TurretType.STANDARD].damage,
                        fireRate: TURRET_STATS[TurretType.STANDARD].fireRate
                    };
                    this.engine.audio.playTurretFire(1); 
                } else {
                    this.engine.addMessage("INSUFFICIENT FUNDS", p.x, p.y - 50, 'red', FloatingTextType.SYSTEM);
                }
            } else {
                state.activeTurretId = closestSpot;
            }
        }
    }

    public confirmTurretUpgrade(type: TurretType) {
        const state = this.engine.state;
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
            const s = TURRET_STATS[type];
            spot.builtTurret.range = s.range;
            spot.builtTurret.damage = s.damage;
            spot.builtTurret.fireRate = s.fireRate;
            spot.builtTurret.maxHp = s.hp;
            spot.builtTurret.hp = s.hp;
            
            this.closeTurretUpgrade();
        }
    }

    public closeTurretUpgrade() { this.engine.state.activeTurretId = undefined; }
    public issueOrder(order: AllyOrder) { this.engine.state.allies.forEach(a => a.currentOrder = order); }
}
