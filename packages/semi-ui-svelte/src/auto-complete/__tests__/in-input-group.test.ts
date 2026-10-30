import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import InGroup from './in-input-group.svelte';

describe('Svelte AutoComplete 在 InputGroup 内', () => {
    it('自身子树内的控件不读组', () => {
        render(InGroup);
        const probe = screen.getByText('probe').closest('button');
        expect(probe).toBeEnabled();
        expect(probe).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-size-large`);
    });

    it('自身未设的 size、disabled 取组的，自身显式传的值优先', () => {
        render(InGroup);
        const inherit = screen.getByRole('combobox', { name: 'inherit' });
        const own = screen.getByRole('combobox', { name: 'own' });
        expect(inherit).toBeDisabled();
        expect(own).toBeEnabled();
        expect(inherit).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        expect(own).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
        expect(own).not.toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        expect(inherit.closest(`.${BASE_CLASS_PREFIX}-autocomplete`)).toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete-disabled`);
        expect(own.closest(`.${BASE_CLASS_PREFIX}-autocomplete`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete-disabled`);
    });
});
