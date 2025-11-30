

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/gameService';
import { EnemyType, GameState, WeaponType, Enemy, Player, TerrainFeature, BloodStain, Turret, Ally, TurretType, BossType, ToxicZone, AppMode, Planet } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';

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
    drawTerrain(ctx, state.terrain);
    
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
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, 15, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();
            // Pulse effect
            const pulse = (Math.sin(time * 0.005) + 1) * 0.5;
            ctx.fillStyle = `rgba(16, 185, 129, ${pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, 10, 0, Math.PI*2);
            ctx.fill();
        }
    });

    // Draw Base
    const b = state.base;
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
    // Base detail
    ctx.fillStyle = '#172554';
    ctx.fillRect(b.x - b.width/2 + 10, b.y - b.height/2 + 10, b.width - 20, b.height - 20);
    // Base HP Bar
    const bHpPct = b.hp / b.maxHp;
    ctx.fillStyle = 'red';
    ctx.fillRect(b.x - b.width/2, b.y - b.height/2 - 15, b.width, 10);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(b.x - b.width/2, b.y - b.height/2 - 15, b.width * bHpPct, 10);

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
          }
      } else {
          // Normal Enemies
          switch(e.type) {
              case EnemyType.GRUNT: drawGrunt(ctx, e, time); break;
              case EnemyType.RUSHER: drawRusher(ctx, e, time); break;
              case EnemyType.TANK: drawTank(ctx, e, time); break;
              case EnemyType.KAMIKAZE: drawKamikaze(ctx, e, time); break;
              case EnemyType.VIPER: drawViper(ctx, e, time); break;
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
        if (p.isHoming) {
            // Draw Missile
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            
            // Missile Body
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(6, 0); // Tip
            ctx.lineTo(-4, -3);
            ctx.lineTo(-4, 3);
            ctx.closePath();
            ctx.fill();
            
            // Thruster flame
            ctx.fillStyle = '#FBBF24';
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(-8, -2);
            ctx.lineTo(-8, 2);
            ctx.fill();
            ctx.restore();

        } else if (p.createsToxicZone) {
            // Acid Bomb Logic
            ctx.fillStyle = '#A855F7';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fill();
            // Bubbles trail
            if (Math.random() < 0.3) {
                engine.spawnParticle(p.x, p.y, '#D8B4FE', 1, 1);
            }
        } else if (p.weaponType === WeaponType.FLAMETHROWER) {
             // FLAMETHROWER RENDERING
             const maxRange = p.maxRange || 350;
             const rangeTraveled = maxRange - p.rangeRemaining;
             const lifePct = rangeTraveled / maxRange; // 0 (start) -> 1 (end)

             // Size grows with distance
             const currentRadius = 3 + lifePct * 12;

             // Color gradient: White -> Yellow -> Orange -> Red -> Smoke
             let color = 'rgba(255, 255, 255, 0.8)';
             if (lifePct > 0.1) color = 'rgba(255, 230, 0, 0.8)'; // Yellow
             if (lifePct > 0.3) color = 'rgba(255, 100, 0, 0.7)'; // Orange
             if (lifePct > 0.6) color = 'rgba(200, 20, 20, 0.5)'; // Red
             if (lifePct > 0.8) color = 'rgba(50, 50, 50, 0.3)'; // Smoke

             ctx.save();
             ctx.globalCompositeOperation = 'lighter'; // Additive blending for fire glow
             ctx.fillStyle = color;
             ctx.beginPath();
             ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
             ctx.fill();
             ctx.restore();

        } else {
            // Standard Bullet
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fill();
            
            // Trail
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx*2, p.y - p.vy*2);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
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

// --- Start Screen Render ---
const drawStartScreen = (ctx: CanvasRenderingContext2D, time: number) => {
    // Background: Moving Stars
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 1;
    const offset = (time * 0.02) % 40;
    for(let i = 0; i < CANVAS_WIDTH; i+=40) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for(let i = 0; i < CANVAS_HEIGHT; i+=40) {
        ctx.beginPath(); ctx.moveTo(0, i + offset); ctx.lineTo(CANVAS_WIDTH, i + offset); ctx.stroke();
    }

    // Hero Text (Drawn by React UI mostly, but we can add effects)
    // Particle Dust
    for(let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 100 + time * 0.0001) * CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
        const y = (Math.cos(i * 50 + time * 0.0002) * CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
        const s = (Math.sin(time * 0.001 + i) + 1) * 1.5;
        ctx.fillStyle = `rgba(100, 200, 255, ${0.1 + Math.random()*0.3})`;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI*2); ctx.fill();
    }
}

// --- Exploration Map Render ---
const drawExplorationMap = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
    // Deep Space Background
    const bgGradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Starfield
    for(let i=0; i<200; i++) {
        const seed = i * 1337;
        const x = (seed * 123) % CANVAS_WIDTH;
        const y = (seed * 456) % CANVAS_HEIGHT;
        const size = (seed % 2) + 0.5;
        ctx.fillStyle = `rgba(255,255,255,${(Math.sin(time*0.001 + i) + 1) * 0.4})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();
    }

    // Connections (Constellation lines)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<state.planets.length - 1; i++) {
        const p1 = state.planets[i];
        const p2 = state.planets[i+1];
        if (Math.abs(p1.x - p2.x) < 300 && Math.abs(p1.y - p2.y) < 300) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
    }
    ctx.stroke();

    // Planets
    state.planets.forEach(p => {
        const isSelected = state.selectedPlanetId === p.id;
        // Deterministic random for texture based on planet ID
        const seed = parseInt(p.id.split('-')[1]) || 0;
        const planetType = seed % 3; // 0: Terrestrial, 1: Gas, 2: Exotic

        // Atmosphere Glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isSelected ? 30 : 15;

        // 1. Planet Base Body
        // Use solid fill first to ensure opacity
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset blur for internal details

        // Clip everything to the planet circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.clip();

        // 2. 3D Volume Gradient (Shadow Overlay)
        const shading = ctx.createRadialGradient(
            p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.1,
            p.x, p.y, p.radius * 1.2
        );
        shading.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); // Highlight
        shading.addColorStop(0.4, 'rgba(0, 0, 0, 0.0)');     // Mid
        shading.addColorStop(0.8, 'rgba(0, 0, 0, 0.6)');     // Shadow
        shading.addColorStop(1, 'rgba(0, 0, 0, 0.8)');       // Deep Shadow
        
        // 3. Surface Texture (Rotating)
        // Rotate world based on time for living planet feel
        const rotationSpeed = 0.0001 * (seed % 2 === 0 ? 1 : -1);
        ctx.translate(p.x, p.y);
        ctx.rotate(time * rotationSpeed + seed);
        ctx.translate(-p.x, -p.y);

        if (planetType === 1) { 
            // Gas Giant - Bands
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for(let i=0; i<3; i++) {
                const yOff = ((seed * 11 + i * 20) % (p.radius * 2)) - p.radius;
                const h = 4 + (seed * i) % 8;
                ctx.fillRect(p.x - p.radius, p.y + yOff, p.radius*2, h);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for(let i=0; i<3; i++) {
                const yOff = ((seed * 17 + i * 25) % (p.radius * 2)) - p.radius;
                const h = 2 + (seed * i) % 6;
                ctx.fillRect(p.x - p.radius, p.y + yOff, p.radius*2, h);
            }
        } else if (planetType === 0) {
            // Terrestrial - Craters/Patches
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for(let i=0; i<4; i++) {
                const cx = ((seed * 23 + i * 41) % (p.radius * 1.2)) - p.radius * 0.6;
                const cy = ((seed * 29 + i * 37) % (p.radius * 1.2)) - p.radius * 0.6;
                const r = 2 + (seed * i) % 6;
                ctx.beginPath();
                ctx.arc(p.x + cx, p.y + cy, r, 0, Math.PI*2);
                ctx.fill();
            }
             ctx.fillStyle = 'rgba(255,255,255,0.1)';
             for(let i=0; i<3; i++) {
                const cx = ((seed * 7 + i * 13) % (p.radius * 1.4)) - p.radius * 0.7;
                const cy = ((seed * 3 + i * 19) % (p.radius * 1.4)) - p.radius * 0.7;
                const r = 4 + (seed * i) % 8;
                ctx.beginPath();
                ctx.arc(p.x + cx, p.y + cy, r, 0, Math.PI*2);
                ctx.fill();
            }
        } else {
            // Exotic - Swirls
             ctx.strokeStyle = 'rgba(255,255,255,0.15)';
             ctx.lineWidth = 2;
             for(let i=1; i<=3; i++) {
                 ctx.beginPath();
                 ctx.ellipse(p.x, p.y, p.radius*(i*0.3), p.radius*(i*0.2), i, 0, Math.PI*2);
                 ctx.stroke();
             }
        }
        
        // Reset transform from rotation
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        
        // Apply Shading Gradient
        ctx.fillStyle = shading;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius*2, p.radius*2);

        ctx.restore();

        // Completed checkmark
        if (p.completed) {
            ctx.strokeStyle = '#4ade80'; // bright green
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p.x - 6, p.y);
            ctx.lineTo(p.x - 2, p.y + 5);
            ctx.lineTo(p.x + 7, p.y - 6);
            ctx.stroke();
        }

        // Selection Ring
        if (isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            const rot = time * 0.002;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius + 6, rot, rot + Math.PI*2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Name Label
        ctx.fillStyle = isSelected ? '#fff' : '#94a3b8';
        ctx.font = isSelected ? 'bold 12px monospace' : '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y + p.radius + 18);
    });
}

