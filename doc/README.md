
# Base Defense: Last Stand - Developer Archives

**Version**: 1.0.0
**Engine**: React 18 + HTML5 Canvas + Web Audio API
**Language**: TypeScript

## Documentation Index

The documentation for this project has been split into specific "Sector Files" for clarity and depth.

### [01. World Lore & Narrative](./01_WORLD_LORE.md)
*   History of the Collapse
*   The Mycelium Scourge Origins
*   Project Vanguard & The Colossus
*   The Philosophy of "Scraps" (Molecular Printing)

### [02. Weapon Data & Ballistics](./02_DATA_WEAPONS.md)
*   **Code Reference**: `data/registry.ts`, `services/managers/PlayerManager.ts`
*   Detailed stats for all firearms.
*   Ammo economy.
*   Weapon Module mechanics and math.

### [03. Xenobiology (Enemy Data)](./03_DATA_XENOBIOLOGY.md)
*   **Code Reference**: `data/registry.ts`, `services/managers/EnemyManager.ts`, `utils/enemyUtils.ts`
*   Base stats for Grunts, Rushers, Tanks, Vipers, Kamikazes.
*   Boss Mechanics (Red, Blue, Purple, Hive Mother).
*   **Environmental Scaling Formulas** (Oxygen/Sulfur impact).

### [04. Exploration & Economy Systems](./04_SYSTEM_EXPLORATION.md)
*   **Code Reference**: `utils/worldGenerator.ts`, `services/managers/SpaceshipManager.ts`
*   Procedural Planet Generation (Biomes, Atmosphere).
*   The Upgrade Trees (Orbital, Carapace, Infrastructure).
*   Mission Types (Defense vs. Offense).

### [05. Technical Architecture](./05_TECHNICAL_ARCHITECTURE.md)
*   **Code Reference**: `services/gameService.ts`, `services/managers/TimeManager.ts`
*   The "God Class" Pattern (`GameEngine`).
*   **The Time Consistency Protocol** (Fixing `Date.now()` vs `performance.now()`).
*   Save/Load Hydration logic.

### [06. Art & Audio Direction](./06_ART_AND_AUDIO.md)
*   **Code Reference**: `utils/renderers.ts`, `services/audioService.ts`
*   Procedural Rendering techniques.
*   UI Design Philosophy (Tactical/Diegetic).
*   Synthesized Audio (Oscillators & Noise Buffers).

---

## Quick Start (Development)

1.  **Install Dependencies**: `npm install`
2.  **Run Dev Server**: `npm start`
3.  **Build**: `npm run build`

## Project Structure Overview

*   `components/`: React UI overlay components.
    *   `GameCanvas.tsx`: The visual heart of the game.
    *   `UIOverlay.tsx`: The UI orchestrator.
*   `services/`: Business logic.
    *   `gameService.ts`: The central controller.
    *   `managers/`: Sub-systems (Enemy, Player, Projectile, etc.).
*   `data/`: Static configuration (Stats, Locales, World Gen rules).
*   `utils/`: Pure functions (Rendering, Math, Generators).
