import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import InGroup from './in-input-group.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;
const button = (name: string) => screen.getByRole('button', { name });

describe('Svelte Button 在 InputGroup 内', () => {
    it('size 与 disabled 取组的值，自身显式传的值优先，包装元素内的按钮也接收', () => {
        render(InGroup);
        for (const name of ['plain', 'deep']) {
            expect(button(name)).toBeDisabled();
            expect(button(name)).toHaveClass(`${prefixCls}-size-large`);
        }
        expect(button('own-size')).toBeDisabled();
        expect(button('own-size')).toHaveClass(`${prefixCls}-size-small`);
        expect(button('own-size')).not.toHaveClass(`${prefixCls}-size-large`);
        expect(button('own-enabled')).toBeEnabled();
        expect(button('own-enabled')).toHaveClass(`${prefixCls}-size-large`);
    });

    it('ButtonGroup 内与嵌套 ButtonGroup 内的按钮取组的值，ButtonGroup 自己的值优先', () => {
        render(InGroup);
        for (const name of ['grouped-a', 'nested']) {
            expect(button(name)).toBeDisabled();
            expect(button(name)).toHaveClass(`${prefixCls}-size-large`);
        }
        expect(button('small-a')).toBeDisabled();
        expect(button('small-a')).toHaveClass(`${prefixCls}-size-small`);
        expect(button('enabled-a')).toBeEnabled();
        expect(button('enabled-a')).toHaveClass(`${prefixCls}-size-large`);
    });

    it('ButtonGroup 的分隔线与按钮实际渲染的 disabled 一致', async () => {
        render(InGroup);
        const lineOf = (name: string) => button(name).nextElementSibling;
        await waitFor(() => expect(lineOf('grouped-a')).toHaveClass(`${prefixCls}-group-line`));
        expect(lineOf('grouped-a')).toHaveClass(`${prefixCls}-group-line-disabled`);
        expect(lineOf('small-a')).toHaveClass(`${prefixCls}-group-line-disabled`);
        expect(lineOf('enabled-a')).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });
});