// --- Terrain Drawing ---
export const drawTerrain = (ctx: CanvasRenderingContext2D, terrain: TerrainFeature[]) => {
    // Fill Background
    ctx.fillStyle = '#111827'; // Dark Gray Base
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    terrain.forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);
        if (t.rotation) ctx.rotate(t.rotation);

        if (t.type === 'DUST') {
            ctx.fillStyle = 'rgba(156, 163, 175, ' + (t.opacity || 0.2) + ')';
            ctx.beginPath();
            ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (t.type === 'ROCK') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            if (t.points) {
                ctx.moveTo(t.points[0].x + 3, t.points[0].y + 3);
                t.points.forEach(p => ctx.lineTo(p.x + 3, p.y + 3));
            } else {
                ctx.arc(3, 3, t.radius, 0, Math.PI*2);
            }
            ctx.fill();

            // Rock Body
            ctx.fillStyle = '#4B5563'; // Gray 600
            ctx.beginPath();
            if (t.points) {
                ctx.moveTo(t.points[0].x, t.points[0].y);
                t.points.forEach(p => ctx.lineTo(p.x, p.y));
            } else {
                ctx.arc(0, 0, t.radius, 0, Math.PI*2);
            }
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = '#6B7280'; // Gray 500
            ctx.beginPath();
             if (t.points) {
                // Simple highlight on one side
                ctx.arc(0, 0, t.radius * 0.5, 0, Math.PI*2);
            } else {
                ctx.arc(-t.radius*0.3, -t.radius*0.3, t.radius*0.4, 0, Math.PI*2);
            }
            ctx.fill();
        } 
        else if (t.type === 'CRATER') {
            // Crater Body (Dark)
            ctx.fillStyle = 'rgba(17, 24, 39, ' + (t.opacity || 0.5) + ')'; // Darker than bg
            ctx.beginPath();
            ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner Shadow (Top Left)
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius, Math.PI, Math.PI * 2.5); // Bottom Right Highlight logic inverted?
            // Actually let's just draw an inner circle slightly offset
            
            // Rim Highlight (Bottom Right)
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    });
}

