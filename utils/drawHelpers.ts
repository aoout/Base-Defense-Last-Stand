
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

// --- ADVANCED BIOLOGICAL HELPERS ---

/**
 * Draws a standardized insectoid leg.
 * Automatically handles the joint (knee) calculation.
 */
export const drawBioLeg = (
    ctx: CanvasRenderingContext2D, 
    start: {x: number, y: number}, 
    end: {x: number, y: number}, 
    options: {
        color: string,
        width: number,
        kneeOffset: number, // Perpendicular distance for knee
        jointColor?: string, // Optional color for knee joint
        segments?: boolean // If true, draws straight lines (insect) instead of curve (tentacle)
    }
) => {
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Calculate Midpoint
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate Perpendicular Vector for Knee
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    // Normal vector (-dy, dx) rotates 90deg CCW
    const nx = -dy / len;
    const ny = dx / len;

    // Knee Position
    const kneeX = midX + nx * options.kneeOffset;
    const kneeY = midY + ny * options.kneeOffset;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    
    if (options.segments) {
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(end.x, end.y);
    } else {
        ctx.quadraticCurveTo(kneeX, kneeY, end.x, end.y);
    }
    ctx.stroke();

    // Draw Joint detail if requested
    if (options.jointColor) {
        ctx.fillStyle = options.jointColor;
        let jx, jy;
        
        if (options.segments) {
            jx = kneeX;
            jy = kneeY;
        } else {
            // Approximation of knee t=0.5 on quadratic curve
            const t = 0.5;
            jx = (1-t)*(1-t)*start.x + 2*(1-t)*t*kneeX + t*t*end.x;
            jy = (1-t)*(1-t)*start.y + 2*(1-t)*t*kneeY + t*t*end.y;
        }
        
        ctx.beginPath();
        ctx.arc(jx, jy, options.width * 0.5, 0, Math.PI*2);
        ctx.fill();
    }
};

/**
 * Draws a standard segmented carapace/shell body.
 */
export const drawCarapaceBody = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, height: number,
    colors: { main: string, highlight?: string, stroke?: string }
) => {
    ctx.fillStyle = colors.main;
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();

    if (colors.stroke) {
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    if (colors.highlight) {
        ctx.fillStyle = colors.highlight;
        ctx.beginPath();
        ctx.ellipse(x - width * 0.3, y - height * 0.2, width * 0.2, height * 0.15, -0.2, 0, Math.PI*2);
        ctx.fill();
    }
}

// Keep legacy for backward compat if needed, but alias to new logic where possible
export const drawSmoothLeg = (ctx: CanvasRenderingContext2D, start: {x: number, y: number}, end: {x: number, y: number}, kneeOffset: {x: number, y: number}, color: string, width: number) => {
    const scalar = Math.sqrt(kneeOffset.x**2 + kneeOffset.y**2) * (kneeOffset.y < 0 ? -1 : 1);
    drawBioLeg(ctx, start, end, { color, width, kneeOffset: scalar });
};

// --- OPTIMIZATION: SPRITE CACHE SYSTEM ---

const spriteCache: Record<string, HTMLCanvasElement> = {};

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

export const isVisible = (x: number, y: number, radius: number, camera: {x: number, y: number}) => {
    const margin = radius + 50; 
    return (
        x + margin > camera.x &&
        x - margin < camera.x + CANVAS_WIDTH &&
        y + margin > camera.y &&
        y - margin < camera.y + CANVAS_HEIGHT
    );
};
