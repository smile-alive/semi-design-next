/** @jsxImportSource vue */
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners, endLeaveAnimations, render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import AudioPlayer from '../audio-player.vue';
import type { AudioPlayerProps } from '../interface';
import CachedPlayer from './fixtures/cached-player.vue';
import RootRef from './fixtures/root-ref.vue';

const prefixCls = 'semi-audio-player';
const icon = (name: string) => `.semi-icon-${name}`;
const SRC = 'https://example.com/a.mp3';

const tracks: [{ src: string; title: string; cover: string }, { src: string; title: string }, string] = [{ src: 'https://example.com/a.mp3', title: 'Track A', cover: 'https://example.com/a.png' }, { src: 'https://example.com/b.mp3', title: 'Track B' }, 'https://example.com/c.mp3'];

const query = <E extends Element = HTMLElement>(container: Element | Document, selector: string) => {
    const found = container.querySelector<E>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
};
const closestButton = (container: Element, name: string) => {
    const button = query(container, icon(name)).closest('button');
    if (!button) throw new Error(`no button around ${name}`);
    return button;
};
const getAudio = (container: Element) => query<HTMLAudioElement>(container, 'audio');
const timeText = (container: Element) => query(container, `.${prefixCls}-info-time`).textContent?.replace(/\s/g, '');

// jsdom has no media pipeline: give the element the values a loaded file would have
function setMedia(element: HTMLMediaElement, values: Record<string, unknown>) {
    for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(element, key, { configurable: true, writable: true, value });
    }
}

function loadMetadata(audio: HTMLMediaElement, values: Record<string, unknown> = {}) {
    setMedia(audio, { duration: 120, currentTime: 0, volume: 1, playbackRate: 1, ...values });
    return fireEvent(audio, new Event('loadedmetadata'));
}

// Tooltip re-checks `:hover` once the popup is positioned, and jsdom never matches it. closest() does not go through
// the spied matches, and an element is its own closest match.
function hoverOpen(el: Element) {
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function matches(this: Element, selector: string) {
        return selector === ':hover' ? this.contains(el) || el.contains(this) : this.closest(selector) === this;
    });
    return fireEvent.mouseEnter(el);
}

function mockSliderRect(rect: DOMRect) {
    const real = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains(`${prefixCls}-slider`) ? rect : real.call(this);
    });
}

const renderPlayer = (props: Partial<AudioPlayerProps> & Record<string, unknown> = {}) => render(AudioPlayer, { props: { audioUrl: SRC, ...props } });

const globalWith = (overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) => {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
};

const withLocale = (locale: typeof en_US, props: AudioPlayerProps) => render({ render: () => <ConfigProvider locale={locale}>{() => <AudioPlayer {...props} />}</ConfigProvider> });

beforeEach(() => {
    // a real element reports `paused` and fires play and pause when its state changes
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
        setMedia(this, { paused: false });
        void fireEvent(this, new Event('play'));
        return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
        setMedia(this, { paused: true });
        void fireEvent(this, new Event('pause'));
    });
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

