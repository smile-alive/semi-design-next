import { StrictMode, createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { countLiveListeners } from '@test/utils/react';
import AudioPlayer, { type AudioPlayerProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-audio-player`;
const icon = (name) => `.${BASE_CLASS_PREFIX}-icon-${name}`;
const buttonWith = (container, name) => container.querySelector(icon(name)).closest('button');

const tracks: [{ src: string; title: string; cover: string }, { src: string; title: string }, string] = [{ src: 'https://example.com/a.mp3', title: 'Track A', cover: 'https://example.com/a.png' }, { src: 'https://example.com/b.mp3', title: 'Track B' }, 'https://example.com/c.mp3'];

// jsdom has no media pipeline: give the element the values a loaded file would have
function setMedia(element, values) {
    for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(element, key, { configurable: true, writable: true, value });
    }
}

function loadMetadata(audio, values = {}) {
    setMedia(audio, { duration: 120, currentTime: 0, volume: 1, playbackRate: 1, ...values });
    fireEvent.loadedMetadata(audio);
}

// Tooltip re-checks `:hover` on the trigger after the popup opens, and jsdom never matches it
function hoverOpen(element) {
    const realMatches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
        return selector === ':hover' ? element.contains(this) : realMatches.call(this, selector);
    });
    fireEvent.mouseEnter(element);
}

function mockSliderRect(rect) {
    const real = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        return this.classList.contains(`${prefixCls}-slider`) ? rect : real.call(this);
    });
}

// A browser drops an invalid declaration such as `calc(NaN% - 8px)`, but jsdom throws on it
const styleProto = Object.getPrototypeOf(document.createElement('div').style);
const realStyleSetters = ['left', 'bottom'].map((name): [string, PropertyDescriptor] => [name, Object.getOwnPropertyDescriptor(styleProto, name)]);

describe('AudioPlayer', () => {
    beforeAll(() => {
        for (const [name, descriptor] of realStyleSetters) {
            Object.defineProperty(styleProto, name, {
                ...descriptor,
                set(value) {
                    try {
                        descriptor.set.call(this, value);
                    } catch {}
                },
            });
        }
    });

    afterAll(() => {
        for (const [name, descriptor] of realStyleSetters) {
            Object.defineProperty(styleProto, name, descriptor);
        }
    });

    beforeEach(() => {
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
            setMedia(this, { paused: false });
            fireEvent.play(this);
            return Promise.resolve();
        });
        vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
            setMedia(this, { paused: true });
            fireEvent.pause(this);
        });
        vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('默认以深色主题渲染 audio 元素、控件、信息与工具栏', () => {
        const { container } = render(<AudioPlayer className="custom" style={{ width: 600 }} audioUrl="https://example.com/a.mp3" />);
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass(prefixCls, 'custom', `${prefixCls}-dark`);
        expect(root).toHaveStyle({ width: '600px' });
        const audio = root.querySelector('audio');
        expect(audio).toHaveAttribute('src', 'https://example.com/a.mp3');
        expect(audio.autoplay).toBe(false);
        expect(root.querySelector(`.${prefixCls}-control-button-play`)).toBeInTheDocument();
        expect(root.querySelector(icon('play'))).toBeInTheDocument();
        expect(root.querySelector(icon('restart'))).toBeNull();
        expect(root.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        expect(root.querySelector('img')).toBeNull();
        expect(root.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('00:0000:00');
        expect(root.querySelector(`.${prefixCls}-control-speed`)).toHaveTextContent('1.0x');
        for (const name of ['volume_2', 'backward', 'fast_forward', 'refresh']) {
            expect(root.querySelector(icon(name))).toBeInTheDocument();
        }
    });

    it('隐藏的 audio 元素不重复根元素的 className 与 style，字幕 track 不指向音频本身', () => {
        const { container } = render(<AudioPlayer className="custom" style={{ width: 600 }} audioUrl="https://example.com/a.mp3" />);
        expect(container.querySelectorAll('.custom')).toHaveLength(1);
        const audio = container.querySelector('audio');
        expect(audio).not.toHaveAttribute('class');
        expect(audio).not.toHaveAttribute('style');
        expect(audio.querySelector('track')).toHaveAttribute('kind', 'captions');
        expect(audio.querySelector('track')).not.toHaveAttribute('src');
    });

    it('在根元素与滑块上应用浅色主题', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" theme="light" />);
        expect(container.firstChild).toHaveClass(`${prefixCls}-light`);
        expect(container.querySelector(`.${prefixCls}-slider`)).toHaveClass(`${prefixCls}-slider-light`);
    });

    it.each(['light', 'dark'] as const)('为 portal 出的倍速菜单设置 %s 主题类名', async (theme) => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" theme={theme} />);
        loadMetadata(container.querySelector('audio'));
        hoverOpen(container.querySelector(`.${prefixCls}-control-speed`));
        const item = await waitFor(() => {
            const found = document.querySelector<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toBeInTheDocument();
            return found;
        });
        // outside the player root, where a root-theme descendant selector cannot match
        expect(container.firstChild).not.toContainElement(item);
        expect(item.closest(`.${prefixCls}-control-speed-menu`)).toHaveClass(`${prefixCls}-control-speed-menu-${theme}`);
    });

    it.each(['light', 'dark'] as const)('为 portal 出的音量弹层设置 %s 主题类名', async (theme) => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" theme={theme} />);
        loadMetadata(container.querySelector('audio'));
        hoverOpen(buttonWith(container, 'volume_2'));
        const volume = await waitFor(() => {
            const found = document.querySelector<HTMLElement>(`.${prefixCls}-control-volume`);
            expect(found).toBeInTheDocument();
            return found;
        });
        expect(container.firstChild).not.toContainElement(volume);
        expect(volume).toHaveClass(`${prefixCls}-control-volume-${theme}`);
    });

    it('showToolbar 为 false 时隐藏工具栏', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" showToolbar={false} />);
        expect(container.querySelectorAll(`.${prefixCls}-control`)).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
    });

    it('把 autoPlay 传给 audio 元素，开始播放后上报播放中', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" autoPlay />);
        const audio = container.querySelector('audio');
        expect(audio.autoplay).toBe(true);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        loadMetadata(audio, { duration: 65, volume: 0.4 });
        fireEvent.play(audio);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('00:0001:05');
        expect(container.querySelector(`.${prefixCls}-control-volume-title`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toHaveTextContent('1.0x');
    });

    it('元数据加载前选择的倍速在加载后仍显示', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        hoverOpen(container.querySelector(`.${prefixCls}-control-speed`));
        const items = await waitFor(() => {
            const found = document.querySelectorAll(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        fireEvent.click(items[3]);
        expect(audio.playbackRate).toBe(1.5);
        // the media load algorithm resets playbackRate to defaultPlaybackRate
        expect(audio.defaultPlaybackRate).toBe(1.5);
        loadMetadata(audio, { playbackRate: 1.5 });
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toHaveTextContent('1.5x');
    });

    it('倍速是单选菜单，按钮名称为用途加当前倍速', async () => {
        const { container } = render(
            <LocaleProvider locale={en_US}>
                <AudioPlayer audioUrl="https://example.com/a.mp3" />
            </LocaleProvider>
        );
        loadMetadata(container.querySelector('audio'));
        const trigger = container.querySelector<HTMLElement>(`.${prefixCls}-control-speed`);
        expect(trigger).toHaveAccessibleName(`${en_US.AudioPlayer.playbackRate} 1.0x`);
        hoverOpen(trigger);
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return [...found];
        });
        expect(items.every((item) => item.getAttribute('role') === 'menuitemradio')).toBe(true);
        const checked = items.filter((item) => item.getAttribute('aria-checked') === 'true');
        expect(checked.map((item) => item.textContent)).toEqual(['1.0x']);
        fireEvent.click(items[3]);
        expect(trigger).toHaveAccessibleName(`${en_US.AudioPlayer.playbackRate} 1.5x`);
    });

    it('读取 AudioInfo 对象的 title 与 cover', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks[0]} />);
        expect(container.querySelector('audio')).toHaveAttribute('src', tracks[0].src);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track A');
        expect(container.querySelector('img')).toHaveAttribute('src', tracks[0].cover);
    });

    it('播放按钮切换播放与暂停', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        fireEvent.click(container.querySelector(`.${prefixCls}-control-button-play`));
        expect(audio.play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        fireEvent.click(container.querySelector(`.${prefixCls}-control-button-play`));
        expect(audio.pause).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('timeupdate 时显示元素时间', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        audio.currentTime = 75;
        fireEvent.timeUpdate(audio);
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('01:1502:00');
    });

    it('超过一小时的时间显示为 h:mm:ss，未知时长显示 00:00', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio, { duration: 7325 });
        audio.currentTime = 4500;
        fireEvent.timeUpdate(audio);
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('1:15:002:02:05');

        act(() => loadMetadata(audio, { duration: Infinity }));
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('1:15:0000:00');
    });

    it('通过进度滑块跳转', () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        fireEvent.pointerDown(wrapper, { clientX: 50 });
        expect(audio.currentTime).toBe(30);
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('00:3002:00');
        fireEvent.pointerMove(wrapper, { clientX: 100 });
        expect(audio.currentTime).toBe(60);
        fireEvent.pointerUp(wrapper);
        fireEvent.lostPointerCapture(wrapper);
        fireEvent.pointerMove(wrapper, { clientX: 150 });
        expect(audio.currentTime).toBe(60);
        fireEvent.mouseEnter(wrapper, { clientX: 400 });
        expect(audio.currentTime).toBe(60);
        fireEvent.pointerDown(wrapper, { clientX: 400 });
        expect(audio.currentTime).toBe(120);
    });

    it('直播流（时长为 Infinity）下按下进度滑块不向 currentTime 写入非有限值', () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        const attempts: number[] = [];
        // a media element rejects a non-finite currentTime with a TypeError
        loadMetadata(audio, { duration: Number.POSITIVE_INFINITY });
        Object.defineProperty(audio, 'currentTime', {
            configurable: true,
            get: () => 0,
            set: (value: number) => {
                attempts.push(value);
                if (!Number.isFinite(value)) throw new TypeError('The provided double value is non-finite');
            },
        });
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        fireEvent.pointerDown(wrapper, { clientX: 50 });
        fireEvent.pointerDown(wrapper, { clientX: 0 });
        expect(attempts.every(Number.isFinite)).toBe(true);
    });

    it('只有主键按下进度滑块才跳转', () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        fireEvent.pointerDown(wrapper, { clientX: 50, button: 2 });
        fireEvent.pointerDown(wrapper, { clientX: 50, button: 1 });
        expect(audio.currentTime).toBe(0);
    });

    it('换源加载把播放中的 audio 暂停后，按钮与名称回到播放', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        setMedia(audio, { paused: false });
        fireEvent.play(audio);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        // the load algorithm pauses the element without a pause event
        setMedia(audio, { paused: true });
        fireEvent.loadStart(audio);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(screen.getByRole('button', { name: zh_CN.AudioPlayer.play })).toBeInTheDocument();
    });

    it('装饰性封面加载后不成为可预览的按钮', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks[0]} />);
        fireEvent.load(container.querySelector('img'));
        expect(screen.queryByRole('button', { name: zh_CN.Image.preview })).toBeNull();
        expect(container.querySelector('img').closest('[tabindex]')).toBeNull();
    });

    it('按 skipDuration 在曲目范围内后退与前进', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" skipDuration={15} />);
        const audio = container.querySelector('audio');
        loadMetadata(audio, { currentTime: 10 });
        fireEvent.click(buttonWith(container, 'fast_forward'));
        expect(audio.currentTime).toBe(25);
        fireEvent.click(buttonWith(container, 'backward'));
        fireEvent.click(buttonWith(container, 'backward'));
        expect(audio.currentTime).toBe(0);
        audio.currentTime = 115;
        fireEvent.click(buttonWith(container, 'fast_forward'));
        expect(audio.currentTime).toBe(120);
    });

    it('refresh 时从头播放曲目', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio, { currentTime: 50 });
        fireEvent.timeUpdate(audio);
        fireEvent.click(buttonWith(container, 'refresh'));
        expect(audio.currentTime).toBe(0);
        expect(audio.load).not.toHaveBeenCalled();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('00:0002:00');
    });

    it('音量按钮静音，再次点击恢复到一半音量', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        fireEvent.click(buttonWith(container, 'volume_2'));
        expect(audio.volume).toBe(0);
        expect(container.querySelector(icon('volumn_silent'))).toBeInTheDocument();
        fireEvent.click(buttonWith(container, 'volumn_silent'));
        expect(audio.volume).toBe(0.5);
        expect(container.querySelector(icon('volume_2'))).toBeInTheDocument();
    });

    it('在弹层中用竖向滑块设置音量', async () => {
        mockSliderRect(new DOMRect(0, 0, 4, 120));
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        hoverOpen(buttonWith(container, 'volume_2'));
        const title = await waitFor(() => {
            const found = document.querySelector(`.${prefixCls}-control-volume-title`);
            expect(found).toHaveTextContent('100%');
            return found;
        });
        const wrapper = title.parentElement.querySelector(`.${prefixCls}-slider-wrapper-vertical`);
        fireEvent.pointerDown(wrapper, { clientY: 90 });
        expect(audio.volume).toBe(0.25);
        expect(title).toHaveTextContent('25%');
    });

    it('通过倍速菜单修改播放速率', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        hoverOpen(container.querySelector(`.${prefixCls}-control-speed`));
        const items = await waitFor(() => {
            const found = document.querySelectorAll(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        expect([...items].map((item) => item.textContent)).toEqual(['0.5x', '0.75x', '1.0x', '1.5x', '2.0x']);
        fireEvent.click(items[3]);
        expect(audio.playbackRate).toBe(1.5);
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toHaveTextContent('1.5x');
    });

    it('原生 button 带 menu button 属性时可用键盘打开倍速菜单', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        const trigger = container.querySelector(`.${prefixCls}-control-speed`);
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        act(() => (trigger as HTMLElement).focus());
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        const items = document.querySelectorAll(`.${prefixCls}-control-speed-menu-item`);
        expect(items).toHaveLength(5);
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(items[0]).toHaveFocus();
        fireEvent.keyDown(items[0], { key: 'ArrowDown' });
        fireEvent.keyDown(items[1], { key: 'Enter' });
        expect(audio.playbackRate).toBe(0.75);
    });

    it('音量按钮获得焦点时打开音量弹层', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        loadMetadata(container.querySelector('audio'));
        const trigger = buttonWith(container, 'volume_2');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAccessibleName('音量');
        expect(trigger.parentElement.closest('[tabindex="0"]')).toBeNull();
        void act(() => trigger.focus());
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-control-volume`)).toBeInTheDocument());
    });

    it('音量弹层是名为音量的对话框', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const trigger = buttonWith(container, 'volume_2');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        void act(() => trigger.focus());
        const dialog = await screen.findByRole('dialog', { name: '音量' });
        expect(dialog).toContainElement(document.querySelector(`.${prefixCls}-control-volume`));
    });

    it('用上一首与下一首切换列表曲目，循环切换，并播放新的源', () => {
        let srcAtPlay = null;
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(function () {
            srcAtPlay = this.getAttribute('src');
            fireEvent.play(this);
            return Promise.resolve();
        });
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        const audio = container.querySelector('audio');
        loadMetadata(audio, { currentTime: 40, playbackRate: 2 });
        const [prev, next] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button'));
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track A');

        fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[1].src);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track B');
        expect(container.querySelector('img')).toBeNull();
        expect(srcAtPlay).toBe(tracks[1].src);
        expect(audio.currentTime).toBe(0);
        expect(audio.playbackRate).toBe(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();

        fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[2]);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[0].src);
        fireEvent.click(prev);
        expect(audio).toHaveAttribute('src', tracks[2]);
        expect(srcAtPlay).toBe(tracks[2]);
    });

    it('空列表不渲染曲目，列表变短到当前曲目之外时显示最后一首', () => {
        const { container, rerender } = render(<AudioPlayer audioUrl={[]} />);
        const audio = container.querySelector('audio');
        expect(audio).not.toHaveAttribute('src');
        expect(container.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        const [, emptyNext] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button'));
        fireEvent.click(emptyNext);
        fireEvent.ended(audio);
        expect(audio.play).not.toHaveBeenCalled();

        rerender(<AudioPlayer audioUrl={tracks} />);
        const [prev, next] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button'));
        fireEvent.click(prev);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        expect(audio).toHaveAttribute('src', tracks[2]);
        rerender(<AudioPlayer audioUrl={[tracks[0], tracks[1]]} />);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track B');
        expect(audio).toHaveAttribute('src', tracks[1].src);
        fireEvent.click(next);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track A');
    });

    it('播放被打断时的预期拒绝不成为未处理的拒绝', async () => {
        const unhandled = vi.fn<(reason: unknown) => void>();
        process.on('unhandledRejection', unhandled);
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        // a plain function: a vi.fn reads the returned promise, which marks the rejection handled
        container.querySelector('audio').play = () => Promise.reject(new DOMException('interrupted by a new load request', 'AbortError'));
        fireEvent.click(container.querySelector(`.${prefixCls}-control-button-play`));
        fireEvent.click(container.querySelectorAll(icon('restart'))[1].closest('button'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('上一首、下一首、后退与前进各占一个 Tab 焦点', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        loadMetadata(container.querySelector('audio'));
        const buttons = [...[...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button')), buttonWith(container, 'backward'), buttonWith(container, 'fast_forward')];
        expect(buttons).toHaveLength(4);
        for (const button of buttons) {
            expect(button.parentElement.closest('[tabindex="0"]')).toBeNull();
        }
    });

    it('上一首、下一首、后退与前进的名称从语言包读取', () => {
        const { getByRole } = render(<AudioPlayer audioUrl={tracks} skipDuration={10} />);
        for (const name of ['上一首', '下一首', '后退 10 秒', '前进 10 秒']) {
            expect(getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('列表按钮的标签从语言包读取', async () => {
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        const [prev] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('span'));
        hoverOpen(prev.parentElement);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-content`)).toHaveTextContent('上一首'));
    });

    it('单个源播放到结尾时停止，列表中则继续下一首', () => {
        const single = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        fireEvent.click(single.container.querySelector(`.${prefixCls}-control-button-play`));
        fireEvent.pause(single.container.querySelector('audio'));
        fireEvent.ended(single.container.querySelector('audio'));
        expect(single.container.querySelector(icon('play'))).toBeInTheDocument();
        single.unmount();

        const list = render(<AudioPlayer audioUrl={tracks} />);
        const audio = list.container.querySelector('audio');
        fireEvent.ended(audio);
        expect(audio).toHaveAttribute('src', tracks[1].src);
        expect(audio.play).toHaveBeenCalled();
        expect(list.container.querySelector(icon('pause'))).toBeInTheDocument();
    });

    it('显示错误状态，refresh 时重新加载源', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        const audio = container.querySelector('audio');
        fireEvent.error(audio);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toHaveTextContent('Track A');
        expect(container.querySelector(`.${prefixCls}-error`)).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeNull();
        const play = container.querySelector(`.${prefixCls}-control-button-play`);
        expect(play).toBeDisabled();
        expect(play).toHaveClass(`${prefixCls}-control-button-play-disabled`);
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
        expect(screen.getByRole('alert')).toHaveTextContent('音频加载失败');
        fireEvent.click(buttonWith(container, 'refresh'));
        expect(audio.load).toHaveBeenCalledTimes(1);
        fireEvent.click(container.querySelectorAll(icon('restart'))[1].closest('button'));
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeInTheDocument();
    });

    it('切歌后再触发 loadedmetadata，仍显示播放中；暂停事件后显示播放', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks} />);
        const audio = container.querySelector('audio');
        const [, next] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button'));
        fireEvent.click(next);
        fireEvent.play(audio);
        loadMetadata(audio);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        fireEvent.pause(audio);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('播放被拒绝、没有 play 事件时保持播放图标', () => {
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => Promise.resolve());
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        fireEvent.click(container.querySelector(`.${prefixCls}-control-button-play`));
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('音量调到 0 后再触发 loadedmetadata，音量仍为 0', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        fireEvent.click(buttonWith(container, 'volume_2'));
        expect(audio.volume).toBe(0);
        loadMetadata(audio, { volume: 0 });
        expect(container.querySelector(icon('volumn_silent'))).toBeInTheDocument();
    });

    it('出错后刷新，重新加载成功即恢复播放按钮与进度区', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        fireEvent.error(audio);
        fireEvent.click(buttonWith(container, 'refresh'));
        expect(audio.load).toHaveBeenCalledTimes(1);
        loadMetadata(audio);
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-control-button-play`)).not.toBeDisabled();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeInTheDocument();
    });

    it('元数据加载前点击前进、后退不抛错', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        expect(() => {
            fireEvent.click(buttonWith(container, 'fast_forward'));
            fireEvent.click(buttonWith(container, 'backward'));
        }).not.toThrow();
    });

    it('卸载时移除媒体监听', () => {
        const add = vi.spyOn(HTMLMediaElement.prototype, 'addEventListener');
        const remove = vi.spyOn(HTMLMediaElement.prototype, 'removeEventListener');
        const { unmount } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const live = () => ['ended', 'error', 'loadedmetadata'].map((type) => countLiveListeners(add, remove, type));
        // React attaches its own media listeners to the element and never removes them, so only ours go away
        const mounted = live();
        unmount();
        expect(live().map((count, i) => mounted[i] - count)).toEqual([1, 1, 1]);
    });

    it('StrictMode 下只监听一次', () => {
        const { container } = render(
            <StrictMode>
                <AudioPlayer audioUrl="https://example.com/a.mp3" />
            </StrictMode>
        );
        const audio = container.querySelector('audio');
        act(() => loadMetadata(audio, { duration: 30 }));
        expect(container.querySelector(`.${prefixCls}-info-time`)).toHaveTextContent('00:0000:30');
        fireEvent.click(container.querySelector(`.${prefixCls}-control-button-play`));
        expect(audio.play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
    });

    describe('函数组件', () => {
        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('把未知属性传给根元素，并让 ref 指向根元素', () => {
            const ref = createRef<HTMLDivElement>();
            const { container } = render(<AudioPlayer ref={ref} data-testid="player" aria-label="Song" audioUrl="https://example.com/a.mp3" />);
            const root = container.firstChild;
            expect(root).toHaveAttribute('data-testid', 'player');
            expect(root).toHaveAttribute('aria-label', 'Song');
            expect(container.querySelector('audio')).not.toHaveAttribute('data-testid');
            expect(ref.current).toBe(root);
        });

        it('根元素被命名时成为 group，使用方给出的 role 优先', () => {
            const { rerender } = render(<AudioPlayer aria-label="播客" audioUrl="https://example.com/a.mp3" />);
            expect(screen.getByRole('group', { name: '播客' })).toHaveClass(prefixCls);
            rerender(<AudioPlayer aria-label="播客" role="application" audioUrl="https://example.com/a.mp3" />);
            expect(screen.getByRole('application', { name: '播客' })).toHaveClass(prefixCls);
            rerender(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
            expect(document.querySelector(`.${prefixCls}`)).not.toHaveAttribute('role');
        });

        it('读取全局默认属性', () => {
            semiGlobal.config.overrideDefaultProps = { AudioPlayer: { theme: 'light', showToolbar: false } };
            const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
            expect(container.firstChild).toHaveClass(`${prefixCls}-light`);
            expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
        });

        it('显示本地化的错误文案', () => {
            const { container } = render(
                <LocaleProvider locale={en_US}>
                    <AudioPlayer audioUrl={tracks} />
                </LocaleProvider>
            );
            fireEvent.error(container.querySelector('audio'));
            expect(container.querySelector(`.${prefixCls}-error`)).toHaveTextContent('Audio load error');
        });

        it('没有标题的源加载失败时同样显示并播报失败文案', () => {
            const { container } = render(
                <LocaleProvider locale={en_US}>
                    <AudioPlayer audioUrl="https://example.com/a.mp3" />
                </LocaleProvider>
            );
            fireEvent.error(container.querySelector('audio'));
            expect(within(container).getByRole('alert')).toHaveTextContent(en_US.AudioPlayer.mediaError);
        });

        it('时长未知时进度样式保持有效', () => {
            const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
            expect(container.querySelector<HTMLElement>(`.${prefixCls}-slider-dot`).style.left).toBe('calc(0% - 8px)');
            expect(container.querySelector<HTMLElement>(`.${prefixCls}-slider-progress`).style.width).toBe('0%');
        });
    });
});

describe('AudioPlayer 封面', () => {
    it('标题已显示在旁边，因此封面是装饰性的', () => {
        const { container } = render(<AudioPlayer audioUrl={tracks[0]} />);
        expect(container.querySelector('img')).toHaveAttribute('alt', '');
    });
});

describe('AudioPlayer 滑块', () => {
    beforeEach(() => {
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
            setMedia(this, { paused: false });
            fireEvent.play(this);
            return Promise.resolve();
        });
        vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
            setMedia(this, { paused: true });
            fireEvent.pause(this);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('外层包装不是 Tab 焦点，只有内部的 range input 是', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        expect(container.querySelector(`.${prefixCls}-slider-wrapper-horizontal`)).toHaveAttribute('tabindex', '-1');
    });

    it('进度条是有名称的 slider，并朗读其时间', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio, { duration: 200 });
        setMedia(audio, { currentTime: 65 });
        fireEvent.timeUpdate(audio);
        const slider = within(container).getByRole('slider', { name: '播放进度' });
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('max', '200');
        expect(slider).toHaveValue('65');
        expect(slider).toHaveAttribute('aria-valuetext', '1 分 05 秒 / 3 分 20 秒');
    });

    it('进度输入变化时跳转音频', () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        fireEvent.change(within(container).getByRole('slider', { name: '播放进度' }), { target: { value: '66' } });
        expect(audio.currentTime).toBe(66);
    });

    it('音量条是名为 Volume 的竖向 slider，并带百分比', async () => {
        const { container } = render(<AudioPlayer audioUrl="https://example.com/a.mp3" />);
        const audio = container.querySelector('audio');
        loadMetadata(audio);
        hoverOpen(buttonWith(container, 'volume_2'));
        const slider = await screen.findByRole('slider', { name: '音量' });
        expect(slider).toHaveAttribute('aria-orientation', 'vertical');
        expect(slider).toHaveAttribute('max', '100');
        expect(slider).toHaveAttribute('aria-valuetext', '100%');
        fireEvent.change(slider, { target: { value: '40' } });
        expect(audio.volume).toBe(0.4);
        expect(slider).toHaveAttribute('aria-valuetext', '40%');
    });
});

describe('AudioPlayer 类型', () => {
    it('不接受永远不会触发的媒体事件回调', () => {
        expectTypeOf<AudioPlayerProps>().not.toHaveProperty('onTimeUpdate');
        expectTypeOf<AudioPlayerProps>().not.toHaveProperty('onEndedCapture');
        expectTypeOf<AudioPlayerProps>().toHaveProperty('onClick');
    });
});
