
import { GameState, GameEventType, StatId, DefenseUpgradeType, DamageSource, WeaponType, SpawnProjectileEvent, PlaySoundEvent, ShowFloatingTextEvent, FloatingTextType, ModuleType } from '../../types';
import { EventBus } from '../EventBus';
import { InputManager } from '../InputManager';
import { StatManager } from './StatManager';
import { UserAction } from '../../types';
import { WEAPONS, PLAYER_STATS } from '../../data/registry';

export class PlayerManager {
    private getState: () => GameState;
    private events: EventBus;
    private input: InputManager;
    private stats: StatManager;

    constructor(getState: () => GameState, eventBus: EventBus, input: InputManager, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.input = input;
        this.stats = statManager;

        this.events.on(GameEventType.PLAYER_SWITCH_WEAPON, (e: any) => this.switchWeapon(e.index));
        this.events.on(GameEventType.PLAYER_RELOAD, (e: any) => this.reload(e.time));
        this.events.on(GameEventType.PLAYER_THROW_GRENADE, () => this.throwGrenade());
    }

    public update(dt: number, time: number, timeScale: number) {
        const state = this.getState();
        const p = state.player;

        if (p.hp <= 0) return;

        // Movement
        let dx = 0;
        let dy = 0;
        if (this.input.isActive(UserAction.MOVE_UP)) dy -= 1;
        if (this.input.isActive(UserAction.MOVE_DOWN)) dy += 1;
        if (this.input.isActive(UserAction.MOVE_LEFT)) dx -= 1;
        if (this.input.isActive(UserAction.MOVE_RIGHT)) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            // Apply speed stat
            
            p.x += (dx / length) * p.speed * timeScale;
            p.y += (dy / length) * p.speed * timeScale;

            // Clamp
            p.x = Math.max(0, Math.min(state.worldWidth, p.x));
            p.y = Math.max(0, Math.min(state.worldHeight, p.y));
        }

        // Aiming
        const angle = Math.atan2(this.input.mouse.y - p.y + state.camera.y, this.input.mouse.x - p.x + state.camera.x);
        p.angle = angle;
        
        // Scope
        p.isAiming = this.input.isActive(UserAction.ALT_FIRE);

        // Firing
        if (this.input.isActive(UserAction.FIRE)) {
            this.fireWeapon(time);
        }

        // Reload Logic
        const currentWeaponType = p.loadout[p.currentWeaponIndex];
        const weaponState = p.weapons[currentWeaponType];
        const weaponStats = WEAPONS[currentWeaponType];

        if (weaponState.reloading) {
            if (time - weaponState.reloadStartTime >= weaponStats.reloadTime) {
                this.finishReload(weaponState, weaponStats);
            }
        }

