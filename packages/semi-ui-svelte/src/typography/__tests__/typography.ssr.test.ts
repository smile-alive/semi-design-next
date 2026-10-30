import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './typography-fixture.svelte';

// without the hydration markers, which are not part of what a reader sees
const html = (store: { kind?: 'text' | 'title' | 'paragraph' | 'numeral'; text?: string; props?: Record<string, unknown> }) => render(Fixture, { props: { store: createStore(store) } }).body.replace(/<!--.*?-->/g, '');

describe('Svelte Typography 服务端首帧', () => {
    it('Text、Title、Paragraph 首帧有标签、类名与文本', () => {
        expect(html({ text: 'Semi' })).toMatch(/<span class="semi-typography semi-typography-primary semi-typography-normal[^"]*"[^>]*>Semi<\/span>/);
        expect(html({ kind: 'title', text: 'Semi', props: { heading: 2 } })).toMatch(/<h2 class="[^"]*semi-typography-h2[^"]*"[^>]*>Semi<\/h2>/);
        expect(html({ kind: 'paragraph', text: 'Semi' })).toMatch(/<p class="[^"]*semi-typography-paragraph[^"]*"[^>]*>Semi<\/p>/);
    });

    it('装饰标签与 link 首帧已包裹文本', () => {
        const body = html({ text: 'Semi', props: { strong: true, link: { href: 'https://semi.design' } } });
        expect(body).toMatch(/<a href="https:\/\/semi\.design"><strong><span class="semi-typography-link-text">Semi<\/span><\/strong><\/a>/);
    });

    it('CSS 省略首帧带省略类名与完整文本', () => {
        const body = html({ kind: 'paragraph', text: 'abcdefghijklmnopqrstuvwxyz', props: { ellipsis: true } });
        expect(body).toContain('semi-typography-ellipsis-overflow-ellipsis');
        expect(body).toContain('abcdefghijklmnopqrstuvwxyz');
        expect(body).not.toContain('semi-typography-ellipsis-expand');
    });

    it('可展开的省略首帧显示完整文本与展开按钮，未截断前不隐藏内容', () => {
        const body = html({ kind: 'paragraph', text: 'abcdefghijklmnopqrstuvwxyz', props: { ellipsis: { expandable: true } } });
        expect(body).toMatch(/<button[^>]*class="semi-typography-ellipsis-expand"[^>]*>展开<\/button>/);
        expect(body).toContain('abcdefghijklmnopqrstuvwxyz');
        expect(body).not.toContain('hidden');
    });

    it('copyable 首帧渲染复制按钮', () => {
        const body = html({ text: 'Semi', props: { copyable: true } });
        expect(body).toContain('semi-typography-action-copy');
        expect(body).toMatch(/<button[^>]*aria-label="复制"/);
    });

    it('Numeral 首帧是未格式化的原文，挂载后才格式化', () => {
        const body = html({ kind: 'numeral', text: '1992.1536', props: { rule: 'percentages', precision: 2 } });
        expect(body).toContain('1992.1536');
        expect(body).not.toContain('%');
    });
});