export const drawToxicZones = (ctx: CanvasRenderingContext2D, zones: ToxicZone[], time: number) => {
    zones.forEach(zone => {
        ctx.save();
        ctx.translate(zone.x, zone.y);
        
        // Bubbling effect
        const scale = 1 + Math.sin(time * 0.005 + parseInt(zone.id)) * 0.05;
        
        // Base Puddle
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#7C3AED'; // Violet 600
        ctx.beginPath();
        ctx.arc(0, 0, zone.radius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Inner lighter puddle
        ctx.fillStyle = '#A78BFA'; // Violet 400
        ctx.beginPath();
        ctx.arc(0, 0, zone.radius * 0.7 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Bubbles
        const bubbleCount = 5;
        ctx.fillStyle = '#DDD6FE'; // Violet 200
        for (let i = 0; i < bubbleCount; i++) {
             const offset = (time * 0.002 + i) % 1;
             const r = zone.radius * 0.8 * Math.random();
             const theta = Math.random() * Math.PI * 2;
             const x = Math.cos(theta) * r;
             const y = Math.sin(theta) * r;
             const size = 3 + Math.sin(time * 0.01 + i) * 2;
             
             ctx.beginPath();
             ctx.arc(x, y, size, 0, Math.PI*2);
             ctx.fill();
        }
        
        ctx.restore();
    });
}

// --- Blood Stain Drawing ---
export const drawBloodStains = (ctx: CanvasRenderingContext2D, stains: BloodStain[]) => {
    stains.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        
        // Use global alpha for fade out.
        // If life is near max, it's 1. If near 0, it's 0.
        // Cap opacity to max 0.7 so it doesn't look like a solid wall
        const opacity = Math.min(0.7, s.life / 1000); 
        ctx.globalAlpha = opacity;
        
        ctx.fillStyle = s.color;

        // Draw the main blotches
        s.blotches.forEach(b => {
             ctx.beginPath();
             ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
             ctx.fill();
        });

        ctx.restore();
    });
};

