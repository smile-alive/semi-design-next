import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import GuideFixture from './guide-fixture.svelte';

const store = { visible: true, accept: true, log: [], steps: [{ title: 'Title A' }], rich: false, covers: 'none' as const, texts: false, props: {} };

describe('Svelte UserGuide 服务端渲染', () => {
    it('popup 模式首帧不输出卡片与聚光区域，不抛错：目标要挂载后才测得到', () => {
        const { body } = render(GuideFixture, { props: { store } });
        expect(body).not.toContain('semi-userGuide');
        expect(body).not.toContain('Title A');
    });

    it('modal 模式首帧不输出对话框：Portal 挂载后才渲染', () => {
        const { body } = render(GuideFixture, { props: { store: { ...store, props: { mode: 'modal' as const } } } });
        expect(body).not.toContain('semi-userGuide');
        expect(body).not.toContain('Title A');
    });
});
