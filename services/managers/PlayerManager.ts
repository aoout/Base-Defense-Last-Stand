
import { GameState, GameEventType, StatId, DefenseUpgradeType, WeaponType, FloatingTextType, ModuleType, DamagePlayerEvent, IGameSystem, Player, WeaponState, InventoryItem } from '../../types';
import { EventBus } from '../EventBus';
import { InputManager } from '../InputManager';
import { StatManager } from './StatManager';
import { DataManager } from '../DataManager';
import { WeaponSystem } from '../systems/WeaponSystem';
import { UserAction } from '../../types';
import { PLAYER_STATS, INITIAL_AMMO } from '../../data/registry';
import { INVENTORY_SIZE } from '../../constants';
import { ProjectileID } from '../../types/enums';

export class PlayerManager implements IGameSystem {
    public readonly systemId = 'PLAYER_SYSTEM';

    private getState: () => GameState;
    private events: EventBus;
    private input: InputManager;
    private stats: StatManager;
    private data: DataManager;
    private weaponSystem: WeaponSystem;

    constructor(
        getState: () => GameState, 
        eventBus: EventBus, 
        input: InputManager, 
        statManager: StatManager, 
        dataManager: DataManager,
        weaponSystem: WeaponSystem // Injected Dependency
    ) {
        this.getState = getState;
        this.events = eventBus;
        this.input = input;
        this.stats = statManager;
        this.data = dataManager;
        this.weaponSystem = weaponSystem;

        this.events.on(GameEventType.PLAYER_SWITCH_WEAPON, (e: any) => this.switchWeapon(e.index));
        this.events.on(GameEventType.PLAYER_RELOAD, (e: any) => this.triggerReload(e.time));
        this.events.on(GameEventType.PLAYER_THROW_GRENADE, () => this.throwGrenade());
        this.events.on<DamagePlayerEvent>(GameEventType.DAMAGE_PLAYER, (e) => this.damagePlayer(e.amount));
    }

