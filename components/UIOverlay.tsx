
import React, { useState, useEffect } from 'react';
import { GameState, GameSettings, AllyOrder, TurretType, SpecialEventType, AppMode, GameMode, SpaceshipModuleType } from '../types';
import { PLAYER_STATS, TURRET_COSTS, WEAPONS } from '../data/registry';
import { TRANSLATIONS } from '../data/locales';
import { SpaceshipView } from './ui/SpaceshipView';
import { ShopModal } from './ui/ShopModal';
import { TacticalTerminal } from './ui/TacticalTerminal';
import { TacticalBackpack } from './ui/Backpack';
import { TacticalCallInterface } from './ui/TacticalCall';
import { WeaponIcon } from './ui/Shared';
import { MissionFailedScreen } from './ui/MissionFailed';
import { TurretUpgradeUI } from './ui/TurretUI';
import { MainMenu } from './ui/MainMenu';
import { SectorMapUI } from './ui/SectorMapUI';
import { HUD } from './ui/HUD';

interface UIOverlayProps {
  state: GameState;
  onPurchase: (item: string) => void;
  onCloseShop: () => void;
  onCloseInventory: () => void;
  onCloseTacticalMenu: () => void;
  onClosePause: () => void;
  onRestart: () => void;
  onToggleSetting: (key: keyof GameSettings) => void;
  onIssueOrder: (order: AllyOrder) => void;
  onSwapItems: (loadoutIdx: number, inventoryIdx: number) => void;
  onConfirmUpgrade: (type: TurretType) => void;
  // New handlers
  onStartSurvival: () => void;
  onStartExploration: () => void;
  onDeployPlanet: (id: string) => void;
  onReturnToMap: () => void;
  onDeselectPlanet: () => void;
  
  // Spaceship
  onOpenSpaceship: () => void;
  onCloseSpaceship: () => void;

  // Save/Load
  onSaveGame: () => void;
  onLoadGame: (id: string) => void;
  onDeleteSave: (id: string) => void;
  onTogglePin: (id: string) => void;

