
import React from 'react';
import { GameState, AppMode } from '../../types';
import { TURRET_COSTS } from '../../data/registry';

interface InteractPromptProps {
    state: GameState;
}

export const InteractPrompt: React.FC<InteractPromptProps> = ({ state }) => {
    if (state.appMode !== AppMode.GAMEPLAY) return null;
    const p = state.player;
    
    // Shop Interaction
    const distToShop = Math.sqrt(Math.pow(p.x - state.base.x, 2) + Math.pow(p.y - state.base.y, 2));
    if (distToShop < 300 && !state.isShopOpen) {
        return (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                <div className="bg-yellow-500 text-black font-black tracking-wider px-4 py-1 rounded shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-white text-sm">
                    OPEN DEPOT [B]
                </div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-yellow-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
            </div>
        )
    }

    // Turret Interaction
    let nearTurret = false; 
    let closestSpotIdx = -1; 
    let minDist = 60;
    
    state.turretSpots.forEach((t, idx) => { 
        const d = Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2)); 
        if (d < minDist) { 
            nearTurret = true; 
            closestSpotIdx = idx; 
        } 
    });

    if (nearTurret && closestSpotIdx !== -1) {
        const spot = state.turretSpots[closestSpotIdx];
        
        if (spot.builtTurret) { 
            return (
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                    <div className="bg-emerald-500 text-black font-black tracking-wider px-4 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.6)] border-2 border-white text-sm">
                        UPGRADE [E]
                    </div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-emerald-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
                </div>
            ); 
        } else { 
            const currentCount = state.turretSpots.filter(s => s.builtTurret).length; 
            const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement); 
            const canAfford = state.player.score >= cost;
            
            return (
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                    <div className={`${canAfford ? 'bg-blue-600 border-white' : 'bg-red-900 border-red-500'} text-white font-black tracking-wider px-4 py-1 rounded shadow-lg border-2 text-sm flex gap-2 items-center`}>
                        <span>BUILD TURRET [E]</span>
                        <span className={`font-mono ${canAfford ? 'text-blue-200' : 'text-red-300'}`}>-{cost}</span>
                    </div>
                    <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] ${canAfford ? 'border-t-blue-600' : 'border-t-red-900'} border-r-[8px] border-r-transparent mt-[-1px]`}></div>
                </div>
            ); 
        }
    }

    return null;
}
