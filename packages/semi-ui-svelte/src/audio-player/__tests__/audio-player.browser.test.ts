import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, mouse, silentWavUrl, tabTo } from '@test/utils/browser';
import AudioPlayer from '../audio-player.svelte';
import BesideOutside from './beside-outside.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-audio-player`;
function centerX(el: Element) {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
}
const query = <E extends Element = HTMLElement>(container: Element, selector: string) => container.querySelector<E>(selector) as E;

// A source that loads: a load error removes the slider, and Firefox and Safari reject a WAV without samples
const audioUrl = silentWavUrl(1);

describe('Svelte AudioPlayer（浏览器）', () => {
    it('拖动进度条时，指针移出滑块后仍持续定位，松开后结束', async () => {
        const { container } = render(BesideOutside, { props: { audioUrl: silentWavUrl(60) } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const slider = query(container, `.${prefixCls}-slider-wrapper`);
        expect(getComputedStyle(slider).touchAction).toBe('none');

        await userEvent.dragAndDrop(slider, query(container, '[data-testid="outside"]'));
        expect(audio.currentTime).toBe(60);

        await userEvent.hover(slider, { position: { x: 5, y: 2 } });
        expect(audio.currentTime).toBe(60);
    });

    it('悬停过进度条后用键盘聚焦，时间预览显示当前时间而不是上次悬停的时间', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl: silentWavUrl(60) } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        const input = query(container, `.${prefixCls}-slider-input`);
        const preview = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);

        await userEvent.hover(wrapper, { position: { x: 100, y: 2 } });
        await vi.waitFor(() => expect(preview()).not.toBeNull());
        await userEvent.unhover(wrapper);
        await vi.waitFor(() => expect(preview()).toBeNull());
        // the Tooltip's pending close from the hover would otherwise hide the popup the focus opens
        await new Promise((resolve) => setTimeout(resolve, 500));

        await tabTo(input);
        await vi.waitFor(() => expect(preview()).toMatchTextContent('00:00'));
        await userEvent.keyboard('{ArrowRight}');
        await vi.waitFor(() => expect(preview()).toMatchTextContent('00:01'));
    });

    it('播放速率触发器显示主题焦点环', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl } });
        const trigger = query(container, `.${prefixCls}-control-speed`);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });

    it('原生 button 获得焦点时打开倍速菜单，方向键与 Enter 选择倍速', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(1));
        const trigger = query(container, `.${prefixCls}-control-speed`);
        await tabTo(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        const items = await waitFor(() => {
            const found = document.querySelectorAll<HTMLElement>(`.${prefixCls}-control-speed-menu-item`);
            expect(found).toHaveLength(5);
            return found;
        });
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(items[0]).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}{Enter}');
        expect(audio.playbackRate).toBe(0.75);
    });

    it('Tab 可到达进度滑块，其轨道显示主题焦点环', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl } });
        const input = query(container, `.${prefixCls}-slider-input`);
        await tabTo(input);
        expectThemeFocusRing(query(container, `.${prefixCls}-slider-wrapper`));
        // the dot's opacity transitions over 0.2s, so poll instead of reading the value right after focus lands
        await expect.poll(() => getComputedStyle(query(container, `.${prefixCls}-slider-dot`)).opacity).toBe('1');
    });

    it('音量按钮获得焦点时打开名为音量的对话框弹层', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl } });
        const trigger = query(container, `.${prefixCls}-control button[aria-haspopup="dialog"]`);
        trigger.focus();
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        expect(document.querySelector('[role="dialog"]')).toContainElement(query(document.body, `.${prefixCls}-control-volume`));
    });

    it('audio 元素不带 class、style，仍不占布局', () => {
        const { container } = render(AudioPlayer, { props: { audioUrl, class: 'custom', style: 'width: 300px' } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        expect(audio).not.toHaveAttribute('class');
        expect(audio).not.toHaveAttribute('style');
        expect(getComputedStyle(audio).display).toBe('none');
        expect(query(container, `.${prefixCls}`).getBoundingClientRect().width).toBe(300);
    });

    it('进度为 0 时圆点中心在轨道起点、盖住圆角，点击进度条后时间预览 Tooltip 对准圆点', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl: silentWavUrl(60) } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const track = query(container, `.${prefixCls}-slider`).getBoundingClientRect();
        const dot = query(container, `.${prefixCls}-slider-dot`);
        expect(Math.round(centerX(dot))).toBe(Math.round(track.left));
        const time = query(container, `.${prefixCls}-info-time > span`);
        expect(dot.getBoundingClientRect().left).toBeGreaterThanOrEqual(time.getBoundingClientRect().right + 4);

        await userEvent.click(query(container, `.${prefixCls}-slider-wrapper`), { position: { x: 40, y: 2 } });
        await expect.poll(() => audio.currentTime).toBeGreaterThan(0);
        // a pointer press focuses the input without the keyboard focus ring
        expect(query(container, `.${prefixCls}-slider-input`).matches(':focus-visible')).toBe(false);
        const tooltip = await vi.waitFor(() => {
            const el = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
            expect(el).not.toBeNull();
            return el as HTMLElement;
        });
        await expect.poll(() => Math.round(centerX(tooltip) - centerX(dot))).toBe(0);
    });
});

