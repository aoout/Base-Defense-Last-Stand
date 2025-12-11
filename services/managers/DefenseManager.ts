
import { AllyOrder, TurretType, Enemy, FloatingTextType, DamageSource, GameState, GameEventType, SpawnParticleEvent, PlaySoundEvent, SpawnProjectileEvent, ShowFloatingTextEvent, DefenseIssueOrderEvent, DefenseUpgradeTurretEvent, StatId, GameMode } from '../../types';
import { ALLY_STATS, TURRET_STATS, TURRET_COSTS } from '../../data/registry';
import { EventBus } from '../EventBus';
import { SpatialHashGrid } from '../../utils/spatialHash';
import { StatManager } from './StatManager';

export class DefenseManager {
    private getState: () => GameState;
    private events: EventBus;
    private spatialGrid: SpatialHashGrid<Enemy>;
    private stats: StatManager;
    private targetCache: Enemy[] = [];

    constructor(getState: () => GameState, eventBus: EventBus, spatialGrid: SpatialHashGrid<Enemy>, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.spatialGrid = spatialGrid;
        this.stats = statManager;

        // Subscribe to events
        this.events.on<DefenseIssueOrderEvent>(GameEventType.DEFENSE_ISSUE_ORDER, (e) => this.issueOrder(e.order));
        this.events.on(GameEventType.DEFENSE_INTERACT, () => this.interact());
        this.events.on<DefenseUpgradeTurretEvent>(GameEventType.DEFENSE_UPGRADE_TURRET, (e) => this.confirmTurretUpgrade(e.type));
        this.events.on(GameEventType.DEFENSE_CLOSE_MENU, () => this.closeTurretUpgrade());
    }

    public update(dt: number, time: number, timeScale: number) {
        // Prevent defense logic (ally spawn/movement) if base is still dropping/deploying
        if (this.getState().baseDrop?.active) return;

        this.updateAllies(dt, time, timeScale);
        this.updateTurrets(time);
    }