// --- Player Drawing ---

export const drawPlayerSprite = (ctx: CanvasRenderingContext2D, p: Player, time: number, isMoving: boolean) => {
    // 1. Legs (Animate legs with sine wave if moving)
    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    
    ctx.fillStyle = '#111827'; // Dark boots
    ctx.beginPath(); ctx.ellipse(-5 + stride, -10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); // Left foot
    ctx.beginPath(); ctx.ellipse(-5 - stride, 10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); // Right foot

    // 2. Body/Armor
    ctx.fillStyle = '#1D4ED8'; // Blue 700 Armor
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI*2);
    ctx.fill();
    
    // Armor Plates
    ctx.fillStyle = '#1E3A8A'; // Blue 900
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI*2);
    ctx.fill();

    // 3. Shoulders
    ctx.fillStyle = '#1E3A8A'; // Blue 900
    ctx.beginPath(); ctx.ellipse(0, -11, 6, 8, 0, 0, Math.PI*2); ctx.fill(); // Left Shoulder
    ctx.beginPath(); ctx.ellipse(0, 11, 6, 8, 0, 0, Math.PI*2); ctx.fill(); // Right Shoulder

    // 4. Helmet/Head
    ctx.fillStyle = '#2563EB'; // Blue 600
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI*2);
    ctx.fill();
    
    // Visor
    ctx.fillStyle = '#93C5FD'; // Blue 300 Glow
    ctx.shadowColor = '#60A5FA';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(4, 0, 4, 7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 5. Weapon & Hands
    const currentWeaponType = p.loadout[p.currentWeaponIndex];
    const weaponState = p.weapons[currentWeaponType];
    
    // Simple recoil logic
    const isFiring = time - weaponState.lastFireTime < 50;
    const recoil = isFiring ? -2 : 0;

    ctx.save();
    ctx.translate(10 + recoil, 0); // Offset weapon forward
    
    // Draw Weapon based on type
    switch(currentWeaponType) {
        case WeaponType.AR: drawAR(ctx); break;
        case WeaponType.SG: drawSG(ctx); break;
        case WeaponType.SR: drawSR(ctx); break;
        case WeaponType.PISTOL: drawPistol(ctx); break;
        case WeaponType.FLAMETHROWER: drawFlamethrower(ctx); break;
        case WeaponType.PULSE_RIFLE: drawPulseRifle(ctx); break;
        case WeaponType.GRENADE_LAUNCHER: drawGL(ctx); break;
    }
    
    // Draw Hands relative to weapon position
    ctx.fillStyle = '#1F2937'; // Glove color
    if (currentWeaponType === WeaponType.PISTOL) {
         // Two hands close together
         ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill(); 
    } else {
         // Right hand (Trigger)
         ctx.beginPath(); ctx.arc(0, 5, 4, 0, Math.PI*2); ctx.fill(); 
         // Left hand (Foregrip)
         ctx.beginPath(); ctx.arc(15, -2, 4, 0, Math.PI*2); ctx.fill(); 
    }

    // Muzzle Flash
    if (isFiring && currentWeaponType !== WeaponType.FLAMETHROWER) {
        drawMuzzleFlash(ctx, currentWeaponType);
    }
    // Flamethrower has continuous particles, so no "flash" per se

    ctx.restore();
};

