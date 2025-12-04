
import { GameEngine } from '../gameService';
import { GameMode, MissionType, SpecialEventType, FloatingTextType, BioBuffType } from '../../types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class MissionManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number) {
        const state = this.engine.state;

        if (state.missionComplete || state.isGameOver) return;

        // Offense Mode (No waves, just boss)
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE) {
            // Logic handled via EnemyManager boss death triggers
            return;
        }

        // Defense Mode (Survival & Defense Missions)
        state.waveTimeRemaining -= dt;
        state.spawnTimer += dt;
        
        // Dynamic Spawn Rate based on wave intensity
        let spawnInterval = 500;
        if (state.activeSpecialEvent === SpecialEventType.FRENZY) spawnInterval = 250;
        else if (state.wave > 10) spawnInterval = 400;

        if (state.spawnTimer > spawnInterval) {
            if (state.enemiesPendingSpawn > 0) {
                this.engine.enemyManager.spawnEnemy();
                state.enemiesPendingSpawn--;
            }
            state.spawnTimer = 0;
        }

        if (state.waveTimeRemaining <= 0) {
            const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                         state.currentPlanet?.missionType === MissionType.DEFENSE;
            const isLastWave = isExplorationDefense && state.wave >= (state.currentPlanet?.totalWaves || 0);

            if (isLastWave) {
                // VICTORY CONDITION CHECK
                const allEnemiesSpawned = state.enemiesPendingSpawn <= 0;
                const allEnemiesDefeated = state.enemies.length === 0;

                if (allEnemiesSpawned && allEnemiesDefeated) {
                    this.engine.completeMission();
                }
            } else {
                this.nextWave();
            }
        }
    }

    public nextWave() {
        const state = this.engine.state;
        state.wave++;
        state.activeSpecialEvent = SpecialEventType.NONE; 

        // Wave Duration Scaling
        let duration = 30;
        if (state.wave <= 10) {
            duration = 30 + (state.wave - 1) * 2;
        } else {
            duration = 30 + (9 * 2) + (state.wave - 10) * 1;
        }
        state.waveDuration = duration * 1000;
        state.waveTimeRemaining = duration * 1000;
        state.spawnTimer = 0;

        // Event Roll
        let isFrenzy = false;
        if (state.wave % 5 === 0) {
            const roll = Math.random();
            if (roll < 0.3) {
                state.activeSpecialEvent = SpecialEventType.FRENZY;
                isFrenzy = true;
                this.engine.addMessage(this.engine.t('FRENZY_DETECTED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red', FloatingTextType.SYSTEM);
            } else {
                if (state.gameMode === GameMode.SURVIVAL || (state.currentPlanet?.missionType === MissionType.DEFENSE)) {
                    state.activeSpecialEvent = SpecialEventType.BOSS;
                    this.engine.enemyManager.spawnBoss(); 
                    this.engine.addMessage(this.engine.t('BOSS_DETECTED'), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'purple', FloatingTextType.SYSTEM);
                }
            }
        } else {
            this.engine.addMessage(this.engine.t('WAVE_STARTED', {0: state.wave}), WORLD_WIDTH/2, WORLD_HEIGHT/2, 'yellow', FloatingTextType.SYSTEM);
        }

        // Enemy Count Scaling
        let newEnemies = 12 + 5 * state.wave;
        
        // Exploration Scaling
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet) {
            let effectiveStr = state.currentPlanet.geneStrength;
            const reduction = this.engine.spaceshipManager.getGeneReduction();
            effectiveStr = Math.max(0.5, effectiveStr - reduction);
            newEnemies = Math.ceil(newEnemies * effectiveStr);
        }

        if (isFrenzy) {
            newEnemies *= 3;
        }
        
        state.enemiesPendingSpawn += newEnemies;
    }

    public skipWave() {
        const state = this.engine.state;
        const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                     state.currentPlanet?.missionType === MissionType.DEFENSE;
        const isLastWave = isExplorationDefense && state.wave >= (state.currentPlanet?.totalWaves || 0);

        if (isLastWave) return; // Cannot skip logic on last wave wait

        const elapsed = state.waveDuration - state.waveTimeRemaining;
        
        if (elapsed >= 10000) { // Can only skip after 10s
            const remainingSeconds = Math.max(0, Math.floor(state.waveTimeRemaining / 1000));
            const baseReward = remainingSeconds * state.wave;
            
            // Apply Bio-Sequencing Bonus
            const bioBonus = this.engine.spaceshipManager.getBioBuffTotal(BioBuffType.LURE_BONUS);
            const finalReward = Math.floor(baseReward * (1 + bioBonus));
            
            state.player.score += finalReward;
            this.engine.addMessage(this.engine.t('LURE_REWARD', {0: finalReward}), state.player.x, state.player.y - 80, '#fbbf24', FloatingTextType.LOOT);
            
            if (bioBonus > 0) {
                // Optional: Show bonus breakdown
                // this.engine.addMessage(`(BIO-BONUS +${Math.round(bioBonus*100)}%)`, state.player.x, state.player.y - 100, '#4ade80', FloatingTextType.SYSTEM);
            }

            this.engine.audio.playBaseDamage(); 
            
            this.nextWave();
        } else {
            this.engine.addMessage(this.engine.t('LURE_PENDING'), state.player.x, state.player.y - 80, 'red', FloatingTextType.SYSTEM);
        }
    }
}
