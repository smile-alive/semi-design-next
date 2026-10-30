import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import DatePicker from '..';
import Button from '../../button';
import { InputGroup } from '../../input';

describe('Solid DatePicker 在 InputGroup 内', () => {
    it('自身的 size 优先于组的，disabled 在自身未设时取组的，自身设了 false 则不被覆盖', () => {
        render(() => (
            <InputGroup disabled size="large">
                <DatePicker aria-label="inherit" />
                <DatePicker aria-label="own" size="small" disabled={false} />
            </InputGroup>
        ));
        const [inherit, own] = document.querySelectorAll<HTMLInputElement>('input');
        expect(inherit).toBeDisabled();
        expect(own).toBeEnabled();
        expect(inherit).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
        expect(own).toHaveClass(`${BASE_CLASS_PREFIX}-input-small`);
    });

    it('自身子树内的 Button 不读组', () => {
        render(() => (
            <InputGroup disabled size="large">
                <DatePicker prefix={<Button>inner</Button>} />
            </InputGroup>
        ));
        expect(screen.getByRole('button', { name: 'inner' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'inner' })).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-size-large`);
    });
});
