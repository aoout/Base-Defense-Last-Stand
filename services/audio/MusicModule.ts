
import { AudioContextModule } from "./AudioContextModule";
import { getNoteFreq } from "../../utils/audioUtils";

// --- CONFIGURATION ---
const SEQ_CONFIG = {
    TEMPO: 110,
    LOOKAHEAD: 25.0, // ms
    SCHEDULE_AHEAD: 0.1, // s
    LOOP_LENGTH: 64 // 4 bars of 16th notes
};

export class MusicModule {
    private core: AudioContextModule;
    private isPlaying: boolean = false;
    
    // Sequencer State
    private nextNoteTime: number = 0;
    private current16thNote: number = 0;
    private currentMeasure: number = 0;
    private timerID: number | null = null;
    
    // Safety handle for pending stop operations
    private stopTimer: number | null = null;

    // Progression: IV - I - VI - V (Sci-fi Tension)
    private progression = [
        ['C2', 'G2', 'Eb3'], // Cm
        ['Ab2', 'Eb3', 'Ab3'], // Ab
        ['F2', 'C3', 'Ab3'], // Fm
        ['G2', 'D3', 'F3'],  // Gdim (Tension)
    ];

    constructor(core: AudioContextModule) {
        this.core = core;
    }

    public start() {
        // If a stop was pending (fading out), cancel it and resume full volume
        if (this.stopTimer !== null) {
            clearTimeout(this.stopTimer);
            this.stopTimer = null;
        }

        if (this.isPlaying) {
            // Already playing, just ensure volume is up (in case we interrupted a fade)
            this.fadeGain(0.35, 1.0);
            return;
        }

        this.isPlaying = true;
        
        if (this.core.ctx.state === 'suspended') {
            this.core.ctx.resume();
        }

        // Reset Sequence
        this.nextNoteTime = this.core.ctx.currentTime + 0.1;
        this.currentMeasure = 0;
        this.current16thNote = 0;

        // Start Scheduler
        this.timerID = window.setInterval(() => this.scheduler(), SEQ_CONFIG.LOOKAHEAD);
        
        // Fade In
        this.fadeGain(0.35, 2.0);
    }

    public stop() {
        if (!this.isPlaying) return;
        
        // Fade Out
        this.fadeGain(0, 1.0);

        // Clear interval after fade to prevent abrupt cuts
        // Store the timer ID so we can cancel this stop if start() is called again quickly
        this.stopTimer = window.setTimeout(() => {
            if (this.timerID) {
                clearInterval(this.timerID);
                this.timerID = null;
            }
            this.isPlaying = false;
            this.stopTimer = null;
        }, 1000);
    }

    private fadeGain(target: number, duration: number) {
        const now = this.core.ctx.currentTime;
        const gain = this.core.musicGain.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(target, now + duration);
    }

    public get active() {
        return this.isPlaying;
    }

    private scheduler() {
        // While there are notes that will need to play before the next interval, schedule them
        while (this.nextNoteTime < this.core.ctx.currentTime + SEQ_CONFIG.SCHEDULE_AHEAD) {
            this.scheduleBeat(this.current16thNote, this.nextNoteTime);
            this.advanceBeat();
        }
    }

    private advanceBeat() {
        const secondsPerBeat = 60.0 / SEQ_CONFIG.TEMPO;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.current16thNote++;
        
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
            this.currentMeasure++;
        }
    }

    private scheduleBeat(beatIndex: number, time: number) {
        // Check context state before scheduling
        if (this.core.ctx.state !== 'running') return;

        // Calculate Dynamic Intensity based on measure progress (Build-up and Drop)
        const progress = this.currentMeasure % 8; // 8 bar phrases
        let intensity = 0.4;
        
        if (progress >= 2) intensity = 0.6;
        if (progress >= 4) intensity = 0.8;
        if (progress >= 6) intensity = 1.0;
        if (progress === 0) intensity = 0.3; // Reset

        // Current Chord
        const chordIdx = Math.floor(this.currentMeasure / 4) % this.progression.length;
        const chord = this.progression[chordIdx];

        // --- PATTERNS ---
        // 1. KICK: Four-on-the-floor
        if (beatIndex % 4 === 0) {
            if (intensity > 0.4) this.triggerKick(time, intensity);
            else this.triggerHeartbeat(time);
        }

        // 2. BASS: Off-beat pulse
        const bassPattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0];
        if (bassPattern[beatIndex] && intensity > 0.3) {
            this.triggerBass(time, chord[0], intensity);
        } else if (beatIndex === 0 && intensity <= 0.3) {
            this.triggerDrone(time, chord[0]);
        }

        // 3. HI-HATS: Driving rhythm
        if (intensity > 0.6) {
            const isOpen = beatIndex % 4 === 2; // Open hat on the 'and'
            if (beatIndex % 2 === 0) this.triggerHiHat(time, isOpen);
        }

        // 4. ARP: Random generative melody
        if (intensity > 0.7 && Math.random() > 0.6) {
            const note = chord[Math.floor(Math.random() * chord.length)];
            const freq = getNoteFreq(note);
            // Octave jump
            this.triggerArp(time, freq * (Math.random() > 0.5 ? 2 : 4));
        }

        // 5. PADS: Atmospheric swell at start of measure
        if (beatIndex === 0 && intensity > 0.5) {
            this.triggerPad(time, chord);
        }
    }

    // --- SYNTHESIS METHODS ---

    private triggerKick(time: number, intensity: number) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        gain.gain.setValueAtTime(0.3 * intensity, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        osc.connect(gain);
        gain.connect(this.core.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }

    private triggerHeartbeat(time: number) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        // Use Lowpass filter to muffle the sine
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, time);
        
        filter.type = 'lowpass';
        filter.frequency.value = 120;

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    private triggerBass(time: number, note: string, intensity: number) {
        const freq = getNoteFreq(note);
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Filter Envelope (Wah effect)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq, time);
        filter.frequency.exponentialRampToValueAtTime(freq * (2 + intensity * 4), time + 0.05);
        filter.frequency.exponentialRampToValueAtTime(freq, time + 0.2);

        gain.gain.setValueAtTime(0.15 * intensity, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    private triggerHiHat(time: number, open: boolean) {
        if (!this.core.noiseBuffer) return;
        const ctx = this.core.ctx;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = this.core.noiseBuffer;
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const dur = open ? 0.1 : 0.03;
        gain.gain.setValueAtTime(open ? 0.08 : 0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.core.musicGain);

        source.start(time);
        source.stop(time + dur);
    }

    private triggerDrone(time: number, note: string) {
        const freq = getNoteFreq(note);
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Slow swell
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 1.0);
        gain.gain.linearRampToValueAtTime(0, time + 3.0); 

        osc.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 3.5);
    }

    private triggerArp(time: number, freq: number) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    private triggerPad(time: number, notes: string[]) {
        const ctx = this.core.ctx;
        notes.forEach((note, i) => {
            const freq = getNoteFreq(note) * 2; // Octave up
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i === 2 ? 'sawtooth' : 'triangle'; 
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 15; // Chorusing

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 1.5);
            gain.gain.linearRampToValueAtTime(0, time + 4.0);

            osc.connect(gain);
            gain.connect(this.core.musicGain);

            osc.start(time);
            osc.stop(time + 4.5);
        });
    }
}
