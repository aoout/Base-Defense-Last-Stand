
import { GameEngine } from '../gameService';
import { GameMode, MissionType, AppMode, PlanetBuildingType, PlanetYieldInfo, GalacticEventType, GalacticEvent, SpaceshipModuleType, FloatingTextType, GalaxyConfig, StatId, PersistentPlayerState, GameEventType } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { generateTerrain, generatePlanets } from '../../utils/worldGenerator';
import { generateSectorName } from '../../utils/nameGenerator';
import { GAS_INFO } from '../../data/world';

export class GalaxyManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    /**
     * Main Entry Point: Deploys the player to a specific planet.
     * Orchestrates state persistence, reset, and initialization.
     */
    public deployToPlanet(id: string) {
        const planets = this.engine.state.planets;
        const targetPlanet = planets.find(p => p.id === id);
        
        if (!targetPlanet) {
            console.error("[GalaxyManager] Planet not found for deployment:", id);
            return;
        }
  
        // 1. Calculate Costs & Validate Funds
        const { dropCost, canAfford } = this.calculateDropCost(targetPlanet.landingDifficulty);
        if (!canAfford) {
            // Should be blocked by UI, but safety check here
            return;
        }
  
        // 2. Capture State (Inventory, Upgrades, etc.) before Reset
        const persistentState = this.capturePersistentState();
        
        // 3. Reset Engine (Clears enemies, projectiles, etc.)
        this.engine.reset(false);
        
        // 4. Initialize New Game State
        const newState = this.engine.state;
        
        // Restore persistent data & Deduct Cost
        this.restorePersistentState(newState, persistentState);
        newState.player.score = Math.max(0, newState.player.score - dropCost);

        // Setup Context
        newState.gameMode = GameMode.EXPLORATION;
        newState.selectedPlanetId = id;
        newState.currentPlanet = targetPlanet;
        newState.appMode = AppMode.GAMEPLAY;
        
        // Re-apply RPG Stats (Modules/Upgrades)
        this.engine.spaceshipManager.registerModifiers();
        
        // 5. Setup Gameplay Entities
        newState.base.hp = newState.base.maxHp;
        this.initializeBaseDrop(newState);
        
        // 6. Setup Mission Parameters (Waves/Bosses)
        this.initializeMission(newState, targetPlanet);
        
        // 7. Trigger FX (Audio, Terrain, UI Messages)
        this.initializeEnvironment(newState, targetPlanet);
        this.queueDeploymentFX(targetPlanet, dropCost, persistentState.hasDeflector);
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
  
                p.buildings.forEach(b => {
                    if (b.type === PlanetBuildingType.BIOMASS_EXTRACTOR) {
                        bioYield += 800 * (1 + p.geneStrength);
                    } else if (b.type === PlanetBuildingType.OXYGEN_EXTRACTOR) {
                        const o2 = p.atmosphere.find(g => g.id === GAS_INFO.OXYGEN.id)?.percentage || 0;
                        oxyYield += 1700 * (1 + 1.8 * o2);
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

    // --- PRIVATE HELPER METHODS (Refactoring) ---

    private calculateDropCost(difficulty: number): { dropCost: number, canAfford: boolean } {
        const currentScraps = this.engine.state.player.score;
        let dropCostPercent = difficulty / 100;
  
        // Apply Reductions via StatManager
        const reductionMod = this.engine.statManager.get(StatId.DROP_COST_REDUCTION, 0);
        dropCostPercent = dropCostPercent * (1 - reductionMod);
  
        const dropCost = Math.floor(currentScraps * dropCostPercent);
        return { dropCost, canAfford: currentScraps >= dropCost };
    }

    /**
     * Extracts only the data that needs to persist between deployments.
     */
    private capturePersistentState() {
        const oldState = this.engine.state;
        return {
            player: {
                weapons: oldState.player.weapons,
                loadout: oldState.player.loadout,
                inventory: oldState.player.inventory,
                upgrades: oldState.player.upgrades,
                freeModules: oldState.player.freeModules,
                grenadeModules: oldState.player.grenadeModules,
                grenades: oldState.player.grenades,
                score: oldState.player.score // Captured for reference, but modified later
            },
            stats: {
                encounteredEnemies: [...oldState.stats.encounteredEnemies]
            },
            world: {
                sectorName: oldState.sectorName
            },
            hasDeflector: oldState.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)
        };
    }

    /**
     * Applies persistent data to a fresh state object.
     */
    private restorePersistentState(newState: any, persistent: ReturnType<typeof this.capturePersistentState>) {
        newState.player.weapons = persistent.player.weapons;
        newState.player.loadout = persistent.player.loadout;
        newState.player.inventory = persistent.player.inventory;
        newState.player.upgrades = persistent.player.upgrades;
        newState.player.freeModules = persistent.player.freeModules;
        newState.player.grenadeModules = persistent.player.grenadeModules;
        newState.player.grenades = persistent.player.grenades;
        newState.player.score = persistent.player.score; // Will be adjusted for cost after

        newState.stats.encounteredEnemies = persistent.stats.encounteredEnemies;
        newState.sectorName = persistent.world.sectorName;
    }

    private initializeBaseDrop(newState: any) {
        // Start high above (e.g. 1500px up). Target is the configured base.y
        newState.baseDrop = {
            active: true,
            y: newState.base.y - 1500, 
            targetY: newState.base.y,
            velocity: 0,
            phase: 'ENTRY',
            deployTimer: 0
        };
        
        // Hide player initially (will be spawned by logic when base lands)
        // We move player to base center to be ready
        newState.player.x = newState.base.x;
        newState.player.y = newState.base.y; 
    }

    private initializeMission(newState: any, planet: any) {
        if (planet.missionType === MissionType.OFFENSE) {
            newState.wave.pendingCount = 0; 
            newState.wave.index = 0; 
            this.engine.enemyManager.spawnHiveMother(planet);
        } else {
            // Scale enemies by Gene Strength
            newState.wave.pendingCount = Math.ceil((12 + 5 * 1) * planet.geneStrength); 
        }
    }

    private initializeEnvironment(newState: any, planet: any) {
        this.engine.audio.startAmbience(planet.biome);
        newState.terrain = generateTerrain(planet.visualType, planet.biome);
    }

    private queueDeploymentFX(planet: any, cost: number, hasDeflector: boolean) {
        const player = this.engine.state.player; // Reference to live player object (position might update)
        
        // Use a sequenced delay approach rather than nesting
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
