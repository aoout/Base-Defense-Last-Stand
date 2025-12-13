
import { GameState, Enemy, Entity } from '../../types';

export class TargetingLogic {
    
    /**
     * Finds the nearest valid target for an enemy based on its detection range.
     * Priorities: Base (if close) > Player/Ally/Turret (if closest).
     */
    public static acquireNearestTarget(enemy: Enemy, state: GameState): Entity {
        // Default Target: The Base (or Secondary Base if closer)
        let target: Entity = state.base as unknown as Entity;
        let minDistSq = (enemy.x - state.base.x)**2 + (enemy.y - state.base.y)**2;

        if (state.secondaryBase) {
            const distSecSq = (enemy.x - state.secondaryBase.x)**2 + (enemy.y - state.secondaryBase.y)**2;
            if (distSecSq < minDistSq) {
                minDistSq = distSecSq;
                target = state.secondaryBase as unknown as Entity;
            }
        }

        // If detection range is set, scan for dynamic entities (Player, Allies, Turrets)
        if (enemy.detectionRange > 0) {
            const detectionSq = enemy.detectionRange ** 2;

            // 1. Check Player
            const distPlayerSq = (enemy.x - state.player.x)**2 + (enemy.y - state.player.y)**2;
            if (distPlayerSq < detectionSq && distPlayerSq < minDistSq) {
                minDistSq = distPlayerSq;
                target = state.player;
            }

            // 2. Check Allies (Optimization: Only check if player wasn't already super close)
            // Can be skipped if we want strictly "nearest", but let's iterate.
            for (const ally of state.allies) {
                const dSq = (enemy.x - ally.x)**2 + (enemy.y - ally.y)**2;
                if (dSq < detectionSq && dSq < minDistSq) {
                    minDistSq = dSq;
                    target = ally;
                }
            }

            // 3. Check Turrets
            for (const spot of state.turretSpots) {
                if (spot.builtTurret) {
                    const dSq = (enemy.x - spot.builtTurret.x)**2 + (enemy.y - spot.builtTurret.y)**2;
                    if (dSq < detectionSq && dSq < minDistSq) {
                        minDistSq = dSq;
                        target = spot.builtTurret;
                    }
                }
            }
        }

        return target;
    }

    /**
     * Specialized targeting for "Prey" (Grunts) used by Tube Worms.
     */
    public static findPrey(enemy: Enemy, state: GameState, range: number): Enemy | null {
        let closestPrey: Enemy | null = null;
        let minDst = range * range;

        for (const other of state.enemies) {
            // Cannot eat self or bosses, only eats Grunts
            if (other.id !== enemy.id && other.type === 'GRUNT') {
                const dst = (enemy.x - other.x)**2 + (enemy.y - other.y)**2;
                if (dst < minDst) {
                    minDst = dst;
                    closestPrey = other;
                }
            }
        }
        return closestPrey;
    }
}
