import { beforeEach, describe, expect, it, onTestFinished, vi, type Mock } from 'vite-plus/test';
import JsonViewerFoundation, { type JsonViewerAdapter, type JsonViewerBaseProps, type JsonViewerBaseState } from '@fibrae/semi-foundation/json-viewer/foundation';
import { JsonViewer } from '@fibrae/semi-json-viewer-core';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';

const value = '{"a": "k1", "b": "k2"}';

// jsdom has no Worker, blob URLs or idle callbacks: the fake worker only answers foldRange (the editor accepts edits
// once it has ranges) and background tokenization never runs
beforeEach(() => {
    vi.stubGlobal('requestIdleCallback', () => 1);
    vi.stubGlobal('cancelIdleCallback', () => {});
    vi.stubGlobal(
        'Worker',
        class {
            onmessage: ((event: { data: unknown }) => void) | null = null;
            postMessage({ messageId, method }: { messageId: number; method: string }) {
                if (method === 'foldRange') {
                    queueMicrotask(() => this.onmessage?.({ data: { messageId, result: [] } }));
                }
            }
            terminate() {}
        }
    );
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: () => 'blob:', revokeObjectURL() {} }));
});

const mount = async (props: Partial<JsonViewerBaseProps> = {}) => {
    const editor = document.createElement('div');
    editor.style.width = '400px';
    editor.style.height = '400px';
    document.body.appendChild(editor);
    const state: JsonViewerBaseState = {
        searchOptions: { caseSensitive: false, wholeWord: false, regex: false },
        showSearchBar: false,
    };
    const fullProps: JsonViewerBaseProps = { value, options: { autoWrap: true }, ...props };
    const adapter = {
        getProps: () => fullProps,
        getProp: (key: keyof JsonViewerBaseProps) => fullProps[key],
        getState: (key: keyof JsonViewerBaseState) => state[key],
        getStates: () => state,
        setState: (next: Partial<JsonViewerBaseState>) => Object.assign(state, next),
        getEditorRef: () => editor,
        notifyChange: vi.fn<JsonViewerAdapter['notifyChange']>(),
        toggleSearchOption: vi.fn<JsonViewerAdapter['toggleSearchOption']>(),
        toggleSearchBar: () => {
            state.showSearchBar = !state.showSearchBar;
        },
        setCustomRenderMap: vi.fn<JsonViewerAdapter['setCustomRenderMap']>(),
    } as unknown as JsonViewerAdapter;
    const foundation = new JsonViewerFoundation(adapter);
    foundation.init();
    const viewer = foundation.jsonViewer;
    if (!viewer) throw new Error('the editor was not created');
    await new Promise((resolve) => setTimeout(resolve));
    return { foundation, adapter, viewer, editor, getValue: () => viewer.getModel().getValue() };
};

const insertAtStart = (viewer: NonNullable<JsonViewerFoundation['jsonViewer']>, text: string) =>
    viewer.getModel().applyOperation({
        type: 'insert',
        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
        rangeOffset: 0,
        rangeLength: 0,
        oldText: '',
        newText: text,
    });

