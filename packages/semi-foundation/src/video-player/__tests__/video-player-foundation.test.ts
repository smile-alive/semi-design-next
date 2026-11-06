import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import zh_CN from '../../locale/source/zh_CN';
import VideoPlayerFoundation, { type VideoPlayerAdapter, type VideoPlayerBaseState } from '../foundation';

function setup() {
    const state = { currentQuality: 'sd', currentRoute: 'a', notificationContent: '' };
    const adapter = {
        getVideo: () => ({ paused: true, currentTime: 0, addEventListener: vi.fn<HTMLVideoElement['addEventListener']>() }),
        getState: (key: keyof typeof state) => state[key],
        setState: (next: Partial<typeof state>) => Object.assign(state, next),
        notifyRateChange: vi.fn<VideoPlayerAdapter['notifyRateChange']>(),
        notifyQualityChange: vi.fn<VideoPlayerAdapter['notifyQualityChange']>(),
        notifyRouteChange: vi.fn<VideoPlayerAdapter['notifyRouteChange']>(),
    } as unknown as VideoPlayerAdapter;
    const foundation = new VideoPlayerFoundation(adapter);
    foundation.connect();
    onTestFinished(() => foundation.disconnect());
    return { foundation, state };
}

class FakeVideo extends EventTarget {
    #currentTime = 0;
    paused = true;
    duration = 60;
    buffered = { length: 0, end: () => 0 };
    play = vi.fn<() => Promise<void>>(() => Promise.resolve());
    volume = 1;
    muted = false;
    playbackRate = 1;
    defaultPlaybackRate = 1;
    writes: number[] = [];
    querySelector() {
        return null;
    }
    get currentTime() {
        return this.#currentTime;
    }
    // a media element rejects a non-finite currentTime with a TypeError
    set currentTime(value: number) {
        if (!Number.isFinite(value)) throw new TypeError('The provided double value is non-finite');
        this.writes.push(value);
        this.#currentTime = value;
    }
}

function createPlayer(initial: Partial<VideoPlayerBaseState> = {}) {
    const video = new FakeVideo();
    const wrapper = document.createElement('div');
    const state: VideoPlayerBaseState = { ...VideoPlayerFoundation.getInitialState({ volume: 100, defaultQuality: 'sd', defaultRoute: 'a' }), ...initial };
    const setState = vi.fn<(next: Partial<VideoPlayerBaseState>) => void>((next) => {
        Object.assign(state, next);
    });
    const adapter = {
        getVideo: () => video,
        getVideoWrapper: () => wrapper,
        getProps: () => ({ muted: false, seekTime: 10, volume: 100 }),
        getState: (key: keyof VideoPlayerBaseState) => state[key],
        getStates: () => state,
        setState,
        notifyQualityChange: vi.fn<VideoPlayerAdapter['notifyQualityChange']>(),
        notifyRouteChange: vi.fn<VideoPlayerAdapter['notifyRouteChange']>(),
        notifyRateChange: vi.fn<VideoPlayerAdapter['notifyRateChange']>(),
        notifyPlay: vi.fn<VideoPlayerAdapter['notifyPlay']>(),
        notifyPause: vi.fn<VideoPlayerAdapter['notifyPause']>(),
    } as unknown as VideoPlayerAdapter;
    const foundation = new VideoPlayerFoundation(adapter);
    foundation.connect();
    onTestFinished(() => foundation.disconnect());
    return { foundation, video, state, adapter, setState, wrapper };
}

describe('VideoPlayerFoundation 的直播流', () => {
    it('时长为 Infinity 时跳转到非有限值不写 currentTime', () => {
        const { foundation, video, setState } = createPlayer();
        video.duration = Number.POSITIVE_INFINITY;
        expect(() => foundation.handleTimeChange(Number.POSITIVE_INFINITY)).not.toThrow();
        expect(() => foundation.handleTimeChange(Number.NaN)).not.toThrow();
        expect(video.writes).toEqual([]);
        expect(setState).not.toHaveBeenCalled();
        foundation.handleTimeChange(30);
        expect(video.writes).toEqual([30]);
    });
});

describe('VideoPlayerFoundation 换源后的播放状态', () => {
    it('loadstart 时按元素的 paused 同步 isPlaying，并清空缓冲进度', () => {
        const { foundation, video, state } = createPlayer({ isPlaying: true, isError: true, bufferedValue: 20 });
        foundation.handleLoadStart();
        expect(state).toMatchObject({ isPlaying: false, bufferedValue: 0, isError: false });
        video.paused = false;
        foundation.handleLoadStart();
        expect(state.isPlaying).toBe(true);
    });
});

