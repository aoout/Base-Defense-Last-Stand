
import { useRef, useState, useEffect, useCallback } from 'react';

// Game Constants
export const SNAKE_COLS = 20;
export const SNAKE_ROWS = 25;
export const SNAKE_CELL_SIZE = 15;

export const TETRIS_COLS = 10;
export const TETRIS_ROWS = 20;
export const TETRIS_CELL_SIZE = 25;

const TETROMINOS = [
    { shape: [[1, 1, 1, 1]], color: '#00ffff' }, // I
    { shape: [[1, 1], [1, 1]], color: '#ffff00' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#aa00ff' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#ff7700' }, // L
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000ff' }, // J
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' }  // Z
];

export const useDualSimGame = (onGameOverCallback: (score: number) => void) => {
    const snakeCanvasRef = useRef<HTMLCanvasElement>(null);
    const tetrisCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [gameState, setGameState] = useState<'START' | 'PLAY' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);

    // --- SNAKE STATE ---
    const snakeRef = useRef([{x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12}]);
    const snakeDirRef = useRef({x: 0, y: -1});
    const nextSnakeDirRef = useRef({x: 0, y: -1});
    const foodRef = useRef({x: 5, y: 5});

    // --- TETRIS STATE ---
    const tetrisGridRef = useRef<number[][]>([]);
    const activePieceRef = useRef<{shape: number[][], x: number, y: number, colorId: number} | null>(null);
    const tetrisTickCounter = useRef(0);

    // --- LOGIC ---
    const initTetrisGrid = () => Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0));

    const spawnTetrisPiece = useCallback(() => {
        const typeIdx = Math.floor(Math.random() * TETROMINOS.length);
        const { shape } = TETROMINOS[typeIdx];
        activePieceRef.current = {
            shape,
            x: Math.floor(TETRIS_COLS / 2) - Math.ceil(shape[0].length / 2),
            y: 0,
            colorId: typeIdx + 1
        };
        // Check immediate collision
        if (checkTetrisCollision(0, 0, shape)) {
            return false;
        }
        return true;
    }, []);

    const spawnFood = useCallback(() => {
        let x = 0, y = 0, valid = false;
        while (!valid) {
            x = Math.floor(Math.random() * SNAKE_COLS);
            y = Math.floor(Math.random() * SNAKE_ROWS);
            valid = !snakeRef.current.some(s => s.x === x && s.y === y);
        }
        foodRef.current = {x, y};
    }, []);

    const checkTetrisCollision = (offX: number, offY: number, shape: number[][]) => {
        const p = activePieceRef.current;
        if (!p) return false;
        const grid = tetrisGridRef.current;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = p.x + c + offX;
                    const newY = p.y + r + offY;
                    if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS) return true;
                    if (newY >= 0 && grid[newY][newX]) return true;
                }
            }
        }
        return false;
    };

    const stopGame = useCallback(() => {
        setGameState('GAME_OVER');
        onGameOverCallback(scoreRef.current);
    }, [onGameOverCallback]);

    const lockTetrisPiece = useCallback(() => {
        const p = activePieceRef.current;
        if (!p) return;
        const grid = tetrisGridRef.current;
        
        for (let r = 0; r < p.shape.length; r++) {
            for (let c = 0; c < p.shape[r].length; c++) {
                if (p.shape[r][c]) {
                    const py = p.y + r;
                    const px = p.x + c;
                    if (py >= 0) grid[py][px] = p.colorId;
                }
            }
        }

        // Clear lines
        let linesCleared = 0;
        for (let r = TETRIS_ROWS - 1; r >= 0; r--) {
            if (grid[r].every(cell => cell !== 0)) {
                grid.splice(r, 1);
                grid.unshift(Array(TETRIS_COLS).fill(0));
                linesCleared++;
                r++;
            }
        }
        if (linesCleared > 0) {
            scoreRef.current += linesCleared * 100;
            setScore(scoreRef.current);
        }

        if (!spawnTetrisPiece()) {
            stopGame();
        }
    }, [spawnTetrisPiece, stopGame]);

    const rotateTetrisPiece = () => {
        const p = activePieceRef.current;
        if (!p) return;
        
        const oldShape = p.shape;
        const newShape = oldShape[0].map((_, colIndex) => oldShape.map(row => row[colIndex]).reverse());
        
        if (!checkTetrisCollision(0, 0, newShape)) {
            p.shape = newShape;
        } else {
            if (!checkTetrisCollision(-1, 0, newShape)) { p.x -= 1; p.shape = newShape; }
            else if (!checkTetrisCollision(1, 0, newShape)) { p.x += 1; p.shape = newShape; }
        }
    };

    const draw = useCallback(() => {
        // Draw Snake
        const sCtx = snakeCanvasRef.current?.getContext('2d');
        if (sCtx) {
            sCtx.fillStyle = '#000000';
            sCtx.fillRect(0, 0, SNAKE_COLS * SNAKE_CELL_SIZE, SNAKE_ROWS * SNAKE_CELL_SIZE);
            
            sCtx.strokeStyle = '#003300';
            sCtx.lineWidth = 1;
            sCtx.beginPath();
            for(let i=0; i<=SNAKE_COLS; i++) { sCtx.moveTo(i*SNAKE_CELL_SIZE, 0); sCtx.lineTo(i*SNAKE_CELL_SIZE, SNAKE_ROWS*SNAKE_CELL_SIZE); }
            for(let i=0; i<=SNAKE_ROWS; i++) { sCtx.moveTo(0, i*SNAKE_CELL_SIZE); sCtx.lineTo(SNAKE_COLS*SNAKE_CELL_SIZE, i*SNAKE_CELL_SIZE); }
            sCtx.stroke();

            sCtx.fillStyle = '#00ff00';
            snakeRef.current.forEach(s => {
                sCtx.fillRect(s.x * SNAKE_CELL_SIZE + 1, s.y * SNAKE_CELL_SIZE + 1, SNAKE_CELL_SIZE - 2, SNAKE_CELL_SIZE - 2);
            });

            sCtx.fillStyle = '#ff0000';
            sCtx.beginPath();
            const fx = foodRef.current.x * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE/2;
            const fy = foodRef.current.y * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE/2;
            sCtx.arc(fx, fy, SNAKE_CELL_SIZE/3, 0, Math.PI*2);
            sCtx.fill();
        }

        // Draw Tetris
        const tCtx = tetrisCanvasRef.current?.getContext('2d');
        if (tCtx) {
            tCtx.fillStyle = '#000000';
            tCtx.fillRect(0, 0, TETRIS_COLS * TETRIS_CELL_SIZE, TETRIS_ROWS * TETRIS_CELL_SIZE);

            tetrisGridRef.current.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell !== 0) {
                        tCtx.fillStyle = TETROMINOS[cell-1]?.color || '#fff';
                        tCtx.fillRect(c * TETRIS_CELL_SIZE + 1, r * TETRIS_CELL_SIZE + 1, TETRIS_CELL_SIZE - 2, TETRIS_CELL_SIZE - 2);
                    }
                });
            });

            const p = activePieceRef.current;
            if (p) {
                tCtx.fillStyle = TETROMINOS[p.colorId-1]?.color || '#fff';
                p.shape.forEach((row, r) => {
                    row.forEach((cell, c) => {
                        if (cell) {
                            tCtx.fillRect((p.x + c) * TETRIS_CELL_SIZE + 1, (p.y + r) * TETRIS_CELL_SIZE + 1, TETRIS_CELL_SIZE - 2, TETRIS_CELL_SIZE - 2);
                        }
                    });
                });
            }
            
            tCtx.strokeStyle = '#333333';
            tCtx.lineWidth = 1;
            tCtx.beginPath();
            for(let i=0; i<=TETRIS_COLS; i++) { tCtx.moveTo(i*TETRIS_CELL_SIZE, 0); tCtx.lineTo(i*TETRIS_CELL_SIZE, TETRIS_ROWS*TETRIS_CELL_SIZE); }
            for(let i=0; i<=TETRIS_ROWS; i++) { tCtx.moveTo(0, i*TETRIS_CELL_SIZE); tCtx.lineTo(TETRIS_COLS*TETRIS_CELL_SIZE, i*TETRIS_CELL_SIZE); }
            tCtx.stroke();
        }
    }, []);

    const startGame = () => {
        snakeRef.current = [{x: 10, y: 15}, {x: 10, y: 16}, {x: 10, y: 17}];
        snakeDirRef.current = {x: 0, y: -1};
        nextSnakeDirRef.current = {x: 0, y: -1};
        spawnFood();

        tetrisGridRef.current = initTetrisGrid();
        tetrisTickCounter.current = 0;
        spawnTetrisPiece();

        scoreRef.current = 0;
        setScore(0);
        setGameState('PLAY');
    };

    // --- GAME LOOP ---
    useEffect(() => {
        if (gameState !== 'PLAY') return;

        const loop = setInterval(() => {
            // Snake Logic
            const head = snakeRef.current[0];
            snakeDirRef.current = nextSnakeDirRef.current;
            const newHead = { x: head.x + snakeDirRef.current.x, y: head.y + snakeDirRef.current.y };

            if (newHead.x < 0 || newHead.x >= SNAKE_COLS || newHead.y < 0 || newHead.y >= SNAKE_ROWS || 
                snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
                stopGame();
                return;
            }

            const newSnake = [newHead, ...snakeRef.current];
            if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
                scoreRef.current += 10;
                setScore(scoreRef.current);
                spawnFood();
            } else {
                newSnake.pop();
            }
            snakeRef.current = newSnake;

            // Tetris Logic
            tetrisTickCounter.current++;
            if (tetrisTickCounter.current >= 4) {
                tetrisTickCounter.current = 0;
                if (!checkTetrisCollision(0, 1, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.y += 1;
                } else {
                    lockTetrisPiece();
                }
            }

            draw();
        }, 170); // Game Speed

        return () => clearInterval(loop);
    }, [gameState, draw, lockTetrisPiece, spawnFood, stopGame]);

    // --- INPUT HANDLING ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState !== 'PLAY') return;
            const key = e.key; 
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
                e.preventDefault();
            }

            if (key === 'ArrowUp' || key.toLowerCase() === 'w') {
                if (snakeDirRef.current.y === 0) nextSnakeDirRef.current = { x: 0, y: -1 };
                rotateTetrisPiece();
            }
            if (key === 'ArrowDown' || key.toLowerCase() === 's') {
                if (snakeDirRef.current.y === 0) nextSnakeDirRef.current = { x: 0, y: 1 };
                if (!checkTetrisCollision(0, 1, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.y += 1;
                } else {
                    lockTetrisPiece();
                }
            }
            if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
                if (snakeDirRef.current.x === 0) nextSnakeDirRef.current = { x: -1, y: 0 };
                if (!checkTetrisCollision(-1, 0, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.x -= 1;
                }
            }
            if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
                if (snakeDirRef.current.x === 0) nextSnakeDirRef.current = { x: 1, y: 0 };
                if (!checkTetrisCollision(1, 0, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.x += 1;
                }
            }
            draw();
        };

        window.addEventListener('keydown', handleKey);
        if (gameState === 'GAME_OVER') draw();
        
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, draw, lockTetrisPiece]);

    return {
        canvasRefA: snakeCanvasRef,
        canvasRefB: tetrisCanvasRef,
        score,
        gameState,
        startGame,
        stopGame
    };
};
