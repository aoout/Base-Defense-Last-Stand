
import { GameState, EnemyType, DefenseUpgradeType, GameEventType, PlaySoundEvent, StatId, ModifierType, SpaceshipModuleType } from '../../types';
import { PLAYER_STATS, ALLY_STATS, BASE_STATS, DEFENSE_UPGRADE_INFO } from '../../data/registry';
import { EventBus } from '../EventBus';
import { StatManager } from './StatManager';
import { OrbitalManager } from './spaceship/OrbitalManager';
import { BioManager } from './spaceship/BioManager';
import { TechManager } from './spaceship/TechManager';
import { HeroicManager } from './spaceship/HeroicManager';

export class SpaceshipManager {
    private getState: () => GameState;
    private events: EventBus;
    private stats: StatManager;

    // Sub-Managers
    private orbitalManager: OrbitalManager;
    private bioManager: BioManager;
    private techManager: TechManager;
    private heroicManager: HeroicManager;

    constructor(getState: () => GameState, eventBus: EventBus, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.stats = statManager;

        // Instantiate Sub-Managers
        this.orbitalManager = new OrbitalManager(getState, eventBus, statManager);
        this.bioManager = new BioManager(getState, eventBus, statManager);
        this.techManager = new TechManager(getState, eventBus, statManager);
        this.heroicManager = new HeroicManager(getState, eventBus, statManager);
    }

    public update(dt: number) {
        // Delegate orbital logic
        this.orbitalManager.update(dt);
    }

    // --- ORBITAL DELEGATES ---
    public generateOrbitalUpgradeTree() {
        this.orbitalManager.generateUpgradeTree();
    }
  
    public purchaseOrbitalUpgrade(nodeId: string) {
        this.orbitalManager.purchaseUpgrade(nodeId);
        this.registerModifiers(); // Recalculate if needed (rare for orbital, but good practice)
    }

    // --- CARAPACE DELEGATES ---
    public generateCarapaceGrid() {
        this.techManager.generateCarapaceGrid();
    }

    public purchaseCarapaceNode(row: number, col: number) {
        this.techManager.purchaseCarapaceNode(row, col);
        this.registerModifiers(); // Critical for stat updates
    }

    // --- INFRASTRUCTURE DELEGATES ---
    public generateInfrastructureOptions() {
        this.techManager.generateInfrastructureOptions();
    }

    public purchaseInfrastructureUpgrade(optionId: string) {
        this.techManager.purchaseInfrastructureUpgrade(optionId);
        this.registerModifiers();
    }

    // --- BIO SEQUENCING DELEGATES ---
    public generateBioGrid() {
        this.bioManager.generateGrid();
    }

    public conductBioResearch() {
        this.bioManager.conductResearch();
    }

    public unlockBioNode(nodeId: number) {
        this.bioManager.unlockNode(nodeId);
        this.registerModifiers();
    }

    public acceptBioTask(taskId: string) {
        this.bioManager.acceptTask(taskId);
    }

    public abortBioTask() {
        this.bioManager.abortTask();
    }

    public checkBioTaskProgress(killedType: EnemyType) {
        this.bioManager.checkTaskProgress(killedType);
    }

    // --- HEROIC ZEAL DELEGATES ---
    public generateHeroicGrid() {
        this.heroicManager.generateGrid();
    }

    public purchaseHeroicNode(id: number) {
        this.heroicManager.purchaseNode(id);
        this.registerModifiers();
    }

    /**
     * Attempts to claim the Snake Mini-game reward.
     * Returns the amount awarded. Now repeatable.
     */
    public claimSnakeReward(score: number): number {
        const state = this.getState();
        // Reward ratio: Score * 2
        const reward = Math.floor(score * 2);
        
        if (reward > 0) {
            state.player.score += reward;
            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
        }
        return reward;
    }

    /**
     * Aggregates modifiers from all sub-systems and registers them with StatManager.
     */
    public registerModifiers() {
        const state = this.getState();
        const s = state.spaceship;
        const p = state.player;

        // 1. Trigger Sub-Managers to register their source-specific stats
        this.bioManager.registerModifiers();
        this.techManager.registerModifiers();
        this.heroicManager.registerModifiers();
        
        // 2. Register Global/Core Upgrades (Modules & Player)
        this.stats.removeSource('SPACESHIP_MODULES');
        this.stats.removeSource('PLAYER_UPGRADES');

        // Player Upgrades
        if (p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)) {
            const bonus = (DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER] as any).maxArmorBonus || 100;
            this.stats.add({ statId: StatId.PLAYER_MAX_ARMOR, value: bonus, type: ModifierType.FLAT, source: 'PLAYER_UPGRADES' });
        }
        if (p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)) {
            const reduction = (DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE] as any).meleeReduction || 0.2;
            this.stats.add({ statId: StatId.PLAYER_DMG_TAKEN_MULT, value: -reduction, type: ModifierType.PERCENT_ADD, source: 'PLAYER_UPGRADES' });
        }

        // Spaceship Modules
        if (s.installedModules.includes(SpaceshipModuleType.BASE_REINFORCEMENT)) {
            this.stats.add({ statId: StatId.BASE_MAX_HP, value: 3000, type: ModifierType.FLAT, source: 'SPACESHIP_MODULES' });
        }
        if (s.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
            this.stats.add({ statId: StatId.DROP_COST_REDUCTION, value: 0.5, type: ModifierType.PERCENT_ADD, source: 'SPACESHIP_MODULES' });
        }

        // --- APPLY TO STATE PROPERTIES ---
        // After calculating stats, update persistent state values (MaxHP, etc.)
        
        // Player Max HP
        p.maxHp = this.stats.get(StatId.PLAYER_MAX_HP, PLAYER_STATS.maxHp);
        if (p.hp > p.maxHp) p.hp = p.maxHp;

        // Player Max Armor
        p.maxArmor = this.stats.get(StatId.PLAYER_MAX_ARMOR, PLAYER_STATS.maxArmor);
        if (p.armor > p.maxArmor) p.armor = p.maxArmor;

        // Base Max HP
        state.base.maxHp = this.stats.get(StatId.BASE_MAX_HP, BASE_STATS.maxHp);
        if (state.base.hp > state.base.maxHp) state.base.hp = state.base.maxHp;

        // Update Active Allies (Live updates)
        const activeAllies = state.allies;
        if (activeAllies.length > 0) {
            const finalMaxHp = this.stats.get(StatId.ALLY_MAX_HP, ALLY_STATS.hp);
            const finalDmg = this.stats.get(StatId.ALLY_DAMAGE, ALLY_STATS.damage);

            activeAllies.forEach(ally => {
                const hpPct = ally.hp / ally.maxHp;
                ally.maxHp = finalMaxHp;
                ally.hp = finalMaxHp * hpPct;
                ally.damage = finalDmg;
            });
        }
    }
}
