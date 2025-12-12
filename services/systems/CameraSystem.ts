
import { GameState } from '../../types';
import { AudioService } from '../audioService';

export class CameraSystem {
    private getState: () => GameState;
    private audio: AudioService;

    constructor(getState: () => GameState, audio: AudioService) {
        this.getState = getState;
        this.audio = audio;
    }

    public update(dt: number) {
        const state = this.getState();
        
        const vw = state.viewportWidth;
        const vh = state.viewportHeight;
        const ww = state.worldWidth;
        const wh = state.worldHeight;

        // 1. Determine Target Focus
        let targetX = state.player.x;
        let targetY = state.player.y;

        // If Base Drop is active, focus on the dropping base instead
        if (state.baseDrop && state.baseDrop.active) {
            targetX = state.base.x; // Keep horizontal center on base
            targetY = state.baseDrop.y;
        }

        // 2. Calculate Desired Camera Position (Centered)
        const camTargetX = targetX - vw / 2;
        const camTargetY = targetY - vh / 2;

        // 3. Apply Clamping Logic (World Bounds)
        // Horizontal
        if (ww < vw) {
            // World is narrower than viewport: Center it
            state.camera.x = -(vw - ww) / 2;
        } else {
            state.camera.x = Math.max(0, Math.min(camTargetX, ww - vw));
        }

        // Vertical
        if (wh < vh) {
            // World is shorter than viewport: Center it
            state.camera.y = -(vh - wh) / 2;
        } else {
            let maxY = wh - vh;
            let y = Math.max(0, Math.min(camTargetY, maxY));
            
            // Special handling for Base Drop: Allow seeing the sky if needed, 
            // but the current logic clamps to world bounds. 
            // We follow the existing logic which was: clamp Y.
            state.camera.y = y;
        }

        // 4. Sync Audio Listener Position
        // Audio engine needs to know where the camera is to pan sounds correctly
        this.audio.updateCamera(state.camera.x, state.camera.y, vw);
    }
}
