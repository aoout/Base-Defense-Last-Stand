
import React, { useState } from 'react';
import { GameState, AppMode } from '../../types';
import { TURRET_COSTS } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { CyberPanel } from './atoms/CyberPanel';
import { DS } from '../../theme/designSystem';

export const InteractPrompt: React.FC<{ state: GameState }> = () => {
    const { engine } = useGame();
    const { t } = useLocale();
    
    // State to trigger render only when prompt changes
    const [promptData, setPromptData] = useState<{
        type: 'DEPOT' | 'BUILD' | 'UPGRADE' | null,
        cost?: number,
        canAfford?: boolean
    }>({ type: null });

    // Use loop to poll distances
    useGameLoop(() => {
        const s = engine.state;
        if (s.appMode !== AppMode.GAMEPLAY) {
            if (promptData.type !== null) setPromptData({ type: null });
            return;
        }

        const p = s.player;
        let newType: 'DEPOT' | 'BUILD' | 'UPGRADE' | null = null;
        let newCost = 0;
        let newAfford = false;

        // Shop Check
        const distToShop = Math.sqrt(Math.pow(p.x - s.base.x, 2) + Math.pow(p.y - s.base.y, 2));
        if (distToShop < 300 && !s.isShopOpen) {
            newType = 'DEPOT';
        }

        // Turret Check (Priority over shop if closer)
        let nearTurret = false;
        let closestSpotIdx = -1;
        let minDist = 60;

        for (let i = 0; i < s.turretSpots.length; i++) {
            const spot = s.turretSpots[i];
            const d = Math.sqrt(Math.pow(p.x - spot.x, 2) + Math.pow(p.y - spot.y, 2));
            if (d < minDist) {
                nearTurret = true;
                closestSpotIdx = i;
                break; // Found one close enough
            }
        }

        if (nearTurret && closestSpotIdx !== -1) {
            const spot = s.turretSpots[closestSpotIdx];
            if (spot.builtTurret) {
                if (spot.builtTurret.level < 2) {
                    newType = 'UPGRADE';
                } else {
                    newType = null;
                }
            } else {
                newType = 'BUILD';
                const currentCount = s.turretSpots.filter(ts => ts.builtTurret).length;
                let cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);
                cost = engine.statManager.get('TURRET_COST', cost);
                newCost = Math.floor(cost);
                newAfford = p.score >= newCost;
            }
        }

        if (
            newType !== promptData.type || 
            newCost !== promptData.cost || 
            newAfford !== promptData.canAfford
        ) {
            setPromptData({ type: newType, cost: newCost, canAfford: newAfford });
        }
    });

    if (!promptData.type) return null;

    let content = null;
    let borderColor = 'border-slate-500';
    let textColor = 'text-white';

    if (promptData.type === 'DEPOT') {
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-400';
        content = (
            <div className="flex gap-2 items-center">
                <span className="font-bold">[{t('ACT_INTERACT')}]</span>
                <span>{t('OPEN_DEPOT')}</span>
            </div>
        );
    } else if (promptData.type === 'UPGRADE') {
        borderColor = 'border-emerald-500';
        textColor = 'text-emerald-400';
        content = (
            <div className="flex gap-2 items-center">
                <span className="font-bold">[{t('ACT_INTERACT')}]</span>
                <span>{t('UPGRADE_TURRET')}</span>
            </div>
        );
    } else if (promptData.type === 'BUILD') {
        borderColor = promptData.canAfford ? 'border-cyan-500' : 'border-red-500';
        textColor = promptData.canAfford ? 'text-cyan-400' : 'text-red-400';
        content = (
            <div className="flex gap-3 items-center">
                <span className="font-bold">[{t('ACT_INTERACT')}]</span>
                <span>{t('BUILD_TURRET')}</span>
                <span className={`font-mono font-bold ${promptData.canAfford ? 'text-white' : 'text-red-500'}`}>-{promptData.cost}</span>
            </div>
        );
    }

    return (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
            <CyberPanel className={`px-4 py-2 ${borderColor} ${textColor} border-2`} noBorder={false}>
                <div className={`${DS.text.label} flex items-center`}>
                    {content}
                </div>
            </CyberPanel>
            {/* Triangle Pointer */}
            <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] ${borderColor.replace('border-','border-t-')} border-r-[6px] border-r-transparent mx-auto`}></div>
        </div>
    );
}
