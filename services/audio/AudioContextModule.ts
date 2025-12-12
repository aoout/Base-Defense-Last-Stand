
import { createNoiseBuffer } from "../../utils/audioUtils";

export class AudioContextModule {
    public ctx: AudioContext;
    
    // Buses
    public readonly masterGain: GainNode;
    public readonly musicGain: GainNode;
    public readonly ambienceGain: GainNode;
    public readonly sfxCompressor: DynamicsCompressorNode;
    
    // Shared Resources
    public noiseBuffer: AudioBuffer | null = null;

    constructor() {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // --- ROUTING GRAPH ---
        // Sources -> [Bus Gains] -> [Master Gain] -> Destination

        // 1. Master Output
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // 2. SFX Bus (Compressed)
        // Dynamics compression helps punchy SFX (guns) sit well without clipping
        this.sfxCompressor = this.ctx.createDynamicsCompressor();
        this.sfxCompressor.threshold.value = -12;
        this.sfxCompressor.knee.value = 40;
        this.sfxCompressor.ratio.value = 12;
        this.sfxCompressor.attack.value = 0.003;
        this.sfxCompressor.release.value = 0.25;
        this.sfxCompressor.connect(this.masterGain);

        // 3. Music Bus (Clean)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.masterGain);

        // 4. Ambience Bus
        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.gain.value = 0.15;
        this.ambienceGain.connect(this.masterGain);

        // 5. Initialize Buffers
        this.noiseBuffer = createNoiseBuffer(this.ctx, 2);
    }

    public async resume() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public get currentTime() {
        return this.ctx.currentTime;
    }
}
