


import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/gameService';
import { GameState, AllyOrder, TurretType } from './types';

const App: React.FC = () => {
  // We use a ref for the engine so it persists across renders without triggering them
  const engineRef = useRef<GameEngine>(new GameEngine());
  
  // We use state only for the UI overlay to update at 60fps (or less if we throttle)
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

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.input.keys[e.key] = true;
      
      // Tactical Menu (Tab)
      if (e.key === 'Tab') {
          e.preventDefault(); // Prevent focus change
          if (!engine.state.isPaused && !engine.state.isShopOpen && !engine.state.isInventoryOpen) {
              engine.toggleTacticalMenu();
          }
      }

      // Tactical Commands Hotkeys (When menu is open)
      if (engine.state.isTacticalMenuOpen) {
          if (e.key === 'F1') {
              e.preventDefault();
              engine.issueOrder('PATROL');
              engine.toggleTacticalMenu(); // Auto close
          }
          if (e.key === 'F2') {
              e.preventDefault();
              engine.issueOrder('FOLLOW');
              engine.toggleTacticalMenu();
          }
          if (e.key === 'F3') {
              e.preventDefault();
              engine.issueOrder('ATTACK');
              engine.toggleTacticalMenu();
          }
      }

      // Inventory / Backpack (C)
      if ((e.key === 'c' || e.key === 'C')) {
          if (!engine.state.isPaused && !engine.state.isTacticalMenuOpen && !engine.state.isShopOpen) {
              engine.toggleInventory();
          }
      }

      // Shop (B)
      if ((e.key === 'b' || e.key === 'B')) {
          if (!engine.state.isPaused && !engine.state.isTacticalMenuOpen && !engine.state.isInventoryOpen) {
              const p = engine.state.player;
              const dist = Math.sqrt(Math.pow(p.x - engine.state.base.x, 2) + Math.pow(p.y - engine.state.base.y, 2));
              
              // Only open if near base, or if already open (to close it)
              if (dist < 300 || engine.state.isShopOpen) {
                  engine.state.isShopOpen = !engine.state.isShopOpen;
              }
          }
      }

      // Interact (E)
      if ((e.key === 'e' || e.key === 'E')) {
          // Interact handles both Shop (if open? no shop is separate) and Turrets
          if (!engine.state.isPaused && !engine.state.isTacticalMenuOpen && !engine.state.isInventoryOpen && !engine.state.isShopOpen) {
              engine.interact();
          }
      }
      
      // Toggle Pause (Stats Terminal)
      if (e.key === 'p' || e.key === 'P') {
          if (!engine.state.isTacticalMenuOpen && !engine.state.isInventoryOpen && engine.state.activeTurretId === undefined) {
              engine.togglePause();
          }
      }

      if (e.key === 'Escape') {
          engine.state.isShopOpen = false;
          if (engine.state.isTacticalMenuOpen) engine.toggleTacticalMenu();
          if (engine.state.isInventoryOpen) engine.toggleInventory();
          if (engine.state.activeTurretId !== undefined) engine.closeTurretUpgrade(); // Close upgrade
          if (engine.state.isPaused && engine.state.activeTurretId === undefined) engine.togglePause();
      }

      // Grenade
      if ((e.key === 'g' || e.key === 'G') && !engine.state.isPaused && !engine.state.isTacticalMenuOpen && !engine.state.isInventoryOpen) engine.throwGrenade();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.input.keys[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.querySelector('canvas')?.getBoundingClientRect();
      if (rect) {
        engine.input.mouse.x = e.clientX - rect.left;
        engine.input.mouse.y = e.clientY - rect.top;
      }
    };

    const handleMouseDown = (e: MouseEvent) => { 
        if (e.button === 0) engine.input.mouse.down = true; 
        if (e.button === 2) engine.input.mouse.rightDown = true;
    };
    const handleMouseUp = (e: MouseEvent) => { 
        if (e.button === 0) engine.input.mouse.down = false; 
        if (e.button === 2) engine.input.mouse.rightDown = false;
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

    // Sync state loop
    const interval = setInterval(() => {
        // Force update react state shallowly to trigger UI re-render
        setGameState({...engine.state}); 
    }, 1000 / 30); // 30 FPS UI update is enough

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(interval);
    };
  }, []);

  const handleShopPurchase = (item: string) => {
      engineRef.current.purchaseItem(item);
  };

  const handleRestart = () => {
      engineRef.current.reset();
  };
  
  const handleToggleSetting = (key: any) => {
      engineRef.current.toggleSetting(key);
  }

  const handleIssueOrder = (order: AllyOrder) => {
      engineRef.current.issueOrder(order);
      engineRef.current.toggleTacticalMenu(); // Close after ordering
  }

  const handleSwapItems = (loadoutIdx: number, inventoryIdx: number) => {
      engineRef.current.swapLoadoutAndInventory(loadoutIdx, inventoryIdx);
  }

  const handleConfirmUpgrade = (type: TurretType) => {
      engineRef.current.confirmTurretUpgrade(type);
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center overflow-hidden">
      <GameCanvas engine={engineRef.current} />
      <UIOverlay 
        state={gameState} 
        onPurchase={handleShopPurchase}
        onCloseShop={() => { engineRef.current.state.isShopOpen = false; }}
        onRestart={handleRestart}
        onToggleSetting={handleToggleSetting}
        onIssueOrder={handleIssueOrder}
        onSwapItems={handleSwapItems}
        onConfirmUpgrade={handleConfirmUpgrade}
      />
    </div>
  );
};

export default App;
