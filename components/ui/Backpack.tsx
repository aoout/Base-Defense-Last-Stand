


import React, { useState } from 'react';
import { GameState, WeaponType, ModuleType, WeaponModule, DefenseUpgradeType } from '../../types';
import { INVENTORY_SIZE } from '../../constants';
import { WEAPONS, PLAYER_STATS, MODULE_STATS, DEFENSE_UPGRADE_INFO } from '../../data/registry';
import { CloseButton, WeaponIcon } from './Shared';

// Helper for Assembly UI to check compat
function checkCompatibility(modType: ModuleType, target: WeaponType | 'GRENADE'): boolean {
    const config = MODULE_STATS[modType] as any;
    if (config.exclude && config.exclude.includes(target)) return false;
    if (config.only && !config.only.includes(target)) return false;
    return true;
}

const WeaponAssemblyModal: React.FC<{ weaponType: WeaponType | 'GRENADE', state: GameState, onClose: () => void, t: any }> = ({ weaponType, state, onClose, t }) => {
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
        weaponName = t(`WEAPON_${weaponType}_NAME`);
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
            <div className="bg-gray-800 border-2 border-cyan-600 p-8 rounded-lg max-w-2xl w-full flex flex-col gap-6 relative shadow-2xl">
                 <CloseButton onClick={onClose} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                 
                 <div className="text-center border-b border-gray-700 pb-4">
                     <h2 className="text-2xl font-black text-cyan-400 tracking-widest">{t('ASSEMBLY_TITLE')}</h2>
                     <div className="text-white text-lg mt-2 font-bold">{weaponName}</div>
                 </div>

                 {/* Slots Visualization */}
                 <div className="flex justify-center gap-8 py-8 bg-black/30 rounded-lg">
                     {Array.from({length: maxSlots}).map((_, i) => {
                         const mod = installedModules[i];
                         return (
                             <div key={i} className="flex flex-col items-center gap-2">
                                 <div 
                                    className={`w-20 h-20 rounded-full border-2 flex items-center justify-center relative
                                        ${mod ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600 border-dashed bg-gray-900/50'}
                                    `}
                                 >
                                     {mod ? (
                                         <>
                                            <div className="text-2xl">⚙️</div>
                                            <button 
                                                onClick={() => handleUnequip(mod.id)}
                                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 border border-black"
                                            >✕</button>
                                         </>
                                     ) : (
                                         <div className="text-gray-600 text-xs">{t('EMPTY_SLOT')}</div>
                                     )}
                                 </div>
                                 {mod && (
                                     <div className="text-[10px] text-cyan-200 w-24 text-center leading-tight">
                                         {t(`MODULE_${mod.type}_NAME`)}
                                     </div>
                                 )}
                             </div>
                         )
                     })}
                 </div>

                 {/* Available Inventory */}
                 <div className="bg-black/20 p-4 rounded-lg border border-gray-700 flex-1 min-h-[200px]">
                     <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-4 border-b border-gray-700 pb-2">{t('MODULES_STORAGE')}</h3>
                     
                     <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                         {p.freeModules.length === 0 && (
                             <div className="col-span-2 text-center text-gray-600 italic py-8">NO MODULES AVAILABLE</div>
                         )}
                         {p.freeModules.map(mod => {
                             const config = MODULE_STATS[mod.type];
                             const isCompatible = checkCompatibility(mod.type, weaponType);
                             
                             return (
                                 <button
                                    key={mod.id}
                                    onClick={() => isCompatible && handleEquip(mod.id)}
                                    disabled={!isCompatible}
                                    className={`p-3 border rounded flex justify-between items-center text-left transition-all
                                        ${isCompatible 
                                            ? 'bg-gray-700 border-gray-600 hover:border-cyan-500 hover:bg-gray-600 cursor-pointer' 
                                            : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}
                                    `}
                                 >
                                     <div>
                                         <div className={`text-sm font-bold ${isCompatible ? 'text-white' : 'text-gray-500'}`}>{t(`MODULE_${mod.type}_NAME`)}</div>
                                         <div className="text-[10px] text-gray-400">{t(`MODULE_${mod.type}_DESC`)}</div>
                                     </div>
                                     {isCompatible ? (
                                         <span className="text-cyan-500 text-xl">➜</span>
                                     ) : (
                                         <span className="text-red-900 text-xs font-bold">N/A</span>
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

export const TacticalBackpack: React.FC<{ state: GameState, onSwapItems: (lIdx: number, iIdx: number) => void, onClose: () => void, t: any }> = ({ state, onSwapItems, onClose, t }) => {
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [assemblyTarget, setAssemblyTarget] = useState<WeaponType | 'GRENADE' | null>(null);

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedItemIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, loadoutIdx: number) => {
        e.preventDefault();
        if (draggedItemIdx !== null) {
            onSwapItems(loadoutIdx, draggedItemIdx);
            setDraggedItemIdx(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    return (
        <div className="absolute inset-0 z-[100] bg-gray-900/95 pointer-events-auto flex items-center justify-center font-mono">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent),radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]"></div>

            {assemblyTarget && (
                <WeaponAssemblyModal 
                    weaponType={assemblyTarget} 
                    state={state} 
                    onClose={() => setAssemblyTarget(null)} 
                    t={t}
                />
            )}

            <div className="relative w-[900px] bg-gray-800 border-2 border-gray-600 shadow-2xl p-8 flex gap-8 rounded-lg">
                
                {/* Close Button */}
                <CloseButton onClick={onClose} colorClass="border-gray-500 text-gray-400 hover:text-white hover:bg-gray-700" />

                {/* Left Column: Stats */}
                <div className="w-1/4 flex flex-col gap-4">
                    <div className="bg-black/50 p-4 border border-gray-700">
                        <h3 className="text-gray-400 font-bold mb-2 text-xs tracking-widest">{t('STATUS_HEADER')}</h3>
                        <div className="mb-2">
                            <div className="flex justify-between text-white text-sm"><span>{t('HEALTH')}</span><span>{Math.floor(p.hp)}/{p.maxHp}</span></div>
                            <div className="h-2 w-full bg-gray-900 mt-1"><div className="h-full bg-red-600" style={{width: `${(p.hp/p.maxHp)*100}%`}}></div></div>
                        </div>
                        <div className="mb-2">
                            <div className="flex justify-between text-white text-sm"><span>{t('ARMOR')}</span><span>{Math.floor(p.armor)}/{p.maxArmor}</span></div>
                            <div className="h-2 w-full bg-gray-900 mt-1"><div className="h-full bg-blue-600" style={{width: `${(p.armor/p.maxArmor)*100}%`}}></div></div>
                        </div>
                        <div>
                             <div className="flex justify-between text-white text-sm"><span>{t('SCRAPS')}</span><span className="text-yellow-400">{Math.floor(p.score)}</span></div>
                        </div>
                    </div>

                     <div className="bg-black/50 p-4 border border-gray-700 flex-1">
                        <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">{t('UTILITIES')}</h3>
                        
                        {/* Grenade Button (Clickable for Assembly) */}
                        <button 
                            onClick={() => setAssemblyTarget('GRENADE')}
                            className="flex items-center gap-4 text-white w-full p-2 hover:bg-white/5 rounded transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center group-hover:border-cyan-500 relative">
                                <div className="w-4 h-6 bg-orange-500 rounded-sm"></div>
                                {/* Slots dots */}
                                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                                    {p.grenadeModules.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 border border-black"></div>)}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold group-hover:text-cyan-400 transition-colors">{t('GRENADE')}</div>
                                <div className="text-xs text-gray-400">x{p.grenades}</div>
                            </div>
                        </button>

                        {/* Defense Upgrades Display */}
                        {p.upgrades.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-gray-400 font-bold mb-2 text-xs tracking-widest">{t('ACTIVE_SYSTEMS')}</h3>
                                <div className="space-y-2">
                                    {p.upgrades.map(u => {
                                        let nameKey = '';
                                        if (u === DefenseUpgradeType.INFECTION_DISPOSAL) nameKey = 'UPGRADE_INFECTION';
                                        if (u === DefenseUpgradeType.SPORE_BARRIER) nameKey = 'UPGRADE_SPORE';
                                        if (u === DefenseUpgradeType.IMPACT_PLATE) nameKey = 'UPGRADE_IMPACT';
                                        
                                        return (
                                            <div key={u} className="bg-gray-700/50 p-2 text-xs border-l-2 border-emerald-500 text-gray-300">
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
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Loadout Section */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-2">{t('LOADOUT_HEADER')}</h2>
                        <p className="text-xs text-gray-500 mb-4">{t('LOADOUT_HINT')}</p>
                        <div className="flex gap-4">
                            {p.loadout.map((wType, idx) => {
                                const installedCount = p.weapons[wType].modules.length;
                                return (
                                    <div 
                                        key={idx}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onDragOver={handleDragOver}
                                        onClick={() => setAssemblyTarget(wType)}
                                        className="relative w-32 h-32 bg-black/40 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center group hover:border-cyan-500 cursor-pointer transition-all hover:bg-gray-800"
                                    >
                                        <div className="absolute top-1 left-2 text-xs text-gray-600 font-bold">{t('SLOT')} {idx+1}</div>
                                        <WeaponIcon type={wType} className="w-16 h-16 fill-gray-400 group-hover:fill-cyan-400" />
                                        <div className="text-xs font-bold text-white text-center px-1 mt-2">{t(`WEAPON_${wType}_NAME`)}</div>
                                        <div className="text-[10px] text-gray-400">{idx === 3 ? t('SLOT_SIDEARM') : t('SLOT_MAIN')}</div>
                                        
                                        {/* Module Indicator Dots */}
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                            {Array.from({length: installedCount}).map((_, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 border border-black shadow-[0_0_4px_cyan]"></div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Backpack Grid */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-4 tracking-wide border-b border-gray-600 pb-2">{t('BACKPACK_HEADER')}</h2>
                        <div className="grid grid-cols-6 gap-2">
                            {Array.from({length: INVENTORY_SIZE}).map((_, idx) => {
                                const item = p.inventory[idx];
                                return (
                                    <div 
                                        key={idx}
                                        draggable={!!item}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        className={`
                                            w-16 h-16 border rounded flex items-center justify-center relative
                                            ${item ? 'bg-gray-700 border-gray-500 cursor-grab hover:bg-gray-600' : 'bg-black/20 border-gray-800'}
                                        `}
                                    >
                                        {item && (
                                            <>
                                                <WeaponIcon type={item.type} className="w-10 h-10 fill-gray-300" />
                                                <div className="absolute bottom-0.5 right-1 text-[8px] text-gray-300">
                                                    {t(`WEAPON_${item.type}_NAME`).substring(0,3).toUpperCase()}
                                                </div>
                                            </>
                                        )}
                                        <div className="absolute top-0.5 left-1 text-[8px] text-gray-700">{idx+1}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-8 text-xs text-gray-500">
                    {t('CLOSE_BACKPACK')}
                </div>
            </div>
        </div>
    );
};
