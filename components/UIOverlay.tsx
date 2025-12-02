
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
import { ExtractionScreen } from './ui/ExtractionScreen';
import { TurretUpgradeUI } from './ui/TurretUI';
import { MainMenu } from './ui/MainMenu';
import { SectorMapUI } from './ui/SectorMapUI';
import { HUD } from './ui/HUD';
import { OrbitalUpgradeUI } from './ui/OrbitalUpgradeUI';
import { InteractPrompt } from './ui/InteractPrompt';
import { CarapaceAnalyzerUI } from './ui/CarapaceAnalyzerUI';

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

  // Cheats
  onCheat: () => void;

  // New Handlers for upgrades
  onPurchaseOrbitalUpgrade: (nodeId: string) => void;
  onOpenOrbitalUpgrades: () => void;
  onCloseOrbitalUpgrades: () => void;

  // New Carapace Grid
  onOpenCarapaceGrid: () => void;
  onCloseCarapaceGrid: () => void;
  onPurchaseCarapaceNode: (row: number, col: number) => void;

  // Evac
  onEmergencyEvac: () => void;
}

const VisorOverlay: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none z-[999] overflow-hidden select-none">
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.6)_100%)]"></div>
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,6px_100%] opacity-20"></div>
        
        {/* Flicker / Grain */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] animate-noise"></div>
        
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30"></div>
    </div>
);

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
    onSkipWave,
    onCheat,
    onPurchaseOrbitalUpgrade,
    onOpenOrbitalUpgrades,
    onCloseOrbitalUpgrades,
    onOpenCarapaceGrid,
    onCloseCarapaceGrid,
    onPurchaseCarapaceNode,
    onEmergencyEvac
}) => {
  const t = (key: keyof typeof TRANSLATIONS.EN) => {
      const lang = state.settings?.language || 'EN';
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      return dict[key] || key;
  };

  const handlePurchaseSpaceshipModule = (modType: SpaceshipModuleType) => {
      onPurchase(modType);
  }

  return (
    <>
        <VisorOverlay />
        
        {/* --- MODE SPECIFIC UIs --- */}

        {state.appMode === AppMode.START_MENU && (
            <MainMenu 
                state={state}
                onStartSurvival={onStartSurvival}
                onStartExploration={onStartExploration}
                onLoadGame={onLoadGame}
                onDeleteSave={onDeleteSave}
                onTogglePin={onTogglePin}
                t={t}
            />
        )}

        {state.appMode === AppMode.SPACESHIP_VIEW && (
            <SpaceshipView 
                state={state} 
                onClose={onCloseSpaceship} 
                onPurchaseModule={handlePurchaseSpaceshipModule}
                onOpenUpgrades={onOpenOrbitalUpgrades}
                onOpenCarapaceGrid={onOpenCarapaceGrid}
            />
        )}

        {state.appMode === AppMode.ORBITAL_UPGRADES && (
            <OrbitalUpgradeUI 
                state={state}
                onPurchase={onPurchaseOrbitalUpgrade}
                onClose={onCloseOrbitalUpgrades}
            />
        )}

        {state.appMode === AppMode.CARAPACE_GRID && (
            <CarapaceAnalyzerUI 
                state={state}
                onPurchase={onPurchaseCarapaceNode}
                onClose={onCloseCarapaceGrid}
            />
        )}

        {state.appMode === AppMode.EXPLORATION_MAP && (
            <SectorMapUI 
                state={state}
                onSaveGame={onSaveGame}
                onOpenSpaceship={onOpenSpaceship}
                onDeployPlanet={onDeployPlanet}
                onDeselectPlanet={onDeselectPlanet}
                t={t}
                onCheat={onCheat}
            />
        )}

        {state.isGameOver && (
            state.gameMode === GameMode.EXPLORATION ? (
                <ExtractionScreen onEvac={onEmergencyEvac} />
            ) : (
                <MissionFailedScreen state={state} onRestart={onRestart} />
            )
        )}

        {state.missionComplete && (
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
        )}

        {/* --- GAMEPLAY HUD --- */}

        {state.appMode === AppMode.GAMEPLAY && (
            <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
                
                {/* --- SPECIAL EVENT WARNING BANNER --- */}
                {state.activeSpecialEvent !== SpecialEventType.NONE && (
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-full flex justify-center z-30">
                        <div className="bg-red-950/90 border-y-2 border-red-500 w-full py-2 flex justify-center items-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                            <div className="text-white font-black text-2xl tracking-[0.3em] uppercase drop-shadow-md">
                                {state.activeSpecialEvent === SpecialEventType.FRENZY && "WARNING: SWARM FRENZY DETECTED"}
                                {state.activeSpecialEvent === SpecialEventType.BOSS && "WARNING: HIGH CLASS BIO-SIGNATURE"}
                            </div>
                        </div>
                    </div>
                )}

                {state.activeTurretId !== undefined ? (
                    <TurretUpgradeUI state={state} onConfirmUpgrade={onConfirmUpgrade} />
                ) : state.isTacticalMenuOpen ? (
                    <TacticalCallInterface state={state} onIssueOrder={onIssueOrder} onClose={onCloseTacticalMenu} t={t} />
                ) : state.isInventoryOpen ? (
                    <TacticalBackpack state={state} onSwapItems={onSwapItems} onClose={onCloseInventory} t={t} />
                ) : (state.isPaused && !state.isGameOver && !state.missionComplete) ? (
                    <TacticalTerminal state={state} onToggleSetting={onToggleSetting} onClose={onClosePause} onSave={onSaveGame} t={t} />
                ) : (
                    <>
                        {state.settings.showHUD && <HUD state={state} t={t} onSkipWave={onSkipWave} />}
                        {!state.isShopOpen && !state.isGameOver && !state.missionComplete && <InteractPrompt state={state} />}
                    </>
                )}

                {state.isShopOpen && (
                    <ShopModal state={state} onPurchase={onPurchase} onClose={onCloseShop} t={t} />
                )}
            </div>
        )}
    </>
  );
};

export default UIOverlay;
