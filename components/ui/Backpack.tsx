
import React, { useState } from 'react';
import { WeaponType, ModuleType, WeaponModule, DefenseUpgradeType, GameEventType, ShopSwapLoadoutEvent } from '../../types';
import { INVENTORY_SIZE } from '../../constants';
import { MODULE_STATS, PLAYER_STATS } from '../../data/registry';
import { CloseButton, WeaponIcon } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

// Helper for Assembly UI to check compat
function checkCompatibility(modType: ModuleType, target: WeaponType | 'GRENADE'): boolean {
    const config = MODULE_STATS[modType] as any;
    if (config.only && !config.only.includes(target)) return false;
    return true;
}

const TechChipIcon: React.FC<{ className?: string, isActive?: boolean }> = ({ className, isActive }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        {/* Connector Pins */}
        <path d="M7 22v-2M12 22v-2M17 22v-2M7 2v2M12 2v2M17 2v2M2 7h2M2 12h2M2 17h2M22 7h-2M22 12h-2M22 17h-2" stroke="#334155" />
        
        {/* Main Body */}
        <rect x="4" y="4" width="16" height="16" rx="2" fill={isActive ? "#0f172a" : "transparent"} stroke={isActive ? "#06b6d4" : "#475569"} strokeWidth="2" filter={isActive ? "url(#glow)" : ""} />
        
        {/* Circuit Lines */}
        {isActive && (
            <>
                <path d="M8 8h3v3h-3z" fill="#06b6d4" fillOpacity="0.5" />
                <path d="M11 11h2v2h-2z" fill="#06b6d4" fillOpacity="0.8" className="animate-pulse" />
                <path d="M13 13h3v3h-3z" fill="#06b6d4" fillOpacity="0.5" />
                <path d="M8 16h8" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M16 8h-8" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M12 4v16" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.1" />
            </>
        )}
    </svg>
);

