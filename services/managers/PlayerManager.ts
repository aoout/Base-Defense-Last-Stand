
import { GameState, GameEventType, StatId, DefenseUpgradeType, DamageSource, WeaponType, SpawnProjectileEvent, PlaySoundEvent, ShowFloatingTextEvent, FloatingTextType, ModuleType, SpawnParticleEvent, DamageAreaEvent, Player, WeaponState } from '../../types';
import { EventBus } from '../EventBus';
import { InputManager } from '../InputManager';
import { StatManager } from './StatManager';
import { DataManager } from '../DataManager';
import { UserAction } from '../../types';
import { PLAYER_STATS, INITIAL_AMMO } from '../../data/registry';
import { INVENTORY_SIZE } from '../../constants';

export class PlayerManager {
    private getState: () => GameState;
    private events: EventBus;
    private input: InputManager;
    private stats: StatManager;
    private data: DataManager;

    constructor(getState: () => GameState, eventBus: EventBus, input: InputManager, statManager: StatManager, dataManager: DataManager) {
        this.getState = getState;
        this.events = eventBus;
        this.input = input;
        this.stats = statManager;
        this.data = dataManager;

        this.events.on(GameEventType.PLAYER_SWITCH_WEAPON, (e: any) => this.switchWeapon(e.index));
        this.events.on(GameEventType.PLAYER_RELOAD, (e: any) => this.reload(e.time));
        this.events.on(GameEventType.PLAYER_THROW_GRENADE, () => this.throwGrenade());
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

        // Movement
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

        // Aiming
        const angle = Math.atan2(this.input.mouse.y - p.y + state.camera.y, this.input.mouse.x - p.x + state.camera.x);
        p.angle = angle;
        
        p.isAiming = this.input.isActive(UserAction.ALT_FIRE);

        // Firing
        if (this.input.isActive(UserAction.FIRE)) {
            this.fireWeapon(time);
        }

        // Reload Logic
        const currentWeaponType = p.loadout[p.currentWeaponIndex];
        const weaponState = p.weapons[currentWeaponType];
        // USE DATA MANAGER
        const weaponStats = this.data.getWeaponStats(currentWeaponType);

        if (weaponState.reloading) {
            let reloadTime = weaponStats.reloadTime;
            
            // Modules
            if (weaponState.modules.some(m => m.type === ModuleType.TENSION_SPRING)) {
                reloadTime *= 0.8;
            }
            
            const reloadMod = this.stats.get(StatId.PLAYER_RELOAD_SPEED, 0); 
            reloadTime = reloadTime * (1 + reloadMod);

            if (time - weaponState.reloadStartTime >= reloadTime) {
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

        if (timeSinceHit > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
        }

        if (timeSinceHit > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate * dt);
        }
    }

    private fireWeapon(time: number) {
        const state = this.getState();
        const p = state.player;
        const weaponType = p.loadout[p.currentWeaponIndex];
        const wState = p.weapons[weaponType];
        // USE DATA MANAGER
        const wStats = this.data.getWeaponStats(weaponType);

        if (wState.reloading || time - wState.lastFireTime < wStats.fireRate) return;

        if (wState.ammoInMag <= 0) {
            this.reload(time);
            return;
        }

        wState.ammoInMag--;
        wState.lastFireTime = time;
        this.events.emit(GameEventType.PLAY_SOUND, { type: 'WEAPON', variant: weaponType, x: p.x, y: p.y });

        const spread = p.isAiming ? wStats.spread * 0.5 : wStats.spread;
        
        const spawnProjectile = (angleOffset: number = 0) => {
            const finalAngle = p.angle + (Math.random() - 0.5) * spread + angleOffset;
            const targetX = p.x + Math.cos(finalAngle) * 1000;
            const targetY = p.y + Math.sin(finalAngle) * 1000;
            
            let damage = this.stats.get(StatId.PLAYER_DAMAGE, wStats.damage); 
            
            wState.modules.forEach(m => {
                if (m.type === ModuleType.GEL_BARREL) damage *= 1.4;
                if (m.type === ModuleType.MICRO_RUPTURER) damage *= 1.6;
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
                color: weaponType === WeaponType.PULSE_RIFLE ? '#22d3ee' : '#fbbf24', 
                maxRange: wStats.range,
                source: DamageSource.PLAYER,
                activeModules: wState.modules,
                isPiercing: wStats.isPiercing,
                isExplosive: wStats.isExplosive,
                weaponType: weaponType
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
        // USE DATA MANAGER
        const wStats = this.data.getWeaponStats(weaponType);

        if (wState.reloading || wState.ammoInMag >= wStats.magSize) return;
        if (wState.ammoReserve <= 0 && wState.ammoReserve !== Infinity) {
            this.events.emit(GameEventType.SHOW_FLOATING_TEXT, { text: "NO AMMO", x: p.x, y: p.y - 50, color: 'red', type: FloatingTextType.SYSTEM });
            return;
        }

        wState.reloading = true;
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
        }
    }

    private throwGrenade() {
        const state = this.getState();
        const p = state.player;
        if (p.grenades > 0) {
            p.grenades--;
            this.events.emit(GameEventType.PLAY_SOUND, { type: 'GRENADE_THROW', x: p.x, y: p.y });
            
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
                weaponType: WeaponType.GRENADE_LAUNCHER 
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
        
        if (p.hp <= 0) {
            state.isGameOver = true;
            state.isPaused = true;
            this.events.emit(GameEventType.UI_UPDATE, { reason: 'GAME_OVER' });
        }
    }
}
