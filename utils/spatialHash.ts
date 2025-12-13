
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export class SpatialHashGrid<T extends { x: number, y: number, radius: number, id: string }> {
    private cellSize: number;
    private cols: number = 0;
    private rows: number = 0;
    private cells: T[][] = []; 
    
    // Optimization: Persistent Set to avoid GC pressure during high-frequency queries
    private queryIds: Set<string>; 

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.queryIds = new Set();
        // Initialize with default size
        this.resize(WORLD_WIDTH, WORLD_HEIGHT);
    }

    public resize(width: number, height: number) {
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
        
        // Re-allocate buckets only if size changes drastically, 
        // but for safety in this engine, we just reset.
        // To optimize further, we could reuse existing arrays if length is sufficient.
        const totalCells = this.cols * this.rows;
        
        // If we already have enough cells, just clear them. If not, create new.
        if (this.cells.length < totalCells) {
            this.cells = new Array(totalCells).fill(null).map(() => []);
        } else {
            this.clear();
        }
    }

    public clear() {
        // Zero-Allocation Clear: Reuse the existing arrays
        // This is much faster than assigning []
        const len = this.cells.length;
        for (let i = 0; i < len; i++) {
            if (this.cells[i].length > 0) {
                this.cells[i].length = 0;
            }
        }
        // queryIds is cleared at start of query, but good practice to clear here too
        this.queryIds.clear();
    }

    public insert(item: T) {
        const startX = Math.floor((item.x - item.radius) / this.cellSize);
        const endX = Math.floor((item.x + item.radius) / this.cellSize);
        const startY = Math.floor((item.y - item.radius) / this.cellSize);
        const endY = Math.floor((item.y + item.radius) / this.cellSize);

        // Clamp values to grid boundaries
        const iStartX = Math.max(0, startX);
        const iEndX = Math.min(this.cols - 1, endX);
        const iStartY = Math.max(0, startY);
        const iEndY = Math.min(this.rows - 1, endY);

        for (let y = iStartY; y <= iEndY; y++) {
            for (let x = iStartX; x <= iEndX; x++) {
                const index = x + y * this.cols;
                // Safety check to ensure we don't access OOB if something went wrong
                if (this.cells[index]) {
                    this.cells[index].push(item);
                }
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

        // Reuse the Set instance
        this.queryIds.clear();
        
        for (let y = iStartY; y <= iEndY; y++) {
            for (let x = iStartX; x <= iEndX; x++) {
                const index = x + y * this.cols;
                const cell = this.cells[index];
                
                if (cell) {
                    const cellLen = cell.length;
                    for (let i = 0; i < cellLen; i++) {
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
