
import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/gameService';
import { GameState, GameEventType } from './types';
import { GameProvider } from './components/contexts/GameContext';

const App: React.FC = () => {
  // We use state only for the UI overlay.
  // Game logic updates are decoupled from React renders.
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);

  useEffect(() => {
    const engine = engineRef.current;

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
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center overflow-hidden">
      <GameCanvas engine={engineRef.current} />
      <GameProvider engine={engineRef.current} state={gameState}>
        <UIOverlay />
      </GameProvider>
    </div>
  );
};

export default App;
