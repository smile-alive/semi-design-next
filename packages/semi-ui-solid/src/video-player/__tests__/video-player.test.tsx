import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { type Mock, type MockInstance, afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners } from '@test/utils/solid';
import VideoPlayer, { type VideoControl, type VideoPlayerMarker, type VideoPlayerOption, type VideoPlayerProps, type VideoPlayerTheme } from '..';
import semiGlobal from '../../_utils/semi-global';
import LocaleProvider from '../../locale/locale-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-videoPlayer`;
const icon = (name: string) => `.${BASE_CLASS_PREFIX}-icon-${name}`;
const src = 'https://example.com/video.mp4';

function must<T>(value?: T | null): T {
    if (value == null) {
        throw new Error('expected a value');
    }
    return value;
}
const query = <T extends Element = HTMLElement>(container: ParentNode, selector: string) => must(container.querySelector<T>(selector));
const buttonWith = (container: ParentNode, name: string) => must(query(container, icon(name)).closest('button'));
const rootOf = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const videoOf = (container: HTMLElement) => query<HTMLVideoElement>(container, 'video');
const renderPlayer = (props: Partial<VideoPlayerProps> = {}) => render(() => <VideoPlayer src={src} {...props} />);

// jsdom has no media pipeline: give the element the values a loaded file would have
function setMedia(element: HTMLElement, values: Record<string, unknown>) {
    for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(element, key, { configurable: true, writable: true, value });
    }
}

function loadDuration(video: HTMLVideoElement, duration = 60) {
    setMedia(video, { duration, currentTime: video.currentTime ?? 0 });
    fireEvent.durationChange(video);
}

// Tooltip re-checks `:hover` on the trigger after the popup opens, and jsdom never matches it
function hoverOpen(element: Element) {
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
        // closest() starts at the element itself, so it stands in for the mocked matches()
        return selector === ':hover' ? element.contains(this) : this.closest(selector) === this;
    });
    fireEvent.mouseEnter(element);
}