        // Regen
        this.updateRegen(dt, time);
    }

    private updateRegen(dt: number, time: number) {
        const state = this.getState();
        const p = state.player;
        const timeSinceHit = time - p.lastHitTime;

        // Armor Regen
        if (timeSinceHit > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
        }

        // HP Regen (slower)
        if (timeSinceHit > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate * dt);
        }
    }

    private fireWeapon(time: number) {
        const state = this.getState();
        const p = state.player;
        const weaponType = p.loadout[p.currentWeaponIndex];
        const wState = p.weapons[weaponType];
        const wStats = WEAPONS[weaponType];

        if (wState.reloading || time - wState.lastFireTime < wStats.fireRate) return;

        if (wState.ammoInMag <= 0) {
            this.reload(time);
            return;
        }

        // Fire
        wState.ammoInMag--;
        wState.lastFireTime = time;
        this.events.emit(GameEventType.PLAY_SOUND, { type: 'WEAPON', variant: weaponType, x: p.x, y: p.y });

        // Calculate Projectile Properties
        // Spread
        const spread = p.isAiming ? wStats.spread * 0.5 : wStats.spread;
        
        const spawnProjectile = (angleOffset: number = 0) => {
            const finalAngle = p.angle + (Math.random() - 0.5) * spread + angleOffset;
            const targetX = p.x + Math.cos(finalAngle) * 1000;
            const targetY = p.y + Math.sin(finalAngle) * 1000;
            
            // Damage calculation
            let damage = this.stats.get(StatId.PLAYER_DAMAGE, wStats.damage); // Apply global damage mods
            
            // Module Bonuses
            wState.modules.forEach(m => {
                if (m.type === ModuleType.GEL_BARREL) damage *= 1.4;
                if (m.type === ModuleType.MICRO_RUPTURER) damage *= 1.6;
                // Tension spring handled in reload/damage
                if (m.type === ModuleType.TENSION_SPRING) damage *= 1.2;
            });

            this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                x: p.x,
                y: p.y,
                targetX,
                targetY,
                speed: wStats.projectileSpeed,
                damage,
                fromPlayer: true,
                color: weaponType === WeaponType.PULSE_RIFLE ? '#22d3ee' : '#fbbf24', // Cyan or Yellow
                maxRange: wStats.range,
                source: DamageSource.PLAYER,
                activeModules: wState.modules,
                isPiercing: wStats.isPiercing,
                isExplosive: wStats.isExplosive,
                weaponType: weaponType // EXPLICITLY PASS WEAPON TYPE
            });
        };

        if (wStats.pellets) {
            for (let i = 0; i < wStats.pellets; i++) {
                spawnProjectile();
            }
        } else {
            spawnProjectile();
        }
    }

    private reload(time: number) {
        const state = this.getState();
        const p = state.player;
        const weaponType = p.loadout[p.currentWeaponIndex];
        const wState = p.weapons[weaponType];
        const wStats = WEAPONS[weaponType];

        if (wState.reloading || wState.ammoInMag >= wStats.magSize) return;
        if (wState.ammoReserve <= 0 && wState.ammoReserve !== Infinity) {
            this.events.emit(GameEventType.SHOW_FLOATING_TEXT, { text: "NO AMMO", x: p.x, y: p.y - 50, color: 'red', type: FloatingTextType.SYSTEM });
            return;
        }

        wState.reloading = true;
        
        // Calculate Reload Time with Modules
        let reloadTime = wStats.reloadTime;
        if (wState.modules.some(m => m.type === ModuleType.TENSION_SPRING)) {
            reloadTime *= 0.8;
        }

        wState.reloadStartTime = time;
        this.events.emit(GameEventType.PLAY_SOUND, { type: 'RELOAD', variant: weaponType, x: p.x, y: p.y });
    }

    private finishReload(wState: any, wStats: any) {
        const needed = wStats.magSize - wState.ammoInMag;
        const available = wState.ammoReserve === Infinity ? needed : Math.min(needed, wState.ammoReserve);
        
        wState.ammoInMag += available;
        if (wState.ammoReserve !== Infinity) {
            wState.ammoReserve -= available;
        }
        wState.reloading = false;
    }

    private switchWeapon(index: number) {
        const p = this.getState().player;
        if (p.currentWeaponIndex !== index) {
            p.weapons[p.loadout[p.currentWeaponIndex]].reloading = false; // Cancel reload
            p.currentWeaponIndex = index;
            // Play equip sound?
        }
    }

    private throwGrenade() {
        const state = this.getState();
        const p = state.player;
        if (p.grenades > 0) {
            p.grenades--;
            this.events.emit(GameEventType.PLAY_SOUND, { type: 'GRENADE_THROW', x: p.x, y: p.y });
            
            // Grenade Logic (Spawn projectile that explodes)
            const targetX = p.x + Math.cos(p.angle) * 400;
            const targetY = p.y + Math.sin(p.angle) * 400;
            
            this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                x: p.x,
                y: p.y,
                targetX,
                targetY,
                speed: 12,
                damage: PLAYER_STATS.grenadeDamage,
                fromPlayer: true,
                color: '#fff',
                maxRange: 400,
                source: DamageSource.PLAYER,
                isExplosive: true,
                activeModules: p.grenadeModules,
                weaponType: WeaponType.GRENADE_LAUNCHER // Identify as GL/Grenade for consistency
            });
        }
    }

    public damagePlayer(amount: number) {
        const state = this.getState();
        const p = state.player;
        
        // Apply Global Damage Taken Multiplier (Impact Plate)
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
        // FIX: Use simulation time instead of Date.now() to match the update loop's time source
        p.lastHitTime = state.time; 
        
        if (p.hp <= 0) {
            state.isGameOver = true;
            state.isPaused = true;
            this.events.emit(GameEventType.UI_UPDATE, { reason: 'GAME_OVER' });
        }
    }
}
