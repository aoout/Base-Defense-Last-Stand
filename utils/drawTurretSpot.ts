
// This logic was previously inside renderers/drawEnvironment.ts, ensuring drawTurretSpot is available if split
import { TurretSpot } from '../types';
import { drawCircle, drawStrokeCircle } from './drawHelpers';

export const drawTurretSpot = (ctx: CanvasRenderingContext2D, spot: TurretSpot, time: number) => {
    drawCircle(ctx, spot.x, spot.y, 15, 'rgba(255, 255, 255, 0.1)');
    drawStrokeCircle(ctx, spot.x, spot.y, 15, 'rgba(255,255,255,0.3)');
    
    const pulse = (Math.sin(time * 0.005) + 1) * 0.5;
    drawCircle(ctx, spot.x, spot.y, 10, `rgba(16, 185, 129, ${pulse * 0.3})`);
}
