import { fireEvent, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import JsonViewer from '..';

// The real editor core, unlike json-viewer.test.ts. jsdom has no Worker, blob URLs or idle callbacks: the fake worker
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
    it('重新布局后没有匹配的 token 时，卸载旧 span 中的自定义内容', async () => {
        let matching = true;
        render(JsonViewer, {
            props: {
                modelValue: '{"a": "k1"}',
                options: { readOnly: true, customRenderRule: [{ match: () => matching }] },
            },
            slots: { customRender: '<b>custom</b>' },
        });
        const span = (await screen.findAllByText('custom'))[0].parentElement;
        matching = false;
        await fireEvent.scroll(document.querySelector('.json-viewer-container') as HTMLElement);
        expect(span).toBeEmptyDOMElement();
    });
});
