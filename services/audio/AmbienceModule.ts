
import { AudioContextModule } from "./AudioContextModule";
import { BiomeType } from "../../types";

export class AmbienceModule {
    private core: AudioContextModule;
    private activeAmbienceNodes: AudioNode[] = [];
    private currentAmbienceBiome: BiomeType | null = null;

    constructor(core: AudioContextModule) {
        this.core = core;
    }

    public stop() {
        if (this.activeAmbienceNodes.length > 0) {
            const now = this.core.ctx.currentTime;
            this.activeAmbienceNodes.forEach(node => {
                if (node instanceof GainNode) {
                    node.gain.cancelScheduledValues(now);
                    node.gain.setValueAtTime(node.gain.value, now);
                    node.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
                } else if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                    node.stop(now + 2.0);
                }
            });
            setTimeout(() => { this.activeAmbienceNodes = []; }, 2100);
        }
        this.currentAmbienceBiome = null;
    }

    public start(biome: BiomeType) {
        if (this.currentAmbienceBiome === biome) return;
        
        this.stop();
        this.currentAmbienceBiome = biome;
        
        // Safety check for buffer
        if (!this.core.noiseBuffer) return;

        const ctx = this.core.ctx;
        const now = ctx.currentTime;

        const masterAmbienceGain = ctx.createGain();
        masterAmbienceGain.gain.setValueAtTime(0, now);
        masterAmbienceGain.gain.linearRampToValueAtTime(1.0, now + 3.0);
        masterAmbienceGain.connect(this.core.ambienceGain);
        this.activeAmbienceNodes.push(masterAmbienceGain);

        switch(biome) {
            case BiomeType.BARREN:
                this.createWindLayer(masterAmbienceGain, 80, 0.05);
                break;
            case BiomeType.ICE:
                this.createWindLayer(masterAmbienceGain, 600, 0.1, 'bandpass', 2);
                this.createDroneLayer(masterAmbienceGain, 440, 0.02, 'sine'); 
                break;
            case BiomeType.VOLCANIC:
                this.createRumbleLayer(masterAmbienceGain);
                break;
            case BiomeType.DESERT:
                this.createWindLayer(masterAmbienceGain, 300, 0.08, 'bandpass', 1);
                break;
            case BiomeType.TOXIC:
                this.createLiquidLayer(masterAmbienceGain);
                break;
        }
    }

    private createWindLayer(output: AudioNode, freq: number, vol: number, filterType: BiquadFilterType = 'lowpass', lfoSpeed: number = 0.1) {
        const ctx = this.core.ctx;
        const source = ctx.createBufferSource();
        source.buffer = this.core.noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = freq;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.value = vol;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = lfoSpeed;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = vol * 0.3;

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);

        source.start();
        lfo.start();

        this.activeAmbienceNodes.push(source, filter, gain, lfo, lfoGain);
    }

    private createRumbleLayer(output: AudioNode) {
        const ctx = this.core.ctx;
        const carrier = ctx.createOscillator();
        carrier.frequency.value = 60; 
        
        const modulator = ctx.createOscillator();
        modulator.frequency.value = 4;
        
        const modGain = ctx.createGain();
        modGain.gain.value = 30;

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        const amp = ctx.createGain();
        amp.gain.value = 0.15;

        carrier.connect(amp);
        amp.connect(output);

        carrier.start();
        modulator.start();

        this.activeAmbienceNodes.push(carrier, modulator, modGain, amp);
    }

    private createLiquidLayer(output: AudioNode) {
        const ctx = this.core.ctx;
        const source = ctx.createBufferSource();
        source.buffer = this.core.noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        filter.frequency.value = 300;

        const amp = ctx.createGain();
        amp.gain.value = 0.08;

        source.connect(filter);
        filter.connect(amp);
        amp.connect(output);

        source.start();
        lfo.start();

        this.activeAmbienceNodes.push(source, filter, lfo, lfoGain, amp);
    }

    private createDroneLayer(output: AudioNode, freq: number, vol: number, type: OscillatorType) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        
        const gain = ctx.createGain();
        gain.gain.value = vol;

        osc.connect(gain);
        gain.connect(output);
        osc.start();

        this.activeAmbienceNodes.push(osc, gain);
    }
}
