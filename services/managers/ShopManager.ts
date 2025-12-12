
import { GameEngine } from '../gameService';
import { WeaponType, DefenseUpgradeType, ModuleType, SpaceshipModuleType, GameEventType, ShopPurchaseEvent, ShopEquipModuleEvent, ShopUnequipModuleEvent, ShopSwapLoadoutEvent, PlaySoundEvent } from '../../types';
import { SHOP_PRICES, DEFENSE_UPGRADE_INFO, MODULE_STATS, SPACESHIP_MODULES } from '../../data/registry';

interface AmmoDefinition {
    weapon: WeaponType;
    amount: number;
    priceKey: keyof typeof SHOP_PRICES;
}

export class ShopManager {
    private engine: GameEngine;

    // --- DATA CATALOGS ---
    // Centralized configuration to avoid magic strings in logic
    private readonly AMMO_CATALOG: Record<string, AmmoDefinition> = {
        'AR_AMMO':      { weapon: WeaponType.AR,               amount: 60,  priceKey: 'AR_AMMO' },
        'SG_AMMO':      { weapon: WeaponType.SG,               amount: 16,  priceKey: 'SG_AMMO' },
        'SR_AMMO':      { weapon: WeaponType.SR,               amount: 10,  priceKey: 'SR_AMMO' },
        'PULSE_AMMO':   { weapon: WeaponType.PULSE_RIFLE,      amount: 90,  priceKey: 'PULSE_AMMO' },
        'FLAME_AMMO':   { weapon: WeaponType.FLAMETHROWER,     amount: 200, priceKey: 'FLAME_AMMO' },
        'GL_AMMO':      { weapon: WeaponType.GRENADE_LAUNCHER, amount: 12,  priceKey: 'GL_AMMO' },
    };

    private readonly WEAPON_CATALOG: Record<string, { type: WeaponType, priceKey: keyof typeof SHOP_PRICES }> = {
        'WEAPON_PULSE': { type: WeaponType.PULSE_RIFLE,      priceKey: 'WEAPON_PULSE' },
        'WEAPON_FLAME': { type: WeaponType.FLAMETHROWER,     priceKey: 'WEAPON_FLAME' },
        'WEAPON_GL':    { type: WeaponType.GRENADE_LAUNCHER, priceKey: 'WEAPON_GL' },
    };

    constructor(engine: GameEngine) {
        this.engine = engine;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.engine.eventBus.on<ShopPurchaseEvent>(GameEventType.SHOP_PURCHASE, (e) => this.purchaseItem(e.itemId));
        this.engine.eventBus.on<ShopEquipModuleEvent>(GameEventType.SHOP_EQUIP_MODULE, (e) => this.equipModule(e.target, e.moduleId));
        this.engine.eventBus.on<ShopUnequipModuleEvent>(GameEventType.SHOP_UNEQUIP_MODULE, (e) => this.unequipModule(e.target, e.moduleId));
        this.engine.eventBus.on<ShopSwapLoadoutEvent>(GameEventType.SHOP_SWAP_LOADOUT, (e) => this.swapLoadoutAndInventory(e.loadoutIndex, e.inventoryIndex));
    }

    /**
     * Main Entry Point for Purchases.
     * Delegates to specific handlers based on item type.
     */
    public purchaseItem(itemKey: string) {
        if (this.handleAmmoPurchase(itemKey)) return;
        if (this.handleWeaponPurchase(itemKey)) return;
        if (this.handleGrenadePurchase(itemKey)) return;
        if (this.handleUpgradePurchase(itemKey)) return;
        if (this.handleWeaponModulePurchase(itemKey)) return;
        if (this.handleShipModulePurchase(itemKey)) return;
    }

    // --- TRANSACTION HELPER ---
    
