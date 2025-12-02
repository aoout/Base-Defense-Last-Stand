
export class TimeManager {
    public now: number = 0;
    public delta: number = 0;
    public scale: number = 1;

    constructor() {
        this.now = performance.now();
    }

    public update(realTime: number) {
        // In a more complex engine, we might pause accumulation here.
        // For now, we sync with performance.now() but route it through here 
        // so we can intercept or mock it later if needed.
        this.now = realTime;
    }

    /**
     * Resets the internal clock reference. 
     * Useful when loading a game to ensure 'now' is fresh.
     */
    public sync() {
        this.now = performance.now();
    }
}
