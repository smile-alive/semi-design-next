import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import InGroup from './in-input-group.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;
const button = (name: string) => screen.getByRole('button', { name });

describe('Svelte IconButton 在 InputGroup 内', () => {
    it('size 与 disabled 取组的值，自身显式传的值优先', () => {
        render(InGroup);
        expect(button('plain')).toBeDisabled();
        expect(button('plain')).toHaveClass(`${prefixCls}-size-large`);
        expect(button('own-size')).toBeDisabled();
        expect(button('own-size')).toHaveClass(`${prefixCls}-size-small`);
        expect(button('own-enabled')).toBeEnabled();
        expect(button('own-enabled')).toHaveClass(`${prefixCls}-size-large`);
    });
});
