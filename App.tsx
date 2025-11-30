import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/gameService';
import { GameState, AllyOrder, TurretType, AppMode } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

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
      // Input only active in gameplay or specific menus
      engine.input.keys[e.key] = true;
      
      // Prevent browser zoom etc
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
          // e.preventDefault(); // Sometimes needed
      }

      if (engine.state.appMode !== AppMode.GAMEPLAY) {
          // Limited input logic for Start/Map if needed via keys, usually mouse driven
          return;
      }

      // Tactical Menu (Tab)
      if (e.key === 'Tab') {
          e.preventDefault(); 
          if (!engine.state.isPaused && !engine.state.isShopOpen && !engine.state.isInventoryOpen) {
              engine.toggleTacticalMenu();
          }
      }

      // Tactical Commands Hotkeys (When menu is open)
      if (engine.state.isTacticalMenuOpen) {
          if (e.key === 'F1') {
              e.preventDefault();
              engine.issueOrder('PATROL');
              engine.toggleTacticalMenu(); 
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
              
              if (dist < 300 || engine.state.isShopOpen) {
                  engine.state.isShopOpen = !engine.state.isShopOpen;
              }
          }
      }

      // Interact (E)
      if ((e.key === 'e' || e.key === 'E')) {
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
          if (engine.state.activeTurretId !== undefined) engine.closeTurretUpgrade(); 
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
        if (e.button === 0) {
            engine.input.mouse.down = true; 
            
            // Map Click Logic
            if (engine.state.appMode === AppMode.EXPLORATION_MAP) {
                const rect = document.querySelector('canvas')?.getBoundingClientRect();
                if (rect) {
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    
                    // Check planet clicks
                    let clickedPlanetId = null;
                    engine.state.planets.forEach(p => {
                        const dist = Math.sqrt(Math.pow(mx - p.x, 2) + Math.pow(my - p.y, 2));
                        if (dist < p.radius + 10) {
                            clickedPlanetId = p.id;
                        }
                    });
                    
                    // Update selection
                    if (clickedPlanetId) {
                        engine.selectPlanet(clickedPlanetId);
                    } else {
                        // Deselect if clicking empty space? Optional.
                        // engine.selectPlanet(null);
                    }
                }
            }
        }
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
        setGameState({...engine.state}); 
    }, 1000 / 30); 

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

  const handleShopPurchase = (item: string) => { engineRef.current.purchaseItem(item); };
  const handleRestart = () => { engineRef.current.reset(); };
  const handleToggleSetting = (key: any) => { engineRef.current.toggleSetting(key); }
  const handleIssueOrder = (order: AllyOrder) => { engineRef.current.issueOrder(order); engineRef.current.toggleTacticalMenu(); }
  const handleSwapItems = (lIdx: number, iIdx: number) => { engineRef.current.swapLoadoutAndInventory(lIdx, iIdx); }
  const handleConfirmUpgrade = (type: TurretType) => { engineRef.current.confirmTurretUpgrade(type); }
  const handleCloseShop = () => { engineRef.current.state.isShopOpen = false; };
  const handleCloseInventory = () => { engineRef.current.toggleInventory(); };
  const handleCloseTacticalMenu = () => { engineRef.current.toggleTacticalMenu(); };
  const handleClosePause = () => { engineRef.current.togglePause(); };

  // New Handlers
  const handleStartSurvival = () => { engineRef.current.enterSurvivalMode(); };
  const handleStartExploration = () => { engineRef.current.enterExplorationMode(); };
  const handleDeployPlanet = (id: string) => { engineRef.current.deployToPlanet(id); };
  const handleReturnToMap = () => { engineRef.current.completeMission(); };
  const handleDeselectPlanet = () => { engineRef.current.selectPlanet(null); };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center overflow-hidden">
      <GameCanvas engine={engineRef.current} />
      <UIOverlay 
        state={gameState} 
        onPurchase={handleShopPurchase}
        onCloseShop={handleCloseShop}
        onCloseInventory={handleCloseInventory}
        onCloseTacticalMenu={handleCloseTacticalMenu}
        onClosePause={handleClosePause}
        onRestart={handleRestart}
        onToggleSetting={handleToggleSetting}
        onIssueOrder={handleIssueOrder}
        onSwapItems={handleSwapItems}
        onConfirmUpgrade={handleConfirmUpgrade}
        onStartSurvival={handleStartSurvival}
        onStartExploration={handleStartExploration}
        onDeployPlanet={handleDeployPlanet}
        onReturnToMap={handleReturnToMap}
        onDeselectPlanet={handleDeselectPlanet}
      />
    </div>
  );
};

export default App;