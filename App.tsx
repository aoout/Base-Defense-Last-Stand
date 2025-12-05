
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

    const handleInteraction = () => {
        // Resume Audio Context on first interaction
        engine.audio.resume();
        // Remove listener after success
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    }

    // New: Handle Custom Game Actions (e.g., from UI modules)
    const handleGameAction = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.type === 'EQUIP_MODULE') {
            engine.eventBus.emit(GameEventType.SHOP_EQUIP_MODULE, { target: detail.target, moduleId: detail.modId });
        }
        if (detail.type === 'UNEQUIP_MODULE') {
            engine.eventBus.emit(GameEventType.SHOP_UNEQUIP_MODULE, { target: detail.target, moduleId: detail.modId });
        }
        if (detail.type === 'SCAN_SECTOR') {
            engine.galaxyManager.scanSector(detail.config);
        }
    };

    // React to Engine UI Updates
    const handleUIUpdate = () => {
        // Force a re-render with fresh state
        setGameState({ ...engine.state });
    };

    engine.eventBus.on(GameEventType.UI_UPDATE, handleUIUpdate);

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('game-action', handleGameAction);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent tab from changing focus
      if (e.key === 'Tab') {
          e.preventDefault();
      }

      // Input only active in gameplay or specific menus
      // NOTE: Using e.code for physical key mapping (e.g. "KeyW" instead of "w")
      engine.handleInput(e.code, true);
      
      // Prevent browser zoom etc
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
          // e.preventDefault(); // Sometimes needed
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleInput(e.code, false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.querySelector('canvas')?.getBoundingClientRect();
      if (rect) {
        engine.inputManager.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
      }
    };

    const handleMouseDown = (e: MouseEvent) => { 
        // Only trigger game inputs if interacting with the Canvas directly
        // This prevents UI clicks (e.g. Planet Panel) from selecting planets behind them
        const target = e.target as HTMLElement;
        const isCanvas = target.tagName === 'CANVAS';

        if (isCanvas) {
            engine.inputManager.handleMouseDown(e.button);
            
            // Map Click Logic needs engine state, can be moved to input manager later or kept here for now
            // But since we are cleaning up, let's keep it minimal
            if (e.button === 0 && engine.state.appMode === 'EXPLORATION_MAP') {
                 // Logic remains in App for now as it depends on DOM rect
                 const rect = document.querySelector('canvas')?.getBoundingClientRect();
                 if (rect) {
                     const mx = e.clientX - rect.left;
                     const my = e.clientY - rect.top;
                     
                     let clickedPlanetId = null;
                     engine.state.planets.forEach(p => {
                         const dist = Math.sqrt(Math.pow(mx - p.x, 2) + Math.pow(my - p.y, 2));
                         if (dist < p.radius + 10) {
                             clickedPlanetId = p.id;
                         }
                     });
                     
                     if (clickedPlanetId) {
                         engine.selectPlanet(clickedPlanetId);
                     }
                 }
            }
        }
    };
    const handleMouseUp = (e: MouseEvent) => { 
        engine.inputManager.handleMouseUp(e.button);
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    // Initial sync
    handleUIUpdate();

    return () => {
      engine.eventBus.off(GameEventType.UI_UPDATE, handleUIUpdate);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('game-action', handleGameAction);
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
