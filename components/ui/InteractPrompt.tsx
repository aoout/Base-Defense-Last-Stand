
import React, { useState, useRef } from 'react';
import { GameState, AppMode, UserAction } from '../../types';
import { TURRET_COSTS } from '../../data/registry';
import { useLocale } from '../contexts/LocaleContext';
import { useGame, useGameLoop } from '../contexts/GameContext';
import { CyberPanel } from './atoms/CyberPanel';
import { DS } from '../../theme/designSystem';

export const InteractPrompt: React.FC<{ state: GameState }> = () => {
    const { engine } = useGame();
    const { t } = useLocale();
    const containerRef = useRef<HTMLDivElement>(null);
    
    // State to trigger render only when CONTENT changes (Type, Cost, Affordability)
    // We do NOT store X/Y here to avoid re-rendering React components every frame.
    const [promptData, setPromptData] = useState<{
        type: 'DEPOT' | 'BUILD' | 'UPGRADE' | null,
        cost?: number,
        canAfford?: boolean
    }>({ type: null });

    // Helper to get clean key name dynamically
    const getKeyName = (action: UserAction) => {
        const raw = engine.inputManager.getKeyForAction(action) || '';
        return raw.replace('Key', '').replace('Digit', '').toUpperCase();
    };

    const interactKey = getKeyName(UserAction.INTERACT);
    const shopKey = getKeyName(UserAction.SHOP);

    // Use loop to poll distances and update position
    useGameLoop(() => {
        const s = engine.state;
        
        // Hide if not in gameplay
        if (s.appMode !== AppMode.GAMEPLAY) {
            if (promptData.type !== null) setPromptData({ type: null });
            if (containerRef.current) containerRef.current.style.opacity = '0';
            return;
        }

        const p = s.player;
        let newType: 'DEPOT' | 'BUILD' | 'UPGRADE' | null = null;
        let newCost = 0;
        let newAfford = false;
        
        // Target Coordinates for visual positioning
        let targetX = 0;
        let targetY = 0;
        let targetRadius = 20;

        // 1. Logic: Determine the active target
        
        // Shop Check
        const distToShop = Math.sqrt(Math.pow(p.x - s.base.x, 2) + Math.pow(p.y - s.base.y, 2));
        if (distToShop < 300 && !s.isShopOpen) {
            newType = 'DEPOT';
            targetX = s.base.x;
            targetY = s.base.y;
            targetRadius = 60; // Base is bigger
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
            targetX = spot.x;
            targetY = spot.y;
            targetRadius = 25;

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

        // 2. React Update: Only if data changes
        if (
            newType !== promptData.type || 
            newCost !== promptData.cost || 
            newAfford !== promptData.canAfford
        ) {
            setPromptData({ type: newType, cost: newCost, canAfford: newAfford });
        }

        // 3. Visual Update: Direct DOM manipulation for smooth 60FPS tracking
        if (containerRef.current) {
            if (newType) {
                // World to Screen Space
                const screenX = targetX - s.camera.x;
                const screenY = targetY - s.camera.y;
                
                // Offset: Move above the object (radius + padding)
                const yOffset = -(targetRadius + 40);

                containerRef.current.style.transform = `translate(${screenX}px, ${screenY + yOffset}px) translate(-50%, 0)`;
                containerRef.current.style.opacity = '1';
            } else {
                containerRef.current.style.opacity = '0';
                // Reset transform to avoid it jumping around when hidden
                // containerRef.current.style.transform = `translate(-9999px, -9999px)`;
            }
        }
    });

    // We render an empty container if no type, but we keep the ref attached 
    // so we can fade it out via style manipulation instead of unmounting.
    // This allows the useGameLoop to control visibility cleanly.
    
    let content = null;
    let borderColor = 'border-slate-500';
    let textColor = 'text-white';

    if (promptData.type === 'DEPOT') {
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-400';
        content = (
            <div className="flex gap-2 items-center">
                <span className="font-black text-yellow-300 bg-yellow-900/50 px-1.5 rounded">[{shopKey}]</span>
                <span>{t('OPEN_DEPOT')}</span>
            </div>
        );
    } else if (promptData.type === 'UPGRADE') {
        borderColor = 'border-emerald-500';
        textColor = 'text-emerald-400';
        content = (
            <div className="flex gap-2 items-center">
                <span className="font-black text-emerald-300 bg-emerald-900/50 px-1.5 rounded">[{interactKey}]</span>
                <span>{t('UPGRADE_TURRET')}</span>
            </div>
        );
    } else if (promptData.type === 'BUILD') {
        borderColor = promptData.canAfford ? 'border-cyan-500' : 'border-red-500';
        textColor = promptData.canAfford ? 'text-cyan-400' : 'text-red-400';
        content = (
            <div className="flex gap-3 items-center">
                <span className={`font-black px-1.5 rounded ${promptData.canAfford ? 'text-cyan-300 bg-cyan-900/50' : 'text-red-300 bg-red-900/50'}`}>
                    [{interactKey}]
                </span>
                <span>{t('BUILD_TURRET')}</span>
                <span className={`font-mono font-bold ${promptData.canAfford ? 'text-white' : 'text-red-500'}`}>-{promptData.cost}</span>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="absolute top-0 left-0 z-40 pointer-events-none transition-opacity duration-200 opacity-0 will-change-transform"
        >
            <div className="animate-bounce">
                <CyberPanel className={`px-4 py-2 ${borderColor} ${textColor} border-2`} noBorder={false}>
                    <div className={`${DS.text.label} flex items-center whitespace-nowrap`}>
                        {content}
                    </div>
                </CyberPanel>
                {/* Triangle Pointer */}
                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] ${borderColor.replace('border-','border-t-')} border-r-[6px] border-r-transparent mx-auto`}></div>
            </div>
        </div>
    );
}
