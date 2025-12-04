
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export class SpatialHashGrid<T extends { x: number, y: number, radius: number, id: string }> {
    private cellSize: number;
    private cols: number;
    private rows: number;
    private cells: T[][]; // Flat array of buckets
    private queryIds: Set<string>; // Reusable set for deduplication

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(WORLD_WIDTH / cellSize);
        this.rows = Math.ceil(WORLD_HEIGHT / cellSize);
        
        // Pre-allocate all buckets once
        this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
        this.queryIds = new Set();
    }

    public clear() {
        // Zero-Allocation Clear: Reuse the existing arrays, just reset length
        // This is much faster than creating new arrays or deleting keys from a Map
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].length = 0;
        }
        this.queryIds.clear();
    }

    public insert(item: T) {
        const startX = Math.floor((item.x - item.radius) / this.cellSize);
        const endX = Math.floor((item.x + item.radius) / this.cellSize);
        const startY = Math.floor((item.y - item.radius) / this.cellSize);
        const endY = Math.floor((item.y + item.radius) / this.cellSize);

        // Clamp values to grid boundaries to avoid out-of-bounds access
        const iStartX = Math.max(0, startX);
        const iEndX = Math.min(this.cols - 1, endX);
        const iStartY = Math.max(0, startY);
        const iEndY = Math.min(this.rows - 1, endY);

        for (let y = iStartY; y <= iEndY; y++) {
            for (let x = iStartX; x <= iEndX; x++) {
                // Integer math index calculation instead of string allocation "${x}:${y}"
                const index = x + y * this.cols;
                this.cells[index].push(item);
            }
        }
    }

    public query(x: number, y: number, range: number, outResults: T[]): T[] {
        const startX = Math.floor((x - range) / this.cellSize);
        const endX = Math.floor((x + range) / this.cellSize);
        const startY = Math.floor((y - range) / this.cellSize);
        const endY = Math.floor((y + range) / this.cellSize);

        // Clamp values
        const iStartX = Math.max(0, startX);
        const iEndX = Math.min(this.cols - 1, endX);
        const iStartY = Math.max(0, startY);
        const iEndY = Math.min(this.rows - 1, endY);

        this.queryIds.clear();
        // Caller is responsible for resetting outResults length (cache reuse pattern)

        for (let y = iStartY; y <= iEndY; y++) {
            for (let x = iStartX; x <= iEndX; x++) {
                const index = x + y * this.cols;
                const cell = this.cells[index];
                
                // Hot path optimization: simple for loop
                for (let i = 0; i < cell.length; i++) {
                    const item = cell[i];
                    if (!this.queryIds.has(item.id)) {
                        this.queryIds.add(item.id);
                        outResults.push(item);
                    }
                }
            }
        }
        return outResults;
    }
}
