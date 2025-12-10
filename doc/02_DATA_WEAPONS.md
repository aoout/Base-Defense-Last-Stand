
# 02. Tactical Arsenal Data

**Code Reference**: 
- Definitions: `data/registry.ts` (Const `WEAPONS`)
- Logic: `services/managers/PlayerManager.ts`

## 1. Firearm Specifications

| ID | Name | Damage | Fire Rate | Mag Size | Reload | Range | Special |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PISTOL` | Pistol | 70 | 300ms | 12 | 1.0s | 500 | Infinite Ammo. |
| `AR` | Assault Rifle | 45 | 100ms | 30 | 1.5s | 600 | Standard Issue. |
| `SG` | Shotgun | 35x8 | 600ms | 8 | 2.0s | 300 | Fires 8 pellets (280 max dmg). |
| `SR` | Sniper Rifle | 480 | 1100ms | 5 | 2.5s | 1200 | High Caliber. Penetrates via modules. |
| `FLAMETHROWER` | Flamethrower | 18 | 40ms | 100 | 2.0s | 350 | **IsPiercing: True**. Hits all in line. |
| `PULSE_RIFLE` | Pulse Rifle | 35 | 80ms | 45 | 1.8s | 700 | **IsPiercing: True**. 20% Dmg Decay per hit. |
| `GRENADE_LAUNCHER`| Grenade Launcher| 360 | 1200ms | 6 | 3.2s | 600 | **IsExplosive: True**. AoE Radius 100. |

### Technical Notes
- **Fire Rate**: Defined in milliseconds delay between shots. Lower is faster.
- **Reload Time**: Time in ms during which the player cannot fire.
- **Projectile Speed**: Controls how fast the bullet entity travels.
- **Spread**: Variance in radians applied to the shooting angle.

## 2. Weapon Modules
**Code Reference**: `data/registry.ts` (Const `MODULE_STATS`) and `services/managers/PlayerManager.ts` (Method `fireWeapon`).

Modules modify weapon behavior dynamically at runtime.

| Module ID | Name | Effect | Compatible Weapons |
| :--- | :--- | :--- | :--- |
| `GEL_BARREL` | Gel Penetration Diffuser | Dmg +40% | AR, Shotgun, Sniper, Pistol |
| `MAG_FEED` | Efficient Stack Feed | Mag +100% | AR, Shotgun, Sniper, Pistol |
| `MICRO_RUPTURER` | Micro-Vibration Rupturer | Dmg +60% | Sniper, Grenade Launcher, Pulse Rifle, Grenades |
| `PRESSURIZED_BOLT` | Pressurized Bolt | Fire Rate +10% (Stacking) | AR, Flamethrower, Pulse Rifle |
| `KINETIC_STABILIZER` | Kinetic Stabilizer Core | Pierce 1 Target (2nd Hit 80% Dmg) | AR, Shotgun, Sniper, Pistol |
| `TENSION_SPRING` | High Tension Spring | Reload -20%, Dmg +20% | AR, Shotgun, Sniper, Pistol |

## 3. Turret Systems
**Code Reference**: `data/registry.ts` (Const `TURRET_STATS`)

| Type | Level | HP | Dmg | Rate | Range | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STANDARD` | 1 | 1200 | 60 | 120ms| 400 | Basic Kinetic |
| `GAUSS` | 2 | 3600 | 110 | 240ms| 650 | **Spool-Up Mechanic**. Gains +1% Rate per shot (Max +200%). Resets after 2s idle. |
| `SNIPER` | 2 | 3000 | 190 | 780ms| 1300 | **Railgun Beam**. Penetrates enemies (8% damage decay per hit). |
| `MISSILE` | 2 | 2400 | 220 | 1230ms| 9999 | **Global Range**. Homing. Explosive Area of Effect (AoE). |

*Note: Stats are further modified by Infrastructure Research bonuses.*
