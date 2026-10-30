import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import TagInput from '..';
import Button from '../../button';
import { InputGroup } from '../../input';

describe('Solid TagInput 在 InputGroup 内', () => {
    it('自身的 size 优先于组的，disabled 在自身未设时取组的，自身设了 false 则不被覆盖', () => {
        render(() => (
            <InputGroup disabled size="large">
                <TagInput aria-label="inherit" />
                <TagInput aria-label="own" size="small" disabled={false} />
            </InputGroup>
        ));
        const [inherit, own] = screen.getAllByRole('textbox');
        expect(inherit).toBeDisabled();
        expect(own).toBeEnabled();
        expect(inherit.closest(`.${BASE_CLASS_PREFIX}-tagInput`)).toHaveClass(`${BASE_CLASS_PREFIX}-tagInput-large`);
        expect(own.closest(`.${BASE_CLASS_PREFIX}-tagInput`)).toHaveClass(`${BASE_CLASS_PREFIX}-tagInput-small`);
    });

    it('自身子树内的 Button 不读组', () => {
        render(() => (
            <InputGroup disabled size="large">
                <TagInput prefix={<Button>inner</Button>} />
            </InputGroup>
        ));
        expect(screen.getByRole('button', { name: 'inner' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'inner' })).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-size-large`);
    });
});
