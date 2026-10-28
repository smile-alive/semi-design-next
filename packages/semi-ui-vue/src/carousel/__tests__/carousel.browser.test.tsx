/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Carousel from '..';
import RefDemo from './fixtures/ref-demo.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-carousel`;
const style = { width: '600px', height: '240px' };
// The default autoplay switches every DEFAULT_INTERVAL (2000ms) + speed (300ms)
const SWITCHING_TIME = 2300;

const slides = (labels: string[]) =>
    labels.map((label) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h3>{label}</h3>
        </div>
    ));

const activeTitle = () => document.querySelector(`.${prefixCls}-content-item-active h3`)?.textContent;
// expect.poll keeps real timers, so it also waits for click updates while the component timers are faked
const expectActive = async (title: string) => {
    await expect.poll(activeTitle).toBe(title);
};

const tick = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await nextTick();
};

// Vue drops a listener call whose event timestamp (Date.now) is not later than the listener's attach time. The
// Button's capture listener stamps the click first, so with a frozen fake Date its onClick would be ignored until
// the clock moves.
const renderDemo = async (options?: Parameters<typeof render>[1]) => {
    const result = render(RefDemo, options);
    await tick(1);
    return result;
};

describe('Carousel', () => {
    describe('使用假定时器', () => {
        beforeEach(async () => {
            // A carousel rendered under the pointer left by an earlier test gets a mouseenter, which pauses autoplay
            // (hoverToPause); park the pointer away from where the carousel and its buttons render
            render({
                render: () => <div style={{ position: 'fixed', right: 0, bottom: 0, width: '10px', height: '10px' }} data-testid="pointer-park" />,
            });
            await userEvent.hover(screen.getByTestId('pointer-park'));
            // The autoplay interval and the 400ms hover debounce (setTimeout + Date.now) drive the slide changes
            vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('带 control 时的 handle 方法', async () => {
            await renderDemo({ props: { controlled: true } });
            expect(activeTitle()).toBe('1');
            await userEvent.click(screen.getByText('prev'));
            await expectActive('5');
            await userEvent.click(screen.getByText('next'));
            await expectActive('1');

            await userEvent.click(screen.getByText('play'));
            await tick(SWITCHING_TIME);
            await expectActive('2');
            await tick(SWITCHING_TIME);
            await expectActive('3');

            await userEvent.click(screen.getByText('stop'));
            await tick(SWITCHING_TIME);
            await expectActive('3');

            await userEvent.click(screen.getByText('play'));
            await tick(SWITCHING_TIME);
            await expectActive('4');

            await userEvent.click(screen.getByText('goTo3'));
            await expectActive('3');
        });

        it('不带 control 时的 handle 方法', async () => {
            await renderDemo();
            expect(activeTitle()).toBe('1');

            await userEvent.click(screen.getByText('play'));
            await tick(SWITCHING_TIME);
            await expectActive('2');
            await tick(SWITCHING_TIME);
            await expectActive('3');

            await userEvent.click(screen.getByText('stop'));
            await tick(7300);
            await expectActive('3');

            await userEvent.click(screen.getByText('prev'));
            await expectActive('2');
            await userEvent.click(screen.getByText('goTo3'));
            await expectActive('3');
            await userEvent.click(screen.getByText('next'));
            await expectActive('4');
        });

        it('mouseover 与 mouseleave', async () => {
            const { container } = await renderDemo();
            expect(activeTitle()).toBe('1');

            await userEvent.click(screen.getByText('play'));
            await tick(SWITCHING_TIME);
            await expectActive('2');

            await userEvent.hover(container.querySelector(`.${prefixCls}`) as HTMLElement);
            await tick(400);
            await expectActive('2');
            await tick(SWITCHING_TIME);
            await expectActive('2');
        });

        it('自动播放间隔', async () => {
            render({
                render: () => (
                    <Carousel style={style} autoPlay={{ interval: 1000, hoverToPause: true }}>
                        {() => slides(['1', '2', '3', '4', '5'])}
                    </Carousel>
                ),
            });
            expect(activeTitle()).toBe('1');
            await tick(1300);
            await expectActive('2');
            await tick(1300);
            await expectActive('3');
        });

        const autoPlay = { interval: 1000, hoverToPause: false };

        it('键盘焦点在离开前暂停轮播', async () => {
            render({
                render: () => (
                    <>
                        <Carousel style={style} autoPlay={autoPlay}>
                            {() => slides(['1', '2', '3', '4', '5'])}
                        </Carousel>
                        <button type="button">after</button>
                    </>
                ),
            });
            await userEvent.keyboard('{Tab}');
            expect(screen.getByRole('tab', { selected: true })).toHaveFocus();
            await tick(5000);
            await expectActive('1');
            screen.getByText('after').focus();
            await tick(1300);
            await expectActive('2');
        });

        it('鼠标点击箭头会使其获得焦点，但不暂停轮播', async () => {
            const { container } = render({
                render: () => (
                    <Carousel style={style} autoPlay={autoPlay}>
                        {() => slides(['1', '2', '3', '4', '5'])}
                    </Carousel>
                ),
            });
            const next = container.querySelector(`.${prefixCls}-arrow-next`) as HTMLElement;
            await userEvent.click(next);
            await expectActive('2');
            expect(next).toHaveFocus();
            await tick(1300);
            await expectActive('3');
        });
    });

    it('Tab 跳过隐藏幻灯片内的元素', async () => {
        render({
            render: () => (
                <Carousel style={style} animation="fade" autoPlay={false}>
                    {() =>
                        ['0', '1', '2'].map((label) => (
                            <div key={label}>
                                <a href={`#${label}`}>{`link ${label}`}</a>
                            </div>
                        ))
                    }
                </Carousel>
            ),
        });
        await userEvent.keyboard('{Tab}');
        expect(screen.getByText('link 0')).toHaveFocus();
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('tab', { selected: true })).toHaveFocus();
    });

    it('幻灯片方向', async () => {
        const { container } = render({
            render: () => (
                <Carousel style={style} autoPlay={false} slideDirection="right">
                    {() => slides(['index0', 'index1', 'index2'])}
                </Carousel>
            ),
        });
        await userEvent.click(container.querySelector(`.${prefixCls}-arrow-next`) as HTMLElement);
        await expectActive('index1');
        expect(container.querySelector(`.${prefixCls}-content-item-slide-out`)).toHaveTextContent('index0');
        expect(container.querySelector(`.${prefixCls}-content-item-slide-in`)).toHaveTextContent('index1');
    });

    it('键盘聚焦进入轮播时，仅悬停显示的箭头变为可见', async () => {
        const { container } = render({
            render: () => (
                <Carousel style={style} arrowType="hover" autoPlay={false}>
                    {() => slides(['index0', 'index1', 'index2'])}
                </Carousel>
            ),
        });
        const next = container.querySelector(`.${prefixCls}-arrow-next`) as HTMLElement;
        expect(getComputedStyle(next).opacity).toBe('0');
        await userEvent.keyboard('{Tab}');
        await userEvent.keyboard('{Tab}{Tab}');
        expect(next).toHaveFocus();
        expect(getComputedStyle(next).opacity).toBe('1');
        await userEvent.keyboard('{Enter}');
        await expectActive('index1');
    });

    it('箭头和指示器显示主题焦点环，而非浏览器默认焦点环', async () => {
        render({
            render: () => (
                <Carousel style={style} autoPlay={false}>
                    {() => slides(['index0', 'index1', 'index2'])}
                </Carousel>
            ),
        });
        const focused: string[] = [];
        for (let i = 0; i < 3; i++) {
            await userEvent.keyboard('{Tab}');
            const el = document.activeElement as HTMLElement;
            focused.push(el.getAttribute('role') ?? el.className);
            expectThemeFocusRing(el);
        }
        expect(focused).toEqual(['tab', expect.stringContaining('arrow-prev'), expect.stringContaining('arrow-next')]);
        const arrow = document.activeElement as HTMLElement;
        expect(getComputedStyle(arrow).borderRadius).toBe('50%');
        expect(arrow.offsetWidth).toBe(arrow.offsetHeight);
    });
});
