
import { SoundProfile, OscillatorLayer, NoiseLayer, OscillatorType, BiomeType } from "../types";
import { SFX_LIBRARY } from "../data/registry";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";

// Music Theory Constants
const NOTE_FREQS: Record<string, number> = {
    'C2': 65.41, 'Db2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'Gb2': 92.50, 'G2': 98.00, 'Ab2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'Db3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'Gb3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'Db4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'Gb4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Fallback generator for missing notes to prevent crashes
const OCTAVES = [1, 2, 3, 4, 5, 6];
const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
OCTAVES.forEach(oct => {
    NOTES.forEach(note => {
        const key = `${note}${oct}`;
        if (!NOTE_FREQS[key]) NOTE_FREQS[key] = 440; // Safe fallback
    });
});

const CHORD_PROGRESSION = [
    ['C2', 'G2', 'Eb3'], // Cm
    ['Ab2', 'Eb3', 'Ab3'], // Ab
    ['F2', 'C3', 'Ab3'], // Fm
    ['G2', 'D3', 'F3'],  // Gdim/G7 (Tension)
];

export class AudioService {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private ambienceGain: GainNode; // Dedicated bus for ambience
  private sfxCompressor: DynamicsCompressorNode;
  
  private isBgmPlaying: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayTime: Record<string, number> = {};

  // Ambience State
  private activeAmbienceNodes: AudioNode[] = [];
  private currentAmbienceBiome: BiomeType | null = null;

  // Sequencer State
  private nextNoteTime: number = 0;
  private current16thNote: number = 0; // 0-15
  private currentMeasure: number = 0; // Total measures played
  private tempo: number = 110; 
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;

  // Spatial State
  private cameraX: number = 0;
  private cameraY: number = 0;
  private viewportWidth: number = CANVAS_WIDTH;

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // --- ROUTING ARCHITECTURE ---
    // Music -> MusicGain -> MasterGain
    // Ambience -> AmbienceGain -> MasterGain
    // SFX   -> SFXCompressor -> MasterGain
    // MasterGain -> Dest
    
    // 1. Master Output (Volume Control)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    // 2. SFX Bus (Compressed) - To tame explosions
    this.sfxCompressor = this.ctx.createDynamicsCompressor();
    this.sfxCompressor.threshold.value = -12;
    this.sfxCompressor.knee.value = 40;
    this.sfxCompressor.ratio.value = 12;
    this.sfxCompressor.attack.value = 0.003;
    this.sfxCompressor.release.value = 0.25;
    this.sfxCompressor.connect(this.masterGain);

    // 3. Music Bus (Uncompressed / Clean) - Prevents ducking
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35; 
    this.musicGain.connect(this.masterGain);

    // 4. Ambience Bus (Quiet background)
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.15; // Base volume for ambience (low)
    this.ambienceGain.connect(this.masterGain);

    this.createNoiseBuffer();
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.isBgmPlaying) {
        this.startMusicSequencer();
    }
  }

  public updateCamera(x: number, y: number, viewportWidth?: number) {
      this.cameraX = x;
      this.cameraY = y;
      if (viewportWidth) {
          this.viewportWidth = viewportWidth;
      }
  }

  private createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // --- AMBIENCE SYSTEM ---

  public stopAmbience() {
      if (this.activeAmbienceNodes.length > 0) {
          const now = this.ctx.currentTime;
          // Ramp down active gains
          this.activeAmbienceNodes.forEach(node => {
              if (node instanceof GainNode) {
                  node.gain.cancelScheduledValues(now);
                  node.gain.setValueAtTime(node.gain.value, now);
                  node.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // 2s fade out
              } else if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                  node.stop(now + 2.0);
              }
          });
          // Clear array after fade time (approx)
          setTimeout(() => {
              this.activeAmbienceNodes = [];
          }, 2100);
      }
      this.currentAmbienceBiome = null;
  }

  public startAmbience(biome: BiomeType) {
      if (this.currentAmbienceBiome === biome) return; // Already playing
      
      this.stopAmbience();
      this.currentAmbienceBiome = biome;
      const now = this.ctx.currentTime;

      // Ensure noise buffer is ready
      if (!this.noiseBuffer) this.createNoiseBuffer();

      // Common Setup
      const masterAmbienceGain = this.ctx.createGain();
      masterAmbienceGain.gain.setValueAtTime(0, now);
      masterAmbienceGain.gain.linearRampToValueAtTime(1.0, now + 3.0); // 3s fade in
      masterAmbienceGain.connect(this.ambienceGain);
      this.activeAmbienceNodes.push(masterAmbienceGain);

      // Biome Specific Recipes
      switch(biome) {
          case BiomeType.BARREN:
              // Deep Space Wind: Lowpass Noise + Slow LFO
              this.createWindLayer(masterAmbienceGain, 80, 0.05); // Low rumble
              break;
          
          case BiomeType.ICE:
              // Cold Wind: Bandpass Noise (Higher pitch)
              this.createWindLayer(masterAmbienceGain, 600, 0.1, 'bandpass', 2);
              // Subtle high whistle
              this.createDroneLayer(masterAmbienceGain, 440, 0.02, 'sine'); 
              break;

          case BiomeType.VOLCANIC:
              // Magma Rumble: Deep Sine AM Modulation
              this.createRumbleLayer(masterAmbienceGain);
              break;

          case BiomeType.DESERT:
              // Sandstorm: Mid-range noise
              this.createWindLayer(masterAmbienceGain, 300, 0.08, 'bandpass', 1);
              break;

          case BiomeType.TOXIC:
              // Swampy: Lowpass Noise + LFO on Filter (Breathing effect)
              this.createLiquidLayer(masterAmbienceGain);
              break;
      }
  }

  private createWindLayer(output: AudioNode, freq: number, vol: number, filterType: BiquadFilterType = 'lowpass', lfoSpeed: number = 0.1) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      filter.Q.value = 1;

      const gain = this.ctx.createGain();
      gain.gain.value = vol;

      // LFO for wind swelling
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = lfoSpeed;
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = vol * 0.3; // Modulation depth

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain); // Modulate volume

      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);

      source.start();
      lfo.start();

      this.activeAmbienceNodes.push(source, filter, gain, lfo, lfoGain);
  }

  private createRumbleLayer(output: AudioNode) {
      // FM Synthesis for Rumble
      const carrier = this.ctx.createOscillator();
      carrier.frequency.value = 60; // Base rumble pitch
      
      const modulator = this.ctx.createOscillator();
      modulator.frequency.value = 4; // Rumble speed (Hz)
      
      const modGain = this.ctx.createGain();
      modGain.gain.value = 30; // Rumble depth

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      const amp = this.ctx.createGain();
      amp.gain.value = 0.15;

      carrier.connect(amp);
      amp.connect(output);

      carrier.start();
      modulator.start();

      this.activeAmbienceNodes.push(carrier, modulator, modGain, amp);
  }

  private createLiquidLayer(output: AudioNode) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 5; // Resonant to sound squishy

      // LFO modulates filter frequency
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2; // Slow breathing

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 200; // Sweep range

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      filter.frequency.value = 300; // Base center

      const amp = this.ctx.createGain();
      amp.gain.value = 0.08;

      source.connect(filter);
      filter.connect(amp);
      amp.connect(output);

      source.start();
      lfo.start();

      this.activeAmbienceNodes.push(source, filter, lfo, lfoGain, amp);
  }

  private createDroneLayer(output: AudioNode, freq: number, vol: number, type: OscillatorType) {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      gain.gain.value = vol;

      osc.connect(gain);
      gain.connect(output);
      osc.start();

      this.activeAmbienceNodes.push(osc, gain);
  }

  // --- SFX & MUSIC ---

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
    const now = this.ctx.currentTime;

    // 1. Calculate Spatial Attributes
    let pan = 0;
    let distanceGain = 1.0;

    if (x !== undefined && y !== undefined) {
        const width = this.viewportWidth || CANVAS_WIDTH;
        const centerX = this.cameraX + width / 2;
        const centerY = this.cameraY + CANVAS_HEIGHT / 2; // Assuming height doesn't vary much or logic simplified

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

        // Chain: Source -> Filter -> Amp -> Panner -> SFX_COMPRESSOR
        
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;
        // IMPORTANT: Route SFX to the compressor
        panner.connect(this.sfxCompressor);

        const gain = this.ctx.createGain();
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
    if (!Number.isFinite(start) || !Number.isFinite(stop)) return;
    
    const osc = this.ctx.createOscillator();
    osc.type = config.oscillatorType;
    
    if (!Number.isFinite(config.frequency)) return;

    osc.frequency.setValueAtTime(config.frequency, start);
    if (config.freqEnd && Number.isFinite(config.freqEnd)) {
        osc.frequency.exponentialRampToValueAtTime(config.freqEnd, stop);
    }
    
    let baseDetune = config.detune || 0;
    if (!Number.isFinite(baseDetune)) baseDetune = 0;
    
    osc.detune.setValueAtTime(baseDetune + detuneOffset, start);

    osc.connect(output);
    osc.start(start);
    osc.stop(stop);
  }

  private playNoise(config: NoiseLayer, start: number, stop: number, output: GainNode, detuneOffset: number) {
    if (!this.noiseBuffer) return;
    if (!Number.isFinite(start) || !Number.isFinite(stop)) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    
    source.detune.value = detuneOffset;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    if (!Number.isFinite(config.filterFreq)) return;
    filter.frequency.setValueAtTime(config.filterFreq, start);
    
    if (config.filterFreqEnd && Number.isFinite(config.filterFreqEnd)) {
        filter.frequency.exponentialRampToValueAtTime(config.filterFreqEnd, stop);
    }

    source.connect(filter);
    filter.connect(output);
    
    source.start(start);
    source.stop(stop);
  }

  // --- GENERATIVE MUSIC SEQUENCER ---
  
  private startMusicSequencer() {
      this.isBgmPlaying = true;
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.currentMeasure = 0;
      this.timerID = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  private scheduler() {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
          this.scheduleNote(this.current16thNote, this.nextNoteTime);
          this.advanceNote();
      }
  }

  private advanceNote() {
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += 0.25 * secondsPerBeat;
      
      this.current16thNote++;
      if (this.current16thNote === 16) {
          this.current16thNote = 0;
          this.currentMeasure++;
      }
  }

  private scheduleNote(beatNumber: number, time: number) {
      if (!Number.isFinite(time)) return;

      const loopLength = 80;
      const progress = this.currentMeasure % loopLength;
      
      let intensity = 0;
      if (progress < 8) intensity = 0.2; 
      else if (progress < 16) intensity = 0.4; 
      else if (progress < 48) intensity = 0.8; 
      else if (progress < 64) intensity = 1.0; 
      else intensity = 0.3; 

      const chordIdx = Math.floor(this.currentMeasure / 4) % 4;
      const currentChord = CHORD_PROGRESSION[chordIdx]; 

      if (beatNumber % 4 === 0) {
          if (intensity > 0.3) {
              this.playKick(time, intensity);
          } else {
              this.playHeartbeat(time);
          }
      }

      if (intensity > 0.3) {
          if (beatNumber === 0 || beatNumber === 2 || beatNumber === 3 || beatNumber === 6 || beatNumber === 8 || beatNumber === 11 || beatNumber === 14) {
              this.playBass(time, currentChord[0], intensity);
          }
      } else {
          if (beatNumber === 0) {
              this.playDrone(time, currentChord[0]);
          }
      }

      if (intensity > 0.5) {
          if (beatNumber % 2 === 0) { 
              this.playHiHat(time, beatNumber % 4 === 2); 
          }
      }

      if (intensity > 0.6) {
          if (Math.random() > 0.6) {
              const note = currentChord[Math.random() > 0.5 ? 1 : 2];
              const baseFreq = NOTE_FREQS[note];
              if (Number.isFinite(baseFreq)) {
                  const freq = baseFreq * (Math.random() > 0.8 ? 4 : 2); 
                  this.playArp(time, freq);
              }
          }
      }

      if (beatNumber === 0 && intensity > 0.4) {
          this.playPad(time, [currentChord[0], currentChord[1], currentChord[2]]);
      }
  }

  // --- INSTRUMENTS (Connect to this.musicGain, bypassing compressor) ---

  private playKick(time: number, intensity: number) {
      if (!Number.isFinite(time)) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      gain.gain.setValueAtTime(0.3 * intensity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      
      osc.connect(gain);
      gain.connect(this.musicGain); // Direct to music bus
      
      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playHeartbeat(time: number) {
      if (!Number.isFinite(time)) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(40, time);
      
      filter.type = 'lowpass';
      filter.frequency.value = 80;

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.4);
  }

  private playBass(time: number, note: string, intensity: number) {
      if (!Number.isFinite(time)) return;
      const freq = NOTE_FREQS[note];
      if (!Number.isFinite(freq)) return;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq, time);
      filter.frequency.exponentialRampToValueAtTime(freq * (2 + intensity * 4), time + 0.05);
      filter.frequency.exponentialRampToValueAtTime(freq, time + 0.2);

      gain.gain.setValueAtTime(0.15 * intensity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.2);
  }

  private playDrone(time: number, note: string) {
      if (!Number.isFinite(time)) return;
      const freq = NOTE_FREQS[note];
      if (!Number.isFinite(freq)) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.5);
      gain.gain.linearRampToValueAtTime(0, time + 2.0); 

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 2.5);
  }

  private playHiHat(time: number, open: boolean) {
      if (!this.noiseBuffer) return;
      if (!Number.isFinite(time)) return;

      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      source.buffer = this.noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.value = 7000;

      const dur = open ? 0.1 : 0.05;
      const vol = open ? 0.08 : 0.04;

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      source.start(time);
      source.stop(time + dur);
  }

  private playArp(time: number, freq: number) {
      if (!Number.isFinite(time)) return;
      if (!Number.isFinite(freq)) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.15);
  }

  private playPad(time: number, notes: string[]) {
      if (!Number.isFinite(time)) return;
      notes.forEach((note, i) => {
          const baseFreq = NOTE_FREQS[note];
          if (!Number.isFinite(baseFreq)) return;
          const freq = baseFreq * 2; 

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = i === 2 ? 'sawtooth' : 'triangle'; 
          osc.frequency.value = freq;
          
          const detune = (Math.random() - 0.5) * 10;
          if (Number.isFinite(detune)) {
              osc.detune.value = detune;
          }

          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.06, time + 1.0);
          gain.gain.linearRampToValueAtTime(0, time + 3.0);

          osc.connect(gain);
          gain.connect(this.musicGain);

          osc.start(time);
          osc.stop(time + 3.5);
      });
  }
}
