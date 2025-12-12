
import { Enemy, Projectile, WeaponType, ModuleType, DamageSource, GameEventType, StatId, DamageEnemyEvent, PlaySoundEvent, SpawnParticleEvent, DamageAreaEvent, SpawnToxicZoneEvent } from '../../types';
import { StatManager } from '../managers/StatManager';
import { EventBus } from '../EventBus';

/**
 * CombatEvaluator
 * Responsibilities:
 * 1. Calculate final damage values based on stats, modifiers, and weapon types.
 * 2. Determine projectile behavior (piercing, explosion).
 * 3. Emit combat feedback events (SFX, Particles).
 */
export class CombatEvaluator {
    private stats: StatManager;
    private events: EventBus;

    constructor(stats: StatManager, events: EventBus) {
        this.stats = stats;
        this.events = events;
    }

    /**
     * Calculates the raw damage a projectile should deal to a specific enemy.
     * Handles: Tech upgrades, Module effects, Weapon-specific decay.
     */
    public calculateDamage(p: Projectile, e: Enemy): number {
        // 1. Base Damage Multiplier (e.g. Carapace Analyzer vs specific Enemy Type)
        const typeMod = this.stats.get(`DMG_VS_${e.type}` as StatId, 1.0);
        let damage = p.damage * typeMod;

        // 2. Piercing Decay Logic
        if (p.isPiercing && p.hitIds) {
            const hitCount = p.hitIds.length;
            
            if (p.weaponType === WeaponType.PULSE_RIFLE) {
                // Pulse Rifle: 20% decay per hit
                damage *= Math.pow(0.8, hitCount); 
            } else if (p.source === DamageSource.TURRET) {
                // Railgun: 8% decay per hit
                damage *= Math.pow(0.92, hitCount); 
            } else if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
                // Kinetic Stabilizer: 2nd hit deals 80% damage
                if (hitCount === 1) damage *= 0.8; 
            }
        }

        return Math.max(1, damage);
    }

    /**
     * Executes the logic when a projectile successfully hits an enemy.
     */
    public resolveHit(p: Projectile, e: Enemy): void {
        const damage = this.calculateDamage(p, e);

        // 1. Apply Damage
        this.events.emit<DamageEnemyEvent>(GameEventType.DAMAGE_ENEMY, { 
            targetId: e.id, 
            amount: damage, 
            source: p.source,
            weaponType: p.weaponType 
        });

        // 2. Visual & Audio Feedback
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'BULLET_HIT', x: e.x, y: e.y });

        // 3. Special Effects (Explosions)
        if (p.isExplosive) {
            this.triggerExplosion(p, damage);
        }
    }

    /**
     * Determines if the projectile should be destroyed after this hit.
     */
    public shouldTerminate(p: Projectile, e: Enemy): boolean {
        // Explosives always terminate on impact
        if (p.isExplosive) return true;

        // Piercing Logic
        if (p.isPiercing) {
            this.recordHit(p, e.id);
            
            // Special Case: Kinetic Stabilizer (Max 2 hits)
            if (this.hasModule(p, ModuleType.KINETIC_STABILIZER)) {
                return (p.hitIds?.length || 0) >= 2;
            }
            // Standard piercing (Pulse/Sniper/Flamer) continues indefinitely (until range expires)
            return false;
        }

        // Default: Bullet is destroyed
        return true;
    }

    /**
     * Handles Area of Effect logic
     */
    public triggerExplosion(p: Projectile, damage: number) {
        const radius = p.explosionRadius || 100;
        
        this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, { 
            x: p.x, y: p.y, radius, damage, source: p.source 
        });
        
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { 
            x: p.x, y: p.y, color: '#f87171', count: 10, speed: 10 
        });
        
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: p.x, y: p.y });
    }

    public triggerEnvironmentalEffect(p: Projectile) {
        if (p.createsToxicZone) {
            this.events.emit<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, { x: p.x, y: p.y });
        }
    }

    // --- Helpers ---

    private recordHit(p: Projectile, entityId: string) {
        if (!p.hitIds) p.hitIds = [];
        p.hitIds.push(entityId);
    }

    private hasModule(p: Projectile, moduleType: ModuleType): boolean {
        return !!p.activeModules?.some(m => m.type === moduleType);
    }
    
    public hasAlreadyHit(p: Projectile, entityId: string): boolean {
        return !!(p.isPiercing && p.hitIds && p.hitIds.includes(entityId));
    }
}
