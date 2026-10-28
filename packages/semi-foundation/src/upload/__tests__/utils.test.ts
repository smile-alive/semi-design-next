import { afterEach, describe, expect, it } from 'vite-plus/test';
import { ListFocusTracker, containsName } from '../utils';

function setup() {
    document.body.innerHTML = `
        <div id="list">
            <div class="card"><button id="a">a</button></div>
            <div class="card"><button id="b">b</button></div>
        </div>
        <div id="add" tabindex="0">add</div>`;
    const list = document.getElementById('list') as HTMLElement;
    return { list, add: document.getElementById('add') as HTMLElement, a: document.getElementById('a') as HTMLElement, b: document.getElementById('b') as HTMLElement };
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('ListFocusTracker', () => {
    it('焦点所在控件被移除后，把焦点交给原位置的卡片', () => {
        const { list, a, b } = setup();
        const tracker = new ListFocusTracker();
        a.focus();
        tracker.track(a, list.children);
        a.closest('.card')?.remove();
        tracker.restore(list.children, null);
        expect(document.activeElement).toBe(b);
    });

    it('没有剩余卡片时交给添加区域', () => {
        const { list, add, a, b } = setup();
        const tracker = new ListFocusTracker();
        b.closest('.card')?.remove();
        a.focus();
        tracker.track(a, list.children);
        a.closest('.card')?.remove();
        tracker.restore(list.children, add);
        expect(document.activeElement).toBe(add);
    });

    it('控件仍在文档中时不改动焦点', () => {
        const { list, a } = setup();
        const tracker = new ListFocusTracker();
        a.focus();
        tracker.track(a, list.children);
        tracker.restore(list.children, null);
        expect(document.activeElement).toBe(a);
    });

    it('焦点自行离开后不再接管', async () => {
        const { list, add, a } = setup();
        const tracker = new ListFocusTracker();
        a.focus();
        tracker.track(a, list.children);
        tracker.untrack(a);
        await Promise.resolve();
        a.closest('.card')?.remove();
        tracker.restore(list.children, add);
        expect(document.activeElement).toBe(document.body);
    });

    it('焦点控件在微任务前已被移除时仍然接管', async () => {
        const { list, a, b } = setup();
        const tracker = new ListFocusTracker();
        a.focus();
        tracker.track(a, list.children);
        tracker.untrack(a);
        a.closest('.card')?.remove();
        await Promise.resolve();
        tracker.restore(list.children, null);
        expect(document.activeElement).toBe(b);
    });
});

describe('containsName', () => {
    it.each([
        ['<span> text </span>', true],
        ['<span aria-label="x"></span>', true],
        ['<span aria-labelledby="x"></span>', true],
        ['<img alt="x">', true],
        ['<span>   </span>', false],
        ['<svg></svg>', false],
    ])('%s -> %s', (html, expected) => {
        const node = document.createElement('div');
        node.innerHTML = html;
        expect(containsName(node)).toBe(expected);
    });
});