    // --- FACTORY METHOD ---
    public createInitialPlayer(x: number, y: number, dataManager: DataManager): Player {
        const initialWeapons: Record<string, WeaponState> = {};
        
        Object.values(WeaponType).forEach(type => { 
            const stats = dataManager.getWeaponStats(type);
            initialWeapons[type] = { 
                type, 
                ammoInMag: stats.magSize, 
                ammoReserve: INITIAL_AMMO[type], 
                lastFireTime: 0, 
                reloading: false, 
                reloadStartTime: 0, 
                modules: [], 
                consecutiveShots: 0 
            }; 
        });

        return { 
            id: 'player', 
            x, 
            y, 
            radius: 15, 
            angle: -Math.PI / 2, 
            color: '#3B82F6', 
            hp: PLAYER_STATS.maxHp, 
            maxHp: PLAYER_STATS.maxHp, 
            armor: PLAYER_STATS.maxArmor, 
            maxArmor: PLAYER_STATS.maxArmor, 
            speed: PLAYER_STATS.speed, 
            lastHitTime: 0, 
            weapons: initialWeapons as Record<WeaponType, WeaponState>, 
            loadout: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL], 
            inventory: new Array(INVENTORY_SIZE).fill(null), 
            upgrades: [], 
            freeModules: [], 
            grenadeModules: [], 
            currentWeaponIndex: 0, 
            grenades: PLAYER_STATS.maxGrenades, 
            score: PLAYER_STATS.initialScore, 
            isAiming: false 
        };
    }

    public update(dt: number, time: number, timeScale: number) {
        const state = this.getState();
        const p = state.player;

        if (p.hp <= 0) return;

        // 1. Handle Movement
        this.updateMovement(p, state, timeScale);

        // 2. Handle Aiming
        const angle = Math.atan2(this.input.mouse.y - p.y + state.camera.y, this.input.mouse.x - p.x + state.camera.x);
        p.angle = angle;
        p.isAiming = this.input.isActive(UserAction.ALT_FIRE);

        // 3. Handle Weapons via WeaponSystem
        const currentWeaponType = p.loadout[p.currentWeaponIndex];
        const weaponState = p.weapons[currentWeaponType];

        // Update Weapon State (Reloads, etc)
        this.weaponSystem.update(weaponState, time);

        // Handle Fire Input
        if (this.input.isActive(UserAction.FIRE)) {
            this.weaponSystem.fire(p, weaponState, time, 'PLAYER');
        }

        // 4. Handle Regeneration
        this.updateRegen(dt, time);
    }

    private updateMovement(p: Player, state: GameState, timeScale: number) {
        let dx = 0;
        let dy = 0;
        if (this.input.isActive(UserAction.MOVE_UP)) dy -= 1;
        if (this.input.isActive(UserAction.MOVE_DOWN)) dy += 1;
        if (this.input.isActive(UserAction.MOVE_LEFT)) dx -= 1;
        if (this.input.isActive(UserAction.MOVE_RIGHT)) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            const effectiveSpeed = this.stats.get(StatId.PLAYER_MOVE_SPEED, p.speed);
            
            p.x += (dx / length) * effectiveSpeed * timeScale;
            p.y += (dy / length) * effectiveSpeed * timeScale;

            p.x = Math.max(0, Math.min(state.worldWidth, p.x));
            p.y = Math.max(0, Math.min(state.worldHeight, p.y));
        }
    }

    private updateRegen(dt: number, time: number) {
        const p = this.getState().player;
        const timeSinceHit = time - p.lastHitTime;

        if (timeSinceHit > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
        }

        if (timeSinceHit > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate * dt);
        }
    }

    private triggerReload(time: number) {
        const p = this.getState().player;
        const weaponType = p.loadout[p.currentWeaponIndex];
        const wState = p.weapons[weaponType];
        
        this.weaponSystem.reload(p, wState, time);
    }

    private switchWeapon(index: number) {
        const p = this.getState().player;
        if (p.currentWeaponIndex !== index) {
            p.weapons[p.loadout[p.currentWeaponIndex]].reloading = false; // Cancel reload on switch
            p.currentWeaponIndex = index;
            
            // Audio & UI Feedback
            this.events.emit(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
            this.events.emit(GameEventType.UI_UPDATE, { reason: 'WEAPON_SWITCH' });
        }
    }

    private throwGrenade() {
        // Grenades are distinct from primary weapons, keeping logic here for now, 
        // though could also move to WeaponSystem if we treat 'GRENADE' as a weapon type.
        const state = this.getState();
        const p = state.player;
        if (p.grenades > 0) {
            p.grenades--;
            this.events.emit(GameEventType.PLAY_SOUND, { type: 'GRENADE_THROW', x: p.x, y: p.y });
            
            const targetX = p.x + Math.cos(p.angle) * 400;
            const targetY = p.y + Math.sin(p.angle) * 400;
            
            // Utilize modules on grenades if any
            // Note: Grenade damage is static in PLAYER_STATS, but could be dynamic via StatManager later
            
            this.events.emit(GameEventType.SPAWN_PROJECTILE, {
                presetId: ProjectileID.P_GRENADE_FRAG,
                x: p.x,
                y: p.y,
                targetX,
                targetY,
                damage: PLAYER_STATS.grenadeDamage,
                activeModules: p.grenadeModules,
                fromPlayer: true
            });
        }
    }

    public damagePlayer(amount: number) {
        const state = this.getState();
        const p = state.player;
        
        const mult = this.stats.get(StatId.PLAYER_DMG_TAKEN_MULT, 1.0);
        amount *= mult;
        
        let actualDmg = amount;
        
        if (p.armor > 0) {
            let mitigation = 0.8; 
            if (p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL)) mitigation = 0.9;
            
            const armorDmg = amount * mitigation;
            const hpDmg = amount * (1 - mitigation);
            
            if (p.armor >= armorDmg) {
                p.armor -= armorDmg;
                actualDmg = hpDmg;
            } else {
                actualDmg = amount - p.armor;
                p.armor = 0;
            }
        }

        p.hp -= actualDmg;
        p.lastHitTime = state.time; 
        
        if (p.hp <= 0 && !state.isGameOver) {
            this.events.emit(GameEventType.GAME_OVER, {});
        }
    }
}