async function openMenu(container: HTMLElement, label: string) {
    const trigger = must([...container.querySelectorAll(`.${prefixCls}-controls-popup`)].find((item) => item.textContent === label));
    hoverOpen(trigger);
    return waitFor(() => {
        const items = document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`);
        expect(items.length).toBeGreaterThan(0);
        return [...items];
    });
}

async function openVolume(container: HTMLElement, name: string) {
    hoverOpen(buttonWith(container, name));
    return waitFor(() => {
        const found = document.querySelector<HTMLElement>(`.${prefixCls}-controls-volume`);
        expect(found).toBeInTheDocument();
        return must(found);
    });
}

function setFullscreenElement(element: Element | null) {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
    fireEvent(document, new Event('fullscreenchange'));
}

// jsdom lays nothing out: give the bars the boxes a browser would measure
function mockRects(match: (element: Element) => boolean, rect: DOMRect) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        return match(this) ? rect : new DOMRect();
    });
}
const mockProgressRect = () => mockRects((element) => element.getAttribute('role') === 'slider' && element.classList.contains(`${prefixCls}-progress`), new DOMRect(0, 0, 200, 4));
const mockVolumeRect = () => mockRects((element) => element.classList.contains(`${BASE_CLASS_PREFIX}-audio-player-slider`), new DOMRect(0, 0, 4, 120));

describe('VideoPlayer', () => {
    let play: MockInstance<() => Promise<void>>;
    let pause: MockInstance<() => void>;
    let requestFullscreen: Mock<HTMLElement['requestFullscreen']>;
    let exitFullscreen: Mock<Document['exitFullscreen']>;
    let requestPictureInPicture: Mock<HTMLVideoElement['requestPictureInPicture']>;

    beforeEach(() => {
        play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        requestFullscreen = vi.fn<HTMLElement['requestFullscreen']>(() => Promise.resolve());
        exitFullscreen = vi.fn<Document['exitFullscreen']>(() => Promise.resolve());
        requestPictureInPicture = vi.fn<HTMLVideoElement['requestPictureInPicture']>(() => Promise.resolve({} as PictureInPictureWindow));
        HTMLElement.prototype.requestFullscreen = requestFullscreen;
        document.exitFullscreen = exitFullscreen;
        HTMLVideoElement.prototype.requestPictureInPicture = requestPictureInPicture;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        semiGlobal.config.overrideDefaultProps = {};
        delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen;
        delete (document as { exitFullscreen?: unknown }).exitFullscreen;
        delete (HTMLVideoElement.prototype as { requestPictureInPicture?: unknown }).requestPictureInPicture;
        delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    });

    it('渲染视频、海报、暂停遮罩与默认控件', () => {
        const { container } = renderPlayer({ class: 'custom', style: { top: '1px' }, captionsSrc: 'https://example.com/captions.vtt', crossOrigin: 'anonymous', height: '280px', poster: 'https://example.com/poster.png', width: 500 });
        const root = rootOf(container);
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ width: '500px', height: '280px', top: '1px' });
        expect(query(root, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-dark`);
        const video = videoOf(root);
        expect(video).toHaveAttribute('src', src);
        expect(video).toHaveAttribute('crossorigin', 'anonymous');
        expect(video.autoplay).toBe(false);
        expect(video.loop).toBe(false);
        expect(video.controls).toBe(false);
        expect(query(video, 'track')).toHaveAttribute('src', 'https://example.com/captions.vtt');
        expect(query(root, `.${prefixCls}-poster`)).toHaveAttribute('src', 'https://example.com/poster.png');
        expect(query(root, `.${prefixCls}-pause`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefixCls}-resource-not-found`)).toBeNull();
        expect(root.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(query(root, `.${prefixCls}-controls`)).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(query(root, `.${prefixCls}-controls-time`)).toHaveTextContent('00:00 / 00:00');
        for (const name of ['play', 'volume_2', 'flip_horizontal', 'maximize', 'mini_player']) {
            expect(query(root, icon(name))).toBeInTheDocument();
        }
        expect(query(root, `.${prefixCls}-controls-popup`)).toHaveTextContent('1.0x');
        expect(root.querySelector(icon('restart'))).toBeNull();
        expect(root.querySelectorAll(`.${prefixCls}-controls-popup`)).toHaveLength(1);
    });

    it('字符串 style 写在 width 与 height 之后', () => {
        const { container } = renderPlayer({ style: 'top: 1px; height: 300px', height: 280, width: 500 });
        expect(rootOf(container)).toHaveStyle({ width: '500px', height: '300px', top: '1px' });
    });

    it('将 autoPlay 与 loop 传给 video，并应用浅色主题', () => {
        const { container } = renderPlayer({ autoPlay: true, loop: true, theme: 'light' });
        const video = videoOf(container);
        expect(video.autoplay).toBe(true);
        expect(video.loop).toBe(true);
        expect(query(container, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
    });

    it('仅显示 controlsList 中的控件', () => {
        const { container } = renderPlayer({ controlsList: ['play', 'fullscreen'], onNext: () => {} });
        expect(query(container, icon('play'))).toBeInTheDocument();
        expect(query(container, icon('maximize'))).toBeInTheDocument();
        for (const name of ['restart', 'volume_2', 'flip_horizontal', 'mini_player']) {
            expect(container.querySelector(icon(name))).toBeNull();
        }
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-controls-popup`)).toBeNull();
    });

    it('无 src 时显示资源缺失提示', () => {
        const { container } = render(() => <VideoPlayer />);
        expect(query(container, `.${prefixCls}-resource-not-found`)).toHaveTextContent('暂无资源');
        expect(videoOf(container)).not.toHaveAttribute('src');
    });

    it('跟随新的 src，src 被移除时保留上一个', () => {
        const [current, setCurrent] = createSignal<string | undefined>(src);
        const { container } = render(() => <VideoPlayer src={current()} />);
        setCurrent('https://example.com/other.mp4');
        expect(videoOf(container)).toHaveAttribute('src', 'https://example.com/other.mp4');
        setCurrent(undefined);
        expect(videoOf(container)).toHaveAttribute('src', 'https://example.com/other.mp4');
        expect(query(container, `.${prefixCls}-resource-not-found`)).toBeInTheDocument();
    });

    it('通过 video 元素播放与暂停，并上报原生事件', () => {
        const onPlay = vi.fn<() => void>();
        const onPause = vi.fn<() => void>();
        const { container } = renderPlayer({ poster: 'https://example.com/poster.png', onPause, onPlay });
        const video = videoOf(container);
        fireEvent.click(buttonWith(container, 'play'));
        expect(play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeNull();
        setMedia(video, { paused: false });
        fireEvent.play(video);
        expect(onPlay).toHaveBeenCalledTimes(1);
        expect(query(container, icon('pause'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-poster`)).toBeNull();

        fireEvent.click(buttonWith(container, 'pause'));
        expect(pause).toHaveBeenCalledTimes(1);
        fireEvent.pause(video);
        expect(onPause).toHaveBeenCalledTimes(1);
        expect(query(container, icon('play'))).toBeInTheDocument();
        expect(query(container, `.${prefixCls}-poster`)).toBeInTheDocument();
    });

    it('下一个按钮仅在有 onNext 且 controlsList 允许时显示，并调用 onNext', () => {
        const onNext = vi.fn<() => void>();
        const [next, setNext] = createSignal<(() => void) | undefined>(undefined);
        const [controls, setControls] = createSignal<VideoControl[] | undefined>(undefined);
        render(() => <VideoPlayer controlsList={controls()} src={src} onNext={next()} />);
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();

        setNext(() => onNext);
        fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.next }));
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(play).not.toHaveBeenCalled();

        setControls(['play']);
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();
    });

    it('点击视频时根据元素的 paused 状态切换播放', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        fireEvent.click(video);
        expect(play).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        fireEvent.click(video);
        expect(pause).toHaveBeenCalledTimes(1);
    });

    it('视频处于起止之间时隐藏海报', () => {
        const { container } = renderPlayer({ poster: 'https://example.com/poster.png' });
        const video = videoOf(container);
        loadDuration(video);
        video.currentTime = 30;
        fireEvent.timeUpdate(video);
        expect(query(container, `.${prefixCls}-poster`)).toHaveClass(`${prefixCls}-poster-hide`);
    });

    it('显示当前时间与时长', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        loadDuration(video, 3725);
        video.currentTime = 75;
        fireEvent.timeUpdate(video);
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('01:15 / 1:02:05');
    });

    it('进度条播报范围与语音时间', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        loadDuration(video, 200);
        setMedia(video, { currentTime: 65 });
        fireEvent.timeUpdate(video);
        const progress = screen.getByRole('slider', { name: '播放进度' });
        expect(progress).toHaveAttribute('aria-valuemin', '0');
        expect(progress).toHaveAttribute('aria-valuemax', '200');
        expect(progress).toHaveAttribute('aria-valuetext', '1 分 05 秒 / 3 分 20 秒');
    });

    it('元数据加载前进度条范围有效', () => {
        // a media element reports its duration as NaN until the metadata is in
        renderPlayer();
        expect(screen.getByRole('slider', { name: '播放进度' })).toHaveAttribute('aria-valuemax', '0');
    });

    it('通过进度条跳转', () => {
        mockProgressRect();
        const { container } = renderPlayer();
        const video = videoOf(container);
        loadDuration(video);
        const progress = query(container, `.${prefixCls}-progress`);
        expect(progress).toHaveAttribute('role', 'slider');
        fireEvent.pointerDown(progress, { clientX: 50 });
        expect(video.currentTime).toBe(15);
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('00:15 / 01:00');
        expect(progress).toHaveAttribute('aria-valuenow', '15');
        // the bar captures the pointer, so a browser sends it the moves and the release wherever the pointer is
        fireEvent.pointerMove(progress, { clientX: 100 });
        expect(video.currentTime).toBe(30);
        fireEvent.pointerUp(progress);
        fireEvent.lostPointerCapture(progress);
        fireEvent.pointerMove(progress, { clientX: 150 });
        expect(video.currentTime).toBe(30);
    });

    it('直播流（时长为 Infinity）下按下进度条不向 currentTime 写入非有限值', () => {
        mockProgressRect();
        const { container } = renderPlayer();
        const video = videoOf(container);
        const attempts: number[] = [];
        // a media element rejects a non-finite currentTime with a TypeError
        Object.defineProperty(video, 'currentTime', {
            configurable: true,
            get: () => 0,
            set: (value: number) => {
                attempts.push(value);
                if (!Number.isFinite(value)) {
                    throw new TypeError('The provided double value is non-finite');
                }
            },
        });
        setMedia(video, { duration: Number.POSITIVE_INFINITY });
        fireEvent.durationChange(video);
        const progress = query(container, `.${prefixCls}-progress`);
        fireEvent.pointerDown(progress, { clientX: 50 });
        fireEvent.keyDown(progress, { key: 'End' });
        expect(attempts.every(Number.isFinite)).toBe(true);
    });

    it('只有主键按下进度条才跳转', () => {
        mockProgressRect();
        const { container } = renderPlayer();
        const video = videoOf(container);
        loadDuration(video);
        const progress = query(container, `.${prefixCls}-progress`);
        fireEvent.pointerDown(progress, { clientX: 50, button: 2 });
        fireEvent.pointerDown(progress, { clientX: 50, button: 1 });
        expect(video.currentTime).toBe(0);
        fireEvent.pointerMove(progress, { clientX: 100 });
        expect(video.currentTime).toBe(0);
    });

    it('传了 captionsSrc 的字幕轨默认启用，没传时不启用', () => {
        const [captions, setCaptions] = createSignal<string | undefined>('https://example.com/captions.vtt');
        const { container } = render(() => <VideoPlayer captionsSrc={captions()} src={src} />);
        expect(query<HTMLTrackElement>(container, 'track').default).toBe(true);
        setCaptions(undefined);
        expect(query<HTMLTrackElement>(container, 'track').default).toBe(false);
    });

    it('换源加载把播放中的 video 暂停后，播放按钮回到「播放」', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        setMedia(video, { paused: false });
        fireEvent.play(video);
        expect(screen.getByRole('button', { name: zh_CN.VideoPlayer.pause })).toBeInTheDocument();
        // the load algorithm pauses the element without a pause event
        setMedia(video, { paused: true });
        fireEvent.loadStart(video);
        expect(screen.getByRole('button', { name: zh_CN.VideoPlayer.play })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.play }));
        expect(play).toHaveBeenCalledTimes(1);
    });

    it('卡顿通知在收到 progress 后消失', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        fireEvent.stalled(video);
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('加载失败');
        fireEvent.progress(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toBeNull();
    });

    it('时长已知后将标记布局在时长上', () => {
        const markers = [
            { start: 0, title: 'Intro' },
            { start: 20, title: 'Middle' },
            { start: 50, title: 'End' },
            { start: 90, title: 'Past the end' },
        ];
        const { container } = renderPlayer({ markers });
        loadDuration(videoOf(container));
        const sliders = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-progress-slider`)];
        expect(sliders).toHaveLength(3);
        expect(sliders[0]).toHaveStyle({ left: '0%' });
        expect(sliders[0].style.width).toMatch(/^33\.33/);
        expect(sliders[1].style.left).toMatch(/^33\.33/);
        expect(sliders[1].style.width).toMatch(/^50(\.0+\d*)?%$/);
        expect(sliders[2].style.left).toMatch(/^83\.33/);
        expect(sliders[2].style.width).toMatch(/^16\.66/);
    });

    it('填充每个标记中已播放与已缓冲的部分', () => {
        const { container } = renderPlayer({
            markers: [
                { start: 0, title: 'A' },
                { start: 30, title: 'B' },
            ],
        });
        const video = videoOf(container);
        loadDuration(video);
        video.currentTime = 15;
        fireEvent.timeUpdate(video);
        setMedia(video, { buffered: { length: 1, end: () => 45 } });
        fireEvent.progress(video);
        const sliders = container.querySelectorAll(`.${prefixCls}-progress-slider`);
        const fillWidth = (slider: Element, part: string) => query(slider, `.${prefixCls}-progress-slider-${part}`).style.width;
        expect(fillWidth(sliders[0], 'played')).toBe('50%');
        expect(fillWidth(sliders[1], 'played')).toBe('0%');
        expect(fillWidth(sliders[0], 'buffered')).toBe('calc(100% - 2px)');
        expect(fillWidth(sliders[1], 'buffered')).toBe('50%');
    });

    it('应用初始音量，并通过音量按钮切换静音', () => {
        const { container } = renderPlayer({ volume: 40 });
        const video = videoOf(container);
        expect(video.volume).toBe(0.4);
        expect(video.muted).toBe(false);
        expect(query(container, icon('volume_1'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'volume_1'));
        expect(video.muted).toBe(true);
        expect(video.volume).toBe(0.4);
        expect(query(container, icon('mute'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.4);
        expect(query(container, icon('volume_1'))).toBeInTheDocument();
    });

    it('静音启动后取消静音恢复原音量，音量拖到 0 后取消静音恢复到一半', async () => {
        mockVolumeRect();
        const onVolumeChange = vi.fn<(volume: number) => void>();
        const { container } = renderPlayer({ muted: true, volume: 60, onVolumeChange });
        const video = videoOf(container);
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.6);
        expect(onVolumeChange).toHaveBeenLastCalledWith(60);
        expect(query(container, icon('volume_2'))).toBeInTheDocument();

        const volume = await openVolume(container, 'volume_2');
        fireEvent.pointerDown(query(volume, `.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`), { clientY: 120 });
        expect(query(container, icon('mute'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.5);
        expect(onVolumeChange).toHaveBeenLastCalledWith(50);
    });

    it('静音切换与滑块拖动时触发 onVolumeChange，初始化时不触发', async () => {
        mockVolumeRect();
        const onVolumeChange = vi.fn<(volume: number) => void>();
        const { container } = renderPlayer({ volume: 40, onVolumeChange });
        expect(onVolumeChange).not.toHaveBeenCalled();
        fireEvent.click(buttonWith(container, 'volume_1'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(0);
        fireEvent.click(buttonWith(container, 'mute'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(40);
        expect(onVolumeChange).toHaveBeenCalledTimes(2);

        const volume = await openVolume(container, 'volume_1');
        const wrapper = query(volume, `.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`);
        fireEvent.pointerDown(wrapper, { clientY: 102 });
        expect(onVolumeChange).toHaveBeenLastCalledWith(15);
        fireEvent.pointerMove(wrapper, { clientY: 102 });
        expect(onVolumeChange).toHaveBeenCalledTimes(3);
        fireEvent.pointerMove(wrapper, { clientY: 120 });
        expect(onVolumeChange).toHaveBeenLastCalledWith(0);
        expect(onVolumeChange).toHaveBeenCalledTimes(4);
    });

    it('静音启动时不触发 onVolumeChange', () => {
        const onVolumeChange = vi.fn<(volume: number) => void>();
        renderPlayer({ muted: true, onVolumeChange });
        expect(onVolumeChange).not.toHaveBeenCalled();
    });

    it('静音启动', () => {
        const { container } = renderPlayer({ muted: true });
        // the muted flag, which also lets autoPlay start under the browser's autoplay policy
        expect(videoOf(container).muted).toBe(true);
        expect(query(container, icon('mute'))).toBeInTheDocument();
    });

    it('通过 popover 中的滑块设置音量', async () => {
        mockVolumeRect();
        const { container } = renderPlayer();
        const video = videoOf(container);
        const volume = await openVolume(container, 'volume_2');
        const title = query(volume, `.${prefixCls}-controls-volume-title`);
        expect(title).toHaveTextContent('100%');
        fireEvent.pointerDown(query(volume, `.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`), { clientY: 102 });
        expect(video.volume).toBe(0.15);
        expect(title).toHaveTextContent('15%');
        expect(query(container, icon('volume_1'))).toBeInTheDocument();
    });

    it('倍速、清晰度、线路是单选菜单，按钮名称为用途加当前值，当前值为空时只有用途', async () => {
        const names = en_US.VideoPlayer;
        const { container } = render(() => (
            <LocaleProvider locale={en_US}>
                <VideoPlayer defaultRoute="line1" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} src={src} />
            </LocaleProvider>
        ));
        expect(screen.getByRole('button', { name: `${names.playbackRate} 1.0x` })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: names.quality })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `${names.route} Line 1` })).toBeInTheDocument();
        const items = await openMenu(container, '1.0x');
        expect(items.every((item) => item.getAttribute('role') === 'menuitemradio')).toBe(true);
        const checked = items.filter((item) => item.getAttribute('aria-checked') === 'true');
        expect(checked.map((item) => item.textContent)).toEqual(['1.0x']);
        fireEvent.click(items[0]);
        expect(screen.getByRole('button', { name: `${names.playbackRate} 2.0x` })).toBeInTheDocument();
    });

    it('通过菜单修改播放速率并显示通知', async () => {
        const onRateChange = vi.fn<(rate: number) => void>();
        const { container } = renderPlayer({
            defaultPlaybackRate: 1.5,
            playbackRateList: [
                { label: '0.5x', value: 0.5 },
                { label: '1.5x', value: 1.5 },
                { label: '3.0x', value: 3 },
            ],
            onRateChange,
        });
        const video = videoOf(container);
        const items = await openMenu(container, '1.5x');
        expect(items.map((item) => item.textContent)).toEqual(['0.5x', '1.5x', '3.0x']);
        fireEvent.click(items[2]);
        expect(video.playbackRate).toBe(3);
        expect(onRateChange).toHaveBeenCalledWith(3);
        expect(query(container, `.${prefixCls}-controls-popup`)).toHaveTextContent('3.0x');
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('切换速率至 3.0x');
    });

    it('通过原生按钮用键盘打开速率、清晰度与线路菜单', async () => {
        const onRateChange = vi.fn<(rate: number) => void>();
        const { container } = renderPlayer({ defaultQuality: '1080p', defaultRoute: 'line1', qualityList: [{ label: '1080P', value: '1080p' }], routeList: [{ label: 'Line 1', value: 'line1' }], onRateChange });
        const triggers = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup`)];
        expect(triggers.map((item) => item.textContent)).toEqual(['1.0x', '1080P', 'Line 1']);
        for (const trigger of triggers) {
            expect(trigger.tagName).toBe('BUTTON');
            expect(trigger).toHaveAttribute('type', 'button');
            expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        }
        triggers[0].focus();
        await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
        fireEvent.keyDown(triggers[0], { key: 'ArrowDown' });
        const items = [...document.querySelectorAll(`.${prefixCls}-controls-popup-menu-item`)];
        expect(items[0]).toHaveFocus();
        fireEvent.keyDown(items[0], { key: 'Enter' });
        expect(onRateChange).toHaveBeenCalledWith(2);
    });

    it('音量按钮获得焦点时打开音量弹层', async () => {
        const { container } = renderPlayer();
        const trigger = buttonWith(container, 'volume_2');
        expect(trigger).toHaveAttribute('type', 'button');
        trigger.focus();
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-controls-volume`)).toBeInTheDocument());
    });

    it('音量弹层是名为音量的对话框', async () => {
        const { container } = renderPlayer();
        const trigger = buttonWith(container, 'volume_2');
        // the popup holds a focusable range, which a tooltip may not
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        trigger.focus();
        const dialog = await waitFor(() => screen.getByRole('dialog', { name: zh_CN.VideoPlayer.volume }));
        expect(dialog).toContainElement(query(document.body, `.${prefixCls}-controls-volume`));
    });

    it('切换清晰度并保持播放位置', async () => {
        const onQualityChange = vi.fn<(quality: string) => void>();
        const { container } = renderPlayer({
            defaultQuality: '1080p',
            qualityList: [
                { label: '1080P', value: '1080p' },
                { label: '720P', value: '720p' },
            ],
            onQualityChange,
        });
        const video = videoOf(container);
        setMedia(video, { currentTime: 42, paused: false });
        const qualityItems = await openMenu(container, '1080P');
        fireEvent.click(must(qualityItems.find((item) => item.textContent === '720P')));
        expect(onQualityChange).toHaveBeenCalledWith('720p');
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('切换清晰度至720P');
        video.currentTime = 0;
        fireEvent(video, new Event('loadeddata'));
        expect(video.currentTime).toBe(42);
        expect(play).toHaveBeenCalledTimes(1);
    });

    it('切换线路', async () => {
        const onRouteChange = vi.fn<(route: string) => void>();
        const { container } = renderPlayer({
            defaultRoute: 'line1',
            routeList: [
                { label: 'Line 1', value: 'line1' },
                { label: 'Line 2', value: 'line2' },
            ],
            onRouteChange,
        });
        const routeItems = await openMenu(container, 'Line 1');
        fireEvent.click(must(routeItems.find((item) => item.textContent === 'Line 2')));
        expect(onRouteChange).toHaveBeenCalledWith('line2');
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('切换线路至Line 2');
    });

    it('镜像视频，并在一秒后隐藏通知', () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(rootOf(container)).toHaveClass(`${prefixCls}-mirror`);
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('镜像');
        vi.advanceTimersByTime(1000);
        expect(container.querySelector(`.${prefixCls}-notification`)).toBeNull();
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(rootOf(container)).not.toHaveClass(`${prefixCls}-mirror`);
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('取消镜像');
    });

    it('等待或卡顿期间发出通知，直到可以播放', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        fireEvent.waiting(video);
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('加载中...');
        fireEvent.canPlay(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toBeNull();
        fireEvent.stalled(video);
        expect(query(container, `.${prefixCls}-notification`)).toHaveTextContent('加载失败');
    });

    it('通知放在常驻的 status 区域，错误遮罩是 alert', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        // a live region must exist before its content changes for the change to be announced
        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();
        fireEvent.waiting(video);
        expect(status).toHaveTextContent(zh_CN.VideoPlayer.loading);
        fireEvent.canPlay(video);
        expect(screen.getByRole('status')).toBe(status);
        expect(status).toBeEmptyDOMElement();
        fireEvent.error(video);
        expect(screen.getByRole('alert')).toHaveTextContent(zh_CN.VideoPlayer.videoError);
    });

    it('defaultPlaybackRate 作用于视频，换源重载后保持所选倍速', () => {
        const { container } = renderPlayer({ defaultPlaybackRate: 1.5 });
        const video = videoOf(container);
        expect(video.playbackRate).toBe(1.5);
        expect(video.defaultPlaybackRate).toBe(1.5);
    });

    it('当前值不在列表中时按钮显示该值并计入可访问名称', () => {
        const { container } = renderPlayer({ defaultPlaybackRate: 0.5 });
        const button = query(container, `.${prefixCls}-controls-popup`);
        expect(button).toHaveTextContent('0.5');
        expect(button.getAttribute('aria-label')).toMatch(/ 0\.5$/);
    });

    it('切换倍速同步 defaultPlaybackRate', async () => {
        const { container } = renderPlayer({
            playbackRateList: [
                { label: '1.0x', value: 1 },
                { label: '2.0x', value: 2 },
            ],
        });
        const items = await openMenu(container, '1.0x');
        fireEvent.click(items[1]);
        expect(videoOf(container).defaultPlaybackRate).toBe(2);
    });

    it('换源开始加载后错误遮罩消失', () => {
        const [current, setCurrent] = createSignal(src);
        const { container } = render(() => <VideoPlayer src={current()} />);
        const video = videoOf(container);
        fireEvent.error(video);
        expect(container.querySelector(`.${prefixCls}-error`)).not.toBeNull();
        setCurrent('https://example.com/other.mp4');
        fireEvent.loadStart(video);
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
    });

    it('时间为 0 时进度圆点在起点', () => {
        const { container } = renderPlayer();
        loadDuration(videoOf(container), 3);
        expect(query(container, `.${prefixCls}-progress-handle`).style.left).toBe('calc(0% - 8px)');
    });

    it('显示错误遮罩', () => {
        const { container } = renderPlayer();
        fireEvent.error(videoOf(container));
        expect(query(container, `.${prefixCls}-error`)).toHaveTextContent('视频加载错误');
        expect(query(container, `.${prefixCls}-error`)).toHaveClass(`${prefixCls}-error-dark`);
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
    });

    it('使用方的 onMouseEnter 与 onMouseLeave 与控制栏显隐一起执行', () => {
        const onMouseEnter = vi.fn<(event: MouseEvent) => void>();
        const onMouseLeave = vi.fn<(event: MouseEvent) => void>();
        const { container } = renderPlayer({ onMouseEnter, onMouseLeave });
        const root = rootOf(container);
        const controls = query(root, `.${prefixCls}-controls`);
        fireEvent.play(videoOf(root));
        fireEvent.mouseLeave(root);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseEnter(root);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('指针离开播放中的视频时隐藏控件，播放结束时显示', () => {
        const { container } = renderPlayer();
        const root = rootOf(container);
        const controls = query(root, `.${prefixCls}-controls`);
        fireEvent.mouseLeave(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.play(videoOf(root));
        fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseEnter(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseLeave(root);
        fireEvent.ended(videoOf(root));
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(query(root, icon('play'))).toBeInTheDocument();
    });

    it('仅在焦点位于播放器内时响应 Space 与方向键', () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = videoOf(container);
        loadDuration(video);
        fireEvent.keyDown(document, { key: ' ' });
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(play).not.toHaveBeenCalled();
        expect(video.currentTime).toBe(0);

        buttonWith(container, 'play').focus();
        fireEvent.keyDown(document, { key: ' ' });
        expect(play).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.currentTime).toBe(5);
        expect(query(container, `.${prefixCls}-controls-time`)).toHaveTextContent('00:05 / 01:00');
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(video.currentTime).toBe(0);
        expect(screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress })).toHaveAttribute('aria-valuenow', '0');
        for (let i = 0; i < 13; i++) {
            fireEvent.keyDown(document, { key: 'ArrowRight' });
        }
        expect(video.currentTime).toBe(60);
    });

    it('时长未知时跳转只钳制下限', () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = videoOf(container);
        setMedia(video, { currentTime: 0, duration: NaN });
        buttonWith(container, 'play').focus();
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(video.currentTime).toBe(0);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.currentTime).toBe(5);
    });

    it('进度条自身按 APG slider 处理方向键、Home、End、PageUp 与 PageDown', () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = videoOf(container);
        loadDuration(video);
        const slider = screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress });
        slider.focus();
        const press = (key: string, init = {}) => fireEvent.keyDown(slider, { key, ...init });

        expect(press('End')).toBe(false);
        expect(video.currentTime).toBe(60);
        expect(slider).toHaveAttribute('aria-valuenow', '60');
        press('Home');
        expect(video.currentTime).toBe(0);
        // the key bubbles to the document shortcut, which leaves a slider's own keys alone: one step, not two
        press('ArrowRight');
        expect(video.currentTime).toBe(5);
        press('ArrowUp');
        expect(video.currentTime).toBe(10);
        press('ArrowDown');
        expect(video.currentTime).toBe(5);
        press('PageUp');
        expect(video.currentTime).toBe(11);
        press('PageDown');
        expect(video.currentTime).toBe(5);
        press('ArrowLeft');
        press('ArrowLeft');
        expect(video.currentTime).toBe(0);
        expect(press('End', { altKey: true })).toBe(true);
        expect(video.currentTime).toBe(0);
        press(' ');
        expect(play).toHaveBeenCalledTimes(1);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键和 Space 属于浏览器或系统快捷键，不控制播放', (modifier) => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = videoOf(container);
        loadDuration(video);
        buttonWith(container, 'play').focus();

        for (const key of ['ArrowLeft', 'ArrowRight', ' ']) {
            const notPrevented = fireEvent.keyDown(document, { key, [modifier]: true });
            expect(notPrevented).toBe(true);
        }

        expect(video.currentTime).toBe(0);
        expect(play).not.toHaveBeenCalled();
    });

    it('时长变化时进度条保持同一个节点，不被卸载重建', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        const progress = query(container, `.${prefixCls}-progress`);

        loadDuration(video, 60);
        loadDuration(video, 120);

        expect(query(container, `.${prefixCls}-progress`)).toBe(progress);
        expect(progress).toHaveAttribute('aria-valuemax', '120');
    });

    it('Space 交给获得焦点的控件处理，不同时切换播放', () => {
        const { container } = renderPlayer();
        const playButton = buttonWith(container, 'play');
        playButton.focus();
        // a native button turns Space into a click; jsdom does not, so replay it
        fireEvent.keyDown(playButton, { key: ' ' });
        fireEvent.click(playButton);
        expect(play).toHaveBeenCalledTimes(1);
    });

    it('较早的通知过期时不隐藏较新的通知', () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const notification = () => container.querySelector(`.${prefixCls}-notification`);
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        vi.advanceTimersByTime(600);
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        vi.advanceTimersByTime(600);
        expect(notification()).toHaveTextContent('取消镜像');
        vi.advanceTimersByTime(400);
        expect(notification()).toBeNull();
    });

    it('在外层容器进入全屏，并从全屏退出', () => {
        const { container } = renderPlayer();
        const root = rootOf(container);
        fireEvent.click(buttonWith(container, 'maximize'));
        expect(requestFullscreen).toHaveBeenCalledTimes(1);
        expect(requestFullscreen.mock.contexts[0]).toBe(root);
        setFullscreenElement(root);
        fireEvent.click(buttonWith(container, 'minimize'));
        expect(exitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('全屏下暂停时，指针停止移动三秒后控件仍显示', () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = rootOf(container);
        const controls = query(root, `.${prefixCls}-controls`);
        setFullscreenElement(root);
        fireEvent.mouseMove(document);
        vi.advanceTimersByTime(3000);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('另一个元素进出全屏时，本播放器已隐藏的控件保持隐藏', () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = rootOf(container);
        const controls = query(root, `.${prefixCls}-controls`);
        fireEvent.play(videoOf(container));
        fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(document.body);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(null);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('全屏下指针停止移动三秒后自动隐藏控件', () => {
        vi.useFakeTimers();
        const { container } = renderPlayer();
        const root = rootOf(container);
        const controls = query(root, `.${prefixCls}-controls`);
        fireEvent.play(videoOf(container));
        setFullscreenElement(root);
        fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        vi.advanceTimersByTime(3000);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        vi.advanceTimersByTime(300);
        fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(null);
        vi.advanceTimersByTime(3500);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseMove(document);
        vi.advanceTimersByTime(3500);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('播放被打断、全屏或画中画不可用时的预期拒绝不成为未处理的拒绝', async () => {
        const unhandled = vi.fn<(reason: unknown) => void>();
        process.on('unhandledRejection', unhandled);
        const { container } = renderPlayer();
        const video = videoOf(container);
        // plain functions: a vi.fn reads the promise it returns, which marks the rejection handled
        const reject = (name: string) => () => Promise.reject(new DOMException(name, name));
        video.play = reject('AbortError');
        rootOf(container).requestFullscreen = reject('NotAllowedError');
        video.requestPictureInPicture = reject('InvalidStateError');
        fireEvent.click(buttonWith(container, 'play'));
        fireEvent.click(buttonWith(container, 'maximize'));
        fireEvent.click(buttonWith(container, 'mini_player'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('请求画中画，退出时同步状态', () => {
        const { container } = renderPlayer();
        const video = videoOf(container);
        fireEvent.click(buttonWith(container, 'mini_player'));
        expect(requestPictureInPicture).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        fireEvent(video, new Event('leavepictureinpicture'));
        expect(query(container, icon('pause'))).toBeInTheDocument();
    });

    it('ref 指向 video 元素，不是根元素', () => {
        let element: HTMLVideoElement | undefined;
        const { container } = renderPlayer({ ref: (node) => (element = node) });
        expect(element).toBe(videoOf(container));
    });

    it('卸载后停止监听', () => {
        const onPlay = vi.fn<() => void>();
        const onPause = vi.fn<() => void>();
        const { container, unmount } = renderPlayer({ onPause, onPlay });
        const video = videoOf(container);
        buttonWith(container, 'play').focus();
        unmount();
        fireEvent.keyDown(document, { key: ' ' });
        // a browser pauses a playing media element once it leaves the document
        fireEvent.play(video);
        fireEvent.pause(video);
        expect(play).not.toHaveBeenCalled();
        expect(onPlay).not.toHaveBeenCalled();
        expect(onPause).not.toHaveBeenCalled();
    });

    it('将未知属性透传到根元素', () => {
        const { container } = renderPlayer({ 'data-testid': 'player', 'aria-label': 'Movie' } as Partial<VideoPlayerProps>);
        expect(rootOf(container)).toHaveAttribute('data-testid', 'player');
        expect(rootOf(container)).toHaveAttribute('aria-label', 'Movie');
    });

    it('根元素被命名时成为 group，使用方给出的 role 优先', () => {
        const [role, setRole] = createSignal<VideoPlayerProps['role']>(undefined);
        const [label, setLabel] = createSignal<string | undefined>('课程视频');
        render(() => <VideoPlayer aria-label={label()} role={role()} src={src} />);
        expect(screen.getByRole('group', { name: '课程视频' })).toHaveClass(prefixCls);
        setRole('application');
        expect(screen.getByRole('application', { name: '课程视频' })).toHaveClass(prefixCls);
        setRole(undefined);
        setLabel(undefined);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('role');
    });

    it('读取全局默认属性', () => {
        semiGlobal.config.overrideDefaultProps = { VideoPlayer: { theme: 'light', controlsList: ['play'] } };
        const { container } = renderPlayer();
        expect(query(container, `.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
        expect(container.querySelector(icon('maximize'))).toBeNull();
    });

    it('跟随新的 playbackRateList', async () => {
        const [list, setList] = createSignal<VideoPlayerOption<number>[] | undefined>(undefined);
        const { container } = render(() => <VideoPlayer playbackRateList={list()} src={src} />);
        setList([
            { label: 'normal', value: 1 },
            { label: 'fast', value: 2 },
        ]);
        const items = await openMenu(container, 'normal');
        expect(items.map((item) => item.textContent)).toEqual(['normal', 'fast']);
    });

    it('同一次更新中跟随新的 controlsList 与 markers', () => {
        const [controls, setControls] = createSignal<VideoControl[] | undefined>(undefined);
        const [markers, setMarkers] = createSignal<VideoPlayerMarker[]>([{ start: 0, title: 'A' }]);
        const { container } = render(() => <VideoPlayer controlsList={controls()} markers={markers()} src={src} />);
        loadDuration(videoOf(container));
        expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(1);
        setControls(['play']);
        setMarkers([
            { start: 0, title: 'A' },
            { start: 30, title: 'B' },
        ]);
        expect(container.querySelector(icon('maximize'))).toBeNull();
        expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(2);
    });

    it('clickToPlay 为 false 时点击不切换播放', () => {
        const { container } = renderPlayer({ clickToPlay: false });
        fireEvent.click(videoOf(container));
        expect(play).not.toHaveBeenCalled();
    });

    it('全屏状态变化时切换全屏图标', () => {
        const { container } = renderPlayer();
        setFullscreenElement(rootOf(container));
        expect(query(container, icon('minimize'))).toBeInTheDocument();
        setFullscreenElement(null);
        expect(query(container, icon('maximize'))).toBeInTheDocument();
    });

    it('全屏时菜单挂在播放器内，菜单项上的方向键不跳转视频', async () => {
        const { container } = renderPlayer({ seekTime: 5 });
        const video = videoOf(container);
        loadDuration(video);
        setFullscreenElement(rootOf(container));
        const items = await openMenu(container, '1.0x');
        // outside the fullscreen element the menu would get no pointer events
        expect(rootOf(container)).toContainElement(items[0]);
        items[0].focus();
        fireEvent.keyDown(items[0], { key: 'ArrowRight' });
        expect(video.currentTime).toBe(0);
    });

    it('全屏下卸载时停止跟随指针', () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const { container, unmount } = renderPlayer();
        setFullscreenElement(rootOf(container));
        expect(countLiveListeners(add, remove, 'mousemove')).toBe(1);
        unmount();
        expect(countLiveListeners(add, remove, 'mousemove')).toBe(0);
    });

    it('进度条捕获按下时的指针', () => {
        const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
        const { container } = renderPlayer();
        loadDuration(videoOf(container));
        const progress = query(container, `.${prefixCls}-progress`);
        fireEvent.pointerDown(progress, { pointerId: 7, clientX: 0 });
        expect(capture.mock.contexts).toEqual([progress]);
        expect(capture.mock.calls).toEqual([[7]]);
    });

    it('进度滑块的名称由语言包提供', () => {
        renderPlayer();
        expect(screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress })).toBeInTheDocument();
    });
});

describe('VideoPlayer 类型', () => {
    it('不接受永远不会触发的媒体事件回调，保留自有回调', () => {
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('onTimeUpdate');
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('onEnded');
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('on:play');
        expectTypeOf<VideoPlayerProps>().toHaveProperty('onClick');
        expectTypeOf<NonNullable<VideoPlayerProps['onPlay']>>().toEqualTypeOf<() => void>();
        expectTypeOf<NonNullable<VideoPlayerProps['onVolumeChange']>>().toEqualTypeOf<(volume: number) => void>();
    });

    it('controlsList 与 theme 只接受已有的控件名与主题', () => {
        expectTypeOf<NonNullable<VideoPlayerProps['controlsList']>>().toEqualTypeOf<VideoControl[]>();
        expectTypeOf<NonNullable<VideoPlayerProps['theme']>>().toEqualTypeOf<VideoPlayerTheme>();
        expectTypeOf<'pictureInPicture'>().toExtend<VideoControl>();
        expectTypeOf<'plya'>().not.toExtend<VideoControl>();
        expectTypeOf<'blue'>().not.toExtend<VideoPlayerTheme>();
    });
});