describe('Svelte AudioPlayer 滑块轨道的悬停与焦点样式（浏览器）', () => {
    it('悬停与键盘聚焦时轨道变粗、圆点可见，离开或失焦后恢复', async () => {
        const { container } = render(AudioPlayer, { props: { audioUrl: silentWavUrl(60) } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        const track = query(container, `.${prefixCls}-slider`);
        const dot = query(container, `.${prefixCls}-slider-dot`);
        const input = query(container, `.${prefixCls}-slider-input`);

        expect(getComputedStyle(track).height).toBe('4px');
        await expect.poll(() => getComputedStyle(dot).opacity).toBe('0');

        await userEvent.hover(wrapper);
        await expect.poll(() => getComputedStyle(track).height).toBe('8px');
        await expect.poll(() => getComputedStyle(dot).opacity).toBe('1');

        await userEvent.unhover(wrapper);
        await expect.poll(() => getComputedStyle(track).height).toBe('4px');
        await expect.poll(() => getComputedStyle(dot).opacity).toBe('0');

        await tabTo(input);
        await expect.poll(() => getComputedStyle(track).height).toBe('8px');
        await expect.poll(() => getComputedStyle(dot).opacity).toBe('1');

        input.blur();
        await expect.poll(() => getComputedStyle(track).height).toBe('4px');
        await expect.poll(() => getComputedStyle(dot).opacity).toBe('0');
    });

    it('拖动指针移出滑块时轨道保持加粗，释放后输入框仍持有焦点；移开焦点后恢复', async () => {
        const { container } = render(BesideOutside, { props: { audioUrl: silentWavUrl(60) } });
        const audio = query<HTMLAudioElement>(container, 'audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = query(container, `.${prefixCls}-slider-wrapper`);
        const track = query(container, `.${prefixCls}-slider`);
        const input = query(container, `.${prefixCls}-slider-input`);

        // real mouse input: setPointerCapture rejects a synthetic pointerId
        const box = wrapper.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;

        await mouse('down', x, y);
        await mouse('move', x + 400, y);
        await expect.poll(() => getComputedStyle(track).height).toBe('8px');
        const dot = query(container, `.${prefixCls}-slider-dot`);
        await expect
            .poll(() => {
                const tooltip = document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
                return tooltip && Math.abs(Math.round(centerX(tooltip) - centerX(dot)));
            })
            .toBe(0);
        expect(Math.round(centerX(dot))).toBe(Math.round(track.getBoundingClientRect().right));

        await mouse('up', x + 400, y);
        await mouse('move', x + 600, y);
        // the input keeps the focus, without the keyboard focus ring, so the track thins once the pointer is off it
        await expect.poll(() => document.activeElement).toBe(input);
        await expect.poll(() => getComputedStyle(track).height).toBe('4px');
    });
});

describe('Svelte AudioPlayer 加载失败（浏览器）', () => {
    it('容器窄于整行时加载失败文字保持单行原宽，不按字换行', async () => {
        const errorSize = async (width: number) => {
            const { container } = render(BesideOutside, { props: { audioUrl: 'data:audio/wav;base64,AAAA' } });
            const wrapper = container.firstElementChild as HTMLElement;
            wrapper.style.width = `${width}px`;
            const error = await vi.waitFor(() => {
                const el = container.querySelector(`.${prefixCls}-error`);
                expect(el).not.toBeNull();
                return el as Element;
            });
            const { width: w, height } = error.getBoundingClientRect();
            return { height, width: w };
        };

        const roomy = await errorSize(600);
        expect(await errorSize(200)).toEqual(roomy);
    });
});
