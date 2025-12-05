
import React, { createContext, useContext, useEffect } from 'react';
import { GameEngine } from '../../services/gameService';
import { GameState } from '../../types';

interface GameContextProps {
    engine: GameEngine;
    state: GameState;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ engine: GameEngine; state: GameState; children: React.ReactNode }> = ({ engine, state, children }) => {
    return (
        <GameContext.Provider value={{ engine, state }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

/**
 * Optimized Hook for High-Frequency updates.
 * Registers a callback to run inside the requestAnimationFrame loop of the engine.
 * Does NOT trigger React re-renders.
 */
export const useGameLoop = (callback: (dt: number, time: number) => void, deps: React.DependencyList = []) => {
    const { engine } = useGame();

    useEffect(() => {
        engine.registerLoopListener(callback);
        return () => {
            engine.unregisterLoopListener(callback);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine, ...deps]);
};
