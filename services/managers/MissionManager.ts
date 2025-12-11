
import { GameEngine } from '../gameService';
import { GameMode, MissionType, SpecialEventType, FloatingTextType, StatId, EnemyType } from '../../types';
import { selectEnemyType } from '../../utils/enemyUtils';

export class MissionManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number) {
        const state = this.engine.state;

        if (state.missionComplete || state.isGameOver) return;
        
        // Prevent mission progress if base is dropping
        if (state.baseDrop && state.baseDrop.active) return;

        // Offense Mode (No waves, just boss)
        if (state.gameMode === GameMode.EXPLORATION && state.currentPlanet?.missionType === MissionType.OFFENSE) {
            return;
        }

        // Campaign Mode Logic
        if (state.gameMode === GameMode.CAMPAIGN) {
            state.wave.spawnTimer += dt;
            state.campaign.pustuleTimer += dt;
            
            // Spawn normal enemies every 30 seconds
            if (state.wave.spawnTimer >= 30000) {
                state.wave.spawnTimer = 0;
                
                // Spawn 15 enemies
                for(let i=0; i<15; i++) {
                    // Random border spawn
                    let x, y;
                    const side = Math.floor(Math.random() * 4);
                    const w = state.worldWidth;
                    const h = state.worldHeight;
                    
                    if (side === 0) { // Top
                        x = Math.random() * w;
                        y = 0;
                    } else if (side === 1) { // Right
                        x = w;
                        y = Math.random() * h;
                    } else if (side === 2) { // Bottom
                        x = Math.random() * w;
                        y = h;
                    } else { // Left
                        x = 0;
                        y = Math.random() * h;
                    }
                    
                    // Added TUBE_WORM to spawn list
                    const types = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.TANK, EnemyType.KAMIKAZE, EnemyType.VIPER, EnemyType.TUBE_WORM];
                    const type = types[Math.floor(Math.random() * types.length)];
                    
                    this.engine.enemyManager.spawnSpecificEnemy(type, x, y);
                }
                
                this.engine.addMessage("HOSTILE DETECTED ON PERIMETER", state.player.x, state.player.y - 100, '#F87171', FloatingTextType.SYSTEM);
            }

            // Pustule Spawning Logic (Standard Campaign Threat)
            if (state.campaign.pustuleTimer >= state.campaign.nextPustuleSpawnTime) {
                state.campaign.pustuleTimer = 0;
                state.campaign.nextPustuleSpawnTime = 65000 + Math.random() * 130000; // 65-195s

                let validPos = false;
                let px = 0, py = 0;
                let attempts = 0;
                const minDistSq = 1000 * 1000;
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

                if (validPos) {
                    this.engine.enemyManager.spawnPustule(px, py);
                    this.engine.addMessage(this.engine.t('BOSS_DETECTED'), px, py, '#a3e635', FloatingTextType.SYSTEM);
                }
            }

            // --- THE DEVOURER (Campaign Boss) LOGIC ---
            // Timer checks every minute
            state.campaign.bossTimer += dt;
            if (state.campaign.bossTimer >= 60000) {
                state.campaign.bossTimer = 0; // Reset for next cycle check

                // 60% chance to spawn
                if (Math.random() < 0.6) {
                    // Check if already exists (sanity check)
                    const existing = state.enemies.find(e => e.type === EnemyType.TUBE_WORM && e.isBoss);
                    if (!existing) {
                        this.engine.enemyManager.spawnCampaignBoss();
                        // Global Alert
                        this.engine.addMessage("SEISMIC WARNING: THE DEVOURER SURFACES", state.worldWidth/2, state.worldHeight/2, '#FACC15', FloatingTextType.SYSTEM);
                        this.engine.audio.play('ORBITAL_STRIKE'); // Reuse deep rumble sound
                    }
                }
            }

            return;
        }

        // Defense Mode (Survival & Defense Missions)
        state.wave.timer -= dt;
        state.wave.spawnTimer += dt;
        
        let spawnInterval = 500;
        if (state.wave.activeEvent === SpecialEventType.FRENZY) spawnInterval = 250;
        else if (state.wave.index > 10) spawnInterval = 400;

        if (state.wave.spawnTimer > spawnInterval) {
            if (state.wave.pendingCount > 0) {
                this.engine.enemyManager.spawnEnemy();
                state.wave.pendingCount--;
            }
            state.wave.spawnTimer -= spawnInterval; 
        }

        if (state.wave.timer <= 0) {
            const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                         state.currentPlanet?.missionType === MissionType.DEFENSE;
            const isLastWave = isExplorationDefense && state.wave.index >= (state.currentPlanet?.totalWaves || 0);

            if (isLastWave) {
                const allEnemiesSpawned = state.wave.pendingCount <= 0;
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
        state.wave.index++;
        state.wave.activeEvent = SpecialEventType.NONE; 

        // Wave Duration Scaling
        let duration = 30;
        if (state.wave.index <= 10) {
            duration = 30 + (state.wave.index - 1) * 2;
        } else {
            duration = 30 + (9 * 2) + (state.wave.index - 10) * 1;
        }
        state.wave.duration = duration * 1000;
        state.wave.timer = duration * 1000;
        state.wave.spawnTimer = 0;

        // Event Roll
        let isFrenzy = false;
        if (state.wave.index % 5 === 0) {
            const roll = Math.random();
            if (roll < 0.3) {
                state.wave.activeEvent = SpecialEventType.FRENZY;
                isFrenzy = true;
                this.engine.addMessage(this.engine.t('FRENZY_DETECTED'), state.worldWidth/2, state.worldHeight/2, 'red', FloatingTextType.SYSTEM);
            } else {
                if (state.gameMode === GameMode.SURVIVAL || (state.currentPlanet?.missionType === MissionType.DEFENSE)) {
                    state.wave.activeEvent = SpecialEventType.BOSS;
                    this.engine.enemyManager.spawnBoss(); 
                    this.engine.addMessage(this.engine.t('BOSS_DETECTED'), state.worldWidth/2, state.worldHeight/2, 'purple', FloatingTextType.SYSTEM);
                }
            }
        } else {
            this.engine.addMessage(this.engine.t('WAVE_STARTED', {0: state.wave.index}), state.worldWidth/2, state.worldHeight/2, 'yellow', FloatingTextType.SYSTEM);
        }

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

    public skipWave() {
        const state = this.engine.state;
        const isExplorationDefense = state.gameMode === GameMode.EXPLORATION &&
                                     state.currentPlanet?.missionType === MissionType.DEFENSE;
        const isLastWave = isExplorationDefense && state.wave.index >= (state.currentPlanet?.totalWaves || 0);

        if (isLastWave) return;

        const elapsed = state.wave.duration - state.wave.timer;
        
        if (elapsed >= 10000) { 
            const remainingSeconds = Math.max(0, Math.floor(state.wave.timer / 1000));
            const baseReward = remainingSeconds * state.wave.index;
            const finalReward = this.engine.statManager.get(StatId.LURE_BONUS, baseReward);
            
            state.player.score += Math.floor(finalReward);
            this.engine.addMessage(this.engine.t('LURE_REWARD', {0: Math.floor(finalReward)}), state.player.x, state.player.y - 80, '#fbbf24', FloatingTextType.LOOT);
            
            this.engine.audio.play('BASE_DAMAGE'); 
            this.nextWave();
        } else {
            this.engine.addMessage(this.engine.t('LURE_PENDING'), state.player.x, state.player.y - 80, 'red', FloatingTextType.SYSTEM);
        }
    }
}
