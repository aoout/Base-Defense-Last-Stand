
import { GameState, CarapaceNode, EnemyType, InfrastructureOption, InfrastructureUpgradeType, GameEventType, PlaySoundEvent, ShowFloatingTextEvent, FloatingTextType, StatId, ModifierType } from '../../../types';
import { EventBus } from '../../EventBus';
import { StatManager } from '../StatManager';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../../constants';

export class TechManager {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;
    }

    // --- CARAPACE ANALYZER ---

    public generateCarapaceGrid() {
        const s = this.getState().spaceship;
        if (s.carapaceGrid) return; 

        const nodes: CarapaceNode[][] = [];
        const targets = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.TANK, EnemyType.KAMIKAZE, EnemyType.VIPER];

        for (let r = 0; r < 4; r++) {
            const row: CarapaceNode[] = [];
            for (let c = 0; c < 4; c++) {
                const x = Math.random();
                const cost = Math.floor(6000 + (6000 * (x * x)));
                
                const target = targets[Math.floor(Math.random() * targets.length)];
                const damageBonus = 0.1 + Math.random() * 0.2;

                row.push({
                    id: `cara-${r}-${c}`,
                    row: r,
                    col: c,
                    cost,
                    targetEnemy: target,
                    damageBonus,
                    purchased: false
                });
            }
            nodes.push(row);
        }

        const rowBonuses = Array.from({length: 4}, (_, i) => ({
            id: `cara-row-${i}`,
            rowIndex: i,
            damageBonus: 0.2 + Math.random() * 0.4, 
            unlocked: false
        }));

        const colBonuses = Array.from({length: 4}, (_, i) => ({
            id: `cara-col-${i}`,
            colIndex: i,
            armorBonus: 10 + Math.floor(Math.random() * 21), 
            unlocked: false
        }));

        s.carapaceGrid = {
            nodes,
            rowBonuses,
            colBonuses
        };
    }

    public purchaseCarapaceNode(row: number, col: number) {
        const state = this.getState();
        const s = state.spaceship;
        const p = state.player;
        if (!s.carapaceGrid) return;
        
        const node = s.carapaceGrid.nodes[row][col];
        if (node.purchased) return;
        if (p.score < node.cost) return;

        p.score -= node.cost;
        node.purchased = true;
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 1 });

        const rowNodes = s.carapaceGrid.nodes[row];
        if (rowNodes.every(n => n.purchased)) {
            s.carapaceGrid.rowBonuses[row].unlocked = true;
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: `ROW BONUS UNLOCKED: DAMAGE +${Math.round(s.carapaceGrid.rowBonuses[row].damageBonus * 100)}%`,
                x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, color: '#06b6d4', type: FloatingTextType.SYSTEM
            });
        }

        let colComplete = true;
        for(let r=0; r<4; r++) {
            if (!s.carapaceGrid.nodes[r][col].purchased) {
                colComplete = false;
                break;
            }
        }
        if (colComplete) {
            s.carapaceGrid.colBonuses[col].unlocked = true;
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: `COL BONUS UNLOCKED: ARMOR +${s.carapaceGrid.colBonuses[col].armorBonus}`,
                x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, color: '#06b6d4', type: FloatingTextType.SYSTEM
            });
        }
    }

    // --- INFRASTRUCTURE ---

    public generateInfrastructureOptions() {
        const s = this.getState().spaceship;
        if (s.infrastructureLocked) return;
        if (s.infrastructureOptions && s.infrastructureOptions.length > 0) return; 
        if ((s.infrastructureUpgrades?.length || 0) >= 9) return;

        const options: InfrastructureOption[] = [];
        const availableTypes = Object.values(InfrastructureUpgradeType);
        
        const selectedTypes: InfrastructureUpgradeType[] = [];
        while (selectedTypes.length < 3) {
            const t = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            if (!selectedTypes.includes(t)) selectedTypes.push(t);
        }

        selectedTypes.forEach(type => {
            let value = 0;
            const cost = 3000 + Math.floor(Math.random() * 5001);

            switch (type) {
                case InfrastructureUpgradeType.BASE_HP: value = 800 + Math.floor(Math.random() * 1801); break;
                case InfrastructureUpgradeType.TURRET_HP: value = 400 + Math.floor(Math.random() * 801); break;
                case InfrastructureUpgradeType.TURRET_L1_DMG: value = 0.10 + Math.random() * 0.30; break;
                case InfrastructureUpgradeType.TURRET_GAUSS_RATE: value = 0.10 + Math.random() * 0.14; break;
                case InfrastructureUpgradeType.TURRET_SNIPER_RANGE: value = 0.08 + Math.random() * 0.22; break;
                case InfrastructureUpgradeType.TURRET_MISSILE_DMG: value = 0.11 + Math.random() * 0.24; break;
                case InfrastructureUpgradeType.GLOBAL_TURRET_DMG: value = 0.05 + Math.random() * 0.15; break;
                case InfrastructureUpgradeType.GLOBAL_TURRET_RATE: value = 0.04 + Math.random() * 0.12; break;
                case InfrastructureUpgradeType.TURRET_L1_COST: value = 0.08 + Math.random() * 0.08; break;
            }

            options.push({ id: `infra-${Date.now()}-${Math.random()}`, type, value, cost });
        });

        s.infrastructureOptions = options;
    }

    public purchaseInfrastructureUpgrade(optionId: string) {
        const state = this.getState();
        const s = state.spaceship;
        const p = state.player;
        const option = s.infrastructureOptions.find(o => o.id === optionId);

        if (!option) return;
        if (p.score < option.cost) return;

        p.score -= option.cost;
        if (!s.infrastructureUpgrades) s.infrastructureUpgrades = [];
        s.infrastructureUpgrades.push(option);
        
        s.infrastructureLocked = true;
        s.infrastructureOptions = []; 
        
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
    }

    public registerModifiers() {
        const s = this.getState().spaceship;
        
        // 1. CARAPACE
        this.stats.removeSource('CARAPACE');
        if (s.carapaceGrid) {
            // Row Bonuses (Global Damage)
            s.carapaceGrid.rowBonuses.forEach(rb => {
                if (rb.unlocked) {
                    this.stats.add({ statId: StatId.PLAYER_DAMAGE, value: rb.damageBonus, type: ModifierType.PERCENT_ADD, source: 'CARAPACE' });
                }
            });
            // Col Bonuses (Player Armor)
            s.carapaceGrid.colBonuses.forEach(cb => {
                if (cb.unlocked) {
                    this.stats.add({ statId: StatId.PLAYER_MAX_ARMOR, value: cb.armorBonus, type: ModifierType.FLAT, source: 'CARAPACE' });
                }
            });
            // Nodes (Specific Enemy Damage)
            s.carapaceGrid.nodes.flat().forEach(node => {
                if (node.purchased) {
                    const statKey = `DMG_VS_${node.targetEnemy}` as StatId;
                    this.stats.add({ statId: statKey, value: node.damageBonus, type: ModifierType.PERCENT_ADD, source: 'CARAPACE' });
                }
            });
        }

        // 2. INFRASTRUCTURE
        this.stats.removeSource('INFRASTRUCTURE');
        if (s.infrastructureUpgrades) {
            s.infrastructureUpgrades.forEach(upg => {
                if (upg.type === InfrastructureUpgradeType.BASE_HP) {
                    this.stats.add({ statId: StatId.BASE_MAX_HP, value: upg.value, type: ModifierType.FLAT, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_HP) {
                    this.stats.add({ statId: StatId.TURRET_HP, value: upg.value, type: ModifierType.FLAT, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.GLOBAL_TURRET_DMG) {
                    this.stats.add({ statId: StatId.TURRET_DAMAGE_GLOBAL, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.GLOBAL_TURRET_RATE) {
                    this.stats.add({ statId: StatId.TURRET_RATE_GLOBAL, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_L1_DMG) {
                    this.stats.add({ statId: StatId.TURRET_L1_DAMAGE, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_L1_COST) {
                    this.stats.add({ statId: StatId.TURRET_COST, value: -upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_GAUSS_RATE) {
                    this.stats.add({ statId: StatId.TURRET_GAUSS_RATE, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_SNIPER_RANGE) {
                    this.stats.add({ statId: StatId.TURRET_SNIPER_RANGE, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
                else if (upg.type === InfrastructureUpgradeType.TURRET_MISSILE_DMG) {
                    this.stats.add({ statId: StatId.TURRET_MISSILE_DAMAGE, value: upg.value, type: ModifierType.PERCENT_ADD, source: 'INFRASTRUCTURE' });
                }
            });
        }
    }
}
