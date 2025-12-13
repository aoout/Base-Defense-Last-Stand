
import { IInputStrategy } from "../IInputStrategy";
import { GameEngine } from "../../gameService";
import { UserAction, GameEventType } from "../../../types";

type ActionHandler = (engine: GameEngine) => boolean;

export class GameplayInputStrategy implements IInputStrategy {
    
    private readonly actionMap: Partial<Record<UserAction, ActionHandler>> = {
        
        // System Actions
        [UserAction.PAUSE]: (e) => { e.sessionManager.togglePause(); return true; },
        
        [UserAction.ESCAPE]: (e) => {
            const state = e.state;
            if (state.isShopOpen) { e.closeShop(); return true; }
            if (state.isInventoryOpen) { e.toggleInventory(); return true; }
            if (state.isTacticalMenuOpen) { e.toggleTacticalMenu(); return true; }
            if (state.activeTurretId !== undefined) { e.defenseManager.closeTurretUpgrade(); return true; }
            e.sessionManager.togglePause();
            return true;
        },

        // UI Toggles
        [UserAction.INVENTORY]: (e) => { e.toggleInventory(); return true; },
        [UserAction.TACTICAL_MENU]: (e) => { e.toggleTacticalMenu(); return true; },
        
        [UserAction.SHOP]: (e) => { 
            e.shopManager.toggleShop(); 
            return true; 
        },

        // Combat Actions
        [UserAction.INTERACT]: (e) => { 
            e.eventBus.emit(GameEventType.DEFENSE_INTERACT, {}); 
            return true; 
        },
        [UserAction.RELOAD]: (e) => { e.eventBus.emit(GameEventType.PLAYER_RELOAD, { time: e.time.now }); return true; },
        [UserAction.GRENADE]: (e) => { e.eventBus.emit(GameEventType.PLAYER_THROW_GRENADE, {}); return true; },
        [UserAction.SKIP_WAVE]: (e) => { e.missionManager.skipWave(); return true; },

        // Weapon Switching
        [UserAction.WEAPON_1]: (e) => { e.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 0 }); return true; },
        [UserAction.WEAPON_2]: (e) => { e.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 1 }); return true; },
        [UserAction.WEAPON_3]: (e) => { e.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 2 }); return true; },
        [UserAction.WEAPON_4]: (e) => { e.eventBus.emit(GameEventType.PLAYER_SWITCH_WEAPON, { index: 3 }); return true; },

        // Tactical Orders
        [UserAction.ORDER_1]: (e) => { e.defenseManager.issueOrder('PATROL'); e.notifyUI(); return true; },
        [UserAction.ORDER_2]: (e) => { e.defenseManager.issueOrder('FOLLOW'); e.notifyUI(); return true; },
        [UserAction.ORDER_3]: (e) => { e.defenseManager.issueOrder('ATTACK'); e.notifyUI(); return true; }
    };

    handle(action: UserAction, engine: GameEngine): boolean {
        const state = engine.state;

        if (state.isGameOver || state.missionComplete) return false;

        const handler = this.actionMap[action];
        if (handler) {
            if (state.isPaused && action !== UserAction.ESCAPE && action !== UserAction.PAUSE) {
                return false;
            }
            return handler(engine);
        }

        return false;
    }
}
