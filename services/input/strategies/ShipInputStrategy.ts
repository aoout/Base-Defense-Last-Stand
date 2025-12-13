
import { IInputStrategy } from "../IInputStrategy";
import { GameEngine } from "../../gameService";
import { UserAction, AppMode } from "../../../types";

export class ShipInputStrategy implements IInputStrategy {
    handle(action: UserAction, engine: GameEngine): boolean {
        const state = engine.state;

        if (action === UserAction.ESCAPE) {
            // Centralized Back Navigation Logic
            switch (state.appMode) {
                case AppMode.SPACESHIP_VIEW:
                    engine.sessionManager.setMode(AppMode.EXPLORATION_MAP);
                    break;
                case AppMode.ORBITAL_UPGRADES:
                case AppMode.CARAPACE_GRID:
                case AppMode.INFRASTRUCTURE_RESEARCH:
                case AppMode.BIO_SEQUENCING:
                case AppMode.SHIP_COMPUTER:
                    engine.sessionManager.setMode(AppMode.SPACESHIP_VIEW);
                    break;
                case AppMode.PLANET_CONSTRUCTION:
                    engine.sessionManager.setMode(AppMode.EXPLORATION_MAP);
                    break;
                case AppMode.HEROIC_ZEAL:
                    engine.sessionManager.setMode(AppMode.GAMEPLAY); 
                    break;
                default:
                    engine.sessionManager.setMode(AppMode.SPACESHIP_VIEW);
            }
            return true;
        }

        return false;
    }
}
