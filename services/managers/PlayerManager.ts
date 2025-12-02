

import { GameEngine } from '../gameService';
import { WeaponType, ModuleType, DefenseUpgradeType, SpaceshipModuleType, Projectile } from '../../types';
import { WEAPONS, PLAYER_STATS, WORLD_WIDTH, WORLD_HEIGHT } from '../../constants';

export class PlayerManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public update(dt: number, time: number, timeScale: number) {
        const p = this.engine.state.player;
        const input = this.engine.input;

        // 1. Movement
        let dx = 0; let dy = 0;
        if (input.keys['w'] || input.keys['W']) dy -= 1;
        if (input.keys['s'] || input.keys['S']) dy += 1;
        if (input.keys['a'] || input.keys['A']) dx -= 1;
        if (input.keys['d'] || input.keys['D']) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            p.x += (dx/len) * p.speed * timeScale;
            p.y += (dy/len) * p.speed * timeScale;
            
            p.x = Math.max(0, Math.min(WORLD_WIDTH, p.x));
            p.y = Math.max(0, Math.min(WORLD_HEIGHT, p.y));
        }

        // 2. Aiming
        const camera = this.engine.state.camera;
        p.angle = Math.atan2(input.mouse.y - (p.y - camera.y), input.mouse.x - (p.x - camera.x));
        p.isAiming = input.mouse.rightDown;

        // 3. Combat / Weapon Logic
        this.updateWeapons(dt, time);

        // 4. Armor Regen
        if (time - p.lastHitTime > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
            p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
        }
    }

    private updateWeapons(dt: number, time: number) {
        const p = this.engine.state.player;
        const currentWep = p.loadout[p.currentWeaponIndex];
        const wepState = p.weapons[currentWep];
        const wepStats = WEAPONS[currentWep];

        // Reload Logic
        if (wepState.reloading) {
            if (time - wepState.reloadStartTime > wepStats.reloadTime) {
                wepState.reloading = false;
                wepState.ammoInMag = wepStats.magSize; 
            }
        } 
        // Firing Logic
        else if (this.engine.input.mouse.down) {
            if (wepState.ammoInMag <= 0) {
                this.reloadWeapon(time);
            } else if (time - wepState.lastFireTime > wepStats.fireRate) {
                 this.fireWeapon(time, p, wepState, wepStats);
            }
        } else {
            // Decay consecutive shots (for spool-up mechanics)
            if (time - wepState.lastFireTime > 500) wepState.consecutiveShots = 0;
        }
    }

    private fireWeapon(time: number, p: any, wepState: any, wepStats: any) {
        let dmgMult = 1;
        let fireRateMod = 1;
        
        // Apply Modules
        if (wepState.modules.some((m: any) => m.type === ModuleType.GEL_BARREL)) dmgMult += 0.4;
        if (wepState.modules.some((m: any) => m.type === ModuleType.MICRO_RUPTURER)) dmgMult += 0.6;
        if (wepState.modules.some((m: any) => m.type === ModuleType.PRESSURIZED_BOLT)) {
            wepState.consecutiveShots = Math.min(5, wepState.consecutiveShots + 1);
            fireRateMod = 1 / (1 + wepState.consecutiveShots * 0.1);
        } else {
            wepState.consecutiveShots = 0;
        }

        // NOTE: Spaceship Module Damage Multipliers (Carapace Analyzer etc) are applied on IMPACT by ProjectileManager
        // This keeps the base damage stats clean and allows for specific enemy type targeting.

        const finalDmg = wepStats.damage * dmgMult;
        const type = wepState.type; 

        // Check Fire Rate (Throttle)
        if (time - wepState.lastFireTime > wepStats.fireRate * fireRateMod) {
            if (type === WeaponType.SG) {
                const pellets = wepStats.pellets || 8;
                for(let i=0; i<pellets; i++) {
                    this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*wepStats.spread, finalDmg, wepStats, type);
                }
            } else if (type === WeaponType.FLAMETHROWER) {
                this.firePlayerProjectile(p.x, p.y, p.angle + (Math.random()-0.5)*wepStats.spread, finalDmg, wepStats, type);
            } else {
                this.firePlayerProjectile(p.x, p.y, p.angle, finalDmg, wepStats, type);
            }
            
            wepState.ammoInMag--;
            wepState.lastFireTime = time;
            this.engine.state.stats.shotsFired++;
            this.engine.audio.playWeaponFire(type);
        }
    }

    private firePlayerProjectile(x: number, y: number, angle: number, dmg: number, stats: any, type: WeaponType) {
        const vx = Math.cos(angle) * stats.projectileSpeed;
        const vy = Math.sin(angle) * stats.projectileSpeed;
        
        // Determine color based on weapon type
        let color = '#FBBF24'; // Default Yellow-400 (AR/Pistol)
        if (type === WeaponType.SG) color = '#FCD34D'; // Lighter Yellow
        if (type === WeaponType.SR) color = '#FFFFFF'; // White tracer
        if (type === WeaponType.PULSE_RIFLE) color = '#22D3EE'; // Cyan
        if (type === WeaponType.FLAMETHROWER) color = '#F97316'; // Orange
        if (type === WeaponType.GRENADE_LAUNCHER) color = '#1F2937'; // Dark Gray (Bomb)
        
        const proj: Projectile = {
            id: `proj-${Date.now()}-${Math.random()}`,
            x: x + Math.cos(angle) * 20, 
            y: y + Math.sin(angle) * 20,
            vx,
            vy,
            damage: dmg,
            color,
            radius: type === WeaponType.GRENADE_LAUNCHER ? 6 : 4,
            rangeRemaining: stats.range,
            fromPlayer: true,
            angle,
            isExplosive: stats.isExplosive,
            isPiercing: stats.isPiercing,
            weaponType: type,
            maxRange: stats.range
        };
        
        // Direct registration avoids the race condition and manual override hack
        this.engine.projectileManager.registerProjectile(proj);
    }

    public reloadWeapon(time: number) {
        const p = this.engine.state.player;
        const w = p.weapons[p.loadout[p.currentWeaponIndex]];
        if (!w.reloading && w.ammoInMag < WEAPONS[w.type].magSize) {
            w.reloading = true;
            w.reloadStartTime = time;
        }
    }

    public switchWeapon(index: number) {
        if (index >= 0 && index < 4) {
            this.engine.state.player.currentWeaponIndex = index;
            const p = this.engine.state.player;
            Object.values(p.weapons).forEach(w => w.reloading = false);
        }
    }

    public throwGrenade() {
        const p = this.engine.state.player;
        if (p.grenades > 0) {
            p.grenades--;
            const targetX = p.x + Math.cos(p.angle) * 300;
            const targetY = p.y + Math.sin(p.angle) * 300;
            
            this.engine.spawnProjectile(p.x, p.y, targetX, targetY, 12, PLAYER_STATS.grenadeDamage, true, '#f97316');
            const proj = this.engine.state.projectiles[this.engine.state.projectiles.length-1];
            if(proj) proj.isExplosive = true;
            this.engine.audio.playGrenadeThrow();
        }
    }

    public damagePlayer(amount: number) {
        const p = this.engine.state.player;
        
        if (p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)) {
            amount *= 0.8; 
        }
        
        let actualDmg = amount;
        
        if (p.armor > 0) {
            let mitigation = 0.5; 
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
            this.engine.state.isGameOver = true;
            this.engine.state.isPaused = true;
        }
    }
}