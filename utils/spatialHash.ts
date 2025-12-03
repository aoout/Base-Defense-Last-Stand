
export class SpatialHashGrid<T extends { x: number, y: number, radius: number, id: string }> {
    private cellSize: number;
    private cells: Map<string, T[]>;
    private queryIds: Set<string>; // Reusable set for deduplication

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.queryIds = new Set();
    }

    public clear() {
        // Zero-Allocation Clear: Reuse the arrays in the map
        for (const cell of this.cells.values()) {
            cell.length = 0;
        }
        this.queryIds.clear();
    }

    public insert(item: T) {
        const startX = Math.floor((item.x - item.radius) / this.cellSize);
        const endX = Math.floor((item.x + item.radius) / this.cellSize);
        const startY = Math.floor((item.y - item.radius) / this.cellSize);
        const endY = Math.floor((item.y + item.radius) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x}:${y}`;
                let cell = this.cells.get(key);
                if (!cell) {
                    cell = [];
                    this.cells.set(key, cell);
                }
                cell.push(item);
            }
        }
    }

    public query(x: number, y: number, range: number, outResults: T[]): T[] {
        const startX = Math.floor((x - range) / this.cellSize);
        const endX = Math.floor((x + range) / this.cellSize);
        const startY = Math.floor((y - range) / this.cellSize);
        const endY = Math.floor((y + range) / this.cellSize);

        this.queryIds.clear();
        // We do not clear outResults here; the caller is responsible for resetting length if they want a fresh list.
        // Usually caller does: cache.length = 0; grid.query(..., cache);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                const cell = this.cells.get(`${cx}:${cy}`);
                if (cell) {
                    // Standard for loop is slightly faster than for..of for simple arrays in hot paths
                    for (let i = 0; i < cell.length; i++) {
                        const item = cell[i];
                        if (!this.queryIds.has(item.id)) {
                            this.queryIds.add(item.id);
                            outResults.push(item);
                        }
                    }
                }
            }
        }
        return outResults;
    }
}
