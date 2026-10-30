import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ImageProps, PreviewProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import { srcList } from './helpers';
import ImageFixture from './image-fixture.svelte';

function renderGroup(props: PreviewProps = {}) {
    const store = createStore<{ props: PreviewProps; images: ImageProps[]; snippets: string[] }>({ props: { src: srcList, ...props }, images: srcList.map((src) => ({ src })), snippets: [] });
    return render(GroupFixture, { props: { store } }).body;
}

describe('Svelte Image 服务端首帧', () => {
    it('缩略图输出 src 与根节点，预览不在服务端输出', () => {
        const store = createStore<{ props: ImageProps; snippets: string[] }>({ props: { src: srcList[0], width: 120, preview: { visible: true } }, snippets: [] });
        const { body } = render(ImageFixture, { props: { store } });
        expect(body).toContain(`src="${srcList[0]}"`);
        expect(body).toContain('semi-image-img');
        expect(body).not.toContain('semi-image-preview');
    });

    it('分组中默认打开的预览在服务端不输出：Portal 挂载后才渲染，不访问 document', () => {
        const body = renderGroup({ visible: true });
        expect(body).toContain('semi-image-preview-group');
        expect(body).not.toContain('semi-image-preview-header');
        expect(body).not.toContain('semi-portal');
    });

    it('分组 lazyLoad 时缩略图不输出 src，data-src 保留，等观察到相交后才加载', () => {
        const body = renderGroup({ lazyLoad: true });
        // the leading space tells `src` from `data-src`
        expect(body).not.toContain(` src="${srcList[0]}"`);
        expect(body).toContain(`data-src="${srcList[0]}"`);
    });
});
