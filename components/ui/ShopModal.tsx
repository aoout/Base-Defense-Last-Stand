
import React, { useState } from 'react';
import { DefenseUpgradeType, ModuleType, WeaponType, GameEventType, ShopPurchaseEvent, SpaceshipModuleType } from '../../types';
import { PLAYER_STATS, SHOP_PRICES, DEFENSE_UPGRADE_INFO, MODULE_STATS, SPACESHIP_MODULES } from '../../data/registry';
import { WeaponIcon } from './Shared';
import { ModuleWindow } from './ModuleWindow';
import { CyberButton } from './atoms/CyberButton';
import { CyberPanel } from './atoms/CyberPanel';
import { DS } from '../../theme/designSystem';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

// Specialized Card for Shop Items using CyberPanel + DS
const ShopItemCard: React.FC<{
    name: string;
    desc: React.ReactNode;
    cost: number;
    canAfford: boolean;
    disabled?: boolean;
    onClick: () => void;
    label?: string;
    icon?: React.ReactNode;
}> = ({ name, desc, cost, canAfford, disabled, onClick, label, icon }) => {
    return (
        <button
            onClick={onClick}
            disabled={!canAfford || disabled}
            className={`
                group relative flex flex-col justify-between p-4 border transition-all duration-200 h-36 overflow-hidden text-left w-full
                ${disabled 
                    ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed' 
                    : canAfford 
                        ? 'bg-slate-900/80 border-slate-700 hover:border-yellow-400 hover:bg-slate-800 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]' 
                        : 'bg-slate-900/50 border-red-900/30 text-slate-600 cursor-not-allowed'}
            `}
        >
            {/* Background Icon */}
            {icon && <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform group-hover:opacity-10">{icon}</div>}

            <div className="relative z-10 w-full">
                <div className="flex justify-between items-start">
                    <div className={`${DS.text.header} text-sm ${canAfford ? 'text-slate-200 group-hover:text-yellow-100' : 'text-slate-500'}`}>{name}</div>
                    {label && <div className="text-[9px] font-bold bg-emerald-900/50 text-emerald-400 px-1 rounded border border-emerald-700">{label}</div>}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-tight mt-2 line-clamp-3">{desc}</div>
            </div>

            <div className="relative z-10 flex justify-between items-end mt-auto w-full">
                {/* Visual Bar */}
                <div className="h-1 w-12 bg-slate-800 group-hover:w-24 transition-all duration-300">
                    <div className={`h-full ${canAfford && !disabled ? 'bg-yellow-500' : 'bg-red-900'}`}></div>
                </div>
                
                {!(disabled && label) && (
                    <div className="text-right">
                        <div className={`text-lg font-mono font-bold leading-none ${canAfford && !disabled ? 'text-yellow-400' : 'text-slate-600'}`}>{cost}</div>
                        <div className="text-[8px] text-slate-600 uppercase tracking-wider">SCRAPS</div>
                    </div>
                )}
            </div>
        </button>
    );
};

export const ShopModal: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const [activeTab, setActiveTab] = useState<'AMMO' | 'WEAPONS' | 'DEFENSE' | 'MODULES'>('AMMO');

    const handlePurchase = (item: string) => {
        engine.eventBus.emit<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, { itemId: item });
    };

    const handleClose = () => {
        engine.closeShop();
    };

    const getCompatText = (modType: ModuleType) => {
        const config = MODULE_STATS[modType] as any;
        if (config.only) {
            const names = config.only.map((w: string) => {
                if (w === 'GRENADE') return t('COMPAT_GRENADE');
                const key = `WEAPON_${w.replace(/\s+/g, '_').toUpperCase()}_NAME`;
                return t(key);
            }).join(', ');
            return t('COMPAT_LIST', {0: names});
        }
        return t('COMPAT_ALL');
    };

    const isWeaponOwned = (type: WeaponType) => {
        const inLoadout = p.loadout.includes(type);
        const inInventory = p.inventory.some(i => i !== null && i.type === type);
        return inLoadout || inInventory;
    };

    const headerRight = (
        <div className="flex flex-col items-end mr-16">
            <div className={`${DS.text.label} text-yellow-600 mb-1`}>{t('AVAILABLE_FUNDS')}</div>
            <div className="text-3xl font-mono text-white font-bold">{Math.floor(p.score)} <span className="text-sm text-yellow-500">{t('SCRAPS')}</span></div>
        </div>
    );

    return (
        <ModuleWindow
            title={t('DEPOT_TITLE')}
            subtitle={t('DEPOT_SUBTITLE')}
            theme="yellow"
            onClose={handleClose}
            headerRight={headerRight}
            maxWidth="max-w-6xl"
        >
            <div className="flex flex-1 gap-0 w-full h-full min-h-0">
                
                {/* Left Sidebar: Tabs */}
                <div className="w-48 flex flex-col border-r border-yellow-900/30 bg-black/20">
                    {(['AMMO', 'WEAPONS', 'DEFENSE', 'MODULES'] as const).map(tabKey => (
                         <button 
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`
                                py-5 px-4 text-left font-bold text-xs tracking-widest uppercase transition-all border-l-4
                                ${activeTab === tabKey 
                                    ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500' 
                                    : 'text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'}
                            `}
                        >
                            {t(`TAB_${tabKey}`)}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-950/50 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-transparent">
                   {activeTab === 'AMMO' && (
                        <div className="grid grid-cols-3 gap-4">
                            <ShopItemCard 
                                name={t('AMMO_AR_NAME')}
                                desc={t('AMMO_AR_DESC')}
                                cost={SHOP_PRICES.AR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.AR_AMMO}
                                onClick={() => handlePurchase('AR_AMMO')}
                                icon="⁍"
                            />
                            <ShopItemCard 
                                name={t('AMMO_SG_NAME')}
                                desc={t('AMMO_SG_DESC')}
                                cost={SHOP_PRICES.SG_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SG_AMMO}
                                onClick={() => handlePurchase('SG_AMMO')}
                                icon="⁌"
                            />
                            <ShopItemCard 
                                name={t('AMMO_SR_NAME')} 
                                desc={t('AMMO_SR_DESC')}
                                cost={SHOP_PRICES.SR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SR_AMMO}
                                onClick={() => handlePurchase('SR_AMMO')}
                                icon="⌖"
                            />
                            <ShopItemCard 
                                name={t('AMMO_GRENADE_NAME')}
                                desc={t('AMMO_GRENADE_DESC')}
                                cost={SHOP_PRICES.GRENADE} 
                                canAfford={p.score >= SHOP_PRICES.GRENADE && p.grenades < PLAYER_STATS.maxGrenades}
                                onClick={() => handlePurchase('GRENADE')}
                                disabled={p.grenades >= PLAYER_STATS.maxGrenades}
                                icon="💣"
                            />
                            <ShopItemCard 
                                name={t('AMMO_PULSE_NAME')}
                                desc={t('AMMO_PULSE_DESC')}
                                cost={SHOP_PRICES.PULSE_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.PULSE_AMMO}
                                onClick={() => handlePurchase('PULSE_AMMO')}
                                icon="⚡"
                            />
                            <ShopItemCard 
                                name={t('AMMO_FLAME_NAME')}
                                desc={t('AMMO_FLAME_DESC')}
                                cost={SHOP_PRICES.FLAME_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.FLAME_AMMO}
                                onClick={() => handlePurchase('FLAME_AMMO')}
                                icon="🔥"
                            />
                             <ShopItemCard 
                                name={t('AMMO_GL_NAME')}
                                desc={t('AMMO_GL_DESC')}
                                cost={SHOP_PRICES.GL_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.GL_AMMO}
                                onClick={() => handlePurchase('GL_AMMO')}
                                icon="💥"
                            />
                        </div>
                   )}

                   {activeTab === 'WEAPONS' && (
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: 'WEAPON_PULSE_RIFLE_NAME', desc: 'WEAPON_PULSE_DESC', id: 'WEAPON_PULSE', cost: SHOP_PRICES.WEAPON_PULSE, type: WeaponType.PULSE_RIFLE },
                                { name: 'WEAPON_FLAMETHROWER_NAME', desc: 'WEAPON_FLAME_DESC', id: 'WEAPON_FLAME', cost: SHOP_PRICES.WEAPON_FLAME, type: WeaponType.FLAMETHROWER },
                                { name: 'WEAPON_GRENADE_LAUNCHER_NAME', desc: 'WEAPON_GL_DESC', id: 'WEAPON_GL', cost: SHOP_PRICES.WEAPON_GL, type: WeaponType.GRENADE_LAUNCHER },
                            ].map(w => {
                                const owned = isWeaponOwned(w.type);
                                return (
                                    <ShopItemCard 
                                        key={w.id}
                                        name={t(w.name)}
                                        desc={t(w.desc)}
                                        cost={w.cost} 
                                        canAfford={p.score >= w.cost}
                                        disabled={owned}
                                        label={owned ? t('OWNED') : undefined}
                                        onClick={() => handlePurchase(w.id)}
                                        icon={<WeaponIcon type={w.type} />}
                                    />
                                );
                            })}
                        </div>
                   )}

                   {activeTab === 'DEFENSE' && (
                       <div className="grid grid-cols-2 gap-4">
                           <ShopItemCard 
                                name={t('UPGRADE_INFECTION')}
                                desc={t('UPGRADE_INFECTION_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                onClick={() => handlePurchase(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                label={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL) ? t('OWNED') : undefined}
                                icon="🛡️"
                            />
                            <ShopItemCard 
                                name={t('UPGRADE_SPORE')}
                                desc={t('UPGRADE_SPORE_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)}
                                onClick={() => handlePurchase(DefenseUpgradeType.SPORE_BARRIER)}
                                label={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER) ? t('OWNED') : undefined}
                                icon="🧱"
                            />
                            <ShopItemCard 
                                name={t('UPGRADE_IMPACT')}
                                desc={t('UPGRADE_IMPACT_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)}
                                onClick={() => handlePurchase(DefenseUpgradeType.IMPACT_PLATE)}
                                label={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE) ? t('OWNED') : undefined}
                                icon="🛑"
                            />
                       </div>
                   )}

                   {activeTab === 'MODULES' && (
                       <div className="grid grid-cols-2 gap-4">
                           {Object.values(ModuleType).map(mType => {
                               const stats = MODULE_STATS[mType];
                               return (
                                   <ShopItemCard
                                        key={mType}
                                        name={t(`MODULE_${mType}_NAME`)}
                                        desc={
                                            <>
                                                <div>{t(`MODULE_${mType}_DESC`)}</div>
                                                <div className="text-[9px] text-yellow-700 italic mt-1 font-bold">
                                                    {getCompatText(mType)}
                                                </div>
                                            </>
                                        }
                                        cost={stats.cost}
                                        canAfford={p.score >= stats.cost}
                                        onClick={() => handlePurchase(mType)}
                                        icon="⚙️"
                                   />
                               );
                           })}
                       </div>
                   )}
               </div>
           </div>
        </ModuleWindow>
    );
};
