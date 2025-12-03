
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export const pRand = (seed: number) => {
    return Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
};

// --- OPTIMIZATION: SPRITE CACHE SYSTEM ---

const spriteCache: Record<string, HTMLCanvasElement> = {};

/**
 * Generates or retrieves a cached canvas sprite for a particle/bullet.
 * Creates a glowing radial gradient circle.
 */
export const getSprite = (color: string, size: number = 16): HTMLCanvasElement => {
    const key = `${color}-${size}`;
    if (spriteCache[key]) return spriteCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const center = size / 2;
    const radius = size / 2;

    const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    grad.addColorStop(0, '#ffffff'); // Hot center
    grad.addColorStop(0.4, color);   // Main color
    grad.addColorStop(1, 'rgba(0,0,0,0)'); // Fade out

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    spriteCache[key] = canvas;
    return canvas;
};

// --- OPTIMIZATION HELPERS ---

// View Frustum Culling
export const isVisible = (x: number, y: number, radius: number, camera: {x: number, y: number}) => {
    // Add a margin to avoid popping artifacts
    const margin = radius + 50; 
    return (
        x + margin > camera.x &&
        x - margin < camera.x + CANVAS_WIDTH &&
        y + margin > camera.y &&
        y - margin < camera.y + CANVAS_HEIGHT
    );
};
