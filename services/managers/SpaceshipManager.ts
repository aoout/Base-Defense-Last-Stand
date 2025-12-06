
import { GameState, SpaceshipModuleType, Enemy, OrbitalUpgradeNode, OrbitalUpgradeEffect, OrbitalBeam, CarapaceGridState, CarapaceNode, EnemyType, DefenseUpgradeType, FloatingTextType, DamageSource, InfrastructureOption, InfrastructureUpgradeType, TurretType, BioNode, BioResource, BioBuffType, BioTask, GameEventType, DamageEnemyEvent, ShowFloatingTextEvent, PlaySoundEvent, SpawnParticleEvent, StatModifier, StatId, ModifierType, DamageAreaEvent } from '../../types';
import { PLAYER_STATS, ALLY_STATS, BASE_STATS } from '../../data/registry';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { EventBus } from '../EventBus';
import { StatManager } from './StatManager';

export class SpaceshipManager {
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
            
            const baseRate = 8000;
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
                    const baseDamage = 400;
                    const damageMultiplier = state.spaceship.orbitalDamageMultiplier || 1;
                    
                    const carapaceMult = this.getCarapaceDamageMultiplier(closest.type);
                    const finalDamage = baseDamage * damageMultiplier * carapaceMult;

                    // Switch to AOE Damage
                    this.events.emit<DamageAreaEvent>(GameEventType.DAMAGE_AREA, {
                        x: closest.x,
                        y: closest.y,
                        radius: 100,
                        damage: finalDamage,
                        source: DamageSource.ORBITAL
                    });
                    
