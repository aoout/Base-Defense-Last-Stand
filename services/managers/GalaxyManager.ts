
import { GameEngine } from '../gameService';
import { GameMode, MissionType, AppMode, PlanetBuildingType, PlanetYieldInfo, GalacticEventType, GalacticEvent, SpaceshipModuleType, FloatingTextType, GalaxyConfig, StatId, GameEventType, Planet, EnemyType, BossType } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { generatePlanets } from '../../utils/worldGenerator';
import { generateSectorName } from '../../utils/nameGenerator';
import { GAS_INFO } from '../../data/world';
import { StateBuilder } from '../StateBuilder';

export class GalaxyManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    /**
     * Centralized logic for calculating potential yields from a planet.
     */
    public estimatePlanetYields(planet: Planet): { biomass: number, oxygen: number } {
        const o2Gas = planet.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id);
        const o2 = o2Gas ? o2Gas.percentage : 0;

        // Yield Formulas
        const biomass = Math.floor(800 * (1 + planet.geneStrength));
        const oxygen = Math.floor(1700 * (1 + 1.8 * o2));

        return { biomass, oxygen };
    }

    public deployToPlanet(id: string) {
        const currentPlanets = this.engine.state.planets;
        const targetPlanet = currentPlanets.find(p => p.id === id);
        
        if (!targetPlanet) {
            console.error("[GalaxyManager] Planet not found for deployment:", id);
            return;
        }
  
        // 1. Calculate Costs & Validate Funds
        const { dropCost, canAfford } = this.calculateDropCost(targetPlanet.landingDifficulty);
        if (!canAfford) {
            return;
        }
  
        // 2. Build New State
        const newState = StateBuilder.build({
            mode: GameMode.EXPLORATION,
            fullReset: false, // Soft reset to keep items
            viewportW: this.engine.state.viewportWidth,
            viewportH: this.engine.state.viewportHeight,
            playerManager: this.engine.playerManager,
            dataManager: this.engine.dataManager,
            currentState: this.engine.state,
            settings: this.engine.state.settings,
            targetPlanet: targetPlanet
        });

        // 3. Deduct Cost
        newState.player.score = Math.max(0, newState.player.score - dropCost);

        // 4. Swap Engine State
        this.engine.state = newState;
        
        // 5. Re-apply RPG Stats
        this.engine.spaceshipManager.registerModifiers();
        
        // 6. Finalize Setup
        this.engine.audio.startAmbience(targetPlanet.biome);
        
        if (targetPlanet.missionType === MissionType.OFFENSE) {
            // Spawn Hive Mother immediately for Offense missions
            // Refactored to use generic spawn
            const hpMultiplier = (1 + 0.08 * targetPlanet.sulfurIndex);
            
            this.engine.enemyManager.spawn(EnemyType.TANK, this.engine.state.worldWidth / 2, 400, {
                isBoss: true,
                bossType: BossType.HIVE_MOTHER,
                flatHp: 14000, 
                hpMultiplier: hpMultiplier,
                angleOverride: Math.PI/2,
                speedOverride: 0,
                armorValue: 90
            });
        }

        // 7. Notify UI
        this.engine.notifyUI('DEPLOY');

        this.queueDeploymentFX(targetPlanet, dropCost);
    }

    public constructBuilding(planetId: string, type: PlanetBuildingType, slotIndex: number) {
        const state = this.engine.state;
        const planet = state.planets.find(p => p.id === planetId);
        const player = state.player;
        if (!planet) return;
  
        const cost = type === PlanetBuildingType.BIOMASS_EXTRACTOR ? 5500 : 7000;
        
        if (player.score >= cost) {
            player.score -= cost;
            if (!planet.buildings) planet.buildings = [];
            
            planet.buildings.push({
                id: `bld-${Date.now()}`,
                type,
                slotIndex,
                createdAt: Date.now()
            });
            
            this.engine.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
        }
    }

    public calculateYields(): PlanetYieldInfo[] {
        const state = this.engine.state;
        const reportItems: PlanetYieldInfo[] = [];

        state.planets.forEach(p => {
            if (p.completed && p.buildings && p.buildings.length > 0) {
                let bioYield = 0;
                let oxyYield = 0;
                
                const estimates = this.estimatePlanetYields(p);

                p.buildings.forEach(b => {
                    if (b.type === PlanetBuildingType.BIOMASS_EXTRACTOR) {
                        bioYield += estimates.biomass;
                    } else if (b.type === PlanetBuildingType.OXYGEN_EXTRACTOR) {
                        oxyYield += estimates.oxygen;
                    }
                });
  
                if (bioYield > 0 || oxyYield > 0) {
                    const planetTotal = Math.floor(bioYield + oxyYield);
                    reportItems.push({
                        planetId: p.id,
                        planetName: p.name,
                        biomassYield: Math.floor(bioYield),
                        oxygenYield: Math.floor(oxyYield),
                        total: planetTotal
                    });
                }
            }
        });
        return reportItems;
    }

    public triggerGalacticEvent() {
        const state = this.engine.state;
        const roll = Math.random();
        
        // 8% probability
        if (roll > 0.08) return;
  
        const eventRoll = Math.random();
        let eventType: GalacticEventType;
  
        if (eventRoll < 0.33) eventType = GalacticEventType.EXPANSION;
        else if (eventRoll < 0.66) eventType = GalacticEventType.INVASION;
        else eventType = GalacticEventType.SALVAGE;
  
        if (eventType === GalacticEventType.INVASION) {
            const conqueredPlanets = state.planets.filter(p => p.completed);
            if (conqueredPlanets.length <= 2) {
                eventType = GalacticEventType.EXPANSION;
            }
        }
  
        const event: GalacticEvent = { type: eventType };
  
        if (eventType === GalacticEventType.EXPANSION) {
            state.planets.forEach(p => {
                if (!p.completed) {
                    p.geneStrength += 0.1 + Math.random() * 0.2;
                }
            });
        } 
        else if (eventType === GalacticEventType.INVASION) {
            const conqueredPlanets = state.planets.filter(p => p.completed);
            const target = conqueredPlanets[Math.floor(Math.random() * conqueredPlanets.length)];
            
            if (target) {
                target.completed = false;
                target.buildings = []; 
                target.geneStrength += 0.2 + Math.random() * 0.3; 
                target.missionType = MissionType.OFFENSE; 
                event.targetPlanetId = target.id;
            } else {
                return;
            }
        } 
        else if (eventType === GalacticEventType.SALVAGE) {
            const reward = 3000 + Math.floor(Math.random() * 7001); 
            state.player.score += reward;
            event.scrapsReward = reward;
        }
  
        state.activeGalacticEvent = event;
    }

    public scanSector(config: GalaxyConfig) {
        this.engine.state.planets = generatePlanets(config, this.engine.state.viewportWidth, this.engine.state.viewportHeight);
        this.engine.state.sectorName = generateSectorName(); 
        this.engine.state.selectedPlanetId = null;
        this.engine.addMessage(this.engine.t('SCAN_COMPLETE'), WORLD_WIDTH / 2, WORLD_HEIGHT / 2, '#06b6d4', FloatingTextType.SYSTEM);
        // FORCE UI UPDATE to show new sector name and planets
        this.engine.notifyUI('SECTOR_SCAN');
    }

    // --- PRIVATE HELPER METHODS ---

    private calculateDropCost(difficulty: number): { dropCost: number, canAfford: boolean } {
        const currentScraps = this.engine.state.player.score;
        let dropCostPercent = difficulty / 100;
  
        // Apply Reductions via StatManager
        const reductionMod = this.engine.statManager.get(StatId.DROP_COST_REDUCTION, 0);
        dropCostPercent = dropCostPercent * (1 - reductionMod);
  
        const dropCost = Math.floor(currentScraps * dropCostPercent);
        return { dropCost, canAfford: currentScraps >= dropCost };
    }

    private queueDeploymentFX(planet: any, cost: number) {
        const player = this.engine.state.player; 
        const hasDeflector = this.engine.state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR);
        
        setTimeout(() => {
            this.engine.addMessage(
                this.engine.t('ORBITAL_DROP_COST', {0: cost}), 
                player.x, player.y - 100, '#F87171', FloatingTextType.SYSTEM
            );
        }, 1000);

        if (hasDeflector) {
            setTimeout(() => {
                this.engine.addMessage(
                    this.engine.t('DEFLECTOR_ACTIVE'), 
                    player.x, player.y - 120, '#06b6d4', FloatingTextType.SYSTEM
                );
            }, 2000);
        }

        if (planet.missionType === MissionType.OFFENSE) {
            setTimeout(() => {
                this.engine.addMessage(
                    this.engine.t('MISSION_ASSAULT'), 
                    player.x, player.y - 140, '#fca5a5', FloatingTextType.SYSTEM
                );
            }, 3000);
        }
    }
}
