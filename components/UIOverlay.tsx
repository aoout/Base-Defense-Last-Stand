
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameSettings, AllyOrder, TurretType, SpecialEventType, AppMode, GameMode, SpaceshipModuleType, PlanetBuildingType } from '../types';
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
import { PlanetConstructionUI } from './ui/PlanetConstructionUI';
import { GalacticEventModal } from './ui/GalacticEventModal';
import { PlanetaryYieldReport } from './ui/PlanetaryYieldReport';
import { MobileControls } from './ui/MobileControls';

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

  // Planet Construction
  onOpenPlanetConstruction: () => void;
  onClosePlanetConstruction: () => void;
  onConstructBuilding: (planetId: string, type: PlanetBuildingType, slotIndex: number) => void;

  // Evac
  onEmergencyEvac: () => void;

  // Ship Computer
  onOpenShipComputer: () => void;
  onCloseShipComputer: () => void;

  // Events
  onCloseGalacticEvent: () => void;
  onClaimYield: () => void;

  // Mobile
  onJoystickMove: (side: 'LEFT' | 'RIGHT', x: number, y: number) => void;
  onMobileButton: (action: string) => void;
  isMobile: boolean;
}

const VisorOverlay: React.FC = React.memo(() => (
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
));

const UIOverlay: React.FC<UIOverlayProps> = (props) => {
  const { state } = props;
  
  // Memoize translation function
  const t = useCallback((key: string, params?: any) => {
      const lang = state.settings.language;
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
      let str = (dict as any)[key] || key;
      if (params) {
          Object.entries(params).forEach(([k, v]) => {
              str = str.replace(`{${k}}`, String(v));
          });
      }
      return str;
  }, [state.settings.language]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans">
      <VisorOverlay />

      {/* Main Menu */}
      {state.appMode === AppMode.START_MENU && (
          <MainMenu 
            state={state} 
            onStartSurvival={props.onStartSurvival}
            onStartExploration={props.onStartExploration}
            onLoadGame={props.onLoadGame}
            onDeleteSave={props.onDeleteSave}
            onTogglePin={props.onTogglePin}
            onExportSave={props.onExportSave}
            onImportSave={props.onImportSave}
            onToggleSetting={props.onToggleSetting}
            t={t}
          />
      )}

      {/* Exploration Map */}
      {state.appMode === AppMode.EXPLORATION_MAP && (
          <SectorMapUI 
            state={state} 
            onSaveGame={props.onSaveGame} 
            onOpenSpaceship={props.onOpenSpaceship}
            onDeployPlanet={props.onDeployPlanet}
            onDeselectPlanet={props.onDeselectPlanet}
            onCheat={props.onCheat}
            onOpenConstruction={props.onOpenPlanetConstruction}
            t={t}
          />
      )}

      {/* Spaceship View */}
      {state.appMode === AppMode.SPACESHIP_VIEW && (
          <SpaceshipView 
            state={state} 
            onClose={props.onCloseSpaceship} 
            onPurchaseModule={(m) => props.onPurchase(m)}
            onOpenUpgrades={props.onOpenOrbitalUpgrades}
            onOpenCarapaceGrid={props.onOpenCarapaceGrid}
            onOpenInfrastructure={props.onOpenInfrastructure}
            onOpenComputer={props.onOpenShipComputer}
            onCheat={props.onCheat}
            t={t}
          />
      )}

      {/* Orbital Upgrade Tree */}
      {state.appMode === AppMode.ORBITAL_UPGRADES && (
          <OrbitalUpgradeUI 
            state={state}
            onPurchase={props.onPurchaseOrbitalUpgrade}
            onClose={props.onCloseOrbitalUpgrades}
            t={t}
          />
      )}

      {/* Carapace Grid */}
      {state.appMode === AppMode.CARAPACE_GRID && (
          <CarapaceAnalyzerUI
            state={state}
            onPurchase={props.onPurchaseCarapaceNode}
            onClose={props.onCloseCarapaceGrid}
            t={t}
          />
      )}

      {/* Infrastructure Research */}
      {state.appMode === AppMode.INFRASTRUCTURE_RESEARCH && (
          <InfrastructureResearchUI 
            state={state}
            onPurchase={props.onPurchaseInfrastructure}
            onClose={props.onCloseInfrastructure}
            t={t}
          />
      )}

      {/* Planet Construction */}
      {state.appMode === AppMode.PLANET_CONSTRUCTION && (
          <PlanetConstructionUI 
            state={state}
            onClose={props.onClosePlanetConstruction}
            onConstruct={props.onConstructBuilding}
            t={t}
          />
      )}

      {/* Ship Computer (Manual) */}
      {state.appMode === AppMode.SHIP_COMPUTER && (
          <ShipComputer onClose={props.onCloseShipComputer} t={t} onCheat={props.onCheat} />
      )}

      {/* Mission Failed */}
      {state.isGameOver && state.gameMode === GameMode.EXPLORATION ? (
          <ExtractionScreen onEvac={props.onEmergencyEvac} t={t} />
      ) : (
          state.isGameOver && <MissionFailedScreen state={state} onRestart={props.onRestart} t={t} />
      )}

      {/* Mission Success */}
      {state.missionComplete && <MissionSuccessScreen state={state} onReturn={props.onReturnToMap} t={t} />}

      {/* Yield Report */}
      {state.appMode === AppMode.YIELD_REPORT && (
          <PlanetaryYieldReport state={state} onClaim={props.onClaimYield} t={t} />
      )}

      {/* Galactic Events */}
      {state.activeGalacticEvent && (
          <GalacticEventModal event={state.activeGalacticEvent} state={state} onClose={props.onCloseGalacticEvent} t={t} />
      )}

      {/* Gameplay HUD & Modals */}
      {state.appMode === AppMode.GAMEPLAY && !state.isGameOver && !state.missionComplete && (
        <>
          {state.settings.showHUD && <HUD state={state} t={t} onSkipWave={props.onSkipWave} />}
          
          <InteractPrompt state={state} t={t} />

          {/* Pause Menu */}
          {state.isPaused && !state.activeTurretId && !state.isShopOpen && !state.isInventoryOpen && !state.isTacticalMenuOpen && (
            <TacticalTerminal state={state} onToggleSetting={props.onToggleSetting} onClose={props.onClosePause} onSave={props.onSaveGame} t={t} />
          )}

          {/* Shop */}
          {state.isShopOpen && (
            <ShopModal state={state} onPurchase={props.onPurchase} onClose={props.onCloseShop} t={t} />
          )}

          {/* Inventory */}
          {state.isInventoryOpen && (
              <TacticalBackpack state={state} onSwapItems={props.onSwapItems} onClose={props.onCloseInventory} t={t} />
          )}

          {/* Tactical Menu */}
          {state.isTacticalMenuOpen && (
              <TacticalCallInterface state={state} onIssueOrder={props.onIssueOrder} onClose={props.onCloseTacticalMenu} t={t} />
          )}

          {/* Turret Upgrade */}
          {state.activeTurretId !== undefined && (
              <TurretUpgradeUI state={state} onConfirmUpgrade={props.onConfirmUpgrade} t={t} />
          )}

          {/* Mobile Controls */}
          {props.isMobile && (
              <MobileControls 
                  onJoystickMove={props.onJoystickMove} 
                  onButtonPress={props.onMobileButton}
                  currentWeaponIndex={state.player.currentWeaponIndex}
                  loadout={state.player.loadout}
              />
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(UIOverlay);
