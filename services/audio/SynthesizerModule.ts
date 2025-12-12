
import { AudioContextModule } from "./AudioContextModule";
import { SoundProfile, OscillatorLayer, NoiseLayer } from "../../types";
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

        if (profile.throttle) {
            const now = Date.now();
            const last = this.lastPlayTime[profileId] || 0;
            if (now - last < profile.throttle) return;
            this.lastPlayTime[profileId] = now;
        }

        this.synthesize(profile, x, y);
    }

    private synthesize(profile: SoundProfile, x?: number, y?: number) {
        const ctx = this.core.ctx;
        const now = ctx.currentTime;

        // 1. Calculate Spatial Attributes
        let pan = 0;
        let distanceGain = 1.0;

        if (x !== undefined && y !== undefined) {
            const width = this.viewportWidth;
            const centerX = this.cameraX + width / 2;
            const centerY = this.cameraY + CANVAS_HEIGHT / 2;

            const screenX = x - this.cameraX;
            pan = (screenX - width / 2) / (width / 2);
            pan = Math.max(-1, Math.min(1, pan));

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxDist = 1500;
            const minDist = 400; 
            
            if (dist > minDist) {
                distanceGain = 1 - Math.min(1, (dist - minDist) / (maxDist - minDist));
                distanceGain = Math.max(0.1, distanceGain);
            }
        }

        const detuneVariance = (Math.random() - 0.5) * 100; 

        profile.layers.forEach(layer => {
            const startTime = now + (layer.delay || 0);
            const endTime = startTime + layer.duration;

            if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return;

            // Panning & Routing
            const panner = ctx.createStereoPanner();
            panner.pan.value = pan;
            panner.connect(this.core.sfxCompressor); // Route to SFX Bus

            // Envelope
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(layer.volume * distanceGain, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, endTime);
            gain.connect(panner);

            if (layer.type === 'OSCILLATOR') {
                this.playOscillator(layer as OscillatorLayer, startTime, endTime, gain, detuneVariance);
            } else if (layer.type === 'NOISE') {
                this.playNoise(layer as NoiseLayer, startTime, endTime, gain, detuneVariance);
            }
        });
    }

    private playOscillator(config: OscillatorLayer, start: number, stop: number, output: GainNode, detuneOffset: number) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        osc.type = config.oscillatorType;
        
        if (!Number.isFinite(config.frequency)) return;

        osc.frequency.setValueAtTime(config.frequency, start);
        if (config.freqEnd && Number.isFinite(config.freqEnd)) {
            osc.frequency.exponentialRampToValueAtTime(config.freqEnd, stop);
        }
        
        const baseDetune = config.detune || 0;
        osc.detune.setValueAtTime(baseDetune + detuneOffset, start);

        osc.connect(output);
        osc.start(start);
        osc.stop(stop);
    }

    private playNoise(config: NoiseLayer, start: number, stop: number, output: GainNode, detuneOffset: number) {
        if (!this.core.noiseBuffer) return;
        const ctx = this.core.ctx;

        const source = ctx.createBufferSource();
        source.buffer = this.core.noiseBuffer;
        source.detune.value = detuneOffset;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(config.filterFreq, start);
        
        if (config.filterFreqEnd && Number.isFinite(config.filterFreqEnd)) {
            filter.frequency.exponentialRampToValueAtTime(config.filterFreqEnd, stop);
        }

        source.connect(filter);
        filter.connect(output);
        
        source.start(start);
        source.stop(stop);
    }
}
