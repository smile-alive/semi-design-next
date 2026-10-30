import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import CollapseHost from './collapse-host.svelte';

describe('Svelte Collapse 服务端渲染', () => {
    it('首帧输出展开面板的标题与内容，aria-controls 指向内容 id', () => {
        const { body } = render(CollapseHost, { props: { store: createStore({ mode: 'one-way' as const, activeKey: ['2'], log: [] }) } });
        expect(body).toContain('This is panel header 1');
        expect(body).toContain('aria-expanded="true"');
        expect(body).toContain('Hi, bytedance dance dance.');
        const controls = /aria-controls="([^"]+)"/.exec(body)?.[1];
        expect(controls).toBeTruthy();
        expect(body).toContain(`id="${controls}"`);
    });

    it('首帧不渲染收起且无 keepDOM 的内容', () => {
        const { body } = render(CollapseHost, { props: { store: createStore({ log: [] }) } });
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('Hi, bytedance');
        expect(body).not.toContain('aria-controls');
    });
});
