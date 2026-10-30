import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './json-viewer-fixture.svelte';

function html(props: FixtureStore['props'], init: Partial<Omit<FixtureStore, 'props'>> = {}) {
    const store = createStore<FixtureStore>({ props, mode: 'plain', show: 'open', ...init });
    return render(Fixture, { props: { store } }).body;
}

describe('Svelte JsonViewer 服务端首帧', () => {
    it('首帧带尺寸、编辑器容器与搜索按钮，编辑器内核不在服务端创建', () => {
        const body = html({ value: '{"a":1}', width: 300, height: 200 });
        expect(body).toMatch(/<div[^>]*style="width: 300px; height: 200px; position: relative"/);
        expect(body).toContain('semi-json-viewer semi-json-viewer-background');
        expect(body).toContain('semi-json-viewer-search-bar-trigger');
        expect(body).toContain(`aria-label="${zh_CN.JsonViewer.search}"`);
        expect(body).not.toContain('<search');
    });

    it('showSearch 为 false 时首帧没有搜索按钮，带名称的根节点是 group', () => {
        const body = html({ showSearch: false, 'aria-label': 'json' });
        expect(body).not.toContain('semi-json-viewer-search-bar-trigger');
        expect(body).toMatch(/<div[^>]*role="group"/);
    });

    it('自定义搜索按钮 snippet 在首帧输出，defaultButton 画出默认按钮', () => {
        const body = html({}, { mode: 'default-button' });
        expect(body).toContain('semi-json-viewer-search-bar-trigger');
    });
});
