import { type Mock, describe, expect, it, vi } from 'vite-plus/test';
import AudioPlayerFoundation, { type AudioPlayerAdapter, type AudioPlayerBaseProps, type AudioPlayerBaseState } from '../foundation';

const initialState: AudioPlayerBaseState = {
    isPlaying: false,
    currentIndex: 0,
    totalTime: 0,
    currentTime: 0,
    currentRate: { label: '1.0x', value: 1 },
    volume: 100,
    error: false,
};

type MockAudio = Omit<HTMLAudioElement, 'play' | 'pause' | 'load'> & {
    play: Mock<() => Promise<void>>;
    pause: Mock<() => void>;
    load: Mock<() => void>;
};

function createAudio(values: Partial<HTMLAudioElement> = {}) {
    return {
        currentTime: 0,
        duration: 120,
        playbackRate: 1,
        volume: 1,
        paused: true,
        play: vi.fn<() => Promise<void>>(() => Promise.resolve()),
        pause: vi.fn<() => void>(),
        load: vi.fn<() => void>(),
        ...values,
    } as MockAudio;
}

function setup(props: Partial<AudioPlayerBaseProps>, state: Partial<AudioPlayerBaseState> = {}, audio = createAudio()) {
    const fullProps: AudioPlayerBaseProps = { audioUrl: 'https://example.com/a.mp3', skipDuration: 10, ...props };
    let states: AudioPlayerBaseState = { ...initialState, ...state };
    const adapter: AudioPlayerAdapter = {
        getContext: () => undefined,
        getContexts: () => ({}),
        getProp: (key) => fullProps[key],
        getProps: () => fullProps,
        getState: (key) => states[key],
        getStates: () => states,
        setState: (next, callback) => {
            states = { ...states, ...next };
            callback?.();
        },
        getAudioRef: () => audio,
    };
    return { foundation: new AudioPlayerFoundation(adapter), audio, getStates: () => states };
}

const playlist = ['https://example.com/a.mp3', 'https://example.com/b.mp3', 'https://example.com/c.mp3'];