describe('AudioPlayer', () => {
    it('默认以深色主题渲染 audio 元素、控件、信息与工具栏', () => {
        const { container } = renderPlayer({ class: 'custom', style: { width: '600px' } });
        const root = query(container, `.${prefixCls}`);
        expect(root).toHaveClass(prefixCls, 'custom', `${prefixCls}-dark`);
        expect(root).toHaveStyle({ width: '600px' });
        const audio = getAudio(root);
        expect(audio).toHaveAttribute('src', SRC);
        expect(audio.autoplay).toBe(false);
        // the hidden media element does not repeat the root's class and style
        expect(audio).not.toHaveAttribute('class');
        expect(audio).not.toHaveAttribute('style');
        // the captions track exists for the media rule only: it does not point at the audio itself
        expect(query(audio, 'track')).not.toHaveAttribute('src');
        expect(root.querySelector(`.${prefixCls}-control-button-play`)).toBeInTheDocument();
        expect(root.querySelector(icon('play'))).toBeInTheDocument();
        expect(root.querySelector(icon('restart'))).toBeNull();
        expect(root.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        expect(root.querySelector('img')).toBeNull();
        expect(timeText(root)).toBe('00:0000:00');
        expect(query(root, `.${prefixCls}-control-speed`)).toHaveTextContent('1.0x');
        for (const name of ['volume_2', 'backward', 'fast_forward', 'refresh']) {
            expect(root.querySelector(icon(name))).toBeInTheDocument();
        }
    });

    it('在根元素与滑块上应用浅色主题', () => {
        const { container } = renderPlayer({ theme: 'light' });
        expect(query(container, `.${prefixCls}`)).toHaveClass(`${prefixCls}-light`);
        expect(query(container, `.${prefixCls}-slider`)).toHaveClass(`${prefixCls}-slider-light`);
    });

    it.each(['light', 'dark'] as const)('为 portal 出的倍速菜单设置 %s 主题类名', async (theme) => {
        const { container } = renderPlayer({ theme });
        await loadMetadata(getAudio(container));
        await hoverOpen(query(container, `.${prefixCls}-control-speed`));
        const item = await waitFor(() => query(document, `.${prefixCls}-control-speed-menu-item`));
        // outside the player root, where a root-theme descendant selector cannot match
        expect(query(container, `.${prefixCls}`)).not.toContainElement(item);
        expect(item.closest(`.${prefixCls}-control-speed-menu`)).toHaveClass(`${prefixCls}-control-speed-menu-${theme}`);
    });

    it.each(['light', 'dark'] as const)('为 portal 出的音量弹层设置 %s 主题类名', async (theme) => {
        const { container } = renderPlayer({ theme });
        await loadMetadata(getAudio(container));
        await hoverOpen(closestButton(container, 'volume_2'));
        const volume = await waitFor(() => query(document, `.${prefixCls}-control-volume`));
        expect(query(container, `.${prefixCls}`)).not.toContainElement(volume);
        expect(volume).toHaveClass(`${prefixCls}-control-volume-${theme}`);
    });

    it('showToolbar 为 false 时隐藏工具栏', () => {
        const { container } = renderPlayer({ showToolbar: false });
        expect(container.querySelectorAll(`.${prefixCls}-control`)).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
    });

    it('把 autoPlay 传给 audio 元素，开始播放后上报播放中', async () => {
        const { container } = renderPlayer({ autoPlay: true });
        const audio = getAudio(container);
        expect(audio.autoplay).toBe(true);
        // a blocked autoplay never plays, so the button stays on play
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        await loadMetadata(audio, { duration: 65, volume: 0.4 });
        await fireEvent(audio, new Event('play'));
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        expect(timeText(container)).toBe('00:0001:05');
        expect(container.querySelector(`.${prefixCls}-control-volume-title`)).toBeNull();
        expect(query(container, `.${prefixCls}-control-speed`)).toHaveTextContent('1.0x');
    });

    it('元数据加载前选择的倍速在加载后仍显示', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await hoverOpen(query(container, `.${prefixCls}-control-speed`));
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        await fireEvent.click(items[3]);
        expect(audio.playbackRate).toBe(1.5);
        // the media load algorithm resets playbackRate to defaultPlaybackRate
        expect(audio.defaultPlaybackRate).toBe(1.5);
        await loadMetadata(audio, { playbackRate: 1.5 });
        expect(query(container, `.${prefixCls}-control-speed`)).toHaveTextContent('1.5x');
    });

    it('读取 AudioInfo 对象的 title 与 cover', () => {
        const { container } = renderPlayer({ audioUrl: tracks[0] });
        expect(getAudio(container)).toHaveAttribute('src', tracks[0].src);
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track A');
        expect(query(container, 'img')).toHaveAttribute('src', tracks[0].cover);
    });

    it('播放按钮切换播放与暂停', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await fireEvent.click(query(container, `.${prefixCls}-control-button-play`));
        expect(audio.play).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        await fireEvent.click(query(container, `.${prefixCls}-control-button-play`));
        expect(audio.pause).toHaveBeenCalledTimes(1);
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('timeupdate 时显示元素时间', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        audio.currentTime = 75;
        await fireEvent(audio, new Event('timeupdate'));
        expect(timeText(container)).toBe('01:1502:00');
    });

    it('超过一小时的时间显示为 h:mm:ss，未知时长显示 00:00', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio, { duration: 7325 });
        audio.currentTime = 4500;
        await fireEvent(audio, new Event('timeupdate'));
        expect(timeText(container)).toBe('1:15:002:02:05');
        await loadMetadata(audio, { duration: Infinity, currentTime: 4500 });
        expect(timeText(container)).toBe('1:15:0000:00');
    });

    it('通过进度滑块跳转', async () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        await fireEvent.pointerDown(wrapper, { clientX: 50 });
        expect(audio.currentTime).toBe(30);
        expect(timeText(container)).toBe('00:3002:00');
        // the slider captures the pointer, so a browser sends it the moves and the release wherever the pointer is
        await fireEvent.pointerMove(wrapper, { clientX: 100 });
        expect(audio.currentTime).toBe(60);
        await fireEvent.pointerUp(wrapper);
        await fireEvent.lostPointerCapture(wrapper);
        await fireEvent.pointerMove(wrapper, { clientX: 150 });
        expect(audio.currentTime).toBe(60);
        // a hover alone does not seek, and the position is clamped to the track
        await fireEvent.mouseEnter(wrapper, { clientX: 400 });
        expect(audio.currentTime).toBe(60);
        await fireEvent.pointerDown(wrapper, { clientX: 400 });
        expect(audio.currentTime).toBe(120);
    });

    it('按 skipDuration 在曲目范围内后退与前进', async () => {
        const { container } = renderPlayer({ skipDuration: 15 });
        const audio = getAudio(container);
        await loadMetadata(audio, { currentTime: 10 });
        await fireEvent.click(closestButton(container, 'fast_forward'));
        expect(audio.currentTime).toBe(25);
        await fireEvent.click(closestButton(container, 'backward'));
        await fireEvent.click(closestButton(container, 'backward'));
        expect(audio.currentTime).toBe(0);
        audio.currentTime = 115;
        await fireEvent.click(closestButton(container, 'fast_forward'));
        expect(audio.currentTime).toBe(120);
    });

    it('refresh 时从头播放曲目', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio, { currentTime: 50 });
        await fireEvent(audio, new Event('timeupdate'));
        await fireEvent.click(closestButton(container, 'refresh'));
        expect(audio.currentTime).toBe(0);
        expect(audio.load).not.toHaveBeenCalled();
        expect(timeText(container)).toBe('00:0002:00');
    });

    it('音量按钮切换为静音图标', async () => {
        const { container } = renderPlayer();
        await loadMetadata(getAudio(container));
        await fireEvent.click(closestButton(container, 'volume_2'));
        expect(container.querySelector(icon('volumn_silent'))).toBeInTheDocument();
        await fireEvent.click(closestButton(container, 'volumn_silent'));
        expect(container.querySelector(icon('volume_2'))).toBeInTheDocument();
    });

    it('在弹层中用竖向滑块设置音量', async () => {
        mockSliderRect(new DOMRect(0, 0, 4, 120));
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        await hoverOpen(closestButton(container, 'volume_2'));
        const title = await waitFor(() => {
            const found = query(document, `.${prefixCls}-control-volume-title`);
            expect(found).toHaveTextContent('100%');
            return found;
        });
        const wrapper = query(title.parentElement as Element, `.${prefixCls}-slider-wrapper-vertical`);
        await fireEvent.pointerDown(wrapper, { clientY: 90 });
        expect(audio.volume).toBe(0.25);
        expect(title).toHaveTextContent('25%');
    });

    it('通过倍速菜单修改播放速率', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        await hoverOpen(query(container, `.${prefixCls}-control-speed`));
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        expect([...items].map((item) => item.textContent?.trim())).toEqual(['0.5x', '0.75x', '1.0x', '1.5x', '2.0x']);
        await fireEvent.click(items[3]);
        expect(audio.playbackRate).toBe(1.5);
        expect(query(container, `.${prefixCls}-control-speed`)).toHaveTextContent('1.5x');
    });

    it('倍速是单选菜单，按钮名称为用途加当前倍速', async () => {
        const { container } = withLocale(en_US, { audioUrl: SRC });
        await loadMetadata(getAudio(container));
        const trigger = query(container, `.${prefixCls}-control-speed`);
        expect(trigger).toHaveAccessibleName(`${en_US.AudioPlayer.playbackRate} 1.0x`);
        await hoverOpen(trigger);
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return [...found];
        });
        expect(items.every((item) => item.getAttribute('role') === 'menuitemradio')).toBe(true);
        const checked = items.filter((item) => item.getAttribute('aria-checked') === 'true');
        expect(checked.map((item) => item.textContent?.trim())).toEqual(['1.0x']);
        await fireEvent.click(items[3]);
        expect(trigger).toHaveAccessibleName(`${en_US.AudioPlayer.playbackRate} 1.5x`);
    });

    it('原生 button 带 menu button 属性时可用键盘打开倍速菜单', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        const trigger = query(container, `.${prefixCls}-control-speed`);
        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        trigger.focus();
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(items[0]).toHaveFocus();
        await fireEvent.keyDown(items[0], { key: 'ArrowDown' });
        await fireEvent.keyDown(items[1], { key: 'Enter' });
        expect(audio.playbackRate).toBe(0.75);
    });

    it('音量按钮获得焦点时打开名为音量的对话框弹层', async () => {
        const { container } = renderPlayer();
        await loadMetadata(getAudio(container));
        const trigger = closestButton(container, 'volume_2');
        expect(trigger).toHaveAttribute('type', 'button');
        expect(trigger).toHaveAccessibleName('音量');
        // the popup holds a focusable slider, so it is a dialog rather than a tooltip
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger.parentElement?.closest('[tabindex="0"]')).toBeNull();
        trigger.focus();
        const dialog = await waitFor(() => screen.getByRole('dialog', { name: '音量' }));
        expect(dialog).toContainElement(query(document, `.${prefixCls}-control-volume`));
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('用上一首与下一首切换列表曲目，循环切换，并播放新的源', async () => {
        let srcAtPlay: string | null = null;
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(function (this: HTMLMediaElement) {
            srcAtPlay = this.getAttribute('src');
            void fireEvent(this, new Event('play'));
            return Promise.resolve();
        });
        const { container } = renderPlayer({ audioUrl: tracks });
        const audio = getAudio(container);
        await loadMetadata(audio, { currentTime: 40, playbackRate: 2 });
        const [prev, next] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button') as HTMLButtonElement);
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track A');

        await fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[1].src);
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track B');
        expect(container.querySelector('img')).toBeNull();
        // the new source is in the DOM before it is played, from the start at the normal rate
        expect(srcAtPlay).toBe(tracks[1].src);
        expect(audio.currentTime).toBe(0);
        expect(audio.playbackRate).toBe(1);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();

        await fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[2]);
        expect(container.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        await fireEvent.click(next);
        expect(audio).toHaveAttribute('src', tracks[0].src);
        await fireEvent.click(prev);
        expect(audio).toHaveAttribute('src', tracks[2]);
        expect(srcAtPlay).toBe(tracks[2]);
    });

    it('上一首、下一首、后退与前进各占一个 Tab 焦点', async () => {
        const { container } = renderPlayer({ audioUrl: tracks });
        await loadMetadata(getAudio(container));
        const buttons = [...[...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button') as HTMLButtonElement), closestButton(container, 'backward'), closestButton(container, 'fast_forward')];
        expect(buttons).toHaveLength(4);
        for (const button of buttons) {
            // a wrapper with tabindex="0" around the button would be a second stop
            expect(button.parentElement?.closest('[tabindex="0"]')).toBeNull();
        }
    });

    // the Tooltip text only describes the button; an icon-only button needs its own name
    it('上一首、下一首、后退与前进的名称从语言包读取', () => {
        renderPlayer({ audioUrl: tracks, skipDuration: 10 });
        for (const name of ['上一首', '下一首', '后退 10 秒', '前进 10 秒']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });

    it('列表按钮的提示文字从语言包读取', async () => {
        const { container } = renderPlayer({ audioUrl: tracks });
        const [prev] = [...container.querySelectorAll(icon('restart'))].map((el) => el.closest('button') as HTMLButtonElement);
        await hoverOpen(prev);
        await waitFor(() => expect(query(document, '.semi-tooltip-content')).toHaveTextContent('上一首'));
    });

    it('单个源播放到结尾时停止，列表中则继续下一首', async () => {
        const single = renderPlayer();
        await fireEvent.click(query(single.container, `.${prefixCls}-control-button-play`));
        // an element that reaches its end pauses before it fires ended
        await fireEvent(getAudio(single.container), new Event('pause'));
        await fireEvent(getAudio(single.container), new Event('ended'));
        expect(single.container.querySelector(icon('play'))).toBeInTheDocument();
        single.unmount();

        const list = renderPlayer({ audioUrl: tracks });
        const audio = getAudio(list.container);
        await fireEvent(audio, new Event('ended'));
        expect(audio).toHaveAttribute('src', tracks[1].src);
        expect(audio.play).toHaveBeenCalled();
        expect(list.container.querySelector(icon('pause'))).toBeInTheDocument();
    });

    it('显示错误状态并播报，refresh 时重新加载源', async () => {
        const { container } = renderPlayer({ audioUrl: tracks });
        const audio = getAudio(container);
        await fireEvent(audio, new Event('error'));
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track A');
        expect(query(container, `.${prefixCls}-error`)).toHaveAttribute('role', 'alert');
        expect(within(container as HTMLElement).getByRole('alert')).toHaveTextContent('音频加载失败');
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeNull();
        const play = query(container, `.${prefixCls}-control-button-play`);
        expect(play).toBeDisabled();
        expect(play).toHaveClass(`${prefixCls}-control-button-play-disabled`);
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
        await fireEvent.click(closestButton(container, 'refresh'));
        expect(audio.load).toHaveBeenCalledTimes(1);
        await fireEvent.click(container.querySelectorAll(icon('restart'))[1].closest('button') as HTMLButtonElement);
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeInTheDocument();
    });

    it('直播流（时长为 Infinity）下按下进度滑块不向 currentTime 写入非有限值', async () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = renderPlayer();
        const audio = getAudio(container);
        const attempts: number[] = [];
        await loadMetadata(audio, { duration: Number.POSITIVE_INFINITY });
        // a media element rejects a non-finite currentTime with a TypeError
        Object.defineProperty(audio, 'currentTime', {
            configurable: true,
            get: () => 0,
            set: (value: number) => {
                attempts.push(value);
                if (!Number.isFinite(value)) throw new TypeError('The provided double value is non-finite');
            },
        });
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        await fireEvent.pointerDown(wrapper, { clientX: 50 });
        await fireEvent.pointerDown(wrapper, { clientX: 0 });
        expect(attempts.every(Number.isFinite)).toBe(true);
    });

    it('只有主键按下进度滑块才跳转', async () => {
        mockSliderRect(new DOMRect(0, 0, 200, 4));
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        await fireEvent.pointerDown(wrapper, { clientX: 50, button: 2 });
        await fireEvent.pointerDown(wrapper, { clientX: 50, button: 1 });
        expect(audio.currentTime).toBe(0);
    });

    it('换源加载把播放中的 audio 暂停后，按钮与名称回到播放', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        setMedia(audio, { paused: false });
        await fireEvent(audio, new Event('play'));
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        // the load algorithm pauses the element without a pause event
        setMedia(audio, { paused: true });
        await fireEvent(audio, new Event('loadstart'));
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
        expect(screen.getByRole('button', { name: zh_CN.AudioPlayer.play })).toBeInTheDocument();
    });

    it('装饰性封面加载后不成为可预览的按钮', async () => {
        const { container } = renderPlayer({ audioUrl: tracks[0] });
        await fireEvent.load(query(container, 'img'));
        expect(screen.queryByRole('button', { name: zh_CN.Image.preview })).toBeNull();
        expect(query(container, 'img').closest('[tabindex]')).toBeNull();
    });

    it('切歌后再触发 loadedmetadata，仍显示播放中；暂停事件后显示播放', async () => {
        const { container } = renderPlayer({ audioUrl: tracks });
        const audio = getAudio(container);
        const next = container.querySelectorAll(icon('restart'))[1].closest('button') as HTMLButtonElement;
        await fireEvent.click(next);
        await fireEvent(audio, new Event('play'));
        await loadMetadata(audio);
        expect(container.querySelector(icon('pause'))).toBeInTheDocument();
        await fireEvent(audio, new Event('pause'));
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('播放被拒绝、没有 play 事件时保持播放图标', async () => {
        vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => Promise.resolve());
        const { container } = renderPlayer();
        await fireEvent.click(query(container, `.${prefixCls}-control-button-play`));
        expect(container.querySelector(icon('play'))).toBeInTheDocument();
    });

    it('音量调到 0 后再触发 loadedmetadata，音量仍为 0', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        await hoverOpen(closestButton(container, 'volume_2'));
        const slider = await waitFor(() => screen.getByRole('slider', { name: '音量' }));
        await fireEvent.update(slider, '0');
        expect(audio.volume).toBe(0);
        await loadMetadata(audio, { volume: 0 });
        expect(container.querySelector(icon('volumn_silent'))).toBeInTheDocument();
    });

    it('出错后刷新，重新加载成功即恢复播放按钮与进度区', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await fireEvent(audio, new Event('error'));
        await fireEvent.click(closestButton(container, 'refresh'));
        expect(audio.load).toHaveBeenCalledTimes(1);
        await loadMetadata(audio);
        expect(container.querySelector(`.${prefixCls}-error`)).toBeNull();
        expect(query(container, `.${prefixCls}-control-button-play`)).not.toBeDisabled();
        expect(container.querySelector(`.${prefixCls}-info-time`)).toBeInTheDocument();
        expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeInTheDocument();
    });

    it('元数据加载前点击前进、后退不抛错', async () => {
        const { container } = renderPlayer();
        await fireEvent.click(closestButton(container, 'fast_forward'));
        await fireEvent.click(closestButton(container, 'backward'));
        expect(getAudio(container).currentTime).toBe(0);
    });

    it('卸载时移除媒体监听', () => {
        const add = vi.spyOn(HTMLMediaElement.prototype, 'addEventListener');
        const remove = vi.spyOn(HTMLMediaElement.prototype, 'removeEventListener');
        const { unmount } = renderPlayer();
        const live = () => ['ended', 'error', 'loadedmetadata'].map((type) => countLiveListeners(add, remove, type));
        const mounted = live();
        unmount();
        expect(live().map((count, i) => mounted[i] - count)).toEqual([1, 1, 1]);
    });

    it('audioUrl 列表缩短到当前曲目之外时播放最后一首，空列表不渲染曲目', async () => {
        const { container, rerender } = renderPlayer({ audioUrl: tracks });
        const next = container.querySelectorAll(icon('restart'))[1].closest('button') as HTMLButtonElement;
        await fireEvent.click(next);
        await fireEvent.click(next);
        expect(getAudio(container)).toHaveAttribute('src', tracks[2]);
        await rerender({ audioUrl: tracks.slice(0, 2) });
        expect(getAudio(container)).toHaveAttribute('src', tracks[1].src);
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track B');
        await rerender({ audioUrl: [] });
        expect(getAudio(container)).not.toHaveAttribute('src');
        expect(container.querySelector(`.${prefixCls}-info-title`)).toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    it('audioUrl 列表缩短后，下一首、上一首与播完都从被钳制的曲目继续', async () => {
        const { container, rerender } = renderPlayer({ audioUrl: tracks });
        const button = (index: number) => container.querySelectorAll(icon('restart'))[index].closest('button') as HTMLButtonElement;
        await fireEvent.click(button(1));
        await fireEvent.click(button(1));
        await rerender({ audioUrl: tracks.slice(0, 2) });
        await fireEvent.click(button(1));
        expect(getAudio(container)).toHaveAttribute('src', tracks[0].src);
        expect(query(container, `.${prefixCls}-info-title`)).toHaveTextContent('Track A');

        await rerender({ audioUrl: tracks });
        await fireEvent.click(button(1));
        await fireEvent.click(button(1));
        await rerender({ audioUrl: tracks.slice(0, 2) });
        await fireEvent.click(button(0));
        expect(getAudio(container)).toHaveAttribute('src', tracks[0].src);

        await rerender({ audioUrl: tracks });
        await fireEvent.click(button(1));
        await fireEvent.click(button(1));
        await rerender({ audioUrl: tracks.slice(0, 2) });
        await fireEvent(getAudio(container), new Event('ended'));
        expect(getAudio(container)).toHaveAttribute('src', tracks[0].src);
    });

    it('空列表播完与切歌都不播放，也不改变曲目', async () => {
        const { container, rerender } = renderPlayer({ audioUrl: [] });
        const audio = getAudio(container);
        await fireEvent(audio, new Event('ended'));
        await fireEvent.click(container.querySelectorAll(icon('restart'))[1].closest('button') as HTMLButtonElement);
        expect(audio.play).not.toHaveBeenCalled();
        // the index stayed a number, so a list that arrives later starts at its first track
        await rerender({ audioUrl: tracks });
        expect(audio).toHaveAttribute('src', tracks[0].src);
    });

    it('播放被打断时的预期拒绝不成为未处理的拒绝', async () => {
        const unhandled = vi.fn<(reason: unknown) => void>();
        process.on('unhandledRejection', unhandled);
        const { container } = renderPlayer({ audioUrl: tracks });
        // a plain function: a vi.fn reads the promise it returns, which marks the rejection handled
        getAudio(container).play = () => Promise.reject(new DOMException('interrupted by a new load request', 'AbortError'));
        await fireEvent.click(query(container, `.${prefixCls}-control-button-play`));
        await fireEvent.click(container.querySelectorAll(icon('restart'))[1].closest('button') as HTMLButtonElement);
        await new Promise((resolve) => setTimeout(resolve, 0));
        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('KeepAlive 切走再切回后音量弹层已关闭', async () => {
        const { container } = render(CachedPlayer);
        const trigger = closestButton(container, 'volume_2');
        trigger.focus();
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        await fireEvent.click(screen.getByText('toggle'));
        await fireEvent.click(screen.getByText('toggle'));
        expect(closestButton(container, 'volume_2')).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    describe('属性与默认值', () => {
        it('未声明的属性落到根元素，组件 ref 的 $el 是根元素', () => {
            let root: Element | undefined;
            const { container } = render(RootRef, { props: { onReady: (el: Element) => (root = el) } });
            const player = query(container, `.${prefixCls}`);
            expect(player).toHaveAttribute('data-testid', 'player');
            expect(getAudio(container)).not.toHaveAttribute('data-testid');
            expect(root).toBe(player);
        });

        it('根元素被命名时为 group，使用方给出的 role 优先', async () => {
            const { container, rerender } = renderPlayer({ 'aria-label': 'Song' });
            const root = query(container, `.${prefixCls}`);
            expect(root).toHaveAttribute('role', 'group');
            expect(root).toHaveAccessibleName('Song');
            await rerender({ audioUrl: SRC, 'aria-label': 'Song', role: 'region' });
            expect(root).toHaveAttribute('role', 'region');
            // rerender merges props, so the attributes are dropped by passing undefined
            await rerender({ audioUrl: SRC, 'aria-label': undefined, role: undefined });
            expect(root).not.toHaveAttribute('role');
        });

        it('根元素上的 click 监听由使用方原样收到', async () => {
            const onClick = vi.fn<(event: MouseEvent) => void>();
            const { container } = renderPlayer({ onClick });
            await fireEvent.click(query(container, `.${prefixCls}-info-container`));
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('读取全局默认属性，传入值优先', () => {
            const global = globalWith({ AudioPlayer: { theme: 'light', showToolbar: false, skipDuration: 5 } });
            const { container, unmount } = render(AudioPlayer, { props: { audioUrl: tracks }, global });
            expect(query(container, `.${prefixCls}`)).toHaveClass(`${prefixCls}-light`);
            expect(container.querySelector(`.${prefixCls}-control-speed`)).toBeNull();
            unmount();
            render(AudioPlayer, { props: { audioUrl: tracks, showToolbar: true }, global });
            expect(screen.getByRole('button', { name: '前进 5 秒' })).toBeInTheDocument();
        });

        it('显示本地化的错误文案', async () => {
            const { container } = withLocale(en_US, { audioUrl: tracks });
            await fireEvent(getAudio(container), new Event('error'));
            expect(query(container, `.${prefixCls}-error`)).toHaveTextContent('Audio load error');
        });

        it('没有标题的源加载失败时同样显示并播报失败文案', async () => {
            const { container } = withLocale(en_US, { audioUrl: SRC });
            await fireEvent(getAudio(container), new Event('error'));
            expect(within(container as HTMLElement).getByRole('alert')).toHaveTextContent(en_US.AudioPlayer.mediaError);
        });

        it('按钮与滑块的名称随语言包切换', () => {
            withLocale(ja_JP, { audioUrl: tracks, skipDuration: 10 });
            for (const name of ['前へ', '次へ', '戻る 10秒', '進む 10秒', '再生', '再読み込み', '音量']) {
                expect(screen.getByRole('button', { name })).toBeInTheDocument();
            }
            expect(screen.getByRole('slider', { name: '再生の進行状況' })).toBeInTheDocument();
        });

        it('时长未知时进度样式保持有效', () => {
            const { container } = renderPlayer();
            expect(query(container, `.${prefixCls}-slider-dot`).style.left).toBe('calc(0% - 8px)');
            expect(query(container, `.${prefixCls}-slider-progress`).style.width).toBe('0%');
        });
    });
});

describe('AudioPlayer 封面', () => {
    it('标题已显示在旁边，因此封面是装饰性的', () => {
        const { container } = renderPlayer({ audioUrl: tracks[0] });
        expect(query(container, 'img')).toHaveAttribute('alt', '');
    });
});

describe('AudioPlayer 滑块', () => {
    it('外层包装不是 Tab 焦点，只有内部的 range input 是', () => {
        const { container } = renderPlayer();
        expect(query(container, `.${prefixCls}-slider-wrapper-horizontal`)).toHaveAttribute('tabindex', '-1');
    });

    it('进度条是有名称的 slider，并朗读其时间', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio, { duration: 200 });
        setMedia(audio, { currentTime: 65 });
        await fireEvent(audio, new Event('timeupdate'));
        const slider = within(container as HTMLElement).getByRole('slider', { name: '播放进度' });
        // a native range exposes its own min, max and value as the slider's aria-valuemin, -valuemax and -valuenow
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('max', '200');
        expect(slider).toHaveValue('65');
        expect(slider).toHaveAttribute('aria-valuetext', '1 分 05 秒 / 3 分 20 秒');
    });

    it('进度输入变化时跳转音频', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        await fireEvent.update(within(container as HTMLElement).getByRole('slider', { name: '播放进度' }), '66');
        expect(audio.currentTime).toBe(66);
    });

    it('音量条是名为音量的竖向 slider，并带百分比', async () => {
        const { container } = renderPlayer();
        const audio = getAudio(container);
        await loadMetadata(audio);
        await hoverOpen(closestButton(container, 'volume_2'));
        const slider = await waitFor(() => screen.getByRole('slider', { name: '音量' }));
        expect(slider).toHaveAttribute('aria-orientation', 'vertical');
        expect(slider).toHaveAttribute('max', '100');
        expect(slider).toHaveAttribute('aria-valuetext', '100%');
        await fireEvent.update(slider, '40');
        expect(audio.volume).toBe(0.4);
        expect(slider).toHaveAttribute('aria-valuetext', '40%');
    });
});
