import { type Accessor, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { countLiveListeners } from '@test/utils/solid';
import useClickOutside from '../use-click-outside';

const press = (target: EventTarget) => target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

function Host(props: { onOutside: (e: MouseEvent) => void; enabled?: Accessor<boolean> }) {
    const [box, setBox] = createSignal<HTMLElement>();
    const markInside = useClickOutside(
        [box],
        (e) => props.onOutside(e),
        () => props.enabled?.() ?? true
    );
    return (
        // a trigger that renders its own popup
        <button ref={setBox} type="button" data-testid="box" onMouseDown={markInside}>
            <span>inside</span>
            <Portal>
                <span>portaled</span>
            </Portal>
        </button>
    );
}

describe('useClickOutside', () => {
    it('外部按下时调用 onOutside 并传入原生事件，内部按下不调用', () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        render(() => <Host onOutside={onOutside} />);
        press(screen.getByText('inside'));
        expect(onOutside).not.toHaveBeenCalled();
        press(document.body);
        expect(onOutside).toHaveBeenCalledTimes(1);
        expect(onOutside.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('目标内 Portal 中的按下经返回的 onMouseDown 记为内部', () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        render(() => <Host onOutside={onOutside} />);
        const portaled = screen.getByText('portaled');
        expect(screen.getByTestId('box').contains(portaled)).toBe(false);
        press(portaled);
        expect(onOutside).not.toHaveBeenCalled();
    });

    it('enabled 为 false 时不监听，变为 true 后开始监听', () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        const [enabled, setEnabled] = createSignal(false);
        render(() => <Host onOutside={onOutside} enabled={enabled} />);
        press(document.body);
        expect(onOutside).not.toHaveBeenCalled();
        setEnabled(true);
        press(document.body);
        expect(onOutside).toHaveBeenCalledTimes(1);
    });

    it('在外部元素的 mousedown 处理函数中启用时，忽略这次按下，下一次按下才算', () => {
        const onOutside = vi.fn<(e: MouseEvent) => void>();
        const [enabled, setEnabled] = createSignal(false);
        render(() => (
            <>
                <Host onOutside={onOutside} enabled={enabled} />
                <button type="button" onMouseDown={() => setEnabled(true)}>
                    opener
                </button>
            </>
        ));
        press(screen.getByText('opener'));
        expect(onOutside).not.toHaveBeenCalled();
        press(document.body);
        expect(onOutside).toHaveBeenCalledTimes(1);
    });

    it('卸载与停用后移除 mousedown 监听', () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const [enabled, setEnabled] = createSignal(true);
        const { unmount } = render(() => <Host onOutside={() => {}} enabled={enabled} />);
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
        setEnabled(false);
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        setEnabled(true);
        unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
    });
});
