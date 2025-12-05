
import { SoundProfile, OscillatorLayer, NoiseLayer, OscillatorType } from "../types";
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
  private sfxCompressor: DynamicsCompressorNode;
  
  private isBgmPlaying: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayTime: Record<string, number> = {};

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

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // --- ROUTING ARCHITECTURE ---
    // Old: All -> Compressor -> Master -> Dest
    // New: 
    //   Music -> MusicGain -> MasterGain
    //   SFX   -> SFXCompressor -> MasterGain
    //   MasterGain -> Dest
    
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

  public updateCamera(x: number, y: number) {
      this.cameraX = x;
      this.cameraY = y;
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
        const centerX = this.cameraX + CANVAS_WIDTH / 2;
        const centerY = this.cameraY + CANVAS_HEIGHT / 2;

        const screenX = x - this.cameraX;
        pan = (screenX - CANVAS_WIDTH / 2) / (CANVAS_WIDTH / 2);
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
