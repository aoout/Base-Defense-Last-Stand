
import { ModifierType, StatModifier } from '../../types';

export class StatManager {
    private modifiers: Map<string, StatModifier[]> = new Map();

    /**
     * Registers a new modifier.
     */
    public add(mod: StatModifier) {
        if (!this.modifiers.has(mod.statId)) {
            this.modifiers.set(mod.statId, []);
        }
        this.modifiers.get(mod.statId)!.push(mod);
    }

    /**
     * Removes all modifiers registered with a specific source ID.
     * Useful when recalculating stats from a system (e.g. refreshing 'SPACESHIP_MODULES').
     */
    public removeSource(source: string) {
        for (const [key, mods] of this.modifiers.entries()) {
            const filtered = mods.filter(m => m.source !== source);
            this.modifiers.set(key, filtered);
        }
    }

    /**
     * Clears all modifiers.
     */
    public clear() {
        this.modifiers.clear();
    }

    /**
     * Calculates the final value of a stat based on a base value.
     * Formula: (Base + Flat) * (1 + PercentAdd) * PercentMult
     */
    public get(statId: string, baseValue: number): number {
        const mods = this.modifiers.get(statId) || [];
        
        let flat = 0;
        let percentAdd = 0;
        let percentMult = 1;

        for (const mod of mods) {
            if (mod.type === ModifierType.FLAT) flat += mod.value;
            if (mod.type === ModifierType.PERCENT_ADD) percentAdd += mod.value;
            if (mod.type === ModifierType.PERCENT_MULT) percentMult *= mod.value;
        }

        // Apply Flat
        let val = baseValue + flat;
        // Apply Additive Percentages
        val = val * (1 + percentAdd);
        // Apply Multiplicative Percentages
        val = val * percentMult;

        return val;
    }
}
