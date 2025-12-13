
import { GameEngine } from '../gameService';
import { GameMode, MissionType, SpecialEventType, FloatingTextType, EnemyType, StatId, GameEventType, IGameSystem, BossType } from '../../types';
import { selectEnemyType } from '../../utils/enemyUtils';

export class MissionManager implements IGameSystem {
    public readonly systemId = 'MISSION_SYSTEM';

    private engine: GameEngine;

    // Configuration Constants
    private readonly CAMPAIGN_AMBIENT_INTERVAL = 30000;
    private readonly CAMPAIGN_BOSS_CHECK_INTERVAL = 60000;
    private readonly LURE_AVAILABLE_THRESHOLD = 10000;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number) {
        const state = this.engine.state;

        // 1. Global Checks
        if (state.missionComplete || state.isGameOver) return;
        if (state.baseDrop && state.baseDrop.active) return; // Wait for base drop
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE) return; // Offense mode is handled purely by Boss death logic

        // 2. Mode Dispatch
        if (state.gameMode === GameMode.CAMPAIGN) {
            this.updateCampaignMode(dt);
        } else {
            this.updateSurvivalMode(dt);
        }
    }

    // --- CAMPAIGN MODE LOGIC ---

    private updateCampaignMode(dt: number) {
        const state = this.engine.state;
        
        // Update Timers
        state.wave.spawnTimer += dt;
        state.campaign.pustuleTimer += dt;
        state.campaign.bossTimer += dt;

        this.handleAmbientSpawns(state);
        this.handlePustuleSpawns(state);
        this.handleCampaignBossSpawns(state);
    }

    private handleAmbientSpawns(state: any) {
        if (state.wave.spawnTimer >= this.CAMPAIGN_AMBIENT_INTERVAL) {
            state.wave.spawnTimer = 0;
            
            // Spawn 15 enemies at random borders
            for(let i=0; i<15; i++) {
                const { x, y } = this.getRandomBorderPosition(state.worldWidth, state.worldHeight);
                const types = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.TANK, EnemyType.KAMIKAZE, EnemyType.VIPER, EnemyType.TUBE_WORM];
                const type = types[Math.floor(Math.random() * types.length)];
                
                this.engine.enemyManager.spawn(type, x, y);
            }
            
            this.engine.addMessage(this.engine.t('HOSTILE_DETECTED'), state.player.x, state.player.y - 100, '#F87171', FloatingTextType.SYSTEM);
        }
    }

    private handlePustuleSpawns(state: any) {
        if (state.campaign.pustuleTimer >= state.campaign.nextPustuleSpawnTime) {
            state.campaign.pustuleTimer = 0;
            state.campaign.nextPustuleSpawnTime = 65000 + Math.random() * 130000; // 65-195s

            const pos = this.findSafeSpawnPosition(state, 1000); // 1000 min dist from base
            if (pos) {
                this.engine.enemyManager.spawn(EnemyType.PUSTULE, pos.x, pos.y, {
                    bossSummonTimer: 15000
                });
                this.engine.addMessage(this.engine.t('BOSS_DETECTED'), pos.x, pos.y, '#a3e635', FloatingTextType.SYSTEM);
            }
        }
    }

    private handleCampaignBossSpawns(state: any) {
        // "The Devourer" Check
        if (state.campaign.bossTimer >= this.CAMPAIGN_BOSS_CHECK_INTERVAL) {
            state.campaign.bossTimer = 0;

            // 60% chance to spawn if not already present
            if (Math.random() < 0.6) {
                const existing = state.enemies.find((e: any) => e.type === EnemyType.TUBE_WORM && e.isBoss);
                if (!existing) {
                    const corners = [
                        { x: 100, y: 100 },
                        { x: state.worldWidth - 100, y: 100 },
                        { x: 100, y: state.worldHeight - 100 },
                        { x: state.worldWidth - 100, y: state.worldHeight - 100 }
                    ];
                    const corner = corners[Math.floor(Math.random() * corners.length)];

                    this.engine.enemyManager.spawn(EnemyType.TUBE_WORM, corner.x, corner.y, {
                        isBoss: true,
                        flatHp: state.campaign.bossHp || 4000000,
                        angleOverride: Math.PI/2,
                        scoreOverride: 50000,
                        isWandering: true,
                        wanderDuration: 60000,
                        burrowState: 'SURFACING',
                        scaleY: 0
                    });

                    this.engine.addMessage(this.engine.t('DEVOURER_SURFACES'), state.worldWidth/2, state.worldHeight/2, '#FACC15', FloatingTextType.SYSTEM);
                    this.engine.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'ORBITAL_STRIKE' });
                }
            }
        }
    }

    // --- SURVIVAL / DEFENSE MODE LOGIC ---

    private updateSurvivalMode(dt: number) {
        const state = this.engine.state;

        state.wave.timer -= dt;
        state.wave.spawnTimer += dt;
        
        this.processWaveSpawning();
        this.checkWaveCompletion();
    }

    private processWaveSpawning() {
        const state = this.engine.state;
        
        // Calculate dynamic spawn rate based on intensity
        let spawnInterval = 500;
        if (state.wave.activeEvent === SpecialEventType.FRENZY) spawnInterval = 250;
        else if (state.wave.index > 10) spawnInterval = 400;

        if (state.wave.spawnTimer > spawnInterval) {
            if (state.wave.pendingCount > 0) {
                this.spawnWaveEnemy();
                state.wave.pendingCount--;
            }
            state.wave.spawnTimer -= spawnInterval; 
        }
    }

    private spawnWaveEnemy() {
        const state = this.engine.state;
        const type = this.selectEnemyTypeForWave(state);
        const x = Math.random() * state.worldWidth;
        const y = -50; 
        this.engine.enemyManager.spawn(type, x, y);
    }

    // Moved selection logic wrapper here (util imported elsewhere)
    private selectEnemyTypeForWave(state: any): EnemyType {
        return selectEnemyType(state.wave.index, state.gameMode, state.currentPlanet, state.wave.activeEvent);
    }

    private checkWaveCompletion() {
        const state = this.engine.state;

        if (state.wave.timer <= 0) {
            const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                         state.currentPlanet?.missionType === MissionType.DEFENSE;
            const isLastWave = isExplorationDefense && state.wave.index >= (state.currentPlanet?.totalWaves || 0);

            if (isLastWave) {
                const allEnemiesSpawned = state.wave.pendingCount <= 0;
                const allEnemiesDefeated = state.enemies.length === 0;

                if (allEnemiesSpawned && allEnemiesDefeated) {
                    this.engine.sessionManager.completeMission();
                }
            } else {
                this.nextWave();
            }
        }
    }

    // --- PUBLIC API ---

    public nextWave() {
        const state = this.engine.state;
        state.wave.index++;
        state.wave.activeEvent = SpecialEventType.NONE; 

        // 1. Calculate Duration
        let duration = 30;
        if (state.wave.index <= 10) {
            duration = 30 + (state.wave.index - 1) * 2;
        } else {
            duration = 30 + (9 * 2) + (state.wave.index - 10) * 1;
        }
        state.wave.duration = duration * 1000;
        state.wave.timer = duration * 1000;
        state.wave.spawnTimer = 0;

        // 2. Roll for Events
        let isFrenzy = false;
        if (state.wave.index % 5 === 0) {
            const roll = Math.random();
            if (roll < 0.3) {
                state.wave.activeEvent = SpecialEventType.FRENZY;
                isFrenzy = true;
                this.engine.addMessage(this.engine.t('FRENZY_DETECTED'), state.worldWidth/2, state.worldHeight/2, 'red', FloatingTextType.SYSTEM);
            } else {
                // Boss Event
                if (state.gameMode === GameMode.SURVIVAL || (state.currentPlanet?.missionType === MissionType.DEFENSE)) {
                    state.wave.activeEvent = SpecialEventType.BOSS;
                    this.spawnBoss(); 
                    this.engine.addMessage(this.engine.t('BOSS_DETECTED'), state.worldWidth/2, state.worldHeight/2, 'purple', FloatingTextType.SYSTEM);
                }
            }
        } else {
            this.engine.addMessage(this.engine.t('WAVE_STARTED', {0: state.wave.index}), state.worldWidth/2, state.worldHeight/2, 'yellow', FloatingTextType.SYSTEM);
        }

        // 3. Calculate Enemy Count
        let newEnemies = 10 + 4 * state.wave.index;
        
        // Exploration Scaling
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet) {
            let effectiveStr = state.currentPlanet.geneStrength;
            const reduction = this.engine.statManager.get(StatId.GENE_REDUCTION, 0);
            effectiveStr = Math.max(0.5, effectiveStr - reduction);
            newEnemies = Math.ceil(newEnemies * effectiveStr);
        }

        if (isFrenzy) {
            newEnemies *= 3;
        }
        
        state.wave.pendingCount += newEnemies;
        this.engine.notifyUI('WAVE_UPDATE');
    }

    private spawnBoss() {
        const state = this.engine.state;
        const roll = Math.random();
        let bossType = BossType.RED_SUMMONER;
        if (roll > 0.6) bossType = BossType.BLUE_BURST;
        if (roll > 0.85) bossType = BossType.PURPLE_ACID;

        const x = state.worldWidth / 2;
        const y = 100;
        
        this.engine.enemyManager.spawn(EnemyType.TANK, x, y, {
            isBoss: true,
            bossType: bossType,
            angleOverride: Math.PI/2
        });
    }

    public skipWave() {
        const state = this.engine.state;
        const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                     state.currentPlanet?.missionType === MissionType.DEFENSE;
        const isLastWave = isExplorationDefense && state.wave.index >= (state.currentPlanet?.totalWaves || 0);

        if (isLastWave) return;

        const elapsed = state.wave.duration - state.wave.timer;
        
        if (elapsed >= this.LURE_AVAILABLE_THRESHOLD) { 
            const remainingSeconds = Math.max(0, Math.floor(state.wave.timer / 1000));
            const baseReward = remainingSeconds * state.wave.index;
            const finalReward = this.engine.statManager.get(StatId.LURE_BONUS, baseReward);
            
            state.player.score += Math.floor(finalReward);
            this.engine.addMessage(this.engine.t('LURE_REWARD', {0: Math.floor(finalReward)}), state.player.x, state.player.y - 80, '#fbbf24', FloatingTextType.LOOT);
            
            this.engine.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'BASE_DAMAGE' });
            this.nextWave();
        } else {
            this.engine.addMessage(this.engine.t('LURE_PENDING'), state.player.x, state.player.y - 80, 'red', FloatingTextType.SYSTEM);
        }
    }

    // --- HELPERS ---

    private getRandomBorderPosition(w: number, h: number) {
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        
        if (side === 0) { x = Math.random() * w; y = 0; } // Top
        else if (side === 1) { x = w; y = Math.random() * h; } // Right
        else if (side === 2) { x = Math.random() * w; y = h; } // Bottom
        else { x = 0; y = Math.random() * h; } // Left
        
        return { x, y };
    }

    private findSafeSpawnPosition(state: any, minDist: number): {x: number, y: number} | null {
        let validPos = false;
        let px = 0, py = 0;
        let attempts = 0;
        const minDistSq = minDist * minDist;
        const bx = state.base.x;
        const by = state.base.y;

        while (!validPos && attempts < 20) {
            px = Math.random() * (state.worldWidth - 200) + 100;
            py = Math.random() * (state.worldHeight - 200) + 100;
            const distSq = (px - bx)**2 + (py - by)**2;
            if (distSq > minDistSq) {
                validPos = true;
            }
            attempts++;
        }
        return validPos ? { x: px, y: py } : null;
    }
}
