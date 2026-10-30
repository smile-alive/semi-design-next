/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners, endLeaveAnimations, render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import type { VideoControl, VideoPlayerEmits, VideoPlayerHandle, VideoPlayerProps } from '../interface';
import VideoPlayer from '../video-player.vue';
import CachedPlayer from './fixtures/cached-player.vue';
import HandleHost from './fixtures/handle-host.vue';

const prefixCls = 'semi-videoPlayer';
const icon = (name: string) => `.semi-icon-${name}`;
const src = 'https://example.com/video.mp4';

function query<E extends Element = HTMLElement>(container: Element | Document, selector: string) {
    const found = container.querySelector<E>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}
function buttonWith(container: Element, name: string) {
    const button = query(container, icon(name)).closest('button');
    if (!button) throw new Error(`no button around ${name}`);
    return button;
}
const getVideo = (container: Element) => query<HTMLVideoElement>(container, 'video');
const getRoot = (container: Element) => query(container, `.${prefixCls}`);
const notification = (container: Element) => container.querySelector(`.${prefixCls}-notification`);

// jsdom has no media pipeline
function setMedia(element: HTMLMediaElement, values: Record<string, unknown>) {
    for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(element, key, { configurable: true, writable: true, value });
    }
}

function loadDuration(video: HTMLVideoElement, duration = 60) {
    setMedia(video, { duration, currentTime: video.currentTime ?? 0 });
    return fireEvent(video, new Event('durationchange'));
}

const mediaEvent = (video: HTMLVideoElement, type: string) => fireEvent(video, new Event(type));

// Tooltip re-checks `:hover` once positioned and jsdom never matches it; closest() bypasses the spied matches
function hoverOpen(el: Element) {
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function matches(this: Element, selector: string) {
        return selector === ':hover' ? this.contains(el) || el.contains(this) : this.closest(selector) === this;
    });
    return fireEvent.mouseEnter(el);
}

