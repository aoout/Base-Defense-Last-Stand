
import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/gameService';
import { GameState, GameEventType } from './types';
import { GameProvider } from './components/contexts/GameContext';

const App: React.FC = () => {
  // Lazy initialization ensures GameEngine constructor (and its AudioContext) 
  // runs exactly once, preventing ghost audio tracks.
  const engineRef = useRef<GameEngine | null>(null);
  
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Use a safe reference for the effect closure
  const engine = engineRef.current;
  const [gameState, setGameState] = useState<GameState>(engine.state);

  useEffect(() => {
    // React to Engine UI Updates
    const handleUIUpdate = () => {
        // Force a re-render with fresh state
        setGameState({ ...engine.state });
    };

    engine.eventBus.on(GameEventType.UI_UPDATE, handleUIUpdate);

    // Initial sync
    handleUIUpdate();

    return () => {
      engine.eventBus.off(GameEventType.UI_UPDATE, handleUIUpdate);
    };
  }, [engine]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* LAYER 0: Game Canvas (Background) */}
      <div className="absolute inset-0 z-0">
        <GameCanvas engine={engine} />
      </div>

      {/* LAYER 1: UI Overlay (Foreground) */}
      {/* pointer-events-none ensures clicks pass through empty areas to the canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <GameProvider engine={engine} state={gameState}>
          <UIOverlay />
        </GameProvider>
      </div>
    </div>
  );
};

export default App;
