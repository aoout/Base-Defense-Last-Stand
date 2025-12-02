
# 06. Art & Audio Direction

## 1. Visual Style: "Tactical Hologram"

The game blends a grounded sci-fi military aesthetic with high-contrast, arcade-like visibility.

### Color Palette
*   **Player/Allies**: Cyan / Blue (`#06b6d4`, `#3b82f6`). Represents clean energy, humanity, technology.
*   **Enemies**:
    *   *Flesh/Blood*: Dark Red (`#7f1d1d`).
    *   *Carapace*: Orange/Amber (`#f59e0b`).
    *   *Toxin*: Purple (`#a855f7`).
    *   *Acid*: Bright Green (`#10b981`).
*   **UI**: Slate Dark Mode with High-Contrast borders. Uses `ZCOOL QingKe HuangYou` for headers (Military Stencil look) and `JetBrains Mono` for data.

### Procedural Rendering
Instead of loading spritesheets (images), the game draws entities using **Canvas Primitives** (Arcs, Rects, Paths) in real-time.
*   **Benefits**: Infinite scaling, zero load time, easy dynamic coloring (e.g., bosses changing color based on state).
*   **Animation**: Done via math functions (`Math.sin(time)`) to simulate breathing, walking legs, and weapon recoil.

## 2. Audio Architecture: Web Audio API
**File**: `services/audioService.ts`

The game uses **Subtractive Synthesis** to generate sound effects in real-time. No mp3/wav files are loaded.

### Sound Generation Techniques
*   **Gunshots**: Filtered Noise Bursts + fast decay envelopes.
*   **Explosions**: Low-frequency Sawtooth waves + Low-pass filtered noise + extended decay.
*   **Lasers/Plasma**: Sine waves with rapid pitch-drop envelopes (Peew-peew effect).
*   **Ambience**: A generative drone created by multiple detuned Oscillators passing through LFO-modulated filters.

### Implementation
*   **Master Gain**: Controls global volume.
*   **Context Management**: Handles the browser's autoplay policy by resuming the `AudioContext` on the first user interaction.
