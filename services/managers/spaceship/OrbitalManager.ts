
import { GameState, SpaceshipModuleType, Enemy, OrbitalUpgradeNode, OrbitalUpgradeEffect, OrbitalBeam, GameEventType, PlaySoundEvent, SpawnParticleEvent, ShowFloatingTextEvent, FloatingTextType, DamageAreaEvent, DamageSource } from '../../../types';
import { EventBus } from '../../EventBus';
import { StatManager } from '../StatManager';
import { ORBITAL_STATS } from '../../../data/config/upgrades';

export class OrbitalManager {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;
    }

    public update(dt: number) {
        const state = this.getState();
        
        // Orbital Cannon Logic
        if (state.gameMode === 'EXPLORATION' && state.spaceship.installedModules.includes(SpaceshipModuleType.ORBITAL_CANNON)) {
            state.orbitalSupportTimer += dt;
            
            const baseRate = ORBITAL_STATS.baseRate;
            const rateMultiplier = state.spaceship.orbitalRateMultiplier || 1;
            const effectiveRate = baseRate / rateMultiplier;

            if (state.orbitalSupportTimer > effectiveRate) {
                const b = state.base;
                let closest: Enemy | null = null;
                let minDist = Infinity;
                
                state.enemies.forEach(e => {
                    const dist = Math.sqrt((e.x - b.x)**2 + (e.y - b.y)**2);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = e;
                    }
                });

                if (closest) {
                    const baseDamage = ORBITAL_STATS.baseDamage;
                    const damageMultiplier = state.spaceship.orbitalDamageMultiplier || 1;
                    
                    const finalDamage = baseDamage * damageMultiplier;

                    // Switch to AOE Damage
                    this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, {
                        x: closest.x,
                        y: closest.y,
                        radius: ORBITAL_STATS.impactRadius,
                        damage: finalDamage,
                        source: DamageSource.ORBITAL
                    });
                    
                    const beam: OrbitalBeam = {
                        id: `beam-${Date.now()}`,
                        x: closest.x,
                        y: closest.y,
                        life: 1.0,
                        maxLife: ORBITAL_STATS.beamDuration, 
                        width: 60, // Slightly wider for impact visual
                        color: '#06b6d4'
                    };
                    state.orbitalBeams.push(beam);

                    this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: closest.x, y: closest.y, color: '#06b6d4', count: 20, speed: 8 });
                    this.events.emit<SpawnParticleEvent>(GameEventType.SPAWN_PARTICLE, { x: closest.x, y: closest.y, color: '#ffffff', count: 12, speed: 12 });
                    
                    this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                        text: `ORBITAL STRIKE: ${Math.floor(finalDamage)}`,
                        x: closest.x, y: closest.y - 60, color: '#06b6d4', type: FloatingTextType.SYSTEM
                    });
                    
                    this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'ORBITAL_STRIKE', x: closest.x, y: closest.y }); 
                }
                
                state.orbitalSupportTimer = 0;
            }
        }

        if (state.orbitalBeams.length > 0) {
            state.orbitalBeams.forEach(b => {
                b.life -= dt / b.maxLife;
            });
            state.orbitalBeams = state.orbitalBeams.filter(b => b.life > 0);
        }
    }

    public generateUpgradeTree() {
        const s = this.getState().spaceship;
        if (s.orbitalUpgradeTree && s.orbitalUpgradeTree.length > 0) return;
  
        const tree: OrbitalUpgradeNode[][] = [];
        
        for (let layerIndex = 0; layerIndex < 7; layerIndex++) {
            const layerNumber = layerIndex + 1; 
            const nodeCount = layerNumber; 
            const layerNodes: OrbitalUpgradeNode[] = [];
            
            for (let i = 0; i < nodeCount; i++) {
                const baseCost = 1000 * (1 + layerNumber);
                const variance = 0.8 + Math.random() * 0.4;
                const cost = Math.floor(baseCost * variance);
  
                const isRate = Math.random() < 0.2; 
                const effectType = isRate ? OrbitalUpgradeEffect.RATE : OrbitalUpgradeEffect.DAMAGE;
                
                let effectValue = 0;
                if (isRate) {
                    effectValue = 0.08 + Math.random() * 0.06;
                } else {
                    effectValue = 0.10 + Math.random() * 0.18;
                }
  
                layerNodes.push({
                    id: `orb-upg-${layerNumber}-${i}`,
                    layer: layerNumber,
                    index: i,
                    cost,
                    effectType,
                    effectValue,
                    purchased: false
                });
            }
            tree.push(layerNodes);
        }
        
        s.orbitalUpgradeTree = tree;
        s.orbitalDamageMultiplier = 1;
        s.orbitalRateMultiplier = 1;
    }
  
    public purchaseUpgrade(nodeId: string) {
        const state = this.getState();
        const p = state.player;
        const s = state.spaceship;
        
        let node: OrbitalUpgradeNode | null = null;
        let layerIndex = -1;
        
        for(let i=0; i<s.orbitalUpgradeTree.length; i++) {
            const found = s.orbitalUpgradeTree[i].find(n => n.id === nodeId);
            if (found) {
                node = found;
                layerIndex = i; 
                break;
            }
        }
  
        if (!node || node.purchased) return;
        if (p.score < node.cost) return;
        if (layerIndex > 0) {
            const prevLayer = s.orbitalUpgradeTree[layerIndex - 1];
            const purchasedCount = prevLayer.filter(n => n.purchased).length;
            const required = Math.ceil(prevLayer.length / 2);
            if (purchasedCount < required) return;
        }
  
        p.score -= node.cost;
        node.purchased = true;
        
        if (node.effectType === OrbitalUpgradeEffect.DAMAGE) {
            s.orbitalDamageMultiplier += node.effectValue;
        } else {
            s.orbitalRateMultiplier += node.effectValue;
        }
        
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
    }
}
