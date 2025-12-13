
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
    // PERFORMANCE FIX: Only trigger React Re-renders for structural UI changes.
    // Transient data (HP, Ammo, Score) is handled by components reading refs directly via useGameLoop.
    const handleUIUpdate = (e: any) => {
        const structuralReasons = [
            'MODE_SWITCH', 
            'RETURN_MAIN_MENU', 
            'RESET', 
            'PAUSE_TOGGLE',
            // Menus
            'SHOP_OPEN', 
            'SHOP_CLOSE', 
            'INVENTORY_TOGGLE', 
            'TACTICAL_TOGGLE',
            'TURRET_MENU_OPEN',
            'CLOSE_MENU',
            // Game State
            'GAME_OVER',
            'MISSION_COMPLETE',
            'DEPLOY',
            'ASCEND',
            'EVAC',
            'YIELD_REPORT',
            // Settings/Events
            'SETTING_CHANGE',
            'SECTOR_SCAN',
            'HEROIC_GEN',
            // Inventory & Loadout (CRITICAL FIX: These change Icons/Layout, so they need React Render)
            'WEAPON_SWITCH',
            'LOADOUT_SWAP',
            'EQUIP_MODULE',
            'UNEQUIP_MODULE',
            'TRANSACTION', // For shop balance updates that might enable/disable buttons
            'TURRET_BUILD' // To remove the "Build" prompt and show the turret UI
        ];

        if (!e.reason || structuralReasons.includes(e.reason)) {
            // Force a re-render with fresh state shallow copy
            setGameState({ ...engine.state });
        }
    };

    engine.eventBus.on(GameEventType.UI_UPDATE, handleUIUpdate);

    // Initial sync
    setGameState({ ...engine.state });

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
