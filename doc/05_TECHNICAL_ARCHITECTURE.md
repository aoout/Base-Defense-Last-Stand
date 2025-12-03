
# 05. Technical Architecture

## 1. The Game Engine ("God Class" Pattern)
**File**: `services/gameService.ts`

The `GameEngine` class is the singleton source of truth. It:
*   Holds the entire `GameState` object.
*   Instantiates all Sub-Managers (`EnemyManager`, `PlayerManager`, etc.).
*   Runs the main `update(time)` loop.
*   Handles input mapping (`handleInput`).

### State Management
Unlike typical React apps that use `useState` for everything, this game uses a **mutable imperative state** for the game loop (performance) and syncs it to React via a `useRef` + `setInterval` bridge in `App.tsx`.
*   **Physics Loop**: Runs on `requestAnimationFrame` inside `GameCanvas.tsx`.
*   **UI Sync Loop**: Runs at 20FPS inside `App.tsx` to update the DOM-based UI (HUD, Menus).

## 2. The Time Consistency Protocol
**File**: `services/managers/TimeManager.ts`

**The Problem**:
In early versions, mixing `Date.now()` (Wall Clock) and `performance.now()` (Browser Uptime) caused bugs where saving the game and reloading it (resetting `performance.now()` to 0) would result in negative timestamps. This caused weapons to jam (fire delay becoming infinite) and regeneration to fail.

**The Solution**:
1.  **Unified Time Source**: All logic uses `engine.time.now`, managed by `TimeManager`.
2.  **Relative Serialization**:
    *   When saving: We do NOT save absolute timestamps (e.g., `nextAttackTime: 50000`).
    *   We save the **duration remaining** or **time elapsed**.
    *   When loading: We take the *current* `engine.time.now` and re-apply the durations.
    *   *Example*: If a gun had 2s left to reload, on load it is set to `now + 2000`, regardless of what "now" actually is.

## 3. The Save System (Cryo-Memory)
**File**: `services/managers/SaveManager.ts`

*   **Storage**: `localStorage` (JSON stringified).
*   **Slot Management**: Rolling buffer of 7 slots. New saves push out old ones unless they are "Pinned".
*   **Import/Export**: Saves can be exported as `.json` files and re-imported, allowing players to share states or backup runs.

## 4. Rendering Pipeline
**File**: `utils/renderers.ts`

Pure Canvas 2D API.
1.  **Clear Screen**.
2.  **Transform**: Apply Camera translation (`ctx.translate`).
3.  **Layer 0**: Terrain (Cached static background + Dynamic features).
4.  **Layer 1**: Dead bodies/Blood stains.
5.  **Layer 2**: Projectiles & Toxic Zones.
6.  **Layer 3**: Entities (Player, Enemies, Turrets).
7.  **Layer 4**: Floating Text / Particles.
8.  **Layer 5**: Light/Glow effects (Manual alpha blending).

## 5. Input System
**File**: `App.tsx`, `services/managers/PlayerManager.ts`, `components/ui/MobileControls.tsx`

The game supports a hybrid input model:
*   **Desktop**: WASD + Mouse Aiming.
*   **Mobile**: Touch Controls are detected via `navigator.userAgent`.
    *   **Virtual Joysticks**: Left stick for movement, Right stick for aiming/firing.
    *   **Logic**: `PlayerManager` aggregates inputs. Movement is a vector sum of keyboard and joystick input. Aiming prioritizes joystick if active (magnitude > 0.1), otherwise falls back to mouse coordinates.
