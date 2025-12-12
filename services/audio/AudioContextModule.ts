
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../constants";

export class AudioContextModule {
    public ctx: AudioContext;
    public masterGain: GainNode;
    public musicGain: GainNode;
    public ambienceGain: GainNode;
    public sfxCompressor: DynamicsCompressorNode;
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

        this.createNoiseBuffer();
    }

    public async resume() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    private createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    public get currentTime() {
        return this.ctx.currentTime;
    }
}
