
import { IInputStrategy } from "../IInputStrategy";
import { GameEngine } from "../../gameService";
import { UserAction, GameEventType } from "../../../types";

export class MapInputStrategy implements IInputStrategy {
    handle(action: UserAction, engine: GameEngine): boolean {
        const state = engine.state;

        if (action === UserAction.ESCAPE) {
            if (state.selectedPlanetId) {
                engine.selectPlanet(null);
                return true;
            }
            // Optional: Return to main menu? Currently we stay in map.
            return true;
        }

        if (action === UserAction.FIRE) {
            // Raycast for Planet
            // Scale mouse position to internal resolution if resolutionScale is active
            const resScale = state.settings.resolutionScale || 1.0;
            const mx = engine.inputManager.mouse.x * resScale;
            const my = engine.inputManager.mouse.y * resScale;
            
            let clickedPlanetId: string | null = null;

            // Simple circle hit test
            for (const p of state.planets) {
                const dx = mx - p.x;
                const dy = my - p.y;
                // Add buffer to radius for easier clicking
                if (dx*dx + dy*dy < (p.radius + 15) ** 2) {
                    clickedPlanetId = p.id;
                    break;
                }
            }

            if (clickedPlanetId) {
                engine.selectPlanet(clickedPlanetId);
                engine.eventBus.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
            } else {
                engine.selectPlanet(null);
            }
            return true;
        }

        return false;
    }
}
