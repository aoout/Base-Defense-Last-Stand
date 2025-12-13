
import { GameState, GameEventType, PlaySoundEvent, SpawnParticleEvent, FloatingTextType, IGameSystem } from '../../types';
import { EventBus } from '../EventBus';
import { FXManager } from '../managers/FXManager';

export class DropSequenceSystem implements IGameSystem {
    public readonly systemId = 'DROP_SEQUENCE_SYSTEM';

    private getState: () => GameState;
    private events: EventBus;
    private fx: FXManager; // Optional helper for direct text? Or emit events.

    constructor(getState: () => GameState, events: EventBus, fx: FXManager) {
        this.getState = getState;
        this.events = events;
        this.fx = fx;
    }

    public update(dt: number, time: number, timeScale: number) {
        const state = this.getState();
        const bd = state.baseDrop;

        if (!bd || !bd.active) return;

        // --- PHASE 1: RE-ENTRY ---
        if (bd.phase === 'ENTRY') {
            const dist = bd.targetY - bd.y;
            const retroBurnHeight = 600;

            // Physics: Accelerate until retro-burn height, then brake hard
            if (dist > retroBurnHeight) {
                bd.velocity += 0.5 * timeScale;
                if (bd.velocity > 45) bd.velocity = 45; // Terminal velocity
                
                // Atmosphere entry particles
                if (Math.random() < 0.4) {
                    this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                        x: state.base.x + (Math.random()-0.5)*90, 
                        y: bd.y - 60, 
                        color: '#f97316', 
                        count: 2, 
                        speed: 20
                    });
                }
            } 
            else {
                // Retro-Thrusters (Braking)
                bd.velocity -= 1.8 * timeScale;
                if (bd.velocity < 15) bd.velocity = 15; // Minimum impact speed
                
                // Thruster particles
                if (Math.random() < 0.8) {
                     const bx = state.base.x;
                     this.spawnThrusterParticle(bx - 40, bd.y + 50);
                     this.spawnThrusterParticle(bx - 20, bd.y + 50);
                     this.spawnThrusterParticle(bx + 40, bd.y + 50);
                     this.spawnThrusterParticle(bx + 20, bd.y + 50);
                }
            }

            // Move
            bd.y += bd.velocity * timeScale;

            // Check Impact
            if (bd.y >= bd.targetY) {
                this.triggerImpact(bd, state);
            }
        } 
        // --- PHASE 2: DEPLOYMENT ---
        else if (bd.phase === 'DEPLOY') {
            bd.deployTimer += dt;
            
            // Steam/Cooling effects
            if (bd.deployTimer < 1000 && Math.random() < 0.2) {
                 this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                    x: state.base.x + (Math.random()-0.5)*100, 
                    y: state.base.y - 20, 
                    color: '#ffffff', 
                    count: 1, 
                    speed: 2
                });
            }

            // Deployment Complete
            if (bd.deployTimer > 2000) {
                this.finishDeployment(bd, state);
            }
        }
    }

    private spawnThrusterParticle(x: number, y: number) {
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
            x, y, color: Math.random() > 0.5 ? '#60a5fa' : '#93c5fd', count: 1, speed: 15
        });
    }

    private triggerImpact(bd: any, state: GameState) {
        bd.y = bd.targetY;
        bd.phase = 'IMPACT';
        
        // Audio & Visuals
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'EXPLOSION', x: state.base.x, y: bd.targetY });
        
        // Massive Dust Cloud
        for(let i=0; i<30; i++) {
            this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
                x: state.base.x, 
                y: bd.targetY, 
                color: '#94a3b8', 
                count: 1, 
                speed: 10 + Math.random() * 20
            });
        }

        // Damage Landing Zone (Crush enemies)
        this.events.emit(GameEventType.DAMAGE_AREA, {
            x: state.base.x, 
            y: bd.targetY, 
            radius: 350, 
            damage: 2000, 
            source: 'ORBITAL' 
        });

        // Schedule next phase
        setTimeout(() => { 
            if(state.baseDrop) state.baseDrop.phase = 'DEPLOY'; 
        }, 800);
    }

    private finishDeployment(bd: any, state: GameState) {
        bd.active = false;
        
        // Spawn Player
        state.player.x = state.base.x;
        state.player.y = state.base.y + 50; 
        
        // Teleport Effect
        this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, {
            x: state.player.x, y: state.player.y, color: '#3b82f6', count: 20, speed: 5
        });
        
        this.fx.addFloatingText("OPERATIVE DEPLOYED", state.player.x, state.player.y - 60, '#3b82f6', FloatingTextType.SYSTEM);
    }
}
