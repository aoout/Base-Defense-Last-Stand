
import { SoundProfile, WeaponType } from "../../types";

export const SFX_LIBRARY: Record<string, SoundProfile> = {
    // --- WEAPONS ---
    [`WEAPON_${WeaponType.AR}`]: {
        throttle: 80,
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 150, volume: 0.15, duration: 0.1 },
            { type: 'NOISE', filterFreq: 1500, volume: 0.2, duration: 0.1 }
        ]
    },
    [`WEAPON_${WeaponType.SG}`]: {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 60, volume: 0.3, duration: 0.3 },
            { type: 'NOISE', filterFreq: 800, volume: 0.6, duration: 0.4 }
        ]
    },
    [`WEAPON_${WeaponType.SR}`]: {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 800, volume: 0.2, duration: 0.4 },
            { type: 'NOISE', filterFreq: 3000, volume: 0.5, duration: 0.5 },
            // Sweep effect
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 1200, freqEnd: 100, volume: 0.2, duration: 0.3 }
        ]
    },
    [`WEAPON_${WeaponType.PISTOL}`]: {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 300, volume: 0.1, duration: 0.1 },
            { type: 'NOISE', filterFreq: 2000, volume: 0.15, duration: 0.08 }
        ]
    },
    [`WEAPON_${WeaponType.FLAMETHROWER}`]: {
        throttle: 100,
        layers: [
            { type: 'NOISE', filterFreq: 600, volume: 0.3, duration: 0.15 }
        ]
    },
    [`WEAPON_${WeaponType.PULSE_RIFLE}`]: {
        throttle: 80,
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 800, volume: 0.2, duration: 0.1 },
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 400, detune: -100, volume: 0.1, duration: 0.1 }
        ]
    },
    [`WEAPON_${WeaponType.GRENADE_LAUNCHER}`]: {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 80, volume: 0.4, duration: 0.2 },
            { type: 'NOISE', filterFreq: 400, volume: 0.3, duration: 0.2 }
        ]
    },

    // --- TURRETS ---
    'TURRET_1': { // Gatling
        layers: [
            { type: 'NOISE', filterFreq: 1200, volume: 0.1, duration: 0.05 }
        ]
    },
    'TURRET_2': { // Cannon/Upgraded
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 80, volume: 0.15, duration: 0.15 },
            { type: 'NOISE', filterFreq: 600, volume: 0.2, duration: 0.15 }
        ]
    },

    // --- ENTITIES & EVENTS ---
    'ALLY_SHOOT': {
        layers: [
            { type: 'NOISE', filterFreq: 1000, volume: 0.1, duration: 0.1 }
        ]
    },
    'EXPLOSION': {
        layers: [
            { type: 'NOISE', filterFreq: 300, volume: 0.8, duration: 1.0 },
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 40, volume: 0.4, duration: 0.8 }
        ]
    },
    'GRENADE_THROW': {
        layers: [
            { type: 'NOISE', filterFreq: 2000, volume: 0.2, duration: 0.2 }
        ]
    },
    'ENEMY_DEATH': {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 300, volume: 0.1, duration: 0.1 },
            { type: 'NOISE', filterFreq: 1500, volume: 0.15, duration: 0.1 }
        ]
    },
    'BOSS_DEATH': {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 100, detune: -500, volume: 0.3, duration: 0.4 },
            { type: 'NOISE', filterFreq: 400, volume: 0.4, duration: 0.4 }
        ]
    },
    'VIPER_SHOOT': {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 1500, freqEnd: 200, volume: 0.1, duration: 0.2 }
        ]
    },
    'MELEE_HIT': {
        layers: [
            { type: 'NOISE', filterFreq: 200, volume: 0.2, duration: 0.1 }
        ]
    },
    'BASE_DAMAGE': {
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 100, volume: 0.2, duration: 0.3 },
            { type: 'NOISE', filterFreq: 200, volume: 0.3, duration: 0.3 }
        ]
    }
};
