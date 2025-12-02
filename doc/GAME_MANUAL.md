

# Operational Manual: Base Defense: Last Stand

**Classification**: TOP SECRET  
**Version**: 2.6.0

## 1. Game Mechanics

### Mission Types
When exploring the sector, planets are designated with specific mission profiles.
- **DEFENSE (Standard)**: Hold the line against waves of enemies. Survive until the wave counter reaches zero.
- **OFFENSE (New)**: Assault the Hive Mother. There are no waves. The mission ends when the Hive Mother is eliminated.

### Defense Mode (Waves)
The hostile incursion is organized into waves.
- **Wave 1**: Lasts 30 Seconds.
- **Waves 2-10**: Each wave increases duration by 2 seconds (e.g., Wave 10 = 48s).
- **Waves 11+**: Each wave increases duration by 1 second.
- **Progression**: The wave advances automatically when the timer reaches 0. 
- **Spawning Queue**: Hostiles spawn every **0.5 seconds**. `12 + (5 * Wave Number)` hostiles per wave.
- **Wave Acceleration**: Press **[L]** after 10 seconds to skip wave and earn bonus Scraps.

### Offense Mode (Hive Mother)
In Offense missions, you must eliminate a massive, stationary bio-form known as the **Hive Mother**.
- **Armor Plating**: The Hive Mother starts with **90% Armor** (Damage reduction).
- **Shedding Phase**: Every 30 seconds, the Hive Mother sheds 3% of its armor.
- **Regeneration**: Upon shedding, it heals itself. The healing amount is proportional to the **Oxygen content** of the planet atmosphere (0.4 factor).
- **Swarm Defense**: Upon shedding, the Hive Mother spawns a swarm of defenders.
  - **Count**: `12 * (GeneStrength + ShedCount)`.
  - **Type**: The types of enemies spawned are determined by the **Environmental Conditions** (Oxygen, Sulfur) and current Difficulty (Shed Count), identical to Defense Mode logic.
- **Victory**: Destroy the Hive Mother.
- **Reward**: You receive a massive Scrap bonus based on how quickly you killed it (squared scaling with remaining Armor). Killing it early while it has high armor yields maximum rewards.

### Clone Center (Automated Reinforcement)
The base is equipped with two autonomous Clone Vats located on the left and right wings.
- **Auto-Spawn**: Every **60 seconds**, if the current ally count is below capacity (5), a new Clone Trooper is deployed automatically.
- **AI Behavior**: Clone Troopers utilize advanced combat algorithms. They will attempt to maintain optimal engagement distance (150-300 units) from enemies, retreating if overrun ("Kiting").
- **Fire Rate**: Clones fire standard pulse rounds every 500ms.

### Controls
- **Movement**: `W, A, S, D`
- **Aim**: `Mouse Cursor`
- **Fire**: `Left Click`
- **Scope / Secondary**: `Right Click` (Sniper Only)
- **Switch Weapon**: `1, 2, 3, 4` or Drag in Backpack
- **Reload**: `R`
- **Throw Grenade**: `G`
- **Interact**: `E` (Build Turrets, Open Shop, Upgrade)
- **Deploy Lure**: `L` (Skip Wave - Defense Mode Only)
- **Backpack**: `C` (Equip Modules)
- **Shop**: `B` (Buy Ammo/Upgrades)
- **Tactical Menu**: `TAB` -> `F1/F2/F3` for Squad Orders
- **Pause/Stats**: `P`

## 2. Arsenal Data

### Primary Weapons
| Weapon | Type | Dmg | Fire Rate | Mag | Range | Reload | Special |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AR-15** | Kinetic | 45 | 100ms | 30 | 600 | 1.5s | Balanced |
| **Shotgun** | Kinetic | 35x8 | 600ms | 8 | 300 | 2.0s | 8 Pellets per shot |
| **Sniper** | Kinetic | 400 | 1.5s | 5 | 1200 | 2.5s | Penetrates targets |
| **Pulse Rifle** | Energy | 35 | 80ms | 45 | 700 | 1.2s | High Capacity, Low Recoil |
| **Flamethrower** | Thermal | 15 | 40ms | 100 | 350 | 3.0s | Piercing Cone, DoT |
| **Grenade Launcher** | Explosive | 300 | 1.2s | 6 | 600 | 3.5s | AoE Blast |
| **Pistol** | Kinetic | 60 | 300ms | 12 | 500 | 1.0s | Infinite Ammo |

