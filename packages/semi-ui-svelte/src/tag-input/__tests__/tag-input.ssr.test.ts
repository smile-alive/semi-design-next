import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import TagInputCase from './tag-input-case.svelte';

describe('Svelte TagInput 服务端首帧', () => {
    it('首帧带标签、输入框、分组角色与语言包名称，不含拖拽句柄', () => {
        const store = createStore({ props: { value: ['ssr-tag', 'b'], draggable: true, showClear: true, 'data-x': '1' } });
        const { body } = render(TagInputCase, { props: { store } });
        expect(body).toContain('ssr-tag');
        expect(body).toContain('role="group"');
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toMatch(/<input[^>]*aria-label="/);
        expect(body).toContain('semi-tagInput-clearBtn');
        expect(body).not.toContain('semi-tagInput-drag-handler');
    });

    it('首帧带受控文本、折叠的 +N 与 prefix', () => {
        const store = createStore({ props: { value: ['a', 'b', 'c'], maxTagCount: 1, inputValue: 'typed', showRestTagsPopover: false }, slots: { prefix: 'P' } });
        const { body } = render(TagInputCase, { props: { store } });
        expect(body).toContain('semi-tagInput-wrapper-n');
        expect(body).toContain('+2');
        expect(body).toContain('value="typed"');
        expect(body).toContain('semi-tagInput-prefix');
        expect(body).not.toContain('>b<');
    });

    it('首帧的 id 与 hydration 一致：insetLabel 的 id 来自 $props.id', () => {
        const store = createStore({ slots: { insetLabel: 'Tags' } });
        const { body } = render(TagInputCase, { props: { store } });
        expect(body).toMatch(/id="s\d+-inset-label"/);
        expect(body).toMatch(/aria-labelledby="s\d+-inset-label"/);
    });
});
