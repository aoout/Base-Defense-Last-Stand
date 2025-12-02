
# 03. Xenobiology Report

**Code Reference**: 
- Definitions: `data/registry.ts` (Const `ENEMY_STATS`, `BOSS_STATS`)
- AI Logic: `services/managers/EnemyManager.ts`
- Scaling Logic: `utils/enemyUtils.ts`

## 1. Standard Strains

| ID | Class | Base HP | Speed | Dmg | Range | Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GRUNT` | Infantry | 100 | 0.96 | 10 | Melee | Swarms target. Low threat alone. |
| `RUSHER` | Assault | 300 | 1.68 | 15 | Melee | Fast. High Alertness. |
| `TANK` | Heavy | 1500 | 0.48 | 30 | Melee | Slow. Bullet sponge. |
| `KAMIKAZE`| Volatile | 50 | 2.40 | 200 | Melee | **Explodes** on contact. Leaves Toxic Zone. |
| `VIPER` | Ranged | 150 | 0.72 | 40 | 450 | Stops at range to fire acid projectiles. |

## 2. Apex Strains (Bosses)

| ID | Name | HP | Ability |
| :--- | :--- | :--- | :--- |
| `RED_SUMMONER` | The Hive Lord | 10,000 | **Summon**: Spawns 3 Grunts every 2s. |
| `BLUE_BURST` | Cobalt Reaper | 8,000 | **Plasma Burst**: Fires 3 high-speed projectiles rapidly. |
| `PURPLE_ACID` | Plague Bringer | 12,000 | **Toxic Lob**: Arcing shot that creates large Toxic Zones. |
| `HIVE_MOTHER` | Matriarch | 14,000 | **Stationary**. 90% Armor. Sheds armor every 30s. |

## 3. Environmental Scaling Algorithms
**Code Reference**: `utils/enemyUtils.ts`

In Exploration Mode, planet atmosphere fundamentally alters enemy physiology.

### Oxygen (O2) - "Metabolic Overdrive"
*   **Effect**: Increases Health Points.
*   **Formula**: `FinalHP = BaseHP * (1 + 1.2 * Oxygen%)`
*   **Logic**: High oxygen allows the Scourge to grow denser muscle fibers and thicker chitin.

### Sulfur (S) - "Volatile Chemistry"
*   **Effect**: Increases specific unit potency.
*   **Viper**: `Damage = BaseDmg * (1 + 0.1 * SulfurIndex)`
*   **Kamikaze**: `HP = BaseHP * (1 + 0.1 * SulfurIndex)`
*   **Logic**: Sulfur is harvested to stabilize the volatile acids used in ranged and suicide attacks.

### Gene Strength
*   **Effect**: Global Multiplier.
*   **Formula**: `Stat = Base * GeneStrength`
*   **Context**: Represents the evolutionary tier of the planet's hive.
