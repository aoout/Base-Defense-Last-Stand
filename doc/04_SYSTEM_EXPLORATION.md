








# 04. Exploration & Systems Architecture

## 1. Procedural Planet Generation
**Code Reference**: `utils/worldGenerator.ts`

Planets are generated using a seed-based approach (though currently using Math.random for session variety).

*   **Attributes**:
    *   **Biome**: Barren, Ice, Volcanic, Desert, Toxic. Affects visual palette and particle effects.
    *   **Atmosphere**: A mix of gases (O2, N2, CO2, etc.) that sum to 1.0 (100%).
    *   **Mission Type**: 
        *   `DEFENSE`: Survive N waves.
        *   `OFFENSE`: Kill Hive Mother (No waves).
    *   **Difficulty**: 
        *   `Landing Difficulty`: 1% to 30%. Determines the Scrap cost to deploy.
        *   `Gene Strength`: 1.0 to 3.0. Global stat multiplier.

## 2. Progression Systems

### A. Orbital Cannon Upgrade Tree
**Code Reference**: `services/managers/SpaceshipManager.ts` -> `generateOrbitalUpgradeTree`
*   **Structure**: 7 Layers. Layer N has N nodes.
*   **Unlock Rule**: Must purchase `ceil(Nodes/2)` in Layer N to unlock Layer N+1.
*   **Effects**:
    *   **Kinetic Amp**: Increases Orbital Strike Damage.
    *   **Cycling Speed**: Reduces Orbital Strike Cooldown.

### B. Xenobiology Carapace Analyzer
**Code Reference**: `services/managers/SpaceshipManager.ts` -> `generateCarapaceGrid`
*   **Structure**: 4x4 Grid.
*   **Nodes**: Each node targets a specific enemy type (e.g., +20% Dmg vs Grunt).
*   **Row Bonus**: Completing a row gives a Global Damage multiplier.
*   **Col Bonus**: Completing a column gives a permanent Armor Stat increase.

### C. Infrastructure Research
**Code Reference**: `services/managers/SpaceshipManager.ts` -> `generateInfrastructureOptions`
*   **Mechanic**: Roguelite-style selection.
*   **Trigger**: Available only after a successful mission.
*   **Choice**: 3 Random options presented. Player picks 1.
*   **Lockout**: The system locks until the next successful deployment.
*   **Upgrades**: Permanent buffs to Base HP, Turret Stats, or Building Costs.

## 3. Economy Loop
1.  **Deploy**: Spend Scraps to land on a planet.
2.  **Combat**: Kill enemies to gain Scraps.
3.  **Extraction**:
    *   **Success**: Keep all Scraps. Planet marked cleared.
    *   **Failure**: Keep accumulated Scraps, but mission fails.
4.  **Reinvestment**: Spend Scraps on Ship Modules or Research to tackle harder planets.

## 4. Planetary Construction & Passive Economy
**Code Reference**: `services/gameService.ts` -> `completeMission` & `constructBuilding`

Once a planet is **Cleared**, the "Initiate Drop" button is replaced by "Planet Construction".

### Building Slots
*   Capacity is determined by Planet Radius.
*   **Formula**: 1 Slot per 1000km Radius.

### Buildings
*   **Biomass Extractor**
    *   **Cost**: 5500 Scraps.
    *   **Yield**: `800 * (1 + GeneStrength)`.
    *   **Logic**: Harvests the hyper-evolved flora/fauna of high-gene worlds.
*   **Oxygen Siphon**
    *   **Cost**: 7000 Scraps.
    *   **Yield**: `1700 * (1 + 1.8 * Oxygen%)`.
    *   **Logic**: Condenses valuable O2 fuel from the atmosphere. High O2 worlds are gold mines.

### Yield Reporting
*   **Calculations**: Occur upon successful mission completion.
*   **User Interface**: Instead of silently adding funds, a **Planetary Yield Report** modal appears before returning to the map.
*   **Breakdown**: Shows specific yield per planet (Biomass vs Oxygen), total net gain, and allows the player to "Transfer Funds".

## 5. Galactic Events
**Code Reference**: `services/gameService.ts` -> `triggerGalacticEvent`

After every successful mission return (and after claiming yields), there is an **8% Chance** to trigger a meta-game event.

| Event | Effect | Condition |
| :--- | :--- | :--- |
| **SCOURGE EXPANSION** | Buffs the Gene Strength of all UN-colonized planets by 0.1 - 0.3. | Always possible. |
| **COLONY INVASION** | One of your colonized planets is overrun. It reverts to uncompleted status, Buildings are destroyed, Gene Strength increases, and Mission becomes OFFENSE. | Requires > 2 Colonized Planets. |
| **COSMIC SALVAGE** | You find a derelict cache. Gain 3000-10000 Scraps. | Always possible. |