
import { GameEngine } from '../gameService';
import { WeaponType, DefenseUpgradeType, ModuleType, SpaceshipModuleType, WeaponModule, GameEventType, ShopPurchaseEvent, ShopEquipModuleEvent, ShopUnequipModuleEvent, ShopSwapLoadoutEvent, PlaySoundEvent } from '../../types';
import { SHOP_PRICES, DEFENSE_UPGRADE_INFO, MODULE_STATS, SPACESHIP_MODULES } from '../../data/registry';

export class ShopManager {
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
        
        // Subscribe to Shop Events
        this.engine.eventBus.on<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, (e) => this.purchaseItem(e.itemId));
        this.engine.eventBus.on<ShopEquipModuleEvent>(GameEventType.SHOP_EQUIP_MODULE, (e) => this.equipModule(e.target, e.moduleId));
        this.engine.eventBus.on<ShopUnequipModuleEvent>(GameEventType.SHOP_UNEQUIP_MODULE, (e) => this.unequipModule(e.target, e.moduleId));
        this.engine.eventBus.on<ShopSwapLoadoutEvent>(GameEventType.SHOP_SWAP_LOADOUT, (e) => this.swapLoadoutAndInventory(e.loadoutIndex, e.inventoryIndex));
    }

    public purchaseItem(itemKey: string) {
        const p = this.engine.state.player;
        
        // Ammo
        if (itemKey === 'AR_AMMO' && p.score >= SHOP_PRICES.AR_AMMO) { p.score -= SHOP_PRICES.AR_AMMO; p.weapons[WeaponType.AR].ammoReserve += 60; }
        if (itemKey === 'SG_AMMO' && p.score >= SHOP_PRICES.SG_AMMO) { p.score -= SHOP_PRICES.SG_AMMO; p.weapons[WeaponType.SG].ammoReserve += 16; }
        if (itemKey === 'SR_AMMO' && p.score >= SHOP_PRICES.SR_AMMO) { p.score -= SHOP_PRICES.SR_AMMO; p.weapons[WeaponType.SR].ammoReserve += 10; }
        if (itemKey === 'GRENADE' && p.score >= SHOP_PRICES.GRENADE) { p.score -= SHOP_PRICES.GRENADE; p.grenades++; }
        
        // New Ammo
        if (itemKey === 'PULSE_AMMO' && p.score >= SHOP_PRICES.PULSE_AMMO) { p.score -= SHOP_PRICES.PULSE_AMMO; p.weapons[WeaponType.PULSE_RIFLE].ammoReserve += 90; }
        if (itemKey === 'FLAME_AMMO' && p.score >= SHOP_PRICES.FLAME_AMMO) { p.score -= SHOP_PRICES.FLAME_AMMO; p.weapons[WeaponType.FLAMETHROWER].ammoReserve += 200; }
        if (itemKey === 'GL_AMMO' && p.score >= SHOP_PRICES.GL_AMMO) { p.score -= SHOP_PRICES.GL_AMMO; p.weapons[WeaponType.GRENADE_LAUNCHER].ammoReserve += 12; }

        // Weapons
        if (itemKey === 'WEAPON_PULSE' && p.score >= SHOP_PRICES.WEAPON_PULSE) {
            p.score -= SHOP_PRICES.WEAPON_PULSE;
            this.addToInventory(WeaponType.PULSE_RIFLE);
        }
        if (itemKey === 'WEAPON_FLAME' && p.score >= SHOP_PRICES.WEAPON_FLAME) {
            p.score -= SHOP_PRICES.WEAPON_FLAME;
            this.addToInventory(WeaponType.FLAMETHROWER);
        }
        if (itemKey === 'WEAPON_GL' && p.score >= SHOP_PRICES.WEAPON_GL) {
            p.score -= SHOP_PRICES.WEAPON_GL;
            this.addToInventory(WeaponType.GRENADE_LAUNCHER);
        }

        // Upgrades
        if (itemKey === DefenseUpgradeType.INFECTION_DISPOSAL || itemKey === DefenseUpgradeType.SPORE_BARRIER || itemKey === DefenseUpgradeType.IMPACT_PLATE) {
             const info = DEFENSE_UPGRADE_INFO[itemKey as DefenseUpgradeType];
             if (p.score >= info.cost && !p.upgrades.includes(itemKey as DefenseUpgradeType)) {
                 p.score -= info.cost;
                 p.upgrades.push(itemKey as DefenseUpgradeType);
                 // Apply Immediate Effects
                 if (itemKey === DefenseUpgradeType.SPORE_BARRIER) {
                     const bonus = (info as any).maxArmorBonus;
                     p.maxArmor += bonus;
                     p.armor += bonus;
                 }
             }
        }

        // Modules
        if (Object.values(ModuleType).includes(itemKey as ModuleType)) {
            const m = MODULE_STATS[itemKey as ModuleType];
            if (p.score >= m.cost) {
                p.score -= m.cost;
                p.freeModules.push({ id: `mod-${Date.now()}-${Math.random()}`, type: itemKey as ModuleType });
            }
        }

        // Spaceship Modules
        if (Object.values(SpaceshipModuleType).includes(itemKey as SpaceshipModuleType)) {
            const m = SPACESHIP_MODULES[itemKey as SpaceshipModuleType];
            if (p.score >= m.cost) {
                 p.score -= m.cost;
                 this.engine.state.spaceship.installedModules.push(itemKey as SpaceshipModuleType);
                 
                 // Play Upgrade Sound
                 this.engine.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 'UPGRADE' });

                 // Apply immediate effects
                 if (itemKey === SpaceshipModuleType.BASE_REINFORCEMENT) {
                     this.engine.state.base.maxHp += 3000;
                     this.engine.state.base.hp += 3000;
                 }
                 // Unlock tree if cannon purchased
                 if (itemKey === SpaceshipModuleType.ORBITAL_CANNON) {
                     this.engine.generateOrbitalUpgradeTree();
                 }
            }
        }
    }

    public addToInventory(type: WeaponType) {
        const idx = this.engine.state.player.inventory.findIndex(i => i === null);
        if (idx !== -1) {
            this.engine.state.player.inventory[idx] = { id: `w-${Date.now()}`, type };
        }
    }

    public swapLoadoutAndInventory(loadoutIdx: number, invIdx: number) {
        const p = this.engine.state.player;
        const invItem = p.inventory[invIdx];
        if (!invItem) return;

        const oldWeapon = p.loadout[loadoutIdx];
        p.loadout[loadoutIdx] = invItem.type;
        p.inventory[invIdx] = { id: `w-${Date.now()}`, type: oldWeapon };
    }

    public equipModule(target: WeaponType | 'GRENADE', modId: string) {
        const p = this.engine.state.player;
        const modIndex = p.freeModules.findIndex(m => m.id === modId);
        if (modIndex === -1) return;
        
        const mod = p.freeModules[modIndex];

        if (target === 'GRENADE') {
            if (p.grenadeModules.length < 2) {
                p.freeModules.splice(modIndex, 1);
                p.grenadeModules.push(mod);
            }
        } else {
            const w = p.weapons[target];
            const limit = target === WeaponType.PISTOL ? 2 : 3;
            if (w.modules.length < limit) {
                p.freeModules.splice(modIndex, 1);
                w.modules.push(mod);
            }
        }
    }

    public unequipModule(target: WeaponType | 'GRENADE', modId: string) {
        const p = this.engine.state.player;
        if (target === 'GRENADE') {
            const idx = p.grenadeModules.findIndex(m => m.id === modId);
            if (idx !== -1) {
                const mod = p.grenadeModules.splice(idx, 1)[0];
                p.freeModules.push(mod);
            }
        } else {
            const w = p.weapons[target];
            const idx = w.modules.findIndex(m => m.id === modId);
            if (idx !== -1) {
                const mod = w.modules.splice(idx, 1)[0];
                p.freeModules.push(mod);
            }
        }
    }
}
