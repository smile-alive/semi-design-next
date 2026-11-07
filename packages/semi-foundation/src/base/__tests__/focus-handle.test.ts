import { describe, expect, it } from 'vite-plus/test';
import FocusTrapHandle from '../focus-handle';

describe('FocusTrapHandle', () => {
    it('不冻结调用方传入的 options 对象', () => {
        const options = { preventScroll: true };
        const handle = new FocusTrapHandle(document.createElement('div'), options);
        expect(Object.isFrozen(options)).toBe(false);
        handle.destroy();
    });

    describe('焦点在容器本身时', () => {
        const setup = () => {
            document.body.innerHTML = '<div id="box" tabindex="-1"><button id="first">a</button><button id="last">b</button><button id="off" tabindex="0" disabled>x</button></div>';
            const box = document.getElementById('box');
            const handle = new FocusTrapHandle(box);
            box.focus();
            return { box, handle };
        };
        const press = (box: HTMLElement, shiftKey: boolean) => {
            const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
            box.dispatchEvent(event);
            return event;
        };

        it('Shift+Tab 聚焦最后一个可聚焦元素，带 tabindex 的禁用控件不算', () => {
            const { box, handle } = setup();
            const event = press(box, true);
            expect(document.activeElement?.id).toBe('last');
            expect(event.defaultPrevented).toBe(true);
            handle.destroy();
        });

        it('Tab 聚焦第一个可聚焦元素', () => {
            const { box, handle } = setup();
            const event = press(box, false);
            expect(document.activeElement?.id).toBe('first');
            expect(event.defaultPrevented).toBe(true);
            handle.destroy();
        });
    });

    it('isFocusVisibleWithin 只在焦点位于容器内且为键盘焦点时为真', () => {
        document.body.innerHTML = '<div id="panel"><button id="inside">a</button></div><button id="outside">b</button>';
        const panel = document.getElementById('panel');
        const inside = document.getElementById('inside');
        document.getElementById('outside').focus();
        expect(FocusTrapHandle.isFocusVisibleWithin(panel)).toBe(false);
        inside.focus();
        Object.defineProperty(inside, 'matches', { configurable: true, value: (selector: string) => selector === ':focus-visible' });
        expect(FocusTrapHandle.isFocusVisibleWithin(panel)).toBe(true);
        Object.defineProperty(inside, 'matches', { configurable: true, value: () => false });
        expect(FocusTrapHandle.isFocusVisibleWithin(panel)).toBe(false);
        expect(FocusTrapHandle.isFocusVisibleWithin(null)).toBe(false);
    });

    it('focusFirstOrSelf 聚焦第一个可聚焦元素，没有时聚焦容器自身', () => {
        document.body.innerHTML = '<div id="filled" tabindex="-1"><button id="first">a</button></div><div id="empty" tabindex="-1"></div>';
        FocusTrapHandle.focusFirstOrSelf(document.getElementById('filled'));
        expect(document.activeElement?.id).toBe('first');
        FocusTrapHandle.focusFirstOrSelf(document.getElementById('empty'));
        expect(document.activeElement?.id).toBe('empty');
        expect(() => FocusTrapHandle.focusFirstOrSelf(null)).not.toThrow();
    });
});
