
import React, { useState, useRef } from 'react';
import { GameState, AppMode, Turret } from '../../types';
import { TURRET_COSTS } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';

export const InteractPrompt: React.FC<{ state: GameState }> = () => {
    const { state, engine } = useGame();
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

        // Optimization: Don't use forEach for early exit potential, but for 8 spots it's fine.
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
                    // Fully upgraded, maybe no prompt or "MAX LEVEL"
                    newType = null;
                }
            } else {
                newType = 'BUILD';
                const currentCount = s.turretSpots.filter(ts => ts.builtTurret).length;
                newCost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);
                
                // Stat Check directly from engine
                // Note: Infrastructure cost reduction isn't readily available in state without calc
                // We'd need to replicate getInfrastructureBonus or check StatsManager
                // For transient UI, assume exact cost or accept minor desync if logic is complex
                // Better: Use engine.statManager.get('TURRET_COST', newCost)
                newCost = engine.statManager.get('TURRET_COST', newCost);
                newCost = Math.floor(newCost);
                
                newAfford = p.score >= newCost;
            }
        }

        // Hysteresis/State Update
        if (
            newType !== promptData.type || 
            newCost !== promptData.cost || 
            newAfford !== promptData.canAfford
        ) {
            setPromptData({ type: newType, cost: newCost, canAfford: newAfford });
        }
    });

    if (!promptData.type) return null;

    if (promptData.type === 'DEPOT') {
        return (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                <div className="bg-yellow-500 text-black font-black tracking-wider px-4 py-1 rounded shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-white text-sm">
                    {t('OPEN_DEPOT')}
                </div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-yellow-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
            </div>
        );
    }

    if (promptData.type === 'UPGRADE') {
        return (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                <div className="bg-emerald-500 text-black font-black tracking-wider px-4 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.6)] border-2 border-white text-sm">
                    {t('UPGRADE_TURRET')}
                </div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-emerald-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
            </div>
        );
    }

    if (promptData.type === 'BUILD') {
        return (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                <div className={`${promptData.canAfford ? 'bg-blue-600 border-white' : 'bg-red-900 border-red-500'} text-white font-black tracking-wider px-4 py-1 rounded shadow-lg border-2 text-sm flex gap-2 items-center`}>
                    <span>{t('BUILD_TURRET')}</span>
                    <span className={`font-mono ${promptData.canAfford ? 'text-blue-200' : 'text-red-300'}`}>-{promptData.cost}</span>
                </div>
                <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] ${promptData.canAfford ? 'border-t-blue-600' : 'border-t-red-900'} border-r-[8px] border-r-transparent mt-[-1px]`}></div>
            </div>
        );
    }

    return null;
}
