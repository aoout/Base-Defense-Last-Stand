
import React, { useState } from 'react';
import { WeaponType, ModuleType, WeaponModule, ShopSwapLoadoutEvent, GameEventType } from '../../types';
import { PLAYER_STATS, MODULE_STATS } from '../../data/registry';
import { INVENTORY_SIZE } from '../../constants';
import { CloseButton, WeaponIcon, TechCard, CRTScanline, SystemIcon } from './Shared';
import { ModuleWindow } from './ModuleWindow';
import { CyberPanel } from './atoms/CyberPanel';
import { CyberButton } from './atoms/CyberButton';
import { DS } from '../../theme/designSystem';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

// --- SUB-COMPONENTS ---

const WeaponCard: React.FC<{ 
    type: WeaponType, 
    modules: WeaponModule[], 
    slotIndex: number, 
    active?: boolean,
    onDrop: (e: React.DragEvent) => void,
    onClick: () => void 
}> = ({ type, modules, slotIndex, active, onDrop, onClick }) => {
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const maxModules = type === WeaponType.PISTOL ? 2 : 3;

    return (
        <div 
            className={`
                relative h-32 border-2 flex flex-col items-center justify-center transition-all group cursor-pointer overflow-hidden
                ${active 
                    ? 'bg-cyan-900/30 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
            `}
            onDragOver={handleDragOver}
            onDrop={onDrop}
            onClick={onClick}
        >
            <div className={`absolute top-2 left-2 ${DS.text.label} text-slate-500 group-hover:text-cyan-400`}>HARDPOINT 0{slotIndex + 1}</div>
            
            <WeaponIcon type={type} className={`w-16 h-16 transition-all duration-300 ${active ? 'text-white drop-shadow-[0_0_10px_cyan]' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'}`} />
            
            <div className="absolute bottom-2 flex gap-1">
                {Array.from({length: maxModules}).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full border border-slate-900 ${i < modules.length ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-slate-700'}`}></div>
                ))}
            </div>
        </div>
    );
};

