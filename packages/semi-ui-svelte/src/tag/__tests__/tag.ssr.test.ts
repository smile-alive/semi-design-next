import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import GroupFixture from './group-fixture.svelte';
import SplitFixture from './split-fixture.svelte';
import TagFixture from './tag-fixture.svelte';

describe('Svelte Tag 服务端首帧', () => {
    it('可关闭标签首帧带按钮语义、类名、图标与关闭图标', () => {
        const store = createStore({ props: { closable: true, color: 'red' as const, size: 'large' as const, id: 'x' }, icons: true });
        const { body } = render(TagFixture, { props: { store } });
        expect(body).toContain('role="button"');
        expect(body).toContain('tabindex="0"');
        expect(body).toContain('semi-tag-red-light');
        expect(body).toContain('semi-tag-large');
        expect(body).toContain('semi-tag-closable');
        expect(body).toContain('semi-tag-content-ellipsis');
        expect(body).toContain('x-semi-prop="prefixIcon"');
        expect(body).toContain('semi-tag-close');
        expect(body).toMatch(/<div[^>]*id="x"/);
    });

    it('静态标签首帧没有角色与 tabindex，visible 为 false 时带隐藏类名', () => {
        const store = createStore({ props: { visible: false } });
        const { body } = render(TagFixture, { props: { store } });
        expect(body).not.toContain('role=');
        expect(body).not.toContain('tabindex');
        expect(body).toContain('semi-tag-invisible');
    });

    it('TagGroup 首帧渲染可见标签与 +N', () => {
        const store = createStore({ props: { tagList: [{ children: 'a' }, { children: 'b' }, { children: 'c' }], maxTagCount: 1 } });
        const { body } = render(GroupFixture, { props: { store } });
        expect(body).toContain('semi-tag-group-max');
        expect(body).toContain('>a<');
        expect(body).not.toContain('>b<');
        expect(body).toContain('+2');
    });

    it('SplitTagGroup 首帧带 group 角色与子标签', () => {
        const store = createStore({ count: 2 });
        const { body } = render(SplitFixture, { props: { store } });
        expect(body).toContain('role="group"');
        expect(body).toContain('semi-tag-split');
        expect(body.match(/class="semi-tag /g)).toHaveLength(2);
    });
});