describe('VideoPlayerFoundation 切换清晰度与线路后恢复位置', () => {
    const locale = zh_CN.VideoPlayer;
    const switchTo = (video: FakeVideo, time: number) => {
        video.currentTime = time;
        video.writes.length = 0;
    };

    it('重选当前清晰度不挂恢复监听，之后无关的加载不被跳回旧位置', () => {
        const { foundation, video, adapter } = createPlayer({ currentQuality: 'sd' });
        video.paused = false;
        switchTo(video, 42);
        foundation.handleQualityChange({ label: '标清', value: 'sd' }, locale);
        expect(adapter.notifyQualityChange).toHaveBeenCalledWith('sd');
        switchTo(video, 0);
        video.dispatchEvent(new Event('loadeddata'));
        expect(video.writes).toEqual([]);
        expect(video.play).not.toHaveBeenCalled();
    });

    it('重选当前线路同样不挂恢复监听', () => {
        const { foundation, video } = createPlayer({ currentRoute: 'a' });
        video.paused = false;
        switchTo(video, 42);
        foundation.handleRouteChange({ label: '线路一', value: 'a' }, locale);
        switchTo(video, 0);
        video.dispatchEvent(new Event('loadeddata'));
        expect(video.writes).toEqual([]);
        expect(video.play).not.toHaveBeenCalled();
    });

    it('切到不同清晰度后加载完成时回到原位置并继续播放', () => {
        const { foundation, video } = createPlayer({ currentQuality: 'sd' });
        video.paused = false;
        switchTo(video, 42);
        foundation.handleQualityChange({ label: '高清', value: 'hd' }, locale);
        switchTo(video, 0);
        video.dispatchEvent(new Event('loadeddata'));
        expect(video.writes).toEqual([42]);
        expect(video.play).toHaveBeenCalledTimes(1);
    });

    it('连续两次切换时只有最后一次的恢复监听生效', () => {
        const { foundation, video } = createPlayer({ currentQuality: 'sd' });
        video.paused = false;
        switchTo(video, 42);
        foundation.handleQualityChange({ label: '高清', value: 'hd' }, locale);
        // the user pauses before the first load finishes, and switches again
        video.paused = true;
        foundation.handleQualityChange({ label: '超清', value: 'uhd' }, locale);
        switchTo(video, 0);
        video.dispatchEvent(new Event('loadeddata'));
        expect(video.writes).toEqual([42]);
        expect(video.play).not.toHaveBeenCalled();
    });
});

describe('VideoPlayerFoundation 的卡顿通知', () => {
    const locale = zh_CN.VideoPlayer;

    it('stalled 之后收到 progress 就关闭通知', () => {
        const { foundation, state } = createPlayer();
        foundation.handleStalled(locale);
        expect(state.showNotification).toBe(true);
        foundation.handleProgress();
        expect(state.showNotification).toBe(false);
    });

    it('没有卡顿时 progress 不动通知，例如不打断切换提示', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const { foundation, setState } = createPlayer();
        foundation.handleRateChange({ label: '2.0x', value: 2 }, locale);
        setState.mockClear();
        foundation.handleProgress();
        expect(setState).not.toHaveBeenCalled();
    });

    it('waiting 或临时通知覆盖卡顿提示后，progress 不再关闭通知', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const { foundation, setState } = createPlayer();
        foundation.handleStalled(locale);
        foundation.handleRateChange({ label: '2.0x', value: 2 }, locale);
        setState.mockClear();
        foundation.handleProgress();
        expect(setState).not.toHaveBeenCalled();
    });
});

describe('VideoPlayerFoundation 的控制栏显隐', () => {
    it('全屏下暂停时，鼠标静止 3 秒后控制栏仍显示', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const { foundation, state, wrapper } = createPlayer({ showControls: false });
        foundation.init();
        // jsdom has no fullscreen API
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => wrapper });
        onTestFinished(() => void Reflect.deleteProperty(document, 'fullscreenElement'));
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(state.isFullScreen).toBe(true);
        state.showControls = false;
        document.dispatchEvent(new MouseEvent('mousemove'));
        expect(state.showControls).toBe(true);
        vi.advanceTimersByTime(3000);
        expect(state.showControls).toBe(true);
        state.isPlaying = true;
        document.dispatchEvent(new MouseEvent('mousemove'));
        vi.advanceTimersByTime(3000);
        expect(state.showControls).toBe(false);
    });

    it('全屏下控制栏被隐藏后暂停（空格或点击画面），控制栏重新显示', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const { foundation, state } = createPlayer({ isFullScreen: true, isPlaying: true, showControls: false });
        foundation.handleVideoPause();
        expect(state.showControls).toBe(true);
        expect(state.isFullScreen).toBe(true);
    });

    it('全屏下暂停后恢复播放，鼠标静止 3 秒后控制栏隐藏', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const { foundation, state } = createPlayer({ isFullScreen: true });
        state.isPlaying = true;
        foundation.handleVideoPlay();
        vi.advanceTimersByTime(3000);
        expect(state.showControls).toBe(false);
    });

    it('其他元素进出全屏不改变本播放器的全屏状态与控制栏', () => {
        const { foundation, setState } = createPlayer({ isFullScreen: false });
        foundation.init();
        setState.mockClear();
        document.dispatchEvent(new Event('fullscreenchange'));
        expect(setState).not.toHaveBeenCalled();
    });
});

describe('VideoPlayerFoundation 的切换通知', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('选项名称里的 $&、$$ 按原文写入通知，不当作替换模式', () => {
        vi.useFakeTimers();
        const { foundation, state } = setup();
        const locale = zh_CN.VideoPlayer;
        foundation.handleRateChange({ label: '$&x', value: 2 }, locale);
        expect(state.notificationContent).toBe('切换速率至 $&x');
        foundation.handleQualityChange({ label: '$$HD', value: 'hd' }, locale);
        expect(state.notificationContent).toBe('切换清晰度至$$HD');
        foundation.handleRouteChange({ label: "$'line", value: 'a' }, locale);
        expect(state.notificationContent).toBe("切换线路至$'line");
    });
});
