import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import AutoComplete from '..';
import Button from '../../button';
import { InputGroup } from '../../input';

describe('Solid AutoComplete 在 InputGroup 内', () => {
    it('自身的 size 优先于组的，disabled 在自身未设时取组的，自身设了 false 则不被覆盖', () => {
        render(() => (
            <InputGroup disabled size="large">
                <AutoComplete aria-label="inherit" />
                <AutoComplete aria-label="own" size="small" disabled={false} />
            </InputGroup>
        ));
        const inherit = screen.getByRole('combobox', { name: 'inherit' });
        const own = screen.getByRole('combobox', { name: 'own' });
        expect(inherit).toBeDisabled();
        expect(own).toBeEnabled();
        expect(inherit).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        expect(own).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
        expect(inherit.closest(`.${BASE_CLASS_PREFIX}-autocomplete`)).toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete-disabled`);
        expect(own.closest(`.${BASE_CLASS_PREFIX}-autocomplete`)).not.toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete-disabled`);
    });

    it('自身子树内的 Button 不读组', () => {
        render(() => (
            <InputGroup disabled size="large">
                <AutoComplete prefix={<Button>inner</Button>} />
            </InputGroup>
        ));
        expect(screen.getByRole('button', { name: 'inner' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'inner' })).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-size-large`);
    });
});
