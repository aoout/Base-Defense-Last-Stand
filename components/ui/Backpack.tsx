
import React, { useState } from 'react';
import { WeaponType, ModuleType, WeaponModule, ShopSwapLoadoutEvent, GameEventType } from '../../types';
import { PLAYER_STATS, MODULE_STATS, WEAPONS } from '../../data/registry';
import { INVENTORY_SIZE } from '../../constants';
import { CloseButton, WeaponIcon } from './Shared';
import { CyberButton } from './atoms/CyberButton';
import { DS } from '../../theme/designSystem';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';
import { Icons } from './Icons';

// --- SUB-COMPONENTS ---

const TechStatRow: React.FC<{ label: string, value: string | number, barValue?: number, color?: string }> = ({ label, value, barValue, color = 'cyan' }) => (
    <div className="mb-2">
        <div className="flex justify-between items-end mb-1">
            <span className={`text-[9px] font-bold tracking-[0.2em] uppercase text-slate-500`}>{label}</span>
            <span className={`text-xs font-mono font-bold text-${color}-400`}>{value}</span>
        </div>
        {barValue !== undefined && (
            <div className="h-1 w-full bg-slate-800 relative overflow-hidden">
                <div 
                    className={`h-full bg-${color}-500 transition-all duration-300`} 
                    style={{ width: `${Math.min(100, barValue * 100)}%` }}
                ></div>
            </div>
        )}
    </div>
);

const InventorySlot: React.FC<{ 
    item: { type: WeaponType } | null, 
    idx: number, 
    onDragStart: (e: React.DragEvent) => void 
}> = ({ item, idx, onDragStart }) => (
    <div 
        draggable={!!item}
        onDragStart={onDragStart}
        className={`
            h-10 border-b border-slate-800 flex items-center px-3 transition-all group
            ${item ? 'bg-slate-900/30 hover:bg-cyan-900/20 cursor-grab active:cursor-grabbing' : 'bg-transparent'}
        `}
    >
        <div className="w-6 text-[8px] font-mono text-slate-600 mr-2">{idx + 1}</div>
        {item ? (
            <>
                <WeaponIcon type={item.type} className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors mr-3" />
                <div className="text-[10px] font-bold text-slate-300 group-hover:text-white tracking-wider uppercase truncate">
                    {item.type}
                </div>
            </>
        ) : (
            <div className="text-[9px] text-slate-800 italic">---</div>
        )}
    </div>
);