// Replaces the modal with an embedded panel
const AssemblyView: React.FC<{ weaponType: WeaponType | 'GRENADE' }> = ({ weaponType }) => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    
    let installed: WeaponModule[] = [];
    let maxSlots = 3;
    let title = "";

    if (weaponType === 'GRENADE') {
        installed = p.grenadeModules;
        maxSlots = 2;
        title = t('GRENADE');
    } else {
        installed = p.weapons[weaponType].modules;
        if (weaponType === WeaponType.PISTOL) maxSlots = 2;
        title = t(`WEAPON_${weaponType.replace(/\s+/g, '_').toUpperCase()}_NAME`);
    }

    const handleUnequip = (modId: string) => {
        engine.eventBus.emit(GameEventType.SHOP_UNEQUIP_MODULE, { target: weaponType, moduleId: modId });
    };

    return (
        <CyberPanel className="flex flex-col h-full animate-fadeIn p-6" noBorder>
            <div className="flex justify-between items-center mb-6 border-b border-cyan-900/50 pb-2">
                <div className={`${DS.text.label} text-cyan-500`}>{t('ASSEMBLY_TITLE')}</div>
                <div className={`${DS.text.header} text-white text-lg`}>{title}</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)] border border-dashed border-cyan-900/50">
                {/* Connecting Lines Graphic */}
                <div className="absolute top-1/2 left-10 right-10 h-px bg-cyan-800 -z-10"></div>
                
                <div className="flex gap-8 z-10">
                    {Array.from({length: maxSlots}).map((_, i) => {
                        const mod = installed[i];
                        return (
                            <div key={i} className="flex flex-col items-center gap-3 group">
                                <div className={`w-24 h-24 border-2 flex items-center justify-center relative transition-all ${mod ? 'border-cyan-500 bg-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-slate-700 bg-slate-900/50 border-dashed'}`}>
                                    {mod ? (
                                        <>
                                            <div className="text-3xl text-cyan-300 font-black tracking-tighter">MOD</div>
                                            <button onClick={() => handleUnequip(mod.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 shadow-lg font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                        </>
                                    ) : (
                                        <div className="text-slate-600 font-bold text-[10px]">{t('EMPTY_SLOT')}</div>
                                    )}
                                </div>
                                <div className="h-4 text-[10px] font-bold text-cyan-200 text-center max-w-[100px] truncate leading-tight">
                                    {mod ? t(`MODULE_${mod.type}_NAME`) : ''}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </CyberPanel>
    );
};

export const TacticalBackpack: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | 'GRENADE' | null>(p.loadout[0]);

    const handleClose = () => engine.toggleInventory();

    const handleDrop = (e: React.DragEvent, loadoutIdx: number) => {
        e.preventDefault();
        if (draggedItemIdx !== null) {
            engine.eventBus.emit<ShopSwapLoadoutEvent>(GameEventType.SHOP_SWAP_LOADOUT, { loadoutIndex: loadoutIdx, inventoryIndex: draggedItemIdx });
            setDraggedItemIdx(null);
        }
    };

    const handleEquipModule = (modId: string) => {
        if (selectedWeapon) {
            engine.eventBus.emit(GameEventType.SHOP_EQUIP_MODULE, { target: selectedWeapon, moduleId: modId });
        }
    };

    const headerRight = (
        <div className="flex gap-6 items-center mr-16">
            <div className="flex flex-col items-center">
                <span className={`${DS.text.label} text-green-500`}>{t('HEALTH')}</span>
                <span className="text-xl font-mono text-white">{Math.floor(p.hp)}/{p.maxHp}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="flex flex-col items-center">
                <span className={`${DS.text.label} text-cyan-500`}>{t('ARMOR')}</span>
                <span className="text-xl font-mono text-white">{Math.floor(p.armor)}/{p.maxArmor}</span>
            </div>
        </div>
    );

    return (
        <ModuleWindow
            title={t('BACKPACK_HEADER')}
            subtitle="TACTICAL LOADOUT"
            theme="cyan"
            onClose={handleClose}
            headerRight={headerRight}
            maxWidth="max-w-7xl"
        >
            <div className="flex flex-col h-full w-full gap-6 min-h-0">
                
                {/* TOP: Active Loadout Strip */}
                <div className="h-40 shrink-0">
                     <div className="grid grid-cols-5 gap-4 h-full">
                        {p.loadout.map((wType, idx) => (
                            <WeaponCard 
                                key={idx}
                                type={wType}
                                modules={p.weapons[wType].modules}
                                slotIndex={idx}
                                active={selectedWeapon === wType}
                                onDrop={(e) => handleDrop(e, idx)}
                                onClick={() => setSelectedWeapon(wType)}
                            />
                        ))}
                        {/* Grenade Slot */}
                        <div 
                            className={`
                                relative border-2 flex flex-col items-center justify-center transition-all group cursor-pointer overflow-hidden
                                ${selectedWeapon === 'GRENADE' ? 'bg-orange-900/30 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                            `}
                            onClick={() => setSelectedWeapon('GRENADE')}
                        >
                            <div className={`absolute top-2 left-2 ${DS.text.label} text-slate-500 group-hover:text-orange-400`}>{t('GRENADE')}</div>
                            <div className="text-4xl text-orange-500 mb-2">💣</div>
                            <div className="text-white font-mono font-bold text-xl">x{p.grenades}</div>
                            <div className="absolute bottom-2 flex gap-1">
                                {Array.from({length: 2}).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full border border-slate-900 ${i < p.grenadeModules.length ? 'bg-orange-400 shadow-[0_0_5px_orange]' : 'bg-slate-700'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: Split View */}
                <div className="flex-1 flex gap-6 min-h-0">
                    
                    {/* LEFT: Inventory & Modules */}
                    <div className="w-[400px] flex flex-col gap-6 shrink-0">
                        {/* Modules */}
                        <CyberPanel className="flex-1 p-4 flex flex-col min-h-0">
                            <h3 className={`${DS.text.label} text-cyan-500 border-b border-cyan-900/50 pb-2 mb-2`}>{t('MODULES_STORAGE')}</h3>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-900 space-y-2">
                                {p.freeModules.length === 0 && <div className="text-slate-600 text-center py-8 italic text-xs">NO MODULES</div>}
                                {p.freeModules.map(mod => (
                                    <div key={mod.id} className="p-3 bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 transition-all cursor-pointer group flex justify-between items-center" onClick={() => handleEquipModule(mod.id)}>
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-cyan-300">{t(`MODULE_${mod.type}_NAME`)}</span>
                                        <span className="text-cyan-600 group-hover:text-cyan-400 text-[10px] font-bold uppercase tracking-wider">EQUIP &gt;</span>
                                    </div>
                                ))}
                            </div>
                        </CyberPanel>

                        {/* Inventory Grid */}
                        <CyberPanel className="h-48 p-4 flex flex-col">
                            <h3 className={`${DS.text.label} text-slate-500 mb-3`}>{t('BACKPACK_HEADER')}</h3>
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                <div className="grid grid-cols-5 gap-2">
                                    {Array.from({length: INVENTORY_SIZE}).map((_, idx) => {
                                        const item = p.inventory[idx];
                                        return (
                                            <div 
                                                key={idx}
                                                draggable={!!item}
                                                onDragStart={(e) => {
                                                    if (item) {
                                                        setDraggedItemIdx(idx);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }
                                                }}
                                                className={`
                                                    aspect-square border flex items-center justify-center relative transition-all
                                                    ${item 
                                                        ? 'bg-slate-800 border-slate-500 hover:border-white cursor-grab active:cursor-grabbing shadow-sm' 
                                                        : 'bg-black/20 border-slate-800/50'}
                                                `}
                                            >
                                                {item && <WeaponIcon type={item.type} className="w-5 h-5 text-slate-400" />}
                                                <div className="absolute top-0.5 left-1 text-[7px] text-slate-700 font-mono">{idx + 1}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CyberPanel>
                    </div>

                    {/* RIGHT: Assembly View */}
                    <div className="flex-1 relative">
                        {selectedWeapon ? (
                            <AssemblyView weaponType={selectedWeapon} />
                        ) : (
                            <CyberPanel className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                                <div className="text-6xl opacity-30">⚙</div>
                                <div className="text-sm font-mono tracking-widest">{t('LOADOUT_HINT')}</div>
                            </CyberPanel>
                        )}
                    </div>
                </div>
            </div>
        </ModuleWindow>
    );
};
