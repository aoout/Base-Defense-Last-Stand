
import { StatManager } from '../StatManager';

/**
 * Common interface for all Spaceship Sub-systems (Orbital, Bio, Tech, etc.).
 * Allows the SpaceshipManager to treat them uniformly for updates and stat application.
 */
export interface ISpaceshipSystem {
    /**
     * Unique identifier for the system (used for debugging or registry lookups).
     */
    readonly systemId: string;

    /**
     * Frame update loop.
     * @param dt Delta time in ms
     */
    update(dt: number): void;

    /**
     * Calculates and registers statistical modifiers with the central StatManager.
     * Each system is responsible for clearing its own previous stats (via source ID) before adding new ones.
     * @param stats The central StatManager instance
     */
    applyStats(stats: StatManager): void;
}
