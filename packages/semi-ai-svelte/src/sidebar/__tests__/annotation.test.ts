import { createRawSnippet } from 'svelte';
import { createEvent, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import type { AnnotationInfo, AnnotationProps } from '../annotation/interface';
import { Annotation } from '../index';
import BindHost, { type BindHostStore } from './bind-host.svelte';
import LocaleHost from './locale-host.svelte';

const prefix = 'semi-sidebar-annotation';
const info: AnnotationInfo[] = [
    {
        header: '分组一',
        key: 'g1',
        annotations: [
            { type: 'text', title: '文章', detail: '摘要', url: 'https://example.com/a', siteName: '站点', logo: 'https://example.com/logo.png', order: 1 },
            { type: 'video', title: '视频', url: 'https://example.com/v', img: 'https://example.com/v.png', duration: 65, siteName: '视频站', order: 2 },
        ],
    },
    { header: '分组二', key: 'g2', annotations: [{ title: '另一篇', url: 'https://example.com/b' }] },
];
const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const items = () => [...document.querySelectorAll<HTMLAnchorElement>(`.${prefix}-item`)];

function setup(props: AnnotationProps = {}) {
    return render(Annotation, { props: { visible: true, motion: false, info, ...props } });
}

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
    document.body.innerHTML = '';
});

