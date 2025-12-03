
import { WeaponType } from "../types";

export class AudioService {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private bgmNodes: AudioNode[] = [];
  private isBgmPlaying: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayTime: Record<string, number> = {};

  constructor() {
    // Initialize AudioContext (it will be suspended initially)
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4; // Master volume
    this.masterGain.connect(this.ctx.destination);

    this.createNoiseBuffer();
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.startBgm();
  }

  // --- Sound Synthesis Helpers ---

  private createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, vol: number = 1, detune: number = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.detune.setValueAtTime(detune, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private createNoiseBurst(duration: number, filterFreq: number = 1000, vol: number = 1) {
    if (!this.noiseBuffer) return;
    
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    // Envelope for filter to make it "punchy"
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    source.stop(this.ctx.currentTime + duration);
  }

  // --- BGM: Space Drone / Atmosphere ---
  private startBgm() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    const rootFreq = 55; // A1 (Low Drone)

    // Oscillator 1: Deep Bass
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = rootFreq;
    const gain1 = this.ctx.createGain();
    gain1.gain.value = 0.15;
    
    // Lowpass filter for Osc 1 to make it dull/dark
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 200;

    // Oscillator 2: Detuned Texture
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = rootFreq * 1.5; // Perfect Fifth
    osc2.detune.value = 10;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.1;

    // LFO to modulate filter of drone
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow pulse
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);

    // Connections
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

  // --- SFX Methods ---

  public playWeaponFire(type: WeaponType) {
    const now = Date.now();
    const last = this.lastPlayTime[type] || 0;
    
    // Throttle high frequency sounds
    if (type === WeaponType.FLAMETHROWER && now - last < 100) return;
    if (type === WeaponType.AR && now - last < 80) return;
    if (type === WeaponType.PULSE_RIFLE && now - last < 80) return;

    this.lastPlayTime[type] = now;

    switch (type) {
      case WeaponType.AR:
        // Mechanical punch + noise
        this.createOscillator('square', 150, 0.1, 0.15);
        this.createNoiseBurst(0.1, 1500, 0.2);
        break;
      
      case WeaponType.SG:
        // Heavy, bassy explosion
        this.createOscillator('sawtooth', 60, 0.3, 0.3);
        this.createNoiseBurst(0.4, 800, 0.6);
        break;

      case WeaponType.SR:
        // High pitched "Zing" + Crack
        this.createOscillator('triangle', 800, 0.4, 0.2); // Whine
        this.createNoiseBurst(0.5, 3000, 0.5); // Crack
        // Pitch sweep
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
        break;

      case WeaponType.PISTOL:
        // Small pop
        this.createOscillator('triangle', 300, 0.1, 0.1);
        this.createNoiseBurst(0.08, 2000, 0.15);
        break;

      case WeaponType.FLAMETHROWER:
        // Continuous hiss - since this function is called repeatedly for rapid fire, keep it short
        this.createNoiseBurst(0.15, 600, 0.3);
        break;

      case WeaponType.PULSE_RIFLE:
        // Sci-fi zap
        this.createOscillator('sine', 800, 0.1, 0.2);
        this.createOscillator('square', 400, 0.1, 0.1, -100);
        break;

      case WeaponType.GRENADE_LAUNCHER:
        // Thump
        this.createOscillator('triangle', 80, 0.2, 0.4);
        this.createNoiseBurst(0.2, 400, 0.3);
        break;
    }
  }

  public playTurretFire(level: number) {
    if (level === 1) {
        // Gatling: Fast, light clicks
        this.createNoiseBurst(0.05, 1200, 0.1);
    } else {
        // Cannon: Heavier thud
        this.createOscillator('square', 80, 0.15, 0.15);
        this.createNoiseBurst(0.15, 600, 0.2);
    }
  }

  public playAllyFire() {
      // Standard rifle sound, slightly quieter/different pitch
      this.createNoiseBurst(0.1, 1000, 0.1);
  }

  public playExplosion() {
    // Deep rumble
    this.createNoiseBurst(1.0, 300, 0.8);
    this.createOscillator('sawtooth', 40, 0.8, 0.4);
  }

  public playGrenadeThrow() {
      // Pin pull / Woosh
      this.createNoiseBurst(0.2, 2000, 0.2);
  }

  public playEnemyDeath(isLarge: boolean = false) {
    // Squish / Crunch sound
    if (isLarge) {
         this.createOscillator('sawtooth', 100, 0.4, 0.3, -500); // Low groan
         this.createNoiseBurst(0.4, 400, 0.4);
    } else {
         this.createOscillator('sawtooth', 300, 0.1, 0.1);
         this.createNoiseBurst(0.1, 1500, 0.15);
    }
  }

  public playViperShoot() {
      // Sci-fi laser pew
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
  }

  public playMeleeHit() {
      // Dull thud
      this.createNoiseBurst(0.1, 200, 0.2);
  }

  public playBaseDamage() {
      // Alarm-like or heavy metal impact
      this.createOscillator('square', 100, 0.3, 0.2);
      this.createNoiseBurst(0.3, 200, 0.3);
  }
}
