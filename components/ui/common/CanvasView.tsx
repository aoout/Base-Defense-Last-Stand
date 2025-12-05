
import React, { useRef, useEffect } from 'react';

interface CanvasViewProps {
    draw: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;
    width: number;
    height: number;
    className?: string;
    paused?: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ draw, width, height, className, paused }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const drawRef = useRef(draw);

    // Keep the latest draw function available to the loop without restarting it
    useEffect(() => {
        drawRef.current = draw;
    }, [draw]);

    useEffect(() => {
        const render = (time: number) => {
            if (paused || !canvasRef.current) return;
            
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Auto-clear
            ctx.clearRect(0, 0, width, height);
            
            // Execute draw callback
            drawRef.current(ctx, time, width, height);

            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(requestRef.current);
    }, [width, height, paused]);

    return (
        <canvas 
            ref={canvasRef} 
            width={width} 
            height={height} 
            className={className} 
        />
    );
};
