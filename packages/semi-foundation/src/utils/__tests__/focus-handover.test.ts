import { afterEach, describe, expect, it } from 'vite-plus/test';
import { findFocusAfter, handoverFocus } from '../focus-handover';

function button(text: string) {
    const node = document.createElement('button');
    node.textContent = text;
    return document.body.appendChild(node);
}

describe('handoverFocus', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('持焦元素被移除、焦点落到 body 时，焦点交给目标', () => {
        const from = button('from');
        const target = button('target');
        from.focus();
        from.remove();
        expect(document.activeElement).toBe(document.body);
        handoverFocus(from, target);
        expect(target).toHaveFocus();
    });

    it('原元素仍在文档中时不移动焦点', () => {
        const from = button('from');
        const target = button('target');
        from.focus();
        handoverFocus(from, target);
        expect(from).toHaveFocus();
    });

    it('焦点已被移到别处时不抢回', () => {
        const from = button('from');
        const other = button('other');
        const target = button('target');
        from.focus();
        other.focus();
        from.remove();
        handoverFocus(from, target);
        expect(other).toHaveFocus();
    });

    it('findFocusAfter 取文档顺序里的下一个可聚焦元素，没有时取上一个，跳过自身内部', () => {
        const before = button('before');
        const from = document.body.appendChild(document.createElement('div'));
        from.append(document.createElement('button'));
        const after = button('after');
        expect(findFocusAfter(from)).toBe(after);
        after.remove();
        expect(findFocusAfter(from)).toBe(before);
        before.remove();
        expect(findFocusAfter(from)).toBeNull();
    });

    it('没有目标时什么也不做', () => {
        const from = button('from');
        from.focus();
        from.remove();
        handoverFocus(from, null);
        expect(document.activeElement).toBe(document.body);
    });
});
