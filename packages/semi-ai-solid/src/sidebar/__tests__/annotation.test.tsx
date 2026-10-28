import { createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Annotation, { type AnnotationProps } from '../annotation';
import { type AnnotationItem, VideoItem } from '../annotation/item';

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
const info: AnnotationProps['info'] = [
    { header: 'Group 1', key: '1', annotations: [textItem, videoItem] },
    { header: 'Group 2', key: '2', annotations: [{ title: 'Hidden', detail: 'hidden detail' }] },
];

const sidebarContainer = (container: HTMLElement) => container.querySelector('.semi-sidebar-container') as HTMLElement;

describe('Annotation', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('渲染在容器中，带有语言包标题和 annotation 类名', () => {
        const { container } = render(() => <Annotation class="custom" style={{ color: 'red' }} info={info} visible />);
        const root = sidebarContainer(container);
        expect(root).toHaveClass('semi-sidebar-annotation', 'custom');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent(zh_CN.Sidebar.annotationTitle);
        expect(screen.getByText('Group 1')).toBeInTheDocument();
        expect(screen.getByText('Group 2')).toBeInTheDocument();
        expect(container.querySelectorAll('.semi-icon-book_open_stroked')).toHaveLength(2);
    });

    it('title 属性替换语言包标题', () => {
        const { container } = render(() => <Annotation title="Sources" info={info} visible />);
        expect(container.querySelector('.semi-sidebar-container-header-title')).toHaveTextContent('Sources');
    });

    it('渲染当前激活面板中的文本和视频项', () => {
        const { container } = render(() => <Annotation activeKey={['1']} info={info} visible />);
        const text = container.querySelector('.semi-sidebar-annotation-item-text') as HTMLElement;
        expect(text).toHaveTextContent('Text title');
        expect(text.querySelector('.semi-sidebar-annotation-item-text-detail')).toHaveTextContent('Text detail');
        expect(text.querySelector('.semi-sidebar-annotation-item-footer-logo')).toHaveAttribute('src', textItem.logo);
        expect(text.querySelector('.semi-sidebar-annotation-item-footer-text')).toHaveTextContent('Semi');
        expect(text.querySelector('.semi-sidebar-annotation-item-footer-order')).toHaveTextContent('1');

        const video = container.querySelector('.semi-sidebar-annotation-item-video') as HTMLElement;
        expect(video.querySelector('.semi-sidebar-annotation-item-video-img')).toHaveAttribute('src', videoItem.img);
        expect(video.querySelector('.semi-sidebar-annotation-item-video-duration')).toHaveTextContent('1:02:05');
        expect(video.querySelector('.semi-sidebar-annotation-item-footer-text')).toHaveTextContent('Video site');
        expect(screen.queryByText('Hidden')).toBeNull();
    });

    it('文本项没有 logo、站点名或序号时不渲染这些内容', () => {
        const { container } = render(() => <Annotation activeKey={['1']} info={[{ header: 'h', key: '1', annotations: [{ title: 't' }] }]} visible />);
        const footer = container.querySelector('.semi-sidebar-annotation-item-footer');
        // Solid keeps empty text nodes as insertion markers
        expect(footer?.children).toHaveLength(0);
        expect(footer).toHaveTextContent('');
    });

    it('带 url 的项是链接，在新窗口打开且不携带 opener 和 referrer', () => {
        render(() => <Annotation activeKey={['1']} info={info} visible />);
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

    it('点击项时跟随其链接；项未声明 onClick 时，调用外层 onClick 并传入该项', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        const itemOnClick = vi.fn<NonNullable<AnnotationItem['onClick']>>();
        const { container } = render(() => <Annotation activeKey={['1']} info={[{ header: 'h', key: '1', annotations: [{ ...textItem, onClick: itemOnClick }, videoItem] }]} visible onClick={onClick} />);
        // jsdom does not navigate, so the default is cancelled up front to keep it from logging
        const click = (el: Element) => {
            const event = createEvent.click(el);
            event.preventDefault();
            fireEvent(el, event);
        };
        click(container.querySelector('.semi-sidebar-annotation-item-text') as HTMLElement);
        expect(onClick).not.toHaveBeenCalled();
        expect(itemOnClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'click' }), textItem);

        click(container.querySelector('.semi-sidebar-annotation-item-video') as HTMLElement);
        expect(onClick).toHaveBeenLastCalledWith(expect.anything(), videoItem);
        expect(open).not.toHaveBeenCalled();
    });

    it('没有 url 的项只调用 onClick', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const onClick = vi.fn<NonNullable<AnnotationProps['onClick']>>();
        render(() => <Annotation activeKey={['1']} info={[{ header: 'h', key: '1', annotations: [{ title: 'No url' }] }]} visible onClick={onClick} />);
        fireEvent.click(screen.getByText('No url'));
        expect(open).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledWith(expect.anything(), { title: 'No url' });
    });

    it('renderItem 替换内置项', () => {
        const renderItem = vi.fn<NonNullable<AnnotationProps['renderItem']>>((item) => <div class="my-item">{item.title}</div>);
        const { container } = render(() => <Annotation activeKey={['1']} info={info} visible renderItem={renderItem} />);
        expect([...container.querySelectorAll('.my-item')].map((node) => node.textContent)).toEqual(['Text title', 'Video title']);
        expect(renderItem).toHaveBeenCalledWith(textItem);
        expect(container.querySelector('.semi-sidebar-annotation-item')).toBeNull();
    });

    it('onChange 报告通过箭头切换的面板', () => {
        const onChange = vi.fn<NonNullable<AnnotationProps['onChange']>>();
        const { container } = render(() => <Annotation activeKey={[]} info={info} visible onChange={onChange} />);
        fireEvent.click(container.querySelectorAll('.semi-collapse-header-icon')[1]);
        expect(onChange).toHaveBeenCalledWith(['2'], expect.anything());
    });

    it('容器属性透传：onCancel 和 resizable', () => {
        const onCancel = vi.fn<() => void>();
        const { container } = render(() => <Annotation info={info} resizable={false} visible onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.Sidebar.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.semi-resizable-resizable')).toBeNull();
    });

    it('AnnotationContent 不带容器也能渲染', () => {
        const { container } = render(() => <Annotation.AnnotationContent class="c" activeKey={['1']} info={info} />);
        expect(container.querySelector('.semi-sidebar-container')).toBeNull();
        expect(container.querySelector('.semi-sidebar-collapse')).toHaveClass('c');
        expect(screen.getByText('Text title')).toBeInTheDocument();
    });

    it('条目的 logo 与封面是装饰图片，链接名称里标题只出现一次', () => {
        render(() => <Annotation.AnnotationContent activeKey={['1']} info={info} />);
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
        const { container } = render(() => <VideoItem title="Video title" url="https://semi.design/video" />);
        expect(container.querySelector('img')).toBeNull();
    });
});
