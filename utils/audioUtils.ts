
/**
 * Audio Utility Library
 * Handles music theory mathematics and buffer generation.
 */

// A4 reference frequency
const A4 = 440;

/**
 * Converts a scientific pitch notation (e.g., "C4", "F#3") to Frequency in Hz.
 * Uses Equal Temperament tuning.
 */
export const getNoteFreq = (note: string): number => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    // Flatten aliases
    const flatMap: Record<string, string> = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
    
    // Parse note
    const match = note.match(/^([A-G])(#|b)?(\d)$/);
    if (!match) return 440; // Fallback

    let [_, key, accidental, octaveStr] = match;
    if (accidental === 'b') {
        // Convert flats to sharps for index lookup (e.g. Db -> C#)
        // Simple logic handled by map above if input was standardized, 
        // but here we handle standard input like "Db3"
        const fullKey = key + accidental;
        if (flatMap[fullKey]) {
            const mapped = flatMap[fullKey];
            key = mapped.charAt(0);
            accidental = '#';
        }
    }

    const octave = parseInt(octaveStr, 10);
    const semitone = notes.indexOf(key + (accidental || ""));
    
    // MIDI note calculation (A4 = MIDI 69)
    // C0 is MIDI 12
    const midi = octave * 12 + semitone + 12;
    
    // Frequency Formula: f = 440 * 2^((n-69)/12)
    return A4 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Generates a White Noise buffer.
 */
export const createNoiseBuffer = (ctx: AudioContext, duration: number = 2): AudioBuffer => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

/**
 * Converts a musical time interval (1/4, 1/8, 1/16) to seconds based on BPM.
 */
export const beatsToSeconds = (bpm: number, beats: number): number => {
    return (60 / bpm) * beats;
};

/**
 * Musical Scale Definitions (Intervals in semitones)
 */
export const SCALES = {
    MINOR: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
    MAJOR: [0, 2, 4, 5, 7, 9, 11],
    PENTATONIC_MINOR: [0, 3, 5, 7, 10],
    CHROMATIC: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};
