import { createSignal } from 'solid-js';
import { render, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import { expectThemeFocusRing, silentWavUrl, tabTo } from '@test/utils/browser';
import VideoPlayer from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-videoPlayer`;
const DURATION = 60;

const src = silentWavUrl(DURATION);
const poster = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="280"><rect width="500" height="280" fill="teal"/></svg>')}`;

function must<T>(value?: T | null): T {
    if (value === null || value === undefined) {
        throw new Error('expected a value');
    }
    return value;
}
const query = <T extends HTMLElement = HTMLElement>(container: ParentNode, selector: string) => must(container.querySelector<T>(selector));
const buttonWith = (container: ParentNode, name: string) => must(query(container, `.${BASE_CLASS_PREFIX}-icon-${name}`).closest('button'));

const waitForDuration = (container: Document | HTMLElement = document) => waitFor(() => container.querySelectorAll(`.${prefixCls}-controls-time`).forEach((time) => expect(time).toMatchTextContent('/ 01:00')));

describe('VideoPlayer（浏览器）', () => {
    it('基础元素检查', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        expect(query(container, `.${prefixCls}-poster`)).toBeInTheDocument();
        expect(query(container, `.${prefixCls}-wrapper-dark`)).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(query(container, `.${prefixCls}-pause`)).toBeInTheDocument();
        expect(query(container, 'img')).toHaveAttribute('src', poster);
        expect(query(container, 'video')).toHaveAttribute('src', src);
    });

    it('控制栏列表', () => {
        const { container } = render(() => <VideoPlayer controlsList={['play', 'time', 'volume', 'playbackRate', 'fullscreen']} height="280px" poster={poster} src={src} width="500px" />);
        expect(query(container, `.${BASE_CLASS_PREFIX}-icon-play`)).toBeInTheDocument();
        expect(query(container, `.${BASE_CLASS_PREFIX}-icon-maximize`)).toBeInTheDocument();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-flip_horizontal`)).toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-mini_player`)).toBeNull();
    });

    it('主题', () => {
        const { container } = render(() => (
            <>
                <VideoPlayer height="280px" poster={poster} src={src} width="500px" />
                <VideoPlayer height="280px" poster={poster} src={src} theme="light" width="500px" />
            </>
        ));
        expect(query(container, `.${prefixCls}-wrapper-dark`)).toBeInTheDocument();
        expect(query(container, `.${prefixCls}-wrapper-light`)).toBeInTheDocument();
    });

    it('设置跳转时间', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} seekTime={5} src={src} width="500px" />);
        await waitForDuration(container);
        // VideoPlayer only responds to keydown when focus is within itself (#3210)
        query(container, `.${prefixCls}-controls-menu-button`).focus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(query(container, `.${prefixCls}-controls-time`)).toMatchTextContent('00:05'));
    });

    it('ShadowRoot 内焦点在播放器内时方向键跳转', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(() => <VideoPlayer height="280px" poster={poster} seekTime={5} src={src} width="500px" />, { container: mount });
        try {
            await waitForDuration(mount);
            query(shadow, `.${prefixCls}-controls-menu-button`).focus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(query(mount, `.${prefixCls}-controls-time`)).toMatchTextContent('00:05'));
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('设置播放列表', async () => {
        const { container } = render(() => (
            <VideoPlayer
                height="280px"
                playbackRateList={[
                    { label: '0.5x', value: 0.5 },
                    { label: '1.0x', value: 1 },
                    { label: '1.5x', value: 1.5 },
                    { label: '2.0x', value: 2 },
                ]}
                poster={poster}
                src={src}
                width="500px"
            />
        ));
        const rateButton = must([...container.querySelectorAll(`.${prefixCls}-controls-menu-item`)].find((item) => item.textContent === '1.0x'));
        await userEvent.hover(rateButton);
        const items = await waitFor(() => {
            const found = document.querySelectorAll(`.${prefixCls}-controls-popup-menu-item`);
            expect(found).toHaveLength(4);
            return [...found].map((item) => item.textContent);
        });
        expect(items).toEqual(expect.arrayContaining(['1.0x', '1.5x', '2.0x']));
        expect(items).not.toContain('1.25x');
        expect(items).not.toContain('0.75x');
    });

    it('音量', () => {
        const { container } = render(() => <VideoPlayer height="280px" muted poster={poster} src={src} volume={0} width="500px" />);
        expect(query(container, `.${BASE_CLASS_PREFIX}-icon-mute`)).toBeInTheDocument();
    });

    it('视频加载错误', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src="data:video/mp4;base64,AAAA" width="500px" />);
        await waitFor(() => expect(within(query(container, `.${prefixCls}`)).getByText('视频加载错误')).toBeInTheDocument());
    });

    it('章节', async () => {
        const { container } = render(() => (
            <VideoPlayer
                height="450px"
                markers={[
                    { start: 0, title: '片头' },
                    { start: 4, title: '功能介绍' },
                    { start: 38, title: 'Figma Plugin' },
                    { start: 51, title: '片尾' },
                ]}
                poster={poster}
                src={src}
                width="800px"
            />
        ));
        await waitFor(() => expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(4));
        await userEvent.hover(container.querySelectorAll(`.${prefixCls}-progress-slider`)[1]);
        await waitFor(() => expect(query(document, `.${BASE_CLASS_PREFIX}-tooltip-content`)).toMatchTextContent('功能介绍'));
    });

    it('播放速率触发器显示主题焦点环', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const trigger = query(container, `.${prefixCls}-controls-popup`);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });

    it('进度滑块显示主题焦点环', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const slider = query(container, `.${prefixCls}-progress`);
        await tabTo(slider);
        expectThemeFocusRing(slider);
    });

    it('播放中指针离开后，键盘焦点所在的控制栏保持可见，鼠标点击留下的焦点不保持', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const root = query(container, `.${prefixCls}`);
        const controls = query(container, `.${prefixCls}-controls`);
        const [play, mirror] = [buttonWith(container, 'play'), buttonWith(container, 'flip_horizontal')];
        query(container, 'video').dispatchEvent(new Event('play'));

        await tabTo(play);
        await userEvent.hover(root);
        await userEvent.unhover(root);
        await waitFor(() => expect(controls).toHaveClass(`${prefixCls}-controls-hide`));
        expect(getComputedStyle(controls).opacity).toBe('1');

        await userEvent.click(mirror);
        // Safari leaves a clicked button unfocused; give it the ringless focus Chromium and Firefox leave after a click
        focusWithoutRing(mirror);
        expect(mirror).toHaveFocus();
        await userEvent.unhover(root);
        await expect.poll(() => getComputedStyle(controls).opacity).toBe('0');
    });

    it('拖动进度条时，即使指针移出进度条也继续跳转，松开后结束', async () => {
        const { container } = render(() => (
            <div style={{ display: 'flex' }}>
                <VideoPlayer height="280px" poster={poster} src={src} width="500px" />
                <div style={{ width: '200px', height: '280px' }} data-testid="outside" />
            </div>
        ));
        await waitForDuration(container);
        const progress = query(container, `.${prefixCls}-progress`);
        const video = query<HTMLVideoElement>(container, 'video');
        expect(getComputedStyle(progress).touchAction).toBe('none');

        await userEvent.dragAndDrop(progress, query(container, '[data-testid="outside"]'));
        expect(video.currentTime).toBe(DURATION);

        await userEvent.hover(progress, { position: { x: 5, y: 2 } });
        expect(video.currentTime).toBe(DURATION);
    });

    it('悬停进度条时圆点显示且与轨道同心，移出后隐藏；时间预览不拦截指针', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const progress = query(container, `.${prefixCls}-progress`);
        const track = query(container, `.${prefixCls}-progress-slider-list`);
        const handle = query(container, `.${prefixCls}-progress-handle`);
        const centerY = (el: Element) => {
            const rect = el.getBoundingClientRect();
            return rect.top + rect.height / 2;
        };

        await userEvent.hover(progress);
        await expect.poll(() => getComputedStyle(handle).opacity).toBe('1');
        await expect.poll(() => getComputedStyle(track).height).toBe('10px');
        expect(centerY(handle)).toBe(centerY(track));
        const tooltip = await vi.waitFor(() => query(document, `.${prefixCls}-progress-tooltip.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`));
        expect(getComputedStyle(tooltip).pointerEvents).toBe('none');

        await userEvent.unhover(progress);
        await expect.poll(() => getComputedStyle(handle).opacity).toBe('0');
        await expect.poll(() => getComputedStyle(track).height).toBe('4px');
    });

    it('时间预览 Tooltip 跟随指针，点击进度条后与圆点对齐', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const progress = query(container, `.${prefixCls}-progress`);
        const bar = progress.getBoundingClientRect();
        const handle = query(container, `.${prefixCls}-progress-handle`);

        await userEvent.click(progress, { position: { x: 40, y: 2 } });
        await expect
            .poll(() => {
                const rect = handle.getBoundingClientRect();
                return Math.round(rect.left + rect.width / 2 - bar.left);
            })
            .toBe(40);
        const tooltip = await vi.waitFor(() => {
            const el = document.querySelector<HTMLElement>(`.${prefixCls}-progress-tooltip.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
            expect(el).not.toBeNull();
            return must(el);
        });
        await expect
            .poll(() => {
                const rect = tooltip.getBoundingClientRect();
                return Math.round(rect.left + rect.width / 2 - bar.left);
            })
            .toBe(40);
        // polled: the enter animation moves the popup until it settles
        await expect.poll(() => Math.round(bar.top - tooltip.getBoundingClientRect().bottom)).toBe(2);
    });

    it('传了 captionsSrc 时字幕默认显示', async () => {
        const captions = URL.createObjectURL(new Blob(['WEBVTT\n\n00:00.000 --> 00:10.000\nHello'], { type: 'text/vtt' }));
        onTestFinished(() => URL.revokeObjectURL(captions));
        const { container } = render(() => <VideoPlayer captionsSrc={captions} height="280px" src={src} width="500px" />);
        const video = query<HTMLVideoElement>(container, 'video');
        await waitForDuration(container);
        await expect.poll(() => video.textTracks[0]?.mode).toBe('showing');
    });

    it('播放中换成另一个 src 后，播放按钮可用并重新开始播放', async () => {
        const [current, setCurrent] = createSignal(src);
        const { container } = render(() => <VideoPlayer height="280px" src={current()} width="500px" />);
        const video = query<HTMLVideoElement>(container, 'video');
        await waitForDuration(container);
        await userEvent.click(buttonWith(container, 'play'));
        await expect.poll(() => video.paused).toBe(false);

        // the load algorithm pauses the element without a pause event
        setCurrent(silentWavUrl(30));
        await expect.poll(() => video.paused).toBe(true);
        await expect.poll(() => container.querySelector(`.${BASE_CLASS_PREFIX}-icon-play`)).not.toBeNull();
        await userEvent.click(buttonWith(container, 'play'));
        await expect.poll(() => video.paused).toBe(false);
    });

    it('键盘聚焦进度条时时间预览显示当前时间，而不是上次悬停的时间', async () => {
        const { container } = render(() => <VideoPlayer height="280px" seekTime={5} src={src} width="500px" />);
        await waitForDuration(container);
        const progress = query(container, `.${prefixCls}-progress`);
        const preview = () => document.querySelector(`.${prefixCls}-progress-tooltip.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);

        await userEvent.hover(progress, { position: { x: 100, y: 2 } });
        await vi.waitFor(() => expect(preview()).not.toBeNull());
        await userEvent.unhover(progress);
        await vi.waitFor(() => expect(preview()).toBeNull());
        // the Tooltip's pending close from the hover would otherwise hide the popup the focus opens
        await new Promise((resolve) => setTimeout(resolve, 500));

        await tabTo(progress);
        await vi.waitFor(() => expect(preview()).toMatchTextContent('00:00'));
        await userEvent.keyboard('{ArrowRight}');
        await vi.waitFor(() => expect(preview()).toMatchTextContent('00:05'));
    });

    it('muted 加 autoPlay 时不被自动播放策略拦截', async () => {
        const { container } = render(() => <VideoPlayer autoPlay height="280px" muted poster={poster} src={src} width="500px" />);
        const video = query<HTMLVideoElement>(container, 'video');
        await expect.poll(() => video.paused).toBe(false);
        expect(video.muted).toBe(true);
    });

    it('全屏下打开倍速菜单并点击一项，倍速改变', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const root = query(container, `.${prefixCls}`);
        const video = query<HTMLVideoElement>(container, 'video');
        await userEvent.click(buttonWith(container, 'maximize'));
        await expect.poll(() => document.fullscreenElement).toBe(root);
        try {
            await userEvent.hover(query(container, `.${prefixCls}-controls-popup`));
            const item = await vi.waitFor(() => {
                const found = [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`)];
                const target = found.find((el) => el.textContent === '2.0x');
                expect(target).toBeDefined();
                return must(target);
            });
            // outside the fullscreen element the menu would get no pointer events
            expect(root).toContainElement(item);
            await userEvent.click(item);
            await expect.poll(() => video.playbackRate).toBe(2);
        } finally {
            await document.exitFullscreen();
        }
    });

    it('常驻 status 容器不占位，通知仍定位在播放器内部', async () => {
        const { container } = render(() => <VideoPlayer height="280px" poster={poster} src={src} width="500px" />);
        await waitForDuration(container);
        const root = query(container, `.${prefixCls}`);
        const status = query(container, '[role="status"]');
        expect(status.parentElement).toBe(root);
        expect(status.getBoundingClientRect().height).toBe(0);

        await userEvent.click(buttonWith(container, 'flip_horizontal'));
        const notification = await vi.waitFor(() => {
            const el = container.querySelector<HTMLElement>(`.${prefixCls}-notification`);
            expect(el).not.toBeNull();
            return must(el);
        });
        expect(status).toContainElement(notification);
        expect(getComputedStyle(notification).position).toBe('absolute');
        const box = root.getBoundingClientRect();
        const rect = notification.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(box.left);
        expect(rect.right).toBeLessThanOrEqual(box.right);
        expect(rect.top).toBeGreaterThanOrEqual(box.top);
        expect(rect.bottom).toBeLessThanOrEqual(box.bottom);
    });

    it('播放器窄于控制栏整行时时间文字保持单行原宽，不折行', async () => {
        const { container } = render(() => (
            <>
                <VideoPlayer height="280px" poster={poster} src={src} width="700px" />
                <VideoPlayer height="280px" poster={poster} src={src} width="240px" />
            </>
        ));
        await waitForDuration(container);
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefixCls}-controls-time`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});