describe('Svelte Annotation', () => {
    it('渲染默认标题与分组标题，容器带 annotation 类', () => {
        setup();
        expect($('.semi-sidebar-container')).toHaveClass(prefix);
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent(zh_CN.Sidebar.annotationTitle);
        expect(screen.getByText('分组一')).toBeInTheDocument();
        expect(screen.getByText('分组二')).toBeInTheDocument();
    });

    it('title 覆盖默认标题', () => {
        setup({ title: '引用' });
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent('引用');
    });

    it('展开分组后显示文本与视频引用，链接新开页且带 rel', async () => {
        setup({ activeKey: ['g1'] });
        const [text, video] = items();
        expect(text).toHaveAttribute('href', 'https://example.com/a');
        expect(text).toHaveAttribute('target', '_blank');
        expect(text).toHaveAttribute('rel', 'noopener noreferrer');
        expect(text).toHaveClass(`${prefix}-item-text`);
        expect(text).toHaveTextContent('摘要');
        expect(text).toHaveTextContent('站点');
        expect(video).toHaveClass(`${prefix}-item-video`);
        expect(video).toHaveTextContent('1:05');
        expect(video).toHaveTextContent('视频站');
        expect(video.querySelector('img')).toHaveAttribute('src', 'https://example.com/v.png');
    });

    it('onClick 收到事件与被点击的引用', async () => {
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        setup({ activeKey: ['g1'], onClick });
        const [text] = items();
        text.addEventListener('click', (event) => event.preventDefault());
        await fireEvent.click(text);
        expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent), info[0].annotations[0]);
    });

    it('点击分组头展开，onChange 与 bind:activeKey 同步', async () => {
        const store = createStore<BindHostStore>({ kind: 'annotation', visible: true, annotationKey: [], info, log: [] });
        render(BindHost, { props: { store } });
        expect(items()).toHaveLength(0);
        await fireEvent.click(screen.getByText('分组一'));
        expect(store.annotationKey).toContain('g1');
        expect(items()).toHaveLength(2);
    });

    it('点击分组头触发 onChange', async () => {
        const onChange = vi.fn<NonNullable<AnnotationProps['onChange']>>();
        setup({ onChange });
        await fireEvent.click(screen.getByText('分组二'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('infoHeader 与 item snippet 取代默认渲染', () => {
        setup({
            activeKey: ['g2'],
            infoHeader: createRawSnippet<[{ item: AnnotationInfo }]>((args) => ({ render: () => `<b class="gh">${args().item.header}!</b>` })),
            item: createRawSnippet<[{ item: { title?: string } }]>((args) => ({ render: () => `<i class="it">${args().item.title}</i>` })),
        });
        expect(document.querySelectorAll('.gh')).toHaveLength(2);
        expect($('.it')).toHaveTextContent('另一篇');
        expect(items()).toHaveLength(0);
    });

    it('Annotation.AnnotationContent 可单独使用', () => {
        render(Annotation.AnnotationContent, { props: { info, activeKey: ['g2'] } });
        expect(screen.getByText('分组一')).toBeInTheDocument();
        expect(items()).toHaveLength(1);
    });

    it('全局默认值生效', () => {
        semiGlobal.config.overrideDefaultProps = { Annotation: { title: '全局引用' } };
        setup();
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent('全局引用');
    });

    it('默认标题随语言包变化', () => {
        render(LocaleHost, { props: { locale: ja_JP, kind: 'annotation' } });
        expect($('.semi-sidebar-container-header-title')).toHaveTextContent(ja_JP.Sidebar.annotationTitle);
    });

    // jsdom does not navigate, so the default is cancelled up front to keep it from logging
    const click = (element: Element | null) => {
        const event = createEvent.click(element as Element);
        event.preventDefault();
        return fireEvent(element as Element, event);
    };

    it('class 与 style 落在容器上，分组带书本图标', () => {
        setup({ class: 'custom', style: 'color: red' });
        expect($('.semi-sidebar-container')).toHaveClass(prefix, 'custom');
        expect($('.semi-sidebar-container')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelectorAll('.semi-icon-book_open_stroked')).toHaveLength(2);
    });

    it('渲染当前激活面板中的文本和视频项，未激活的分组内容不渲染', () => {
        setup({ activeKey: ['g1'] });
        const [textItem, videoItem] = items();
        expect(textItem.querySelector(`.${prefix}-item-text-detail`)).toHaveTextContent('摘要');
        expect(textItem.querySelector(`.${prefix}-item-footer-logo`)).toHaveAttribute('src', 'https://example.com/logo.png');
        expect(textItem.querySelector(`.${prefix}-item-footer-text`)).toHaveTextContent('站点');
        expect(textItem.querySelector(`.${prefix}-item-footer-order`)).toHaveTextContent('1');
        expect(videoItem.querySelector(`.${prefix}-item-video-img`)).toHaveAttribute('src', 'https://example.com/v.png');
        expect(videoItem.querySelector(`.${prefix}-item-footer-text`)).toHaveTextContent('视频站');
        expect(screen.queryByText('另一篇')).toBeNull();
    });

    it('视频时长超过一小时时带小时位', () => {
        setup({ activeKey: ['g'], info: [{ header: 'h', key: 'g', annotations: [{ type: 'video', title: 'v', url: 'https://example.com/v', duration: 3725 }] }] });
        expect($(`.${prefix}-item-video-duration`)).toHaveTextContent('1:02:05');
    });

    it('文本项没有 logo、站点名或序号时页脚为空', () => {
        setup({ activeKey: ['g'], info: [{ header: 'h', key: 'g', annotations: [{ title: 't' }] }] });
        expect($(`.${prefix}-item-footer`)?.children).toHaveLength(0);
    });

    it('带 url 的项是链接，在新窗口打开且不携带 opener 和 referrer', () => {
        setup({ activeKey: ['g1'] });
        for (const [item, name] of [
            [info[0].annotations[0], /文章/],
            [info[0].annotations[1], /视频/],
        ] as const) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveAttribute('href', item.url);
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
    });

    it('点击项时跟随其链接，并以事件和该项发出一次 onClick，不调用 window.open', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        setup({ activeKey: ['g1'], onClick });
        await click($(`.${prefix}-item-text`));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click' }), info[0].annotations[0]);
        await click($(`.${prefix}-item-video`));
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), info[0].annotations[1]);
        expect(open).not.toHaveBeenCalled();
    });

    it('点在项之外不触发 onClick', async () => {
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        setup({ activeKey: ['g1'], onClick });
        await fireEvent.click($('.semi-sidebar-container') as Element);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('没有 url 的项也触发 onClick，且不调用 window.open', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        setup({ activeKey: ['g'], info: [{ header: 'h', key: 'g', annotations: [{ title: 'No url' }] }], onClick });
        await fireEvent.click(screen.getByText('No url'));
        expect(open).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledWith(expect.anything(), { title: 'No url' });
    });

    it('item snippet 替换内置项，参数为条目和组内索引', () => {
        setup({ activeKey: ['g1'], item: createRawSnippet<[{ item: { title?: string }; index: number }]>((args) => ({ render: () => `<div class="my-item">${args().item.title}:${args().index}</div>` })) });
        expect([...document.querySelectorAll('.my-item')].map((node) => node.textContent)).toEqual(['文章:0', '视频:1']);
        expect($(`.${prefix}-item`)).toBeNull();
    });

    it('infoHeader 替换分组标题，参数带序号，图标保留', () => {
        setup({ infoHeader: createRawSnippet<[{ item: AnnotationInfo; index: number }]>((args) => ({ render: () => `<b>${args().index}:${args().item.header}</b>` })) });
        expect([...document.querySelectorAll('.semi-sidebar-collapse-header-content b')].map((node) => node.textContent)).toEqual(['0:分组一', '1:分组二']);
        expect(document.querySelectorAll('.semi-icon-book_open_stroked')).toHaveLength(2);
    });

    it('点击箭头切换面板时触发 onChange', async () => {
        const onChange = vi.fn<NonNullable<AnnotationProps['onChange']>>();
        setup({ activeKey: [], onChange });
        await fireEvent.click(document.querySelectorAll('.semi-collapse-header-icon')[1]);
        expect(onChange).toHaveBeenCalledWith(['g2']);
    });

    it('bind:activeKey 展开点击的面板', async () => {
        const store = createStore<BindHostStore>({ kind: 'annotation', visible: true, annotationKey: [], info, log: [] });
        render(BindHost, { props: { store } });
        expect(screen.queryByText('另一篇')).toBeNull();
        await fireEvent.click(document.querySelectorAll('.semi-collapse-header-icon')[1]);
        expect(store.annotationKey).toEqual(['g2']);
        expect(await screen.findByText('另一篇')).toBeInTheDocument();
    });

    it('容器属性透传：onCancel 与 resizable', async () => {
        const onCancel = vi.fn<NonNullable<AnnotationProps['onCancel']>>();
        setup({ resizable: false, onCancel });
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect($('.semi-resizable-resizable')).toBeNull();
    });

    it('AnnotationContent 不带容器，class 落在折叠面板上', () => {
        render(Annotation.AnnotationContent, { props: { info, activeKey: ['g1'], class: 'c' } });
        expect($('.semi-sidebar-container')).toBeNull();
        expect($('.semi-sidebar-collapse')).toHaveClass('c');
        expect(screen.getByText('文章')).toBeInTheDocument();
    });

    it('条目的 logo 与封面是装饰图片，链接名称里标题只出现一次', () => {
        render(Annotation.AnnotationContent, { props: { info, activeKey: ['g1'] } });
        for (const link of screen.getAllByRole('link')) {
            expect(link.querySelectorAll('img')).not.toHaveLength(0);
            for (const img of link.querySelectorAll('img')) {
                expect(img).toHaveAttribute('alt', '');
            }
        }
        // the images are decorative, so the name is the link text; the title must be in it exactly once
        const titleCount = (link: HTMLElement, title: string) => (link.textContent ?? '').split(/\s+/).filter((word) => word === title).length;
        expect(titleCount(screen.getByRole('link', { name: /视频/ }), '视频')).toBe(1);
        expect(titleCount(screen.getByRole('link', { name: /文章/ }), '文章')).toBe(1);
    });

    it('视频条目没有 logo 时不渲染 logo 图片', () => {
        render(Annotation.AnnotationContent, { props: { activeKey: ['g'], info: [{ header: 'h', key: 'g', annotations: [{ type: 'video', title: 'v', url: 'https://example.com/v' }] }] } });
        expect(document.querySelector('img')).toBeNull();
    });
});
