import { type JSX, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import NodeCollapsible from '../node-collapsible';

vi.mock('../../collapsible', () => ({
    default: (props: { isOpen: boolean; children?: JSX.Element }) => (
        <div data-open={String(props.isOpen)} data-testid="collapsible">
            {props.children}
        </div>
    ),
}));

const isOpen = () => screen.getByTestId('collapsible').dataset.open;
const nextTick = () => vi.advanceTimersByTimeAsync(0);

function renderCollapsible(initial: boolean) {
    const [open, setOpen] = createSignal(initial);
    render(() => <NodeCollapsible duration={200} motion open={open()} />);
    return setOpen;
}

describe('NodeCollapsible', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('切换一次到挂载状态的相反值，之后忽略后续的 open 变化', async () => {
        const setOpen = renderCollapsible(false);
        expect(isOpen()).toBe('false');
        await nextTick();
        expect(isOpen()).toBe('true');

        setOpen(true);
        await nextTick();
        expect(isOpen()).toBe('true');
    });

    it('动画过程中树数据变化时，已折叠的分组保持折叠', async () => {
        const setOpen = renderCollapsible(true);
        await nextTick();
        expect(isOpen()).toBe('false');

        setOpen(false);
        await nextTick();
        expect(isOpen()).toBe('false');
    });
});
