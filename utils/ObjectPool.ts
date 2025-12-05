
/**
 * A generic object pool to reduce Garbage Collection pressure by reusing objects.
 */
export class ObjectPool<T> {
    private items: T[] = [];
    private factory: () => T;
    private reset?: (item: T) => void;

    constructor(factory: () => T, reset?: (item: T) => void) {
        this.factory = factory;
        this.reset = reset;
    }

    /**
     * Retrieves an item from the pool or creates a new one if empty.
     */
    public get(): T {
        let item: T;
        if (this.items.length > 0) {
            item = this.items.pop()!;
            if (this.reset) {
                this.reset(item);
            }
        } else {
            item = this.factory();
        }
        return item;
    }

    /**
     * Returns an item to the pool for future reuse.
     */
    public release(item: T): void {
        this.items.push(item);
    }

    /**
     * Current size of the reserve pool.
     */
    public get size(): number {
        return this.items.length;
    }
}

// High-performance monotonic counter for IDs
let idCounter = 0;

/**
 * Generates a unique, short ID without heavy string manipulation overhead.
 * Format: prefix-counter (e.g. "p-1045")
 */
export const generateId = (prefix: string = 'obj'): string => {
    return `${prefix}-${++idCounter}`;
};
