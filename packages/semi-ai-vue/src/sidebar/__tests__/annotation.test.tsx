/** @jsxImportSource vue */
import type { VNode } from 'vue';
import { createEvent, fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import { render } from '@test/utils/vue';
import Annotation, { type AnnotationEmits, type AnnotationInfo, type AnnotationItem } from '../annotation';
import AnnotationModel from './fixtures/annotation-model.vue';

type Emit<K extends keyof AnnotationEmits> = (...args: AnnotationEmits[K]) => void;

const textItem: AnnotationItem = {
    type: 'text',
    title: 'Text title',
    url: 'https://semi.design/text',
    detail: 'Text detail',
    logo: 'https://semi.design/logo.png',
    siteName: 'Semi',
    order: 1,
};
const videoItem: AnnotationItem = {
    type: 'video',
    title: 'Video title',
    url: 'https://semi.design/video',
    img: 'https://semi.design/cover.png',
    logo: 'https://semi.design/logo.png',
    siteName: 'Video site',
    duration: 3725,
    order: 2,
};
const info: AnnotationInfo[] = [
    { header: 'Group 1', key: '1', annotations: [textItem, videoItem] },
    { header: 'Group 2', key: '2', annotations: [{ title: 'Hidden', detail: 'hidden detail' }] },
];

const sidebarContainer = (container: Element) => container.querySelector<HTMLElement>('.semi-sidebar-container');

// jsdom does not navigate, so the default is cancelled up front to keep it from logging
const click = (el: Element | null) => {
    const event = createEvent.click(el as Element);
    event.preventDefault();
    return fireEvent(el as Element, event);
};

describe('Annotation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('渲染在容器中，带有语言包标题和 annotation 类名', () => {
        const { container } = render(Annotation, {
            props: { info, visible: true },
            attrs: { class: 'custom', style: { color: 'red' } },
        });
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-annotation', 'custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root?.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent(zh_CN.Sidebar.annotationTitle);
        expect(screen.getByText('Group 1')).toBeInTheDocument();
        expect(screen.getByText('Group 2')).toBeInTheDocument();
        expect(container.querySelectorAll('.semi-icon-book_open_stroked')).toHaveLength(2);
    });

    it('标题跟随语言包', () => {
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Annotation info={info} visible /> },
        });
        expect(ja_JP.Sidebar.annotationTitle).not.toBe(zh_CN.Sidebar.annotationTitle);
        expect(screen.getByText(ja_JP.Sidebar.annotationTitle)).toBeInTheDocument();
    });

    it('title 属性替换语言包标题，#title 插槽优先', () => {
        const { container } = render(Annotation, { props: { title: 'Sources', info, visible: true } });
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Sources');
        const slotted = render(Annotation, {
            props: { title: 'Sources', info, visible: true },
            slots: { title: () => <em>Slot sources</em> },
        });
        expect(slotted.container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Slot sources');
    });

    it('渲染当前激活面板中的文本和视频项', () => {
        const { container } = render(Annotation, { props: { activeKey: ['1'], info, visible: true } });
        const text = container.querySelector('.semi-sidebar-annotation-item-text');
        expect(text).toHaveTextContent('Text title');
        expect(text?.querySelector('.semi-sidebar-annotation-item-text-detail')).toHaveTextContent('Text detail');
        expect(text?.querySelector('.semi-sidebar-annotation-item-footer-logo')).toHaveAttribute('src', textItem.logo);
        expect(text?.querySelector('.semi-sidebar-annotation-item-footer-text')).toHaveTextContent('Semi');
        expect(text?.querySelector('.semi-sidebar-annotation-item-footer-order')).toHaveTextContent('1');

        const video = container.querySelector('.semi-sidebar-annotation-item-video');
        expect(video?.querySelector('.semi-sidebar-annotation-item-video-img')).toHaveAttribute('src', videoItem.img);
        expect(video?.querySelector('.semi-sidebar-annotation-item-video-duration')).toHaveTextContent('1:02:05');
        expect(video?.querySelector('.semi-sidebar-annotation-item-footer-text')).toHaveTextContent('Video site');
        expect(screen.queryByText('Hidden')).toBeNull();
    });

    it('文本项没有 logo、站点名或序号时不渲染这些内容', () => {
        const { container } = render(Annotation, {
            props: {
                activeKey: ['1'],
                info: [{ header: 'h', key: '1', annotations: [{ title: 't' }] }],
                visible: true,
            },
        });
        expect(container.querySelector('.semi-sidebar-annotation-item-footer')).toBeEmptyDOMElement();
    });

    it('带 url 的项是链接，在新窗口打开且不携带 opener 和 referrer', () => {
        render(Annotation, { props: { activeKey: ['1'], info, visible: true } });
        const links: [AnnotationItem, RegExp][] = [
            [textItem, /Text title/],
            [videoItem, /Video title/],
        ];
        for (const [item, name] of links) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveAttribute('href', item.url);
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
    });

    it('点击项时跟随其链接，并以事件和该项发出一次 click', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<Emit<'click'>>();
        const { container } = render(Annotation, { props: { activeKey: ['1'], info, visible: true, onClick } });
        await click(container.querySelector('.semi-sidebar-annotation-item-text'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click' }), textItem);

        await click(container.querySelector('.semi-sidebar-annotation-item-video'));
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), videoItem);
        expect(open).not.toHaveBeenCalled();
    });

    it('click 遮住根上的原生 click：点在项之外不发出', async () => {
        const onClick = vi.fn<Emit<'click'>>();
        const { container } = render(Annotation, { props: { activeKey: ['1'], info, visible: true, onClick } });
        await fireEvent.click(sidebarContainer(container) as Element);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('没有 url 的项只发出 click', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<Emit<'click'>>();
        render(Annotation, {
            props: {
                activeKey: ['1'],
                info: [{ header: 'h', key: '1', annotations: [{ title: 'No url' }] }],
                visible: true,
                onClick,
            },
        });
        await fireEvent.click(screen.getByText('No url'));
        expect(open).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledWith(expect.anything(), { title: 'No url' });
    });

    it('#item 替换内置项，参数为条目和组内索引', () => {
        const item = vi.fn<(props: { item: AnnotationItem; index: number }) => VNode>(({ item }) => <div class="my-item">{item.title}</div>);
        const { container } = render(Annotation, {
            props: { activeKey: ['1'], info, visible: true },
            slots: { item },
        });
        expect([...container.querySelectorAll('.my-item')].map((node) => node.textContent)).toEqual(['Text title', 'Video title']);
        expect(item).toHaveBeenCalledWith({ item: textItem, index: 0 });
        expect(item).toHaveBeenCalledWith({ item: videoItem, index: 1 });
        expect(container.querySelector('.semi-sidebar-annotation-item')).toBeNull();
    });

    it('#infoHeader 替换分组标题，图标保留', () => {
        const { container } = render(Annotation, {
            props: { info, visible: true },
            slots: {
                infoHeader: ({ item, index }: { item: AnnotationInfo; index: number }) => <b>{`${index}:${item.header}`}</b>,
            },
        });
        expect([...container.querySelectorAll('.semi-sidebar-collapse-header-content b')].map((n) => n.textContent)).toEqual(['0:Group 1', '1:Group 2']);
        expect(container.querySelectorAll('.semi-icon-book_open_stroked')).toHaveLength(2);
    });

    it('#header 替换容器头部', () => {
        const { container } = render(Annotation, {
            props: { info, visible: true },
            slots: { header: () => <div class="my-header">h</div> },
        });
        expect(container.querySelector('.my-header')).toBeInTheDocument();
        expect(container.querySelector('.semi-sidebar-container-header')).toBeNull();
    });

    it('change 与 update:activeKey 报告通过箭头切换的面板', async () => {
        const onChange = vi.fn<Emit<'change'>>();
        const onUpdate = vi.fn<Emit<'update:activeKey'>>();
        const { container } = render(Annotation, {
            props: { activeKey: [], info, visible: true, onChange, 'onUpdate:activeKey': onUpdate },
        });
        await fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[1]);
        expect(onChange).toHaveBeenCalledWith(['2']);
        expect(onUpdate).toHaveBeenCalledWith(['2']);
    });

    it('v-model:activeKey 展开点击的面板', async () => {
        const { container } = render(AnnotationModel);
        expect(screen.queryByText('Hidden')).toBeNull();
        await fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[1]);
        expect(await screen.findByText('Hidden')).toBeInTheDocument();
    });

    it('容器属性透传：cancel 和 resizable', async () => {
        const onCancel = vi.fn<Emit<'cancel'>>();
        const { container } = render(Annotation, {
            props: { info, resizable: false, visible: true, onCancel },
        });
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
    });

    it('AnnotationContent 不带容器也能渲染', () => {
        const { container } = render(Annotation.AnnotationContent, {
            props: { activeKey: ['1'], info },
            attrs: { class: 'c' },
        });
        expect(container.querySelector('.semi-sidebar-container')).toBeNull();
        expect(container.querySelector('.semi-sidebar-collapse')).toHaveClass('c');
        expect(screen.getByText('Text title')).toBeInTheDocument();
    });

    it('条目的 logo 与封面是装饰图片，链接名称里标题只出现一次', () => {
        render(Annotation.AnnotationContent, { props: { activeKey: ['1'], info } });
        for (const link of screen.getAllByRole('link')) {
            expect(link.querySelectorAll('img')).not.toHaveLength(0);
            for (const img of link.querySelectorAll('img')) {
                expect(img).toHaveAttribute('alt', '');
            }
        }
        expect(screen.getByRole('link', { name: /Video title/ })).not.toHaveAccessibleName(/Video title.*Video title/);
        expect(screen.getByRole('link', { name: /Text title/ })).not.toHaveAccessibleName(/Text title.*Text title/);
    });

    it('视频条目没有 logo 时不渲染 logo 图片', () => {
        const { container } = render(Annotation.AnnotationContent, {
            props: {
                activeKey: ['1'],
                info: [
                    {
                        header: 'h',
                        key: '1',
                        annotations: [{ type: 'video', title: 'Video title', url: 'https://semi.design/video' }],
                    },
                ],
            },
        });
        expect(container.querySelector('img')).toBeNull();
    });
});