                    const beam: OrbitalBeam = {
                        id: `beam-${Date.now()}`,
                        x: closest.x,
                        y: closest.y,
                        life: 1.0,
                        maxLife: 600, 
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
                    
                    // New Sound Event
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

    public generateOrbitalUpgradeTree() {
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
  
    public purchaseOrbitalUpgrade(nodeId: string) {
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
            this.registerModifiers(); 
            this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                text: `COL BONUS UNLOCKED: ARMOR +${s.carapaceGrid.colBonuses[col].armorBonus}`,
                x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, color: '#06b6d4', type: FloatingTextType.SYSTEM
            });
        }
    }

    public getCarapaceDamageMultiplier(enemyType: EnemyType): number {
        // This logic is now handled by StatManager mostly, but we can query StatManager here or construct the specific ID
        // StatManager query:
        // base = 1.0 (Module unlocked check below)
        const s = this.getState().spaceship;
        if (!s.installedModules.includes(SpaceshipModuleType.CARAPACE_ANALYZER)) return 1.0;
        
        const base = 1.2; // Base buff for having the module
        // We can query specific stats if we want detailed breakdown, or rely on this legacy method
        // For consistency, we keep using the internal state for this specific logic 
        // as converting the dynamic grid to individual StatModifiers is complex but doable in registerModifiers
        
        // HOWEVER, to be truly unified, we should use StatManager. 
        // Let's defer to the StatManager in registerModifiers
        
        const statKey = `DMG_VS_${enemyType}` as StatId;
        // This requires StatManager to know about dynamic keys if we used enum strings
        return this.stats.get(statKey, base);
    }

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
        
        this.registerModifiers();
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
    }

    public getInfrastructureBonus(target: 'HP' | 'DMG' | 'RATE' | 'RANGE' | 'COST', turretType?: TurretType): number {
        // Legacy accessor for UI, now we should probably use StatManager or keep this as helper
        // Since StatManager stores aggregate, getting specific *Infrastructure* contribution 
        // implies we should filter modifiers by source 'INFRASTRUCTURE'
        // For simplicity, we keep this logic for UI display only, or refactor UI to use StatManager
        const s = this.getState().spaceship;
        if (!s.infrastructureUpgrades) return 0;
        let total = 0;
        s.infrastructureUpgrades.forEach(upg => {
            switch (target) {
                case 'HP':
                    if (upg.type === InfrastructureUpgradeType.BASE_HP && turretType === undefined) total += upg.value;
                    if (upg.type === InfrastructureUpgradeType.TURRET_HP && turretType !== undefined) total += upg.value;
                    break;
                case 'DMG':
                    if (upg.type === InfrastructureUpgradeType.GLOBAL_TURRET_DMG) total += upg.value;
                    if (turretType === TurretType.STANDARD && upg.type === InfrastructureUpgradeType.TURRET_L1_DMG) total += upg.value;
                    if (turretType === TurretType.MISSILE && upg.type === InfrastructureUpgradeType.TURRET_MISSILE_DMG) total += upg.value;
                    break;
                case 'RATE':
                    if (upg.type === InfrastructureUpgradeType.GLOBAL_TURRET_RATE) total += upg.value;
                    if (turretType === TurretType.GAUSS && upg.type === InfrastructureUpgradeType.TURRET_GAUSS_RATE) total += upg.value;
                    break;
                case 'RANGE':
                    if (turretType === TurretType.SNIPER && upg.type === InfrastructureUpgradeType.TURRET_SNIPER_RANGE) total += upg.value;
                    break;
                case 'COST':
                    if (turretType === TurretType.STANDARD && upg.type === InfrastructureUpgradeType.TURRET_L1_COST) total += upg.value;
                    break;
            }
        });
        return total;
    }

    // --- BIO SEQUENCING LOGIC ---

    public generateBioGrid() {
        const s = this.getState().spaceship;
        if (s.bioNodes && s.bioNodes.length > 0 && s.bioResources) return;

        if (!s.bioResources) s.bioResources = { [BioResource.ALPHA]: 0, [BioResource.BETA]: 0, [BioResource.GAMMA]: 0 };
        if (!s.bioTasks) s.bioTasks = [];

        const nodes: BioNode[] = [];
        let idCounter = 0;
        nodes.push(this.createBioNode(idCounter++, 0, 0, true)); 
        
        for (let k = 1; k <= 4; k++) {
            let curQ = -k; let curR = 0; 
            for (let j = 0; j < 6; j++) {
                for (let step = 0; step < k; step++) {
                    if (nodes.length < 40) nodes.push(this.createBioNode(idCounter++, curQ, curR, false));
                    const dirs = [{dq: 1, dr: -1}, {dq: 1, dr: 0}, {dq: 0, dr: 1}, {dq: -1, dr: 1}, {dq: -1, dr: 0}, {dq: 0, dr: -1}];
                    curQ += dirs[j].dq; curR += dirs[j].dr;
                }
            }
        }

        nodes.forEach(node => {
            const neighbors = [
                {q: node.q+1, r: node.r}, {q: node.q-1, r: node.r},
                {q: node.q, r: node.r+1}, {q: node.q, r: node.r-1},
                {q: node.q+1, r: node.r-1}, {q: node.q-1, r: node.r+1}
            ];
            neighbors.forEach(n => {
                const target = nodes.find(t => t.q === n.q && t.r === n.r);
                if (target) {
                    if (!node.connections.includes(target.id)) node.connections.push(target.id);
                    if (!target.connections.includes(node.id)) target.connections.push(node.id);
                }
            });
        });

        for (let i = 0; i < 8; i++) {
            const n1 = nodes[Math.floor(Math.random() * nodes.length)];
            const n2 = nodes[Math.floor(Math.random() * nodes.length)];
            if (n1.id !== n2.id && !n1.connections.includes(n2.id)) {
                n1.connections.push(n2.id); n2.connections.push(n1.id);
            }
        }

        s.bioNodes = nodes;
        this.generateBioTasks();
    }

    private createBioNode(id: number, q: number, r: number, isCenter: boolean): BioNode {
        const totalWeight = 4+5+4+1+1+1+1;
        const roll = Math.random() * totalWeight;
        let buffType = BioBuffType.ALLY_HP;
        let buffValue = 0;

        let w = 0;
        if (roll < (w+=4)) { buffType = BioBuffType.ALLY_HP; buffValue = 0.08 + Math.random() * 0.14; } 
        else if (roll < (w+=5)) { buffType = BioBuffType.ALLY_DMG; buffValue = 0.10 + Math.random() * 0.14; } 
        else if (roll < (w+=4)) { buffType = BioBuffType.LURE_BONUS; buffValue = 0.30 + Math.random() * 0.48; } 
        else if (roll < (w+=1)) { buffType = BioBuffType.GENE_REDUCTION; buffValue = 0.1; } 
        else if (roll < (w+=1)) { buffType = BioBuffType.ALPHA_YIELD; buffValue = 0.10 + Math.random() * 0.15; } 
        else if (roll < (w+=1)) { buffType = BioBuffType.BETA_YIELD; buffValue = 0.10 + Math.random() * 0.15; } 
        else { buffType = BioBuffType.GAMMA_YIELD; buffValue = 0.10 + Math.random() * 0.15; }

        const totalCost = 2000 + Math.floor(Math.random() * 2001);
        const parts = [Math.random(), Math.random(), Math.random()];
        const sumParts = parts.reduce((a, b) => a + b, 0);
        
        const cost = {
            [BioResource.ALPHA]: isCenter ? 0 : Math.floor((parts[0] / sumParts) * totalCost),
            [BioResource.BETA]: isCenter ? 0 : Math.floor((parts[1] / sumParts) * totalCost),
            [BioResource.GAMMA]: isCenter ? 0 : Math.floor((parts[2] / sumParts) * totalCost)
        };

        return { id, q, r, buffType, buffValue, isUnlocked: false, cost, connections: [] };
    }

    public conductBioResearch() {
        const state = this.getState();
        const s = state.spaceship;
        const p = state.player;
        if (p.score < 1000) return;

        p.score -= 1000;

        const basePoints = 1000;
        const parts = [Math.random(), Math.random(), Math.random()];
        const sumParts = parts.reduce((a, b) => a + b, 0);

        let alpha = Math.floor((parts[0] / sumParts) * basePoints);
        let beta = Math.floor((parts[1] / sumParts) * basePoints);
        let gamma = Math.floor((parts[2] / sumParts) * basePoints);

        const alphaBuff = this.stats.get(StatId.YIELD_ALPHA, 0);
        const betaBuff = this.stats.get(StatId.YIELD_BETA, 0);
        const gammaBuff = this.stats.get(StatId.YIELD_GAMMA, 0);

        alpha = Math.floor(alpha * (1 + alphaBuff));
        beta = Math.floor(beta * (1 + betaBuff));
        gamma = Math.floor(gamma * (1 + gammaBuff));

        s.bioResources[BioResource.ALPHA] += alpha;
        s.bioResources[BioResource.BETA] += beta;
        s.bioResources[BioResource.GAMMA] += gamma;

        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
    }

    public unlockBioNode(nodeId: number) {
        const s = this.getState().spaceship;
        const node = s.bioNodes.find(n => n.id === nodeId);
        if (!node || node.isUnlocked) return;

        const isReachable = node.id === 0 || node.connections.some(cid => {
            const neighbor = s.bioNodes.find(n => n.id === cid);
            return neighbor && neighbor.isUnlocked;
        });

        if (!isReachable) return;

        if (s.bioResources[BioResource.ALPHA] < node.cost[BioResource.ALPHA] ||
            s.bioResources[BioResource.BETA] < node.cost[BioResource.BETA] ||
            s.bioResources[BioResource.GAMMA] < node.cost[BioResource.GAMMA]) {
            return;
        }

        s.bioResources[BioResource.ALPHA] -= node.cost[BioResource.ALPHA];
        s.bioResources[BioResource.BETA] -= node.cost[BioResource.BETA];
        s.bioResources[BioResource.GAMMA] -= node.cost[BioResource.GAMMA];

        node.isUnlocked = true;
        this.registerModifiers();
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 1 });
    }

    public generateBioTasks() {
        const s = this.getState().spaceship;
        if (s.bioTasks.length > 0) return;

        const enemyTypes = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.TANK, EnemyType.KAMIKAZE, EnemyType.VIPER];
        const resourceTypes = [BioResource.ALPHA, BioResource.BETA, BioResource.GAMMA];

        for (let i = 0; i < 3; i++) {
            const target = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const count = 200 + Math.floor(Math.random() * 601);
            const rewardType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const rewardAmt = 500 + Math.floor(Math.random() * 1101);

            s.bioTasks.push({
                id: `bio-task-${Date.now()}-${i}`,
                targetEnemy: target,
                count,
                progress: 0,
                rewardResource: rewardType,
                rewardAmount: rewardAmt
            });
        }
    }

    public acceptBioTask(taskId: string) {
        const s = this.getState().spaceship;
        const task = s.bioTasks.find(t => t.id === taskId);
        if (task) {
            s.activeBioTask = task;
            s.bioTasks = []; 
        }
    }

    public abortBioTask() {
        const s = this.getState().spaceship;
        if (s.activeBioTask) {
            s.activeBioTask = null;
            this.generateBioTasks(); 
        }
    }

    public checkBioTaskProgress(killedType: EnemyType) {
        const s = this.getState().spaceship;
        if (!s.activeBioTask) return;

        if (s.activeBioTask.targetEnemy === killedType) {
            s.activeBioTask.progress++;
            if (s.activeBioTask.progress >= s.activeBioTask.count) {
                s.bioResources[s.activeBioTask.rewardResource] += s.activeBioTask.rewardAmount;
                this.events.emit<ShowFloatingTextEvent>(GameEventType.SHOW_FLOATING_TEXT, {
                    text: `BIO PROTOCOL COMPLETE: +${s.activeBioTask.rewardAmount} ${s.activeBioTask.rewardResource}`,
                    x: WORLD_WIDTH/2, y: WORLD_HEIGHT/2, color: '#10b981', type: FloatingTextType.SYSTEM
                });
                s.activeBioTask = null;
                this.generateBioTasks();
            }
        }
    }

    public getBioBuffTotal(type: BioBuffType): number {
        const s = this.getState().spaceship;
        if (!s.bioNodes) return 0;
        return s.bioNodes.reduce((acc, node) => {
            if (node.isUnlocked && node.buffType === type) return acc + node.buffValue;
            return acc;
        }, 0);
    }

    public getGeneReduction(): number {
        // Query from StatManager
        return this.stats.get(StatId.GENE_REDUCTION, 0);
    }

    /**
     * Attempts to claim the Snake Mini-game reward.
     * Returns the amount awarded. Now repeatable.
     */
    public claimSnakeReward(score: number): number {
        const state = this.getState();
        
        // REPEATABLE REWARD: No longer checking snakeRewardClaimed for early exit
        // Adjusted ratio: Score * 2 to make it farmable but not game breaking
        const reward = Math.floor(score * 2);
        
        if (reward > 0) {
            state.player.score += reward;
            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
        }
        
        return reward;
    }

    /**
     * Replaces applyPassiveBonuses.
     * Iterates all upgrade systems and registers their modifiers with StatManager.
     */
    public registerModifiers() {
        const state = this.getState();
        const s = state.spaceship;
        const p = state.player;

        // Clear existing modifiers from this manager's sources
        this.stats.removeSource('BIO');
        this.stats.removeSource('CARAPACE');
        this.stats.removeSource('INFRASTRUCTURE');
        this.stats.removeSource('SPACESHIP_MODULES');
        this.stats.removeSource('PLAYER_UPGRADES');

        // 1. Player Upgrades (Defense Upgrade Type)
        if (p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)) {
            this.stats.add({ statId: StatId.PLAYER_MAX_ARMOR, value: 100, type: ModifierType.FLAT, source: 'PLAYER_UPGRADES' });
        }
        if (p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)) {
            this.stats.add({ statId: StatId.PLAYER_DMG_TAKEN_MULT, value: -0.2, type: ModifierType.PERCENT_ADD, source: 'PLAYER_UPGRADES' });
        }
        // Infection Disposal is handled logic-side in damagePlayer via type check or new stat if desired. 
        // Let's keep it logic-side for now as it's mechanics change (mitigation split).

        // 2. Spaceship Modules
        if (s.installedModules.includes(SpaceshipModuleType.BASE_REINFORCEMENT)) {
            this.stats.add({ statId: StatId.BASE_MAX_HP, value: 3000, type: ModifierType.FLAT, source: 'SPACESHIP_MODULES' });
        }
        if (s.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
            this.stats.add({ statId: StatId.DROP_COST_REDUCTION, value: 0.5, type: ModifierType.PERCENT_ADD, source: 'SPACESHIP_MODULES' });
        }

        // 3. Bio Sequencing
        if (s.bioNodes) {
            s.bioNodes.forEach(node => {
                if (node.isUnlocked) {
                    let statId: string | null = null;
                    switch(node.buffType) {
                        case BioBuffType.ALLY_HP: statId = StatId.ALLY_MAX_HP; break;
                        case BioBuffType.ALLY_DMG: statId = StatId.ALLY_DAMAGE; break;
                        case BioBuffType.LURE_BONUS: statId = StatId.LURE_BONUS; break;
                        case BioBuffType.GENE_REDUCTION: statId = StatId.GENE_REDUCTION; break;
                        case BioBuffType.ALPHA_YIELD: statId = StatId.YIELD_ALPHA; break;
                        case BioBuffType.BETA_YIELD: statId = StatId.YIELD_BETA; break;
                        case BioBuffType.GAMMA_YIELD: statId = StatId.YIELD_GAMMA; break;
                    }
                    if (statId) {
                        // Gene Reduction is Flat, others are Percent Add
                        const modType = statId === StatId.GENE_REDUCTION ? ModifierType.FLAT : ModifierType.PERCENT_ADD;
                        this.stats.add({ statId, value: node.buffValue, type: modType, source: 'BIO' });
                    }
                }
            });
        }

        // 4. Carapace Analyzer
        if (s.carapaceGrid) {
            // Row Bonuses (Global Damage)
            s.carapaceGrid.rowBonuses.forEach(rb => {
                if (rb.unlocked) {
                    // Global Player Damage
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

        // 5. Infrastructure
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

        // --- APPLY TO STATE PROPERTIES ---
        // After calculating stats, update persistent state values (MaxHP, etc.)
        
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
