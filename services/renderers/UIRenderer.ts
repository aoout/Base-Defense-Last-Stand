
import { GameState } from '../../types';
import { drawFloatingText, isVisible } from '../../utils/renderers';

export class UIRenderer {
    public render(ctx: CanvasRenderingContext2D, state: GameState) {
        const { camera } = state;
        const p = state.player;

        // Reload Indicator (World Space)
        const currentWeaponType = p.loadout[p.currentWeaponIndex];
        if (p.weapons[currentWeaponType].reloading) {
            ctx.save();
            ctx.fillStyle = '#fcd34d';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("[ RELOADING ]", p.x, p.y + 45);
            ctx.restore();
        }

        // Floating Text (World Space)
        state.floatingTexts.forEach(ft => {
            if (!isVisible(ft.x, ft.y, 50, camera)) return;
            drawFloatingText(ctx, ft);
        });
    }
}
