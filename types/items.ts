
import { ModuleType, WeaponType } from './enums';

export interface WeaponModule {
  id: string; // Instance ID
  type: ModuleType;
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // ms
  spread: number;
  magSize: number;
  reloadTime: number; // ms
  range: number;
  projectileSpeed: number;
  pellets?: number; // For shotgun
  isExplosive?: boolean; // For GL
  isPiercing?: boolean; // For Pulse/Flame
}

export interface WeaponState {
  type: WeaponType;
  ammoInMag: number;
  ammoReserve: number;
  lastFireTime: number;
  reloading: boolean;
  reloadStartTime: number;
  
  // Module System
  modules: WeaponModule[]; 
  consecutiveShots: number; // For Pressurized Bolt logic
}

export interface InventoryItem {
    id: string;
    type: WeaponType;
}
