
import React, { useState, useEffect, useRef } from 'react';
import { CloseButton } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

interface ShipComputerProps {
    onClose: () => void;
    onCheat?: () => void;
}

interface WindowState {
    id: string;
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
    zIndex: number;
    // New prop for dynamic sizing
    className?: string;
}

const DesktopIcon: React.FC<{ label: string, icon: string, onClick: () => void, isFolder?: boolean }> = ({ label, icon, onClick, isFolder }) => (
    <div 
        className="flex flex-col items-center gap-1 w-24 p-2 hover:bg-white/10 rounded cursor-pointer group transition-colors"
        onClick={onClick}
    >
        <div className={`text-4xl ${isFolder ? 'text-yellow-400 group-hover:text-yellow-200' : 'text-cyan-400 group-hover:text-cyan-200'} drop-shadow-md`}>
            {icon}
        </div>
        <span className="text-[12px] text-white font-display text-center bg-black/50 px-1 rounded leading-tight group-hover:bg-blue-900/80 tracking-wide">
            {label}
        </span>
    </div>
);

const Window: React.FC<{ 
    title: string, 
    children: React.ReactNode, 
    onClose: () => void, 
    zIndex: number,
    onFocus: () => void,
    className?: string
}> = ({ title, children, onClose, zIndex, onFocus, className }) => (
    <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#000080] border-2 border-gray-400 shadow-[10px_10px_0_rgba(0,0,0,0.5)] flex flex-col font-mono ${className || 'w-[700px] h-[500px]'}`}
        style={{ zIndex }}
        onMouseDown={onFocus}
    >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-2 py-1 flex justify-between items-center select-none cursor-move border-b-2 border-gray-400">
            <span className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                <span>TERMINAL://{title}</span>
            </span>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="bg-gray-300 text-black px-2 text-xs border-2 border-b-black border-r-black border-t-white border-l-white hover:bg-red-500 hover:text-white active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
            >
                X
            </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-black p-4 overflow-auto text-green-500 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 relative">
            <div className="whitespace-pre-wrap font-mono h-full">
                {children}
            </div>
        </div>
    </div>
);

// --- DUAL SIM GAME LOGIC (Snake + Tetris) ---
const SNAKE_COLS = 20;
const SNAKE_ROWS = 25;
const SNAKE_CELL_SIZE = 15;

const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_CELL_SIZE = 25;

// Tetromino Definitions
const TETROMINOS = [
    { shape: [[1, 1, 1, 1]], color: '#00ffff' }, // I
    { shape: [[1, 1], [1, 1]], color: '#ffff00' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#aa00ff' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#ff7700' }, // L
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000ff' }, // J
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff00' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0000' }  // Z
];

