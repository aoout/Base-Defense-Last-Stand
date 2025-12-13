
export enum UserAction {
    MOVE_UP = 'MOVE_UP',
    MOVE_DOWN = 'MOVE_DOWN',
    MOVE_LEFT = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    FIRE = 'FIRE',
    ALT_FIRE = 'ALT_FIRE',
    RELOAD = 'RELOAD',
    GRENADE = 'GRENADE',
    INTERACT = 'INTERACT',
    WEAPON_1 = 'WEAPON_1',
    WEAPON_2 = 'WEAPON_2',
    WEAPON_3 = 'WEAPON_3',
    WEAPON_4 = 'WEAPON_4',
    TACTICAL_MENU = 'TACTICAL_MENU',
    INVENTORY = 'INVENTORY',
    SHOP = 'SHOP',
    PAUSE = 'PAUSE',
    ESCAPE = 'ESCAPE',
    SKIP_WAVE = 'SKIP_WAVE',
    ORDER_1 = 'ORDER_1',
    ORDER_2 = 'ORDER_2',
    ORDER_3 = 'ORDER_3',
    OPEN_HEROIC = 'OPEN_HEROIC'
}

export type KeyBindingMap = Record<string, UserAction>; // Code -> Action
export type InputConfig = Record<UserAction, string>; // Action -> Code
