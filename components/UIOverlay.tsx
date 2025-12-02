


import React, { useState, useEffect, useCallback } from 'react';
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
import { MissionSuccessScreen } from './ui/MissionSuccessScreen';
import { ExtractionScreen } from './ui/ExtractionScreen';
import { TurretUpgradeUI } from './ui/TurretUI';
import { MainMenu } from './ui/MainMenu';
import { SectorMapUI } from './ui/SectorMapUI';
import { HUD } from './ui/HUD';
import { OrbitalUpgradeUI } from './ui/OrbitalUpgradeUI';
import { InteractPrompt } from './ui/InteractPrompt';
import { CarapaceAnalyzerUI } from './ui/CarapaceAnalyzerUI';
import { ShipComputer } from './ui/ShipComputer';
import { InfrastructureResearchUI } from './ui/InfrastructureResearchUI';

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
  onExportSave: (id: string) => void;
  onImportSave: (json: string) => void;

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

  // Infrastructure
  onOpenInfrastructure: () => void;
  onCloseInfrastructure: () => void;
  onPurchaseInfrastructure: (optionId: string) => void;

  // Evac
  onEmergencyEvac: () => void;

  // Ship Computer
  onOpenShipComputer: () => void;
  onCloseShipComputer: () => void;
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
    onExportSave,
    onImportSave,
    onSkipWave,
    onCheat,
    onPurchaseOrbitalUpgrade,
    onOpenOrbitalUpgrades,
    onCloseOrbitalUpgrades,
    onOpenCarapaceGrid,
    onCloseCarapaceGrid,
    onPurchaseCarapaceNode,
    onOpenInfrastructure,
    onCloseInfrastructure,
    onPurchaseInfrastructure,
    onEmergencyEvac,
    onOpenShipComputer,
    onCloseShipComputer
}) => {
  const t = useCallback((key: keyof typeof TRANSLATIONS.EN, params?: Record<string, any>) => {
      const lang = state.settings?.language || 'EN';
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key] || key;
      if (params) {
          Object.entries(params).forEach(([k, v]) => {
              str = str.replace(`{${k}}`, String(v));
          });
      }
      return str;
  }, [state.settings.language]);

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
                onExportSave={onExportSave}
                onImportSave={onImportSave}
                onToggleSetting={onToggleSetting}
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
                onOpenInfrastructure={onOpenInfrastructure}
                onOpenComputer={onOpenShipComputer}
                onCheat={onCheat}
                t={t}
            />
        )}

        {state.appMode === AppMode.ORBITAL_UPGRADES && (
            <OrbitalUpgradeUI 
                state={state}
                onPurchase={onPurchaseOrbitalUpgrade}
                onClose={onCloseOrbitalUpgrades}
                t={t}
            />
        )}

        {state.appMode === AppMode.CARAPACE_GRID && (
            <CarapaceAnalyzerUI 
                state={state}
                onPurchase={onPurchaseCarapaceNode}
                onClose={onCloseCarapaceGrid}
                t={t}
            />
        )}

        {state.appMode === AppMode.INFRASTRUCTURE_RESEARCH && (
            <InfrastructureResearchUI 
                state={state}
                onPurchase={onPurchaseInfrastructure}
                onClose={onCloseInfrastructure}
                t={t}
            />
        )}

        {state.appMode === AppMode.SHIP_COMPUTER && (
            <ShipComputer onClose={onCloseShipComputer} t={t} onCheat={onCheat} />
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
                <ExtractionScreen onEvac={onEmergencyEvac} t={t} />
            ) : (
                <MissionFailedScreen state={state} onRestart={onRestart} t={t} />
            )
        )}

        {state.missionComplete && (
            <MissionSuccessScreen state={state} onReturn={onReturnToMap} t={t} />
        )}

        {/* --- GAMEPLAY HUD --- */}

        {state.appMode === AppMode.GAMEPLAY && (
            <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
                
                {/* --- SPECIAL EVENT WARNING BANNER --- */}
                {state.activeSpecialEvent !== SpecialEventType.NONE && (
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-full flex justify-center z-30">
                        <div className="bg-red-950/90 border-y-2 border-red-500 w-full py-2 flex justify-center items-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                            <div className="text-white font-black text-2xl tracking-[0.3em] uppercase drop-shadow-md">
                                {state.activeSpecialEvent === SpecialEventType.FRENZY && t('FRENZY_BANNER')}
                                {state.activeSpecialEvent === SpecialEventType.BOSS && t('BOSS_BANNER')}
                            </div>
                        </div>
                    </div>
                )}

                {state.activeTurretId !== undefined ? (
                    <TurretUpgradeUI state={state} onConfirmUpgrade={onConfirmUpgrade} t={t} />
                ) : state.isTacticalMenuOpen ? (
                    <TacticalCallInterface state={state} onIssueOrder={onIssueOrder} onClose={onCloseTacticalMenu} t={t} />
                ) : state.isInventoryOpen ? (
                    <TacticalBackpack state={state} onSwapItems={onSwapItems} onClose={onCloseInventory} t={t} />
                ) : (state.isPaused && !state.isGameOver && !state.missionComplete) ? (
                    <TacticalTerminal state={state} onToggleSetting={onToggleSetting} onClose={onClosePause} onSave={onSaveGame} t={t} />
                ) : (
                    <>
                        {state.settings.showHUD && <HUD state={state} t={t} onSkipWave={onSkipWave} />}
                        {!state.isShopOpen && !state.isGameOver && !state.missionComplete && <InteractPrompt state={state} t={t} />}
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