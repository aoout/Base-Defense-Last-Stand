
import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/gameService';
import { RenderService } from '../services/RenderService';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface GameCanvasProps {
  engine: GameEngine;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const rendererRef = useRef<RenderService>(new RenderService());

  const render = (time: number) => {
    // Update Game Logic
    engine.update(time);
    
    // Delegate Rendering
    rendererRef.current.render(engine.state, engine.inputManager, time);

    requestRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    if (canvasRef.current) {
        rendererRef.current.setCanvas(canvasRef.current);
    }
    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use current resolution scale to set attribute size, 
  // ensuring the internal buffer matches the requested resolution
  const resScale = engine.state.settings.resolutionScale || 1.0;

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH * resScale}
      height={CANVAS_HEIGHT * resScale}
      style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`
      }}
      className="border border-gray-700 shadow-2xl bg-gray-900 cursor-crosshair mx-auto block"
    />
  );
};

export default React.memo(GameCanvas);
