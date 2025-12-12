
import { AudioContextModule } from "./AudioContextModule";
import { SoundProfile, OscillatorLayer, NoiseLayer, AudioLayer } from "../../types";
import { SFX_LIBRARY } from "../../data/registry";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../constants";

export class SynthesizerModule {
    private core: AudioContextModule;
    private lastPlayTime: Record<string, number> = {};
    
    // Spatial State
    private cameraX: number = 0;
    private cameraY: number = 0;
    private viewportWidth: number = CANVAS_WIDTH;

    constructor(core: AudioContextModule) {
        this.core = core;
    }

    public updateCamera(x: number, y: number, viewportWidth?: number) {
        this.cameraX = x;
        this.cameraY = y;
        if (viewportWidth) this.viewportWidth = viewportWidth;
    }

    public play(profileId: string, x?: number, y?: number) {
        const profile = SFX_LIBRARY[profileId];
        if (!profile) return;

        // Throttle Logic
        if (profile.throttle) {
            const now = Date.now();
            const last = this.lastPlayTime[profileId] || 0;
            if (now - last < profile.throttle) return;
            this.lastPlayTime[profileId] = now;
        }

        this.synthesize(profile, x, y);
    }

    private synthesize(profile: SoundProfile, x?: number, y?: number) {
        const { pan, gain } = this.calculateSpatialAttributes(x, y);
        const detuneVariance = (Math.random() - 0.5) * 100; // Humanize pitch slightly

        profile.layers.forEach(layer => {
            this.playLayer(layer, pan, gain * layer.volume, detuneVariance);
        });
    }

    private calculateSpatialAttributes(x?: number, y?: number) {
        if (x === undefined || y === undefined) {
            return { pan: 0, gain: 1.0 };
        }

        const width = this.viewportWidth;
        const centerX = this.cameraX + width / 2;
        const centerY = this.cameraY + CANVAS_HEIGHT / 2;

        // Panning (-1 to 1) based on screen position
        const screenX = x - this.cameraX;
        let pan = (screenX - width / 2) / (width / 2);
        pan = Math.max(-1, Math.min(1, pan));

        // Distance Attenuation
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 1500;
        const minDist = 400;
        
        let distanceGain = 1.0;
        if (dist > minDist) {
            distanceGain = 1 - Math.min(1, (dist - minDist) / (maxDist - minDist));
            distanceGain = Math.max(0.1, distanceGain);
        }

        return { pan, gain: distanceGain };
    }

    private playLayer(layer: AudioLayer, pan: number, volume: number, detuneOffset: number) {
        const ctx = this.core.ctx;
        const now = ctx.currentTime;
        const startTime = now + (layer.delay || 0);
        const endTime = startTime + layer.duration;

        // 1. Create Source (Oscillator or Noise Buffer)
        let source: AudioScheduledSourceNode;
        let filter: BiquadFilterNode | null = null;

        if (layer.type === 'OSCILLATOR') {
            const osc = ctx.createOscillator();
            osc.type = (layer as OscillatorLayer).oscillatorType;
            
            // Frequency Envelope
            osc.frequency.setValueAtTime((layer as OscillatorLayer).frequency, startTime);
            if ((layer as OscillatorLayer).freqEnd) {
                osc.frequency.exponentialRampToValueAtTime((layer as OscillatorLayer).freqEnd!, endTime);
            }
            
            // Detune
            osc.detune.value = ((layer as OscillatorLayer).detune || 0) + detuneOffset;
            source = osc;
        } else {
            // Noise
            if (!this.core.noiseBuffer) return;
            const bufferSource = ctx.createBufferSource();
            bufferSource.buffer = this.core.noiseBuffer;
            bufferSource.detune.value = detuneOffset; // Pitch shift noise slightly
            
            // Noise usually needs a filter to sound "good"
            filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime((layer as NoiseLayer).filterFreq, startTime);
            
            if ((layer as NoiseLayer).filterFreqEnd) {
                filter.frequency.exponentialRampToValueAtTime((layer as NoiseLayer).filterFreqEnd!, endTime);
            }
            
            bufferSource.connect(filter);
            source = bufferSource;
        }

        // 2. Amplitude Envelope (VCA)
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Fast attack
        env.gain.exponentialRampToValueAtTime(0.001, endTime); // Decay

        // 3. Spatial Panner
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;

        // 4. Connect Graph
        // [Source] -> [Filter?] -> [Envelope] -> [Panner] -> [SFX Bus]
        const lastNode = filter || source;
        lastNode.connect(env);
        env.connect(panner);
        panner.connect(this.core.sfxCompressor);

        // 5. Start/Stop
        source.start(startTime);
        source.stop(endTime + 0.1); // Small buffer for cleanup
    }
}
