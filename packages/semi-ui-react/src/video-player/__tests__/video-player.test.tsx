import { StrictMode, createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { countLiveListeners } from '@test/utils/react';
import VideoPlayer, { type VideoControl, type VideoPlayerProps, type VideoPlayerTheme } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-videoPlayer`;
const icon = (name) => `.${BASE_CLASS_PREFIX}-icon-${name}`;
const buttonWith = (container, name) => container.querySelector(icon(name)).closest('button');
const src = 'https://example.com/video.mp4';

// jsdom has no media pipeline: give the element the values a loaded file would have
function setMedia(element, values) {
    for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(element, key, { configurable: true, writable: true, value });
    }
}

function loadDuration(video, duration = 60) {
    setMedia(video, { duration, currentTime: video.currentTime ?? 0 });
    fireEvent.durationChange(video);
}

// Tooltip re-checks `:hover` on the trigger after the popup opens, and jsdom never matches it
function hoverOpen(element) {
    const realMatches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
        return selector === ':hover' ? element.contains(this) : realMatches.call(this, selector);
    });
    fireEvent.mouseEnter(element);
}

async function openMenu(container, label) {
    const trigger = [...container.querySelectorAll(`.${prefixCls}-controls-popup`)].find((item) => item.textContent === label);
    hoverOpen(trigger);
    return waitFor(() => {
        const items = document.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup-menu-item`);
        expect(items.length).toBeGreaterThan(0);
        return [...items];
    });
}

