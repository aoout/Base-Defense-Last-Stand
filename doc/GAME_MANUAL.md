
# Operational Manual: Base Defense: Last Stand

**Classification**: TOP SECRET  
**Version**: 2.3.0

## 1. Game Mechanics

### Wave System
The hostile incursion is organized into waves.
- **Wave 1**: Lasts 30 Seconds.
- **Waves 2-10**: Each wave increases duration by 2 seconds (e.g., Wave 10 = 48s).
- **Waves 11+**: Each wave increases duration by 1 second.
- **Progression**: The wave advances automatically when the timer reaches 0. 
- **Spawning Queue**: Unlike standard simulations, enemies are queued.
  - **Count**: `12 + (5 * Wave Number)` hostiles per wave.
  - **Interval**: Hostiles spawn every **0.5 seconds**.
  - **Overflow**: If a wave ends before all hostiles spawn, the remaining queue carries over to the next wave, creating overlapping pressure.
- **Spawn Logic**: Hostiles enter the combat zone from the **Northern Perimeter** (Top of map), advancing South towards the base.

### Wave Acceleration (Lure System)
Operatives can deploy a neuro-reactive lure to immediately summon the next wave.
- **Condition**: Can only be deployed after **10 seconds** have elapsed in the current wave.
- **Action**: Press **[L]** or click the "DEPLOY LURE" button on the HUD.
- **Effect**: Instantly ends the current wave timer and begins the next wave.
- **Reward**: You are compensated for the accelerated data collection.
  - Formula: `(Remaining Seconds) * Current Wave Number` Scraps.
  - *Example*: Skipping 20s on Wave 8 yields `20 * 8 = 160` Scraps.

### Special Events
A planetary anomaly check occurs every **5 Waves**.
- **Probability A (30%) - FRENZY**: The Hive mind accelerates. 
  - **Effect**: The number of enemies in this wave is **TRIPLED**.
  - **Composition**: High probability of **RUSHER** strain.
- **Probability B (70%) - INCUBATION**: An Apex predator (Boss) is detected. A random Boss unit will spawn alongside normal wave enemies.

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
- **Deploy Lure**: `L` (Skip Wave)
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

*Note: All unit movement speeds have been reduced by 50% in the latest combat update simulation to allow for more strategic decision making.*

### AI Behavior Update
All Scourge variants now possess an adaptive **Target Acquisition System**. 
- **Detection Range**: Each enemy type has a specific vision radius.
- **Target Priority**: Within their vision, they will attack the **closest** hostile entity (Player, Ally, or Turret).
- **Base Instinct**: If NO valid targets are detected within their vision range, they revert to their primal instinct and move directly toward the **Base**.
- *Tactical Note*: Operatives can "kite" enemies away from the base by entering their detection range, but staying too far away will cause them to ignore you and focus on the objective.

### Standard Strains
| Class | HP | Speed | Dmg | Traits |
| :--- | :--- | :--- | :--- | :--- |
| **GRUNT** | 100 | Slow | 10 | Swarm tactics. Low threat individually. Short vision. |
| **RUSHER** | 300 | Medium | 15 | Orange shell. Flanks rapidly. High alertness. |
| **VIPER** | 150 | Slow | 40 | Ranged acid attacks. Stays at distance. |
| **TANK** | 1500 | Crawl | 30 | Heavy armor. Soaks damage. |
| **KAMIKAZE** | 50 | Fast | 200 | Purple glow. Explodes on contact + Toxic Pool. |

### Apex Strains (Bosses)
Bosses appear during the **Incubation Event** (70% chance every 5th wave).
- **RED SUMMONER (Hive Lord)**: HP 10k. Spawns Grunts continuously.
- **BLUE BURST (Cobalt Reaper)**: HP 8k. Fires rapid plasma bursts. High ranged threat.
- **PURPLE ACID (Plague Bringer)**: HP 12k. Massive health. Creates large acid zones that damage over time.

## 5. Exploration Mode (Planetary Deployment)

Travel to different planets to secure resources. Each planet has a unique environment. Refer to the in-game **Tactical Interstellar Operations Manual** for detailed protocols.

### Spaceship Modules (Colossus Upgrades)
Upgrade your mothership from the Exploration Map.
- **Base Reinforcement (4000)**: Deployed base HP +3000.
- **Xenobiology Carapace Analyzer (7000)**: Player deals +20% damage to all organic targets.
- **Orbital Long-Range Support (6700)**: Every 8 seconds, the Colossus fires a laser strike (400 Dmg) at the enemy nearest to your base.
- **Atmospheric Drag Adaptive Deflector (4700)**: Reduces the Scraps cost of orbital insertion (deploying to a planet) by 50%.

### Orbital Drop Protocols (Landing Cost)
Deploying to a planetary surface is resource-intensive. The *Colossus* drop-pods require Scraps to fabricate entry heat-shields.
- **Cost**: `Current Scraps * Landing Difficulty %`.
- **Difficulty Range**: 1% to 30%.
- **Distribution**: Low cost (1-10%) planets are common. High cost (21-30%) planets are rare.

### Biological Scaling Rules (Exploration Mode)

#### 1. Oxygen Saturation (O2)
The Scourge relies on hyper-oxygenated blood for rapid movement and metabolism. High oxygen environments supercharge their durability.
*   **GRUNT Strain**: `HP = BaseHP * GeneStrength * (1 + 1.2 * Oxygen%)`
*   **RUSHER Strain**: `HP = BaseHP * GeneStrength * (1 + 0.8 * Oxygen%)`

#### 2. Sulfur Index (S)
Planets with high volcanic activity or toxic atmospheres (High Sulfur Index `0-10`) empower specific chemical-based mutations.
*   **KAMIKAZE Strain**: `HP = BaseHP * GeneStrength * (1 + 0.1 * SulfurIndex)`
*   **VIPER Strain**: `Damage = BaseDamage * (1 + 0.1 * SulfurIndex)`

#### 3. Weighted Spawn Logic
Planetary atmosphere determines the composition of the swarm.
- **GRUNT Probability**: `10 * (1 + Oxygen%)`
- **RUSHER Probability**: `8 * (1 + 0.5 * Oxygen%)`
- **VIPER Probability**: `4 * (1 + 0.1 * Sulfur)`
- **TANK Probability**: `3`
- **KAMIKAZE Probability**: `2 * (1 + 0.05 * Sulfur)`
