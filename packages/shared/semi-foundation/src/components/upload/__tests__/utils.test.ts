import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defined } from '@test/utils/function';
import { ListFocusTracker, containsName, isUploadFailed, isUploadProgressVisible, removeUnlessPrevented } from '../utils';

describe('isUploadFailed', () => {
    it.each([
        ['uploadFail', true],
        ['validateFail', true],
        ['success', false],
        ['uploading', false],
        [undefined, false],
    ])('status %s 时为 %s', (status, failed) => {
        expect(isUploadFailed(status)).toBe(failed);
    });
});

describe('isUploadProgressVisible', () => {
    it.each([
        [50, 'uploading', true],
        [0, 'uploading', true],
        [100, 'uploading', false],
        [undefined, 'uploading', false],
        [50, 'success', false],
        [50, undefined, false],
    ])('percent %s、status %s 时为 %s', (percent, status, visible) => {
        expect(isUploadProgressVisible({ percent, status })).toBe(visible);
    });
});

function setup() {
    document.body.innerHTML = `
        <div id="list">
            <div class="card"><button id="a">a</button></div>
            <div class="card"><button id="b">b</button></div>
        </div>
        <div id="add" tabindex="0">add</div>`;
    const list = defined(document.getElementById('list'));
    return { list, add: defined(document.getElementById('add')), a: defined(document.getElementById('a')), b: defined(document.getElementById('b')) };
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

describe('removeUnlessPrevented', () => {
    it.each<[string, () => unknown, boolean]>([
        ['undefined', () => undefined, true],
        ['true', () => true, true],
        ['false', () => false, false],
        ['resolve(true)', () => Promise.resolve(true), true],
        ['resolve(false)', () => Promise.resolve(false), false],
        ['reject', () => Promise.reject(new Error('no')), false],
    ])('beforeRemove 返回 %s 时删除为 %s', async (_, result, removed) => {
        const remove = vi.fn<() => void>();
        removeUnlessPrevented(result(), remove);
        expect(remove).not.toHaveBeenCalled();
        await new Promise((resolve) => setTimeout(resolve));
        expect(remove).toHaveBeenCalledTimes(removed ? 1 : 0);
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
