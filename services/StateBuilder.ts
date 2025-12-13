
import { 
    GameState, 
    AppMode, 
    GameMode, 
    MissionType, 
    PlanetVisualType, 
    BioResource, 
    SpecialEventType, 
    GameSettings,
    Player,
    EnemyType,
    DamageSource,
    Planet
} from '../types';
import { 
    WORLD_WIDTH, 
    WORLD_HEIGHT, 
    CAMPAIGN_WIDTH, 
    CAMPAIGN_HEIGHT, 
    BASE_STATS 
} from '../constants';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { generateSectorName } from '../utils/nameGenerator';
import { PlayerManager } from './managers/PlayerManager';
import { DataManager } from './DataManager';

interface BuilderContext {
    mode: GameMode;
    fullReset: boolean;
    viewportW: number;
    viewportH: number;
    playerManager: PlayerManager;
    dataManager: DataManager;
    currentState?: GameState; // Optional: for soft resets/persistence
    settings: GameSettings;
    targetPlanet?: Planet | null; // NEW: Context for immediate deployment configuration
}

/**
 * StateBuilder
 * Responsibilities:
 * 1. Calculate World Dimensions based on GameMode.
 * 2. Handle Logic for "Soft Reset" (preserving inventory) vs "Hard Reset".
 * 3. Construct the clean GameState tree.
 * 4. Configure environment based on Target Planet (if provided).
 */
export class StateBuilder {

    public static build(ctx: BuilderContext): GameState {
        const { mode, fullReset, currentState, targetPlanet } = ctx;
        
        // 1. Determine Dimensions
        const { worldW, worldH } = this.getWorldDimensions(mode);
        const { basePos, playerPos } = this.getSpawnPositions(mode, worldW, worldH);

        // 2. Generate World Data
        // If targetPlanet is provided, use its biome/visuals for terrain generation immediately
        const visualType = targetPlanet ? targetPlanet.visualType : PlanetVisualType.BARREN;
        const biome = targetPlanet ? targetPlanet.biome : 'BARREN' as any;
        const terrain = generateTerrain(visualType, biome, worldW, worldH);
        
        // Sector Data: Preserve if soft reset, else new
        const sectorName = !fullReset && currentState?.sectorName ? currentState.sectorName : generateSectorName();
        const planets = !fullReset && currentState?.planets 
            ? currentState.planets 
            : generatePlanets(undefined, ctx.viewportW, ctx.viewportH);
        
        // Ensure data integrity for planets
        planets.forEach(p => { if (!p.buildings) p.buildings = []; });

        // 3. Build Player (Hydrating from old state if needed)
        const player = this.buildPlayer(ctx, playerPos.x, playerPos.y);

        // 4. Build Turret Spots
        const turretSpots = this.buildTurretSpots(mode, basePos.x, basePos.y);

        // 5. Build Complex Sub-States
        const spaceship = this.buildSpaceshipState(fullReset, currentState);
        
        // 6. Base Drop Logic (If deploying to a planet)
        // If we are deploying, start base high up
        const baseDrop = targetPlanet ? {
            active: true,
            y: basePos.y - 1500,
            targetY: basePos.y,
            velocity: 0,
            phase: 'ENTRY' as const,
            deployTimer: 0
        } : null;

        // Adjust Player Spawn if Dropping
        if (baseDrop) {
            player.x = basePos.x;
            player.y = basePos.y; // Hidden inside base
        }

        // 7. Wave State (Configured for Planet if exists)
        const waveState = this.buildWaveState(mode, targetPlanet);
        const campaignState = this.buildCampaignState(mode);
        
        // 8. Final Assembly
        const saveSlots = !fullReset && currentState?.saveSlots ? currentState.saveSlots : [];
        
        // AppMode: If we have a target planet, we go straight to gameplay.
        // Otherwise, if exploration mode but no planet, go to map.
        let appMode = AppMode.GAMEPLAY;
        if (mode === GameMode.EXPLORATION && !targetPlanet) {
            appMode = AppMode.EXPLORATION_MAP;
        }

        const state: GameState = {
            appMode,
            gameMode: mode,
            sectorName,
            planets,
            currentPlanet: targetPlanet || null,
            selectedPlanetId: targetPlanet?.id || null,
            savedPlayerState: null,
            activeGalacticEvent: null,
            pendingYieldReport: null,
            
            // Dimensions
            worldWidth: worldW,
            worldHeight: worldH,
            viewportWidth: ctx.viewportW,
            viewportHeight: ctx.viewportH,
            camera: { x: 0, y: 0 },

            // Entities
            player,
            base: { 
                x: basePos.x, 
                y: basePos.y, 
                width: BASE_STATS.width, 
                height: BASE_STATS.height, 
                hp: BASE_STATS.maxHp, 
                maxHp: BASE_STATS.maxHp 
            },
            secondaryBase: undefined,
            baseDrop,

            // Collections
            terrain,
            turretSpots,
            enemies: [],
            allies: [],
            projectiles: [],
            particles: [],
            orbitalBeams: [],
            bloodStains: [],
            toxicZones: [],
            floatingTexts: [],

            // Systems
            spaceship,
            wave: waveState,
            campaign: campaignState,
            saveSlots,
            settings: ctx.settings,
            stats: this.buildEmptyStats(),
            
            // Meta
            isGameOver: false,
            missionComplete: false,
            isPaused: false,
            isTacticalMenuOpen: false,
            isInventoryOpen: false,
            isShopOpen: false,
            time: 0,
            lastAllySpawnTime: 0,
            orbitalSupportTimer: 0
        };

        // Campaign Overrides
        if (mode === GameMode.CAMPAIGN) {
            state.base.maxHp *= 2;
            state.base.hp = state.base.maxHp;
        }

        return state;
    }

