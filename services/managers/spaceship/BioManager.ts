
import { GameState, BioNode, BioResource, BioBuffType, BioTask, EnemyType, GameEventType, PlaySoundEvent, ShowFloatingTextEvent, FloatingTextType, StatId, ModifierType } from '../../../types';
import { EventBus } from '../../EventBus';
import { StatManager } from '../StatManager';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../../constants';

export class BioManager {
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
        this.generateTasks();
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

    public conductResearch() {
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

    public unlockNode(nodeId: number) {
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
        
        // Notify parent to re-register all stats (since Facade controls the full registration)
        // Or we can expose a method on Facade. Ideally Facade calls us.
        // But here we need to trigger it. We'll emit a UI update which might be enough, 
        // but for Stats to update immediately, we should re-register.
        // Since we don't have reference to Facade, we rely on the fact that Facade calls registerModifiers
        // on load/init. For runtime updates, we can just push the new mod?
        // Actually, easiest is to assume the caller (Facade) will re-register if we are called from there.
        // Wait, UI calls Facade -> Facade calls Manager. Facade can re-register after Manager returns.
        
        this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 1 });
    }

    public generateTasks() {
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

    public acceptTask(taskId: string) {
        const s = this.getState().spaceship;
        const task = s.bioTasks.find(t => t.id === taskId);
        if (task) {
            s.activeBioTask = task;
            s.bioTasks = []; 
        }
    }

    public abortTask() {
        const s = this.getState().spaceship;
        if (s.activeBioTask) {
            s.activeBioTask = null;
            this.generateTasks(); 
        }
    }

    public checkTaskProgress(killedType: EnemyType) {
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
                this.generateTasks();
            }
        }
    }

    public registerModifiers() {
        const s = this.getState().spaceship;
        this.stats.removeSource('BIO');

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
                        const modType = statId === StatId.GENE_REDUCTION ? ModifierType.FLAT : ModifierType.PERCENT_ADD;
                        this.stats.add({ statId, value: node.buffValue, type: modType, source: 'BIO' });
                    }
                }
            });
        }
    }
}
