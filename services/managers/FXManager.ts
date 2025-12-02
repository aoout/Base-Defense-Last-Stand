
import { GameEngine } from '../gameService';
import { TOXIC_ZONE_STATS } from '../../data/registry';

export class FXManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number, timeScale: number) {
        this.updateParticles(dt, timeScale);
        this.updateToxicZones(dt);
    }

    private updateParticles(dt: number, timeScale: number) {
        this.engine.state.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= dt * 0.05; 
        });
        this.engine.state.particles = this.engine.state.particles.filter(p => p.life > 0);
    }

    private updateToxicZones(dt: number) {
        const state = this.engine.state;
        state.toxicZones.forEach(z => {
            z.life -= dt;
            // Damage tick
            if (z.life % 500 < dt) { 
                const p = state.player;
                const d = Math.sqrt((p.x - z.x)**2 + (p.y - z.y)**2);
                if (d < z.radius) {
                    this.engine.playerManager.damagePlayer(z.damagePerSecond * 0.5);
                }
            }
        });
        state.toxicZones = state.toxicZones.filter(z => z.life > 0);
    }

    public spawnParticle(x: number, y: number, color: string, count: number, speed: number) {
        for(let i=0; i<count; i++) {
            const a = Math.random() * Math.PI*2;
            const s = Math.random() * speed;
            this.engine.state.particles.push({
                id: `pt-${Math.random()}`,
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 1.0,
                maxLife: 1.0,
                color,
                radius: Math.random() * 3,
                angle: 0
            });
        }
    }

    public spawnBloodStain(x: number, y: number, color: string) {
        if (!this.engine.state.settings.showBlood) return;
        this.engine.state.bloodStains.push({
            id: `bs-${Math.random()}`,
            x, y, color,
            life: 30000,
            maxLife: 30000,
            blotches: Array.from({length: 5}, () => ({
                x: (Math.random()-0.5)*20,
                y: (Math.random()-0.5)*20,
                r: 2 + Math.random()*8
            }))
        });
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
