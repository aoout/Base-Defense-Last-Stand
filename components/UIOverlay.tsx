
import React from 'react';
import { GameState, AppMode, GameMode, AllyOrder, TurretType, PlanetBuildingType, GameSettings } from '../types';
import { TRANSLATIONS } from '../data/locales';
import { HUD } from './ui/HUD';
import { InteractPrompt } from './ui/InteractPrompt';
import { ShopModal } from './ui/ShopModal';
import { TacticalBackpack } from './ui/Backpack';
import { TacticalCallInterface } from './ui/TacticalCall';
import { TacticalTerminal } from './ui/TacticalTerminal';
import { TurretUpgradeUI } from './ui/TurretUI';
import { MainMenu } from './ui/MainMenu';
import { SectorMapUI } from './ui/SectorMapUI';
import { SpaceshipView } from './ui/SpaceshipView';
import { OrbitalUpgradeUI } from './ui/OrbitalUpgradeUI';
import { CarapaceAnalyzerUI } from './ui/CarapaceAnalyzerUI';
import { ShipComputer } from './ui/ShipComputer';
import { InfrastructureResearchUI } from './ui/InfrastructureResearchUI';
import { PlanetConstructionUI } from './ui/PlanetConstructionUI';
import { PlanetaryYieldReport } from './ui/PlanetaryYieldReport';
import { MissionFailedScreen } from './ui/MissionFailed';
import { ExtractionScreen } from './ui/ExtractionScreen';
import { MissionSuccessScreen } from './ui/MissionSuccessScreen';
import { GalacticEventModal } from './ui/GalacticEventModal';
import { BioSequencingUI } from './ui/BioSequencingUI';

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
    onSwapItems: (lIdx: number, iIdx: number) => void;
    onConfirmUpgrade: (type: TurretType) => void;
    onStartSurvival: () => void;
    onStartExploration: () => void;
    onDeployPlanet: (id: string) => void;
    onReturnToMap: () => void;
    onDeselectPlanet: () => void;
    onOpenSpaceship: () => void;
    onCloseSpaceship: () => void;
    onSaveGame: () => void;
    onLoadGame: (id: string) => void;
    onDeleteSave: (id: string) => void;
    onTogglePin: (id: string) => void;
    onExportSave: (id: string) => void;
    onImportSave: (json: string) => void;
    onSkipWave: () => void;
    onCheat: () => void;
    onPurchaseOrbitalUpgrade: (nodeId: string) => void;
    onOpenOrbitalUpgrades: () => void;
    onCloseOrbitalUpgrades: () => void;
    onOpenCarapaceGrid: () => void;
    onCloseCarapaceGrid: () => void;
    onPurchaseCarapaceNode: (row: number, col: number) => void;
    onOpenInfrastructure: () => void;
    onCloseInfrastructure: () => void;
    onPurchaseInfrastructure: (optionId: string) => void;
    onOpenPlanetConstruction: () => void;
    onClosePlanetConstruction: () => void;
    onConstructBuilding: (planetId: string, type: PlanetBuildingType, slotIndex: number) => void;
    onEmergencyEvac: () => void;
    onOpenShipComputer: () => void;
    onCloseShipComputer: () => void;
    onCloseGalacticEvent: () => void;
    onClaimYield: () => void;
    
    // Bio Sequencing Props
    onOpenBioSequencing: () => void;
    onCloseBioSequencing: () => void;
    onBioResearch: () => void;
    onUnlockBioNode: (id: number) => void;
    onAcceptBioTask: (id: string) => void;
    onAbortBioTask: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = (props) => {
    const { state } = props;

    // Translation Helper
    const t = (key: string, params?: any) => {
        const lang = state.settings.language;
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
        let str = (dict as any)[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    };

    if (state.appMode === AppMode.START_MENU) {
        return <MainMenu 
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
        />;
    }

    if (state.appMode === AppMode.EXPLORATION_MAP) {
        return (
            <>
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
                {state.activeGalacticEvent && (
                    <GalacticEventModal 
                        event={state.activeGalacticEvent} 
                        state={state} 
                        onClose={props.onCloseGalacticEvent} 
                        t={t} 
                    />
                )}
            </>
        );
    }

    if (state.appMode === AppMode.SPACESHIP_VIEW) {
        return <SpaceshipView 
            state={state} 
            onClose={props.onCloseSpaceship} 
            onPurchaseModule={(m) => props.onPurchase(m)}
            onOpenUpgrades={props.onOpenOrbitalUpgrades}
            onOpenCarapaceGrid={props.onOpenCarapaceGrid}
            onOpenInfrastructure={props.onOpenInfrastructure}
            onOpenComputer={props.onOpenShipComputer}
            onOpenBioSequencing={props.onOpenBioSequencing}
            onCheat={props.onCheat}
            t={t}
        />;
    }

    if (state.appMode === AppMode.ORBITAL_UPGRADES) {
        return <OrbitalUpgradeUI state={state} onPurchase={props.onPurchaseOrbitalUpgrade} onClose={props.onCloseOrbitalUpgrades} t={t} />;
    }

    if (state.appMode === AppMode.CARAPACE_GRID) {
        return <CarapaceAnalyzerUI state={state} onPurchase={props.onPurchaseCarapaceNode} onClose={props.onCloseCarapaceGrid} t={t} />;
    }

    if (state.appMode === AppMode.SHIP_COMPUTER) {
        return <ShipComputer onClose={props.onCloseShipComputer} t={t} />;
    }

    if (state.appMode === AppMode.INFRASTRUCTURE_RESEARCH) {
        return <InfrastructureResearchUI state={state} onPurchase={props.onPurchaseInfrastructure} onClose={props.onCloseInfrastructure} t={t} />;
    }

    if (state.appMode === AppMode.PLANET_CONSTRUCTION) {
        return <PlanetConstructionUI state={state} onConstruct={props.onConstructBuilding} onClose={props.onClosePlanetConstruction} t={t} />;
    }

    if (state.appMode === AppMode.YIELD_REPORT) {
        return <PlanetaryYieldReport state={state} onClaim={props.onClaimYield} t={t} />;
    }

    if (state.appMode === AppMode.BIO_SEQUENCING) {
        return <BioSequencingUI 
            state={state} 
            onClose={props.onCloseBioSequencing} 
            onConductResearch={props.onBioResearch} 
            onUnlockNode={props.onUnlockBioNode}
            onAcceptTask={props.onAcceptBioTask}
            onAbortTask={props.onAbortBioTask}
            t={t} 
        />;
    }

    // GAMEPLAY
    if (state.appMode === AppMode.GAMEPLAY) {
        return (
            <>
                {state.settings.showHUD && <HUD state={state} t={t} onSkipWave={props.onSkipWave} />}
                <InteractPrompt state={state} t={t} />
                
                {state.isShopOpen && <ShopModal state={state} onPurchase={props.onPurchase} onClose={props.onCloseShop} t={t} />}
                {state.isInventoryOpen && <TacticalBackpack state={state} onSwapItems={props.onSwapItems} onClose={props.onCloseInventory} t={t} />}
                {state.isTacticalMenuOpen && <TacticalCallInterface state={state} onIssueOrder={props.onIssueOrder} onClose={props.onCloseTacticalMenu} t={t} />}
                {state.isPaused && !state.missionComplete && !state.isGameOver && <TacticalTerminal state={state} onToggleSetting={props.onToggleSetting} onClose={props.onClosePause} onSave={props.onSaveGame} t={t} />}
                {state.activeTurretId !== undefined && <TurretUpgradeUI state={state} onConfirmUpgrade={props.onConfirmUpgrade} t={t} />}

                {/* Overlays */}
                {state.isGameOver && (
                    state.gameMode === GameMode.EXPLORATION ? (
                        <ExtractionScreen onEvac={props.onEmergencyEvac} t={t} state={state} />
                    ) : (
                        <MissionFailedScreen state={state} onRestart={props.onRestart} t={t} />
                    )
                )}

                {state.missionComplete && <MissionSuccessScreen state={state} onReturn={props.onReturnToMap} t={t} />}
            </>
        );
    }

    return null;
};

export default UIOverlay;
