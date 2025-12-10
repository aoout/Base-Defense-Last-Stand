
import { GameState, HeroicNode, HeroicUpgradeType, StatId, ModifierType, GameEventType, PlaySoundEvent } from '../../../types';
import { EventBus } from '../../EventBus';
import { StatManager } from '../StatManager';

export class HeroicManager {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;
    }

    public generateGrid() {
        const s = this.getState().spaceship;
        // Check if we need to regenerate (either empty, or legacy heart shape detected)
        // Legacy heart shape had x/y roughly in range [-1, 1].
        // New Helix shape will have y spanning much larger range (e.g. 0 to 100).
        // We force regeneration if it looks like the old grid or is empty.
        
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
        // We create 3 strands intertwined.
        // Strand 0: Offense (Left)
        // Strand 1: Utility (Center/Core)
        // Strand 2: Defense (Right)
        
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

        // Connectivity Logic for Helix
        // 1. Bottom nodes (row 0 => ids 0,1,2) are always unlockable
        // 2. Otherwise, need connection to a node in the Previous Row
        // Simplified connectivity: Need ANY node from (row-1) to be purchased? 
        // Or strictly same strand? Let's allow cross-strand connections for flexibility.
        // Rule: Can buy Node N if ANY node in range [N-4, N-1] is purchased.
        // Actually, let's say you need a connection from the node "below" it geometrically.
        
        // Strict Strand Logic:
        // Strand 0 (Left) needs prev Node on Strand 0 OR Center
        // Strand 1 (Center) needs prev Node on Center OR Left OR Right
        // Strand 2 (Right) needs prev Node on Strand 2 OR Center
        
        // Let's implement a simpler "Proximity" check since we have x,y
        // Or just ID based:
        // Node i is unlockable if:
        // i < 3 (Base layer)
        // OR (i-3 is purchased) [Same strand vertical]
        // OR (i-2 is purchased) [Diagonal]
        // OR (i-4 is purchased) [Diagonal]
        
        // Let's go with: You can buy node I if any node J is purchased AND J is in the row directly below I.
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

    public registerModifiers() {
        const s = this.getState().spaceship;
        this.stats.removeSource('HEROIC');

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
                        this.stats.add({ statId, value: val, type: modType, source: 'HEROIC' });
                    }
                }
            });
        }
    }
}
