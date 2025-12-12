
import { AudioContextModule } from "./AudioContextModule";
import { BiomeType } from "../../types";

export class AmbienceModule {
    private core: AudioContextModule;
    private activeNodes: AudioNode[] = [];
    private currentBiome: BiomeType | null = null;
    private cleanupTimer: number | null = null;

    constructor(core: AudioContextModule) {
        this.core = core;
    }

    public start(biome: BiomeType) {
        if (this.currentBiome === biome) return;
        this.stop(); // Cross-fade old ambience out
        this.currentBiome = biome;
        
        if (!this.core.noiseBuffer) return;

        const ctx = this.core.ctx;
        const now = ctx.currentTime;

        // Master Gain for this specific ambience session (allows easy fade out)
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(1.0, now + 3.0); // 3s fade in
        master.connect(this.core.ambienceGain);
        this.activeNodes.push(master);

        this.configureBiomeLayers(biome, master);
    }

    public stop() {
        const now = this.core.ctx.currentTime;
        
        // Move current active nodes to a "dying" list implicitly by fading them out
        // We do NOT clear activeNodes array immediately, but we need to ensure
        // subsequent start() calls don't get their nodes cleared by the timeout of this stop().
        
        // 1. Cancel previous cleanup if it's still pending (race condition fix)
        if (this.cleanupTimer !== null) {
            clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
            // Force clear previous nodes that were pending cleanup?
            // No, AudioNodes garbage collect themselves if disconnected and stopped.
            // We just empty our reference array to start fresh.
            this.activeNodes = [];
        }

        // 2. Fade out all CURRENT active nodes
        const dyingNodes = [...this.activeNodes];
        this.activeNodes = []; // Clear for next batch
        
        dyingNodes.forEach(node => {
            if (node instanceof GainNode) {
                // Cancel scheduled events to prevent popping
                node.gain.cancelScheduledValues(now);
                node.gain.setValueAtTime(node.gain.value, now);
                node.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // 2s fade out
            } else if (node instanceof AudioScheduledSourceNode) {
                node.stop(now + 2.1);
            }
        });
        
        this.currentBiome = null;
    }

    private configureBiomeLayers(biome: BiomeType, output: GainNode) {
        switch(biome) {
            case BiomeType.BARREN:
                this.addWindLayer(output, 80, 0.05); // Low rumble
                break;
            case BiomeType.ICE:
                this.addWindLayer(output, 600, 0.1, 'bandpass', 2); // High whistling wind
                this.addDroneLayer(output, 440, 0.02, 'sine'); // Ethereal tone
                break;
            case BiomeType.VOLCANIC:
                this.addRumbleLayer(output); // Deep seismic bass
                this.addWindLayer(output, 100, 0.05, 'lowpass', 0.5);
                break;
            case BiomeType.DESERT:
                this.addWindLayer(output, 300, 0.08, 'bandpass', 1); // Sandy hiss
                break;
            case BiomeType.TOXIC:
                this.addLiquidLayer(output); // Bubbling mud
                break;
        }
    }

    // --- GENERATORS ---

    private addWindLayer(output: AudioNode, freq: number, vol: number, filterType: BiquadFilterType = 'lowpass', lfoSpeed: number = 0.1) {
        const ctx = this.core.ctx;
        
        // Noise Source
        const source = ctx.createBufferSource();
        source.buffer = this.core.noiseBuffer;
        source.loop = true;

        // Filter (The "Wind" character)
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = freq;
        filter.Q.value = 1;

        // LFO (Modulates volume for "gusts")
        const lfo = ctx.createOscillator();
        lfo.frequency.value = lfoSpeed;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = vol * 0.5; // Modulation depth

        // Volume
        const gain = ctx.createGain();
        gain.gain.value = vol;

        // Graph: LFO -> Gain.gain <- Source -> Filter -> Gain -> Output
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        source.start();
        lfo.start();

        this.activeNodes.push(source, filter, gain, lfo, lfoGain);
    }

    private addRumbleLayer(output: AudioNode) {
        const ctx = this.core.ctx;
        
        // FM Synthesis for Earthquake rumble
        const carrier = ctx.createOscillator();
        carrier.frequency.value = 60; 
        
        const modulator = ctx.createOscillator();
        modulator.frequency.value = 4;
        const modGain = ctx.createGain();
        modGain.gain.value = 30; // FM Depth

        const amp = ctx.createGain();
        amp.gain.value = 0.15;

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(amp);
        amp.connect(output);

        carrier.start();
        modulator.start();

        this.activeNodes.push(carrier, modulator, modGain, amp);
    }

    private addLiquidLayer(output: AudioNode) {
        const ctx = this.core.ctx;
        
        const source = ctx.createBufferSource();
        source.buffer = this.core.noiseBuffer;
        source.loop = true;

        // High Q Lowpass modulated rapidly creates "bloop" sounds
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 8;
        filter.frequency.value = 300;

        const lfo = ctx.createOscillator();
        lfo.type = 'sawtooth';
        lfo.frequency.value = 4; // Bumping speed

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;

        const amp = ctx.createGain();
        amp.gain.value = 0.08;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        source.connect(filter);
        filter.connect(amp);
        amp.connect(output);

        source.start();
        lfo.start();

        this.activeNodes.push(source, filter, lfo, lfoGain, amp);
    }

    private addDroneLayer(output: AudioNode, freq: number, vol: number, type: OscillatorType) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        
        const gain = ctx.createGain();
        gain.gain.value = vol;

        osc.connect(gain);
        gain.connect(output);
        osc.start();

        this.activeNodes.push(osc, gain);
    }
}