describe('AudioPlayerFoundation', () => {
    it('挂载前元数据已加载完时，init 直接读出时长', () => {
        const audio = createAudio({ duration: 60, readyState: HTMLMediaElement.HAVE_METADATA, addEventListener: vi.fn<HTMLAudioElement['addEventListener']>() });
        const { foundation, getStates } = setup({}, {}, audio);

        foundation.connect();
        foundation.init();

        expect(getStates().totalTime).toBe(60);
    });

    it('切歌按列表长度循环，清除错误，提交后从头以 1 倍速播放', () => {
        const audio = createAudio({ currentTime: 30, playbackRate: 2 });
        const { foundation, getStates } = setup({ audioUrl: playlist }, { currentTime: 30, currentRate: { label: '2.0x', value: 2 }, error: true }, audio);

        foundation.handleTrackChange('prev');
        expect(getStates()).toMatchObject({
            currentIndex: 2,
            currentTime: 0,
            currentRate: { label: '1.0x', value: 1 },
            error: false,
        });
        expect(audio.currentTime).toBe(0);
        expect(audio.playbackRate).toBe(1);
        expect(audio.play).toHaveBeenCalledTimes(1);

        foundation.handleTrackChange('next');
        expect(getStates().currentIndex).toBe(0);
    });

    it('空列表切歌不改变状态也不播放；列表变短后从最后一首起算', () => {
        const empty = setup({ audioUrl: [] });
        empty.foundation.handleTrackChange('next');
        expect(empty.getStates().currentIndex).toBe(0);
        expect(Number.isNaN(empty.getStates().currentIndex)).toBe(false);
        expect(empty.audio.play).not.toHaveBeenCalled();

        const shrunk = setup({ audioUrl: playlist.slice(0, 2) }, { currentIndex: 2 });
        shrunk.foundation.handleTrackChange('next');
        expect(shrunk.getStates().currentIndex).toBe(0);
    });

    it('倍速同时写入 playbackRate 与 defaultPlaybackRate，换源加载后保持', () => {
        const { foundation, audio, getStates } = setup({});
        foundation.handleSpeedChange({ label: '1.5x', value: 1.5 });
        expect(audio.playbackRate).toBe(1.5);
        expect(audio.defaultPlaybackRate).toBe(1.5);
        expect(getStates().currentRate).toEqual({ label: '1.5x', value: 1.5 });
    });

    it('后退与前进按 skipDuration 跳转并截断在 0 到时长之间，时长未知时不动', () => {
        const audio = createAudio({ currentTime: 5 });
        const { foundation } = setup({ skipDuration: 10 }, {}, audio);

        foundation.handleSeek(-1);
        expect(audio.currentTime).toBe(0);
        audio.currentTime = 115;
        foundation.handleSeek(1);
        expect(audio.currentTime).toBe(120);

        Object.assign(audio, { duration: Number.NaN, currentTime: 50 });
        foundation.handleSeek(1);
        expect(audio.currentTime).toBe(50);
    });

    it('出错时刷新重新加载源，否则回到开头', () => {
        const failed = setup({}, { error: true, currentTime: 0 }, createAudio({ currentTime: 0 }));
        failed.foundation.handleRefresh();
        expect(failed.audio.load).toHaveBeenCalledTimes(1);

        const playing = setup({}, { currentTime: 42 }, createAudio({ currentTime: 42 }));
        playing.foundation.handleRefresh();
        expect(playing.audio.load).not.toHaveBeenCalled();
        expect(playing.audio.currentTime).toBe(0);
        expect(playing.getStates().currentTime).toBe(0);
    });

    it('音量取整后写入元素与 state，静音切换在 0 与 50 之间', () => {
        const { foundation, audio, getStates } = setup({});

        foundation.handleVolumeChange(33.7);
        expect(audio.volume).toBe(0.33);
        expect(getStates().volume).toBe(33);

        foundation.handleVolumeSilent();
        expect(getStates().volume).toBe(0);
        foundation.handleVolumeSilent();
        expect(getStates().volume).toBe(50);
    });

    it('时长为 Infinity 时拖动进度条不写 currentTime；有限时长内的值截断在 0 到时长之间', () => {
        const audio = createAudio({ currentTime: 5, duration: Number.POSITIVE_INFINITY });
        // a media element rejects a non-finite currentTime with a TypeError
        let current = 5;
        Object.defineProperty(audio, 'currentTime', {
            get: () => current,
            set: (value: number) => {
                if (!Number.isFinite(value)) throw new TypeError('non-finite');
                current = value;
            },
        });
        const { foundation, getStates } = setup({}, { currentTime: 5 }, audio);
        expect(() => foundation.handleTimeChange(Number.POSITIVE_INFINITY)).not.toThrow();
        expect(() => foundation.handleTimeChange(Number.NaN)).not.toThrow();
        expect(current).toBe(5);
        expect(getStates().currentTime).toBe(5);

        Object.assign(audio, { duration: 120 });
        foundation.handleTimeChange(200);
        expect(current).toBe(120);
        foundation.handleTimeChange(-3);
        expect(current).toBe(0);
    });

    it('换源加载时按元素的 paused 同步 isPlaying', () => {
        const audio = Object.assign(new EventTarget(), createAudio({ paused: true }));
        const { foundation, getStates } = setup({}, { isPlaying: true }, audio as unknown as MockAudio);
        foundation.connect();
        foundation.init();
        audio.dispatchEvent(new Event('loadstart'));
        expect(getStates().isPlaying).toBe(false);
        foundation.disconnect();
    });

    it('播放按钮按元素的 paused 播放或暂停', () => {
        const audio = createAudio({ paused: true });
        const { foundation } = setup({}, {}, audio);

        foundation.handleStatusClick();
        expect(audio.play).toHaveBeenCalledTimes(1);
        Object.assign(audio, { paused: false });
        foundation.handleStatusClick();
        expect(audio.pause).toHaveBeenCalledTimes(1);
    });
});
