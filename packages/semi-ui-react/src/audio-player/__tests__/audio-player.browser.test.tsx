import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { AudioPlayer } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, mouse, silentWavUrl, tabTo } from '@test/utils/browser';
import AudioSlider from '../audio-slider';

const prefixCls = `${BASE_CLASS_PREFIX}-audio-player`;
function centerX(el: Element) {
    const rect = el.getBoundingClientRect();
    return rect.left + rect.width / 2;
}

// A source that loads: a load error removes the slider, and Firefox and Safari reject a WAV without samples
const audioUrl = silentWavUrl(1);

describe('AudioPlayer', () => {
    it('拖动进度条时，指针移出滑块后仍持续定位，松开后结束', async () => {
        const { container } = render(
            <div style={{ display: 'flex' }}>
                <AudioPlayer audioUrl={silentWavUrl(60)} />
                <div style={{ width: 200, height: 100 }} data-testid="outside" />
            </div>
        );
        const audio = container.querySelector('audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const slider = container.querySelector(`.${prefixCls}-slider-wrapper`);
        expect(getComputedStyle(slider).touchAction).toBe('none');

        await userEvent.dragAndDrop(slider, container.querySelector('[data-testid="outside"]'));
        expect(audio.currentTime).toBe(60);

        await userEvent.hover(slider, { position: { x: 5, y: 2 } });
        expect(audio.currentTime).toBe(60);
    });

    it('悬停过进度条后用键盘聚焦，时间预览显示当前时间而不是上次悬停的时间', async () => {
        const { container } = render(<AudioPlayer audioUrl={silentWavUrl(60)} />);
        const audio = container.querySelector('audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        const input = container.querySelector<HTMLElement>(`.${prefixCls}-slider-input`);
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
        const { container } = render(<AudioPlayer audioUrl={audioUrl} />);
        const trigger = container.querySelector(`.${prefixCls}-control-speed`);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });

    it('Tab 可到达进度滑块，其轨道显示主题焦点环', async () => {
        const { container } = render(<AudioPlayer audioUrl={audioUrl} />);
        const input = container.querySelector(`.${prefixCls}-slider-input`);
        await tabTo(input);
        expectThemeFocusRing(container.querySelector(`.${prefixCls}-slider-wrapper`));
        // the dot's opacity transitions over 0.2s, so poll
        await expect.poll(() => getComputedStyle(container.querySelector(`.${prefixCls}-slider-dot`)).opacity).toBe('1');
    });

    it('audio 元素不带 class、style，仍不占布局', () => {
        const { container } = render(<AudioPlayer className="custom" style={{ width: '300px' }} audioUrl={audioUrl} />);
        const audio = container.querySelector('audio');
        expect(audio).not.toHaveAttribute('class');
        expect(audio).not.toHaveAttribute('style');
        expect(getComputedStyle(audio).display).toBe('none');
        expect(container.querySelector(`.${prefixCls}`).getBoundingClientRect().width).toBe(300);
    });

    it('进度为 0 时圆点中心在轨道起点、盖住圆角，点击进度条后时间预览 Tooltip 对准圆点', async () => {
        const { container } = render(<AudioPlayer audioUrl={silentWavUrl(60)} />);
        const audio = container.querySelector('audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const track = container.querySelector(`.${prefixCls}-slider`).getBoundingClientRect();
        const dot = container.querySelector(`.${prefixCls}-slider-dot`);
        expect(Math.round(centerX(dot))).toBe(Math.round(track.left));
        const time = container.querySelector(`.${prefixCls}-info-time > span`);
        expect(dot.getBoundingClientRect().left).toBeGreaterThanOrEqual(time.getBoundingClientRect().right + 4);

        await userEvent.click(container.querySelector(`.${prefixCls}-slider-wrapper`), { position: { x: 40, y: 2 } });
        await expect.poll(() => audio.currentTime).toBeGreaterThan(0);
        // a pointer press focuses the input without the keyboard focus ring
        expect(container.querySelector(`.${prefixCls}-slider-input`).matches(':focus-visible')).toBe(false);
        const tooltip = await vi.waitFor(() => {
            const el = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
            expect(el).not.toBeNull();
            return el;
        });
        await expect.poll(() => centerX(tooltip) - centerX(dot)).toBeCloseTo(0, 0);
    });
});

describe('AudioPlayer 滑块轨道的悬停与焦点样式', () => {
    it('悬停滑块渲染一次；键盘聚焦只为丢弃悬停预览渲染一次，之后失焦不再渲染', async () => {
        const onRender = vi.fn<ProfilerOnRenderCallback>();
        // no time-preview Tooltip: its 50ms open delay can fire mid-test under load and add commits
        const { container } = render(
            <Profiler id="audio-slider" onRender={onRender}>
                <AudioSlider max={60} value={10} getValueText={String} label="progress" showTooltip={false} />
            </Profiler>
        );
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        const input = container.querySelector<HTMLElement>(`.${prefixCls}-slider-input`);

        const beforeHover = onRender.mock.calls.length;
        await userEvent.hover(wrapper);
        expect(onRender).toHaveBeenCalledTimes(beforeHover + 1);

        const afterHover = onRender.mock.calls.length;
        await userEvent.unhover(wrapper);
        await tabTo(input);
        const afterFocus = onRender.mock.calls.length;
        expect(afterFocus).toBe(afterHover + 1);
        input.blur();
        expect(onRender).toHaveBeenCalledTimes(afterFocus);
    });

    it('悬停与键盘聚焦时轨道变粗、圆点可见，离开或失焦后恢复', async () => {
        const { container } = render(<AudioPlayer audioUrl={silentWavUrl(60)} />);
        const audio = container.querySelector('audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        const track = container.querySelector<HTMLElement>(`.${prefixCls}-slider`);
        const dot = container.querySelector<HTMLElement>(`.${prefixCls}-slider-dot`);
        const input = container.querySelector<HTMLElement>(`.${prefixCls}-slider-input`);

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
        const { container } = render(
            <div style={{ display: 'flex' }}>
                <AudioPlayer audioUrl={silentWavUrl(60)} />
                <div style={{ width: 200, height: 100 }} data-testid="outside" />
            </div>
        );
        const audio = container.querySelector('audio');
        await waitFor(() => expect(audio.duration).toBe(60));
        const wrapper = container.querySelector(`.${prefixCls}-slider-wrapper`);
        const track = container.querySelector<HTMLElement>(`.${prefixCls}-slider`);
        const input = container.querySelector<HTMLElement>(`.${prefixCls}-slider-input`);

        // real mouse input: setPointerCapture rejects a synthetic pointerId
        const box = wrapper.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;

        await mouse('down', x, y);
        await mouse('move', x + 400, y);
        await expect.poll(() => getComputedStyle(track).height).toBe('8px');
        const dot = container.querySelector(`.${prefixCls}-slider-dot`);
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

describe('AudioPlayer 加载失败', () => {
    it('容器窄于整行时加载失败文字保持单行原宽，不按字换行', async () => {
        const errorSize = async (width: number) => {
            const { container } = render(
                <div style={{ width }}>
                    <AudioPlayer audioUrl="data:audio/wav;base64,AAAA" />
                </div>
            );
            const error = await vi.waitFor(() => {
                const el = container.querySelector(`.${prefixCls}-error`);
                expect(el).not.toBeNull();
                return el;
            });
            const { width: w, height } = error.getBoundingClientRect();
            return { height, width: w };
        };

        const roomy = await errorSize(600);
        expect(await errorSize(200)).toEqual(roomy);
    });
});