const DualSimGame: React.FC<{ onGameOver: (score: number) => void, onClose: () => void, t: any }> = ({ onGameOver, onClose, t }) => {
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
    const tetrisGridRef = useRef<number[][]>([]); // 0 = empty, 1 = occupied
    const activePieceRef = useRef<{shape: number[][], x: number, y: number, colorId: number} | null>(null);
    const tetrisTickCounter = useRef(0);

    // Helpers
    const initTetrisGrid = () => Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0));
    
    const spawnTetrisPiece = () => {
        const typeIdx = Math.floor(Math.random() * TETROMINOS.length);
        const { shape } = TETROMINOS[typeIdx];
        activePieceRef.current = {
            shape,
            x: Math.floor(TETRIS_COLS / 2) - Math.ceil(shape[0].length / 2),
            y: 0,
            colorId: typeIdx + 1 // 1-based ID for colors
        };
        // Check immediate collision (Game Over)
        if (checkTetrisCollision(0, 0, shape)) {
            return false;
        }
        return true;
    };

    const spawnFood = () => {
        let x = 0, y = 0, valid = false;
        while (!valid) {
            x = Math.floor(Math.random() * SNAKE_COLS);
            y = Math.floor(Math.random() * SNAKE_ROWS);
            valid = !snakeRef.current.some(s => s.x === x && s.y === y);
        }
        foodRef.current = {x, y};
    };

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

    const lockTetrisPiece = () => {
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
                r++; // Recheck same row index
            }
        }
        if (linesCleared > 0) {
            scoreRef.current += linesCleared * 100;
            setScore(scoreRef.current);
        }

        if (!spawnTetrisPiece()) {
            stopGame();
        }
    };

    const rotateTetrisPiece = () => {
        const p = activePieceRef.current;
        if (!p) return;
        
        const oldShape = p.shape;
        const newShape = oldShape[0].map((_, colIndex) => oldShape.map(row => row[colIndex]).reverse());
        
        if (!checkTetrisCollision(0, 0, newShape)) {
            p.shape = newShape;
        } else {
            // Wall Kick attempt (simple)
            if (!checkTetrisCollision(-1, 0, newShape)) { p.x -= 1; p.shape = newShape; }
            else if (!checkTetrisCollision(1, 0, newShape)) { p.x += 1; p.shape = newShape; }
        }
    };

    const startGame = () => {
        // Init Snake
        snakeRef.current = [{x: 10, y: 15}, {x: 10, y: 16}, {x: 10, y: 17}];
        snakeDirRef.current = {x: 0, y: -1};
        nextSnakeDirRef.current = {x: 0, y: -1};
        spawnFood();

        // Init Tetris
        tetrisGridRef.current = initTetrisGrid();
        tetrisTickCounter.current = 0;
        spawnTetrisPiece();

        scoreRef.current = 0;
        setScore(0);
        setGameState('PLAY');
    };

    const stopGame = () => {
        setGameState('GAME_OVER');
        onGameOver(scoreRef.current);
    };

    // --- MAIN LOOP ---
    useEffect(() => {
        if (gameState !== 'PLAY') return;

        const loop = setInterval(() => {
            // 1. UPDATE SNAKE
            const head = snakeRef.current[0];
            snakeDirRef.current = nextSnakeDirRef.current;
            const newHead = { x: head.x + snakeDirRef.current.x, y: head.y + snakeDirRef.current.y };

            // Collision: Walls or Self
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

            // 2. UPDATE TETRIS (Gravity every 4 ticks)
            tetrisTickCounter.current++;
            if (tetrisTickCounter.current >= 4) {
                tetrisTickCounter.current = 0;
                if (!checkTetrisCollision(0, 1, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.y += 1;
                } else {
                    lockTetrisPiece();
                }
            }

            // Draw Both
            draw();

        }, 170); // 170ms tick (slower than 120ms for better playability)

        return () => clearInterval(loop);
    }, [gameState]);

    // --- INPUT ---
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState !== 'PLAY') return;
            const key = e.key; // e.g. "w", "ArrowUp"
            
            // Prevent default scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
                e.preventDefault();
            }

            // --- UNIFIED CONTROLS ---
            
            // UP / W: Snake UP, Tetris ROTATE
            if (key === 'ArrowUp' || key.toLowerCase() === 'w') {
                if (snakeDirRef.current.y === 0) nextSnakeDirRef.current = { x: 0, y: -1 };
                rotateTetrisPiece();
            }
            // DOWN / S: Snake DOWN, Tetris DROP (Fast)
            if (key === 'ArrowDown' || key.toLowerCase() === 's') {
                if (snakeDirRef.current.y === 0) nextSnakeDirRef.current = { x: 0, y: 1 };
                // Tetris soft drop
                if (!checkTetrisCollision(0, 1, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.y += 1;
                } else {
                    lockTetrisPiece();
                }
            }
            // LEFT / A: Snake LEFT, Tetris MOVE LEFT
            if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
                if (snakeDirRef.current.x === 0) nextSnakeDirRef.current = { x: -1, y: 0 };
                if (!checkTetrisCollision(-1, 0, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.x -= 1;
                }
            }
            // RIGHT / D: Snake RIGHT, Tetris MOVE RIGHT
            if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
                if (snakeDirRef.current.x === 0) nextSnakeDirRef.current = { x: 1, y: 0 };
                if (!checkTetrisCollision(1, 0, activePieceRef.current?.shape || [])) {
                    if (activePieceRef.current) activePieceRef.current.x += 1;
                }
            }
            
            // Force redraw immediately for responsiveness
            draw();
        };

        window.addEventListener('keydown', handleKey);
        // Initial draw
        if (gameState === 'START') setTimeout(draw, 50);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState]);

    const draw = () => {
        // Draw Snake
        const sCtx = snakeCanvasRef.current?.getContext('2d');
        if (sCtx) {
            sCtx.fillStyle = '#000000';
            sCtx.fillRect(0, 0, SNAKE_COLS * SNAKE_CELL_SIZE, SNAKE_ROWS * SNAKE_CELL_SIZE);
            
            // Grid Lines
            sCtx.strokeStyle = '#003300';
            sCtx.lineWidth = 1;
            sCtx.beginPath();
            for(let i=0; i<=SNAKE_COLS; i++) { sCtx.moveTo(i*SNAKE_CELL_SIZE, 0); sCtx.lineTo(i*SNAKE_CELL_SIZE, SNAKE_ROWS*SNAKE_CELL_SIZE); }
            for(let i=0; i<=SNAKE_ROWS; i++) { sCtx.moveTo(0, i*SNAKE_CELL_SIZE); sCtx.lineTo(SNAKE_COLS*SNAKE_CELL_SIZE, i*SNAKE_CELL_SIZE); }
            sCtx.stroke();

            // Snake Body
            sCtx.fillStyle = '#00ff00';
            snakeRef.current.forEach(s => {
                sCtx.fillRect(s.x * SNAKE_CELL_SIZE + 1, s.y * SNAKE_CELL_SIZE + 1, SNAKE_CELL_SIZE - 2, SNAKE_CELL_SIZE - 2);
            });

            // Food
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

            // Locked Blocks
            tetrisGridRef.current.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell !== 0) {
                        tCtx.fillStyle = TETROMINOS[cell-1]?.color || '#fff';
                        tCtx.fillRect(c * TETRIS_CELL_SIZE + 1, r * TETRIS_CELL_SIZE + 1, TETRIS_CELL_SIZE - 2, TETRIS_CELL_SIZE - 2);
                    }
                });
            });

            // Active Piece
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
            
            // Grid Overlay
            tCtx.strokeStyle = '#333333';
            tCtx.lineWidth = 1;
            tCtx.beginPath();
            for(let i=0; i<=TETRIS_COLS; i++) { tCtx.moveTo(i*TETRIS_CELL_SIZE, 0); tCtx.lineTo(i*TETRIS_CELL_SIZE, TETRIS_ROWS*TETRIS_CELL_SIZE); }
            for(let i=0; i<=TETRIS_ROWS; i++) { tCtx.moveTo(0, i*TETRIS_CELL_SIZE); tCtx.lineTo(TETRIS_COLS*TETRIS_CELL_SIZE, i*TETRIS_CELL_SIZE); }
            tCtx.stroke();
        }
    };

    // Game Over redrawing
    useEffect(() => {
        if (gameState === 'GAME_OVER') draw();
    }, [gameState]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 p-4">
            
            {/* Header */}
            <div className="flex justify-between w-full max-w-4xl border-b-2 border-green-800 pb-2 mb-2">
                <div className="text-green-500 font-bold text-xl glitch-text">DUAL_PROTOCOL.SIM</div>
                <div className="text-white font-mono text-xl">SCORE: {score}</div>
            </div>

            <div className="flex flex-row gap-8 relative">
                
                {/* Left: Snake */}
                <div className="flex flex-col items-center">
                    <div className="text-xs text-green-700 mb-1">MODULE A: SERPENT</div>
                    <canvas 
                        ref={snakeCanvasRef} 
                        width={SNAKE_COLS * SNAKE_CELL_SIZE} 
                        height={SNAKE_ROWS * SNAKE_CELL_SIZE}
                        className="border-2 border-green-700 shadow-[0_0_15px_rgba(0,255,0,0.2)]"
                    />
                </div>

                {/* Right: Tetris */}
                <div className="flex flex-col items-center">
                    <div className="text-xs text-cyan-700 mb-1">MODULE B: STACKER</div>
                    <canvas 
                        ref={tetrisCanvasRef} 
                        width={TETRIS_COLS * TETRIS_CELL_SIZE} 
                        height={TETRIS_ROWS * TETRIS_CELL_SIZE}
                        className="border-2 border-cyan-700 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    />
                </div>

                {/* Overlay UI */}
                {gameState !== 'PLAY' && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border border-white">
                        {gameState === 'START' ? (
                            <>
                                <h1 className="text-5xl font-black mb-4 text-white tracking-widest text-center">
                                    <span className="text-green-500">DUAL</span> <span className="text-cyan-500">CORE</span>
                                </h1>
                                <p className="text-xs text-gray-400 mb-8 max-w-sm text-center">
                                    WARNING: SHARED INPUT BUFFER DETECTED.<br/>
                                    WASD CONTROLS BOTH SIMULATIONS SIMULTANEOUSLY.
                                </p>
                                <button onClick={startGame} className="px-8 py-3 bg-white text-black font-bold hover:bg-gray-300 tracking-widest">
                                    INITIATE
                                </button>
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold mb-2 text-red-500">SYNC FAILURE</h1>
                                <p className="text-2xl mb-6 text-white font-mono">{score} PTS</p>
                                <button onClick={startGame} className="px-6 py-2 border-2 border-red-500 text-red-500 hover:bg-red-900/50 hover:text-white transition-colors mb-4">
                                    RETRY
                                </button>
                                <button onClick={onClose} className="text-xs text-gray-500 hover:text-white underline">
                                    EXIT
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="text-xs text-green-800 font-mono mt-2">
                INPUT: WASD / ARROWS [SHARED]
            </div>
        </div>
    );
};

export const ShipComputer: React.FC<ShipComputerProps> = ({ onClose, onCheat }) => {
    const { t } = useLocale();
    const { engine } = useGame();
    const [booting, setBooting] = useState(true);
    const [bootLog, setBootLog] = useState<string[]>([]);
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [time, setTime] = useState("");

    // Boot Sequence
    useEffect(() => {
        const logs = [
            t('OS_BOOT'),
            t('OS_CHECK_MEM'),
            t('OS_MOUNT_FS'),
            t('OS_EST_LINK'),
            t('OS_LOAD_MODS'),
            t('OS_AUTH'),
            t('OS_ACCESS')
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setBootLog(prev => [...prev, logs[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setBooting(false), 500);
            }
        }, 150);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            const d = new Date();
            setTime(d.toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Optimized openWindow: dynamically calculates max Z from current state
    const openWindow = (id: string, title: string, content: React.ReactNode, className?: string) => {
        setWindows(prev => {
            const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex), 10);
            const newZ = maxZ + 1;
            
            const existing = prev.find(w => w.id === id);
            if (existing) {
                return prev.map(w => w.id === id ? { ...w, isOpen: true, zIndex: newZ, className } : w);
            }
            return [...prev, { id, title, content, isOpen: true, zIndex: newZ, className }];
        });
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    };

    // Optimized focusWindow: dynamically calculates max Z
    const focusWindow = (id: string) => {
        setWindows(prev => {
            const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex), 10);
            const target = prev.find(w => w.id === id);
            
            // Optimization: If already top, do nothing
            if (target && target.zIndex === maxZ) return prev;

            const newZ = maxZ + 1;
            return prev.map(w => w.id === id ? { ...w, zIndex: newZ } : w);
        });
    };

    // File Content Generators
    const renderFolder = (items: { label: string, icon: string, onClick: () => void }[]) => (
        <div className="grid grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <DesktopIcon key={idx} {...item} />
            ))}
        </div>
    );

    const openOps = () => {
        const files = [
            { label: "neural_calib.doc", icon: "📋", onClick: () => openWindow('ops1', 'neural_calibration.doc', t('FILE_OPS_1_BODY')) },
            { label: "armory_specs.db", icon: "📊", onClick: () => openWindow('ops2', 'armory_manifest.db', t('FILE_OPS_2_BODY')) },
            { label: "mod_protocol.man", icon: "🔧", onClick: () => openWindow('ops3', 'modular_modification.man', t('FILE_OPS_3_BODY')) },
            { label: "sentry_grid.blue", icon: "🏗", onClick: () => openWindow('ops4', 'turret_schematic.blue', t('FILE_OPS_4_BODY')) },
        ];
        openWindow('ops_folder', t('OS_DESKTOP_OPS'), renderFolder(files));
    };

    const openNav = () => {
        const files = [
            { label: "nav_manual.pdf", icon: "🗺️", onClick: () => openWindow('nav1', 'navigation_manual.pdf', t('FILE_NAV_1_BODY')) },
            { label: "bunker_specs.cad", icon: "🛡️", onClick: () => openWindow('nav2', 'bunker_specs.cad', t('FILE_NAV_2_BODY')) },
            { label: "xeno_anatomy.bio", icon: "🧬", onClick: () => openWindow('nav3', 'xeno_anatomy.bio', t('FILE_NAV_3_BODY')) },
            { label: "orbital_uplink.net", icon: "📡", onClick: () => openWindow('nav4', 'orbital_uplink.net', t('FILE_NAV_4_BODY')) },
            { label: "aero_shield.sim", icon: "🔥", onClick: () => openWindow('nav5', 'aero_shield.sim', t('FILE_NAV_5_BODY')) },
            { label: "gene_splicer.seq", icon: "🔬", onClick: () => openWindow('nav6', 'gene_splicer.seq', t('FILE_NAV_6_BODY')) },
        ];
        openWindow('nav_folder', t('OS_DESKTOP_NAV'), renderFolder(files));
    };

    const openArchives = () => {
        const files = [
            { label: "history_01.txt", icon: "📄", onClick: () => openWindow('hist1', 'history_01.txt', t('ARCHIVE_0_CONTENT')) },
            { label: "vanguard.log", icon: "📄", onClick: () => openWindow('van1', 'vanguard.log', t('ARCHIVE_1_CONTENT')) },
            { label: "printing.tech", icon: "📄", onClick: () => openWindow('mol1', 'molecular_printing.tech', t('ARCHIVE_2_CONTENT')) },
            { label: "neurolink.med", icon: "📄", onClick: () => openWindow('neu1', 'neuro_link_warning.med', t('ARCHIVE_3_CONTENT')) },
        ];
        openWindow('archives', t('OS_DESKTOP_ARCHIVES'), renderFolder(files));
    };

    const openKernel = () => {
        const files = [
            { label: "spawn_logic.js", icon: "💾", onClick: () => openWindow('kern1', 'spawn_logic.js', t('KERNEL_0_CONTENT')) },
            { label: "bio_scaling.sim", icon: "💾", onClick: () => openWindow('kern2', 'biological_scaling.sim', t('KERNEL_1_CONTENT')) },
            { label: "armor_phys.dat", icon: "💾", onClick: () => openWindow('kern3', 'armor_physics.dat', t('KERNEL_2_CONTENT')) },
            { label: "lure_calc.xls", icon: "📊", onClick: () => openWindow('kern4', 'lure_economy.xls', t('KERNEL_3_CONTENT')) },
        ];
        openWindow('kernel', t('OS_DESKTOP_KERNEL'), renderFolder(files));
    };

    const openSnakeGame = () => {
        // Pass a larger window size className
        openWindow(
            'snake', 
            'DUAL_PROTOCOL.SIM', 
            <DualSimGame 
                t={t}
                onClose={() => closeWindow('snake')}
                onGameOver={(score) => {
                    // Try to claim reward
                    const reward = engine.spaceshipManager.claimSnakeReward(score);
                    if (reward > 0) {
                        // Open Reward Notification Window immediately
                        setTimeout(() => {
                            openWindow(
                                'alert_reward', 
                                'SYSTEM ALERT', 
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <h2 className="text-xl font-bold text-yellow-400 mb-4">{t('SNAKE_REWARD_TITLE')}</h2>
                                    <p className="text-white mb-6 max-w-md">{t('SNAKE_REWARD_MSG')}</p>
                                    <div className="bg-blue-900/50 border border-blue-500 p-4 rounded mb-6">
                                        <div className="text-xs text-blue-300 mb-1">{t('SCRAPS_TRANSFER')}</div>
                                        <div className="text-3xl font-mono font-bold text-white">+{reward}</div>
                                    </div>
                                    <button 
                                        onClick={() => closeWindow('alert_reward')} 
                                        className="px-6 py-2 bg-gray-300 text-black font-bold border-2 border-white hover:bg-white"
                                    >
                                        {t('ACKNOWLEDGE')}
                                    </button>
                                </div>
                            );
                        }, 500); // Small delay for visual pacing
                    }
                }} 
            />,
            'w-[900px] h-[600px]'
        );
    };

    if (booting) {
        return (
            <div className="absolute inset-0 bg-black z-[300] font-mono p-12 text-green-500 text-sm">
                {bootLog.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
                <div className="animate-pulse">_</div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-[300] bg-[#008080] pointer-events-auto overflow-hidden select-none">
            {/* CRT Effect */}
            <div className="absolute inset-0 pointer-events-none z-[400] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-40"></div>
            
            {/* Desktop Icons */}
            <div className="p-8 grid grid-flow-col grid-rows-6 gap-8 w-max">
                <DesktopIcon 
                    label={t('OS_DESKTOP_OPS')} 
                    icon="📝" 
                    isFolder
                    onClick={openOps} 
                />
                <DesktopIcon 
                    label={t('OS_DESKTOP_NAV')} 
                    icon="🌐"
                    isFolder 
                    onClick={openNav} 
                />
                <DesktopIcon 
                    label={t('OS_DESKTOP_ARCHIVES')} 
                    icon="📁" 
                    isFolder 
                    onClick={openArchives} 
                />
                <DesktopIcon 
                    label={t('OS_DESKTOP_KERNEL')} 
                    icon="⚙️" 
                    isFolder 
                    onClick={openKernel} 
                />
                <DesktopIcon 
                    label="DUAL_SIM.EXE" 
                    icon="🕹️" 
                    onClick={openSnakeGame} 
                />
            </div>

            {/* Windows */}
            {windows.map(w => w.isOpen && (
                <Window 
                    key={w.id} 
                    title={w.title} 
                    onClose={() => closeWindow(w.id)} 
                    zIndex={w.zIndex}
                    onFocus={() => focusWindow(w.id)}
                    className={w.className}
                >
                    {w.content}
                </Window>
            ))}

            {/* Taskbar */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 shadow-[0_-2px_5px_rgba(0,0,0,0.2)] z-[350]">
                <button 
                    onClick={onClose}
                    className="h-8 px-4 flex items-center gap-1 bg-[#c0c0c0] border-2 border-b-black border-r-black border-t-white border-l-white active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold"
                >
                    <span className="w-4 h-4 bg-gradient-to-br from-green-400 to-blue-500 block"></span>
                    <span className="font-display tracking-wide">{t('OS_SHUTDOWN')}</span>
                </button>
                
                <div className="w-[2px] h-6 bg-gray-400 mx-2 shadow-[1px_0_0_white]"></div>
                
                {/* Simplified Taskbar: Just shows open window titles */}
                <div className="flex-1 flex gap-1 overflow-x-auto">
                    {windows.filter(w => w.isOpen).map(w => {
                        // Find max Z to see if this is active
                        const maxZ = windows.reduce((m, win) => win.isOpen ? Math.max(m, win.zIndex) : m, 0);
                        const isActive = w.zIndex === maxZ;
                        
                        return (
                            <button
                                key={w.id}
                                onClick={() => focusWindow(w.id)}
                                className={`
                                    h-8 px-4 max-w-[150px] truncate text-xs font-bold flex items-center
                                    ${isActive
                                        ? 'bg-[#e0e0e0] border-2 border-b-white border-r-white border-t-black border-l-black' // Depressed
                                        : 'bg-[#c0c0c0] border-2 border-b-black border-r-black border-t-white border-l-white'} // Raised
                                `}
                            >
                                {w.title}
                            </button>
                        )
                    })}
                </div>

                <div className="h-8 px-4 bg-[#c0c0c0] border-2 border-b-white border-r-white border-t-gray-500 border-l-gray-500 flex items-center justify-center font-mono text-sm">
                    {time}
                </div>
            </div>
        </div>
    );
};
