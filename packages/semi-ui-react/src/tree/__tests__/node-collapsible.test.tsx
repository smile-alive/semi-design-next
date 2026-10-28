import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import NodeCollapsible from '../node-collapsible';

vi.mock('@fibrae/semi-ui-react/collapsible', () => ({
    default: ({ isOpen, children }) => (
        <div data-open={String(isOpen)} data-testid="collapsible">
            {children}
        </div>
    ),
}));

const isOpen = () => screen.getByTestId('collapsible').dataset.open;
const nextTick = () => act(() => vi.advanceTimersByTimeAsync(0));

describe('NodeCollapsible', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('切换一次到挂载状态的相反值，之后忽略后续的 open 变化', async () => {
        const { rerender } = render(<NodeCollapsible open={false} />);
        expect(isOpen()).toBe('false');
        await nextTick();
        expect(isOpen()).toBe('true');

        rerender(<NodeCollapsible open />);
        await nextTick();
        expect(isOpen()).toBe('true');
    });

    it('动画过程中树数据变化时，已折叠的分组保持折叠', async () => {
        const { rerender } = render(<NodeCollapsible open />);
        await nextTick();
        expect(isOpen()).toBe('false');

        rerender(<NodeCollapsible open={false} />);
        await nextTick();
        expect(isOpen()).toBe('false');
    });
});
