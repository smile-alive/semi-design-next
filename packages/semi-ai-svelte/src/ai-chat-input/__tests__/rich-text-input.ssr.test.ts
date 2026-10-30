import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import RichTextHost from './rich-text-host.svelte';

describe('RichTextInput 服务端首帧', () => {
    it('只输出编辑器容器，编辑器在客户端挂载后创建', () => {
        const store = createStore<{ id: string; log: string[] }>({ id: 'editor', log: [] });
        const { body } = render(RichTextHost, { props: { store } });
        expect(body).toMatch(/<div class="semi-aiChatInput-editor-content"><\/div>/);
        expect(body).not.toContain('ProseMirror');
        expect(store.log).toEqual([]);
    });
});
