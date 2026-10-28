import { For, createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import Button, { SplitButtonGroup } from '..';

const button = (name: string) => screen.getByRole('button', { name });

function renderGroup(labels: string[]) {
    const [current, setCurrent] = createSignal(labels);
    render(() => (
        <SplitButtonGroup aria-label="split">
            <For each={current()}>{(label) => <Button>{label}</Button>}</For>
        </SplitButtonGroup>
    ));
    return setCurrent;
}

describe('SplitButtonGroup', () => {
    it('根元素为 role="group"，aria-label 命名，使用方 role 不覆盖 group，class 合并', () => {
        render(() => (
            <SplitButtonGroup aria-label="split" role="toolbar" class="own">
                <Button>a</Button>
            </SplitButtonGroup>
        ));
        expect(screen.getByRole('group', { name: 'split' })).toHaveClass('semi-button-split', 'own');
    });

    it('ref 指向根元素', () => {
        let root: HTMLDivElement | undefined;
        render(() => (
            <SplitButtonGroup ref={(node) => (root = node)} aria-label="split">
                <Button>a</Button>
            </SplitButtonGroup>
        ));
        expect(root).toBe(screen.getByRole('group', { name: 'split' }));
    });

    it('标记首尾按钮，增加按钮后同样生效', async () => {
        const setCurrent = renderGroup(['a', 'b']);
        expect(button('a')).toHaveClass('semi-button-first');
        expect(button('b')).toHaveClass('semi-button-last');
        setCurrent(['a', 'b', 'c']);
        await waitFor(() => expect(button('c')).toHaveClass('semi-button-last'));
        expect(button('b')).not.toHaveClass('semi-button-last');
        expect(button('a')).toHaveClass('semi-button-first');
    });

    it('移除末尾按钮后，新的末尾按钮标记为 last', async () => {
        const setCurrent = renderGroup(['a', 'b', 'c']);
        setCurrent(['a', 'b']);
        await waitFor(() => expect(button('b')).toHaveClass('semi-button-last'));
    });

    it('被其他元素包住的末尾按钮仍标记为 last，按钮 class 重算后标记保留', async () => {
        const [disabled, setDisabled] = createSignal(false);
        render(() => (
            <SplitButtonGroup aria-label="split">
                <Button>main</Button>
                <span>
                    <Button disabled={disabled()}>more</Button>
                </span>
            </SplitButtonGroup>
        ));
        expect(button('main')).toHaveClass('semi-button-first');
        expect(button('more')).toHaveClass('semi-button-last');
        setDisabled(true);
        expect(button('more')).toHaveClass('semi-button-disabled');
        await waitFor(() => expect(button('more')).toHaveClass('semi-button-last'));
    });
});
