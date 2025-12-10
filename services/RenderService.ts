
import { GameState, AppMode, PerformanceMode, UserAction } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from '../constants';
import { LOD_THRESHOLDS } from '../data/registry';
import { 
    renderStaticTerrainToCache, drawDynamicTerrainFeatures, drawCachedTerrain,
    drawBloodStains, drawToxicZones, drawTurret, 
    drawAllySprite, drawPlayerSprite, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother,
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawPustule,
    drawBase, drawTurretSpot, drawProjectilesBatch,
    drawStartScreen, drawExplorationMap, drawOrbitalBeam, drawFloatingText,
    isVisible, drawParticlesBatch, drawEnemyBars
} from '../utils/renderers';
import { InputManager } from './InputManager';
import { AssetManager } from './managers/AssetManager';

export class RenderService {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    
    // Cache System
    private terrainCache: HTMLCanvasElement | null = null;
    private lastTerrainRef: any = null;
    private assetManager: AssetManager;

    constructor() {
        this.assetManager = new AssetManager();
    }

    public setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on backbuffer
    }

    public render(state: GameState, input: InputManager, time: number) {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;

        // --- Resolution Scaling Logic ---
        const scale = state.settings.resolutionScale || 1.0;
        // Reset transform to identity then apply scale
        ctx.setTransform(scale, 0, 0, scale, 0, 0); 

        // Clear Screen (Screen coordinates)
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // MODE SWITCHING RENDER
        if (state.appMode === AppMode.START_MENU) {
            drawStartScreen(ctx, time);
            return;
        }

        if (state.appMode === AppMode.EXPLORATION_MAP) {
            drawExplorationMap(ctx, state, time);
            return;
        }

        // Don't render gameplay in specific UI modes that cover full screen opaque
        if ([
            AppMode.SPACESHIP_VIEW, 
            AppMode.ORBITAL_UPGRADES, 
            AppMode.CARAPACE_GRID, 
            AppMode.SHIP_COMPUTER, 
            AppMode.INFRASTRUCTURE_RESEARCH, 
            AppMode.PLANET_CONSTRUCTION, 
            AppMode.YIELD_REPORT, 
            AppMode.BIO_SEQUENCING
        ].includes(state.appMode)) {
            return;
        }

        this.renderGameplay(ctx, state, input, time);
    }

    private renderGameplay(ctx: CanvasRenderingContext2D, state: GameState, input: InputManager, time: number) {
        const { camera } = state;

        // Apply Camera Translate (cumulative to scale)
        ctx.translate(-camera.x, -camera.y);

        // 1. Draw Space Terrain (Background) - Optimized Cache
        if (state.terrain !== this.lastTerrainRef) {
            // Regenerate cache if terrain reference changed (New planet or reset)
            // Pass world dimensions to cache generator
            this.terrainCache = renderStaticTerrainToCache(state.terrain, state.gameMode, state.currentPlanet, state.worldWidth, state.worldHeight);
            this.lastTerrainRef = state.terrain;
            // Also clear sprite cache on level change to free memory
            this.assetManager.clearCache();
        }

        if (this.terrainCache) {
            drawCachedTerrain(ctx, this.terrainCache);
        }
        
        // Draw only animated parts if setting is enabled
        if (state.settings.animatedBackground) {
            drawDynamicTerrainFeatures(ctx, state.terrain, time, camera);
        }
        
        // 2. Draw Blood Stains (Under everything else)
        if (state.settings.showBlood) {
            drawBloodStains(ctx, state.bloodStains, camera);
        }

        // Draw Toxic Zones (Purple Acid)
        drawToxicZones(ctx, state.toxicZones, time, camera);

        // Draw World Borders
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, state.worldWidth, state.worldHeight);

        // Draw Turret Spots (Only if base has landed)
        if (!state.baseDrop || !state.baseDrop.active || state.baseDrop.phase === 'DEPLOY') {
            state.turretSpots.forEach(spot => {
                if (!isVisible(spot.x, spot.y, 20, camera)) return;
                if (!spot.builtTurret) {
                    drawTurretSpot(ctx, spot, time);
                }
            });
        }

        // Draw Base(s)
        // Pass the full baseDrop object, or null if not active
        const dropState = (state.baseDrop && state.baseDrop.active) ? state.baseDrop : null;
        const baseY = dropState ? dropState.y : state.base.y;
        
        // Override base Y for drawing
        const drawingBase = { ...state.base, y: baseY };
        
        drawBase(ctx, drawingBase, state.settings.showShadows, dropState);
        
        if (state.secondaryBase) {
            drawBase(ctx, state.secondaryBase, state.settings.showShadows, null);
        }

        // Draw Turrets
        state.turretSpots.forEach(spot => {
            if (spot.builtTurret) {
                if (!isVisible(spot.x, spot.y, 30, camera)) return;
                drawTurret(ctx, spot.builtTurret, time, state.settings.showShadows);
            }
        });

        // Draw Orbital Beams
        if (state.orbitalBeams && state.orbitalBeams.length > 0) {
            state.orbitalBeams.forEach(beam => {
                if (beam.x + 50 > camera.x && beam.x - 50 < camera.x + CANVAS_WIDTH) {
                    drawOrbitalBeam(ctx, beam);
                }
            });
        }

        // Draw Allies
        state.allies.forEach(ally => {
            if (!isVisible(ally.x, ally.y, ally.radius, camera)) return;
            ctx.save();
            ctx.translate(ally.x, ally.y);
            ctx.rotate(ally.angle);
            const isMoving = ally.speed > 0; // Simplified check
            drawAllySprite(ctx, ally, time, isMoving, state.settings.showShadows);
            ctx.restore();
        });

        // Dynamic Level-of-Detail Calculation
        const perfMode = state.settings.performanceMode || 'BALANCED';
        const thresholds = LOD_THRESHOLDS[perfMode];
        
        let lodLevel = 0;
        const count = state.enemies.length;
        
        if (count > thresholds.superLow) lodLevel = 2; // Super Low
        else if (count > thresholds.low) lodLevel = 1; // Low

        // Use Asset Manager for sprites if not in High Quality mode or if count is very high
        // We use cached sprites for LOD 1 and 2
        const useCachedSprites = lodLevel > 0;

        // Draw Enemies
        state.enemies.forEach(e => {
            if (!isVisible(e.x, e.y, e.radius, camera)) return;

            ctx.save();
            ctx.translate(e.x, e.y);
            
            // Shadow
            if (state.settings.showShadows) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(0, 5, e.radius, e.radius*0.6, 0, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.rotate(e.angle);

            if (useCachedSprites && e.type !== 'PUSTULE') {
                const sprite = this.assetManager.getEnemySprite(e.type, e.bossType, e.color, e.radius);
                const size = sprite.width;
                const offset = size / 2;
                ctx.drawImage(sprite, -offset, -offset, size, size);
            } else {
                // Vector Drawing (Animated)
                if (e.isBoss && e.bossType) {
                    switch(e.bossType) {
                        case 'RED_SUMMONER': drawBossRed(ctx, e, time); break;
                        case 'BLUE_BURST': drawBossBlue(ctx, e, time); break;
                        case 'PURPLE_ACID': drawBossPurple(ctx, e, time); break;
                        case 'HIVE_MOTHER': drawHiveMother(ctx, e, time); break;
                    }
                } else {
                    switch(e.type) {
                        case 'GRUNT': drawGrunt(ctx, e, time, lodLevel); break;
                        case 'RUSHER': drawRusher(ctx, e, time, lodLevel); break;
                        case 'TANK': drawTank(ctx, e, time, lodLevel); break;
                        case 'KAMIKAZE': drawKamikaze(ctx, e, time, lodLevel); break;
                        case 'VIPER': drawViper(ctx, e, time, lodLevel); break;
                        case 'PUSTULE': drawPustule(ctx, e, time, lodLevel); break;
                    }
                }
            }
            
            // UI Bars (HP / Shell)
            drawEnemyBars(ctx, e, lodLevel);
            
            ctx.restore();
        });

        // Draw Laser Sight & Player (Only if Base is NOT dropping)
        if (!state.baseDrop || !state.baseDrop.active) {
            if (state.player.isAiming) {
                ctx.beginPath();
                ctx.moveTo(state.player.x, state.player.y);
                const endX = state.player.x + Math.cos(state.player.angle) * 3000;
                const endY = state.player.y + Math.sin(state.player.angle) * 3000;
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            const isMoving = input.isActive(UserAction.MOVE_UP) || input.isActive(UserAction.MOVE_DOWN) ||
                             input.isActive(UserAction.MOVE_LEFT) || input.isActive(UserAction.MOVE_RIGHT);
            
            const p = state.player;
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (state.settings.showShadows) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.ellipse(0, 5, p.radius, p.radius*0.6, 0, 0, Math.PI*2);
                ctx.fill();
            }
    
            ctx.rotate(p.angle);
            drawPlayerSprite(ctx, p, time, !!isMoving);
            ctx.restore();
    
            // Reload Indicator
            const currentWeaponType = p.loadout[p.currentWeaponIndex];
            if (p.weapons[currentWeaponType].reloading) {
                ctx.fillStyle = '#fcd34d';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText("[ RELOADING ]", p.x, p.y + 45);
            }
        }

        // Draw Projectiles
        drawProjectilesBatch(ctx, state.projectiles, camera);

        // Draw Particles
        drawParticlesBatch(ctx, state.particles, camera);

        // Floating Text
        state.floatingTexts.forEach(ft => {
            if (!isVisible(ft.x, ft.y, 50, camera)) return;
            drawFloatingText(ctx, ft);
        });
    }
}
