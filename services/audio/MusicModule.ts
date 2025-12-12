
import { AudioContextModule } from "./AudioContextModule";

// Music Theory Constants
const NOTE_FREQS: Record<string, number> = {
    'C2': 65.41, 'Db2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'Gb2': 92.50, 'G2': 98.00, 'Ab2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'Db3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'Gb3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'Db4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'Gb4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Fallback generator
const OCTAVES = [1, 2, 3, 4, 5, 6];
const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
OCTAVES.forEach(oct => {
    NOTES.forEach(note => {
        const key = `${note}${oct}`;
        if (!NOTE_FREQS[key]) NOTE_FREQS[key] = 440;
    });
});

const CHORD_PROGRESSION = [
    ['C2', 'G2', 'Eb3'], // Cm
    ['Ab2', 'Eb3', 'Ab3'], // Ab
    ['F2', 'C3', 'Ab3'], // Fm
    ['G2', 'D3', 'F3'],  // Gdim/G7 (Tension)
];

export class MusicModule {
    private core: AudioContextModule;
    private isPlaying: boolean = false;
    
    // Sequencer State
    private nextNoteTime: number = 0;
    private current16thNote: number = 0;
    private currentMeasure: number = 0;
    private tempo: number = 110; 
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // s
    private timerID: number | null = null;

    constructor(core: AudioContextModule) {
        this.core = core;
    }

    public start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.core.ctx.currentTime + 0.1;
        this.currentMeasure = 0;
        this.timerID = window.setInterval(() => this.scheduler(), this.lookahead);
    }

    public stop() {
        if (this.timerID) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
        this.isPlaying = false;
    }

    public get active() {
        return this.isPlaying;
    }

    private scheduler() {
        while (this.nextNoteTime < this.core.ctx.currentTime + this.scheduleAheadTime) {
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
            if (intensity > 0.3) this.playKick(time, intensity);
            else this.playHeartbeat(time);
        }

        if (intensity > 0.3) {
            if ([0, 2, 3, 6, 8, 11, 14].includes(beatNumber)) {
                this.playBass(time, currentChord[0], intensity);
            }
        } else {
            if (beatNumber === 0) this.playDrone(time, currentChord[0]);
        }

        if (intensity > 0.5) {
            if (beatNumber % 2 === 0) this.playHiHat(time, beatNumber % 4 === 2);
        }

        if (intensity > 0.6) {
            if (Math.random() > 0.6) {
                const note = currentChord[Math.random() > 0.5 ? 1 : 2];
                const baseFreq = NOTE_FREQS[note];
                if (Number.isFinite(baseFreq)) {
                    this.playArp(time, baseFreq * (Math.random() > 0.8 ? 4 : 2));
                }
            }
        }

        if (beatNumber === 0 && intensity > 0.4) {
            this.playPad(time, [currentChord[0], currentChord[1], currentChord[2]]);
        }
    }

    // --- INSTRUMENTS (Direct Connect to Music Bus) ---

    private playKick(time: number, intensity: number) {
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

    private playHeartbeat(time: number) {
        const ctx = this.core.ctx;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, time);
        filter.type = 'lowpass';
        filter.frequency.value = 80;

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 0.4);
    }

    private playBass(time: number, note: string, intensity: number) {
        const freq = NOTE_FREQS[note];
        if (!freq) return;
        const ctx = this.core.ctx;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

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
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    private playDrone(time: number, note: string) {
        const freq = NOTE_FREQS[note];
        if (!freq) return;
        const ctx = this.core.ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.5);
        gain.gain.linearRampToValueAtTime(0, time + 2.0); 

        osc.connect(gain);
        gain.connect(this.core.musicGain);

        osc.start(time);
        osc.stop(time + 2.5);
    }

    private playHiHat(time: number, open: boolean) {
        if (!this.core.noiseBuffer) return;
        const ctx = this.core.ctx;

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = this.core.noiseBuffer;
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const dur = open ? 0.1 : 0.05;
        const vol = open ? 0.08 : 0.04;

        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.core.musicGain);

        source.start(time);
        source.stop(time + dur);
    }

    private playArp(time: number, freq: number) {
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
        osc.stop(time + 0.15);
    }

    private playPad(time: number, notes: string[]) {
        const ctx = this.core.ctx;
        notes.forEach((note, i) => {
            const freq = NOTE_FREQS[note] ? NOTE_FREQS[note] * 2 : 0;
            if (!freq) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i === 2 ? 'sawtooth' : 'triangle'; 
            osc.frequency.value = freq;
            
            const detune = (Math.random() - 0.5) * 10;
            osc.detune.value = detune;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.06, time + 1.0);
            gain.gain.linearRampToValueAtTime(0, time + 3.0);

            osc.connect(gain);
            gain.connect(this.core.musicGain);

            osc.start(time);
            osc.stop(time + 3.5);
        });
    }
}
