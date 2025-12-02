import { GameEngine } from '../gameService';
import { GameMode, SpaceshipModuleType, Enemy, OrbitalUpgradeNode, OrbitalUpgradeEffect, OrbitalBeam, CarapaceGridState, CarapaceNode, EnemyType, DefenseUpgradeType, FloatingTextType } from '../../types';
import { PLAYER_STATS } from '../../data/registry';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class SpaceshipManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number) {
        const state = this.engine.state;
        
        // Orbital Cannon Logic
        if (state.gameMode === GameMode.EXPLORATION && state.spaceship.installedModules.includes(SpaceshipModuleType.ORBITAL_CANNON)) {
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
                    // Apply Carapace Bonus if applicable
                    const carapaceMult = this.getCarapaceDamageMultiplier(closest.type);
                    const finalDamage = baseDamage * damageMultiplier * carapaceMult;

                    this.engine.damageEnemy(closest, finalDamage);
                    
                    // Create Orbital Beam Visual
                    const beam: OrbitalBeam = {
                        id: `beam-${Date.now()}`,
                        x: closest.x,
                        y: closest.y,
                        life: 1.0,
                        maxLife: 600, // 600ms visual duration
                        width: 40,
                        color: '#06b6d4'
                    };
                    state.orbitalBeams.push(beam);

                    // Explosion Particles
                    this.engine.spawnParticle(closest.x, closest.y, '#06b6d4', 15, 6);
                    this.engine.spawnParticle(closest.x, closest.y, '#ffffff', 8, 3);
                    
                    this.engine.addMessage(`ORBITAL STRIKE: ${Math.floor(finalDamage)}`, closest.x, closest.y - 40, '#06b6d4', FloatingTextType.SYSTEM);
                    this.engine.audio.playTurretFire(2); 
                }
                
                state.orbitalSupportTimer = 0;
            }
        }

        // Update Orbital Beams
        if (state.orbitalBeams.length > 0) {
            state.orbitalBeams.forEach(b => {
                b.life -= dt / b.maxLife;
            });
            state.orbitalBeams = state.orbitalBeams.filter(b => b.life > 0);
        }
    }

    public generateOrbitalUpgradeTree() {
        const s = this.engine.state.spaceship;
        if (s.orbitalUpgradeTree && s.orbitalUpgradeTree.length > 0) return;
  
        const tree: OrbitalUpgradeNode[][] = [];
        
        for (let layerIndex = 0; layerIndex < 7; layerIndex++) {
            const layerNumber = layerIndex + 1; // 1 to 7
            const nodeCount = layerNumber; // Layer 1 has 1 node, Layer 7 has 7 nodes
            const layerNodes: OrbitalUpgradeNode[] = [];
            
            for (let i = 0; i < nodeCount; i++) {
                // Cost Calculation: 1000 * (1 + N) * (0.8 ~ 1.2)
                const baseCost = 1000 * (1 + layerNumber);
                const variance = 0.8 + Math.random() * 0.4;
                const cost = Math.floor(baseCost * variance);
  
                // Effect Logic
                const isRate = Math.random() < 0.2; // 20% Chance for Rate
                const effectType = isRate ? OrbitalUpgradeEffect.RATE : OrbitalUpgradeEffect.DAMAGE;
                
                let effectValue = 0;
                if (isRate) {
                    // Rate: 8% to 14%
                    effectValue = 0.08 + Math.random() * 0.06;
                } else {
                    // Damage: 10% to 28%
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
        const p = this.engine.state.player;
        const s = this.engine.state.spaceship;
        
        let node: OrbitalUpgradeNode | null = null;
        let layerIndex = -1;
        
        // Find Node
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
  
        // Logic: Check if N/2 nodes of previous layer are purchased
        if (layerIndex > 0) {
            const prevLayer = s.orbitalUpgradeTree[layerIndex - 1];
            const purchasedCount = prevLayer.filter(n => n.purchased).length;
            const prevLayerNodeCount = prevLayer.length;
            const required = Math.ceil(prevLayerNodeCount / 2);
            
            if (purchasedCount < required) {
                console.warn(`Layer ${layerIndex} locked. Need ${required} purchased in Layer ${layerIndex-1}`);
                return;
            }
        }
  
        p.score -= node.cost;
        node.purchased = true;
        
        if (node.effectType === OrbitalUpgradeEffect.DAMAGE) {
            s.orbitalDamageMultiplier += node.effectValue;
        } else {
            s.orbitalRateMultiplier += node.effectValue;
        }
        
        this.engine.audio.playTurretFire(2);
    }

    // --- CARAPACE ANALYZER LOGIC ---

    public generateCarapaceGrid() {
        const s = this.engine.state.spaceship;
        if (s.carapaceGrid) return; // Already exists

        const nodes: CarapaceNode[][] = [];
        const targets = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.TANK, EnemyType.KAMIKAZE, EnemyType.VIPER];

        for (let r = 0; r < 4; r++) {
            const row: CarapaceNode[] = [];
            for (let c = 0; c < 4; c++) {
                // Cost: 6000 - 12000, weighted lower
                const x = Math.random();
                const cost = Math.floor(6000 + (6000 * (x * x)));
                
                const target = targets[Math.floor(Math.random() * targets.length)];
                // Bonus: 10% - 30%
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
            damageBonus: 0.2 + Math.random() * 0.4, // 20-60%
            unlocked: false
        }));

        const colBonuses = Array.from({length: 4}, (_, i) => ({
            id: `cara-col-${i}`,
            colIndex: i,
            armorBonus: 10 + Math.floor(Math.random() * 21), // 10-30
            unlocked: false
        }));

        s.carapaceGrid = {
            nodes,
            rowBonuses,
            colBonuses
        };
    }

    public purchaseCarapaceNode(row: number, col: number) {
        const s = this.engine.state.spaceship;
        const p = this.engine.state.player;
        if (!s.carapaceGrid) return;
        
        const node = s.carapaceGrid.nodes[row][col];
        if (node.purchased) return;
        if (p.score < node.cost) return;

        p.score -= node.cost;
        node.purchased = true;
        this.engine.audio.playTurretFire(1);

        // Check Row Completion
        const rowNodes = s.carapaceGrid.nodes[row];
        if (rowNodes.every(n => n.purchased)) {
            s.carapaceGrid.rowBonuses[row].unlocked = true;
            this.engine.addMessage(`ROW BONUS UNLOCKED: DAMAGE +${Math.round(s.carapaceGrid.rowBonuses[row].damageBonus * 100)}%`, WORLD_WIDTH/2, WORLD_HEIGHT/2, '#06b6d4', FloatingTextType.SYSTEM);
        }

        // Check Col Completion
        let colComplete = true;
        for(let r=0; r<4; r++) {
            if (!s.carapaceGrid.nodes[r][col].purchased) {
                colComplete = false;
                break;
            }
        }
        if (colComplete) {
            s.carapaceGrid.colBonuses[col].unlocked = true;
            this.applyPassiveBonuses(); // Apply Armor
            this.engine.addMessage(`COL BONUS UNLOCKED: ARMOR +${s.carapaceGrid.colBonuses[col].armorBonus}`, WORLD_WIDTH/2, WORLD_HEIGHT/2, '#06b6d4', FloatingTextType.SYSTEM);
        }
    }

    public getCarapaceDamageMultiplier(enemyType: EnemyType): number {
        const s = this.engine.state.spaceship;
        if (!s.installedModules.includes(SpaceshipModuleType.CARAPACE_ANALYZER)) return 1.0;

        let mult = 1.2; // Base +20% from Module

        if (s.carapaceGrid) {
            // Node Bonuses (Specific)
            s.carapaceGrid.nodes.forEach(row => {
                row.forEach(node => {
                    if (node.purchased && node.targetEnemy === enemyType) {
                        mult += node.damageBonus;
                    }
                });
            });

            // Row Bonuses (Global)
            s.carapaceGrid.rowBonuses.forEach(rb => {
                if (rb.unlocked) {
                    mult += rb.damageBonus;
                }
            });
        }

        return mult;
    }

    public applyPassiveBonuses() {
        const s = this.engine.state.spaceship;
        const p = this.engine.state.player;
        
        // Recalculate Max Armor
        // Base
        let maxArmor = PLAYER_STATS.maxArmor;

        // Upgrades
        if (p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)) {
            maxArmor += 100;
        }

        // Carapace Grid Col Bonuses
        if (s.carapaceGrid) {
            s.carapaceGrid.colBonuses.forEach(cb => {
                if (cb.unlocked) {
                    maxArmor += cb.armorBonus;
                }
            });
        }

        p.maxArmor = maxArmor;
        if (p.armor > p.maxArmor) p.armor = p.maxArmor;
        
        // Base HP Bonus from Spaceship
        let baseMaxHp = 5000;
        if (s.installedModules.includes(SpaceshipModuleType.BASE_REINFORCEMENT)) {
             baseMaxHp += 3000;
        }
        // Base stats are fixed in current `reset` but good to enforce here if we change scenes
        this.engine.state.base.maxHp = baseMaxHp;
        // Do not reset current HP to max, just cap it if needed
        if (this.engine.state.base.hp > baseMaxHp) this.engine.state.base.hp = baseMaxHp;
    }
}