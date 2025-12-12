
import { GalaxyConfig } from '../../types';

export const PRESETS = {
    LOW: { min: 0.6, max: 2.4, sulfur: 5, oxygen: 80, count: 10, minWaves: 5, maxWaves: 15, offense: true, label: 'DIFF_LOW', color: 'emerald', desc: 'LOW THREAT' },
    MED: { min: 1.0, max: 3.0, sulfur: 10, oxygen: 100, count: 12, minWaves: 8, maxWaves: 25, offense: true, label: 'DIFF_MED', color: 'cyan', desc: 'STANDARD' },
    HIGH: { min: 1.0, max: 4.2, sulfur: 10, oxygen: 100, count: 14, minWaves: 15, maxWaves: 40, offense: true, label: 'DIFF_HIGH', color: 'red', desc: 'HIGH THREAT' },
    CUSTOM: { min: 1.0, max: 3.0, sulfur: 10, oxygen: 100, count: 12, minWaves: 8, maxWaves: 30, offense: true, label: 'DIFF_CUSTOM', color: 'yellow', desc: 'MANUAL' }
};

export const getColorHex = (colorName: string) => {
    switch(colorName) {
        case 'emerald': return '#10b981';
        case 'cyan': return '#06b6d4';
        case 'red': return '#ef4444';
        case 'yellow': return '#eab308';
        case 'purple': return '#a855f7';
        default: return '#94a3b8';
    }
};