async function openMenu(container: Element, label: string) {
    const trigger = [...container.querySelectorAll(`.${prefixCls}-controls-popup`)].find((item) => item.textContent?.trim() === label);
    if (!trigger) throw new Error(`no menu ${label}`);
    await hoverOpen(trigger);
    return waitFor(() => {
        const items = document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`);
        expect(items.length).toBeGreaterThan(0);
        return [...items];
    });
}

function setFullscreenElement(element: Element | null) {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
    return fireEvent(document, new Event('fullscreenchange'));
}

function mockVolumeTrack() {
    const real = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('semi-audio-player-slider') ? new DOMRect(0, 0, 4, 120) : real.call(this);
    });
}

const renderPlayer = (props: Partial<VideoPlayerProps> & Record<string, unknown> = {}) => render(VideoPlayer, { props: { src, ...props } });

function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
}

const menuTexts = (container: Element) => [...container.querySelectorAll(`.${prefixCls}-controls-popup`)].map((item) => item.textContent?.trim());

describe('VideoPlayer', () => {
    beforeEach(() => {
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        HTMLElement.prototype.requestFullscreen = vi.fn<HTMLElement['requestFullscreen']>(() => Promise.resolve());
        document.exitFullscreen = vi.fn<Document['exitFullscreen']>(() => Promise.resolve());
        HTMLVideoElement.prototype.requestPictureInPicture = vi.fn<HTMLVideoElement['requestPictureInPicture']>(() => Promise.resolve({} as PictureInPictureWindow));
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
        delete (document as { exitFullscreen?: unknown }).exitFullscreen;
        delete (HTMLVideoElement.prototype as { requestPictureInPicture?: unknown }).requestPictureInPicture;
        delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    });

    it('渲染视频、海报、暂停遮罩与默认控件', () => {
        const { container } = renderPlayer({
            class: 'custom',
            style: { top: '1px' },
            captionsSrc: 'https://example.com/captions.vtt',
            crossOrigin: 'anonymous',
            height: '280px',
            poster: 'https://example.com/poster.png',
            width: 500,
        });
        const root = getRoot(container);
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ width: '500px', height: '280px', top: '1px' });
        expect(query(root, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-dark`);
        const video = getVideo(root);
        expect(video).toHaveAttribute('src', src);
        expect(video).toHaveAttribute('crossorigin', 'anonymous');
        expect(video.autoplay).toBe(false);
        expect(video.loop).toBe(false);
        expect(video.controls).toBe(false);
        expect(query(video, 'track')).toHaveAttribute('src', 'https://example.com/captions.vtt');
        expect(query(root, `.${prefixCls}-poster`)).toHaveAttribute('src', 'https://example.com/poster.png');
        expect(root.querySelector(`.${prefixCls}-pause`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefixCls}-resource-not-found`)).toBeNull();
        expect(root.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(query(root, `.${prefixCls}-controls`)).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(query(root, `.${prefixCls}-controls-time`)).toHaveTextContent('00:00 / 00:00');
        for (const name of ['play', 'volume_2', 'flip_horizontal', 'maximize', 'mini_player']) {
            expect(root.querySelector(icon(name))).toBeInTheDocument();
        }
        expect(menuTexts(root)).toEqual(['1.0x']);
        expect(root.querySelector(icon('restart'))).toBeNull();
    });

    it('将 autoPlay 与 loop 传给 video，并应用浅色主题', () => {
        const { container } = renderPlayer({ autoPlay: true, loop: true, theme: 'light' });
        const video = getVideo(container);
        expect(video.autoplay).toBe(true);
        expect(video.loop).toBe(true);
        expect(query(container, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
    });

    it('仅显示 controlsList 中的控件', () => {
        const { container } = renderPlayer({ controlsList: ['play', 'fullscreen'], onNext: () => {} });
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(container.querySelector(icon('maximize'))).toBeInTheDocument();
        for (const name of ['restart', 'volume_2', 'flip_horizontal', 'mini_player']) {
            expect(container.querySelector(icon(name))).toBeNull();
        }
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-controls-popup`)).toBeNull();
    });

    it('无 src 时显示资源缺失提示', () => {
        const { container } = render(VideoPlayer);
        expect(query(container, `.${prefixCls}-resource-not-found`)).toHaveTextContent('暂无资源');
        expect(getVideo(container)).not.toHaveAttribute('src');
    });

    it('跟随新的 src，src 被移除时保留上一个', async () => {
        const { container, rerender } = renderPlayer();
        await rerender({ src: 'https://example.com/other.mp4' });
        expect(getVideo(container)).toHaveAttribute('src', 'https://example.com/other.mp4');
        await rerender({ src: undefined });
        expect(getVideo(container)).toHaveAttribute('src', 'https://example.com/other.mp4');
        expect(container.querySelector(`.${prefixCls}-resource-not-found`)).toBeInTheDocument();
    });

    it('通过 video 元素播放与暂停，并以无参数的组件事件上报', async () => {
        const { container, emitted } = renderPlayer({ poster: 'https://example.com/poster.png' });
        const video = getVideo(container);
        await fireEvent.click(buttonWith(container, 'play'));
        expect(video.play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeNull();
        setMedia(video, { paused: false });
        await mediaEvent(video, 'play');
        expect(emitted().play).toEqual([[]]);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-poster`)).toBeNull();

        await fireEvent.click(buttonWith(container, 'pause'));
        expect(video.pause).toHaveBeenCalledTimes(1);
        await mediaEvent(video, 'pause');
        expect(emitted().pause).toEqual([[]]);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-poster`)).toBeInTheDocument();
    });

    it('下一个按钮仅在有 onNext 且 controlsList 允许时显示，并调用 onNext', async () => {
        const { container, rerender } = renderPlayer();
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();

        const onNext = vi.fn<() => void>();
        await rerender({ src, onNext });
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.next }));
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(getVideo(container).play).not.toHaveBeenCalled();

        await rerender({ controlsList: ['play'], src, onNext });
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();
    });

    it('全局默认值提供的 onNext 同样显示下一个按钮', async () => {
        const onNext = vi.fn<() => void>();
        render(VideoPlayer, { props: { src }, global: globalWith({ VideoPlayer: { onNext } }) });
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.next }));
        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('点击视频时根据元素的 paused 状态切换播放', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await fireEvent.click(video);
        expect(video.play).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        await fireEvent.click(video);
        expect(video.pause).toHaveBeenCalledTimes(1);
    });

    it('视频处于起止之间时隐藏海报', async () => {
        const { container } = renderPlayer({ poster: 'https://example.com/poster.png' });
        const video = getVideo(container);
        await loadDuration(video);
        video.currentTime = 30;
        await mediaEvent(video, 'timeupdate');
        expect(query(container, `.${prefixCls}-poster`)).toHaveClass(`${prefixCls}-poster-hide`);
    });

    it('显示当前时间与时长', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await loadDuration(video, 3725);
        video.currentTime = 75;
        await mediaEvent(video, 'timeupdate');
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('01:15 / 1:02:05');
    });

    it('进度条播报范围与语音时间', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await loadDuration(video, 200);
        setMedia(video, { currentTime: 65 });
        await mediaEvent(video, 'timeupdate');
        const progress = screen.getByRole('slider', { name: '播放进度' });
        expect(progress).toHaveAttribute('aria-valuemin', '0');
        expect(progress).toHaveAttribute('aria-valuemax', '200');
        expect(progress).toHaveAttribute('aria-valuetext', '1 分 05 秒 / 3 分 20 秒');
    });

    it('元数据加载前进度条范围有效', () => {
        renderPlayer();
        expect(screen.getByRole('slider', { name: '播放进度' })).toHaveAttribute('aria-valuemax', '0');
    });

    it('通过进度条跳转', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = renderPlayer();
        const video = getVideo(container);
        await loadDuration(video);
        const progress = query(container, `.${prefixCls}-progress`);
        expect(progress).toHaveAttribute('role', 'slider');
        await fireEvent.pointerDown(progress, { clientX: 50 });
        expect(video.currentTime).toBe(15);
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('00:15 / 01:00');
        expect(progress).toHaveAttribute('aria-valuenow', '15');
        await fireEvent.pointerMove(progress, { clientX: 100 });
        expect(video.currentTime).toBe(30);
        await fireEvent.pointerUp(progress);
        await fireEvent.lostPointerCapture(progress);
        await fireEvent.pointerMove(progress, { clientX: 150 });
        expect(video.currentTime).toBe(30);
    });

    it('直播流（时长为 Infinity）下按下进度条不向 currentTime 写入非有限值', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = renderPlayer();
        const video = getVideo(container);
        const attempts: number[] = [];
        // a media element rejects a non-finite currentTime with a TypeError
        Object.defineProperty(video, 'currentTime', {
            configurable: true,
            get: () => 0,
            set: (value: number) => {
                attempts.push(value);
                if (!Number.isFinite(value)) throw new TypeError('The provided double value is non-finite');
            },
        });
        setMedia(video, { duration: Number.POSITIVE_INFINITY });
        await mediaEvent(video, 'durationchange');
        const progress = query(container, `.${prefixCls}-progress`);
        await fireEvent.pointerDown(progress, { clientX: 50 });
        await fireEvent.keyDown(progress, { key: 'End' });
        expect(attempts.every(Number.isFinite)).toBe(true);
    });

    it('只有主键按下进度条才跳转', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = renderPlayer();
        const video = getVideo(container);
        await loadDuration(video);
        const progress = query(container, `.${prefixCls}-progress`);
        await fireEvent.pointerDown(progress, { clientX: 50, button: 2 });
        await fireEvent.pointerDown(progress, { clientX: 50, button: 1 });
        expect(video.currentTime).toBe(0);
        await fireEvent.pointerMove(progress, { clientX: 100 });
        expect(video.currentTime).toBe(0);
    });

    it('传了 captionsSrc 的字幕轨默认启用，没传时不启用', async () => {
        const { container, rerender } = renderPlayer({ captionsSrc: 'https://example.com/captions.vtt' });
        expect(query<HTMLTrackElement>(container, 'track').default).toBe(true);
        await rerender({ captionsSrc: undefined });
        expect(query<HTMLTrackElement>(container, 'track').default).toBe(false);
    });

    it('换源加载把播放中的 video 暂停后，播放按钮回到「播放」', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        setMedia(video, { paused: false });
        await mediaEvent(video, 'play');
        expect(screen.getByRole('button', { name: zh_CN.VideoPlayer.pause })).toBeInTheDocument();
        // the load algorithm pauses the element without a pause event
        setMedia(video, { paused: true });
        await mediaEvent(video, 'loadstart');
        await fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.play }));
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('卡顿通知在收到 progress 后消失', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await mediaEvent(video, 'stalled');
        expect(notification(container)).toHaveTextContent('加载失败');
        await mediaEvent(video, 'progress');
        expect(notification(container)).toBeNull();
    });

    it('时长已知后将标记布局在时长上', async () => {
        const markers = [
            { start: 0, title: 'Intro' },
            { start: 20, title: 'Middle' },
            { start: 50, title: 'End' },
            { start: 90, title: 'Past the end' },
        ];
        const { container } = renderPlayer({ markers });
        await loadDuration(getVideo(container));
        const sliders = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-progress-slider`)];
        expect(sliders).toHaveLength(3);
        expect(sliders[0]).toHaveStyle({ left: '0%' });
        expect(sliders[0].style.width).toMatch(/^33\.33/);
        expect(sliders[1].style.left).toMatch(/^33\.33/);
        expect(sliders[1].style.width).toMatch(/^50(\.0+\d*)?%$/);
        expect(sliders[2].style.left).toMatch(/^83\.33/);
        expect(sliders[2].style.width).toMatch(/^16\.66/);
    });

    it('填充每个标记中已播放与已缓冲的部分', async () => {
        const { container } = renderPlayer({
            markers: [
                { start: 0, title: 'A' },
                { start: 30, title: 'B' },
            ],
        });
        const video = getVideo(container);
        await loadDuration(video);
        video.currentTime = 15;
        await mediaEvent(video, 'timeupdate');
        setMedia(video, { buffered: { length: 1, end: () => 45 } });
        await mediaEvent(video, 'progress');
        const sliders = container.querySelectorAll(`.${prefixCls}-progress-slider`);
        const fillWidth = (slider: Element, part: string) => query(slider, `.${prefixCls}-progress-slider-${part}`).style.width;
        expect(fillWidth(sliders[0], 'played')).toBe('50%');
        expect(fillWidth(sliders[1], 'played')).toBe('0%');
        expect(fillWidth(sliders[0], 'buffered')).toBe('calc(100% - 2px)');
        expect(fillWidth(sliders[1], 'buffered')).toBe('50%');
    });

    it('应用初始音量，并通过音量按钮切换静音', async () => {
        const { container } = renderPlayer({ volume: 40 });
        const video = getVideo(container);
        expect(video.volume).toBe(0.4);
        expect(video.muted).toBe(false);
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
        await fireEvent.click(buttonWith(container, 'volume_1'));
        expect(video.muted).toBe(true);
        expect(video.volume).toBe(0.4);
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
        await fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.4);
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
    });

    it('静音启动后取消静音恢复原音量，音量拖到 0 后取消静音恢复到一半', async () => {
        mockVolumeTrack();
        const onVolumeChange = vi.fn<(...args: VideoPlayerEmits['volumeChange']) => void>();
        const { container } = renderPlayer({ muted: true, volume: 60, onVolumeChange });
        const video = getVideo(container);
        expect(video.muted).toBe(true);
        await fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.6);
        expect(onVolumeChange).toHaveBeenLastCalledWith(60);

        await hoverOpen(buttonWith(container, 'volume_2'));
        const wrapper = await waitFor(() => query(document, '.semi-audio-player-slider-wrapper'));
        await fireEvent.pointerDown(wrapper, { clientY: 120 });
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
        await fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.5);
        expect(onVolumeChange).toHaveBeenLastCalledWith(50);
    });

    it('静音切换与滑块拖动时发出 volumeChange，初始化时不发出，同一音量不重复', async () => {
        mockVolumeTrack();
        const onVolumeChange = vi.fn<(...args: VideoPlayerEmits['volumeChange']) => void>();
        const { container } = renderPlayer({ volume: 40, onVolumeChange });
        expect(onVolumeChange).not.toHaveBeenCalled();
        await fireEvent.click(buttonWith(container, 'volume_1'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(0);
        await fireEvent.click(buttonWith(container, 'mute'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(40);
        expect(onVolumeChange).toHaveBeenCalledTimes(2);

        await hoverOpen(buttonWith(container, 'volume_1'));
        const wrapper = await waitFor(() => query(document, '.semi-audio-player-slider-wrapper'));
        await fireEvent.pointerDown(wrapper, { clientY: 102 });
        expect(onVolumeChange).toHaveBeenLastCalledWith(15);
        await fireEvent.pointerMove(wrapper, { clientY: 102 });
        expect(onVolumeChange).toHaveBeenCalledTimes(3);
        await fireEvent.pointerMove(wrapper, { clientY: 120 });
        expect(onVolumeChange).toHaveBeenLastCalledWith(0);
        expect(onVolumeChange).toHaveBeenCalledTimes(4);
    });

    it('静音启动时显示静音图标，不发出 volumeChange', () => {
        const onVolumeChange = vi.fn<(...args: VideoPlayerEmits['volumeChange']) => void>();
        const { container } = renderPlayer({ muted: true, onVolumeChange });
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
        expect(onVolumeChange).not.toHaveBeenCalled();
    });

    it('通过 popover 中的滑块设置音量', async () => {
        mockVolumeTrack();
        const { container } = renderPlayer();
        const video = getVideo(container);
        await hoverOpen(buttonWith(container, 'volume_2'));
        const title = await waitFor(() => {
            const found = query(document, `.${prefixCls}-controls-volume-title`);
            expect(found).toHaveTextContent('100%');
            return found;
        });
        await fireEvent.pointerDown(query(title.parentElement as Element, '.semi-audio-player-slider-wrapper'), {
            clientY: 102,
        });
        expect(video.volume).toBe(0.15);
        expect(title).toHaveTextContent('15%');
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
    });

    it('音量弹层是名为音量的对话框，按钮获得焦点时打开', async () => {
        const { container } = renderPlayer();
        const trigger = buttonWith(container, 'volume_2');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        trigger.focus();
        const dialog = await waitFor(() => screen.getByRole('dialog', { name: '音量' }));
        expect(dialog).toContainElement(query(document, `.${prefixCls}-controls-volume`));
        expect(within(dialog).getByRole('slider', { name: '音量' })).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('通过菜单修改播放速率并在状态区显示通知', async () => {
        const onRateChange = vi.fn<(...args: VideoPlayerEmits['rateChange']) => void>();
        const { container } = renderPlayer({
            defaultPlaybackRate: 1.5,
            playbackRateList: [
                { label: '0.5x', value: 0.5 },
                { label: '1.5x', value: 1.5 },
                { label: '3.0x', value: 3 },
            ],
            onRateChange,
        });
        const video = getVideo(container);
        const items = await openMenu(container, '1.5x');
        expect(items.map((item) => item.textContent?.trim())).toEqual(['0.5x', '1.5x', '3.0x']);
        await fireEvent.click(items[2]);
        expect(video.playbackRate).toBe(3);
        expect(onRateChange).toHaveBeenCalledExactlyOnceWith(3);
        expect(menuTexts(container)).toEqual(['3.0x']);
        expect(notification(container)).toHaveTextContent('切换速率至 3.0x');
        expect(within(getRoot(container)).getByRole('status')).toContainElement(notification(container) as HTMLElement);
    });

    it('倍速、清晰度、线路是单选菜单，按钮名称为用途加当前值，当前值为空时只有用途', async () => {
        const names = en_US.VideoPlayer;
        const { container } = render({
            render: () => <ConfigProvider locale={en_US}>{() => <VideoPlayer src={src} defaultRoute="line1" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} />}</ConfigProvider>,
        });
        expect(screen.getByRole('button', { name: `${names.playbackRate} 1.0x` })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: names.quality })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `${names.route} Line 1` })).toBeInTheDocument();
        const items = await openMenu(container, '1.0x');
        expect(items.every((item) => item.getAttribute('role') === 'menuitemradio')).toBe(true);
        const checked = items.filter((item) => item.getAttribute('aria-checked') === 'true');
        expect(checked.map((item) => item.textContent?.trim())).toEqual(['1.0x']);
        await fireEvent.click(items[0]);
        expect(screen.getByRole('button', { name: `${names.playbackRate} 2.0x` })).toBeInTheDocument();
    });

    it('当前值不在列表中时按钮显示该值', () => {
        const { container } = renderPlayer({ defaultPlaybackRate: 0.5 });
        expect(menuTexts(container)).toEqual(['0.5']);
    });

    it('通过原生按钮用键盘打开速率、清晰度与线路菜单', async () => {
        const onRateChange = vi.fn<(...args: VideoPlayerEmits['rateChange']) => void>();
        const { container } = renderPlayer({
            defaultQuality: '1080p',
            defaultRoute: 'line1',
            qualityList: [{ label: '1080P', value: '1080p' }],
            routeList: [{ label: 'Line 1', value: 'line1' }],
            onRateChange,
        });
        const triggers = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup`)];
        expect(menuTexts(container)).toEqual(['1.0x', '1080P', 'Line 1']);
        for (const trigger of triggers) {
            expect(trigger.tagName).toBe('BUTTON');
            expect(trigger).toHaveAttribute('type', 'button');
            expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        }
        triggers[0].focus();
        await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`);
            expect(found.length).toBeGreaterThan(0);
            return [...found];
        });
        await fireEvent.keyDown(triggers[0], { key: 'ArrowDown' });
        expect(items[0]).toHaveFocus();
        await fireEvent.keyDown(items[0], { key: 'Enter' });
        expect(onRateChange).toHaveBeenCalledWith(2);
    });

    it('切换清晰度并保持播放位置', async () => {
        const onQualityChange = vi.fn<(...args: VideoPlayerEmits['qualityChange']) => void>();
        const { container } = renderPlayer({
            defaultQuality: '1080p',
            qualityList: [
                { label: '1080P', value: '1080p' },
                { label: '720P', value: '720p' },
            ],
            onQualityChange,
        });
        const video = getVideo(container);
        setMedia(video, { currentTime: 42, paused: false });
        const qualityItems = await openMenu(container, '1080P');
        await fireEvent.click(qualityItems.find((item) => item.textContent?.trim() === '720P') as HTMLElement);
        expect(onQualityChange).toHaveBeenCalledExactlyOnceWith('720p');
        expect(notification(container)).toHaveTextContent('切换清晰度至720P');
        video.currentTime = 0;
        await mediaEvent(video, 'loadeddata');
        expect(video.currentTime).toBe(42);
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('切换线路', async () => {
        const onRouteChange = vi.fn<(...args: VideoPlayerEmits['routeChange']) => void>();
        const { container } = renderPlayer({
            defaultRoute: 'line1',
            routeList: [
                { label: 'Line 1', value: 'line1' },
                { label: 'Line 2', value: 'line2' },
            ],
            onRouteChange,
        });
        const routeItems = await openMenu(container, 'Line 1');
        await fireEvent.click(routeItems.find((item) => item.textContent?.trim() === 'Line 2') as HTMLElement);
        expect(onRouteChange).toHaveBeenCalledExactlyOnceWith('line2');
        expect(notification(container)).toHaveTextContent('切换线路至Line 2');
    });

    it('镜像视频，并在一秒后隐藏通知', async () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        await fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(getRoot(container)).toHaveClass(`${prefixCls}-mirror`);
        expect(notification(container)).toHaveTextContent('镜像');
        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(notification(container)).toBeNull();
        expect(within(getRoot(container)).getByRole('status')).toBeInTheDocument();
        await fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(getRoot(container)).not.toHaveClass(`${prefixCls}-mirror`);
        expect(notification(container)).toHaveTextContent('取消镜像');
    });

    it('等待或卡顿期间发出通知，直到可以播放', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await mediaEvent(video, 'waiting');
        expect(notification(container)).toHaveTextContent('加载中...');
        await mediaEvent(video, 'canplay');
        expect(notification(container)).toBeNull();
        await mediaEvent(video, 'stalled');
        expect(notification(container)).toHaveTextContent('加载失败');
    });

    it('defaultPlaybackRate 作用于视频，换源重载后保持所选倍速', () => {
        const { container } = renderPlayer({ defaultPlaybackRate: 1.5 });
        const video = getVideo(container);
        expect(video.playbackRate).toBe(1.5);
        expect(video.defaultPlaybackRate).toBe(1.5);
    });

    it('切换倍速同步 defaultPlaybackRate', async () => {
        const { container } = renderPlayer({
            playbackRateList: [
                { label: '1.0x', value: 1 },
                { label: '2.0x', value: 2 },
            ],
        });
        const items = await openMenu(container, '1.0x');
        await fireEvent.click(items[1]);
        expect(getVideo(container).defaultPlaybackRate).toBe(2);
    });

    it('换源开始加载后错误遮罩消失', async () => {
        const { container, rerender } = renderPlayer();
        const video = getVideo(container);
        await mediaEvent(video, 'error');
        expect(container.querySelector(`.${prefixCls}-error`)).not.toBeNull();
        await rerender({ src: 'https://example.com/other.mp4' });
        await mediaEvent(video, 'loadstart');
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
    });

    it('时间为 0 时进度圆点在起点', async () => {
        const { container } = renderPlayer();
        await loadDuration(getVideo(container), 3);
        expect(query(container, `.${prefixCls}-progress-handle`).style.left).toBe('calc(0% - 8px)');
    });

    it('显示错误遮罩并播报', async () => {
        const { container } = renderPlayer();
        await mediaEvent(getVideo(container), 'error');
        const error = query(container, `.${prefixCls}-error`);
        expect(error).toHaveTextContent('视频加载错误');
        expect(error).toHaveClass(`${prefixCls}-error-dark`);
        expect(within(getRoot(container)).getByRole('alert')).toBe(error);
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
    });

    it('指针离开播放中的视频时隐藏控件，播放结束时显示', async () => {
        const { container } = renderPlayer();
        const root = getRoot(container);
        const controls = query(root, `.${prefixCls}-controls`);
        await fireEvent.mouseLeave(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        await mediaEvent(getVideo(root), 'play');
        await fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        await fireEvent.mouseEnter(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        await fireEvent.mouseLeave(root);
        await mediaEvent(getVideo(root), 'ended');
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(root.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('使用方的 mouseenter、mouseleave 与内部处理器都执行', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderPlayer({ onMouseenter, onMouseleave });
        const root = getRoot(container);
        await mediaEvent(getVideo(root), 'play');
        await fireEvent.mouseLeave(root);
        expect(onMouseleave).toHaveBeenCalledTimes(1);
        expect(query(root, `.${prefixCls}-controls`)).toHaveClass(`${prefixCls}-controls-hide`);
        await fireEvent.mouseEnter(root);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        expect(query(root, `.${prefixCls}-controls`)).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('仅在焦点位于播放器内时响应 Space 与方向键', async () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = getVideo(container);
        await loadDuration(video);
        await fireEvent.keyDown(document, { key: ' ' });
        await fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.play).not.toHaveBeenCalled();
        expect(video.currentTime).toBe(0);

        buttonWith(container, 'play').focus();
        await fireEvent.keyDown(document, { key: ' ' });
        expect(video.play).toHaveBeenCalledTimes(1);
        await fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.currentTime).toBe(5);
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('00:05 / 01:00');
        await fireEvent.keyDown(document, { key: 'ArrowLeft' });
        await fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(video.currentTime).toBe(0);
        expect(screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress })).toHaveAttribute('aria-valuenow', '0');
        for (let i = 0; i < 13; i++) {
            await fireEvent.keyDown(document, { key: 'ArrowRight' });
        }
        expect(video.currentTime).toBe(60);
    });

    it('进度条自身按 APG slider 处理方向键、Home、End、PageUp 与 PageDown', async () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = getVideo(container);
        await loadDuration(video);
        const slider = screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress });
        slider.focus();
        const press = async (key: string, init = {}) => {
            const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
            slider.dispatchEvent(event);
            await nextTick();
            return event.defaultPrevented;
        };

        expect(await press('End')).toBe(true);
        expect(video.currentTime).toBe(60);
        expect(slider).toHaveAttribute('aria-valuenow', '60');
        await press('Home');
        expect(video.currentTime).toBe(0);
        // the key bubbles to the document shortcut, which must leave a slider's own keys alone
        await press('ArrowRight');
        expect(video.currentTime).toBe(5);
        await press('ArrowUp');
        expect(video.currentTime).toBe(10);
        await press('ArrowDown');
        expect(video.currentTime).toBe(5);
        await press('PageUp');
        expect(video.currentTime).toBe(11);
        await press('PageDown');
        expect(video.currentTime).toBe(5);
        await press('ArrowLeft');
        await press('ArrowLeft');
        expect(video.currentTime).toBe(0);
        expect(await press('End', { altKey: true })).toBe(false);
        expect(video.currentTime).toBe(0);
        await press(' ');
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键和 Space 属于浏览器或系统快捷键，不控制播放', async (modifier) => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = getVideo(container);
        await loadDuration(video);
        buttonWith(container, 'play').focus();
        for (const key of ['ArrowLeft', 'ArrowRight', ' ']) {
            const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
            document.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        expect(video.currentTime).toBe(0);
        expect(video.play).not.toHaveBeenCalled();
    });

    it('时长变化时进度条保持同一个节点，不被卸载重建', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        const progress = query(container, `.${prefixCls}-progress`);
        await loadDuration(video, 60);
        await loadDuration(video, 120);
        expect(query(container, `.${prefixCls}-progress`)).toBe(progress);
        expect(progress).toHaveAttribute('aria-valuemax', '120');
    });

    it('Space 交给获得焦点的控件处理，不同时切换播放', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        const playButton = buttonWith(container, 'play');
        playButton.focus();
        // a native button turns Space into a click; jsdom does not, so replay it
        await fireEvent.keyDown(playButton, { key: ' ' });
        await fireEvent.click(playButton);
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('较早的通知过期时不隐藏较新的通知', async () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        await fireEvent.click(buttonWith(container, 'flip_horizontal'));
        vi.advanceTimersByTime(600);
        await fireEvent.click(buttonWith(container, 'flip_horizontal'));
        vi.advanceTimersByTime(600);
        await nextTick();
        expect(notification(container)).toHaveTextContent('取消镜像');
        vi.advanceTimersByTime(400);
        await nextTick();
        expect(notification(container)).toBeNull();
    });

    it('在外层容器进入全屏，并从全屏退出', async () => {
        const { container } = renderPlayer();
        const root = getRoot(container);
        await fireEvent.click(buttonWith(container, 'maximize'));
        expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
        expect(vi.mocked(HTMLElement.prototype.requestFullscreen).mock.contexts[0]).toBe(root);
        await setFullscreenElement(root);
        await fireEvent.click(screen.getByRole('button', { name: '退出全屏' }));
        expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('全屏下暂停时，指针停止移动三秒后控件仍显示', async () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = getRoot(container);
        const controls = query(root, `.${prefixCls}-controls`);
        await setFullscreenElement(root);
        await fireEvent.mouseMove(document);
        vi.advanceTimersByTime(3000);
        await nextTick();
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('另一个元素进出全屏时，本播放器已隐藏的控件保持隐藏', async () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = getRoot(container);
        const controls = query(root, `.${prefixCls}-controls`);
        await mediaEvent(getVideo(container), 'play');
        await fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        await setFullscreenElement(document.body);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        await setFullscreenElement(null);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('全屏下指针停止移动三秒后自动隐藏控件', async () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = getRoot(container);
        const controls = query(root, `.${prefixCls}-controls`);
        await mediaEvent(getVideo(container), 'play');
        await setFullscreenElement(root);
        await fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        vi.advanceTimersByTime(3000);
        await nextTick();
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        vi.advanceTimersByTime(300);
        await fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        await setFullscreenElement(null);
        vi.advanceTimersByTime(3500);
        await nextTick();
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        await fireEvent.mouseMove(document);
        vi.advanceTimersByTime(3500);
        await nextTick();
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('播放被打断、全屏或画中画不可用时的预期拒绝不成为未处理的拒绝', async () => {
        const unhandled = vi.fn<(reason: unknown) => void>();
        process.on('unhandledRejection', unhandled);
        const { container } = renderPlayer();
        const video = getVideo(container);
        // plain functions: a vi.fn reads the promise it returns, which marks the rejection handled
        const reject = (name: string) => () => Promise.reject(new DOMException(name, name));
        video.play = reject('AbortError');
        getRoot(container).requestFullscreen = reject('NotAllowedError');
        video.requestPictureInPicture = reject('InvalidStateError');
        await fireEvent.click(buttonWith(container, 'play'));
        await fireEvent.click(buttonWith(container, 'maximize'));
        await fireEvent.click(buttonWith(container, 'mini_player'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('请求画中画，退出时同步状态', async () => {
        const { container } = renderPlayer();
        const video = getVideo(container);
        await fireEvent.click(buttonWith(container, 'mini_player'));
        expect(video.requestPictureInPicture).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        await mediaEvent(video, 'leavepictureinpicture');
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
    });

    it('组件 ref 的 video 是原生 video 元素，$el 是根元素', () => {
        let handle: VideoPlayerHandle | undefined;
        let root: Element | undefined;
        const { container } = render(HandleHost, {
            props: {
                onReady: (ready: VideoPlayerHandle, el: Element) => {
                    handle = ready;
                    root = el;
                },
            },
        });
        expect(handle?.video).toBe(getVideo(container));
        expect(root).toBe(getRoot(container));
    });

    it('卸载后停止监听', async () => {
        const onPlay = vi.fn<() => void>();
        const { container, unmount } = renderPlayer({ onPlay });
        const video = getVideo(container);
        buttonWith(container, 'play').focus();
        unmount();
        await fireEvent.keyDown(document, { key: ' ' });
        await mediaEvent(video, 'play');
        expect(video.play).not.toHaveBeenCalled();
        expect(onPlay).not.toHaveBeenCalled();
    });

    it('KeepAlive 切走再切回后音量弹层已关闭', async () => {
        const { container } = render(CachedPlayer);
        const trigger = buttonWith(container, 'volume_2');
        trigger.focus();
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        await fireEvent.click(screen.getByText('toggle'));
        await fireEvent.click(screen.getByText('toggle'));
        expect(buttonWith(container, 'volume_2')).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    describe('属性与默认值', () => {
        it('将未知属性透传到根元素，被命名时根元素为 group', async () => {
            const { container, rerender } = renderPlayer({ 'data-testid': 'player', 'aria-label': 'Movie' });
            const root = getRoot(container);
            expect(root).toHaveAttribute('data-testid', 'player');
            expect(root).toHaveAttribute('role', 'group');
            expect(root).toHaveAccessibleName('Movie');
            await rerender({ src, 'aria-label': 'Movie', role: 'region' });
            expect(root).toHaveAttribute('role', 'region');
        });

        it('数值宽高换算为 px，字符串原样，使用方 style 覆盖宽高', async () => {
            const { container, rerender } = renderPlayer({ width: 630, height: '50%' });
            const root = getRoot(container);
            expect(root.style.width).toBe('630px');
            expect(root.style.height).toBe('50%');
            await rerender({ src, width: 630, height: '50%', style: { width: '300px' } });
            expect(root.style.width).toBe('300px');
            expect(root.style.height).toBe('50%');
        });

        it('读取全局默认属性，传入值优先', () => {
            const global = globalWith({
                VideoPlayer: {
                    theme: 'light',
                    controlsList: ['play', 'playbackRate'],
                    playbackRateList: [{ label: 'normal', value: 1 }],
                },
            });
            const { container, unmount } = render(VideoPlayer, { props: { src }, global });
            expect(query(container, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
            expect(container.querySelector(icon('maximize'))).toBeNull();
            expect(menuTexts(container)).toEqual(['normal']);
            unmount();
            const view = render(VideoPlayer, { props: { src, theme: 'dark' }, global });
            expect(query(view.container, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-dark`);
        });

        it('跟随新的 playbackRateList', async () => {
            const { container, rerender } = renderPlayer();
            await rerender({
                src,
                playbackRateList: [
                    { label: 'normal', value: 1 },
                    { label: 'fast', value: 2 },
                ],
            });
            const items = await openMenu(container, 'normal');
            expect(items.map((item) => item.textContent?.trim())).toEqual(['normal', 'fast']);
        });

        it('同一次渲染中跟随新的 controlsList 与 markers', async () => {
            const { container, rerender } = renderPlayer({ markers: [{ start: 0, title: 'A' }] });
            await loadDuration(getVideo(container));
            expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(1);
            await rerender({
                src,
                controlsList: ['play'],
                markers: [
                    { start: 0, title: 'A' },
                    { start: 30, title: 'B' },
                ],
            });
            expect(container.querySelector(icon('maximize'))).toBeNull();
            expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(2);
        });

        it('clickToPlay 为 false 时点击不切换播放', async () => {
            const { container } = renderPlayer({ clickToPlay: false });
            await fireEvent.click(getVideo(container));
            expect(getVideo(container).play).not.toHaveBeenCalled();
        });

        it('全屏状态变化时切换全屏图标', async () => {
            const { container } = renderPlayer();
            await setFullscreenElement(getRoot(container));
            expect(container.querySelector(icon('minimize'))).toBeInTheDocument();
            await setFullscreenElement(null);
            expect(container.querySelector(icon('maximize'))).toBeInTheDocument();
        });

        it('全屏时菜单挂在播放器内，菜单项上的方向键不跳转视频', async () => {
            const { container } = renderPlayer({ seekTime: 5 });
            const video = getVideo(container);
            await loadDuration(video);
            await setFullscreenElement(getRoot(container));
            const items = await openMenu(container, '1.0x');
            expect(getRoot(container)).toContainElement(items[0]);
            items[0].focus();
            await fireEvent.keyDown(items[0], { key: 'ArrowRight' });
            expect(video.currentTime).toBe(0);
        });

        it('全屏下卸载时停止跟随指针', async () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const { container, unmount } = renderPlayer();
            await setFullscreenElement(getRoot(container));
            expect(countLiveListeners(add, remove, 'mousemove')).toBe(1);
            unmount();
            expect(countLiveListeners(add, remove, 'mousemove')).toBe(0);
        });

        it('进度条捕获按下时的指针', async () => {
            const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
            const { container } = renderPlayer();
            await loadDuration(getVideo(container));
            const progress = query(container, `.${prefixCls}-progress`);
            await fireEvent.pointerDown(progress, { pointerId: 7, clientX: 0 });
            expect(capture.mock.contexts).toEqual([progress]);
            expect(capture.mock.calls).toEqual([[7]]);
        });
    });

    it('进度滑块与按钮的名称由语言包提供', () => {
        render({ render: () => <ConfigProvider locale={ja_JP}>{() => <VideoPlayer src={src} onNext={() => {}} />}</ConfigProvider> });
        expect(screen.getByRole('slider', { name: ja_JP.VideoPlayer.progress })).toBeInTheDocument();
        for (const name of ['再生', '次へ', '音量', '鏡像', '全画面', 'ピクチャーインピクチャー']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });
});

describe('VideoPlayer 类型', () => {
    it('组件事件的载荷与 React 回调参数一致，controlsList 只收控件名', () => {
        expectTypeOf<VideoPlayerEmits['play']>().toEqualTypeOf<[]>();
        expectTypeOf<VideoPlayerEmits['volumeChange']>().toEqualTypeOf<[volume: number]>();
        expectTypeOf<VideoPlayerEmits['rateChange']>().toEqualTypeOf<[rate: number]>();
        expectTypeOf<VideoControl>().toEqualTypeOf<'play' | 'next' | 'time' | 'volume' | 'playbackRate' | 'quality' | 'route' | 'mirror' | 'fullscreen' | 'pictureInPicture'>();
    });
});
