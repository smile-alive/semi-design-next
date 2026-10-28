import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import JsonViewer from '../index';

// The real editor core, unlike json-viewer.test.tsx. jsdom has no Worker, blob URLs or idle callbacks: the fake worker
// leaves every request unanswered, and background tokenization never runs
beforeEach(() => {
    vi.stubGlobal('requestIdleCallback', () => 1);
    vi.stubGlobal('cancelIdleCallback', () => {});
    vi.stubGlobal(
        'Worker',
        class {
            onmessage = null;
            postMessage() {}
            terminate() {}
        }
    );
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: () => 'blob:', revokeObjectURL() {} }));
});

describe('JsonViewer 与编辑器内核', () => {
    it('customRenderRule 的 render 无返回值时 token 保留原文', () => {
        const { container } = render(<JsonViewer value='{"a": "k1"}' options={{ readOnly: true, customRenderRule: [{ match: 'k1', render: () => undefined }] }} />);
        expect(container).toHaveTextContent('"k1"');
    });

    it('customRenderRule 的 render 返回 false 时 token 保留原文', () => {
        const show = false;
        const { container } = render(<JsonViewer value='{"a": "k1"}' options={{ readOnly: true, customRenderRule: [{ match: 'k1', render: () => show && <b>custom</b> }] }} />);
        expect(container).toHaveTextContent('"k1"');
    });

    it('重新布局后没有匹配的 token 时，卸载旧 span 中的自定义内容', () => {
        let matching = true;
        render(<JsonViewer value='{"a": "k1"}' options={{ readOnly: true, customRenderRule: [{ match: () => matching, render: () => <b>custom</b> }] }} />);
        const span = screen.getAllByText('custom')[0].parentElement;
        matching = false;
        fireEvent.scroll(document.querySelector('.json-viewer-container'));
        expect(span).toBeEmptyDOMElement();
    });

    it('浏览器没有 requestIdleCallback（Safari）时照常渲染，后台分词改由计时器调度', async () => {
        vi.stubGlobal('requestIdleCallback', undefined);
        vi.stubGlobal('cancelIdleCallback', undefined);
        const timer = vi.spyOn(globalThis, 'setTimeout');
        const { container } = render(<JsonViewer value='{"a": "k1"}' options={{ readOnly: true }} />);
        expect(container).toHaveTextContent('"k1"');
        await vi.waitFor(() => expect(timer).toHaveBeenCalled());
    });
});