const WeaponAssemblyModal: React.FC<{ weaponType: WeaponType | 'GRENADE', onClose: () => void }> = ({ weaponType, onClose }) => {
    const { state } = useGame();
    const { t } = useLocale();
    const p = state.player;
    
    // Determine target modules array and slots
    let installedModules: WeaponModule[] = [];
    let maxSlots = 3;
    let weaponName = "";

    if (weaponType === 'GRENADE') {
        installedModules = p.grenadeModules;
        maxSlots = 2;
        weaponName = t('GRENADE');
    } else {
        installedModules = p.weapons[weaponType].modules;
        if (weaponType === WeaponType.PISTOL) maxSlots = 2;
        // Fix key generation
        weaponName = t(`WEAPON_${weaponType.replace(/\s+/g, '_').toUpperCase()}_NAME`);
    }

    const handleEquip = (modId: string) => {
        // Dispatch event to app
        const event = new CustomEvent('game-action', { detail: { type: 'EQUIP_MODULE', target: weaponType, modId } });
        window.dispatchEvent(event);
    };

    const handleUnequip = (modId: string) => {
        const event = new CustomEvent('game-action', { detail: { type: 'UNEQUIP_MODULE', target: weaponType, modId } });
        window.dispatchEvent(event);
    };

    return (
        <div className="absolute inset-0 bg-black/90 z-[150] flex items-center justify-center pointer-events-auto">
            <div className="bg-slate-900 border-2 border-cyan-600 p-8 rounded-lg max-w-2xl w-full flex flex-col gap-6 relative shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-fadeIn">
                 {/* Tech Background Grid */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none rounded-lg"></div>

                 <CloseButton onClick={onClose} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900 z-20" />
                 
                 <div className="text-center border-b border-cyan-900/50 pb-4 relative z-10">
                     <h2 className="text-2xl font-black text-cyan-400 tracking-widest uppercase">{t('ASSEMBLY_TITLE')}</h2>
                     <div className="text-white text-sm mt-2 font-bold tracking-wide">{weaponName}</div>
                 </div>

                 {/* Slots Visualization */}
                 <div className="flex justify-center gap-12 py-8 bg-black/40 rounded-lg border border-cyan-900/30 relative z-10">
                     {Array.from({length: maxSlots}).map((_, i) => {
                         const mod = installedModules[i];
                         return (
                             <div key={i} className="flex flex-col items-center gap-3 group">
                                 <div 
                                    className={`w-24 h-24 rounded-lg flex items-center justify-center relative transition-all duration-300
                                        ${mod 
                                            ? 'border-2 border-cyan-500 bg-cyan-900/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                                            : 'border-2 border-dashed border-slate-700 bg-slate-900/50 hover:border-slate-500'}
                                    `}
                                 >
                                     {mod ? (
                                         <>
                                            <TechChipIcon className="w-16 h-16 text-cyan-400" isActive={true} />
                                            <button 
                                                onClick={() => handleUnequip(mod.id)}
                                                className="absolute -top-2 -right-2 bg-red-900 text-red-200 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 hover:text-white border border-red-500 transition-colors shadow-lg z-20"
                                            >✕</button>
                                         </>
                                     ) : (
                                         <div className="text-slate-600 text-[10px] font-mono tracking-widest uppercase">{t('EMPTY_SLOT')}</div>
                                     )}
                                     
                                     {/* Connector lines decoration */}
                                     <div className={`absolute -bottom-4 w-px h-4 ${mod ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                                 </div>
                                 
                                 <div className={`text-[10px] font-mono w-28 text-center leading-tight transition-colors ${mod ? 'text-cyan-300 font-bold' : 'text-slate-600'}`}>
                                     {mod ? t(`MODULE_${mod.type}_NAME`) : '---'}
                                 </div>
                             </div>
                         )
                     })}
                 </div>

                 {/* Available Inventory */}
                 <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex-1 min-h-[240px] relative z-10 flex flex-col">
                     <h3 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] mb-4 border-b border-slate-800 pb-2 uppercase">{t('MODULES_STORAGE')}</h3>
                     
                     <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                         {p.freeModules.length === 0 && (
                             <div className="col-span-2 text-center text-slate-600 italic py-10 text-xs font-mono tracking-widest">NO COMPATIBLE HARDWARE FOUND</div>
                         )}
                         {p.freeModules.map(mod => {
                             const isCompatible = checkCompatibility(mod.type, weaponType);
                             
                             return (
                                 <button
                                    key={mod.id}
                                    onClick={() => isCompatible && handleEquip(mod.id)}
                                    disabled={!isCompatible}
                                    className={`p-3 border rounded flex justify-between items-center text-left transition-all group relative overflow-hidden
                                        ${isCompatible 
                                            ? 'bg-slate-800 border-slate-600 hover:border-cyan-500 hover:bg-slate-750 cursor-pointer' 
                                            : 'bg-slate-900/50 border-slate-800 opacity-40 cursor-not-allowed'}
                                    `}
                                 >
                                     <div className="flex items-center gap-3">
                                         <TechChipIcon className={`w-8 h-8 ${isCompatible ? 'text-cyan-500' : 'text-slate-600'}`} isActive={isCompatible} />
                                         <div>
                                             <div className={`text-xs font-bold ${isCompatible ? 'text-cyan-100' : 'text-slate-500'}`}>{t(`MODULE_${mod.type}_NAME`)}</div>
                                             <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{t(`MODULE_${mod.type}_DESC`)}</div>
                                         </div>
                                     </div>
                                     {isCompatible && (
                                         <span className="text-cyan-500 text-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">➜</span>
                                     )}
                                 </button>
                             )
                         })}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export const TacticalBackpack: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [assemblyTarget, setAssemblyTarget] = useState<WeaponType | 'GRENADE' | null>(null);

    const handleSwapItems = (lIdx: number, iIdx: number) => {
        engine.eventBus.emit<ShopSwapLoadoutEvent>(GameEventType.SHOP_SWAP_LOADOUT, { loadoutIndex: lIdx, inventoryIndex: iIdx });
    };

    const handleClose = () => {
        engine.toggleInventory();
    }

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedItemIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, loadoutIdx: number) => {
        e.preventDefault();
        if (draggedItemIdx !== null) {
            handleSwapItems(loadoutIdx, draggedItemIdx);
            setDraggedItemIdx(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/95 pointer-events-auto flex items-center justify-center font-mono select-none">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent),radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]"></div>

            {assemblyTarget && (
                <WeaponAssemblyModal 
                    weaponType={assemblyTarget} 
                    onClose={() => setAssemblyTarget(null)} 
                />
            )}

            <div className="relative w-[1000px] h-[700px] bg-slate-900 border-2 border-slate-600 shadow-2xl p-8 flex gap-8 rounded-lg overflow-hidden">
                
                {/* Close Button */}
                <CloseButton onClick={handleClose} colorClass="border-slate-500 text-slate-400 hover:text-white hover:bg-slate-700 z-50" />

                {/* Left Column: Stats */}
                <div className="w-64 flex flex-col gap-4 shrink-0">
                    <div className="bg-black/40 p-4 border border-slate-700 rounded">
                        <h3 className="text-slate-400 font-bold mb-3 text-[10px] tracking-[0.2em] uppercase">{t('STATUS_HEADER')}</h3>
                        <div className="mb-4">
                            <div className="flex justify-between text-white text-xs font-bold mb-1"><span>{t('HEALTH')}</span><span>{Math.floor(p.hp)}/{p.maxHp}</span></div>
                            <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden"><div className="h-full bg-red-600 transition-all duration-300" style={{width: `${(p.hp/p.maxHp)*100}%`}}></div></div>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between text-white text-xs font-bold mb-1"><span>{t('ARMOR')}</span><span>{Math.floor(p.armor)}/{p.maxArmor}</span></div>
                            <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden"><div className="h-full bg-cyan-600 transition-all duration-300" style={{width: `${(p.armor/p.maxArmor)*100}%`}}></div></div>
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                             <div className="flex justify-between text-white text-xs">
                                 <span className="text-slate-500 font-bold tracking-wider">{t('SCRAPS')}</span>
                                 <span className="text-yellow-400 font-mono font-bold">{Math.floor(p.score)}</span>
                             </div>
                        </div>
                    </div>

                     <div className="bg-black/40 p-4 border border-slate-700 flex-1 rounded flex flex-col">
                        <h3 className="text-slate-400 font-bold mb-4 text-[10px] tracking-[0.2em] uppercase">{t('UTILITIES')}</h3>
                        
                        {/* Grenade Button (Clickable for Assembly) */}
                        <button 
                            onClick={() => setAssemblyTarget('GRENADE')}
                            className="flex items-center gap-4 text-white w-full p-2 hover:bg-white/5 rounded transition-colors group text-left border border-transparent hover:border-slate-600"
                        >
                            <div className="w-12 h-12 bg-slate-800 rounded border border-slate-600 flex items-center justify-center group-hover:border-orange-500 relative transition-colors">
                                <div className="w-4 h-6 bg-orange-500 rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
                                {/* Slots dots */}
                                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                                    {p.grenadeModules.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 border border-black shadow-[0_0_4px_cyan]"></div>)}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-sm group-hover:text-orange-400 transition-colors">{t('GRENADE')}</div>
                                <div className="text-[10px] text-slate-500 font-mono">QTY: {p.grenades}</div>
                            </div>
                        </button>

                        {/* Defense Upgrades Display */}
                        {p.upgrades.length > 0 && (
                            <div className="mt-6 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                                <h3 className="text-slate-400 font-bold mb-2 text-[10px] tracking-[0.2em] uppercase">{t('ACTIVE_SYSTEMS')}</h3>
                                <div className="space-y-2">
                                    {p.upgrades.map(u => {
                                        let nameKey = '';
                                        if (u === DefenseUpgradeType.INFECTION_DISPOSAL) nameKey = 'UPGRADE_INFECTION';
                                        if (u === DefenseUpgradeType.SPORE_BARRIER) nameKey = 'UPGRADE_SPORE';
                                        if (u === DefenseUpgradeType.IMPACT_PLATE) nameKey = 'UPGRADE_IMPACT';
                                        
                                        return (
                                            <div key={u} className="bg-emerald-900/20 p-2 text-[10px] border-l-2 border-emerald-500 text-emerald-200 font-bold">
                                                {t(nameKey)}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {/* Right Column: Loadout & Inventory */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    
                    {/* Loadout Section */}
                    <div className="bg-slate-800/30 p-6 rounded-lg border border-slate-700/50">
                        <h2 className="text-lg font-bold text-white mb-4 tracking-widest uppercase flex items-center gap-2">
                            <span className="w-1 h-4 bg-cyan-500"></span>
                            {t('LOADOUT_HEADER')}
                        </h2>
                        
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                            {p.loadout.map((wType, idx) => {
                                const installedCount = p.weapons[wType].modules.length;
                                return (
                                    <div 
                                        key={idx}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onDragOver={handleDragOver}
                                        onClick={() => setAssemblyTarget(wType)}
                                        className="relative w-36 h-40 bg-black/40 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center group hover:border-cyan-500 cursor-pointer transition-all hover:bg-slate-800 shrink-0"
                                    >
                                        <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-cyan-500">{t('SLOT')} {idx+1}</div>
                                        
                                        <WeaponIcon type={wType} className="w-20 h-20 text-slate-500 group-hover:text-cyan-400 transition-colors drop-shadow-lg" />
                                        
                                        <div className="text-[10px] font-bold text-slate-300 text-center px-1 mt-3 group-hover:text-white uppercase tracking-tight leading-tight">
                                            {t(`WEAPON_${wType.replace(/\s+/g, '_').toUpperCase()}_NAME`)}
                                        </div>
                                        
                                        {/* Module Indicator Dots */}
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                            {Array.from({length: installedCount}).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_cyan]"></div>
                                            ))}
                                            {/* Empty slots hint */}
                                            {Array.from({length: (wType === WeaponType.PISTOL ? 2 : 3) - installedCount}).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 text-center font-mono">{t('LOADOUT_HINT')}</div>
                    </div>

                    {/* Backpack Grid */}
                    <div className="flex-1 bg-slate-800/30 p-6 rounded-lg border border-slate-700/50 flex flex-col">
                        <h2 className="text-lg font-bold text-white mb-4 tracking-widest uppercase flex items-center gap-2">
                            <span className="w-1 h-4 bg-slate-500"></span>
                            {t('BACKPACK_HEADER')}
                        </h2>
                        
                        <div className="grid grid-cols-6 gap-3 flex-1 content-start overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {Array.from({length: INVENTORY_SIZE}).map((_, idx) => {
                                const item = p.inventory[idx];
                                return (
                                    <div 
                                        key={idx}
                                        draggable={!!item}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        className={`
                                            aspect-square border rounded flex items-center justify-center relative transition-colors
                                            ${item 
                                                ? 'bg-slate-700 border-slate-500 cursor-grab hover:bg-slate-600 hover:border-cyan-400 active:cursor-grabbing' 
                                                : 'bg-black/20 border-slate-800'}
                                        `}
                                    >
                                        {item && (
                                            <>
                                                <WeaponIcon type={item.type} className="w-10 h-10 text-slate-300" />
                                                <div className="absolute bottom-1 right-1 text-[8px] text-slate-400 font-mono font-bold bg-black/50 px-1 rounded">
                                                    {t(`WEAPON_${item.type.replace(/\s+/g, '_').toUpperCase()}_NAME`).substring(0,3).toUpperCase()}
                                                </div>
                                            </>
                                        )}
                                        <div className="absolute top-1 left-1 text-[8px] text-slate-700 font-mono">{idx+1}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-8 text-[10px] text-slate-600 font-mono">
                    {t('CLOSE_BACKPACK')}
                </div>
            </div>
        </div>
    );
};
