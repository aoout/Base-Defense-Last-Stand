

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/gameService';
import { GameState, WeaponType, BossType, AppMode } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { 
    drawTerrain, drawBloodStains, drawToxicZones, drawTurret, 
    drawAllySprite, drawPlayerSprite, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother,
    drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper,
    drawBase, drawTurretSpot, drawProjectile,
    drawStartScreen, drawExplorationMap
} from '../utils/renderers';

interface GameCanvasProps {
  engine: GameEngine;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

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

    // 1. Draw Space Terrain (Background)
    drawTerrain(ctx, state.terrain, state.gameMode, state.currentPlanet);
    
    // 2. Draw Blood Stains (Under everything else)
    if (state.settings.showBlood) {
        drawBloodStains(ctx, state.bloodStains);
    }

    // Draw Toxic Zones (Purple Acid)
    drawToxicZones(ctx, state.toxicZones, time);

    // Draw World Borders
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Draw Turret Spots
    state.turretSpots.forEach(spot => {
        if (!spot.builtTurret) {
            drawTurretSpot(ctx, spot, time);
        }
    });

    // Draw Base
    drawBase(ctx, state.base);

    // Draw Turrets
    state.turretSpots.forEach(spot => {
        if (spot.builtTurret) {
            drawTurret(ctx, spot.builtTurret, time);
        }
    });

    // Draw Allies
    state.allies.forEach(ally => {
        ctx.save();
        ctx.translate(ally.x, ally.y);
        ctx.rotate(ally.angle);
        const isMoving = ally.speed > 0; // Simplified
        drawAllySprite(ctx, ally, time, isMoving);
        ctx.restore();
    });

    // Draw Enemies
    state.enemies.forEach(e => {
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
      ctx.rotate(-e.angle);
      const barWidth = e.radius * 2;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(-barWidth/2, -e.radius - 8, barWidth, 4);
      ctx.fillStyle = '#22C55E'; // Green 500
      ctx.fillRect(-barWidth/2, -e.radius - 8, barWidth * (e.hp/e.maxHp), 4);
      
      // Boss Name Tag
      if (e.isBoss) {
          ctx.fillStyle = e.color;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("BOSS", 0, -e.radius - 12);
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
        drawProjectile(ctx, p);
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Determine if player is moving for animation
    const isMoving = engine.input.keys['w'] || engine.input.keys['a'] || engine.input.keys['s'] || engine.input.keys['d'] || 
                     engine.input.keys['W'] || engine.input.keys['A'] || engine.input.keys['S'] || engine.input.keys['D'];

    // Draw Player
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    drawPlayerSprite(ctx, p, time, !!isMoving);
    ctx.restore();

    // Player HP/Armor Bar (Floating above player)
    ctx.fillStyle = '#4B5563'; // bg
    ctx.fillRect(p.x - 20, p.y - 30, 40, 6);
    ctx.fillStyle = '#3B82F6'; // Armor
    ctx.fillRect(p.x - 20, p.y - 30, 40 * (p.armor/p.maxArmor), 6);
    ctx.fillStyle = '#EF4444'; // HP
    ctx.fillRect(p.x - 20, p.y - 24, 40 * (p.hp/p.maxHp), 4);
    
    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    // Reload Indicator
    if (p.weapons[currentWeaponType].reloading) {
        ctx.fillStyle = 'yellow';
        ctx.font = '12px Arial';
        ctx.fillText("RELOADING...", p.x - 30, p.y + 35);
    }

    // Messages (Floating Text)
    state.messages.forEach(m => {
        ctx.fillStyle = m.color;
        ctx.font = 'bold 16px Arial';
        ctx.globalAlpha = Math.min(1, m.time / 500);
        ctx.fillText(m.text, m.x, m.y);
        ctx.globalAlpha = 1.0;
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

export default GameCanvas;