export const drawAllySprite = (ctx: CanvasRenderingContext2D, ally: Ally, time: number, isMoving: boolean) => {
    // Uses similar structure to player but different colors
    const stride = isMoving ? Math.sin(time * 0.015) * 4 : 0;
    
    // Legs
    ctx.fillStyle = '#1F2937'; // Dark boots
    ctx.beginPath(); ctx.ellipse(-5 + stride, -10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(-5 - stride, 10, 6, 4, 0, 0, Math.PI*2); ctx.fill(); 

    // Body/Armor
    ctx.fillStyle = '#60A5FA'; // Light Blue Armor
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI*2);
    ctx.fill();
    
    // Vest
    ctx.fillStyle = '#2563EB'; // Blue 600
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI*2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#93C5FD'; // Very light blue
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI*2);
    ctx.fill();
    
    // Visor
    ctx.fillStyle = '#1E40AF'; // Dark Blue Visor
    ctx.beginPath();
    ctx.ellipse(3, 0, 3, 6, 0, 0, Math.PI*2);
    ctx.fill();

    // Weapon (Generic Rifle)
    const isFiring = time - ally.lastFireTime < 50;
    const recoil = isFiring ? -2 : 0;

    ctx.save();
    ctx.translate(8 + recoil, 0);
    
    // Rifle Body
    ctx.fillStyle = '#374151';
    ctx.fillRect(-2, -3, 14, 6);
    // Barrel
    ctx.fillStyle = '#111827';
    ctx.fillRect(12, -2, 8, 4);

    // Hands
    ctx.fillStyle = '#1F2937';
    ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(10, -1, 3, 0, Math.PI*2); ctx.fill(); 

    if (isFiring) {
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(28, -4);
        ctx.lineTo(26, 0);
        ctx.lineTo(28, 4);
        ctx.fill();
    }
    
    ctx.restore();
};

export const drawTurret = (ctx: CanvasRenderingContext2D, t: Turret, time: number) => {
    ctx.save();
    ctx.translate(t.x, t.y);

    // 1. Base (Static)
    ctx.fillStyle = '#064E3B'; // Dark Green
    // Tripod legs
    for(let i=0; i<3; i++) {
        ctx.save();
        ctx.rotate(i * (Math.PI * 2 / 3));
        ctx.fillRect(5, -2, 12, 4);
        ctx.restore();
    }
    // Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI*2);
    ctx.fill();

    // 2. Head (Rotating)
    ctx.rotate(t.angle);

    const isFiring = time - t.lastFireTime < 60;
    const recoil = isFiring ? -3 : 0;
    const flash = isFiring;

    if (t.level === 1 || t.type === TurretType.GAUSS) {
        // Lv1 or Lv2 Gauss: Gatling
        ctx.save();
        ctx.translate(recoil, 0);
        
        // Gun Body
        ctx.fillStyle = t.type === TurretType.GAUSS ? '#047857' : '#059669'; // Darker for Lv2
        ctx.fillRect(-8, -8, 16, 16);
        
        // Rotating Barrels
        const spin = isFiring ? time * 0.5 : 0;
        ctx.fillStyle = '#374151'; // Dark Metal
        // Draw 3 barrels revolving
        for(let i=0; i<3; i++) {
            const yOff = Math.sin(spin + i*2) * 3;
            ctx.fillRect(8, yOff-1.5, 14, 3);
        }

        // Ammo Box on side
        ctx.fillStyle = '#065F46';
        ctx.fillRect(-8, -12, 10, 4);

        if (flash) {
            ctx.fillStyle = '#FEF9C3';
            ctx.beginPath();
            ctx.arc(25, 0, 8 + Math.random()*4, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();

    } else if (t.type === TurretType.SNIPER) {
        // Lv2 Sniper: Very long single barrel
        ctx.save();
        ctx.translate(recoil, 0);

        ctx.fillStyle = '#111827';
        ctx.fillRect(-6, -6, 12, 12);
        
        // Long Barrel
        ctx.fillStyle = '#374151';
        ctx.fillRect(6, -2, 35, 4);
        
        // Muzzle Brake
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(41, -3, 6, 6);

        // Scope
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -8, 10, 3);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-2, -8, 2, 3);

        if (flash) {
             ctx.strokeStyle = '#FEF08A';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(47, 0);
             ctx.lineTo(80, 0);
             ctx.stroke();
        }

        ctx.restore();

    } else if (t.type === TurretType.MISSILE) {
        // Lv2 Missile: VLS Box
        ctx.save();
        // No recoil animation for VLS box itself usually, maybe slight shake
        
        // Launcher Box
        ctx.fillStyle = '#1F2937'; // Dark Gray
        ctx.fillRect(-10, -10, 20, 20);
        
        // Missile Tubes (4x)
        ctx.fillStyle = '#374151';
        ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-5, 5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 5, 3, 0, Math.PI*2); ctx.fill();

        // Radar Dish on top
        const spin = time * 0.005;
        ctx.save();
        ctx.translate(-8, 0);
        ctx.rotate(spin);
        ctx.fillStyle = '#6B7280';
        ctx.fillRect(-2, -6, 4, 12); // Dish bar
        ctx.restore();

        if (flash) {
            // Launch smoke puff
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, 10 + Math.random()*5, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    } else {
        // Default Fallback (Lv2 Standard logic if any)
        ctx.fillStyle = 'white';
        ctx.fillRect(-5,-5,10,10);
    }

    // Health Bar (Floating above turret)
    // Counter rotate to keep horizontal relative to screen
    ctx.rotate(-t.angle);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-15, -25, 30, 4);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(-15, -25, 30 * (t.hp/t.maxHp), 4);

    ctx.restore();
};

