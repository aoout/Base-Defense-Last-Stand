
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

export class SpatialHashGrid<T extends { x: number, y: number, radius: number, id: string }> {
    private cellSize: number;
    private cols: number = 0;
    private rows: number = 0;
    private cells: T[][] = []; 
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
        
        // Re-allocate buckets
        this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
        this.clear();
    }

    public clear() {
        // Zero-Allocation Clear: Reuse the existing arrays
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

        this.queryIds.clear();
        
        for (let y = iStartY; y <= iEndY; y++) {
            for (let x = iStartX; x <= iEndX; x++) {
                const index = x + y * this.cols;
                const cell = this.cells[index];
                
                if (cell) {
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
