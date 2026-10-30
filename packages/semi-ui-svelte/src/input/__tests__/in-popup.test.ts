import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import InPopup from './in-popup.svelte';

describe('Svelte Input 与 InputNumber 在 InputGroup 的弹层内', () => {
    it('弹层里的控件不继承外层组的 size 与 disabled，弹层外的仍继承', async () => {
        render(InPopup);
        const trigger = await screen.findByRole('textbox', { name: 'trigger-input' });
        expect(trigger).toBeDisabled();
        expect(trigger).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        const input = await screen.findByRole('textbox', { name: 'popup-input' });
        expect(input).toBeEnabled();
        expect(input).not.toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        const number = await screen.findByRole('spinbutton', { name: 'popup-number' });
        expect(number).toBeEnabled();
        expect(number.closest(`.${BASE_CLASS_PREFIX}-input-number`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-input-number-size-large`);
    });
});