    private static getWorldDimensions(mode: GameMode) {
        if (mode === GameMode.CAMPAIGN) {
            return { worldW: CAMPAIGN_WIDTH, worldH: CAMPAIGN_HEIGHT };
        }
        return { worldW: WORLD_WIDTH, worldH: WORLD_HEIGHT };
    }

    private static getSpawnPositions(mode: GameMode, w: number, h: number) {
        if (mode === GameMode.CAMPAIGN) {
            const cx = w / 2;
            const cy = h / 2;
            return {
                basePos: { x: cx, y: cy },
                playerPos: { x: cx, y: cy + 150 }
            };
        }
        // Survival / Exploration (Bottom Base)
        return {
            basePos: { x: w / 2, y: h - 150 },
            playerPos: { x: w / 2, y: h - 300 }
        };
    }

    private static buildPlayer(ctx: BuilderContext, x: number, y: number): Player {
        const { playerManager, dataManager, fullReset, currentState } = ctx;
        
        // Create fresh player struct
        const initialPlayer = playerManager.createInitialPlayer(x, y, dataManager);

        // Hydrate from previous state if soft reset
        if (!fullReset && currentState?.player) {
            const oldP = currentState.player;
            initialPlayer.score = oldP.score;
            initialPlayer.weapons = oldP.weapons;
            initialPlayer.loadout = oldP.loadout;
            initialPlayer.inventory = oldP.inventory;
            initialPlayer.upgrades = oldP.upgrades;
            initialPlayer.freeModules = oldP.freeModules;
            initialPlayer.grenadeModules = oldP.grenadeModules;
            initialPlayer.grenades = oldP.grenades;
        }

        return initialPlayer;
    }

    private static buildTurretSpots(mode: GameMode, bx: number, by: number) {
        let offsets = [];
        
        if (mode === GameMode.CAMPAIGN) {
            offsets = [
                { x: 0, y: -180 }, { x: 0, y: 180 },
                { x: -220, y: 0 }, { x: 220, y: 0 },
                { x: -150, y: -150 }, { x: 150, y: -150 },
                { x: -150, y: 150 }, { x: 150, y: 150 }
            ];
        } else {
            offsets = [
                { x: -150, y: -150 },
                { x: 150, y: -150 },
                { x: -250, y: -100 },
                { x: 250, y: -100 },
                { x: 0, y: -250 },
                { x: -350, y: -300 },
                { x: 350, y: -300 },
                { x: 0, y: -450 },
            ];
        }

        return offsets.map((pos, idx) => ({ 
            id: idx, 
            x: bx + pos.x, 
            y: by + pos.y 
        }));
    }

    private static buildSpaceshipState(fullReset: boolean, currentState?: GameState) {
        if (!fullReset && currentState?.spaceship) {
            return currentState.spaceship;
        }
        return { 
            installedModules: [], 
            orbitalUpgradeTree: [], 
            orbitalDamageMultiplier: 1, 
            orbitalRateMultiplier: 1, 
            carapaceGrid: null, 
            infrastructureUpgrades: [], 
            infrastructureOptions: [], 
            infrastructureLocked: false, 
            bioNodes: [], 
            bioResources: { [BioResource.ALPHA]: 0, [BioResource.BETA]: 0, [BioResource.GAMMA]: 0 }, 
            bioTasks: [], 
            activeBioTask: null,
            heroicNodes: [],
            snakeRewardClaimed: false
        };
    }

    private static buildWaveState(mode: GameMode, planet?: Planet | null) {
        if (mode === GameMode.CAMPAIGN) {
            return {
                index: 0,
                timer: 0,
                duration: 0,
                spawnTimer: 0,
                pendingCount: 0,
                spawnedCount: 0,
                totalCount: 9999,
                activeEvent: SpecialEventType.NONE
            };
        }

        // Logic moved from GalaxyManager to here for consistency
        let pendingCount = 17;
        let index = 1;

        if (planet) {
            if (planet.missionType === MissionType.OFFENSE) {
                pendingCount = 0; // Offense spawns handled by boss
                index = 0;
            } else {
                // Scale initial enemies by Gene Strength
                pendingCount = Math.ceil((12 + 5 * 1) * planet.geneStrength); 
            }
        }

        return {
            index: index,
            timer: 30000,
            duration: 30000,
            spawnTimer: 0,
            pendingCount: pendingCount,
            spawnedCount: 0,
            totalCount: 99999,
            activeEvent: SpecialEventType.NONE
        };
    }

    private static buildCampaignState(mode: GameMode) {
        return {
            pustuleTimer: 0,
            nextPustuleSpawnTime: 65000 + Math.random() * 130000,
            devourerTimer: 0,
            bossHp: 4000000,
            roamingBossTimer: 0,
            nextRoamingBossTime: 95000 + Math.random() * 100000
        };
    }

    private static buildEmptyStats() {
        return { 
            shotsFired: 0, 
            shotsHit: 0, 
            damageDealt: 0, 
            damageBySource: { [DamageSource.PLAYER]: 0, [DamageSource.TURRET]: 0, [DamageSource.ALLY]: 0, [DamageSource.ORBITAL]: 0, [DamageSource.ENEMY]: 0 }, 
            killsByType: { [EnemyType.GRUNT]: 0, [EnemyType.RUSHER]: 0, [EnemyType.TANK]: 0, [EnemyType.KAMIKAZE]: 0, [EnemyType.VIPER]: 0, [EnemyType.PUSTULE]: 0, [EnemyType.TUBE_WORM]: 0, 'BOSS': 0 }, 
            encounteredEnemies: [] 
        };
    }
}
