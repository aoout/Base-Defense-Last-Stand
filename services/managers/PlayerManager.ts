
import { WeaponType, ModuleType, DefenseUpgradeType, GameState, Projectile, DamageSource, GameEventType, SpawnProjectileEvent, PlaySoundEvent, PlayerSwitchWeaponEvent, PlayerReloadEvent, UserAction, StatId } from '../../types';
import { WEAPONS, PLAYER_STATS, WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';
import { EventBus } from '../EventBus';
import { InputManager } from '../InputManager';
import { StatManager } from './StatManager';

export class PlayerManager {
    private getState: () => GameState;
    private events: EventBus;
    private input: InputManager;
    private stats: StatManager;

    constructor(getState: () => GameState, eventBus: EventBus, inputManager: InputManager, statManager: StatManager) {
        this.getState = getState;
        this.events = eventBus;
        this.input = inputManager;
        this.stats = statManager;

        // Subscribe to Input Events
        this.events.on<PlayerSwitchWeaponEvent>(GameEventType.PLAYER_SWITCH_WEAPON, (e) => this.switchWeapon(e.index));
        this.events.on<PlayerReloadEvent>(GameEventType.PLAYER_RELOAD, (e) => this.reloadWeapon(e.time));
        this.events.on(GameEventType.PLAYER_THROW_GRENADE, () => this.throwGrenade());
    }

    public update(dt: number, time: number, timeScale: number) {
        const p = this.getState().player;
        const input = this.input;

        // 1. Movement
        let dx = 0; let dy = 0;
        if (input.isActive(UserAction.MOVE_UP)) dy -= 1;
        if (input.isActive(UserAction.MOVE_DOWN)) dy += 1;
        if (input.isActive(UserAction.MOVE_LEFT)) dx -= 1;
        if (input.isActive(UserAction.MOVE_RIGHT)) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            p.x += (dx/len) * p.speed * timeScale;
            p.y += (dy/len) * p.speed * timeScale;
            
            p.x = Math.max(0, Math.min(WORLD_WIDTH, p.x));
            p.y = Math.max(0, Math.min(WORLD_HEIGHT, p.y));
        }

        // 2. Aiming
        const camera = this.getState().camera;
        p.angle = Math.atan2(input.mouse.y - (p.y - camera.y), input.mouse.x - (p.x - camera.x));
        p.isAiming = input.isActive(UserAction.ALT_FIRE);

        // 3. Combat / Weapon Logic
        this.updateWeapons(dt, time);

        // 4. Regeneration Logic
        if (time - p.lastHitTime > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
        }
        
        if (time - p.lastHitTime > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate * dt);
        }
    }

    private updateWeapons(dt: number, time: number) {
        const p = this.getState().player;
        const currentWep = p.loadout[p.currentWeaponIndex];
        const wepState = p.weapons[currentWep];
        const wepStats = WEAPONS[currentWep];

        // Ensure Pistol is infinite
        if (currentWep === WeaponType.PISTOL && wepState.ammoReserve !== Infinity) {
            wepState.ammoReserve = Infinity;
        }

        // Reload Logic
        if (wepState.reloading) {
            let reloadTime = wepStats.reloadTime;
            if (wepState.modules.some((m: any) => m.type === ModuleType.TENSION_SPRING)) {
                reloadTime *= 0.8;
            }

            if (time - wepState.reloadStartTime > reloadTime) {
                wepState.reloading = false;
                const needed = wepStats.magSize - wepState.ammoInMag;
                if (wepState.ammoReserve === Infinity) {
                    wepState.ammoInMag = wepStats.magSize;
                } else {
                    const toLoad = Math.min(needed, wepState.ammoReserve);
                    wepState.ammoInMag += toLoad;
                    wepState.ammoReserve -= toLoad;
                }
            }
        } 
        // Firing Logic
        else if (this.input.isActive(UserAction.FIRE)) {
            if (wepState.ammoInMag <= 0) {
                this.reloadWeapon(time);
            } else if (time - wepState.lastFireTime > wepStats.fireRate) {
                 this.fireWeapon(time, p, wepState, wepStats);
            }
        } else {
            if (time - wepState.lastFireTime > 500) wepState.consecutiveShots = 0;
        }
    }

    private fireWeapon(time: number, p: any, wepState: any, wepStats: any) {
        let dmgMult = 1;
        let fireRateMod = 1;
        
        // Apply Modules
        if (wepState.modules.some((m: any) => m.type === ModuleType.GEL_BARREL)) dmgMult += 0.4;
        if (wepState.modules.some((m: any) => m.type === ModuleType.MICRO_RUPTURER)) dmgMult += 0.6;
        if (wepState.modules.some((m: any) => m.type === ModuleType.TENSION_SPRING)) dmgMult += 0.2;

        if (wepState.modules.some((m: any) => m.type === ModuleType.PRESSURIZED_BOLT)) {
            wepState.consecutiveShots = Math.min(5, wepState.consecutiveShots + 1);
            fireRateMod = 1 / (1 + wepState.consecutiveShots * 0.1);
        } else {
            wepState.consecutiveShots = 0;
        }

        // Base damage including modules
        let baseDmg = wepStats.damage * dmgMult;
        
        // Apply Global Damage Buffs (Carapace Row Bonuses, Bio Buffs, Modules)
        // StatManager query for PLAYER_DAMAGE
        const finalDmg = this.stats.get(StatId.PLAYER_DAMAGE, baseDmg);

        const type = wepState.type; 

        if (time - wepState.lastFireTime > wepStats.fireRate * fireRateMod) {
            if (type === WeaponType.SG) {
                const pellets = wepStats.pellets || 8;
                for(let i=0; i<pellets; i++) {
                    this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*wepStats.spread, finalDmg, wepStats, type, wepState.modules);
                }
            } else if (type === WeaponType.FLAMETHROWER) {
                this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*wepStats.spread, finalDmg, wepStats, type, wepState.modules);
            } else {
                this.firePlayerProjectile(p.x, p.y, p.angle, finalDmg, wepStats, type, wepState.modules);
            }
            
            wepState.ammoInMag--;
            wepState.lastFireTime = time;
            this.getState().stats.shotsFired++;
            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'WEAPON', variant: type, x: p.x, y: p.y });
        }
    }

    private firePlayerProjectile(x: number, y: number, angle: number, dmg: number, stats: any, type: WeaponType, modules: any[]) {
        const speed = stats.projectileSpeed;
        
        let color = '#FBBF24'; 
        if (type === WeaponType.SG) color = '#FCD34D';
        if (type === WeaponType.SR) color = '#FFFFFF';
        if (type === WeaponType.PULSE_RIFLE) color = '#22D3EE';
        if (type === WeaponType.FLAMETHROWER) color = '#F97316';
        if (type === WeaponType.GRENADE_LAUNCHER) color = '#1F2937';
        
        const dist = 1000;
        const targetX = x + Math.cos(angle) * dist;
        const targetY = y + Math.sin(angle) * dist;

        const spawnX = x + Math.cos(angle) * 20;
        const spawnY = y + Math.sin(angle) * 20;

        this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
            x: spawnX, 
            y: spawnY, 
            targetX, 
            targetY, 
            speed, 
            damage: dmg, 
            fromPlayer: true, 
            color, 
            maxRange: stats.range, 
            source: DamageSource.PLAYER,
            activeModules: modules
        });
    }

    public reloadWeapon(time: number) {
        const p = this.getState().player;
        const w = p.weapons[p.loadout[p.currentWeaponIndex]];
        
        if (!w.reloading && w.ammoInMag < WEAPONS[w.type].magSize) {
            if (w.ammoReserve > 0 || w.ammoReserve === Infinity) {
                w.reloading = true;
                w.reloadStartTime = time;
                // Emit Reload Sound
                this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'RELOAD', variant: w.type, x: p.x, y: p.y });
            }
        }
    }

    public switchWeapon(index: number) {
        if (index >= 0 && index < 4) {
            this.getState().player.currentWeaponIndex = index;
            const p = this.getState().player;
            Object.values(p.weapons).forEach(w => w.reloading = false);
        }
    }

    public throwGrenade() {
        const p = this.getState().player;
        if (p.grenades > 0) {
            p.grenades--;
            const targetX = p.x + Math.cos(p.angle) * 300;
            const targetY = p.y + Math.sin(p.angle) * 300;
            
            // Grenade damage could also be boosted by stats
            const dmg = this.stats.get(StatId.PLAYER_DAMAGE, PLAYER_STATS.grenadeDamage);

            this.events.emit<SpawnProjectileEvent>(GameEventType.SPAWN_PROJECTILE, {
                x: p.x, 
                y: p.y, 
                targetX, 
                targetY, 
                speed: 12, 
                damage: dmg, 
                fromPlayer: true, 
                color: '#f97316', 
                maxRange: 1000, 
                source: DamageSource.PLAYER,
                isExplosive: true // Fix for AOE
            });
            
            this.events.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'GRENADE_THROW', x: p.x, y: p.y });
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
        p.lastHitTime = Date.now(); 
        
        if (p.hp <= 0) {
            state.isGameOver = true;
            state.isPaused = true;
            this.events.emit(GameEventType.UI_UPDATE, { reason: 'GAME_OVER' });
        }
    }
}
