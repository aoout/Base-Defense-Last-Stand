
import React from 'react';
import { AppMode, GameMode } from '../types';
import { LocaleProvider } from './contexts/LocaleContext';
import { useGame } from './contexts/GameContext';
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
import { CampaignFailureScreen } from './ui/CampaignFailureScreen';
import { ExtractionScreen } from './ui/ExtractionScreen';
import { MissionSuccessScreen } from './ui/MissionSuccessScreen';
import { GalacticEventModal } from './ui/GalacticEventModal';
import { BioSequencingUI } from './ui/BioSequencingUI';

const UIOverlay: React.FC = () => {
    const { state, engine } = useGame();

    let content = null;

    if (state.appMode === AppMode.START_MENU) {
        content = <MainMenu />;
    } else if (state.appMode === AppMode.EXPLORATION_MAP) {
        content = (
            <>
                <SectorMapUI />
                {state.activeGalacticEvent && (
                    <GalacticEventModal />
                )}
            </>
        );
    } else if (state.appMode === AppMode.SPACESHIP_VIEW) {
        content = <SpaceshipView />;
    } else if (state.appMode === AppMode.ORBITAL_UPGRADES) {
        content = <OrbitalUpgradeUI />;
    } else if (state.appMode === AppMode.CARAPACE_GRID) {
        content = <CarapaceAnalyzerUI />;
    } else if (state.appMode === AppMode.SHIP_COMPUTER) {
        content = <ShipComputer onClose={() => engine.exitShipComputer()} />;
    } else if (state.appMode === AppMode.INFRASTRUCTURE_RESEARCH) {
        content = <InfrastructureResearchUI />;
    } else if (state.appMode === AppMode.PLANET_CONSTRUCTION) {
        content = <PlanetConstructionUI />;
    } else if (state.appMode === AppMode.YIELD_REPORT) {
        content = <PlanetaryYieldReport />;
    } else if (state.appMode === AppMode.BIO_SEQUENCING) {
        content = <BioSequencingUI />;
    } else if (state.appMode === AppMode.GAMEPLAY) {
        content = (
            <>
                {state.settings.showHUD && <HUD />}
                <InteractPrompt state={state} />
                
                {state.isShopOpen && <ShopModal />}
                {state.isInventoryOpen && <TacticalBackpack />}
                {state.isTacticalMenuOpen && <TacticalCallInterface />}
                {state.isPaused && !state.missionComplete && !state.isGameOver && <TacticalTerminal />}
                {state.activeTurretId !== undefined && <TurretUpgradeUI />}

                {/* Overlays */}
                {state.isGameOver && (
                    state.gameMode === GameMode.CAMPAIGN ? (
                        <CampaignFailureScreen />
                    ) : state.gameMode === GameMode.EXPLORATION ? (
                        <ExtractionScreen state={state} onEvac={() => engine.emergencyEvac()} />
                    ) : (
                        <MissionFailedScreen />
                    )
                )}

                {state.missionComplete && <MissionSuccessScreen />}
            </>
        );
    }

    return (
        <LocaleProvider language={state.settings.language}>
            {content}
        </LocaleProvider>
    );
};

export default UIOverlay;
