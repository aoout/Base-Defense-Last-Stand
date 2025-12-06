
import React from 'react';
import { CloseButton } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { useDualSimGame, SNAKE_COLS, SNAKE_ROWS, SNAKE_CELL_SIZE, TETRIS_COLS, TETRIS_ROWS, TETRIS_CELL_SIZE } from '../../hooks/useDualSimGame';
import { useShipOS } from '../../hooks/useShipOS';

interface ShipComputerProps {
    onClose: () => void;
    onCheat?: () => void;
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
        
        <div className="flex-1 bg-black p-4 overflow-auto text-green-500 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 relative">
            <div className="whitespace-pre-wrap font-mono h-full">
                {children}
            </div>
        </div>
    </div>
);

const DualSimGameUI: React.FC<{ onGameOver: (score: number) => void, onClose: () => void }> = ({ onGameOver, onClose }) => {
    const { canvasRefA, canvasRefB, score, gameState, startGame } = useDualSimGame(onGameOver);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 p-4">
            <div className="flex justify-between w-full max-w-4xl border-b-2 border-green-800 pb-2 mb-2">
                <div className="text-green-500 font-bold text-xl glitch-text">DUAL_PROTOCOL.SIM</div>
                <div className="text-white font-mono text-xl">SCORE: {score}</div>
            </div>

            <div className="flex flex-row gap-8 relative">
                <div className="flex flex-col items-center">
                    <div className="text-xs text-green-700 mb-1">MODULE A: SERPENT</div>
                    <canvas ref={canvasRefA} width={SNAKE_COLS * SNAKE_CELL_SIZE} height={SNAKE_ROWS * SNAKE_CELL_SIZE} className="border-2 border-green-700 shadow-[0_0_15px_rgba(0,255,0,0.2)]" />
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-xs text-cyan-700 mb-1">MODULE B: STACKER</div>
                    <canvas ref={canvasRefB} width={TETRIS_COLS * TETRIS_CELL_SIZE} height={TETRIS_ROWS * TETRIS_CELL_SIZE} className="border-2 border-cyan-700 shadow-[0_0_15px_rgba(0,255,255,0.2)]" />
                </div>

                {gameState !== 'PLAY' && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border border-white">
                        {gameState === 'START' ? (
                            <>
                                <h1 className="text-5xl font-black mb-4 text-white tracking-widest text-center"><span className="text-green-500">DUAL</span> <span className="text-cyan-500">CORE</span></h1>
                                <p className="text-xs text-gray-400 mb-8 max-w-sm text-center">WARNING: SHARED INPUT BUFFER DETECTED.<br/>WASD CONTROLS BOTH SIMULATIONS SIMULTANEOUSLY.</p>
                                <button onClick={startGame} className="px-8 py-3 bg-white text-black font-bold hover:bg-gray-300 tracking-widest">INITIATE</button>
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold mb-2 text-red-500">SYNC FAILURE</h1>
                                <p className="text-2xl mb-6 text-white font-mono">{score} PTS</p>
                                <button onClick={startGame} className="px-6 py-2 border-2 border-red-500 text-red-500 hover:bg-red-900/50 hover:text-white transition-colors mb-4">RETRY</button>
                                <button onClick={onClose} className="text-xs text-gray-500 hover:text-white underline">EXIT</button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="text-xs text-green-800 font-mono mt-2">INPUT: WASD / ARROWS [SHARED]</div>
        </div>
    );
};

export const ShipComputer: React.FC<ShipComputerProps> = ({ onClose }) => {
    const { t } = useLocale();
    const { engine } = useGame();
    const { booting, bootLog, windows, time, openWindow, closeWindow, focusWindow } = useShipOS(t);

    const renderFolder = (items: { label: string, icon: string, onClick: () => void }[]) => (
        <div className="grid grid-cols-4 gap-4">
            {items.map((item, idx) => <DesktopIcon key={idx} {...item} />)}
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
            'DUAL_PROTOCOL.SIM', 
            <DualSimGameUI 
                onClose={() => closeWindow('snake')}
                onGameOver={(score) => {
                    const reward = engine.spaceshipManager.claimSnakeReward(score);
                    if (reward > 0) {
                        setTimeout(() => {
                            openWindow('alert_reward', 'SYSTEM ALERT', (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <h2 className="text-xl font-bold text-yellow-400 mb-4">{t('SNAKE_REWARD_TITLE')}</h2>
                                    <p className="text-white mb-6 max-w-md">{t('SNAKE_REWARD_MSG')}</p>
                                    <div className="bg-blue-900/50 border border-blue-500 p-4 rounded mb-6">
                                        <div className="text-xs text-blue-300 mb-1">{t('SCRAPS_TRANSFER')}</div>
                                        <div className="text-3xl font-mono font-bold text-white">+{reward}</div>
                                    </div>
                                    <button onClick={() => closeWindow('alert_reward')} className="px-6 py-2 bg-gray-300 text-black font-bold border-2 border-white hover:bg-white">{t('ACKNOWLEDGE')}</button>
                                </div>
                            ));
                        }, 500);
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
            <div className="absolute inset-0 pointer-events-none z-[400] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-40"></div>
            
            <div className="p-8 grid grid-flow-col grid-rows-6 gap-8 w-max">
                <DesktopIcon label={t('OS_DESKTOP_OPS')} icon="📝" isFolder onClick={openOps} />
                <DesktopIcon label={t('OS_DESKTOP_NAV')} icon="🌐" isFolder onClick={openNav} />
                <DesktopIcon label={t('OS_DESKTOP_ARCHIVES')} icon="📁" isFolder onClick={openArchives} />
                <DesktopIcon label={t('OS_DESKTOP_KERNEL')} icon="⚙️" isFolder onClick={openKernel} />
                <DesktopIcon label="DUAL_SIM.EXE" icon="🕹️" onClick={openSnakeGame} />
            </div>

            {windows.map(w => w.isOpen && (
                <Window key={w.id} title={w.title} onClose={() => closeWindow(w.id)} zIndex={w.zIndex} onFocus={() => focusWindow(w.id)} className={w.className}>
                    {w.content}
                </Window>
            ))}

            <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 shadow-[0_-2px_5px_rgba(0,0,0,0.2)] z-[350]">
                <button onClick={onClose} className="h-8 px-4 flex items-center gap-1 bg-[#c0c0c0] border-2 border-b-black border-r-black border-t-white border-l-white active:border-t-black active:border-l-black active:border-b-white active:border-r-white font-bold">
                    <span className="w-4 h-4 bg-gradient-to-br from-green-400 to-blue-500 block"></span>
                    <span className="font-display tracking-wide">{t('OS_SHUTDOWN')}</span>
                </button>
                <div className="w-[2px] h-6 bg-gray-400 mx-2 shadow-[1px_0_0_white]"></div>
                <div className="flex-1 flex gap-1 overflow-x-auto">
                    {windows.filter(w => w.isOpen).map(w => {
                        const maxZ = windows.reduce((m, win) => win.isOpen ? Math.max(m, win.zIndex) : m, 0);
                        const isActive = w.zIndex === maxZ;
                        return (
                            <button key={w.id} onClick={() => focusWindow(w.id)} className={`h-8 px-4 max-w-[150px] truncate text-xs font-bold flex items-center ${isActive ? 'bg-[#e0e0e0] border-2 border-b-white border-r-white border-t-black border-l-black' : 'bg-[#c0c0c0] border-2 border-b-black border-r-black border-t-white border-l-white'}`}>
                                {w.title}
                            </button>
                        )
                    })}
                </div>
                <div className="h-8 px-4 bg-[#c0c0c0] border-2 border-b-white border-r-white border-t-gray-500 border-l-gray-500 flex items-center justify-center font-mono text-sm">{time}</div>
            </div>
        </div>
    );
};
