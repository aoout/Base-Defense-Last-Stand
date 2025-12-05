
import React, { createContext, useContext } from 'react';
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
