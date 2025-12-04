import { GameEngine } from '../gameService';
import { GameMode, MissionType, AppMode, PlanetBuildingType, PlanetYieldInfo, GalacticEventType, GalacticEvent, SpaceshipModuleType, FloatingTextType } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { generateTerrain } from '../../utils/worldGenerator';
import { GAS_INFO } from '../../data/world';

export class GalaxyManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public deployToPlanet(id: string) {
        const state = this.engine.state;
        const targetPlanet = state.planets.find(p => p.id === id);
        
        if (!targetPlanet) {
            console.error("Planet not found for deployment:", id);
            return;
        }
  
        const currentScraps = state.player.score;
        let dropCostPercent = targetPlanet.landingDifficulty / 100;
  
        if (state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
            dropCostPercent *= 0.5;
        }
  
        const dropCost = Math.floor(currentScraps * dropCostPercent);
        const remainingScraps = Math.max(0, currentScraps - dropCost);
  
        // Preserve persistent state BEFORE reset
        const persistentState = {
            weapons: state.player.weapons,
            loadout: state.player.loadout,
            inventory: state.player.inventory,
            upgrades: state.player.upgrades,
            freeModules: state.player.freeModules,
            grenadeModules: state.player.grenadeModules,
            grenades: state.player.grenades,
            encounteredEnemies: [...state.stats.encounteredEnemies]
        };
  
        // Reset the world state
        this.engine.reset(false);
        
        // Restore player state & set new score
        state.player.score = remainingScraps;
        state.player.weapons = persistentState.weapons;
        state.player.loadout = persistentState.loadout;
        state.player.inventory = persistentState.inventory;
        state.player.upgrades = persistentState.upgrades;
        state.player.freeModules = persistentState.freeModules;
        state.player.grenadeModules = persistentState.grenadeModules;
        state.player.grenades = persistentState.grenades;
        state.stats.encounteredEnemies = persistentState.encounteredEnemies;
  
        state.gameMode = GameMode.EXPLORATION;
        state.selectedPlanetId = id;
        state.currentPlanet = targetPlanet;
        state.appMode = AppMode.GAMEPLAY;
        
        this.engine.spaceshipManager.applyPassiveBonuses();
        
        // Full heal the base
        state.base.hp = state.base.maxHp;
  
        if (targetPlanet.missionType === MissionType.OFFENSE) {
            state.enemiesPendingSpawn = 0; 
            state.wave = 0; 
            this.engine.enemyManager.spawnHiveMother(targetPlanet);
        } else {
            state.enemiesPendingSpawn = Math.ceil((12 + 5 * 1) * targetPlanet.geneStrength); 
        }
  
        setTimeout(() => {
          this.engine.addMessage(this.engine.t('ORBITAL_DROP_COST', {0: dropCost}), state.player.x, state.player.y - 100, '#F87171', FloatingTextType.SYSTEM);
          if (state.spaceship.installedModules.includes(SpaceshipModuleType.ATMOSPHERIC_DEFLECTOR)) {
               setTimeout(() => {
                   this.engine.addMessage(this.engine.t('DEFLECTOR_ACTIVE'), state.player.x, state.player.y - 120, '#06b6d4', FloatingTextType.SYSTEM);
               }, 1000);
          }
          
          if (targetPlanet.missionType === MissionType.OFFENSE) {
               setTimeout(() => {
                   this.engine.addMessage(this.engine.t('MISSION_ASSAULT'), state.player.x, state.player.y - 140, '#fca5a5', FloatingTextType.SYSTEM);
               }, 2000);
          }
        }, 1000);
        
        state.terrain = generateTerrain(targetPlanet.visualType, targetPlanet.biome);
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
            
            this.engine.audio.playTurretFire(2);
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
        // 8% chance
        const roll = Math.random();
        if (roll > 0.08) return;
  
        const eventRoll = Math.random();
        let eventType: GalacticEventType;
  
        if (eventRoll < 0.33) eventType = GalacticEventType.EXPANSION;
        else if (eventRoll < 0.66) eventType = GalacticEventType.INVASION;
        else eventType = GalacticEventType.SALVAGE;
  
        // Validation for INVASION
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
            
            target.completed = false;
            target.buildings = []; 
            target.geneStrength += 0.2 + Math.random() * 0.3; 
            target.missionType = MissionType.OFFENSE; 
            
            event.targetPlanetId = target.id;
        } 
        else if (eventType === GalacticEventType.SALVAGE) {
            const reward = 3000 + Math.floor(Math.random() * 7001); 
            state.player.score += reward;
            event.scrapsReward = reward;
        }
  
        state.activeGalacticEvent = event;
    }
}