
import { UserAction, KeyBindingMap, InputConfig } from "../types/input";

export class InputManager {
    private activeActions: Set<UserAction> = new Set();
    
    // Reverse map for O(1) lookup during gameplay: KeyCode -> Action
    private keyMap: KeyBindingMap = {};
    
    // Canonical config for UI and Save: Action -> KeyCode
    private config: InputConfig = {} as InputConfig;
    
    public mouse: { x: number, y: number } = { x: 0, y: 0 };
    private storageKey = 'VANGUARD_KEYBINDINGS_V1';

    constructor() {
        this.loadBindings();
    }

    private getDefaultConfig(): InputConfig {
        return {
            [UserAction.MOVE_UP]: 'KeyW',
            [UserAction.MOVE_DOWN]: 'KeyS',
            [UserAction.MOVE_LEFT]: 'KeyA',
            [UserAction.MOVE_RIGHT]: 'KeyD',
            
            [UserAction.RELOAD]: 'KeyR',
            [UserAction.GRENADE]: 'KeyG',
            [UserAction.INTERACT]: 'KeyE',
            
            [UserAction.WEAPON_1]: 'Digit1',
            [UserAction.WEAPON_2]: 'Digit2',
            [UserAction.WEAPON_3]: 'Digit3',
            [UserAction.WEAPON_4]: 'Digit4',
            
            [UserAction.TACTICAL_MENU]: 'Tab',
            [UserAction.INVENTORY]: 'KeyC',
            [UserAction.SHOP]: 'KeyB',
            [UserAction.PAUSE]: 'KeyP',
            [UserAction.ESCAPE]: 'Escape',
            [UserAction.SKIP_WAVE]: 'KeyL',
            
            [UserAction.ORDER_1]: 'F1',
            [UserAction.ORDER_2]: 'F2',
            [UserAction.ORDER_3]: 'F3',

            // Mouse actions are not rebindable via keyboard config usually,
            // but we define them here for completeness if needed later.
            [UserAction.FIRE]: 'MOUSE_0',
            [UserAction.ALT_FIRE]: 'MOUSE_2'
        };
    }

    private loadBindings() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const saved = JSON.parse(raw);
                // Merge with defaults to ensure new actions are covered
                this.config = { ...this.getDefaultConfig(), ...saved };
            } else {
                this.config = this.getDefaultConfig();
            }
        } catch (e) {
            console.error("Failed to load keybindings, resetting to default.", e);
            this.config = this.getDefaultConfig();
        }
        this.generateKeyMap();
    }

    private generateKeyMap() {
        this.keyMap = {};
        Object.entries(this.config).forEach(([action, code]) => {
            // We map the code to the action
            // Note: If multiple actions share a key (unlikely in this setup), last one wins.
            this.keyMap[code] = action as UserAction;
        });
        
        // Ensure Arrow Keys always work for movement as a secondary (Hardcoded fallbacks)
        // or we could allow multiple bindings per action.
        // For simplicity, we stick to 1:1 mapping in the Config, 
        // but we can manually inject duplicates here for QoL.
        if (this.config[UserAction.MOVE_UP] === 'KeyW') this.keyMap['ArrowUp'] = UserAction.MOVE_UP;
        if (this.config[UserAction.MOVE_DOWN] === 'KeyS') this.keyMap['ArrowDown'] = UserAction.MOVE_DOWN;
        if (this.config[UserAction.MOVE_LEFT] === 'KeyA') this.keyMap['ArrowLeft'] = UserAction.MOVE_LEFT;
        if (this.config[UserAction.MOVE_RIGHT] === 'KeyD') this.keyMap['ArrowRight'] = UserAction.MOVE_RIGHT;
    }

    public rebind(action: UserAction, newCode: string) {
        // Check if key is already used
        const existingAction = this.keyMap[newCode];
        
        if (existingAction && existingAction !== action) {
            // Conflict! Swap or just Unbind the other?
            // Let's just Unbind the other for now (set it to null/undefined effectively)
            // Or better, swap them? Swapping is complex UX.
            // Simple approach: The other action loses its binding (becomes unbound or needs manual fix).
            // Actually, to avoid broken states, let's just overwrite. The user will see the conflict in UI if we update it.
            
            // To prevent "Unbound" actions, we might want to swap.
            // Let's find the key currently assigned to `action` and give it to `existingAction`.
            const oldCode = this.config[action];
            this.config[existingAction] = oldCode;
        }

        this.config[action] = newCode;
        this.saveBindings();
        this.generateKeyMap();
    }

    public resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.saveBindings();
        this.generateKeyMap();
    }

    private saveBindings() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    }

    public getKeyForAction(action: UserAction): string {
        return this.config[action];
    }

    // --- Runtime Handling ---

    public handleKeyDown(code: string): UserAction | null {
        const action = this.keyMap[code];
        if (action) {
            this.activeActions.add(action);
            return action;
        }
        return null;
    }

    public handleKeyUp(code: string): UserAction | null {
        const action = this.keyMap[code];
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
