
import { GameEngine } from "../gameService";
import { UserAction } from "../../types";

export interface IInputStrategy {
    /**
     * Handles a user input action.
     * @returns true if the action was consumed/handled, false otherwise.
     */
    handle(action: UserAction, engine: GameEngine): boolean;
}