export const drawAR = (ctx: CanvasRenderingContext2D) => {
    // Stock
    ctx.fillStyle = '#374151';
    ctx.fillRect(-10, -3, 8, 6);
    // Body
    ctx.fillStyle = '#1F2937'; // Dark Metal
    ctx.fillRect(-2, -4, 16, 8);
    // Barrel
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(14, -2, 12, 4);
    // Magazine
    ctx.fillStyle = '#111827';
    ctx.fillRect(4, 2, 4, 8);
    // Sights
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(2, -6, 2, 2); // Rear
    ctx.fillRect(24, -5, 1, 3); // Front
};

export const drawSG = (ctx: CanvasRenderingContext2D) => {
    // Stock
    ctx.fillStyle = '#374151';
    ctx.fillRect(-10, -3, 6, 6);
    // Body
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-4, -4, 14, 8);
    // Barrel (Thick)
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(10, -3, 16, 6);
    // Pump
    ctx.fillStyle = '#111827';
    ctx.fillRect(14, 1, 8, 4);
};

export const drawSR = (ctx: CanvasRenderingContext2D) => {
     // Stock
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(-12, -3, 10, 6);
    // Body
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-2, -4, 14, 8);
    // Barrel (Long)
    ctx.fillStyle = '#374151';
    ctx.fillRect(12, -2, 30, 4);
    // Scope
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, -7, 12, 3);
    // Scope Lens
    ctx.fillStyle = '#EF4444'; // Red glint
    ctx.fillRect(0, -7, 2, 3);
};

export const drawPistol = (ctx: CanvasRenderingContext2D) => {
    // Body
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(5, -3, 10, 6);
    // Slide
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(5, -4, 10, 2);
};

export const drawFlamethrower = (ctx: CanvasRenderingContext2D) => {
    // Tanks
    ctx.fillStyle = '#C2410C'; // Red/Orange tanks
    ctx.beginPath(); ctx.arc(-5, -6, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5, 6, 4, 0, Math.PI*2); ctx.fill();
    // Body
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(0, -4, 18, 8);
    // Nozzle
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(18, -3, 6, 6);
    // Pilot Light
    ctx.fillStyle = '#3B82F6'; // Blue flame
    ctx.beginPath(); ctx.arc(24, 1, 2, 0, Math.PI*2); ctx.fill();
};

