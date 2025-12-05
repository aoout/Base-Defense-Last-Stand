
import { SoundProfile, OscillatorLayer, NoiseLayer } from "../types";
import { SFX_LIBRARY } from "../data/registry";

export class AudioService {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private bgmNodes: AudioNode[] = [];
  private isBgmPlaying: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayTime: Record<string, number> = {};

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);

    this.createNoiseBuffer();
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.startBgm();
  }

  private createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Main entry point for playing a sound effect.
   */
  public play(profileId: string) {
    const profile = SFX_LIBRARY[profileId];
    if (!profile) {
        // console.warn(`Sound profile '${profileId}' not found.`);
        return;
    }

    // Check throttle
    if (profile.throttle) {
        const now = Date.now();
        const last = this.lastPlayTime[profileId] || 0;
        if (now - last < profile.throttle) return;
        this.lastPlayTime[profileId] = now;
    }

    this.synthesize(profile);
  }

  private synthesize(profile: SoundProfile) {
    const now = this.ctx.currentTime;

    profile.layers.forEach(layer => {
        const startTime = now + (layer.delay || 0);
        const endTime = startTime + layer.duration;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(layer.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, endTime);
        gain.connect(this.masterGain);

        if (layer.type === 'OSCILLATOR') {
            this.playOscillator(layer as OscillatorLayer, startTime, endTime, gain);
        } else if (layer.type === 'NOISE') {
            this.playNoise(layer as NoiseLayer, startTime, endTime, gain);
        }
    });
  }

  private playOscillator(config: OscillatorLayer, start: number, stop: number, output: GainNode) {
    const osc = this.ctx.createOscillator();
    osc.type = config.oscillatorType;
    
    osc.frequency.setValueAtTime(config.frequency, start);
    if (config.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(config.freqEnd, stop);
    }
    
    if (config.detune) {
        osc.detune.setValueAtTime(config.detune, start);
    }

    osc.connect(output);
    osc.start(start);
    osc.stop(stop);
  }

  private playNoise(config: NoiseLayer, start: number, stop: number, output: GainNode) {
    if (!this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.filterFreq, start);
    
    if (config.filterFreqEnd) {
        filter.frequency.exponentialRampToValueAtTime(config.filterFreqEnd, stop);
    } else {
        // Default subtle sweep for punch
        filter.frequency.exponentialRampToValueAtTime(Math.max(100, config.filterFreq * 0.1), stop);
    }

    source.connect(filter);
    filter.connect(output);
    
    source.start(start);
    source.stop(stop);
  }

  // --- BGM: Space Drone (Kept Procedural/Specialized) ---
  private startBgm() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    const rootFreq = 55; // A1

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = rootFreq;
    const gain1 = this.ctx.createGain();
    gain1.gain.value = 0.15;
    
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 200;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = rootFreq * 1.5;
    osc2.detune.value = 10;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.1;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.masterGain);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.bgmNodes = [osc1, osc2, lfo, gain1, gain2, filter1, lfoGain];
  }
}
