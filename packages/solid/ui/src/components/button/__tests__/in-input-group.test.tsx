import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Button, { ButtonGroup } from '..';
import { InputGroup } from '../../input';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;

describe('Solid Button 在 InputGroup 内', () => {
    it('自身的 size 与 disabled 优先于组的，没传时取组的', () => {
        render(() => (
            <InputGroup disabled size="large">
                <Button size="small">own</Button>
                <Button disabled={false}>enabled</Button>
                <Button>inherit</Button>
            </InputGroup>
        ));
        const own = screen.getByRole('button', { name: 'own' });
        const enabled = screen.getByRole('button', { name: 'enabled' });
        const inherit = screen.getByRole('button', { name: 'inherit' });
        expect(own).toHaveClass(`${prefixCls}-size-small`);
        expect(own).toBeDisabled();
        expect(enabled).toBeEnabled();
        expect(enabled).toHaveClass(`${prefixCls}-size-large`);
        expect(inherit).toBeDisabled();
        expect(inherit).toHaveClass(`${prefixCls}-size-large`);
    });

    it('包装元素内的 Button 也接收组的 size 与 disabled', () => {
        render(() => (
            <InputGroup disabled size="small">
                <div>
                    <Button>deep</Button>
                </div>
            </InputGroup>
        ));
        expect(screen.getByRole('button', { name: 'deep' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'deep' })).toHaveClass(`${prefixCls}-size-small`);
    });

    it('嵌套 ButtonGroup 里的 Button 接收组的 size 与 disabled，ButtonGroup 自己的值优先，分隔线随实际 disabled', () => {
        render(() => (
            <InputGroup disabled size="large">
                <ButtonGroup>
                    <Button>a</Button>
                    <Button>b</Button>
                </ButtonGroup>
                <ButtonGroup size="small" disabled={false}>
                    <Button>c</Button>
                    <Button>d</Button>
                </ButtonGroup>
            </InputGroup>
        ));
        expect(screen.getByRole('button', { name: 'a' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-size-large`);
        expect(screen.getByRole('button', { name: 'c' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'c' })).toHaveClass(`${prefixCls}-size-small`);
        const [first, second] = document.querySelectorAll(`.${prefixCls}-group-line`);
        expect(first).toHaveClass(`${prefixCls}-group-line-disabled`);
        expect(second).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });
});
