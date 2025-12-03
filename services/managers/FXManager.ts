
import { GameEngine } from '../gameService';
import { TOXIC_ZONE_STATS } from '../../data/registry';
import { Particle, BloodStain } from '../../types';

export class FXManager {
    private engine: GameEngine;
    private particlePool: Particle[] = [];
    private bloodPool: BloodStain[] = [];

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number, timeScale: number) {
        this.updateParticles(dt, timeScale);
        this.updateBlood(dt);
        this.updateToxicZones(dt);
    }

    private updateParticles(dt: number, timeScale: number) {
        const particles = this.engine.state.particles;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt * 0.05;

            if (p.life <= 0) {
                // Recycle
                this.particlePool.push(p);
                
                // Swap-Pop
                particles[i] = particles[particles.length - 1];
                particles.pop();
            }
        }
    }

    private updateBlood(dt: number) {
        const stains = this.engine.state.bloodStains;
        for (let i = stains.length - 1; i >= 0; i--) {
            const b = stains[i];
            b.life -= dt;
            if (b.life <= 0) {
                // Recycle
                this.bloodPool.push(b);

                // Swap-Pop
                stains[i] = stains[stains.length - 1];
                stains.pop();
            }
        }
    }

    private updateToxicZones(dt: number) {
        const state = this.engine.state;
        const zones = state.toxicZones;
        
        for (let i = zones.length - 1; i >= 0; i--) {
            const z = zones[i];
            z.life -= dt;
            
            // Damage tick
            if (z.life % 500 < dt) { 
                const p = state.player;
                const d = Math.sqrt((p.x - z.x)**2 + (p.y - z.y)**2);
                if (d < z.radius) {
                    this.engine.playerManager.damagePlayer(z.damagePerSecond * 0.5);
                }
            }

            if (z.life <= 0) {
                zones[i] = zones[zones.length - 1];
                zones.pop();
            }
        }
    }

    public spawnParticle(x: number, y: number, color: string, count: number, speed: number) {
        for(let i=0; i<count; i++) {
            const a = Math.random() * Math.PI*2;
            const s = Math.random() * speed;
            
            let p: Particle;
            
            if (this.particlePool.length > 0) {
                p = this.particlePool.pop()!;
                // Reset
                p.id = `pt-${Math.random()}`; // ID mainly for React key if needed, though particles aren't React
                p.x = x; p.y = y;
                p.vx = Math.cos(a) * s;
                p.vy = Math.sin(a) * s;
                p.life = 1.0;
                p.maxLife = 1.0;
                p.color = color;
                p.radius = Math.random() * 3;
                p.angle = 0;
            } else {
                p = {
                    id: `pt-${Math.random()}`,
                    x, y,
                    vx: Math.cos(a) * s,
                    vy: Math.sin(a) * s,
                    life: 1.0,
                    maxLife: 1.0,
                    color,
                    radius: Math.random() * 3,
                    angle: 0
                };
            }
            this.engine.state.particles.push(p);
        }
    }

    public spawnBloodStain(x: number, y: number, color: string, maxHp: number = 100) {
        if (!this.engine.state.settings.showBlood) return;
        
        const lifeDuration = Math.min(60000, 10000 + (maxHp * 20));
        
        let b: BloodStain;

        if (this.bloodPool.length > 0) {
            b = this.bloodPool.pop()!;
            b.id = `bs-${Math.random()}`;
            b.x = x; b.y = y;
            b.color = color;
            b.life = lifeDuration;
            b.maxLife = lifeDuration;
            // Regenerate blotches for visual variety
            b.blotches = Array.from({length: 5}, () => ({
                x: (Math.random()-0.5)*20,
                y: (Math.random()-0.5)*20,
                r: 2 + Math.random()*8
            }));
        } else {
            b = {
                id: `bs-${Math.random()}`,
                x, y, color,
                life: lifeDuration,
                maxLife: lifeDuration,
                blotches: Array.from({length: 5}, () => ({
                    x: (Math.random()-0.5)*20,
                    y: (Math.random()-0.5)*20,
                    r: 2 + Math.random()*8
                }))
            };
        }

        this.engine.state.bloodStains.push(b);
    }

    public spawnToxicZone(x: number, y: number) {
        this.engine.state.toxicZones.push({
            id: `${Math.random()}`,
            x, y,
            radius: TOXIC_ZONE_STATS.radius,
            damagePerSecond: TOXIC_ZONE_STATS.dps,
            life: TOXIC_ZONE_STATS.duration,
            createdAt: Date.now()
        });
    }
}