export const drawPulseRifle = (ctx: CanvasRenderingContext2D) => {
    // Sci-fi white/cyan aesthetic
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(-5, -4, 20, 8);
    // Glow strips
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(0, -2, 18, 1);
    ctx.fillRect(0, 1, 18, 1);
    // Emitter
    ctx.fillStyle = '#0E7490';
    ctx.fillRect(15, -3, 4, 6);
};

export const drawGL = (ctx: CanvasRenderingContext2D) => {
    // Bulky revolving drum
    ctx.fillStyle = '#374151';
    ctx.beginPath(); ctx.arc(5, 0, 7, 0, Math.PI*2); ctx.fill();
    // Stock
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-10, -4, 10, 8);
    // Barrel (Large bore)
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(10, -5, 12, 10);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(22, 0, 2, 5, 0, 0, Math.PI*2); ctx.fill();
};

export const drawMuzzleFlash = (ctx: CanvasRenderingContext2D, type: WeaponType) => {
    ctx.fillStyle = '#FEF08A'; // Yellow light
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 10;
    
    let xOffset = 26;
    if (type === WeaponType.SR) xOffset = 42;
    if (type === WeaponType.PISTOL) xOffset = 15;
    if (type === WeaponType.PULSE_RIFLE) {
        ctx.fillStyle = '#67E8F9'; // Cyan light
        ctx.shadowColor = '#06B6D4';
    }
    
    ctx.beginPath();
    // Star shape / erratic
    const size = type === WeaponType.SG ? 12 : 8;
    ctx.moveTo(xOffset, 0);
    ctx.lineTo(xOffset + size, -size/2);
    ctx.lineTo(xOffset + size*0.8, 0);
    ctx.lineTo(xOffset + size, size/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
};

// --- Enemy Drawing Functions ---
export const drawGrunt = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    const wiggle = Math.sin(time * 0.02) * 3;
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r, -r + wiggle); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r, r + wiggle); ctx.stroke();
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EF4444'; 
    ctx.beginPath();
    ctx.ellipse(-r*0.2, 0, r*0.6, r*0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.moveTo(r*0.5, -r*0.3); ctx.lineTo(r*1.2, -r*0.1); ctx.lineTo(r*0.8, 0);
    ctx.moveTo(r*0.5, r*0.3); ctx.lineTo(r*1.2, r*0.1); ctx.lineTo(r*0.8, 0);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(r*0.5, -r*0.2, 2, 0, Math.PI*2);
    ctx.arc(r*0.5, r*0.2, 2, 0, Math.PI*2);
    ctx.fill();
};

export const drawRusher = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    ctx.strokeStyle = '#D97706'; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r, -r*0.5); ctx.lineTo(-r*1.5, -r); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r, r*0.5); ctx.lineTo(-r*1.5, r); ctx.stroke();
    ctx.fillStyle = '#F59E0B'; 
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r, -r*0.6);
    ctx.lineTo(-r*0.8, 0);
    ctx.lineTo(-r, r*0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FEF3C7'; 
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r*0.4);
    ctx.bezierCurveTo(r, -r, r*1.5, -r, r*1.8, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r*0.4);
    ctx.bezierCurveTo(r, r, r*1.5, r, r*1.8, 0);
    ctx.stroke();
};