### Tactical Upgrades
| Name | Cost | Effect |
| :--- | :--- | :--- |
| **Infection Disposal** | 3500 | Increases Armor Mitigation to 90%. Boosts regen. |
| **Spore Barrier** | 2700 | Increases Max Armor by +100. |
| **Impact Plate** | 3100 | Reduces Melee Damage taken by 20%. |

### Weapon Modules
Equip these in the Backpack (`C`) to modify weapon behavior.
- **Gel Penetration Diffuser** (1900 Scraps): +40% Damage.
- **Efficient Stack Feed** (1700 Scraps): +100% Magazine Size.
- **Micro-Vibration Rupturer** (2100 Scraps): +60% Damage (Heavy Weapons only).
- **Pressurized Bolt** (2300 Scraps): Fire rate increases the longer you hold the trigger (Up to +50%).

## 3. Defense Systems (Turrets)

Build on designated hardpoints using `E`.

| Model | Cost | HP | Dmg | Rate | Range | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard** | ~1200 | 600 | 60 | 120ms | 400 | Basic defense. Cost increases per turret built. |
| **Gauss** | +3500 | 800 | 90 | 100ms | 650 | Upgrade. High DPS green energy. |
| **Sniper** | +3700 | 800 | 140 | 250ms | 1300 | Upgrade. Extreme range railgun. |
| **Missile** | +4100 | 1000 | 160 | 840ms | Global | Upgrade. Homing explosive missiles. |

## 4. Bestiary (Hostile Analysis)

### Standard Strains
| Class | HP | Speed | Dmg | Traits |
| :--- | :--- | :--- | :--- | :--- |
| **GRUNT** | 100 | Slow | 10 | Swarm tactics. Low threat individually. Short vision. |
| **RUSHER** | 300 | Medium | 15 | Orange shell. Flanks rapidly. High alertness. |
| **VIPER** | 150 | Slow | 40 | Ranged acid attacks. Stays at distance. |
| **TANK** | 1500 | Crawl | 30 | Heavy armor. Soaks damage. |
| **KAMIKAZE** | 50 | Fast | 200 | Purple glow. Explodes on contact + Toxic Pool. |

### Apex Strains (Bosses)
Bosses appear during the **Incubation Event** (70% chance every 5th wave in Defense Mode).
- **RED SUMMONER (Hive Lord)**: HP 10k. Spawns Grunts continuously.
- **BLUE BURST (Cobalt Reaper)**: HP 8k. Fires rapid plasma bursts. High ranged threat.
- **PURPLE ACID (Plague Bringer)**: HP 12k. Massive health. Creates large acid zones that damage over time.

## 5. Exploration Mode (Planetary Deployment)

Travel to different planets to secure resources. Each planet has a unique environment.

### Spaceship Modules (Colossus Upgrades)
Upgrade your mothership from the Exploration Map.
- **Base Reinforcement (4000)**: Deployed base HP +3000.
- **Xenobiology Carapace Analyzer (7000)**: Player deals +20% damage to all organic targets.
- **Orbital Long-Range Support (6700)**: Every 8 seconds, the Colossus fires a laser strike (400 Dmg) at the enemy nearest to your base. See Upgrade Matrix below.
- **Atmospheric Drag Adaptive Deflector (4700)**: Reduces the Scraps cost of orbital insertion (deploying to a planet) by 50%.

### Biological Scaling Rules (Exploration Mode)

#### 1. Oxygen Saturation (O2)
The Scourge relies on hyper-oxygenated blood for rapid movement and metabolism. High oxygen environments supercharge their durability.
*   **GRUNT Strain**: `HP = BaseHP * GeneStrength * (1 + 1.2 * Oxygen%)`
*   **RUSHER Strain**: `HP = BaseHP * GeneStrength * (1 + 0.8 * Oxygen%)`
*   **HIVE MOTHER**: Regeneration rate scales with Oxygen.

#### 2. Sulfur Index (S)
Planets with high volcanic activity or toxic atmospheres (High Sulfur Index `0-10`) empower specific chemical-based mutations.
*   **KAMIKAZE Strain**: `HP = BaseHP * GeneStrength * (1 + 0.1 * SulfurIndex)`
*   **VIPER Strain**: `Damage = BaseDamage * (1 + 0.1 * SulfurIndex)`
*   **HIVE MOTHER**: Max HP scales with Sulfur Index.
