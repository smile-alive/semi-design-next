import { type AppContext, createApp, shallowRef } from 'vue';
import { waitFor } from '@testing-library/vue';
import type { Editor } from '@tiptap/vue-3';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useEditorAppContext from '../editor-app-context';
import EditorHost from './fixtures/editor-host.vue';

async function probeIds(isolate: boolean) {
    const view = render(EditorHost, { props: { isolate } });
    await waitFor(() => expect(view.container.querySelectorAll('[data-probe]')).toHaveLength(5));
    return [...view.container.querySelectorAll('[data-probe]')];
}

describe('useEditorAppContext', () => {
    it('每次读取 appContext 得到新的 idPrefix，provides 原样传递，置空后读回 null', () => {
        const editor = { appContext: null } as unknown as Editor;
        useEditorAppContext(shallowRef(editor));
        const context = createApp({})._context;
        context.config.idPrefix = 'app';
        // The dev build warns when compilerOptions is read; the copied config must not touch it
        const compilerOptions = vi.fn<() => object>(() => ({}));
        Object.defineProperty(context.config, 'compilerOptions', { get: compilerOptions, configurable: true });
        editor.appContext = context;
        const first = editor.appContext;
        const second = editor.appContext;
        expect(compilerOptions).not.toHaveBeenCalled();
        expect(first?.config.globalProperties).toBe(context.config.globalProperties);
        expect(first?.config.idPrefix).toMatch(/^app-/);
        expect(second?.config.idPrefix).toMatch(/^app-/);
        expect(first?.config.idPrefix).not.toBe(second?.config.idPrefix);
        expect(first?.provides).toBe(context.provides);
        expect(context.config.idPrefix).toBe('app');
        editor.appContext = null;
        expect(editor.appContext as AppContext | null).toBeNull();
    });

    it('两个编辑器的节点视图 id 互不重复，且读到 EditorContent 外层的 provide', async () => {
        const probes = await probeIds(true);
        const ids = probes.map((probe) => probe.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(probes.slice(1).map((probe) => probe.textContent)).toEqual(Array(4).fill('from host'));
    });

    // Documents why the accessor exists; once tiptap scopes node view roots itself this fails and the helper can go
    it('不处理时节点视图沿用 app 的 idPrefix，id 与宿主重复', async () => {
        const ids = (await probeIds(false)).map((probe) => probe.id);
        expect(new Set(ids).size).toBeLessThan(ids.length);
    });
});
