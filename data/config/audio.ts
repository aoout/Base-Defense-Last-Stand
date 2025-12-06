
import { SoundProfile, WeaponType } from "../../types";

export const SFX_LIBRARY: Record<string, SoundProfile> = {
    // --- WEAPONS FIRE ---
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

    // --- WEAPON RELOADS (Optimized & Louder) ---
    
    // Pistol: Fast, crisp mechanical snap (1.0s)
    [`RELOAD_${WeaponType.PISTOL}`]: {
        layers: [
            // Mag Out
            { type: 'NOISE', filterFreq: 2000, volume: 0.3, duration: 0.1 }, 
            // Mag In (Metal click)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 600, volume: 0.25, duration: 0.05, delay: 0.4 },
            // Slide Release (Sharp snap)
            { type: 'NOISE', filterFreq: 4000, volume: 0.4, duration: 0.1, delay: 0.8 } 
        ]
    },

    // AR: Standard military rifle sequence (1.5s)
    [`RELOAD_${WeaponType.AR}`]: {
        layers: [
            // Mag Out (Friction)
            { type: 'NOISE', filterFreq: 1000, volume: 0.3, duration: 0.2 },
            // Mag In (Heavy Thud)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 150, volume: 0.3, duration: 0.1, delay: 0.6 },
            { type: 'NOISE', filterFreq: 800, volume: 0.4, duration: 0.15, delay: 0.6 },
            // Charging Handle (Metallic Slide)
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 800, freqEnd: 400, volume: 0.2, duration: 0.2, delay: 1.1 },
            { type: 'NOISE', filterFreq: 2000, volume: 0.3, duration: 0.2, delay: 1.1 }
        ]
    },

    // Shotgun: Heavy mechanical chunk-chunk (2.0s)
    [`RELOAD_${WeaponType.SG}`]: {
        layers: [
            // Shell/Mag Insert (Deep hollow sound)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 80, volume: 0.4, duration: 0.2 },
            { type: 'NOISE', filterFreq: 400, volume: 0.4, duration: 0.3 },
            // Rack Slide Back
            { type: 'NOISE', filterFreq: 600, volume: 0.5, duration: 0.2, delay: 1.2 },
            // Rack Slide Forward (Heavy Lock)
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 100, volume: 0.5, duration: 0.15, delay: 1.5 },
            { type: 'NOISE', filterFreq: 1200, volume: 0.6, duration: 0.1, delay: 1.5 }
        ]
    },

    // Sniper: Precision bolt action (2.5s)
    [`RELOAD_${WeaponType.SR}`]: {
        layers: [
            // Bolt Open (Long metal slide)
            { type: 'NOISE', filterFreq: 1500, volume: 0.3, duration: 0.4 },
            // Mag Eject
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 400, volume: 0.2, duration: 0.1, delay: 0.2 },
            // Mag Insert (Crisp Click)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 1000, volume: 0.25, duration: 0.05, delay: 1.2 },
            // Bolt Close (Heavy precision lock)
            { type: 'NOISE', filterFreq: 2000, volume: 0.4, duration: 0.2, delay: 2.0 },
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 200, volume: 0.3, duration: 0.1, delay: 2.1 }
        ]
    },

    // Flamethrower: Industrial gas valves (2.2s)
    [`RELOAD_${WeaponType.FLAMETHROWER}`]: { 
        layers: [
            // Pressure Release (Hiss)
            { type: 'NOISE', filterFreq: 3000, filterFreqEnd: 100, volume: 0.3, duration: 0.5 },
            // Canister Thud
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 60, volume: 0.5, duration: 0.3, delay: 0.8 },
            // Repressurize (Rising Hiss)
            { type: 'NOISE', filterFreq: 500, filterFreqEnd: 2000, volume: 0.3, duration: 0.8, delay: 1.2 }
        ]
    },

    // Pulse Rifle: Sci-fi energy cell cycling (1.3s)
    [`RELOAD_${WeaponType.PULSE_RIFLE}`]: { 
        layers: [
            // Power Down (Pitch Drop)
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 800, freqEnd: 100, volume: 0.3, duration: 0.3 },
            // Cell Eject (Pop)
            { type: 'NOISE', filterFreq: 3000, volume: 0.2, duration: 0.05, delay: 0.3 },
            // Cell Insert (Electrical Hum)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 100, detune: 50, volume: 0.2, duration: 0.3, delay: 0.6 },
            // Power Up (Pitch Rise)
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 200, freqEnd: 1200, volume: 0.3, duration: 0.5, delay: 0.7 }
        ]
    },

    // Grenade Launcher: Heavy machinery (3.2s)
    [`RELOAD_${WeaponType.GRENADE_LAUNCHER}`]: { 
        layers: [
            // Break Action Open (Clunk)
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 100, volume: 0.4, duration: 0.2 },
            // Shells Eject (Hollow rattle)
            { type: 'NOISE', filterFreq: 1000, volume: 0.3, duration: 0.4, delay: 0.4 },
            // Load New Rounds (Heavy Thuds)
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 80, volume: 0.4, duration: 0.1, delay: 1.2 },
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 80, volume: 0.4, duration: 0.1, delay: 1.6 },
            // Close Action (Heavy Steel Lock)
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 60, volume: 0.5, duration: 0.2, delay: 2.6 },
            { type: 'NOISE', filterFreq: 500, volume: 0.5, duration: 0.1, delay: 2.6 }
        ]
    },

    // --- TURRETS ---
    'TURRET_1': { // Gatling (Generic/Standard)
        layers: [
            { type: 'NOISE', filterFreq: 1200, volume: 0.1, duration: 0.05 }
        ]
    },
    'TURRET_2': { // Cannon/Upgraded (Fallback)
        layers: [
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 80, volume: 0.15, duration: 0.15 },
            { type: 'NOISE', filterFreq: 600, volume: 0.2, duration: 0.15 }
        ]
    },
    'TURRET_SNIPER': { // Heavy Mechanical Cannon (Low EMF, Low Vol)
        layers: [
            // Mechanical Thud (Cleaner than square)
            { type: 'OSCILLATOR', oscillatorType: 'triangle', frequency: 60, volume: 0.1, duration: 0.1 },
            // Hydraulic/Pneumatic release
            { type: 'NOISE', filterFreq: 500, volume: 0.05, duration: 0.15 }
        ]
    },
    'TURRET_BUILD': {
        layers: [
            // Servo whine
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 150, freqEnd: 50, volume: 0.2, duration: 0.3 },
            // Heavy metallic thud
            { type: 'NOISE', filterFreq: 200, volume: 0.5, duration: 0.2, delay: 0.1 },
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 60, volume: 0.3, duration: 0.1, delay: 0.1 }
        ]
    },
    'TURRET_UPGRADE': {
        layers: [
            // Tech charging sound
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 400, freqEnd: 1200, volume: 0.2, duration: 0.4 },
            // Mechanical lock
            { type: 'NOISE', filterFreq: 1500, volume: 0.2, duration: 0.1, delay: 0.35 },
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 100, volume: 0.2, duration: 0.1, delay: 0.35 }
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
            { type: 'NOISE', filterFreq: 2000, volume: 0.2, duration: 0.2 },
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 400, freqEnd: 100, volume: 0.1, duration: 0.2 } // Whoosh
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
    },
    'BULLET_HIT': {
        throttle: 50, // Prevent ear destruction from shotguns
        layers: [
            { type: 'NOISE', filterFreq: 3000, volume: 0.05, duration: 0.05 }
        ]
    },
    
    // --- SPECIAL ABILITIES ---
    'ORBITAL_STRIKE': {
        throttle: 200,
        layers: [
            // Sci-fi Sweep (Laser charge)
            { type: 'OSCILLATOR', oscillatorType: 'sine', frequency: 800, freqEnd: 100, volume: 0.4, duration: 0.5 },
            // Electrical zap
            { type: 'OSCILLATOR', oscillatorType: 'sawtooth', frequency: 1200, freqEnd: 50, volume: 0.15, duration: 0.3 },
            // Deep Impact Rumble
            { type: 'NOISE', filterFreq: 200, volume: 0.6, duration: 1.0, delay: 0.1 },
            // Sub-bass Boom
            { type: 'OSCILLATOR', oscillatorType: 'square', frequency: 50, volume: 0.3, duration: 0.8, delay: 0.1 }
        ]
    }
};
