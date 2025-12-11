
import { UserAction, KeyBindingMap, InputConfig } from "../types/input";

type ActionCallback = (action: UserAction) => void;

export class InputManager {
    private activeActions: Set<UserAction> = new Set();
    private keyMap: KeyBindingMap = {};
    private config: InputConfig = {} as InputConfig;
    public mouse: { x: number, y: number } = { x: 0, y: 0 };
    
    private storageKey = 'VANGUARD_KEYBINDINGS_V1';
    private target: HTMLElement | Window | null = null;
    private onAction?: ActionCallback;

    constructor() {
        this.loadBindings();
        // Bind methods to preserve 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

    public attach(target: HTMLElement | Window, onAction: ActionCallback) {
        if (this.target) this.detach();
        
        this.target = target;
        this.onAction = onAction;

        target.addEventListener('keydown', this.handleKeyDown as EventListener);
        target.addEventListener('keyup', this.handleKeyUp as EventListener);
        target.addEventListener('mousedown', this.handleMouseDown as EventListener);
        target.addEventListener('mouseup', this.handleMouseUp as EventListener);
        target.addEventListener('mousemove', this.handleMouseMove as EventListener);
        target.addEventListener('contextmenu', this.handleContextMenu as EventListener);
    }

    public detach() {
        if (!this.target) return;
        
        this.target.removeEventListener('keydown', this.handleKeyDown as EventListener);
        this.target.removeEventListener('keyup', this.handleKeyUp as EventListener);
        this.target.removeEventListener('mousedown', this.handleMouseDown as EventListener);
        this.target.removeEventListener('mouseup', this.handleMouseUp as EventListener);
        this.target.removeEventListener('mousemove', this.handleMouseMove as EventListener);
        this.target.removeEventListener('contextmenu', this.handleContextMenu as EventListener);

        this.target = null;
        this.onAction = undefined;
        this.activeActions.clear();
    }

    // --- Event Handlers ---

    private handleKeyDown(e: KeyboardEvent) {
        // Prevent default browser actions for game keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
            e.preventDefault();
        }

        const action = this.keyMap[e.code];
        if (action) {
            if (!this.activeActions.has(action)) {
                this.activeActions.add(action);
                // Trigger "On Press" discrete events
                if (this.onAction) this.onAction(action);
            }
        }
    }

    private handleKeyUp(e: KeyboardEvent) {
        const action = this.keyMap[e.code];
        if (action) {
            this.activeActions.delete(action);
        }
    }

    private handleMouseDown(e: MouseEvent) {
        // Ignore clicks on interactive UI elements to prevent firing game actions (like Map Deselect)
        // when clicking buttons overlaying the canvas.
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[role="button"]');
        
        if (isInteractive) return;

        const button = e.button;
        if (button === 0) {
            this.activeActions.add(UserAction.FIRE);
            if (this.onAction) this.onAction(UserAction.FIRE);
        }
        if (button === 2) {
            this.activeActions.add(UserAction.ALT_FIRE);
            if (this.onAction) this.onAction(UserAction.ALT_FIRE);
        }
    }

    private handleMouseUp(e: MouseEvent) {
        const button = e.button;
        if (button === 0) this.activeActions.delete(UserAction.FIRE);
        if (button === 2) this.activeActions.delete(UserAction.ALT_FIRE);
    }

    private handleMouseMove(e: MouseEvent) {
        // Fix for offset calculation when Canvas is not full screen or has siblings
        const targetEl = e.target as HTMLElement;
        if (targetEl.tagName === 'CANVAS') {
            const rect = targetEl.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        } else {
            // Fallback: If hovering UI, we might not get correct canvas coords easily
            // We assume full screen canvas for now or rely on GameCanvas logic
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }
    }

    private handleContextMenu(e: MouseEvent) {
        e.preventDefault();
    }

    // --- Config Management ---

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

            [UserAction.FIRE]: 'MOUSE_0',
            [UserAction.ALT_FIRE]: 'MOUSE_2'
        };
    }

    private loadBindings() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const saved = JSON.parse(raw);
                this.config = { ...this.getDefaultConfig(), ...saved };
            } else {
                this.config = this.getDefaultConfig();
            }
        } catch (e) {
            console.error("Failed to load keybindings", e);
            this.config = this.getDefaultConfig();
        }
        this.generateKeyMap();
    }

    private generateKeyMap() {
        this.keyMap = {};
        Object.entries(this.config).forEach(([action, code]) => {
            this.keyMap[code] = action as UserAction;
        });
        // Hardcoded fallbacks for Arrow Keys
        if (this.config[UserAction.MOVE_UP] === 'KeyW') this.keyMap['ArrowUp'] = UserAction.MOVE_UP;
        if (this.config[UserAction.MOVE_DOWN] === 'KeyS') this.keyMap['ArrowDown'] = UserAction.MOVE_DOWN;
        if (this.config[UserAction.MOVE_LEFT] === 'KeyA') this.keyMap['ArrowLeft'] = UserAction.MOVE_LEFT;
        if (this.config[UserAction.MOVE_RIGHT] === 'KeyD') this.keyMap['ArrowRight'] = UserAction.MOVE_RIGHT;
    }

    public rebind(action: UserAction, newCode: string) {
        const existingAction = this.keyMap[newCode];
        if (existingAction && existingAction !== action) {
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

    public isActive(action: UserAction): boolean {
        return this.activeActions.has(action);
    }
}
