
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export const pRand = (seed: number) => {
    return Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
};

// --- SEMANTIC PRIMITIVES ---

export const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
};

export const drawStrokeCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
};

export const drawEllipse = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
};

export const drawPolygon = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
    }
    ctx.closePath();
    ctx.fill();
};

export const drawSmoothLeg = (ctx: CanvasRenderingContext2D, start: {x: number, y: number}, end: {x: number, y: number}, kneeOffset: {x: number, y: number}, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    // Calculate knee position (midpoint + offset)
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const kneeX = midX + kneeOffset.x;
    const kneeY = midY + kneeOffset.y;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(kneeX, kneeY, end.x, end.y);
    ctx.stroke();
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
