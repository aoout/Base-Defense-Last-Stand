
import { GameState, HeroicNode, HeroicUpgradeType, StatId, ModifierType, GameEventType, PlaySoundEvent } from '../../../types';
import { EventBus } from '../../EventBus';
import { StatManager } from '../StatManager';
import { ISpaceshipSystem } from './ISpaceshipSystem';

export class HeroicManager implements ISpaceshipSystem {
    public readonly systemId = 'HEROIC';

    private getState: () => GameState;
    private events: EventBus;

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
    }

    public update(dt: number): void {
        // No per-frame update needed
    }

    public applyStats(stats: StatManager): void {
        const s = this.getState().spaceship;
        
        // Clean up previous modifiers from this source
        stats.removeSource(this.systemId);

        if (s.heroicNodes) {
            s.heroicNodes.forEach(node => {
                if (node.purchased) {
                    let statId: string | null = null;
                    let modType = ModifierType.FLAT;
                    let val = node.value;

                    switch(node.type) {
                        case HeroicUpgradeType.MAX_HP: 
                            statId = StatId.PLAYER_MAX_HP; 
                            modType = ModifierType.FLAT; 
                            break;
                        case HeroicUpgradeType.MAX_ARMOR: 
                            statId = StatId.PLAYER_MAX_ARMOR; 
                            modType = ModifierType.FLAT; 
                            break;
                        case HeroicUpgradeType.DAMAGE: 
                            statId = StatId.PLAYER_DAMAGE; 
                            modType = ModifierType.PERCENT_ADD; 
                            break;
                        case HeroicUpgradeType.MOVE_SPEED: 
                            statId = StatId.PLAYER_MOVE_SPEED; 
                            modType = ModifierType.PERCENT_ADD; 
                            break;
                        case HeroicUpgradeType.RELOAD_SPEED: 
                            statId = StatId.PLAYER_RELOAD_SPEED; 
                            modType = ModifierType.PERCENT_ADD; 
                            val = -node.value; // Reduction
                            break;
                        case HeroicUpgradeType.TURRET_MASTERY: 
                            statId = StatId.TURRET_DAMAGE_GLOBAL; 
                            modType = ModifierType.PERCENT_ADD; 
                            break;
                    }

                    if (statId) {
                        stats.add({ statId, value: val, type: modType, source: this.systemId });
                    }
                }
            });
        }
    }

    public generateGrid() {
        const s = this.getState().spaceship;
        // Check if we need to regenerate (either empty, or legacy heart shape detected)
        
        let needRegen = false;
        if (!s.heroicNodes || s.heroicNodes.length === 0) {
            needRegen = true;
        } else {
            // Simple heuristic: if max Y is small (< 5), it's likely the old heart shape
            const maxY = Math.max(...s.heroicNodes.map(n => Math.abs(n.y)));
            if (maxY < 5) needRegen = true;
        }

        if (!needRegen) return;

        // Preserve purchased state if regenerating
        const purchasedIds = new Set<number>();
        if (s.heroicNodes) {
            s.heroicNodes.forEach(n => {
                if (n.purchased) purchasedIds.add(n.id);
            });
        }

        s.heroicNodes = [];
        const totalNodes = 100;
        
        // --- HELIX PARAMETERS ---
        const verticalSpacing = 0.8; // Distance between rows
        const radius = 2.5; // Width of the helix
        const twistRate = 0.2; // How fast it spins

        for (let i = 0; i < totalNodes; i++) {
            const strand = i % 3; // 0, 1, 2
            const row = Math.floor(i / 3);
            
            // Y is simple vertical progression (Inverted so 0 is bottom, growing UP)
            // Normalized roughly 0 to -80
            const y = -(row * verticalSpacing);
            
            let x = 0;
            let type = HeroicUpgradeType.DAMAGE;
            
            // Calculate X based on strand and twist
            const angle = row * twistRate;
            
            if (strand === 0) {
                // OFFENSE STRAND (Red) - Sine Wave
                x = Math.sin(angle) * radius;
                // Weighted Random for Offense
                const r = Math.random();
                if (r < 0.6) type = HeroicUpgradeType.DAMAGE;
                else if (r < 0.9) type = HeroicUpgradeType.RELOAD_SPEED;
                else type = HeroicUpgradeType.TURRET_MASTERY;
            } 
            else if (strand === 1) {
                // UTILITY STRAND (Gold/Green) - Straight Core with slight wobble
                x = Math.cos(angle * 2) * 0.5; // Tighter core
                const r = Math.random();
                if (r < 0.5) type = HeroicUpgradeType.MOVE_SPEED;
                else if (r < 0.8) type = HeroicUpgradeType.TURRET_MASTERY;
                else type = HeroicUpgradeType.RELOAD_SPEED;
            } 
            else {
                // DEFENSE STRAND (Blue) - Opposing Sine Wave
                x = Math.sin(angle + Math.PI) * radius;
                const r = Math.random();
                if (r < 0.5) type = HeroicUpgradeType.MAX_HP;
                else if (r < 0.9) type = HeroicUpgradeType.MAX_ARMOR;
                else type = HeroicUpgradeType.MOVE_SPEED;
            }

            // Value Scaling: Higher nodes (lower Y value) get slightly better stats
            const tierMult = 1 + (row / (totalNodes/3)) * 0.5; // Up to 1.5x at top

            let value = 0;
            switch(type) {
                case HeroicUpgradeType.MAX_HP: value = Math.floor((10 + Math.random() * 11) * tierMult); break;
                case HeroicUpgradeType.MAX_ARMOR: value = Math.floor((10 + Math.random() * 11) * tierMult); break;
                case HeroicUpgradeType.DAMAGE: value = (0.05 + Math.random() * 0.05) * tierMult; break;
                case HeroicUpgradeType.MOVE_SPEED: value = (0.01 + Math.random() * 0.01); break; // Speed shouldn't scale too hard
                case HeroicUpgradeType.RELOAD_SPEED: value = (0.03 + Math.random() * 0.03); break;
                case HeroicUpgradeType.TURRET_MASTERY: value = (0.03 + Math.random() * 0.03) * tierMult; break;
            }

            // Cost Scaling: Increases with height
            const cost = Math.floor((1500 + (row * 150)) * (0.9 + Math.random() * 0.2));

            s.heroicNodes.push({
                id: i,
                x, 
                y,
                type,
                value,
                cost,
                purchased: purchasedIds.has(i)
            });
        }
        
        // Ensure Base Node (0) is affordable/starter
        s.heroicNodes[0].cost = 500;
        s.heroicNodes[1].cost = 500;
        s.heroicNodes[2].cost = 500;

        // Force UI update so the view receives the new nodes immediately
        this.events.emit(GameEventType.UI_UPDATE, { reason: 'HEROIC_GEN' });
    }

    public purchaseNode(id: number) {
        const state = this.getState();
        const p = state.player;
        const node = state.spaceship.heroicNodes.find(n => n.id === id);

        if (!node || node.purchased) return;
        if (p.score < node.cost) return;

        // Connection Check
        const row = Math.floor(id / 3);
        let isReachable = false;
        
        if (row === 0) {
            isReachable = true;
        } else {
            // Check previous row (indices (row-1)*3 to (row-1)*3 + 2)
            const startPrev = (row - 1) * 3;
            const endPrev = startPrev + 3;
            for(let j=startPrev; j<endPrev; j++) {
                if (j >= 0 && j < state.spaceship.heroicNodes.length) {
                    if (state.spaceship.heroicNodes[j].purchased) {
                        isReachable = true;
                        break;
                    }
                }
            }
        }

        if (!isReachable) return;

        p.score -= node.cost;
        node.purchased = true;
        
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
    }
}