    private updateAllies(dt: number, time: number, timeScale: number) {
        const state = this.getState();
        const player = state.player;
        
        // Campaign Mode allows 10 allies, others allow 5
        const maxAllies = state.gameMode === GameMode.CAMPAIGN ? 10 : ALLY_STATS.maxCount;
        
        if (Date.now() - state.lastAllySpawnTime > 60000 && state.allies.length < maxAllies) {
            const spawnX = state.base.x + (Math.random() > 0.5 ? 60 : -60);
            
            const finalMaxHp = this.stats.get(StatId.ALLY_MAX_HP, ALLY_STATS.hp);
            const finalDamage = this.stats.get(StatId.ALLY_DAMAGE, ALLY_STATS.damage);

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
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: "REINFORCEMENTS ARRIVED", x: spawnX, y: state.base.y - 20, color: '#3b82f6', type: FloatingTextType.SYSTEM
            });
        }

        // Ally Logic (Movement & Combat)
        state.allies.forEach(a => {
            // ... (Target finding logic remains same)
            let target: Enemy | null = null;
            let minDistSq = Infinity;
            let scanRange = 400;
            if (a.currentOrder === 'FOLLOW') scanRange = 500;
            if (a.currentOrder === 'ATTACK') scanRange = 3000;

            if (scanRange > 1000) {
                for (const e of state.enemies) {
                    const dSq = (e.x - a.x)**2 + (e.y - a.y)**2;
                    if (dSq < scanRange**2 && dSq < minDistSq) {
                        minDistSq = dSq;
                        target = e;
                    }
                }
            } else {
                this.targetCache.length = 0;
                this.spatialGrid.query(a.x, a.y, scanRange, this.targetCache);
                for (const e of this.targetCache) {
                    const dSq = (e.x - a.x)**2 + (e.y - a.y)**2;
                    if (dSq < scanRange**2 && dSq < minDistSq) {
                        minDistSq = dSq;
                        target = e;
                    }
                }
            }

            let shouldEngage = !!target;
            if (a.currentOrder === 'FOLLOW') {
                const distToPlayerSq = (a.x - player.x)**2 + (a.y - player.y)**2;
                if (distToPlayerSq > 600 * 600) shouldEngage = false;
            }

            if (shouldEngage && target) {
                a.state = 'COMBAT';
                const d = Math.sqrt(minDistSq);
                const idealDist = 200;
                let moveAngle = Math.atan2(target.y - a.y, target.x - a.x);
                if (d < idealDist) moveAngle += Math.PI;
                if (Math.abs(d - idealDist) > 30) {
                    a.x += Math.cos(moveAngle) * a.speed * timeScale;
                    a.y += Math.sin(moveAngle) * a.speed * timeScale;
                }
                a.angle = Math.atan2(target.y - a.y, target.x - a.x);

                if (d < ALLY_STATS.range && time - a.lastFireTime > 500) {
                    this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                        x: a.x, y: a.y, targetX: target.x, targetY: target.y, speed: 15, damage: a.damage, fromPlayer: true, color: '#60a5fa', maxRange: ALLY_STATS.range + 50, source: DamageSource.ALLY
                    });
                    a.lastFireTime = time;
                    this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'ALLY' });
                }
            } else {
                a.state = a.currentOrder === 'ATTACK' ? 'ATTACK' : a.currentOrder === 'FOLLOW' ? 'FOLLOW' : 'PATROL';
                let destX = a.patrolPoint.x;
                let destY = a.patrolPoint.y;
                let stopDist = 10;
                if (a.currentOrder === 'FOLLOW') {
                    destX = player.x; destY = player.y; stopDist = 120;
                }
                const dx = destX - a.x; const dy = destY - a.y; const distSq = dx*dx + dy*dy;
                if (distSq > stopDist * stopDist) {
                    const angle = Math.atan2(dy, dx);
                    a.x += Math.cos(angle) * a.speed * timeScale;
                    a.y += Math.sin(angle) * a.speed * timeScale;
                    a.angle = angle;
                }
            }
            // Use state dimensions for clamping to support Campaign Mode
            a.x = Math.max(0, Math.min(state.worldWidth, a.x));
            a.y = Math.max(0, Math.min(state.worldHeight, a.y));
        });
        
        state.allies = state.allies.filter(a => a.hp > 0);
    }

    private updateTurrets(time: number) {
        const state = this.getState();
        state.turretSpots.forEach(spot => {
            const t = spot.builtTurret;
            if (!t) return;

            if (t.hp <= 0) {
                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: spot.x, y: spot.y, color: '#ef4444', count: 10, speed: 5 });
                this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: spot.x, y: spot.y, color: '#9ca3af', count: 8, speed: 3 });
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION' });
                spot.builtTurret = undefined;
                return;
            }
            
            // Logic for Gauss Spin-Up Decay (reset if idle for > 2s)
            if (t.type === TurretType.GAUSS && t.spinUp && t.spinUp > 0) {
                if (time - t.lastFireTime > 2000) {
                    t.spinUp = 0;
                }
            }

            // Calculate Effective Fire Rate
            // Base Fire Rate is stored in t.fireRate (already includes stat modifiers from upgrade/build time)
            // Apply Dynamic Modifiers (Spin Up)
            let currentFireRate = t.fireRate;
            if (t.type === TurretType.GAUSS) {
                // Formula: Base / (1 + Bonus%)
                // SpinUp ranges 0.0 to 2.0
                currentFireRate = t.fireRate / (1 + (t.spinUp || 0));
            }

            if (time - t.lastFireTime > currentFireRate) {
                let target: Enemy | null = null;
                let minDistSq = t.range * t.range;
                let possibleTargets: Enemy[] = [];
                if (t.range > 2000) possibleTargets = state.enemies;
                else {
                    this.targetCache.length = 0;
                    this.spatialGrid.query(spot.x, spot.y, t.range, this.targetCache);
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
                    
                    let isExplosive = false;
                    let isPiercing = false;
                    let speed = 20;
                    let color = '#10b981';
                    let explosionRadius = 0;

                    if (t.type === TurretType.SNIPER) { // Railgun
                        isExplosive = false; 
                        isPiercing = true; // Penetration
                        color = '#FAFAFA'; // White/Cyan beam color
                        speed = 60; // Very fast, beam-like
                    } else if (t.type === TurretType.MISSILE) {
                        isExplosive = true;
                        explosionRadius = 100;
                    }

                    this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                        x: spot.x, 
                        y: spot.y, 
                        targetX: target.x, 
                        targetY: target.y, 
                        speed: speed, 
                        damage: t.damage, 
                        fromPlayer: true, 
                        color: color, 
                        homingTargetId: t.type === TurretType.MISSILE ? target.id : undefined, 
                        isHoming: t.type === TurretType.MISSILE, 
                        maxRange: t.range, 
                        source: DamageSource.TURRET,
                        isExplosive: isExplosive,
                        isPiercing: isPiercing,
                        // @ts-ignore - passing extra prop to be handled by ProjectileManager/Physics
                        explosionRadius: explosionRadius 
                    });
                    t.lastFireTime = time;
                    this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: t.type });

                    // Increment Spin Up
                    if (t.type === TurretType.GAUSS) {
                        t.spinUp = Math.min(2.0, (t.spinUp || 0) + 0.01);
                    }
                }
            }
        });
    }

    public interact() {
        const state = this.getState();
        const p = state.player;
        
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
                cost = this.stats.get(StatId.TURRET_COST, cost);
                cost = Math.floor(cost);

                if (p.score >= cost) {
                    p.score -= cost;
                    
                    const baseStats = TURRET_STATS[TurretType.STANDARD];
                    
                    // Apply Modifiers
                    const finalHp = this.stats.get(StatId.TURRET_HP, baseStats.hp);
                    let finalDmg = this.stats.get(StatId.TURRET_DAMAGE_GLOBAL, baseStats.damage);
                    finalDmg = this.stats.get(StatId.TURRET_L1_DAMAGE, finalDmg);
                    
                    let finalRate = this.stats.get(StatId.TURRET_RATE_GLOBAL, baseStats.fireRate);
                    finalRate = this.stats.get(StatId.TURRET_L1_RATE, finalRate);

                    spot.builtTurret = {
                        id: `t-${Date.now()}`,
                        x: spot.x, y: spot.y, radius: 12, angle: 0, color: '', level: 1,
                        type: TurretType.STANDARD, lastFireTime: 0,
                        range: baseStats.range,
                        hp: finalHp, maxHp: finalHp,
                        damage: finalDmg, fireRate: finalRate,
                        spinUp: 0
                    };
                    this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 'BUILD' });
                } else {
                    this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                        text: "INSUFFICIENT FUNDS", x: p.x, y: p.y - 50, color: 'red', type: FloatingTextType.SYSTEM
                    });
                }
            } else {
                if (spot.builtTurret.level < 2) {
                    state.activeTurretId = closestSpot;
                }
            }
        }
    }

    public confirmTurretUpgrade(type: TurretType) {
        const state = this.getState();
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

            // Apply Stats
            spot.builtTurret.maxHp = this.stats.get(StatId.TURRET_HP, baseStats.hp);
            spot.builtTurret.hp = spot.builtTurret.maxHp;
            
            // Damage
            let dmg = this.stats.get(StatId.TURRET_DAMAGE_GLOBAL, baseStats.damage);
            if (type === TurretType.MISSILE) dmg = this.stats.get(StatId.TURRET_MISSILE_DAMAGE, dmg);
            spot.builtTurret.damage = dmg;

            // Range
            let range = baseStats.range;
            if (type === TurretType.SNIPER) range = this.stats.get(StatId.TURRET_SNIPER_RANGE, range);
            spot.builtTurret.range = range;

            // Rate calculation
            const rateMult = this.stats.get(StatId.TURRET_RATE_GLOBAL, 1.0);
            let specificMult = 1.0;
            if (type === TurretType.GAUSS) specificMult = this.stats.get(StatId.TURRET_GAUSS_RATE, 1.0);
            
            spot.builtTurret.fireRate = baseStats.fireRate / (rateMult * specificMult);
            spot.builtTurret.spinUp = 0; // Reset spinup on upgrade
            
            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 'UPGRADE' });
            this.closeTurretUpgrade();
        }
    }

    public closeTurretUpgrade() { 
        this.getState().activeTurretId = undefined; 
        this.events.emit(GameEventType.UI_UPDATE, { reason: 'CLOSE_MENU' });
    }
    
    public issueOrder(order: AllyOrder) { 
        this.getState().allies.forEach(a => a.currentOrder = order); 
    }
}
