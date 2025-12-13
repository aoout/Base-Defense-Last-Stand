
import { GameEngine } from "../gameService";
import { UserAction, AppMode } from "../../types";
import { IInputStrategy } from "./IInputStrategy";
import { GameplayInputStrategy } from "./strategies/GameplayInputStrategy";
import { MapInputStrategy } from "./strategies/MapInputStrategy";
import { ShipInputStrategy } from "./strategies/ShipInputStrategy";

export class InputRouter {
    private engine: GameEngine;
    private strategies: Map<AppMode, IInputStrategy>;
    private defaultStrategy: IInputStrategy; // Fallback

    constructor(engine: GameEngine) {
        this.engine = engine;
        this.strategies = new Map();

        // Instantiate Strategies
        const gameplay = new GameplayInputStrategy();
        const map = new MapInputStrategy();
        const ship = new ShipInputStrategy();

        // Map Modes to Strategies
        this.strategies.set(AppMode.GAMEPLAY, gameplay);
        
        this.strategies.set(AppMode.EXPLORATION_MAP, map);
        
        // Ship Sub-systems all use the Ship Strategy (mostly for ESC navigation)
        this.strategies.set(AppMode.SPACESHIP_VIEW, ship);
        this.strategies.set(AppMode.ORBITAL_UPGRADES, ship);
        this.strategies.set(AppMode.CARAPACE_GRID, ship);
        this.strategies.set(AppMode.BIO_SEQUENCING, ship);
        this.strategies.set(AppMode.INFRASTRUCTURE_RESEARCH, ship);
        this.strategies.set(AppMode.SHIP_COMPUTER, ship);
        this.strategies.set(AppMode.PLANET_CONSTRUCTION, ship);
        // Heroic Zeal is accessible from Gameplay in Campaign, but behaves like a menu
        this.strategies.set(AppMode.HEROIC_ZEAL, ship);

        // Simple default for Start Menu (mostly mouse based, but ESC/Enter might be needed)
        this.defaultStrategy = {
            handle: (action) => { return false; } 
        };
    }

    public route(action: UserAction) {
        const mode = this.engine.state.appMode;
        const strategy = this.strategies.get(mode) || this.defaultStrategy;
        
        // Execute Strategy
        strategy.handle(action, this.engine);
    }
}