const HardpointCard: React.FC<{ 
    type: WeaponType, 
    slotIndex: number, 
    isActive: boolean,
    onDrop: (e: React.DragEvent) => void,
    onClick: () => void,
    t: any
}> = ({ type, slotIndex, isActive, onDrop, onClick, t }) => {
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return (
        <div 
            className={`
                group relative h-20 sm:h-24 border-2 transition-all cursor-pointer flex flex-col justify-between p-3 overflow-hidden
                ${isActive 
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]' 
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}
            `}
            onDragOver={handleDragOver}
            onDrop={onDrop}
            onClick={onClick}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <WeaponIcon type={type} className="w-20 h-20" />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className={`text-[8px] font-bold tracking-[0.2em] uppercase ${isActive ? 'text-cyan-500' : 'text-slate-500'}`}>
                    HP_0{slotIndex + 1}
                </div>
                {isActive && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan]"></div>}
            </div>

            <div className="flex items-center gap-3 relative z-10">
                <div className={`p-1.5 border shrink-0 ${isActive ? 'border-cyan-500/50 bg-black/40' : 'border-slate-600 bg-slate-800'}`}>
                    <WeaponIcon type={type} className={`w-6 h-6 sm:w-8 sm:h-8 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                    <div className={`text-sm sm:text-base font-display font-black uppercase tracking-wide leading-none mb-0.5 truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {t(`WEAPON_${type}_NAME`)}
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono truncate">
                        {type === WeaponType.PISTOL ? 'SIDEARM CLASS' : 'PRIMARY CLASS'}
                    </div>
                </div>
            </div>

            {/* Selection Indicator Line */}
            {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500"></div>}
        </div>
    );
};

export const TacticalBackpack: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | 'GRENADE'>(p.loadout[0]);

    const handleClose = () => engine.toggleInventory();

    const handleDrop = (e: React.DragEvent, loadoutIdx: number) => {
        e.preventDefault();
        if (draggedItemIdx !== null) {
            engine.eventBus.emit<ShopSwapLoadoutEvent>(GameEventType.SHOP_SWAP_LOADOUT, { loadoutIndex: loadoutIdx, inventoryIndex: draggedItemIdx });
            setDraggedItemIdx(null);
        }
    };

    const handleEquipModule = (modId: string) => {
        engine.eventBus.emit(GameEventType.SHOP_EQUIP_MODULE, { target: selectedWeapon, moduleId: modId });
    };

    const handleUnequipModule = (modId: string) => {
        engine.eventBus.emit(GameEventType.SHOP_UNEQUIP_MODULE, { target: selectedWeapon, moduleId: modId });
    };

    // Get current weapon data
    const weaponStats = selectedWeapon === 'GRENADE' 
        ? { name: "GRENADE", damage: PLAYER_STATS.grenadeDamage, range: 400, reloadTime: 0, fireRate: 0 } 
        : WEAPONS[selectedWeapon];
    
    const installedModules = selectedWeapon === 'GRENADE' ? p.grenadeModules : p.weapons[selectedWeapon].modules;
    const maxModules = selectedWeapon === 'GRENADE' || selectedWeapon === WeaponType.PISTOL ? 2 : 3;

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center pointer-events-auto font-mono select-none p-4 sm:p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Main Container - Responsive Sizing */}
            <div className="relative w-full h-full max-w-[1400px] max-h-[900px] bg-[#0b1120] border border-slate-800 shadow-2xl flex flex-col overflow-hidden rounded-lg">
                <CloseButton onClick={handleClose} colorClass="border-slate-700 text-slate-500 hover:text-white hover:bg-slate-800 z-50 top-4 right-4" />

                {/* HEADER */}
                <div className="h-20 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 shrink-0 justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>
                            <span className="text-cyan-500 font-mono text-[10px] font-bold tracking-[0.3em]">SYSTEM: ONLINE</span>
                        </div>
                        <h1 className={`${DS.text.header} text-2xl sm:text-3xl text-white`}>ARMORY OS <span className="text-slate-600">//</span> LOADOUT</h1>
                    </div>
                    <div className="flex gap-6 pr-8">
                        <div className="text-right hidden sm:block">
                            <div className="text-[9px] text-green-500 font-bold mb-1">VITALS</div>
                            <div className="text-xl text-white font-mono font-bold">{Math.ceil(p.hp)}</div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-[9px] text-cyan-500 font-bold mb-1">ARMOR</div>
                            <div className="text-xl text-white font-mono font-bold">{Math.ceil(p.armor)}</div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID - Flex on Mobile, Grid on Desktop */}
                <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 min-h-0">
                    
                    {/* COL 1: INVENTORY (Left - 3 Cols) */}
                    <div className="md:col-span-3 border-r border-slate-800 bg-black/20 flex flex-col relative min-h-0 h-1/3 md:h-auto">
                        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('BACKPACK_HEADER')}</h3>
                            <span className="text-[9px] text-slate-600">{p.inventory.filter(i=>!!i).length}/{INVENTORY_SIZE}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {Array.from({length: INVENTORY_SIZE}).map((_, idx) => (
                                <InventorySlot 
                                    key={idx} 
                                    idx={idx} 
                                    item={p.inventory[idx]} 
                                    onDragStart={(e) => {
                                        if (p.inventory[idx]) {
                                            setDraggedItemIdx(idx);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-800 text-[8px] text-slate-600 text-center">
                            DRAG TO EQUIP
                        </div>
                    </div>

                    {/* COL 2: LOADOUT (Center - 5 Cols) */}
                    <div className="md:col-span-5 border-r border-slate-800 bg-slate-900/10 flex flex-col min-h-0 h-1/3 md:h-auto">
                        <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('LOADOUT_HEADER')}</h3>
                            <div className="text-[9px] text-slate-600 font-mono">ACTIVE CONFIG</div>
                        </div>

                        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                            {p.loadout.map((wType, idx) => (
                                <HardpointCard 
                                    key={idx}
                                    type={wType}
                                    slotIndex={idx}
                                    isActive={selectedWeapon === wType}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onClick={() => setSelectedWeapon(wType)}
                                    t={t}
                                />
                            ))}

                            <div className="my-1 h-px bg-slate-800/50"></div>

                            {/* Grenade Slot */}
                            <div 
                                onClick={() => setSelectedWeapon('GRENADE')}
                                className={`
                                    group relative h-16 border-2 transition-all cursor-pointer flex items-center justify-between px-4
                                    ${selectedWeapon === 'GRENADE' 
                                        ? 'bg-orange-950/20 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                                        : 'bg-slate-900/50 border-slate-700 hover:border-orange-500/50'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-xl ${selectedWeapon === 'GRENADE' ? 'text-orange-500' : 'text-slate-500'}`}>💣</div>
                                    <div>
                                        <div className={`text-xs font-bold tracking-widest ${selectedWeapon === 'GRENADE' ? 'text-orange-400' : 'text-slate-400'}`}>{t('GRENADE')}</div>
                                        <div className="text-[8px] text-slate-600 font-mono">AUXILIARY</div>
                                    </div>
                                </div>
                                <div className="text-lg font-mono font-bold text-slate-500">{p.grenades}</div>
                            </div>
                        </div>
                    </div>

                    {/* COL 3: TECH & MODULES (Right - 4 Cols) */}
                    <div className="md:col-span-4 bg-slate-950 flex flex-col min-h-0 h-1/3 md:h-auto border-t md:border-t-0 border-slate-800">
                        {/* Weapon Detail Header */}
                        <div className="h-32 sm:h-40 relative border-b border-slate-800 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
                            {selectedWeapon !== 'GRENADE' && (
                                <WeaponIcon type={selectedWeapon as WeaponType} className="w-32 h-32 sm:w-40 sm:h-40 text-slate-700 opacity-20 absolute" />
                            )}
                            <div className="relative z-10 text-center px-4">
                                <div className="text-[10px] text-cyan-500 font-bold tracking-[0.2em] mb-1 uppercase">ANALYZING</div>
                                <div className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider truncate">
                                    {selectedWeapon === 'GRENADE' ? t('GRENADE') : t(`WEAPON_${selectedWeapon}_NAME`)}
                                </div>
                            </div>
                        </div>

                        {/* Stats & Modules Scroll Area */}
                        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                            
                            {/* Stats */}
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-3 border-b border-slate-800 pb-1">PERFORMANCE METRICS</h3>
                                <TechStatRow label={t('DMG')} value={weaponStats.damage} barValue={weaponStats.damage / 200} color="red" />
                                <TechStatRow label={t('RNG')} value={weaponStats.range} barValue={weaponStats.range / 1200} color="green" />
                                <TechStatRow label={t('SPD')} value={`${weaponStats.fireRate}ms`} barValue={1 - (weaponStats.fireRate / 1500)} color="yellow" />
                            </div>

                            {/* Installed Modules */}
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-3 border-b border-slate-800 pb-1">
                                    MODULE CONFIG ({installedModules.length}/{maxModules})
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {Array.from({length: maxModules}).map((_, i) => {
                                        const mod = installedModules[i];
                                        return (
                                            <div key={i} className={`
                                                h-10 border flex items-center px-3 justify-between transition-all
                                                ${mod ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800 border-dashed'}
                                            `}>
                                                {mod ? (
                                                    <>
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-cyan-400 text-sm">⚙</span>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[9px] font-bold text-cyan-100 uppercase truncate">{t(`MODULE_${mod.type}_NAME`)}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleUnequipModule(mod.id)} className="text-red-500 hover:text-white px-2">✕</button>
                                                    </>
                                                ) : (
                                                    <span className="text-[9px] text-slate-600 font-mono mx-auto">-- EMPTY SOCKET --</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Module Storage (Equip from here) */}
                            <div className="flex-1 min-h-[100px] flex flex-col">
                                <h3 className="text-[10px] font-bold text-yellow-600 tracking-[0.2em] uppercase mb-2 border-b border-slate-800 pb-1">AVAILABLE MODULES</h3>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                    {p.freeModules.length === 0 && <div className="text-center text-[9px] text-slate-600 py-4 italic">NO COMPATIBLE MODULES</div>}
                                    {p.freeModules.map(mod => (
                                        <button 
                                            key={mod.id}
                                            onClick={() => handleEquipModule(mod.id)}
                                            className="w-full flex justify-between items-center p-2 bg-slate-900 border border-slate-700 hover:border-yellow-500 hover:bg-slate-800 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-slate-500 group-hover:text-yellow-400">⟡</span>
                                                <span className="text-[9px] font-bold text-slate-300 group-hover:text-white truncate">{t(`MODULE_${mod.type}_NAME`)}</span>
                                            </div>
                                            <span className="text-[8px] text-yellow-600 opacity-0 group-hover:opacity-100 shrink-0">INSTALL »</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
    