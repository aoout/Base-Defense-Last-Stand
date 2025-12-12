
/**
 * Advanced Random Number Generator
 * Provides deterministic (seeded) and non-deterministic random utilities
 * with semantic naming to improve code readability.
 */
export class RNG {
    private seed: number;

    constructor(seedStr?: string) {
        if (seedStr) {
            this.seed = this.hashString(seedStr);
        } else {
            this.seed = Math.random() * 0xFFFFFFFF;
        }
    }

    /** FNV-1a Hash implementation for seeding */
    private hashString(str: string): number {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    /** Returns a float between 0 and 1 */
    public next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }

    /** Returns a float between min (inclusive) and max (exclusive) */
    public float(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /** Returns an integer between min (inclusive) and max (inclusive) */
    public int(min: number, max: number): number {
        return Math.floor(this.float(min, max + 1));
    }

    /** Returns true if a random roll is less than probability (0.0 - 1.0) */
    public chance(probability: number): boolean {
        return this.next() < probability;
    }

    /** Picks a random element from an array */
    public pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }

    /** Weighted choice. Accepts array of { item: T, weight: number } */
    public weightedPick<T>(items: { item: T, weight: number }[]): T {
        const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
        let random = this.next() * totalWeight;
        
        for (const entry of items) {
            random -= entry.weight;
            if (random <= 0) return entry.item;
        }
        return items[items.length - 1].item; // Fallback
    }

    // --- STATIC INSTANCE FOR NON-DETERMINISTIC CALLS ---
    // Usage: RNG.global.int(1, 10);
    public static global = new class extends RNG {
        public next(): number { return Math.random(); }
    }();
}
