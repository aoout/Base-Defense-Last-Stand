




import React, { useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/gameService';
import { GameState, AllyOrder, TurretType, AppMode, WeaponType } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

const App: React.FC = () => {
  // We use state only for the UI overlay to update at 60fps (or less if we throttle)
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
            engine.equipModule(detail.target, detail.modId);
        }
        if (detail.type === 'UNEQUIP_MODULE') {
            engine.unequipModule(detail.target, detail.modId);
        }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('game-action', handleGameAction);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent tab from changing focus
      if (e.key === 'Tab') {
          e.preventDefault();
      }

      // Input only active in gameplay or specific menus
      engine.handleInput(e.key, true);
      
      // Prevent browser zoom etc
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
          // e.preventDefault(); // Sometimes needed
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleInput(e.key, false);
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
      window.removeEventListener('game-action', handleGameAction);
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
  const handleReturnToMap = () => { engineRef.current.ascendToOrbit(); };
  const handleDeselectPlanet = () => { engineRef.current.selectPlanet(null); };

  // Spaceship Handlers
  const handleOpenSpaceship = () => { engineRef.current.enterSpaceshipView(); };
  const handleCloseSpaceship = () => { engineRef.current.exitSpaceshipView(); };

  // Save/Load Handlers
  const handleSaveGame = () => { engineRef.current.saveGame(); };
  const handleLoadGame = (id: string) => { engineRef.current.loadGame(id); };
  const handleDeleteSave = (id: string) => { engineRef.current.deleteSave(id); };
  const handleTogglePin = (id: string) => { engineRef.current.togglePin(id); };
  const handleExportSave = (id: string) => { 
      const json = engineRef.current.exportSave(id);
      if (json) {
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Vanguard_Save_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
      }
  };
  const handleImportSave = (json: string) => {
      engineRef.current.importSave(json);
  };

  // Skip Wave
  const handleSkipWave = () => { engineRef.current.skipWave(); };

  // Cheat
  const handleCheat = () => { engineRef.current.activateBackdoor(); };

  // Orbital Upgrades
  const handleOpenOrbitalUpgrades = () => { engineRef.current.enterOrbitalUpgradeMenu(); };
  const handleCloseOrbitalUpgrades = () => { engineRef.current.exitOrbitalUpgradeMenu(); };
  const handlePurchaseOrbitalUpgrade = (nodeId: string) => { engineRef.current.purchaseOrbitalUpgrade(nodeId); };

  // Carapace Grid
  const handleOpenCarapaceGrid = () => { 
      engineRef.current.generateCarapaceGrid(); // Ensure generated
      engineRef.current.enterCarapaceGrid(); 
  };
  const handleCloseCarapaceGrid = () => { engineRef.current.exitCarapaceGrid(); };
  const handlePurchaseCarapaceNode = (row: number, col: number) => { engineRef.current.purchaseCarapaceNode(row, col); };

  // Infrastructure Research
  const handleOpenInfrastructure = () => { 
      engineRef.current.generateInfrastructureOptions();
      engineRef.current.enterInfrastructureResearch(); 
  };
  const handleCloseInfrastructure = () => { engineRef.current.exitInfrastructureResearch(); };
  const handlePurchaseInfrastructure = (optionId: string) => { engineRef.current.purchaseInfrastructureUpgrade(optionId); };

  // Evac
  const handleEmergencyEvac = () => { engineRef.current.emergencyEvac(); };

  // Ship Computer
  const handleOpenShipComputer = () => { engineRef.current.enterShipComputer(); };
  const handleCloseShipComputer = () => { engineRef.current.exitShipComputer(); };

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
        onOpenSpaceship={handleOpenSpaceship}
        onCloseSpaceship={handleCloseSpaceship}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        onDeleteSave={handleDeleteSave}
        onTogglePin={handleTogglePin}
        onExportSave={handleExportSave}
        onImportSave={handleImportSave}
        onSkipWave={handleSkipWave}
        onCheat={handleCheat}
        onPurchaseOrbitalUpgrade={handlePurchaseOrbitalUpgrade}
        onOpenOrbitalUpgrades={handleOpenOrbitalUpgrades}
        onCloseOrbitalUpgrades={handleCloseOrbitalUpgrades}
        onOpenCarapaceGrid={handleOpenCarapaceGrid}
        onCloseCarapaceGrid={handleCloseCarapaceGrid}
        onPurchaseCarapaceNode={handlePurchaseCarapaceNode}
        onOpenInfrastructure={handleOpenInfrastructure}
        onCloseInfrastructure={handleCloseInfrastructure}
        onPurchaseInfrastructure={handlePurchaseInfrastructure}
        onEmergencyEvac={handleEmergencyEvac}
        onOpenShipComputer={handleOpenShipComputer}
        onCloseShipComputer={handleCloseShipComputer}
      />
    </div>
  );
};

export default App;