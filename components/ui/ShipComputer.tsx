
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
    onFocus: () => void 
}> = ({ title, children, onClose, zIndex, onFocus }) => (
    <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#000080] border-2 border-gray-400 shadow-[10px_10px_0_rgba(0,0,0,0.5)] flex flex-col font-mono"
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

// --- SNAKE GAME LOGIC ---
const SNAKE_COLS = 30;
const SNAKE_ROWS = 20;
const CELL_SIZE = 20;

const SnakeGame: React.FC<{ onGameOver: (score: number) => void, t: any }> = ({ onGameOver, t }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAY' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    
    // Game Refs to avoid stale closures in loop
    const snakeRef = useRef([{x: 5, y: 10}]);
    const dirRef = useRef({x: 1, y: 0});
    const nextDirRef = useRef({x: 1, y: 0}); // Buffer for input
    const foodRef = useRef({x: 15, y: 10});
    const scoreRef = useRef(0);
    
    // Saved callback ref for the game loop
    const savedCallback = useRef<() => void>(() => {});

    const spawnFood = () => {
        let x = 0; let y = 0;
        let valid = false;
        while (!valid) {
            x = Math.floor(Math.random() * SNAKE_COLS);
            y = Math.floor(Math.random() * SNAKE_ROWS);
            valid = !snakeRef.current.some(s => s.x === x && s.y === y);
        }
        foodRef.current = {x, y};
    };

    const startGame = () => {
        snakeRef.current = [{x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}];
        dirRef.current = {x: 1, y: 0};
        nextDirRef.current = {x: 1, y: 0};
        spawnFood();
        scoreRef.current = 0;
        setScore(0);
        setGameState('PLAY');
        draw(); // Immediate draw
    };

    const stopGame = () => {
        setGameState('GAME_OVER');
        onGameOver(scoreRef.current);
    };

    const update = () => {
        const head = snakeRef.current[0];
        dirRef.current = nextDirRef.current;
        const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

        // Collision Check
        if (newHead.x < 0 || newHead.x >= SNAKE_COLS || newHead.y < 0 || newHead.y >= SNAKE_ROWS || 
            snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
            stopGame();
            return;
        }

        const newSnake = [newHead, ...snakeRef.current];
        
        // Eat Food
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            spawnFood();
        } else {
            newSnake.pop(); // Remove tail
        }

        snakeRef.current = newSnake;
        draw();
    };

    const draw = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, SNAKE_COLS * CELL_SIZE, SNAKE_ROWS * CELL_SIZE);

        // Grid (Subtle)
        ctx.strokeStyle = '#003300';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=SNAKE_COLS; i++) { ctx.moveTo(i*CELL_SIZE, 0); ctx.lineTo(i*CELL_SIZE, SNAKE_ROWS*CELL_SIZE); }
        for(let i=0; i<=SNAKE_ROWS; i++) { ctx.moveTo(0, i*CELL_SIZE); ctx.lineTo(SNAKE_COLS*CELL_SIZE, i*CELL_SIZE); }
        ctx.stroke();

        // Food
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(foodRef.current.x * CELL_SIZE + 2, foodRef.current.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

        // Snake
        ctx.fillStyle = '#00ff00';
        snakeRef.current.forEach(s => {
            ctx.fillRect(s.x * CELL_SIZE + 1, s.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        });
    };

    // Keep savedCallback up to date
    useEffect(() => {
        savedCallback.current = update;
    });

    // Game Loop Management
    useEffect(() => {
        if (gameState === 'PLAY') {
            const id = window.setInterval(() => {
                savedCallback.current();
            }, 100);
            return () => clearInterval(id);
        }
    }, [gameState]);

    // Input Handling
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState !== 'PLAY') return;
            // Prevent default scrolling for arrows
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            const { x, y } = dirRef.current;
            if (e.key === 'ArrowUp' && y === 0) nextDirRef.current = { x: 0, y: -1 };
            if (e.key === 'ArrowDown' && y === 0) nextDirRef.current = { x: 0, y: 1 };
            if (e.key === 'ArrowLeft' && x === 0) nextDirRef.current = { x: -1, y: 0 };
            if (e.key === 'ArrowRight' && x === 0) nextDirRef.current = { x: 1, y: 0 };
        };

        window.addEventListener('keydown', handleKey, { capture: true });
        // Initial draw
        if (gameState === 'START') setTimeout(draw, 0); // Defer draw slightly to ensure canvas is ready
        return () => {
            window.removeEventListener('keydown', handleKey, { capture: true });
        };
    }, [gameState]);

    // Redraw on Game Over to show state
    useEffect(() => {
        if (gameState === 'GAME_OVER') draw();
    }, [gameState]);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative border-4 border-gray-600 rounded">
                <canvas 
                    ref={canvasRef} 
                    width={SNAKE_COLS * CELL_SIZE} 
                    height={SNAKE_ROWS * CELL_SIZE}
                    className="block"
                />
                
                {gameState !== 'PLAY' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-green-500 font-mono">
                        {gameState === 'START' ? (
                            <>
                                <h1 className="text-4xl font-bold mb-4 glitch-text">PROTO_SIM.EXE</h1>
                                <button onClick={startGame} className="px-4 py-2 border-2 border-green-500 hover:bg-green-900 text-white animate-pulse">
                                    {t('SNAKE_START')}
                                </button>
                                <p className="mt-4 text-xs text-green-700">{t('SNAKE_CONTROLS')}</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold mb-2 text-red-500">{t('SNAKE_GAME_OVER')}</h1>
                                <p className="text-xl mb-6 text-white">{t('SNAKE_SCORE')}: {score}</p>
                                <button onClick={startGame} className="px-4 py-2 border-2 border-green-500 hover:bg-green-900 text-white">
                                    {t('SNAKE_RETRY')}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="text-xs text-green-800 font-mono self-start w-full text-center">
                VANGUARD ENTERTAINMENT SYSTEM v1.0
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
    const openWindow = (id: string, title: string, content: React.ReactNode) => {
        setWindows(prev => {
            const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex), 10);
            const newZ = maxZ + 1;
            
            const existing = prev.find(w => w.id === id);
            if (existing) {
                return prev.map(w => w.id === id ? { ...w, isOpen: true, zIndex: newZ } : w);
            }
            return [...prev, { id, title, content, isOpen: true, zIndex: newZ }];
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
        openWindow(
            'snake', 
            'PROTO_SIM.EXE', 
            <SnakeGame 
                t={t} 
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
            />
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
                    label="PROTO_SIM.EXE" 
                    icon="🐍" 
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
