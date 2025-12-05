
import React, { useState } from 'react';
import { DefenseUpgradeType, ModuleType, WeaponType, GameEventType, ShopPurchaseEvent } from '../../types';
import { PLAYER_STATS, SHOP_PRICES, DEFENSE_UPGRADE_INFO, MODULE_STATS } from '../../data/registry';
import { CloseButton } from './Shared';
import { useLocale } from '../contexts/LocaleContext';
import { useGame } from '../contexts/GameContext';

interface ShopItemProps { 
    name: string; 
    amount?: React.ReactNode; 
    cost: number; 
    canAfford: boolean; 
    disabled?: boolean; 
    highlight?: boolean; 
    onClick: () => void; 
    label?: string; 
}

const ShopItem: React.FC<ShopItemProps> = ({ name, amount, cost, canAfford, disabled, highlight, onClick, label }) => (
    <button onClick={onClick} disabled={!canAfford || disabled} className={`p-5 rounded-xl border flex justify-between items-center transition-all group relative overflow-hidden ${disabled ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed opacity-60' : canAfford ? (highlight ? 'bg-gray-800 border-cyan-600 hover:border-cyan-400 text-white' : 'bg-gray-800 border-gray-600 hover:border-yellow-500 text-white') : 'bg-gray-800 border-red-900/30 text-gray-500 cursor-not-allowed'}`}>
        <div className="flex flex-col items-start z-10 max-w-[70%]">
            <span className={`font-bold text-lg text-left leading-tight ${highlight ? 'text-cyan-200' : ''}`}>{name}</span>
            {amount && <span className="text-xs text-gray-400 group-hover:text-gray-300 text-left mt-1 block">{amount}</span>}
        </div>
        <div className="flex flex-col items-end z-10">{label ? (<span className="text-green-500 font-bold tracking-widest">{label}</span>) : (<><span className={`text-xl font-mono font-bold ${canAfford && !disabled ? "text-yellow-400 group-hover:text-yellow-300" : ""}`}>{cost}</span><span className="text-[10px] uppercase tracking-wider">Scraps</span></>)}</div>
        {canAfford && !disabled && (<div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${highlight ? 'bg-cyan-500/10' : 'bg-yellow-500/5'}`}></div>)}
    </button>
);

export const ShopModal: React.FC = () => {
    const { state, engine } = useGame();
    const { t } = useLocale();
    const p = state.player;
    const [activeTab, setActiveTab] = useState<'AMMO' | 'WEAPONS' | 'DEFENSE' | 'MODULES'>('AMMO');

    const handlePurchase = (item: string) => {
        engine.eventBus.emit<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, { itemId: item });
    };

    const handleClose = () => {
        engine.state.isShopOpen = false;
    };

    const getCompatText = (modType: ModuleType) => {
        const config = MODULE_STATS[modType] as any;
        if (config.only) {
            const names = config.only.map((w: string) => {
                if (w === 'GRENADE') return t('COMPAT_GRENADE');
                // Format key: Pulse Rifle -> PULSE_RIFLE
                const key = `WEAPON_${w.replace(/\s+/g, '_').toUpperCase()}_NAME`;
                return t(key);
            }).join(', ');
            return t('COMPAT_LIST', {0: names});
        }
        return t('COMPAT_ALL');
    };

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-40 backdrop-blur-sm">
           <div className="bg-gray-900 border-2 border-yellow-600/50 p-8 rounded-2xl shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col h-[600px]">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 p-32 bg-yellow-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

               {/* Close Button Top Right (Fixed) */}
               <CloseButton onClick={handleClose} colorClass="border-yellow-600 text-yellow-500 hover:bg-yellow-900/40 hover:text-yellow-300" />

               {/* Header */}
               <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-4 mt-8">
                   <div>
                       <h2 className="text-4xl font-black text-white tracking-tight">{t('DEPOT_TITLE').split(" ")[0]} <span className="text-yellow-500">{t('DEPOT_TITLE').split(" ")[1]}</span></h2>
                       <p className="text-gray-500 text-sm mt-1">{t('DEPOT_SUBTITLE')}</p>
                   </div>
                   <div className="text-right">
                       <div className="text-sm text-gray-400 uppercase tracking-widest">{t('FUNDS')}</div>
                       <div className="text-3xl font-mono text-yellow-400 font-bold">{Math.floor(p.score)} <span className="text-lg">{t('SCRAPS')}</span></div>
                   </div>
               </div>

               {/* Tabs */}
               <div className="flex space-x-4 mb-6">
                    {(['AMMO', 'WEAPONS', 'DEFENSE', 'MODULES'] as const).map(tabKey => (
                         <button 
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`flex-1 py-3 text-center font-bold tracking-wider rounded-t-lg transition-colors border-b-2 
                                ${activeTab === tabKey 
                                ? 'bg-gray-800 text-yellow-400 border-yellow-500' 
                                : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'}`}
                        >
                            {t(`TAB_${tabKey}`)}
                        </button>
                    ))}
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto pr-2">
                   {activeTab === 'AMMO' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <ShopItem 
                                name={t('AMMO_AR_NAME')}
                                amount={t('AMMO_AR_DESC')}
                                cost={SHOP_PRICES.AR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.AR_AMMO}
                                onClick={() => handlePurchase('AR_AMMO')}
                            />
                            <ShopItem 
                                name={t('AMMO_SG_NAME')}
                                amount={t('AMMO_SG_DESC')}
                                cost={SHOP_PRICES.SG_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SG_AMMO}
                                onClick={() => handlePurchase('SG_AMMO')}
                            />
                            <ShopItem 
                                name={t('AMMO_SR_NAME')} 
                                amount={t('AMMO_SR_DESC')}
                                cost={SHOP_PRICES.SR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SR_AMMO}
                                onClick={() => handlePurchase('SR_AMMO')}
                            />
                            <ShopItem 
                                name={t('AMMO_GRENADE_NAME')}
                                amount={t('AMMO_GRENADE_DESC')}
                                cost={SHOP_PRICES.GRENADE} 
                                canAfford={p.score >= SHOP_PRICES.GRENADE && p.grenades < PLAYER_STATS.maxGrenades}
                                onClick={() => handlePurchase('GRENADE')}
                                disabled={p.grenades >= PLAYER_STATS.maxGrenades}
                            />
                            
                             {/* New Ammo Types */}
                            <ShopItem 
                                name={t('AMMO_PULSE_NAME')}
                                amount={t('AMMO_PULSE_DESC')}
                                cost={SHOP_PRICES.PULSE_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.PULSE_AMMO}
                                onClick={() => handlePurchase('PULSE_AMMO')}
                            />
                            <ShopItem 
                                name={t('AMMO_FLAME_NAME')}
                                amount={t('AMMO_FLAME_DESC')}
                                cost={SHOP_PRICES.FLAME_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.FLAME_AMMO}
                                onClick={() => handlePurchase('FLAME_AMMO')}
                            />
                             <ShopItem 
                                name={t('AMMO_GL_NAME')}
                                amount={t('AMMO_GL_DESC')}
                                cost={SHOP_PRICES.GL_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.GL_AMMO}
                                onClick={() => handlePurchase('GL_AMMO')}
                            />
                        </div>
                   )}

                   {activeTab === 'WEAPONS' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <ShopItem 
                                name={t('WEAPON_PULSE_RIFLE_NAME')}
                                amount={t('WEAPON_PULSE_DESC')}
                                cost={SHOP_PRICES.WEAPON_PULSE} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_PULSE}
                                onClick={() => handlePurchase('WEAPON_PULSE')}
                                highlight
                            />
                            <ShopItem 
                                name={t('WEAPON_FLAMETHROWER_NAME')}
                                amount={t('WEAPON_FLAME_DESC')}
                                cost={SHOP_PRICES.WEAPON_FLAME} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_FLAME}
                                onClick={() => handlePurchase('WEAPON_FLAME')}
                                highlight
                            />
                            <ShopItem 
                                name={t('WEAPON_GRENADE_LAUNCHER_NAME')}
                                amount={t('WEAPON_GL_DESC')}
                                cost={SHOP_PRICES.WEAPON_GL} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_GL}
                                onClick={() => handlePurchase('WEAPON_GL')}
                                highlight
                            />
                        </div>
                   )}

                   {activeTab === 'DEFENSE' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           <ShopItem 
                                name={t('UPGRADE_INFECTION')}
                                amount={t('UPGRADE_INFECTION_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                onClick={() => handlePurchase(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                label={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL) ? t('OWNED') : undefined}
                                highlight
                            />
                            <ShopItem 
                                name={t('UPGRADE_SPORE')}
                                amount={t('UPGRADE_SPORE_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)}
                                onClick={() => handlePurchase(DefenseUpgradeType.SPORE_BARRIER)}
                                label={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER) ? t('OWNED') : undefined}
                                highlight
                            />
                            <ShopItem 
                                name={t('UPGRADE_IMPACT')}
                                amount={t('UPGRADE_IMPACT_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)}
                                onClick={() => handlePurchase(DefenseUpgradeType.IMPACT_PLATE)}
                                label={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE) ? t('OWNED') : undefined}
                                highlight
                            />
                       </div>
                   )}

                   {activeTab === 'MODULES' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           {Object.values(ModuleType).map(mType => {
                               const stats = MODULE_STATS[mType];
                               return (
                                   <ShopItem
                                        key={mType}
                                        name={t(`MODULE_${mType}_NAME`)}
                                        amount={
                                            <>
                                                <div>{t(`MODULE_${mType}_DESC`)}</div>
                                                <div className="text-[10px] text-gray-500 italic mt-1 font-mono leading-tight">
                                                    {getCompatText(mType)}
                                                </div>
                                            </>
                                        }
                                        cost={stats.cost}
                                        canAfford={p.score >= stats.cost}
                                        onClick={() => handlePurchase(mType)}
                                        highlight
                                   />
                               );
                           })}
                       </div>
                   )}
               </div>
           </div>
        </div>
    );
};
