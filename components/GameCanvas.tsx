
import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/gameService';
import { GameState, WeaponType, BossType, AppMode } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { 
    renderStaticTerrainToCache, drawDynamicTerrainFeatures, drawCachedTerrain,
    drawBloodStains, drawToxicZones, drawTurret, 
    drawAllySprite, drawPlayerSprite, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother,
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper,
    drawBase, drawTurretSpot, drawProjectile,
    drawStartScreen, drawExplorationMap, drawOrbitalBeam, drawFloatingText,
    isVisible, drawParticlesBatch
} from '../utils/renderers';

interface GameCanvasProps {
  engine: GameEngine;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Cache System Refs
  const terrainCacheRef = useRef<HTMLCanvasElement | null>(null);
  const lastTerrainRef = useRef<any>(null); // To detect changes in terrain object reference

  const render = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update Game Logic
    engine.update(time);
    const state = engine.state;

    // Clear Screen (Screen coordinates)
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // MODE SWITCHING RENDER
    if (state.appMode === AppMode.START_MENU) {
        drawStartScreen(ctx, time);
        requestRef.current = requestAnimationFrame(render);
        return;
    }

    if (state.appMode === AppMode.EXPLORATION_MAP) {
        drawExplorationMap(ctx, state, time);
        requestRef.current = requestAnimationFrame(render);
        return;
    }

    // GAMEPLAY RENDER
    const { camera } = state;

    // Apply Camera Translate
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Space Terrain (Background) - Optimized Cache
    if (state.terrain !== lastTerrainRef.current) {
        // Regenerate cache if terrain reference changed (New planet or reset)
        terrainCacheRef.current = renderStaticTerrainToCache(state.terrain, state.gameMode, state.currentPlanet);
        lastTerrainRef.current = state.terrain;
    }

    if (terrainCacheRef.current) {
        drawCachedTerrain(ctx, terrainCacheRef.current);
    }
    // Draw only animated parts (Magma, Trees, Spores) on top of cache
    drawDynamicTerrainFeatures(ctx, state.terrain, time, camera);
    
    // 2. Draw Blood Stains (Under everything else)
    if (state.settings.showBlood) {
        drawBloodStains(ctx, state.bloodStains, camera);
    }

    // Draw Toxic Zones (Purple Acid)
    drawToxicZones(ctx, state.toxicZones, time, camera);

    // Draw World Borders
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Draw Turret Spots
    state.turretSpots.forEach(spot => {
        // Culling
        if (!isVisible(spot.x, spot.y, 20, camera)) return;

        if (!spot.builtTurret) {
            drawTurretSpot(ctx, spot, time);
        }
    });

    // Draw Base
    drawBase(ctx, state.base);

    // Draw Turrets
    state.turretSpots.forEach(spot => {
        if (spot.builtTurret) {
            if (!isVisible(spot.x, spot.y, 30, camera)) return;
            drawTurret(ctx, spot.builtTurret, time);
        }
    });

