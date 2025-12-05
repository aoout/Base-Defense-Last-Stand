
import { UserAction, KeyBindingMap } from "../types/input";

export class InputManager {
    private activeActions: Set<UserAction> = new Set();
    private bindings: KeyBindingMap = {};
    public mouse: { x: number, y: number } = { x: 0, y: 0 };

    constructor() {
        this.resetBindings();
    }

    public bind(key: string, action: UserAction) {
        this.bindings[key] = action;
    }

    public unbind(key: string) {
        delete this.bindings[key];
    }

    private resetBindings() {
        this.bindings = {
            'w': UserAction.MOVE_UP, 'W': UserAction.MOVE_UP, 'ArrowUp': UserAction.MOVE_UP,
            's': UserAction.MOVE_DOWN, 'S': UserAction.MOVE_DOWN, 'ArrowDown': UserAction.MOVE_DOWN,
            'a': UserAction.MOVE_LEFT, 'A': UserAction.MOVE_LEFT, 'ArrowLeft': UserAction.MOVE_LEFT,
            'd': UserAction.MOVE_RIGHT, 'D': UserAction.MOVE_RIGHT, 'ArrowRight': UserAction.MOVE_RIGHT,
            
            'r': UserAction.RELOAD, 'R': UserAction.RELOAD,
            'g': UserAction.GRENADE, 'G': UserAction.GRENADE,
            'e': UserAction.INTERACT, 'E': UserAction.INTERACT,
            
            '1': UserAction.WEAPON_1,
            '2': UserAction.WEAPON_2,
            '3': UserAction.WEAPON_3,
            '4': UserAction.WEAPON_4,
            
            'Tab': UserAction.TACTICAL_MENU,
            'c': UserAction.INVENTORY, 'C': UserAction.INVENTORY,
            'b': UserAction.SHOP, 'B': UserAction.SHOP,
            'p': UserAction.PAUSE, 'P': UserAction.PAUSE,
            'Escape': UserAction.ESCAPE,
            'l': UserAction.SKIP_WAVE, 'L': UserAction.SKIP_WAVE,
            
            'F1': UserAction.ORDER_1,
            'F2': UserAction.ORDER_2,
            'F3': UserAction.ORDER_3
        };
    }

    public handleKeyDown(key: string): UserAction | null {
        const action = this.bindings[key];
        if (action) {
            this.activeActions.add(action);
            return action;
        }
        return null;
    }

    public handleKeyUp(key: string): UserAction | null {
        const action = this.bindings[key];
        if (action) {
            this.activeActions.delete(action);
            return action;
        }
        return null;
    }

    public handleMouseDown(button: number) {
        if (button === 0) this.activeActions.add(UserAction.FIRE);
        if (button === 2) this.activeActions.add(UserAction.ALT_FIRE);
    }

    public handleMouseUp(button: number) {
        if (button === 0) this.activeActions.delete(UserAction.FIRE);
        if (button === 2) this.activeActions.delete(UserAction.ALT_FIRE);
    }

    public handleMouseMove(x: number, y: number) {
        this.mouse.x = x;
        this.mouse.y = y;
    }

    public isActive(action: UserAction): boolean {
        return this.activeActions.has(action);
    }
}
