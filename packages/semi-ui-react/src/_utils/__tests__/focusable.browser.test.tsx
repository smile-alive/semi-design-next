import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';

// Real layout is needed: checkVisibility depends on computed display and visibility.
function Panels() {
    return (
        <div data-testid="root">
            <button type="button">first</button>
            <button type="button">last visible</button>
            <div style={{ display: 'none' }}>
                <button type="button">in display none</button>
            </div>
            <div hidden>
                <button type="button">in hidden</button>
            </div>
            <div style={{ visibility: 'hidden' }}>
                <button type="button">in visibility hidden</button>
            </div>
        </div>
    );
}

const names = (elements) => elements.map((element) => element.textContent);

describe('可聚焦元素查询', () => {
    it('跳过未渲染的元素', () => {
        const { getByTestId } = render(<Panels />);
        const root = getByTestId('root');
        expect(names(FocusTrapHandle.getFocusableElements(root))).toEqual(['first', 'last visible']);
    });

    it('Tab 从最后一个可见元素回绕到第一个', async () => {
        const { getByTestId, getByText } = render(<Panels />);
        const handle = new FocusTrapHandle(getByTestId('root'));
        getByText('last visible').focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(getByText('first'));
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(document.activeElement).toBe(getByText('last visible'));
        handle.destroy();
    });
});