function setFullscreenElement(element) {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
    fireEvent(document, new Event('fullscreenchange'));
}

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
        const { container } = render(<VideoPlayer className="custom" style={{ top: '1px' }} captionsSrc="https://example.com/captions.vtt" crossOrigin="anonymous" height="280px" poster="https://example.com/poster.png" src={src} width={500} />);
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass(prefixCls, 'custom');
        expect(root).toHaveStyle({ width: '500px', height: '280px', top: '1px' });
        expect(root.querySelector(`.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-dark`);
        const video = root.querySelector('video');
        expect(video).toHaveAttribute('src', src);
        expect(video).toHaveAttribute('crossorigin', 'anonymous');
        expect(video.autoplay).toBe(false);
        expect(video.loop).toBe(false);
        expect(video.controls).toBe(false);
        expect(video.querySelector('track')).toHaveAttribute('src', 'https://example.com/captions.vtt');
        expect(root.querySelector(`.${prefixCls}-poster`)).toHaveAttribute('src', 'https://example.com/poster.png');
        expect(root.querySelector(`.${prefixCls}-pause`)).toBeInTheDocument();
        expect(root.querySelector(`.${prefixCls}-resource-not-found`)).toBeNull();
        expect(root.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(root.querySelector(`.${prefixCls}-controls`)).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(root.querySelector(`.${prefixCls}-controls-time`)).toHaveTextContent('00:00 / 00:00');
        for (const name of ['play', 'volume_2', 'flip_horizontal', 'maximize', 'mini_player']) {
            expect(root.querySelector(icon(name))).toBeInTheDocument();
        }
        expect(root.querySelector(`.${prefixCls}-controls-popup`)).toHaveTextContent('1.0x');
        expect(root.querySelector(icon('restart'))).toBeNull();
        expect(root.querySelectorAll(`.${prefixCls}-controls-popup`)).toHaveLength(1);
    });

    it('将 autoPlay 与 loop 传给 video，并应用浅色主题', () => {
        const { container } = render(<VideoPlayer autoPlay loop src={src} theme="light" />);
        const video = container.querySelector('video');
        expect(video.autoplay).toBe(true);
        expect(video.loop).toBe(true);
        expect(container.querySelector(`.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
    });

    it('仅显示 controlsList 中的控件', () => {
        const { container } = render(<VideoPlayer controlsList={['play', 'fullscreen']} src={src} onNext={() => {}} />);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(container.querySelector(icon('maximize'))).toBeInTheDocument();
        for (const name of ['restart', 'volume_2', 'flip_horizontal', 'mini_player']) {
            expect(container.querySelector(icon(name))).toBeNull();
        }
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-controls-popup`)).toBeNull();
    });

    it('无 src 时显示资源缺失提示', () => {
        const { container } = render(<VideoPlayer />);
        expect(container.querySelector(`.${prefixCls}-resource-not-found`)).toHaveTextContent('暂无资源');
        expect(container.querySelector('video')).not.toHaveAttribute('src');
    });

    it('跟随新的 src，src 被移除时保留上一个', () => {
        const { container, rerender } = render(<VideoPlayer src={src} />);
        rerender(<VideoPlayer src="https://example.com/other.mp4" />);
        expect(container.querySelector('video')).toHaveAttribute('src', 'https://example.com/other.mp4');
        rerender(<VideoPlayer />);
        expect(container.querySelector('video')).toHaveAttribute('src', 'https://example.com/other.mp4');
        expect(container.querySelector(`.${prefixCls}-resource-not-found`)).toBeInTheDocument();
    });

    it('通过 video 元素播放与暂停，并上报原生事件', () => {
        const onPlay = vi.fn<() => void>();
        const onPause = vi.fn<() => void>();
        const { container } = render(<VideoPlayer poster="https://example.com/poster.png" src={src} onPause={onPause} onPlay={onPlay} />);
        const video = container.querySelector('video');
        fireEvent.click(buttonWith(container, 'play'));
        expect(video.play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeNull();
        setMedia(video, { paused: false });
        fireEvent.play(video);
        expect(onPlay).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-poster`)).toBeNull();

        fireEvent.click(buttonWith(container, 'pause'));
        expect(video.pause).toHaveBeenCalledTimes(1);
        fireEvent.pause(video);
        expect(onPause).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-poster`)).toBeInTheDocument();
    });

    it('下一个按钮仅在有 onNext 且 controlsList 允许时显示，并调用 onNext', () => {
        const { container, rerender } = render(<VideoPlayer src={src} />);
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();

        const onNext = vi.fn<() => void>();
        rerender(<VideoPlayer src={src} onNext={onNext} />);
        const next = screen.getByRole('button', { name: zh_CN.VideoPlayer.next });
        fireEvent.click(next);
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(container.querySelector('video').play).not.toHaveBeenCalled();

        rerender(<VideoPlayer controlsList={['play']} src={src} onNext={onNext} />);
        expect(screen.queryByRole('button', { name: zh_CN.VideoPlayer.next })).toBeNull();
    });

    it('点击视频时根据元素的 paused 状态切换播放', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        fireEvent.click(video);
        expect(video.play).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        fireEvent.click(video);
        expect(video.pause).toHaveBeenCalledTimes(1);
    });

    it('视频处于起止之间时隐藏海报', () => {
        const { container } = render(<VideoPlayer poster="https://example.com/poster.png" src={src} />);
        const video = container.querySelector('video');
        loadDuration(video);
        video.currentTime = 30;
        fireEvent.timeUpdate(video);
        expect(container.querySelector(`.${prefixCls}-poster`)).toHaveClass(`${prefixCls}-poster-hide`);
    });

    it('显示当前时间与时长', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        loadDuration(video, 3725);
        video.currentTime = 75;
        fireEvent.timeUpdate(video);
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toHaveTextContent('01:15 / 1:02:05');
    });

    it('进度条播报范围与语音时间', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
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
        render(<VideoPlayer src={src} />);
        expect(screen.getByRole('slider', { name: '播放进度' })).toHaveAttribute('aria-valuemax', '0');
    });

    it('通过进度条跳转', () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        loadDuration(video);
        const progress = container.querySelector(`.${prefixCls}-progress`);
        expect(progress).toHaveAttribute('role', 'slider');
        fireEvent.pointerDown(progress, { clientX: 50 });
        expect(video.currentTime).toBe(15);
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toHaveTextContent('00:15 / 01:00');
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
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
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
        fireEvent.durationChange(video);
        const progress = container.querySelector(`.${prefixCls}-progress`);
        fireEvent.pointerDown(progress, { clientX: 50 });
        fireEvent.keyDown(progress, { key: 'End' });
        expect(attempts.every(Number.isFinite)).toBe(true);
    });

    it('只有主键按下进度条才跳转', () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.getAttribute('role') === 'slider' ? new DOMRect(0, 0, 200, 4) : real.call(this);
        });
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        loadDuration(video);
        const progress = container.querySelector(`.${prefixCls}-progress`);
        fireEvent.pointerDown(progress, { clientX: 50, button: 2 });
        fireEvent.pointerDown(progress, { clientX: 50, button: 1 });
        expect(video.currentTime).toBe(0);
        fireEvent.pointerMove(progress, { clientX: 100 });
        expect(video.currentTime).toBe(0);
    });

    it('传了 captionsSrc 的字幕轨默认启用，没传时不启用', () => {
        const { container, rerender } = render(<VideoPlayer captionsSrc="https://example.com/captions.vtt" src={src} />);
        expect(container.querySelector('track').default).toBe(true);
        rerender(<VideoPlayer src={src} />);
        expect(container.querySelector('track').default).toBe(false);
    });

    it('换源加载把播放中的 video 暂停后，播放按钮回到「播放」', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        setMedia(video, { paused: false });
        fireEvent.play(video);
        expect(screen.getByRole('button', { name: zh_CN.VideoPlayer.pause })).toBeInTheDocument();
        // the load algorithm pauses the element without a pause event
        setMedia(video, { paused: true });
        fireEvent.loadStart(video);
        expect(screen.getByRole('button', { name: zh_CN.VideoPlayer.play })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: zh_CN.VideoPlayer.play }));
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('卡顿通知在收到 progress 后消失', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        fireEvent.stalled(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('加载失败');
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
        const { container } = render(<VideoPlayer markers={markers} src={src} />);
        loadDuration(container.querySelector('video'));
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
        const { container } = render(
            <VideoPlayer
                markers={[
                    { start: 0, title: 'A' },
                    { start: 30, title: 'B' },
                ]}
                src={src}
            />
        );
        const video = container.querySelector('video');
        loadDuration(video);
        video.currentTime = 15;
        fireEvent.timeUpdate(video);
        setMedia(video, { buffered: { length: 1, end: () => 45 } });
        fireEvent.progress(video);
        const sliders = container.querySelectorAll(`.${prefixCls}-progress-slider`);
        const fillWidth = (slider: Element, part: string) => slider.querySelector<HTMLElement>(`.${prefixCls}-progress-slider-${part}`).style.width;
        expect(fillWidth(sliders[0], 'played')).toBe('50%');
        expect(fillWidth(sliders[1], 'played')).toBe('0%');
        expect(fillWidth(sliders[0], 'buffered')).toBe('calc(100% - 2px)');
        expect(fillWidth(sliders[1], 'buffered')).toBe('50%');
    });

    it('应用初始音量，并通过音量按钮切换静音', () => {
        const { container } = render(<VideoPlayer src={src} volume={40} />);
        const video = container.querySelector('video');
        expect(video.volume).toBe(0.4);
        expect(video.muted).toBe(false);
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'volume_1'));
        expect(video.muted).toBe(true);
        expect(video.volume).toBe(0.4);
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.4);
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
    });

    it('静音启动后取消静音恢复原音量，音量拖到 0 后取消静音恢复到一半', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.classList.contains(`${BASE_CLASS_PREFIX}-audio-player-slider`) ? new DOMRect(0, 0, 4, 120) : real.call(this);
        });
        const onVolumeChange = vi.fn<(volume: number) => void>();
        const { container } = render(<VideoPlayer muted src={src} volume={60} onVolumeChange={onVolumeChange} />);
        const video = container.querySelector('video');
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.6);
        expect(onVolumeChange).toHaveBeenLastCalledWith(60);
        expect(container.querySelector(icon('volume_2'))).toBeInTheDocument();

        hoverOpen(buttonWith(container, 'volume_2'));
        const wrapper = await waitFor(() => {
            const found = document.querySelector(`.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`);
            expect(found).toBeInTheDocument();
            return found;
        });
        fireEvent.pointerDown(wrapper, { clientY: 120 });
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'mute'));
        expect(video.muted).toBe(false);
        expect(video.volume).toBe(0.5);
        expect(onVolumeChange).toHaveBeenLastCalledWith(50);
    });

    it('静音切换与滑块拖动时触发 onVolumeChange，初始化时不触发', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.classList.contains(`${BASE_CLASS_PREFIX}-audio-player-slider`) ? new DOMRect(0, 0, 4, 120) : real.call(this);
        });
        const onVolumeChange = vi.fn<(volume: number) => void>();
        const { container } = render(<VideoPlayer src={src} volume={40} onVolumeChange={onVolumeChange} />);
        expect(onVolumeChange).not.toHaveBeenCalled();
        fireEvent.click(buttonWith(container, 'volume_1'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(0);
        fireEvent.click(buttonWith(container, 'mute'));
        expect(onVolumeChange).toHaveBeenLastCalledWith(40);
        expect(onVolumeChange).toHaveBeenCalledTimes(2);

        hoverOpen(buttonWith(container, 'volume_1'));
        const wrapper = await waitFor(() => {
            const found = document.querySelector(`.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`);
            expect(found).toBeInTheDocument();
            return found;
        });
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
        render(<VideoPlayer muted src={src} onVolumeChange={onVolumeChange} />);
        expect(onVolumeChange).not.toHaveBeenCalled();
    });

    it('静音启动', () => {
        const { container } = render(<VideoPlayer muted src={src} />);
        // the muted flag, which also lets autoPlay start under the browser's autoplay policy
        expect(container.querySelector('video').muted).toBe(true);
        expect(container.querySelector(icon('mute'))).toBeInTheDocument();
    });

    it('通过 popover 中的滑块设置音量', async () => {
        const real = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            return this.classList.contains(`${BASE_CLASS_PREFIX}-audio-player-slider`) ? new DOMRect(0, 0, 4, 120) : real.call(this);
        });
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        hoverOpen(buttonWith(container, 'volume_2'));
        const title = await waitFor(() => {
            const found = document.querySelector(`.${prefixCls}-controls-volume-title`);
            expect(found).toHaveTextContent('100%');
            return found;
        });
        fireEvent.pointerDown(title.parentElement.querySelector(`.${BASE_CLASS_PREFIX}-audio-player-slider-wrapper`), {
            clientY: 102,
        });
        expect(video.volume).toBe(0.15);
        expect(title).toHaveTextContent('15%');
        expect(container.querySelector(icon('volume_1'))).toBeInTheDocument();
    });

    it('倍速、清晰度、线路是单选菜单，按钮名称为用途加当前值，当前值为空时只有用途', async () => {
        const names = en_US.VideoPlayer;
        const { container } = render(
            <LocaleProvider locale={en_US}>
                <VideoPlayer defaultRoute="line1" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} src={src} />
            </LocaleProvider>
        );
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
        const { container } = render(
            <VideoPlayer
                defaultPlaybackRate={1.5}
                playbackRateList={[
                    { label: '0.5x', value: 0.5 },
                    { label: '1.5x', value: 1.5 },
                    { label: '3.0x', value: 3 },
                ]}
                src={src}
                onRateChange={onRateChange}
            />
        );
        const video = container.querySelector('video');
        const items = await openMenu(container, '1.5x');
        expect(items.map((item) => item.textContent)).toEqual(['0.5x', '1.5x', '3.0x']);
        fireEvent.click(items[2]);
        expect(video.playbackRate).toBe(3);
        expect(onRateChange).toHaveBeenCalledWith(3);
        expect(container.querySelector(`.${prefixCls}-controls-popup`)).toHaveTextContent('3.0x');
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('切换速率至 3.0x');
    });

    it('通过原生按钮用键盘打开速率、清晰度与线路菜单', async () => {
        const onRateChange = vi.fn<(rate: number) => void>();
        const { container } = render(<VideoPlayer defaultQuality="1080p" defaultRoute="line1" qualityList={[{ label: '1080P', value: '1080p' }]} routeList={[{ label: 'Line 1', value: 'line1' }]} src={src} onRateChange={onRateChange} />);
        const triggers = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-controls-popup`)];
        expect(triggers.map((item) => item.textContent)).toEqual(['1.0x', '1080P', 'Line 1']);
        for (const trigger of triggers) {
            expect(trigger.tagName).toBe('BUTTON');
            expect(trigger).toHaveAttribute('type', 'button');
            expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        }
        act(() => triggers[0].focus());
        await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
        fireEvent.keyDown(triggers[0], { key: 'ArrowDown' });
        const items = [...document.querySelectorAll(`.${prefixCls}-controls-popup-menu-item`)];
        expect(items[0]).toHaveFocus();
        fireEvent.keyDown(items[0], { key: 'Enter' });
        expect(onRateChange).toHaveBeenCalledWith(2);
    });

    it('音量按钮获得焦点时打开音量弹层', async () => {
        const { container } = render(<VideoPlayer src={src} />);
        const trigger = buttonWith(container, 'volume_2');
        expect(trigger).toHaveAttribute('type', 'button');
        void act(() => trigger.focus());
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-controls-volume`)).toBeInTheDocument());
    });

    it('音量弹层是名为音量的对话框', async () => {
        const { container } = render(<VideoPlayer src={src} />);
        const trigger = buttonWith(container, 'volume_2');
        // the popup holds a focusable range, which a tooltip may not
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        void act(() => trigger.focus());
        const dialog = await waitFor(() => screen.getByRole('dialog', { name: zh_CN.VideoPlayer.volume }));
        expect(dialog).toContainElement(document.querySelector(`.${prefixCls}-controls-volume`));
    });

    it('切换清晰度并保持播放位置', async () => {
        const onQualityChange = vi.fn<(quality: string) => void>();
        const { container } = render(
            <VideoPlayer
                defaultQuality="1080p"
                qualityList={[
                    { label: '1080P', value: '1080p' },
                    { label: '720P', value: '720p' },
                ]}
                src={src}
                onQualityChange={onQualityChange}
            />
        );
        const video = container.querySelector('video');
        setMedia(video, { currentTime: 42, paused: false });
        const qualityItems = await openMenu(container, '1080P');
        fireEvent.click(qualityItems.find((item) => item.textContent === '720P'));
        expect(onQualityChange).toHaveBeenCalledWith('720p');
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('切换清晰度至720P');
        video.currentTime = 0;
        fireEvent(video, new Event('loadeddata'));
        expect(video.currentTime).toBe(42);
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('切换线路', async () => {
        const onRouteChange = vi.fn<(route: string) => void>();
        const { container } = render(
            <VideoPlayer
                defaultRoute="line1"
                routeList={[
                    { label: 'Line 1', value: 'line1' },
                    { label: 'Line 2', value: 'line2' },
                ]}
                src={src}
                onRouteChange={onRouteChange}
            />
        );
        const routeItems = await openMenu(container, 'Line 1');
        fireEvent.click(routeItems.find((item) => item.textContent === 'Line 2'));
        expect(onRouteChange).toHaveBeenCalledWith('line2');
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('切换线路至Line 2');
    });

    it('镜像视频，并在一秒后隐藏通知', () => {
        vi.useFakeTimers();
        const { container } = render(<VideoPlayer src={src} />);
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(container.firstChild).toHaveClass(`${prefixCls}-mirror`);
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('镜像');
        void act(() => vi.advanceTimersByTime(1000));
        expect(container.querySelector(`.${prefixCls}-notification`)).toBeNull();
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        expect(container.firstChild).not.toHaveClass(`${prefixCls}-mirror`);
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('取消镜像');
    });

    it('等待或卡顿期间发出通知，直到可以播放', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        fireEvent.waiting(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('加载中...');
        fireEvent.canPlay(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toBeNull();
        fireEvent.stalled(video);
        expect(container.querySelector(`.${prefixCls}-notification`)).toHaveTextContent('加载失败');
    });

    it('通知放在常驻的 status 区域，错误遮罩是 alert', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
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
        const { container } = render(<VideoPlayer defaultPlaybackRate={1.5} src={src} />);
        const video = container.querySelector('video');
        expect(video.playbackRate).toBe(1.5);
        expect(video.defaultPlaybackRate).toBe(1.5);
    });

    it('当前值不在列表中时按钮显示该值并计入可访问名称', () => {
        const { container } = render(<VideoPlayer defaultPlaybackRate={0.5} src={src} />);
        const button = container.querySelector(`.${prefixCls}-controls-popup`);
        expect(button).toHaveTextContent('0.5');
        expect(button.getAttribute('aria-label')).toMatch(/ 0\.5$/);
    });

    it('切换倍速同步 defaultPlaybackRate', async () => {
        const { container } = render(
            <VideoPlayer
                playbackRateList={[
                    { label: '1.0x', value: 1 },
                    { label: '2.0x', value: 2 },
                ]}
                src={src}
            />
        );
        const items = await openMenu(container, '1.0x');
        fireEvent.click(items[1]);
        expect(container.querySelector('video').defaultPlaybackRate).toBe(2);
    });

    it('换源开始加载后错误遮罩消失', () => {
        const { container, rerender } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        fireEvent.error(video);
        expect(container.querySelector(`.${prefixCls}-error`)).not.toBeNull();
        rerender(<VideoPlayer src="https://example.com/other.mp4" />);
        fireEvent.loadStart(video);
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
    });

    it('时间为 0 时进度圆点在起点', () => {
        const { container } = render(<VideoPlayer src={src} />);
        loadDuration(container.querySelector('video'), 3);
        expect(container.querySelector<HTMLElement>(`.${prefixCls}-progress-handle`).style.left).toBe('calc(0% - 8px)');
    });

    it('显示错误遮罩', () => {
        const { container } = render(<VideoPlayer src={src} />);
        fireEvent.error(container.querySelector('video'));
        expect(container.querySelector(`.${prefixCls}-error`)).toHaveTextContent('视频加载错误');
        expect(container.querySelector(`.${prefixCls}-error`)).toHaveClass(`${prefixCls}-error-dark`);
        expect(container.querySelector(`.${prefixCls}-pause`)).toBeNull();
    });

    it('使用方的 onMouseEnter 与 onMouseLeave 与控制栏显隐一起执行', () => {
        const onMouseEnter = vi.fn<(e: React.MouseEvent<HTMLDivElement>) => void>();
        const onMouseLeave = vi.fn<(e: React.MouseEvent<HTMLDivElement>) => void>();
        const { container } = render(<VideoPlayer src={src} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />);
        const root = container.firstChild as HTMLElement;
        const controls = root.querySelector(`.${prefixCls}-controls`);
        fireEvent.play(root.querySelector('video'));
        fireEvent.mouseLeave(root);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseEnter(root);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('指针离开播放中的视频时隐藏控件，播放结束时显示', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const root = container.firstChild as HTMLElement;
        const controls = root.querySelector(`.${prefixCls}-controls`);
        fireEvent.mouseLeave(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.play(root.querySelector('video'));
        fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseEnter(root);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseLeave(root);
        fireEvent.ended(root.querySelector('video'));
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        expect(root.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('仅在焦点位于播放器内时响应 Space 与方向键', () => {
        const { container } = render(<VideoPlayer seekTime={5} src={src} />);
        const video = container.querySelector('video');
        loadDuration(video);
        fireEvent.keyDown(document, { key: ' ' });
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.play).not.toHaveBeenCalled();
        expect(video.currentTime).toBe(0);

        buttonWith(container, 'play').focus();
        fireEvent.keyDown(document, { key: ' ' });
        expect(video.play).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.currentTime).toBe(5);
        expect(container.querySelector(`.${prefixCls}-controls-time`)).toHaveTextContent('00:05 / 01:00');
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
        const { container } = render(<VideoPlayer seekTime={5} src={src} />);
        const video = container.querySelector('video');
        setMedia(video, { currentTime: 0, duration: NaN });
        buttonWith(container, 'play').focus();
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(video.currentTime).toBe(0);
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(video.currentTime).toBe(5);
    });

    it('进度条自身按 APG slider 处理方向键、Home、End、PageUp 与 PageDown', () => {
        const { container } = render(<VideoPlayer seekTime={5} src={src} />);
        const video = container.querySelector('video');
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
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'])('带 %s 的方向键和 Space 属于浏览器或系统快捷键，不控制播放', (modifier) => {
        const { container } = render(<VideoPlayer seekTime={5} src={src} />);
        const video = container.querySelector('video');
        loadDuration(video);
        buttonWith(container, 'play').focus();

        for (const key of ['ArrowLeft', 'ArrowRight', ' ']) {
            const notPrevented = fireEvent.keyDown(document, { key, [modifier]: true });
            expect(notPrevented).toBe(true);
        }

        expect(video.currentTime).toBe(0);
        expect(video.play).not.toHaveBeenCalled();
    });

    it('时长变化时进度条保持同一个节点，不被卸载重建', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        const progress = container.querySelector(`.${prefixCls}-progress`);

        loadDuration(video, 60);
        loadDuration(video, 120);

        expect(container.querySelector(`.${prefixCls}-progress`)).toBe(progress);
        expect(progress).toHaveAttribute('aria-valuemax', '120');
    });

    it('Space 交给获得焦点的控件处理，不同时切换播放', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        const playButton = buttonWith(container, 'play');
        playButton.focus();
        // a native button turns Space into a click; jsdom does not, so replay it
        fireEvent.keyDown(playButton, { key: ' ' });
        fireEvent.click(playButton);
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('较早的通知过期时不隐藏较新的通知', () => {
        vi.useFakeTimers();
        const { container } = render(<VideoPlayer src={src} />);
        const notification = () => container.querySelector(`.${prefixCls}-notification`);
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        void act(() => vi.advanceTimersByTime(600));
        fireEvent.click(buttonWith(container, 'flip_horizontal'));
        void act(() => vi.advanceTimersByTime(600));
        expect(notification()).toHaveTextContent('取消镜像');
        void act(() => vi.advanceTimersByTime(400));
        expect(notification()).toBeNull();
    });

    it('在外层容器进入全屏，并从全屏退出', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const root = container.firstChild as HTMLElement;
        fireEvent.click(buttonWith(container, 'maximize'));
        expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
        expect(vi.mocked(HTMLElement.prototype.requestFullscreen).mock.contexts[0]).toBe(root);
        setFullscreenElement(root);
        fireEvent.click(container.querySelector(`.${prefixCls}-controls-menu-right button:last-child`).previousSibling);
        expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('全屏下暂停时，指针停止移动三秒后控件仍显示', () => {
        vi.useFakeTimers();
        const { container } = render(<VideoPlayer src={src} />);
        const root = container.firstChild as HTMLElement;
        const controls = root.querySelector(`.${prefixCls}-controls`);
        setFullscreenElement(root);
        fireEvent.mouseMove(document);
        void act(() => vi.advanceTimersByTime(3000));
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('另一个元素进出全屏时，本播放器已隐藏的控件保持隐藏', () => {
        vi.useFakeTimers();
        const { container } = render(<VideoPlayer src={src} />);
        const root = container.firstChild as HTMLElement;
        const controls = root.querySelector(`.${prefixCls}-controls`);
        fireEvent.play(container.querySelector('video'));
        fireEvent.mouseLeave(root);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(document.body);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(null);
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('全屏下指针停止移动三秒后自动隐藏控件', () => {
        vi.useFakeTimers();
        const { container } = render(<VideoPlayer src={src} />);
        const root = container.firstChild as HTMLElement;
        const controls = root.querySelector(`.${prefixCls}-controls`);
        fireEvent.play(container.querySelector('video'));
        setFullscreenElement(root);
        fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        void act(() => vi.advanceTimersByTime(3000));
        expect(controls).toHaveClass(`${prefixCls}-controls-hide`);
        void act(() => vi.advanceTimersByTime(300));
        fireEvent.mouseMove(document);
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        setFullscreenElement(null);
        void act(() => vi.advanceTimersByTime(3500));
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
        fireEvent.mouseMove(document);
        void act(() => vi.advanceTimersByTime(3500));
        expect(controls).not.toHaveClass(`${prefixCls}-controls-hide`);
    });

    it('播放被打断、全屏或画中画不可用时的预期拒绝不成为未处理的拒绝', async () => {
        const unhandled = vi.fn<(reason: unknown) => void>();
        process.on('unhandledRejection', unhandled);
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        // plain functions: a vi.fn reads the promise it returns, which marks the rejection handled
        const reject = (name: string) => () => Promise.reject(new DOMException(name, name));
        video.play = reject('AbortError');
        (container.firstChild as HTMLElement).requestFullscreen = reject('NotAllowedError');
        video.requestPictureInPicture = reject('InvalidStateError');
        fireEvent.click(buttonWith(container, 'play'));
        fireEvent.click(buttonWith(container, 'maximize'));
        fireEvent.click(buttonWith(container, 'mini_player'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('请求画中画，退出时同步状态', () => {
        const { container } = render(<VideoPlayer src={src} />);
        const video = container.querySelector('video');
        fireEvent.click(buttonWith(container, 'mini_player'));
        expect(video.requestPictureInPicture).toHaveBeenCalledTimes(1);
        setMedia(video, { paused: false });
        fireEvent(video, new Event('leavepictureinpicture'));
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
    });

    it('ref 指向 video 元素', () => {
        const ref = createRef<HTMLVideoElement>();
        const { container } = render(<VideoPlayer ref={ref} src={src} />);
        expect(ref.current).toBe(container.querySelector('video'));
        const callback = vi.fn<(element: HTMLVideoElement | null) => void>();
        render(<VideoPlayer ref={callback} src={src} />);
        expect(callback).toHaveBeenCalledWith(expect.any(HTMLVideoElement));
    });

    it('卸载后停止监听', () => {
        const onPlay = vi.fn<() => void>();
        const { container, unmount } = render(<VideoPlayer src={src} onPlay={onPlay} />);
        const video = container.querySelector('video');
        buttonWith(container, 'play').focus();
        unmount();
        fireEvent.keyDown(document, { key: ' ' });
        fireEvent.play(video);
        expect(video.play).not.toHaveBeenCalled();
        expect(onPlay).not.toHaveBeenCalled();
    });

    it('StrictMode 下只监听一次', () => {
        const onPlay = vi.fn<() => void>();
        const { container } = render(
            <StrictMode>
                <VideoPlayer src={src} volume={30} onPlay={onPlay} />
            </StrictMode>
        );
        const video = container.querySelector('video');
        expect(video.volume).toBe(0.3);
        buttonWith(container, 'play').focus();
        fireEvent.keyDown(document, { key: ' ' });
        expect(video.play).toHaveBeenCalledTimes(1);
        fireEvent.play(video);
        expect(onPlay).toHaveBeenCalledTimes(1);
    });

    describe('函数组件', () => {
        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('将未知属性透传到根元素', () => {
            const { container } = render(<VideoPlayer data-testid="player" aria-label="Movie" src={src} />);
            expect(container.firstChild).toHaveAttribute('data-testid', 'player');
            expect(container.firstChild).toHaveAttribute('aria-label', 'Movie');
        });

        it('根元素被命名时成为 group，使用方给出的 role 优先', () => {
            const { rerender } = render(<VideoPlayer aria-label="课程视频" src={src} />);
            expect(screen.getByRole('group', { name: '课程视频' })).toHaveClass(prefixCls);
            rerender(<VideoPlayer aria-label="课程视频" role="application" src={src} />);
            expect(screen.getByRole('application', { name: '课程视频' })).toHaveClass(prefixCls);
            rerender(<VideoPlayer src={src} />);
            expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('role');
        });

        it('读取全局默认属性', () => {
            semiGlobal.config.overrideDefaultProps = { VideoPlayer: { theme: 'light', controlsList: ['play'] } };
            const { container } = render(<VideoPlayer src={src} />);
            expect(container.querySelector(`.${prefixCls}-wrapper`)).toHaveClass(`${prefixCls}-wrapper-light`);
            expect(container.querySelector(icon('maximize'))).toBeNull();
        });

        it('跟随新的 playbackRateList', async () => {
            const { container, rerender } = render(<VideoPlayer src={src} />);
            rerender(
                <VideoPlayer
                    playbackRateList={[
                        { label: 'normal', value: 1 },
                        { label: 'fast', value: 2 },
                    ]}
                    src={src}
                />
            );
            const items = await openMenu(container, 'normal');
            expect(items.map((item) => item.textContent)).toEqual(['normal', 'fast']);
        });

        it('同一次渲染中跟随新的 controlsList 与 markers', () => {
            const { container, rerender } = render(<VideoPlayer markers={[{ start: 0, title: 'A' }]} src={src} />);
            loadDuration(container.querySelector('video'));
            expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(1);
            rerender(
                <VideoPlayer
                    controlsList={['play']}
                    markers={[
                        { start: 0, title: 'A' },
                        { start: 30, title: 'B' },
                    ]}
                    src={src}
                />
            );
            expect(container.querySelector(icon('maximize'))).toBeNull();
            expect(container.querySelectorAll(`.${prefixCls}-progress-slider`)).toHaveLength(2);
        });

        it('clickToPlay 为 false 时点击不切换播放', () => {
            const { container } = render(<VideoPlayer clickToPlay={false} src={src} />);
            fireEvent.click(container.querySelector('video'));
            expect(container.querySelector('video').play).not.toHaveBeenCalled();
        });

        it('全屏状态变化时切换全屏图标', () => {
            const { container } = render(<VideoPlayer src={src} />);
            setFullscreenElement(container.firstChild);
            expect(container.querySelector(icon('minimize'))).toBeInTheDocument();
            setFullscreenElement(null);
            expect(container.querySelector(icon('maximize'))).toBeInTheDocument();
        });

        it('全屏时菜单挂在播放器内，菜单项上的方向键不跳转视频', async () => {
            const { container } = render(<VideoPlayer seekTime={5} src={src} />);
            const video = container.querySelector('video');
            loadDuration(video);
            setFullscreenElement(container.firstChild);
            const items = await openMenu(container, '1.0x');
            // outside the fullscreen element the menu would get no pointer events
            expect(container.firstChild).toContainElement(items[0]);
            items[0].focus();
            fireEvent.keyDown(items[0], { key: 'ArrowRight' });
            expect(video.currentTime).toBe(0);
        });

        it('全屏下卸载时停止跟随指针', () => {
            const add = vi.spyOn(document, 'addEventListener');
            const remove = vi.spyOn(document, 'removeEventListener');
            const { container, unmount } = render(<VideoPlayer src={src} />);
            setFullscreenElement(container.firstChild);
            expect(countLiveListeners(add, remove, 'mousemove')).toBe(1);
            unmount();
            expect(countLiveListeners(add, remove, 'mousemove')).toBe(0);
        });

        it('进度条捕获按下时的指针', () => {
            const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
            const { container } = render(<VideoPlayer src={src} />);
            loadDuration(container.querySelector('video'));
            const progress = container.querySelector(`.${prefixCls}-progress`);
            fireEvent.pointerDown(progress, { pointerId: 7, clientX: 0 });
            expect(capture.mock.contexts).toEqual([progress]);
            expect(capture.mock.calls).toEqual([[7]]);
        });
    });

    it('进度滑块的名称由语言包提供', () => {
        render(<VideoPlayer src={src} />);
        expect(screen.getByRole('slider', { name: zh_CN.VideoPlayer.progress })).toBeInTheDocument();
    });
});

describe('VideoPlayer 类型', () => {
    it('不接受永远不会触发的媒体事件回调，保留自有回调', () => {
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('onTimeUpdate');
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('onEnded');
        expectTypeOf<VideoPlayerProps>().not.toHaveProperty('onPlayCapture');
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
