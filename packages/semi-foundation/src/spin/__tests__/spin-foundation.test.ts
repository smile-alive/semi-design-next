import { afterEach, describe, expect, it } from 'vite-plus/test';
import SpinFoundation, { type SpinAdapter } from '../foundation';

function setup() {
    const foundation = new SpinFoundation({} as unknown as SpinAdapter);
    const root = document.createElement('div');
    root.tabIndex = -1;
    const button = document.createElement('button');
    root.append(button);
    document.body.append(root);
    return { foundation, root, button };
}

describe('SpinFoundation.handleBlockedChange', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('遮挡时根元素接住内容里的焦点，解除后交回', () => {
        const { foundation, root, button } = setup();
        button.focus();
        foundation.handleBlockedChange(root, true);
        expect(document.activeElement).toBe(root);
        foundation.handleBlockedChange(root, false);
        expect(document.activeElement).toBe(button);
    });

    it('焦点已被使用方移到别处时不抢回', () => {
        const { foundation, root, button } = setup();
        const outside = document.createElement('input');
        document.body.append(outside);
        button.focus();
        foundation.handleBlockedChange(root, true);
        outside.focus();
        foundation.handleBlockedChange(root, false);
        expect(document.activeElement).toBe(outside);
    });

    it('焦点不在内容里时不移动焦点', () => {
        const { foundation, root } = setup();
        foundation.handleBlockedChange(root, true);
        expect(document.activeElement).toBe(document.body);
    });
});