describe('JsonViewerFoundation', () => {
    it('没有匹配项时 replace 不抛错，内容不变', async () => {
        const { foundation, getValue } = await mount();
        foundation.search('no-such-text');
        expect(foundation.getSearchResults()).toEqual([]);
        expect(() => foundation.replace('x')).not.toThrow();
        expect(getValue()).toBe(value);
    });

    it('逐个替换完所有匹配后再替换不抛错', async () => {
        const { foundation, getValue } = await mount();
        foundation.search('k1');
        foundation.replace('z');
        expect(getValue()).toBe('{"a": "z", "b": "k2"}');
        expect(() => foundation.replace('z')).not.toThrow();
        expect(getValue()).toBe('{"a": "z", "b": "k2"}');
    });

    it('替换文本为空串时删除匹配', async () => {
        const { foundation, getValue } = await mount();
        foundation.search('k');
        foundation.replace('');
        expect(getValue()).toBe('{"a": "1", "b": "k2"}');
        foundation.search('k');
        foundation.replaceAll('');
        expect(getValue()).toBe('{"a": "1", "b": "2"}');
    });

    it('关闭搜索栏时清除搜索结果', async () => {
        const { foundation } = await mount();
        foundation.toggleSearchBar();
        foundation.search('k');
        expect(foundation.getSearchResults()).toHaveLength(2);
        foundation.toggleSearchBar();
        expect(foundation.getSearchResults()).toBeNull();
    });

    it('未打开搜索栏时用 search 搜索，编辑后同样重新搜索', async () => {
        const { foundation, viewer } = await mount();
        foundation.search('k');
        expect(foundation.getSearchResults()).toHaveLength(2);
        insertAtStart(viewer, ' ');
        expect(foundation.getSearchResults()?.[0].range.startColumn).toBe(9);
    });

    it('重建编辑器后按上一次的搜索重新搜索', async () => {
        const { foundation } = await mount();
        foundation.search('k');
        expect(foundation.getSearchResults()).toHaveLength(2);
        foundation.destroy();
        foundation.init();
        expect(foundation.getSearchResults()).toHaveLength(2);
    });

    it('搜索栏关闭后重建编辑器不再带出旧的搜索结果', async () => {
        const { foundation } = await mount();
        foundation.toggleSearchBar();
        foundation.search('k');
        foundation.toggleSearchBar();
        foundation.destroy();
        foundation.init();
        expect(foundation.getSearchResults()).toBeNull();
    });

    it('补全浮层按 combobox 模式暴露为 listbox，内容区指向当前选项', async () => {
        const { viewer, editor } = await mount({ value: '[{"class": 1}, {}]' });
        const model = viewer.getModel();
        model.lastChangeBufferPos = { lineNumber: 1, column: 18 };
        model.applyOperation({
            type: 'insert',
            range: { startLineNumber: 1, startColumn: 17, endLineNumber: 1, endColumn: 17 },
            rangeOffset: 16,
            rangeLength: 0,
            oldText: '',
            newText: 'c',
        });
        await vi.waitFor(() => expect(editor.querySelectorAll('[role="listbox"] > [role="option"]').length).toBeGreaterThan(0));
        const listbox = editor.querySelector('[role="listbox"]') as HTMLElement;
        const content = editor.querySelector('[role="textbox"]');
        const [first] = listbox.querySelectorAll('[role="option"]');
        expect(content).toHaveAttribute('aria-autocomplete', 'list');
        expect(content).toHaveAttribute('aria-controls', listbox.id);
        expect(first).toHaveAttribute('aria-selected', 'true');
        expect(content).toHaveAttribute('aria-activedescendant', first.id);
        model.applyOperation({
            type: 'insert',
            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
            rangeOffset: 0,
            rangeLength: 0,
            oldText: '',
            newText: '  ',
        });
        expect(content).not.toHaveAttribute('aria-activedescendant');
    });

    it('customRenderRule 的 render 无返回值时 token 保留原文', async () => {
        const { editor } = await mount({
            options: { readOnly: true, customRenderRule: [{ match: 'k1', render: () => undefined }] },
        });
        expect(editor).toHaveTextContent('"k1"');
    });

    it('customRenderRule 的 render 返回 false 时 token 保留原文', async () => {
        const { editor } = await mount({
            options: { readOnly: true, customRenderRule: [{ match: 'k1', render: () => false }] },
        });
        expect(editor).toHaveTextContent('"k1"');
    });

    it('布局从有匹配变为没有匹配时发出一次空映射，之后仍没有匹配时不再发出', async () => {
        let matching = true;
        const { adapter, viewer } = await mount({
            options: { readOnly: true, customRenderRule: [{ match: () => matching, render: () => 'custom' }] },
        });
        const setCustomRenderMap = adapter.setCustomRenderMap as Mock;
        expect(setCustomRenderMap.mock.lastCall?.[0].size).toBeGreaterThan(0);
        const calls = setCustomRenderMap.mock.calls.length;
        matching = false;
        viewer.layout();
        expect(setCustomRenderMap).toHaveBeenCalledTimes(calls + 1);
        expect(setCustomRenderMap.mock.lastCall?.[0].size).toBe(0);
        viewer.layout();
        viewer.layout();
        expect(setCustomRenderMap).toHaveBeenCalledTimes(calls + 1);
    });

    it('一开始就没有匹配的 token 时不发出 customRender', async () => {
        const { adapter, viewer } = await mount({
            options: { readOnly: true, customRenderRule: [{ match: 'none', render: () => 'custom' }] },
        });
        viewer.layout();
        expect(adapter.setCustomRenderMap).not.toHaveBeenCalled();
    });

    it('销毁编辑器时清空 customRender 映射', async () => {
        const { foundation, adapter } = await mount({
            options: { readOnly: true, customRenderRule: [{ match: 'k1', render: () => 'custom' }] },
        });
        expect((adapter.setCustomRenderMap as Mock).mock.lastCall?.[0].size).toBe(1);
        foundation.destroy();
        expect(adapter.setCustomRenderMap).toHaveBeenLastCalledWith(new Map());
    });

    describe('使用 ResizeObserver', () => {
        let resize: ReturnType<typeof mockResizeObserverCore>;
        beforeEach(() => {
            resize = mockResizeObserverCore();
            vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
                callback(0);
                return 1;
            });
        });

        it('高度变化时重新布局，不清除已测量的行高', async () => {
            const { viewer, editor } = await mount({ options: { autoWrap: false } });
            const layout = vi.spyOn(viewer, 'layout');
            const reset = vi.spyOn(viewer, 'resetMeasuredHeights');
            resize.fire(editor, [{ borderBoxSize: [{ inlineSize: 400, blockSize: 400.2 }] }]);
            expect(layout).not.toHaveBeenCalled();
            resize.fire(editor, [{ borderBoxSize: [{ inlineSize: 400, blockSize: 800 }] }]);
            expect(layout).toHaveBeenCalledTimes(1);
            resize.fire(editor, [{ borderBoxSize: [{ inlineSize: 200, blockSize: 800 }] }]);
            expect(layout).toHaveBeenCalledTimes(1);
            expect(reset).not.toHaveBeenCalled();
        });
    });
});

describe('JsonViewer 内核', () => {
    it('自定义前缀下悬停字符串值触发 hoverNode', async () => {
        const container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '400px';
        document.body.appendChild(container);
        const viewer = new JsonViewer(container, value, { readOnly: true, prefixCls: 'my-json-viewer' });
        onTestFinished(() => viewer.dispose());
        viewer.layout();
        const onHover = vi.fn<(event: unknown) => void>();
        viewer.emitter.on('hoverNode', onHover);
        const span = container.querySelector('.my-json-viewer-string-value');
        if (!span) throw new Error('no string value was rendered');

        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        span.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
        vi.advanceTimersByTime(700);
        expect(onHover).toHaveBeenCalledExactlyOnceWith({ value: span.textContent, target: span });
    });
});