    /**
     * Abstracts the "Check Balance -> Deduct -> Execute" flow.
     * Returns true if transaction was successful.
     */
    private tryTransaction(cost: number, onPurchase: () => void, soundType: 'TURRET' | 'WEAPON' = 'TURRET'): boolean {
        const p = this.engine.state.player;
        if (p.score >= cost) {
            p.score -= cost;
            onPurchase();
            // Play a sound to confirm transaction
            if (soundType === 'TURRET') {
                // Using generic UI confirmation sound variant
                this.engine.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 2 });
            }
            return true;
        }
        return false;
    }

    // --- HANDLERS ---

    private handleAmmoPurchase(itemKey: string): boolean {
        const def = this.AMMO_CATALOG[itemKey];
        if (!def) return false;

        return this.tryTransaction(SHOP_PRICES[def.priceKey], () => {
            const p = this.engine.state.player;
            p.weapons[def.weapon].ammoReserve += def.amount;
        }, 'WEAPON');
    }

    private handleWeaponPurchase(itemKey: string): boolean {
        const def = this.WEAPON_CATALOG[itemKey];
        if (!def) return false;

        return this.tryTransaction(SHOP_PRICES[def.priceKey], () => {
            this.addToInventory(def.type);
        });
    }

    private handleGrenadePurchase(itemKey: string): boolean {
        if (itemKey !== 'GRENADE') return false;
        
        return this.tryTransaction(SHOP_PRICES.GRENADE, () => {
            this.engine.state.player.grenades++;
        });
    }

    private handleUpgradePurchase(itemKey: string): boolean {
        // Check if key exists in Defense Upgrades
        if (!Object.values(DefenseUpgradeType).includes(itemKey as DefenseUpgradeType)) return false;

        const type = itemKey as DefenseUpgradeType;
        const info = DEFENSE_UPGRADE_INFO[type];
        const p = this.engine.state.player;

        if (p.upgrades.includes(type)) return true; // Already owned

        return this.tryTransaction(info.cost, () => {
            p.upgrades.push(type);
            
            // Apply Immediate Effects
            if (type === DefenseUpgradeType.SPORE_BARRIER) {
                const bonus = (info as any).maxArmorBonus;
                p.maxArmor += bonus;
                p.armor += bonus;
            }
        });
    }

    private handleWeaponModulePurchase(itemKey: string): boolean {
        if (!Object.values(ModuleType).includes(itemKey as ModuleType)) return false;

        const type = itemKey as ModuleType;
        const stats = MODULE_STATS[type];

        return this.tryTransaction(stats.cost, () => {
            const p = this.engine.state.player;
            p.freeModules.push({ id: `mod-${Date.now()}-${Math.random()}`, type });
        });
    }

    private handleShipModulePurchase(itemKey: string): boolean {
        if (!Object.values(SpaceshipModuleType).includes(itemKey as SpaceshipModuleType)) return false;

        const type = itemKey as SpaceshipModuleType;
        const stats = SPACESHIP_MODULES[type];
        const s = this.engine.state.spaceship;

        if (s.installedModules.includes(type)) return true; // Already installed

        return this.tryTransaction(stats.cost, () => {
            s.installedModules.push(type);
            this.applyShipModuleEffect(type);
            
            // Play specific upgrade sound
            this.engine.eventBus.emit<PlaySoundEvent>(GameEventType.PLAY_SOUND, { type: 'TURRET', variant: 'UPGRADE' });
        });
    }

    private applyShipModuleEffect(type: SpaceshipModuleType) {
        if (type === SpaceshipModuleType.BASE_REINFORCEMENT) {
            this.engine.state.base.maxHp += 3000;
            this.engine.state.base.hp += 3000;
        }
        if (type === SpaceshipModuleType.ORBITAL_CANNON) {
            this.engine.generateOrbitalUpgradeTree();
        }
        // Force stat recalculation
        this.engine.spaceshipManager.registerModifiers();
    }

    // --- INVENTORY MANAGEMENT HELPERS ---

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
        let targetModules = target === 'GRENADE' ? p.grenadeModules : p.weapons[target].modules;
        const limit = target === 'GRENADE' || target === WeaponType.PISTOL ? 2 : 3;

        if (targetModules.length < limit) {
            p.freeModules.splice(modIndex, 1);
            targetModules.push(mod);
        }
    }

    public unequipModule(target: WeaponType | 'GRENADE', modId: string) {
        const p = this.engine.state.player;
        let targetModules = target === 'GRENADE' ? p.grenadeModules : p.weapons[target].modules;
        
        const idx = targetModules.findIndex(m => m.id === modId);
        if (idx !== -1) {
            const mod = targetModules.splice(idx, 1)[0];
            p.freeModules.push(mod);
        }
    }
}
