
import React, { useRef, useEffect } from 'react';
import { FAMOUS_SECTORS } from '../../../data/sectors';
import { BIOME_STYLES } from '../../../data/world';
import { BiomeType, PlanetVisualType } from '../../../types';
import { getColorHex } from '../../../data/config/galaxyPresets';

interface SectorRadarProps {
    mode: 'PROTOCOLS' | 'ARCHIVES';
    color: string; // 'cyan', 'red', etc.
    sectorId?: string;
}

export const SectorRadar: React.FC<SectorRadarProps> = ({ mode, color, sectorId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Convert named color (e.g. 'cyan') to hex for Canvas API
    const hexColor = getColorHex(color);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            time++;
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // --- 1. Draw Background Grid ---
            ctx.strokeStyle = `${hexColor}22`; // Very transparent
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Polar Rings
            for(let r=50; r<w/2; r+=50) {
                ctx.arc(cx, cy, r, 0, Math.PI*2);
            }
            // Radial Spokes
            for(let i=0; i<8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle)*w, cy + Math.sin(angle)*w);
            }
            ctx.stroke();

            // --- 2. Render Specific Mode ---
            if (mode === 'PROTOCOLS') {
                renderProtocolsMode(ctx, cx, cy, w, hexColor, time);
            } else if (mode === 'ARCHIVES' && sectorId) {
                renderArchivesMode(ctx, cx, cy, w, hexColor, sectorId, time);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [mode, hexColor, sectorId]);

    const renderProtocolsMode = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, color: string, time: number) => {
        // Scanning Pulse
        const scanRadius = (time * 2) % (w/2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, scanRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating Radar Sweep
        const angle = (time * 0.02) % (Math.PI * 2);
        const gradient = ctx.createConicGradient(angle, cx, cy);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.75, 'transparent');
        gradient.addColorStop(1, `${color}66`); // 40% opacity tail
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, w/2, 0, Math.PI * 2);
        ctx.fill();

        // Scanner Line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * (w/2), cy + Math.sin(angle) * (w/2));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Random Blips (Noise)
        if (time % 20 === 0 || Math.random() > 0.9) {
            const bx = cx + (Math.random()-0.5) * w * 0.6;
            const by = cy + (Math.random()-0.5) * w * 0.6;
            ctx.fillStyle = '#fff';
            ctx.fillRect(bx, by, 2, 2);
        }
    };

    const renderArchivesMode = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, color: string, id: string, time: number) => {
        const sector = FAMOUS_SECTORS.find(s => s.id === id);
        if (!sector) return;

        // --- DYNAMIC SCALING (ZOOM TO FIT) ---
        // Calculate the raw extent of the solar system (distance to furthest planet)
        const planetCount = sector.planets.length;
        const baseRadius = 40;
        const spacing = 18;
        const lastPlanetIndex = Math.max(0, planetCount - 1);
        const rawExtent = baseRadius + (lastPlanetIndex * spacing) + 12; // +12 buffer for visual radius
        
        // Define the visual boundary (leave some padding)
        const maxAvailableRadius = (w / 2) - 25; 
        
        // Calculate scale factor to make the system fill the view
        let scale = maxAvailableRadius / rawExtent;
        
        // Clamp scale to reasonable limits
        // Lower bound 0.5: Prevent huge systems from shrinking to invisibility (though unlikely with spacing)
        // Upper bound 1.4: Prevent single-planet systems from looking absurdly zoomed in
        scale = Math.max(0.5, Math.min(scale, 1.4));

        // Central Star
        // Scale the star slightly less aggressively so it doesn't dominate small systems
        const starSize = 8 * Math.pow(scale, 0.7); 
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, cy, starSize, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(cx, cy, starSize * 0.6, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Orbiting Planets
        sector.planets.forEach((p, idx) => {
            // Apply zoom scale to orbit distance
            const orbitRadius = (baseRadius + (idx * spacing)) * scale; 
            
            const speed = 0.005 / (idx * 0.5 + 1);
            const angle = time * speed + (idx * 2);
            
            const px = cx + Math.cos(angle) * orbitRadius;
            const py = cy + Math.sin(angle) * orbitRadius;

            // Orbit Path
            ctx.strokeStyle = `${color}22`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, orbitRadius, 0, Math.PI*2); ctx.stroke();

            // Planet Body
            const biomeStyle = BIOME_STYLES[p.biome || BiomeType.BARREN];
            ctx.fillStyle = biomeStyle.planetColor;
            
            // Scale planet size
            let r = p.visualType === PlanetVisualType.GAS_GIANT ? 5 : 2.5;
            // Also apply some scaling to planet bodies, but softer power curve
            r = r * Math.pow(scale, 0.8); 
            r = Math.max(1.5, r); // Ensure minimum visibility

            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
            
            // Ring
            if (p.visualType === PlanetVisualType.RINGED) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 1 * Math.pow(scale, 0.5);
                ctx.beginPath(); ctx.ellipse(px, py, r * 2.2, r * 0.6, angle, 0, Math.PI*2); ctx.stroke();
            }
        });
    };

    return (
        <canvas ref={canvasRef} width={400} height={400} className="w-full h-full object-contain" />
    );
};