  // Mechanics
  onSkipWave: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
    state, 
    onPurchase, 
    onCloseShop, 
    onCloseInventory,
    onCloseTacticalMenu,
    onClosePause,
    onRestart, 
    onToggleSetting, 
    onIssueOrder, 
    onSwapItems, 
    onConfirmUpgrade,
    onStartSurvival,
    onStartExploration,
    onDeployPlanet,
    onReturnToMap,
    onDeselectPlanet,
    onOpenSpaceship,
    onCloseSpaceship,
    onSaveGame,
    onLoadGame,
    onDeleteSave,
    onTogglePin,
    onSkipWave
}) => {
  const t = (key: keyof typeof TRANSLATIONS.EN) => TRANSLATIONS[state.settings.language][key];

  // Handle Spaceship Module Purchase Wrapper
  const handlePurchaseSpaceshipModule = (modType: SpaceshipModuleType) => {
      onPurchase(modType);
  }

  // --- MODE SPECIFIC UIs ---

  if (state.appMode === AppMode.START_MENU) {
      return (
          <MainMenu 
            state={state}
            onStartSurvival={onStartSurvival}
            onStartExploration={onStartExploration}
            onLoadGame={onLoadGame}
            onDeleteSave={onDeleteSave}
            onTogglePin={onTogglePin}
            t={t}
          />
      )
  }

  if (state.appMode === AppMode.SPACESHIP_VIEW) {
      return (
          <SpaceshipView 
            state={state} 
            onClose={onCloseSpaceship} 
            onPurchaseModule={handlePurchaseSpaceshipModule}
          />
      )
  }

  if (state.appMode === AppMode.EXPLORATION_MAP) {
      return (
          <SectorMapUI 
            state={state}
            onSaveGame={onSaveGame}
            onOpenSpaceship={onOpenSpaceship}
            onDeployPlanet={onDeployPlanet}
            onDeselectPlanet={onDeselectPlanet}
            t={t}
          />
      )
  }

  if (state.isGameOver) {
      return <MissionFailedScreen state={state} onRestart={onRestart} />;
  }

  if (state.missionComplete) {
      return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center pointer-events-auto font-mono text-white">
             <div className="border-4 border-green-500 p-12 max-w-2xl w-full bg-gray-900 relative shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                 <h1 className="text-6xl font-black text-green-500 mb-2 tracking-tighter text-center">MISSION COMPLETE</h1>
                 <p className="text-center text-green-300 tracking-[0.3em] mb-8">SECTOR SECURED</p>

                 <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                     <div className="bg-black/40 p-4 border border-green-900">
                         <div className="text-gray-500 text-xs">SCRAPS COLLECTED</div>
                         <div className="text-3xl font-bold text-yellow-400">{Math.floor(state.player.score)}</div>
                     </div>
                     <div className="bg-black/40 p-4 border border-green-900">
                         <div className="text-gray-500 text-xs">TOTAL KILLS</div>
                         <div className="text-3xl font-bold text-red-400">{(Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0)}</div>
                     </div>
                 </div>

                 <button 
                    onClick={onReturnToMap}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold text-xl tracking-widest uppercase transition-all"
                 >
                     Return to Orbit
                 </button>
             </div>
        </div>
      );
  }

  // --- GAMEPLAY HUD ---

  if (state.activeTurretId !== undefined) {
      return <TurretUpgradeUI state={state} onConfirmUpgrade={onConfirmUpgrade} />;
  }

  if (state.isTacticalMenuOpen) {
      return <TacticalCallInterface state={state} onIssueOrder={onIssueOrder} onClose={onCloseTacticalMenu} t={t} />;
  }

  if (state.isInventoryOpen) {
      return <TacticalBackpack state={state} onSwapItems={onSwapItems} onClose={onCloseInventory} t={t} />;
  }

  if (state.isPaused) {
      return <TacticalTerminal state={state} onToggleSetting={onToggleSetting} onClose={onClosePause} onSave={onSaveGame} t={t} />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
      
      {/* --- SPECIAL EVENT WARNING BANNER --- */}
      {state.activeSpecialEvent !== SpecialEventType.NONE && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full flex justify-center">
              <div className="bg-red-900/80 border-y-2 border-red-500 w-full py-2 flex justify-center items-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                  <div className="text-white font-black text-2xl tracking-[0.3em] uppercase drop-shadow-md">
                      {state.activeSpecialEvent === SpecialEventType.FRENZY && "WARNING: SWARM FRENZY DETECTED"}
                      {state.activeSpecialEvent === SpecialEventType.BOSS && "WARNING: HIGH CLASS BIO-SIGNATURE"}
                  </div>
              </div>
          </div>
      )}

      {/* --- HUD Elements --- */}
      {state.settings.showHUD && (
        <HUD state={state} t={t} onSkipWave={onSkipWave} />
      )}

      {/* Shop Modal */}
      {state.isShopOpen && (
        <ShopModal 
            state={state} 
            onPurchase={onPurchase} 
            onClose={onCloseShop} 
            t={t} 
        />
      )}

      {/* Interact Prompt */}
      {!state.isPaused && <InteractPrompt state={state} />}
    </div>
  );
};

const InteractPrompt: React.FC<{ state: GameState }> = ({ state }) => {
    if (state.appMode !== AppMode.GAMEPLAY) return null;
    const p = state.player;
    const distToShop = Math.sqrt(Math.pow(p.x - state.base.x, 2) + Math.pow(p.y - state.base.y, 2));
    if (distToShop < 300 && !state.isShopOpen) {
        return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">OPEN SHOP [B]</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-yellow-500 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>)
    }
    let nearTurret = false; let closestSpotIdx = -1; let minDist = 60;
    state.turretSpots.forEach((t, idx) => { const d = Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2)); if (d < minDist) { nearTurret = true; closestSpotIdx = idx; } });
    if (nearTurret && closestSpotIdx !== -1) {
        const spot = state.turretSpots[closestSpotIdx];
        if (spot.builtTurret) { return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-emerald-500 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">UPGRADE [E]</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-emerald-500 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>); } 
        else { const currentCount = state.turretSpots.filter(s => s.builtTurret).length; const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement); return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-blue-600 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">BUILD [E] - {cost}</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-blue-600 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>); }
    }
    return null;
}

export default UIOverlay;
