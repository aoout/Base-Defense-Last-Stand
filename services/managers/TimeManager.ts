
export class TimeManager {
    public realTime: number = 0; // Wall clock time (for UI animations)
    public gameTime: number = 0; // Simulation time (pauses when game pauses)
    public delta: number = 0;

    constructor() {
        this.realTime = 0;
        this.gameTime = 0;
        this.delta = 0;
    }

    /**
     * Called once per frame with performance.now()
     */
    public update(currentRealTime: number) {
        if (this.realTime === 0) {
            this.realTime = currentRealTime;
        }
        this.delta = currentRealTime - this.realTime;
        this.realTime = currentRealTime;
    }

    /**
     * Advances simulation time. Only call this when game is NOT paused.
     */
    public tickGameTime() {
        this.gameTime += this.delta;
    }

    /**
     * Syncs state after a save load or hard reset
     */
    public sync(savedGameTime: number) {
        this.gameTime = savedGameTime;
        // realTime will auto-sync on next update()
    }
}
