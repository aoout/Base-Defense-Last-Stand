# Base Defense: Last Stand

**Version**: 1.0.0  
**Genre**: Top-Down Survival Shooter / Strategy  
**Engine**: React + HTML5 Canvas  

## Project Overview

*Base Defense: Last Stand* is a web-based survival game where players must defend a central base against endless waves of alien bio-forms. The game features a robust weapon modification system, base building mechanics, and an exploration mode involving planetary travel.

### Key Features
- **Survival Mode**: Endless waves of enemies with increasing difficulty.
- **Exploration Mode**: Travel between procedurally generated planets with unique biomes and atmospheres.
- **Weapon Assembly**: Modify weapons with modules (e.g., thermal rounds, rapid fire bolts).
- **Base Defense**: Construct and upgrade automated turrets (Gauss, Sniper, Missile).
- **Tactical Command**: Deploy and command AI squadmates.

## Directory Structure

- `components/`: React UI components.
  - `GameCanvas.tsx`: Main rendering loop.
  - `UIOverlay.tsx`: HUD and Menu orchestration.
  - `ui/`: Individual UI widgets (Shop, Backpack, etc.).
- `services/`: Core business logic.
  - `gameService.ts`: The "God Class" handling state, updates, and physics.
  - `audioService.ts`: WebAudio API synthesizer for SFX and Music.
- `data/`: Static game data.
  - `registry.ts`: Stats for weapons, enemies, and prices.
  - `world.ts`: Biome definitions.
  - `locales.ts`: Localization strings (EN/CN).
- `utils/`: Helper functions.
  - `renderers.ts`: Pure canvas drawing functions.

## Development Guide

### Adding a New Weapon
1. Add enum to `WeaponType` in `types.ts`.
2. Define stats in `WEAPONS` in `data/registry.ts`.
3. Add initial ammo in `INITIAL_AMMO`.
4. Create a drawing function in `utils/renderers.ts` and update `drawPlayerSprite`.
5. Add icon SVG in `components/ui/Shared.tsx`.

### Adding a New Enemy
1. Add enum to `EnemyType` in `types.ts`.
2. Define stats in `ENEMY_STATS` in `data/registry.ts`.
3. Create a drawing function in `utils/renderers.ts`.
4. Update `updateEnemies` in `gameService.ts` if special behavior is required (e.g., ranged attacks).
5. Add entry to `BESTIARY_DB` in `data/registry.ts`.

