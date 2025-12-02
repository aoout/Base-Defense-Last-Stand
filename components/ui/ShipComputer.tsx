import React, { useState, useEffect } from 'react';
import { CloseButton } from './Shared';

interface ShipComputerProps {
    onClose: () => void;
    t: (key: string) => string;
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
        <div className="flex-1 bg-black p-4 overflow-auto text-green-500 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
            <div className="whitespace-pre-wrap font-mono">
                {children}
            </div>
        </div>
    </div>
);

export const ShipComputer: React.FC<ShipComputerProps> = ({ onClose, t, onCheat }) => {
    const [booting, setBooting] = useState(true);
    const [bootLog, setBootLog] = useState<string[]>([]);
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [topZ, setTopZ] = useState(10);
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

    const openWindow = (id: string, title: string, content: React.ReactNode) => {
        setTopZ(z => z + 1);
        setWindows(prev => {
            const existing = prev.find(w => w.id === id);
            if (existing) {
                return prev.map(w => w.id === id ? { ...w, isOpen: true, zIndex: topZ + 1 } : w);
            }
            return [...prev, { id, title, content, isOpen: true, zIndex: topZ + 1 }];
        });
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    };

    const focusWindow = (id: string) => {
        setTopZ(z => z + 1);
        setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: topZ + 1 } : w));
    };

    // File Content Generators
    const renderFolder = (items: { label: string, icon: string, onClick: () => void }[]) => (
        <div className="grid grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <DesktopIcon key={idx} {...item} />
            ))}
        </div>
    );

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
                    onClick={() => openWindow('ops', t('OS_DESKTOP_OPS'), t('FILE_OPS_BODY'))} 
                />
                <DesktopIcon 
                    label={t('OS_DESKTOP_NAV')} 
                    icon="🌐" 
                    onClick={() => openWindow('nav', t('OS_DESKTOP_NAV'), t('FILE_NAV_BODY'))} 
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
                
                <div className="flex-1 flex gap-1">
                    {windows.filter(w => w.isOpen).map(w => (
                        <button
                            key={w.id}
                            onClick={() => focusWindow(w.id)}
                            className={`
                                h-8 px-4 max-w-[150px] truncate text-xs font-bold flex items-center
                                ${w.zIndex === topZ 
                                    ? 'bg-[#e0e0e0] border-2 border-b-white border-r-white border-t-black border-l-black' // Depressed
                                    : 'bg-[#c0c0c0] border-2 border-b-black border-r-black border-t-white border-l-white'} // Raised
                            `}
                        >
                            {w.title}
                        </button>
                    ))}
                </div>

                <div className="h-8 px-4 bg-[#c0c0c0] border-2 border-b-white border-r-white border-t-gray-500 border-l-gray-500 flex items-center justify-center font-mono text-sm">
                    {time}
                </div>
            </div>
        </div>
    );
};