export const drawTank = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    ctx.fillStyle = '#111827';
    const legOffset = Math.sin(time * 0.005) * 2;
    ctx.beginPath(); ctx.arc(-r*0.5, -r+legOffset, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.5, -r-legOffset, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r*0.5, r+legOffset, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.5, r-legOffset, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.moveTo(r*0.8, -r*0.6);
    ctx.lineTo(r*0.8, r*0.6);
    ctx.lineTo(-r*0.8, r*0.9);
    ctx.lineTo(-r, 0);
    ctx.lineTo(-r*0.8, -r*0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#374151'; 
    ctx.beginPath();
    ctx.arc(-r*0.2, 0, r*0.6, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#4B5563'; 
    ctx.beginPath();
    ctx.arc(r*0.3, 0, r*0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#9CA3AF';
    ctx.beginPath();
    ctx.moveTo(r*0.8, -r*0.3); ctx.lineTo(r*1.2, -r*0.5); ctx.lineTo(r*0.9, -r*0.1);
    ctx.moveTo(r*0.8, r*0.3); ctx.lineTo(r*1.2, r*0.5); ctx.lineTo(r*0.9, r*0.1);
    ctx.fill();
};

export const drawKamikaze = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    const pulse = Math.abs(Math.sin(time * 0.01)); 
    const grad = ctx.createRadialGradient(-r*0.5, 0, 2, -r*0.5, 0, r);
    grad.addColorStop(0, '#E879F9');
    grad.addColorStop(1, '#6B21A8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(-r*0.3, 0, r*0.9 + pulse*2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#A855F7';
    ctx.beginPath();
    ctx.arc(-r*0.5, -r*0.4, 3, 0, Math.PI*2);
    ctx.arc(-r*0.1, r*0.3, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#4C1D95'; 
    ctx.beginPath();
    ctx.arc(r*0.6, 0, r*0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#4C1D95';
    ctx.lineWidth = 1;
    for(let i=0; i<4; i++) {
        const offset = (i % 2 === 0 ? 1 : -1) * (r*0.8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.random()*4, offset);
        ctx.stroke();
    }
};

export const drawViper = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    const wingFlap = Math.sin(time * 0.015) * 0.5;
    ctx.fillStyle = '#065F46'; 
    ctx.beginPath();
    ctx.moveTo(-r*0.5, 0);
    ctx.quadraticCurveTo(0, -r*2 + wingFlap*10, r*0.5, -r*0.5);
    ctx.lineTo(0, 0);
    ctx.moveTo(-r*0.5, 0);
    ctx.quadraticCurveTo(0, r*2 - wingFlap*10, r*0.5, r*0.5);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.fillStyle = '#10B981'; 
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r*0.3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#047857'; 
    ctx.beginPath();
    ctx.moveTo(r*0.5, 0);
    ctx.lineTo(r*0.2, -r*0.5);
    ctx.lineTo(r*1.2, 0); 
    ctx.lineTo(r*0.2, r*0.5);
    ctx.fill();
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(r*1.1, 0, 2, 0, Math.PI*2);
    ctx.fill();
};

export const drawBossRed = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    ctx.fillStyle = '#7F1D1D'; 
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#B91C1C';
    for(let i=0; i<8; i++) {
        const angle = i * (Math.PI*2/8);
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(r, -5);
        ctx.lineTo(r+10, 0);
        ctx.lineTo(r, 5);
        ctx.fill();
        ctx.restore();
    }
    const bite = Math.sin(time * 0.01) * 5;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(r*0.3, 0, r*0.5, r*0.4 - Math.abs(bite), 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(r*0.5, -r*0.3); ctx.lineTo(r*0.6, -r*0.1); ctx.lineTo(r*0.4, -r*0.1);
    ctx.moveTo(r*0.5, r*0.3); ctx.lineTo(r*0.6, r*0.1); ctx.lineTo(r*0.4, r*0.1);
    ctx.fill();
};

export const drawBossBlue = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    ctx.fillStyle = '#172554'; 
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r*0.5, -r);
    ctx.lineTo(-r, 0);
    ctx.lineTo(-r*0.5, r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3B82F6'; 
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r*0.2, -r*0.8); ctx.lineTo(r*0.5, 0); ctx.lineTo(-r*0.2, r*0.8);
    ctx.stroke();
    ctx.fillStyle = '#60A5FA'; 
    ctx.beginPath(); ctx.arc(r*0.6, -r*0.3, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.6, r*0.3, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.8, 0, 5, 0, Math.PI*2); ctx.fill();
};

export const drawBossPurple = (ctx: CanvasRenderingContext2D, e: Enemy, time: number) => {
    const r = e.radius;
    const wobble = Math.sin(time * 0.005) * 2;
    ctx.fillStyle = '#581C87'; 
    ctx.beginPath();
    ctx.ellipse(0, 0, r + wobble, r - wobble, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#A855F7'; 
    ctx.beginPath(); ctx.arc(-r*0.4, -r*0.4, r*0.25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.2, r*0.3, r*0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r*0.2, r*0.1, r*0.15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#E879F9'; 
    ctx.globalAlpha = 0.6 + Math.sin(time * 0.01)*0.2;
    ctx.beginPath();
    ctx.arc(0, 0, r*0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
};

export default GameCanvas;
