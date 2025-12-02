
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloseButton, WeaponIcon } from './Shared';
import { WeaponType } from '../../types';

interface ExplorationManualProps {
    onClose: () => void;
    onCheat: () => void;
    t: (key: string) => string;
}

const TabButton: React.FC<{ id: string, label: string, active: boolean, onClick: () => void }> = ({ id, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-6 py-4 text-xs font-bold tracking-[0.2em] transition-all border-l-4 relative overflow-hidden group
            ${active 
                ? 'bg-cyan-900/30 text-cyan-300 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]' 
                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900 hover:border-slate-700'}
        `}
    >
        <span className="relative z-10">{label}</span>
        {active && <div className="absolute inset-0 bg-cyan-400/5 animate-pulse z-0"></div>}
    </button>
);

const SubTabButton: React.FC<{ label: string, active: boolean, onClick: () => void, colorClass?: string }> = ({ label, active, onClick, colorClass = "cyan" }) => {
    const activeClass = colorClass === 'red' ? 'bg-red-900/40 text-red-300 border-red-500' : 'bg-cyan-900/40 text-cyan-300 border-cyan-500';
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-2 text-xs font-bold tracking-widest border-b-2 transition-all ${active ? activeClass : 'text-slate-600 border-slate-800 hover:text-slate-400'}`}
        >
            {label}
        </button>
    );
};

// Component that types out text character by character
const TypewriterText: React.FC<{ text: string, speed?: number, className?: string }> = ({ text, speed = 10, className }) => {
    const [displayedText, setDisplayedText] = useState("");
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayedText("");
        indexRef.current = 0;
        
        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText((prev) => prev + text.charAt(indexRef.current));
                indexRef.current++;
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    // Click to skip functionality via parent usually, but here we can just let it run or click to show all (simple implementation)
    const finish = () => {
        if (indexRef.current < text.length) {
            setDisplayedText(text);
            indexRef.current = text.length;
        }
    }

    return (
        <span className={className} onClick={finish}>
            {displayedText}
            {indexRef.current < text.length && <span className="animate-pulse">_</span>}
        </span>
    );
}

