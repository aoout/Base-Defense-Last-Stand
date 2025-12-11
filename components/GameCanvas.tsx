
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../services/gameService';
import { RenderService } from '../services/RenderService';

interface GameCanvasProps {
  engine: GameEngine;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const rendererRef = useRef<RenderService>(new RenderService());
  
  // Track window dimensions state
  const [dimensions, setDimensions] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 1200,
      height: typeof window !== 'undefined' ? window.innerHeight : 900
  });

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setDimensions({ width: w, height: h });
          engine.resize(w, h);
      };

      window.addEventListener('resize', handleResize);
      // Initial sync
      handleResize();

      return () => window.removeEventListener('resize', handleResize);
  }, [engine]);

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
      width={dimensions.width * resScale}
      height={dimensions.height * resScale}
      style={{
          width: '100%',
          height: '100%',
          display: 'block'
      }}
      className="bg-gray-900 cursor-crosshair block"
    />
  );
};

export default React.memo(GameCanvas);
