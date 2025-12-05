
import { GameState, Particle, BloodStain, GameEventType, SpawnParticleEvent, SpawnBloodStainEvent, SpawnToxicZoneEvent } from '../../types';
import { TOXIC_ZONE_STATS } from '../../data/registry';
import { EventBus } from '../EventBus';
import { ObjectPool, generateId } from '../../utils/ObjectPool';

export class FXManager {
    private getState: () => GameState;
    private events: EventBus;
    private particlePool: ObjectPool<Particle>;
    private bloodPool: ObjectPool<BloodStain>;

    constructor(getState: () => GameState, eventBus: EventBus) {
        this.getState = getState;
        this.events = eventBus;

        this.particlePool = new ObjectPool<Particle>(
            () => ({
                id: '', x: 0, y: 0, radius: 0, angle: 0, color: '#fff',
                vx: 0, vy: 0, life: 0, maxLife: 0
            })
        );

        this.bloodPool = new ObjectPool<BloodStain>(
            () => ({
                id: '', x: 0, y: 0, color: '#fff', life: 0, maxLife: 0, blotches: []
            })
        );

        // Register Listeners
        this.events.on<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, (e) => {
            this.spawnParticle(e.x, e.y, e.color, e.count, e.speed);
        });
        this.events.on<SpawnBloodStainEvent>(GameEventType.SPAWN_BLOOD_STAIN, (e) => {
            this.spawnBloodStain(e.x, e.y, e.color, e.maxHp);
        });
        this.events.on<SpawnToxicZoneEvent>(GameEventType.SPAWN_TOXIC_ZONE, (e) => {
            this.spawnToxicZone(e.x, e.y);
        });
    }

    public update(dt: number, timeScale: number) {
        this.updateParticles(dt, timeScale);
        this.updateBlood(dt);
        this.updateToxicZones(dt);
    }

    private updateParticles(dt: number, timeScale: number) {
        const state = this.getState();
        const particles = state.particles;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt * 0.05;

            if (p.life <= 0) {
                this.particlePool.release(p);
                particles[i] = particles[particles.length - 1];
                particles.pop();
            }
        }
    }

    private updateBlood(dt: number) {
        const state = this.getState();
        const stains = state.bloodStains;
        for (let i = stains.length - 1; i >= 0; i--) {
            const b = stains[i];
            b.life -= dt;
            if (b.life <= 0) {
                this.bloodPool.release(b);
                stains[i] = stains[stains.length - 1];
                stains.pop();
            }
        }
    }

    private updateToxicZones(dt: number) {
        const state = this.getState();
        const zones = state.toxicZones;
        
        for (let i = zones.length - 1; i >= 0; i--) {
            const z = zones[i];
            z.life -= dt;
            
            // NOTE: Damage logic moved to PhysicsSystem

            if (z.life <= 0) {
                zones[i] = zones[zones.length - 1];
                zones.pop();
            }
        }
    }

    public spawnParticle(x: number, y: number, color: string, count: number, speed: number) {
        const state = this.getState();
        const intensity = state.settings.particleIntensity;
        let actualCount = count;
        
        if (intensity === 'LOW') {
            actualCount = Math.floor(count * 0.3);
            if (actualCount < 1 && Math.random() < 0.3) actualCount = 1;
        }

        for(let i=0; i<actualCount; i++) {
            const a = Math.random() * Math.PI*2;
            const s = Math.random() * speed;
            
            const p = this.particlePool.get();
            p.id = generateId('pt');
            p.x = x; 
            p.y = y;
            p.vx = Math.cos(a) * s;
            p.vy = Math.sin(a) * s;
            p.life = 1.0;
            p.maxLife = 1.0;
            p.color = color;
            p.radius = Math.random() * 3;
            p.angle = 0;

            state.particles.push(p);
        }
    }

    public spawnBloodStain(x: number, y: number, color: string, maxHp: number = 100) {
        const state = this.getState();
        if (!state.settings.showBlood) return;
        
        if (state.settings.particleIntensity === 'LOW') {
            if (Math.random() > 0.5) return;
        }
        
        const lifeDuration = Math.min(60000, 10000 + (maxHp * 20));
        
        const b = this.bloodPool.get();
        b.id = generateId('bs');
        b.x = x; 
        b.y = y;
        b.color = color;
        b.life = lifeDuration;
        b.maxLife = lifeDuration;
        
        // Always regenerate blotches for variety
        b.blotches = Array.from({length: 5}, () => ({
            x: (Math.random()-0.5)*20,
            y: (Math.random()-0.5)*20,
            r: 2 + Math.random()*8
        }));

        state.bloodStains.push(b);
    }

    public spawnToxicZone(x: number, y: number) {
        this.getState().toxicZones.push({
            id: generateId('tz'),
            x, y,
            radius: TOXIC_ZONE_STATS.radius,
            damagePerSecond: TOXIC_ZONE_STATS.dps,
            life: TOXIC_ZONE_STATS.duration,
            createdAt: Date.now()
        });
    }
}