    // Draw Orbital Beams (Under units but over ground)
    if (state.orbitalBeams && state.orbitalBeams.length > 0) {
        state.orbitalBeams.forEach(beam => {
            // Beams are tall, custom culling
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
        const isMoving = ally.speed > 0; // Simplified
        drawAllySprite(ctx, ally, time, isMoving);
        ctx.restore();
    });

    // Draw Enemies
    state.enemies.forEach(e => {
      // Culling
      if (!isVisible(e.x, e.y, e.radius, camera)) return;

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle); // Enemies now face their velocity

      if (e.isBoss && e.bossType) {
          switch(e.bossType) {
              case BossType.RED_SUMMONER: drawBossRed(ctx, e, time); break;
              case BossType.BLUE_BURST: drawBossBlue(ctx, e, time); break;
              case BossType.PURPLE_ACID: drawBossPurple(ctx, e, time); break;
              case BossType.HIVE_MOTHER: drawHiveMother(ctx, e, time); break;
          }
      } else {
          // Normal Enemies
          switch(e.type) {
              case 'GRUNT': drawGrunt(ctx, e, time); break;
              case 'RUSHER': drawRusher(ctx, e, time); break;
              case 'TANK': drawTank(ctx, e, time); break;
              case 'KAMIKAZE': drawKamikaze(ctx, e, time); break;
              case 'VIPER': drawViper(ctx, e, time); break;
          }
      }
      
      // HP Bar - Counter Rotate to keep horizontal
      // STYLE: Bracketed Tech Bar
      ctx.rotate(-e.angle);
      
      const barWidth = e.isBoss ? e.radius * 3 : e.radius * 2.5;
      const barY = -e.radius - 15;
      const hpPct = Math.max(0, e.hp / e.maxHp);
      
      // Brackets [ ]
      ctx.strokeStyle = e.isBoss ? '#ef4444' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Left Bracket
      ctx.moveTo(-barWidth/2 + 2, barY - 2); ctx.lineTo(-barWidth/2, barY - 2); ctx.lineTo(-barWidth/2, barY + 6); ctx.lineTo(-barWidth/2 + 2, barY + 6);
      // Right Bracket
      ctx.moveTo(barWidth/2 - 2, barY - 2); ctx.lineTo(barWidth/2, barY - 2); ctx.lineTo(barWidth/2, barY + 6); ctx.lineTo(barWidth/2 - 2, barY + 6);
      ctx.stroke();

      // Segments
      const totalSegments = e.isBoss ? 20 : 5;
      const activeSegments = Math.ceil(totalSegments * hpPct);
      const segWidth = (barWidth - 4) / totalSegments;
      
      ctx.fillStyle = e.isBoss ? '#ef4444' : '#10b981';
      for(let i=0; i<activeSegments; i++) {
          ctx.fillRect(-barWidth/2 + 2 + (i * segWidth), barY, segWidth - 1, 4);
      }

      // Boss Name Tag
      if (e.isBoss) {
          ctx.fillStyle = e.color;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("APEX", 0, barY - 5);
      }
      
      ctx.restore();
    });

    // Draw Laser Sight for Sniper (Before projectiles/particles)
    if (state.player.isAiming) {
        ctx.beginPath();
        ctx.moveTo(state.player.x, state.player.y);
        const endX = state.player.x + Math.cos(state.player.angle) * 3000;
        const endY = state.player.y + Math.sin(state.player.angle) * 3000;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red with opacity
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw Projectiles
    state.projectiles.forEach(p => {
        if (!isVisible(p.x, p.y, p.radius + 20, camera)) return; // Simple culling for bullets
        drawProjectile(ctx, p);
    });

    // Draw Particles - NEW OPTIMIZED BATCHED
    drawParticlesBatch(ctx, state.particles, camera);

    // Determine if player is moving for animation
    const isMoving = engine.input.keys['w'] || engine.input.keys['a'] || engine.input.keys['s'] || engine.input.keys['d'] || 
                     engine.input.keys['W'] || engine.input.keys['A'] || engine.input.keys['S'] || engine.input.keys['D'];

    // Draw Player (Includes new Holographic HUD in the renderer)
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle); // Rotated to face mouse
    drawPlayerSprite(ctx, p, time, !!isMoving);
    ctx.restore();

    // Reload Indicator (Floating Text)
    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    if (p.weapons[currentWeaponType].reloading) {
        ctx.fillStyle = '#fcd34d';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("[ RELOADING ]", p.x, p.y + 45);
    }

    // Floating Text (Sci-Fi Data Style)
    state.floatingTexts.forEach(ft => {
        if (!isVisible(ft.x, ft.y, 50, camera)) return;
        drawFloatingText(ctx, ft);
    });

    requestRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-gray-700 shadow-2xl bg-gray-900 cursor-crosshair mx-auto"
    />
  );
};

export default React.memo(GameCanvas);
