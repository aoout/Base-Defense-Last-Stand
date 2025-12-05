
export type AudioLayerType = 'OSCILLATOR' | 'NOISE';

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';

export interface AudioLayerBase {
    type: AudioLayerType;
    volume: number; // 0 to 1
    duration: number; // Seconds
    delay?: number; // Start delay in seconds
}

export interface OscillatorLayer extends AudioLayerBase {
    type: 'OSCILLATOR';
    oscillatorType: OscillatorType; // 'sine', 'square', 'sawtooth', 'triangle'
    frequency: number; // Hz
    detune?: number; // Cents
    freqEnd?: number; // If present, frequency ramps to this value (Linear/Exponential)
}

export interface NoiseLayer extends AudioLayerBase {
    type: 'NOISE';
    filterFreq: number; // Hz
    filterFreqEnd?: number; // If present, filter ramps to this value
}

export type AudioLayer = OscillatorLayer | NoiseLayer;

export interface SoundProfile {
    layers: AudioLayer[];
    throttle?: number; // Minimum ms between plays to prevent spamming
}