const LoreCard: React.FC<{ title: string, bodyKey: string, t: any }> = ({ title, bodyKey, t }) => {
    const [decrypted, setDecrypted] = useState(false);

    return (
        <div className={`border border-slate-700 bg-slate-900/50 p-4 transition-all duration-500 ${decrypted ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <div className="text-cyan-400 font-bold text-sm tracking-widest uppercase">{title}</div>
                {!decrypted && (
                    <button 
                        onClick={() => setDecrypted(true)}
                        className="text-[10px] bg-cyan-900/50 text-cyan-300 px-2 py-1 border border-cyan-700 hover:bg-cyan-500 hover:text-black transition-colors"
                    >
                        {t('DECRYPT_BTN')}
                    </button>
                )}
            </div>
            
            <div className="relative overflow-hidden transition-all duration-700" style={{ maxHeight: decrypted ? '500px' : '40px' }}>
                {!decrypted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm z-10 text-red-500 font-mono text-xs tracking-widest animate-pulse">
                        {t('ENCRYPTED')}
                    </div>
                )}
                {decrypted ? (
                    <TypewriterText text={t(bodyKey)} speed={5} className="text-slate-300 text-xs font-mono leading-relaxed text-justify" />
                ) : (
                    <p className="text-slate-300 text-xs font-mono leading-relaxed text-justify opacity-20 blur-sm">
                        {t(bodyKey)}
                    </p>
                )}
            </div>
        </div>
    );
};

const KeyboardKey: React.FC<{ k: string, label: string, active?: boolean }> = ({ k, label, active }) => (
    <div className={`
        flex flex-col items-center justify-center p-2 rounded border-2 transition-all cursor-default group
        ${active ? 'border-cyan-500 bg-cyan-900/40 shadow-[0_0_15px_cyan]' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}
    `}>
        <div className={`font-mono font-black text-xl mb-1 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{k}</div>
        <div className={`text-[8px] uppercase tracking-wider text-center leading-tight ${active ? 'text-cyan-300' : 'text-slate-600 group-hover:text-slate-400'}`}>{label}</div>
    </div>
);

const TacticalTip: React.FC<{ title: string, text: string, color: string }> = ({ title, text, color }) => (
    <div className={`border-l-2 p-3 bg-slate-900/50 flex flex-col gap-1 border-${color}-500`}>
        <span className={`text-${color}-400 font-bold text-xs uppercase tracking-wider`}>{title}</span>
        <span className="text-slate-400 text-xs font-mono leading-snug">{text}</span>
    </div>
);

const LoadoutCard: React.FC<{ title: string, weapons: WeaponType[], t: any }> = ({ title, weapons, t }) => (
    <div className="bg-black/30 border border-slate-700 p-4 rounded-lg">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 text-center border-b border-slate-800 pb-1">{t('LOADOUT_REC')}</div>
        <div className="flex justify-center gap-4">
            {weapons.map(w => (
                <div key={w} className="flex flex-col items-center gap-1 group">
                    <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center border border-slate-600 group-hover:border-cyan-500">
                        <WeaponIcon type={w} className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </div>
                    <div className="text-[8px] text-slate-500">{w.substring(0,3)}</div>
                </div>
            ))}
        </div>
    </div>
);

const BootSequence: React.FC<{ onComplete: () => void, t: any }> = ({ onComplete, t }) => {
    const [lines, setLines] = useState<string[]>([]);
    
    useEffect(() => {
        const sequence = [
            "INITIALIZING VANGUARD KERNEL v44.2...",
            "CHECKING MEMORY INTEGRITY... [OK]",
            "MOUNTING FILE SYSTEM... [OK]",
            "ESTABLISHING NEURO-LINK... [OK]",
            "LOADING TACTICAL MODULES...",
            "DECRYPTING ARCHIVES...",
            "AUTHENTICATING USER...",
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setLines(prev => [...prev, sequence[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 500);
            }
        }, 150); // Faster lines

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-start justify-end p-12 font-mono text-cyan-500 text-sm">
            {lines.map((line, idx) => (
                <div key={idx} className="mb-1">{line}</div>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
}

export const ExplorationManual: React.FC<ExplorationManualProps> = ({ onClose, onCheat, t }) => {
    const [inputValue, setInputValue] = useState("");
    const [activeTab, setActiveTab] = useState<'MISSION' | 'PILOT' | 'WARFARE' | 'LOGISTICS' | 'SCIENCE' | 'SYSTEMS' | 'ARCHIVES' | 'ARMORY' | 'XENO'>('MISSION');
    const [missionSubTab, setMissionSubTab] = useState<'DEFENSE' | 'OFFENSE'>('DEFENSE');
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [isBooting, setIsBooting] = useState(true);

    const handleBootComplete = useCallback(() => {
        setIsBooting(false);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = inputValue.trim().toLowerCase();
            if (cmd === 'cheat') {
                onCheat();
                setInputValue("ACCESS GRANTED: FUNDS TRANSFERRED");
                setTimeout(() => setInputValue(""), 1500);
            } else if (cmd === 'close' || cmd === 'exit') {
                onClose();
            } else {
                setInputValue("ERR: UNKNOWN COMMAND");
                setTimeout(() => setInputValue(""), 1000);
            }
        }
    }

    const renderContent = () => {
        switch(activeTab) {
            case 'ARCHIVES': return (
                <div className="space-y-6 animate-fadeIn pr-4">
                    <div className="border-b border-cyan-900/50 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_TAB_ARCHIVES')}</h2>
                    </div>
                    <LoreCard title={t('ARCHIVE_001_TITLE')} bodyKey="ARCHIVE_001_BODY" t={t} />
                    <LoreCard title={t('ARCHIVE_002_TITLE')} bodyKey="ARCHIVE_002_BODY" t={t} />
                    <LoreCard title={t('ARCHIVE_003_TITLE')} bodyKey="ARCHIVE_003_BODY" t={t} />
                    <LoreCard title={t('ARCHIVE_004_TITLE')} bodyKey="ARCHIVE_004_BODY" t={t} />
                    <LoreCard title={t('ARCHIVE_005_TITLE')} bodyKey="ARCHIVE_005_BODY" t={t} />
                </div>
            );

            case 'ARMORY': return (
                <div className="space-y-6 animate-fadeIn pr-4">
                    <div className="border-b border-cyan-900/50 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_TAB_ARMORY')}</h2>
                    </div>
                    <LoreCard title={t('ARMORY_TECH_TITLE')} bodyKey="ARMORY_TECH_BODY" t={t} />
                    <div className="grid grid-cols-1 gap-4">
                        <LoreCard title={t('ARMORY_AR_TITLE')} bodyKey="ARMORY_AR_BODY" t={t} />
                        <LoreCard title={t('ARMORY_SG_TITLE')} bodyKey="ARMORY_SG_BODY" t={t} />
                        <LoreCard title={t('ARMORY_SR_TITLE')} bodyKey="ARMORY_SR_BODY" t={t} />
                        <LoreCard title={t('ARMORY_PL_TITLE')} bodyKey="ARMORY_PL_BODY" t={t} />
                    </div>
                </div>
            );

            case 'XENO': return (
                <div className="space-y-6 animate-fadeIn pr-4">
                    <div className="border-b border-green-900/50 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase text-green-500">{t('MANUAL_TAB_XENO')}</h2>
                    </div>
                    <LoreCard title={t('XENO_GRUNT_TITLE')} bodyKey="XENO_GRUNT_BODY" t={t} />
                    <LoreCard title={t('XENO_TANK_TITLE')} bodyKey="XENO_TANK_BODY" t={t} />
                    <LoreCard title={t('XENO_HIVE_TITLE')} bodyKey="XENO_HIVE_BODY" t={t} />
                    <LoreCard title={t('XENO_BIO_ACID_TITLE')} bodyKey="XENO_BIO_ACID_BODY" t={t} />
                </div>
            );

            case 'MISSION': return (
                <div className="space-y-6 animate-fadeIn h-full flex flex-col">
                    <div className="flex gap-4 border-b border-slate-800 pb-2">
                        <SubTabButton label={t('MANUAL_DEFENSE_TITLE')} active={missionSubTab === 'DEFENSE'} onClick={() => setMissionSubTab('DEFENSE')} />
                        <SubTabButton label={t('MANUAL_OFFENSE_TITLE')} active={missionSubTab === 'OFFENSE'} onClick={() => setMissionSubTab('OFFENSE')} colorClass="red" />
                    </div>

                    {missionSubTab === 'DEFENSE' ? (
                        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
                            <div className="p-6 bg-cyan-900/10 border border-cyan-900/30 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 text-6xl text-cyan-900/20 font-black select-none">DEF</div>
                                <h3 className="text-xl text-cyan-400 font-bold mb-2 tracking-widest">{t('MANUAL_DEFENSE_OBJ')}</h3>
                                <p className="text-sm text-cyan-100 font-mono leading-relaxed">{t('MANUAL_DEFENSE_DESC')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <TacticalTip title="ECONOMY" text={t('MANUAL_DEFENSE_TIP_1')} color="yellow" />
                                <TacticalTip title="DEFENSE" text={t('MANUAL_DEFENSE_TIP_2')} color="cyan" />
                            </div>

                            <div className="flex gap-6 items-center">
                                <div className="flex-1">
                                    <LoadoutCard title="Wave Clear" weapons={[WeaponType.AR, WeaponType.GRENADE_LAUNCHER, WeaponType.FLAMETHROWER]} t={t} />
                                </div>
                                <div className="w-px h-16 bg-slate-800"></div>
                                <div className="flex-1 text-center">
                                    <div className="text-xs text-slate-500 font-bold mb-2">VICTORY CONDITION</div>
                                    <div className="text-sm font-mono text-green-400 border border-green-900 bg-green-900/10 p-2">
                                        WAVE 0 + 0 HOSTILES
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
                            <div className="p-6 bg-red-900/10 border border-red-900/30 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 text-6xl text-red-900/20 font-black select-none">OFF</div>
                                <h3 className="text-xl text-red-500 font-bold mb-2 tracking-widest">{t('MANUAL_OFFENSE_OBJ')}</h3>
                                <p className="text-sm text-red-100 font-mono leading-relaxed">{t('MANUAL_OFFENSE_DESC')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <TacticalTip title="WEAKNESS" text={t('MANUAL_OFFENSE_TIP_1')} color="orange" />
                                <TacticalTip title="LOADOUT" text={t('MANUAL_OFFENSE_TIP_2')} color="red" />
                            </div>

                            <div className="flex gap-6 items-center">
                                <div className="flex-1">
                                    <LoadoutCard title="Boss Killer" weapons={[WeaponType.PULSE_RIFLE, WeaponType.SR, WeaponType.AR]} t={t} />
                                </div>
                                <div className="w-px h-16 bg-slate-800"></div>
                                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-red-900/30 bg-black/40">
                                    <div className="text-red-500 font-black text-2xl tracking-tighter">HIVE MOTHER</div>
                                    <div className="w-full h-2 bg-red-900 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[70%] animate-pulse"></div>
                                    </div>
                                    <div className="text-[10px] text-red-400 mt-1">ARMOR REGENERATION ACTIVE</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );

            case 'SYSTEMS': return (
                <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-blue-900/50 pb-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_SYSTEMS_TITLE')}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-slate-900 border border-blue-500/30 p-6 flex gap-6 items-center">
                            <div className="text-4xl text-blue-500">💾</div>
                            <div>
                                <h3 className="text-blue-400 font-bold mb-2">{t('MEMORY_STORAGE')}</h3>
                                <p className="text-slate-400 text-xs font-mono leading-relaxed">{t('MANUAL_MEMORY_DESC')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-black/30 border border-slate-700 p-4">
                                <h4 className="text-white font-bold text-sm mb-2">{t('MANUAL_MEMORY_IMPORT')}</h4>
                                <p className="text-slate-500 text-[10px]">{t('MANUAL_MEMORY_IMPORT_DESC')}</p>
                            </div>
                            <div className="bg-black/30 border border-slate-700 p-4">
                                <h4 className="text-white font-bold text-sm mb-2">{t('MANUAL_MEMORY_LIMIT')}</h4>
                                <p className="text-slate-500 text-[10px]">{t('MANUAL_MEMORY_LIMIT_DESC')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );

            case 'PILOT': return (
                <div className="space-y-8 animate-fadeIn h-full flex flex-col">
                    <div className="border-b border-cyan-900/50 pb-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_PILOT_TITLE')}</h2>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center relative bg-slate-900/30 rounded-xl border border-slate-800 p-8">
                        {/* Keyboard Visualizer */}
                        <div className="grid grid-cols-[repeat(14,1fr)] gap-2 w-full max-w-2xl">
                            {/* Row 1 */}
                            <div className="col-span-1"><KeyboardKey k="TAB" label={t('MANUAL_KEY_TAB_DESC')} active={hoveredKey === 'TAB'} /></div>
                            <div className="col-span-1"><KeyboardKey k="Q" label="" /></div>
                            <div className="col-span-1"><KeyboardKey k="W" label={t('MANUAL_KEY_WASD_DESC')} active={hoveredKey === 'WASD'} /></div>
                            <div className="col-span-1"><KeyboardKey k="E" label={t('MANUAL_KEY_E_DESC')} active={hoveredKey === 'E'} /></div>
                            <div className="col-span-1"><KeyboardKey k="R" label={t('MANUAL_KEY_R_DESC')} active={hoveredKey === 'R'} /></div>
                            <div className="col-span-1"><KeyboardKey k="" label="" /></div>
                            <div className="col-span-1"><KeyboardKey k="" label="" /></div>
                            
                            {/* Row 2 */}
                            <div className="col-span-1 col-start-2"><KeyboardKey k="A" label={t('MANUAL_KEY_WASD_DESC')} active={hoveredKey === 'WASD'} /></div>
                            <div className="col-span-1"><KeyboardKey k="S" label={t('MANUAL_KEY_WASD_DESC')} active={hoveredKey === 'WASD'} /></div>
                            <div className="col-span-1"><KeyboardKey k="D" label={t('MANUAL_KEY_WASD_DESC')} active={hoveredKey === 'WASD'} /></div>
                            <div className="col-span-1"><KeyboardKey k="F" label="" /></div>
                            <div className="col-span-1"><KeyboardKey k="G" label={t('MANUAL_KEY_G_DESC')} active={hoveredKey === 'G'} /></div>
                            <div className="col-span-1 col-start-8"><KeyboardKey k="L" label={t('MANUAL_KEY_L_DESC')} active={hoveredKey === 'L'} /></div>

                            {/* Row 3 */}
                            <div className="col-span-1 col-start-3"><KeyboardKey k="C" label={t('MANUAL_KEY_C_DESC')} active={hoveredKey === 'C'} /></div>
                            <div className="col-span-1 col-start-5"><KeyboardKey k="B" label={t('MANUAL_KEY_B_DESC')} active={hoveredKey === 'B'} /></div>
                        </div>

                        {/* Mouse Visualizer */}
                        <div className="absolute right-8 top-1/2 -translate-x-1/2 w-32 h-48 border-2 border-slate-700 rounded-3xl flex flex-col items-center pt-4 bg-slate-900">
                            <div className="w-px h-12 bg-slate-700"></div>
                            <div className="flex w-full px-2 gap-1 h-16">
                                <div className={`flex-1 border border-slate-600 rounded-tl-lg ${hoveredKey === 'MOUSE' ? 'bg-cyan-500' : ''}`}></div>
                                <div className={`flex-1 border border-slate-600 rounded-tr-lg ${hoveredKey === 'MOUSE' ? 'bg-cyan-900' : ''}`}></div>
                            </div>
                            <div className="mt-4 text-xs font-mono text-center text-slate-500">{t('MANUAL_KEY_MOUSE_DESC')}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400">
                        {['WASD', 'R', 'G', 'L', 'E', 'B', 'C', 'TAB'].map(k => (
                            <div 
                                key={k} 
                                onMouseEnter={() => setHoveredKey(k)} 
                                onMouseLeave={() => setHoveredKey(null)}
                                className="hover:text-cyan-400 cursor-pointer flex justify-between border-b border-slate-800 pb-1"
                            >
                                <span>[{k}]</span>
                                <span>{t(`MANUAL_KEY_${k}_DESC`)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );

            case 'WARFARE': return (
                <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-red-900/50 pb-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_WARFARE_TITLE')}</h2>
                    </div>

                    {/* Armor Simulation */}
                    <div className="bg-slate-900/50 p-6 border border-slate-700">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-cyan-400 font-bold">{t('MANUAL_ARMOR_SYSTEM')}</h3>
                            <div className="text-xs text-slate-500 font-mono">SIMULATION: 100 DMG IMPACT</div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-full h-8 bg-slate-800 relative overflow-hidden flex rounded">
                                <div className="h-full bg-cyan-600 w-[80%] flex items-center justify-center text-white font-bold text-xs relative group cursor-help">
                                    ARMOR ABSORPTION (80%)
                                    <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="h-full bg-red-600 w-[20%] flex items-center justify-center text-white font-bold text-xs">
                                    HP (20%)
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-2">{t('MANUAL_ARMOR_DESC')}</p>
                    </div>

                    {/* Regen Logic */}
                    <div className="bg-slate-900/50 p-6 border border-slate-700">
                        <h3 className="text-green-400 font-bold mb-4">{t('MANUAL_REGEN_PROTO')}</h3>
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-1">ARMOR REPAIR</div>
                                <div className="h-1 w-full bg-slate-800 mb-1"><div className="h-full bg-cyan-500 w-[50%] animate-pulse"></div></div>
                                <div className="text-xs text-cyan-500 font-mono">5s DELAY</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-1">TISSUE REGEN</div>
                                <div className="h-1 w-full bg-slate-800 mb-1"><div className="h-full bg-green-500 w-[30%] animate-pulse"></div></div>
                                <div className="text-xs text-green-500 font-mono">10s DELAY</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-4">{t('MANUAL_REGEN_DESC')}</p>
                    </div>
                </div>
            );

            case 'LOGISTICS': return (
                <div className="space-y-8 animate-fadeIn">
                    <div className="border-b border-yellow-900/50 pb-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_LOGISTICS_TITLE')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-black/30 p-4 border border-slate-800">
                            <h3 className="text-yellow-500 font-bold mb-2 text-sm">{t('MANUAL_TURRET_NET')}</h3>
                            <div className="space-y-2 text-xs font-mono text-slate-400">
                                <div className="flex justify-between border-b border-slate-800 pb-1"><span>STANDARD</span><span className="text-white">60 DMG / 400 RNG</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-1"><span>GAUSS (UPG)</span><span className="text-green-400">90 DMG / 650 RNG</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-1"><span>SNIPER (UPG)</span><span className="text-red-400">140 DMG / 1300 RNG</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-1"><span>MISSILE (UPG)</span><span className="text-yellow-400">160 DMG / GLOBAL</span></div>
                            </div>
                            <p className="mt-4 text-[10px] text-slate-500">{t('MANUAL_TURRET_DESC')}</p>
                        </div>

                        <div className="bg-yellow-900/10 p-4 border border-yellow-700/30 flex flex-col justify-between">
                            <div>
                                <h3 className="text-yellow-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                                    {t('MANUAL_LURE_ECO')}
                                    <span className="animate-pulse">▶▶</span>
                                </h3>
                                <p className="text-yellow-200/70 text-xs leading-relaxed font-mono">
                                    {t('MANUAL_LURE_MATH')}
                                </p>
                            </div>
                            <div className="mt-4 h-24 bg-black/50 relative border border-yellow-900/30">
                                {/* Graph simulation */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-yellow-900"></div>
                                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-yellow-900"></div>
                                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[100px] border-l-transparent border-b-[80px] border-b-yellow-500/20"></div>
                                <div className="absolute bottom-2 right-2 text-[8px] text-yellow-500">PROFIT CURVE</div>
                            </div>
                        </div>
                    </div>
                </div>
            );

            case 'SCIENCE': return (
                <div className="space-y-8 animate-fadeIn pr-4">
                    <div className="border-b border-purple-900/50 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">{t('MANUAL_SCIENCE_TITLE')}</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Oxygen Report */}
                        <div className="bg-blue-900/10 p-4 border border-blue-900/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-900/20 rounded flex items-center justify-center font-black text-blue-400 text-xl border border-blue-500/50">O2</div>
                                <div>
                                    <div className="text-blue-400 font-bold text-lg">{t('MANUAL_SCIENCE_O2')}</div>
                                    <div className="text-slate-400 text-xs font-mono">{t('MANUAL_SCIENCE_O2_DESC')}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-1 mb-2 h-16 items-end border-b border-blue-900/50 pb-1">
                                <div className="bg-blue-800 w-full h-[40%] animate-pulse"></div>
                                <div className="bg-blue-700 w-full h-[60%]"></div>
                                <div className="bg-blue-600 w-full h-[80%]"></div>
                                <div className="bg-blue-500 w-full h-[100%] animate-pulse"></div>
                            </div>
                            <TypewriterText text={t('MANUAL_SCIENCE_O2_REPORT')} speed={5} className="text-blue-200/80 text-xs font-mono leading-relaxed" />
                        </div>

                        {/* Sulfur Report */}
                        <div className="bg-yellow-900/10 p-4 border border-yellow-900/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-yellow-900/20 rounded flex items-center justify-center font-black text-yellow-400 text-xl border border-yellow-500/50">S</div>
                                <div>
                                    <div className="text-yellow-500 font-bold text-lg">{t('MANUAL_SCIENCE_S')}</div>
                                    <div className="text-slate-400 text-xs font-mono">{t('MANUAL_SCIENCE_S_DESC')}</div>
                                </div>
                            </div>
                            <TypewriterText text={t('MANUAL_SCIENCE_S_REPORT')} speed={5} className="text-yellow-200/80 text-xs font-mono leading-relaxed" />
                        </div>

                        {/* Gene Report */}
                        <div className="bg-purple-900/10 p-4 border border-purple-900/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-900/20 rounded flex items-center justify-center font-black text-purple-400 text-xl border border-purple-500/50">DNA</div>
                                <div>
                                    <div className="text-purple-500 font-bold text-lg">{t('MANUAL_SCIENCE_GENE')}</div>
                                    <div className="text-slate-400 text-xs font-mono">{t('MANUAL_SCIENCE_GENE_DESC')}</div>
                                </div>
                            </div>
                            <TypewriterText text={t('MANUAL_SCIENCE_GENE_REPORT')} speed={5} className="text-purple-200/80 text-xs font-mono leading-relaxed" />
                        </div>
                    </div>
                </div>
            );
        }
    }

    const tabs = [
        { id: 'MISSION', label: t('MANUAL_TAB_MISSION') },
        { id: 'PILOT', label: t('MANUAL_TAB_PILOT') },
        { id: 'WARFARE', label: t('MANUAL_TAB_WARFARE') },
        { id: 'LOGISTICS', label: t('MANUAL_TAB_LOGISTICS') },
        { id: 'SCIENCE', label: t('MANUAL_TAB_SCIENCE') },
        { id: 'SYSTEMS', label: t('MANUAL_TAB_SYSTEMS') },
        { id: 'ARCHIVES', label: t('MANUAL_TAB_ARCHIVES') },
        { id: 'ARMORY', label: t('MANUAL_TAB_ARMORY') },
        { id: 'XENO', label: t('MANUAL_TAB_XENO') },
    ];

    if (isBooting) {
        return <BootSequence onComplete={handleBootComplete} t={t} />;
    }

    return (
        <div className="absolute inset-0 z-[250] bg-slate-950/95 flex items-center justify-center pointer-events-auto backdrop-blur-sm select-none">
            <div className="w-[1100px] h-[750px] bg-slate-900 border-2 border-slate-700 shadow-2xl relative flex overflow-hidden">
                
                {/* Left Sidebar */}
                <div className="w-64 bg-slate-950 border-r border-slate-700 flex flex-col z-10 overflow-y-auto">
                    <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
                        <h1 className="text-xl font-black text-white tracking-widest">{t('MANUAL_BTN')}</h1>
                        <div className="text-[10px] text-cyan-600 font-mono mt-1 tracking-[0.2em]">{t('MANUAL_SUB')}</div>
                    </div>
                    
                    <div className="flex-1 py-4 space-y-1">
                        <div className="px-6 text-[10px] text-slate-600 font-bold mb-2">TACTICAL</div>
                        {tabs.slice(0,6).map(tab => (
                            <TabButton key={tab.id} id={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id as any)} />
                        ))}
                        <div className="px-6 text-[10px] text-slate-600 font-bold mt-6 mb-2">DATABASE</div>
                        {tabs.slice(6).map(tab => (
                            <TabButton key={tab.id} id={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id as any)} />
                        ))}
                    </div>
                    
                    <div className="p-6 border-t border-slate-800 text-[10px] text-slate-600 font-mono sticky bottom-0 bg-slate-950">
                        VANGUARD NET // ONLINE <span className="animate-pulse">●</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-slate-900 overflow-hidden">
                    <CloseButton onClick={onClose} colorClass="absolute top-6 right-6 border-slate-600 text-slate-500 hover:text-white hover:bg-slate-800 z-20" />
                    
                    {/* Holographic Effects */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[length:100%_4px,6px_100%] opacity-20"></div>

                    <div className="flex-1 p-12 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                        {renderContent()}
                    </div>

                    {/* Console Footer */}
                    <div className="h-12 border-t border-slate-800 bg-black/80 flex items-center px-4 relative z-10">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 w-full">
                            <span className="text-cyan-700">admin@vanguard:~#</span>
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-transparent border-none outline-none text-cyan-500 w-full uppercase placeholder-slate-700"
                                placeholder={t('INPUT_PLACEHOLDER')}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
