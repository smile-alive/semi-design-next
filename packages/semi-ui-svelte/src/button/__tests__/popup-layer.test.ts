import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import PopupLayer from './popup-layer.svelte';

describe('Svelte Button 与弹层', () => {
    it('弹层里的 Button 不继承打开它的 ButtonGroup 的值，被 Tooltip 包住的仍继承', async () => {
        render(PopupLayer);
        const popupButton = await screen.findByRole('button', { name: 'in popup' });
        expect(popupButton).toBeEnabled();
        expect(popupButton).toHaveClass('semi-button-primary');
        for (const name of ['wrapped', 'own']) {
            const button = screen.getByRole('button', { name });
            expect(button).toBeDisabled();
            expect(button).toHaveClass('semi-button-danger-disabled');
        }
    });
});
