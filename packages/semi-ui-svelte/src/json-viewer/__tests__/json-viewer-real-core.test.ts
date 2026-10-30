import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './json-viewer-fixture.svelte';

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

describe('Svelte JsonViewer 与编辑器内核', () => {
    it('重新布局后没有匹配的 token 时，卸载旧 span 中的自定义内容', async () => {
        const matching = { value: true };
        const store = createStore<FixtureStore>({
            props: { value: '{"a": "k1"}', options: { readOnly: true, customRenderRule: [{ match: () => matching.value }] } },
            mode: 'custom-render',
            show: 'open',
        });
        render(Fixture, { props: { store } });
        flushSync();
        // b sits in the display: contents wrapper, which sits in the span the editor left for the token
        const span = (await screen.findAllByText('"k1"', { selector: 'b' }))[0].parentElement?.parentElement;
        matching.value = false;
        await fireEvent.scroll(document.querySelector('.json-viewer-container') as HTMLElement);
        expect(span).toBeEmptyDOMElement();
    });
});
