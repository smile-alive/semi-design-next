import { type JSX, createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { IconHelpCircle } from '@fibrae/semi-icons-solid';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/solid';
import Tooltip, { type Position, type RenderContentProps, type TooltipProps } from '..';
import Button from '../../button';
import Switch from '../../switch';

const wrapperSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper`;
const shown = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
const expectShown = (text: string) => waitFor(() => expect(shown()).toHaveTextContent(text));
const expectHidden = () => waitFor(() => expect(shown()).toBeNull());
const popupOf = (trigger: Element) => document.getElementById(String(trigger.getAttribute('data-popupid')).split(' ')[0]) as HTMLElement;
const wrapperOf = (text: string) => screen.getByText(text).closest(wrapperSelector) as HTMLElement;
const center = (rect: DOMRect) => rect.left + rect.width / 2;
type Callback = () => void;
type Side = 'top' | 'bottom' | 'left' | 'right';

// the popup's open transition scales it, which getBoundingClientRect includes
const settled = (popup: HTMLElement) => waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

function expectInViewport(rect: DOMRect) {
    expect(rect.left).toBeGreaterThanOrEqual(-1);
    expect(rect.top).toBeGreaterThanOrEqual(-1);
    expect(rect.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    expect(rect.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight + 1);
}

afterEach(async () => {
    await page.viewport(1000, 660);
    window.scrollTo(0, 0);
});

describe('Tooltip 触发（浏览器）', () => {
    it('悬停显示，离开隐藏', async () => {
        render(() => <Tooltip content="hover tip">{(t) => <Button {...t()}>hover me</Button>}</Tooltip>);
        const button = screen.getByRole('button', { name: 'hover me' });
        await userEvent.hover(button);
        await expectShown('hover tip');
        await userEvent.unhover(button);
        await expectHidden();
    });

    it('悬停禁用或加载中的按钮时显示提示', async () => {
        render(() => (
            <>
                <Tooltip content="disabled tip">
                    {(t) => (
                        <Button disabled {...t()}>
                            disabled
                        </Button>
                    )}
                </Tooltip>
                <Tooltip content="loading tip">
                    {(t) => (
                        <Button loading {...t()}>
                            loading
                        </Button>
                    )}
                </Tooltip>
            </>
        ));
        // force: the pointer lands on whatever receives events at the button's position (a wrapper or the button)
        await userEvent.hover(screen.getByText('disabled'), { force: true });
        await expectShown('disabled tip');
        await userEvent.hover(screen.getByText('loading'), { force: true });
        await expectShown('loading tip');
    });

    it('点击禁用按钮的触发器仍可打开', async () => {
        render(() => (
            <Tooltip content="click tip" trigger="click">
                {(t) => (
                    <Button disabled {...t()}>
                        disabled click
                    </Button>
                )}
            </Tooltip>
        ));
        await userEvent.click(screen.getByText('disabled click'), { force: true });
        await expectShown('click tip');
    });

    it('禁用的点击触发器外层 span 是 Tab 停靠点，并显示主题焦点环', async () => {
        const { container } = render(() => (
            <Tooltip content="tip" trigger="click">
                {(t) => (
                    <Button disabled {...t()}>
                        disabled
                    </Button>
                )}
            </Tooltip>
        ));
        const wrapper = container.querySelector('span[tabindex="0"]') as HTMLElement;
        await tabTo(wrapper);
        expectThemeFocusRing(wrapper);
    });

    it('由 Tooltip 设为可聚焦的图标触发器显示主题焦点环', async () => {
        const { container } = render(() => <Tooltip content="tip">{(t) => <IconHelpCircle aria-label="help" {...t()} />}</Tooltip>);
        const icon = container.querySelector(`.${BASE_CLASS_PREFIX}-icon`) as HTMLElement;
        await tabTo(icon);
        expectThemeFocusRing(icon);
    });

    it('文本触发器包进 span 后可悬停', async () => {
        render(() => <Tooltip content="text tip">plain text trigger</Tooltip>);
        await userEvent.hover(screen.getByText('plain text trigger'));
        await expectShown('text tip');
    });

    it('键盘聚焦打开的悬停提示在无指针时保持显示，失焦后隐藏', async () => {
        render(() => <Tooltip content="keyboard tip">{(t) => <Button {...t()}>keyboard focus me</Button>}</Tooltip>);
        const button = screen.getByRole('button', { name: 'keyboard focus me' });
        button.focus();
        await expectShown('keyboard tip');
        await sleep(300);
        expect(shown()).toHaveTextContent('keyboard tip');
        button.blur();
        await expectHidden();
    });

    it.each([
        ['Switch', () => <Switch aria-label="inner switch" />],
        ['loading Button', () => <Button loading>inner loading</Button>],
    ])('焦点落在 %s 内层控件上时，键盘打开的悬停提示保持显示', async (_, child) => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => <Tooltip content="inner tip">{child()}</Tooltip>);
        await tab();
        expect(document.activeElement).not.toBe(document.body);
        await expectShown('inner tip');
        await sleep(300);
        expect(shown()).toHaveTextContent('inner tip');
    });

    it('焦点移入弹层时，focus 触发器保持打开', async () => {
        render(() => (
            <Tooltip content={<input aria-label="inside popup" />} trigger="focus">
                {(t) => <Button {...t()}>focus me</Button>}
            </Tooltip>
        ));
        screen.getByRole('button', { name: 'focus me' }).focus();
        (await screen.findByLabelText('inside popup')).focus();
        await sleep(400);
        expect(shown()).not.toBeNull();
    });

    it('焦点在 handleOpened 之前移入的悬停弹层保持打开', async () => {
        render(() => <Tooltip content={<button type="button">inside popup</button>}>{(t) => <Button {...t()}>arrow down from me</Button>}</Tooltip>);
        screen.getByRole('button', { name: 'arrow down from me' }).focus();
        (await screen.findByRole('button', { name: 'inside popup' })).focus();
        await expectShown('inside popup');
        await sleep(300);
        expect(screen.getByRole('button', { name: 'inside popup' })).toHaveFocus();
    });

    it('焦点移入内容中嵌套弹层时，悬停外层保持打开', async () => {
        const onVisibleChange = vi.fn<NonNullable<TooltipProps['onVisibleChange']>>();
        render(() => (
            <Tooltip
                onVisibleChange={onVisibleChange}
                content={
                    <Tooltip content={<input aria-label="nested input" />} trigger="click">
                        {(t) => <Button {...t()}>open nested</Button>}
                    </Tooltip>
                }
            >
                {(t) => <Button {...t()}>outer hover</Button>}
            </Tooltip>
        ));
        screen.getByRole('button', { name: 'outer hover' }).focus();
        // handleOpened only counts focus in the popup itself, so the opening settles before focus moves on
        await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
        const opener = screen.getByRole('button', { name: 'open nested' });
        opener.focus();
        opener.click();
        (await screen.findByLabelText('nested input')).focus();
        await sleep(400);
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
        expect(screen.getByRole('button', { name: 'open nested' })).toBeVisible();
        expect(screen.getByLabelText('nested input')).toHaveFocus();
    });

    it('指针从悬停弹层移入内容中嵌套的悬停弹层时外层保持打开，离开两者后都关闭', async () => {
        render(() => (
            <Tooltip
                content={
                    <Tooltip content="nested tip" position="right">
                        {(t) => <Button {...t()}>nested trigger</Button>}
                    </Tooltip>
                }
            >
                {(t) => <Button {...t()}>outer hover</Button>}
            </Tooltip>
        ));
        await userEvent.hover(screen.getByRole('button', { name: 'outer hover' }));
        await userEvent.hover(await screen.findByRole('button', { name: 'nested trigger' }));
        const nested = wrapperOf((await screen.findByText('nested tip')).textContent as string);
        await settled(nested);
        await userEvent.hover(nested);
        // longer than both leave delays
        await sleep(300);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(2);
        await userEvent.unhover(nested);
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
    });

    it('触发器上组合的弹层不算外层的弹层：指针移入它时外层提示照常关闭，移过它也不打开外层', async () => {
        render(() => (
            <Tooltip content="outer tip" position="right">
                {(outer) => (
                    <Tooltip content={<p>inner panel</p>} position="bottom" trigger="click">
                        {(inner) => <Button {...inner(outer())}>both</Button>}
                    </Tooltip>
                )}
            </Tooltip>
        ));
        const button = screen.getByRole('button', { name: 'both' });
        await userEvent.click(button);
        await waitFor(() => expect(wrapperOf('outer tip')).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-wrapper-show`));
        await screen.findByText('inner panel');
        const panel = wrapperOf('inner panel');
        await settled(panel);
        await userEvent.hover(panel);
        await waitFor(() => expect(screen.queryByText('outer tip')).toBeNull());
        await userEvent.unhover(panel);
        await userEvent.hover(panel);
        await sleep(300);
        expect(screen.queryByText('outer tip')).toBeNull();
        expect(screen.getByText('inner panel')).toBeVisible();
    });

    it('淡出期间再次打开的弹层会重新显示，且是同一个弹层', async () => {
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <Tooltip content="fading tip" trigger="custom" visible={visible()}>
                {(t) => <Button {...t({ onClick: () => setVisible(!visible()) })}>toggle</Button>}
            </Tooltip>
        ));
        const toggle = screen.getByRole('button', { name: 'toggle' });
        await userEvent.click(toggle);
        await expectShown('fading tip');
        const popup = shown() as HTMLElement;
        toggle.click();
        await new Promise(requestAnimationFrame);
        // reopen while the exit transition the close started is still running
        expect(popup.getAnimations().length).toBeGreaterThan(0);
        toggle.click();
        await sleep(300);
        expect(wrapperOf('fading tip')).toBe(popup);
        expect(popup.matches(':popover-open')).toBe(true);
        await expectShown('fading tip');
    });

    it('进出场是 keyframes 动画：出场期间弹层仍在顶层可见，结束后才隐藏', async () => {
        const [visible, setVisible] = createSignal(true);
        const afterClose = vi.fn<() => void>();
        render(() => (
            <Tooltip afterClose={afterClose} content="keyframe tip" keepDOM trigger="custom" visible={visible()}>
                <Button>keyframe</Button>
            </Tooltip>
        ));
        await expectShown('keyframe tip');
        const popup = shown() as HTMLElement;
        expect(popup.getAnimations().map((animation) => (animation as CSSAnimation).animationName)).toEqual([`${BASE_CLASS_PREFIX}-tooltip-zoom-in`]);
        await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

        setVisible(false);
        const [exit] = popup.getAnimations() as CSSAnimation[];
        expect(exit.animationName).toBe(`${BASE_CLASS_PREFIX}-tooltip-zoom-out`);
        exit.pause();
        exit.currentTime = 0;
        expect(popup.matches(':popover-open')).toBe(true);
        expect(popup.checkVisibility()).toBe(true);
        expect(afterClose).not.toHaveBeenCalled();
        exit.finish();
        await waitFor(() => expect(popup.matches(':popover-open')).toBe(false));
        expect(popup.checkVisibility()).toBe(false);
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('motion={false} 时没有进出场动画，关闭后立即隐藏', async () => {
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <Tooltip content="still tip" motion={false} keepDOM trigger="custom" visible={visible()}>
                <Button>still</Button>
            </Tooltip>
        ));
        await expectShown('still tip');
        const popup = shown() as HTMLElement;
        expect(popup.getAnimations()).toHaveLength(0);
        setVisible(false);
        await waitFor(() => expect(popup.matches(':popover-open')).toBe(false));
    });

    it('contextMenu 右键打开并对准触发器中心，Escape 关闭', async () => {
        render(() => (
            <Tooltip closeOnEsc content="menu tip" trigger="contextMenu">
                {(t) => <Button {...t()}>right click me</Button>}
            </Tooltip>
        ));
        const button = screen.getByRole('button', { name: 'right click me' });
        await userEvent.click(button, { button: 'right', position: { x: 1, y: 1 } });
        await expectShown('menu tip');
        const tip = shown() as HTMLElement;
        await settled(tip);
        expect(Math.abs(center(tip.getBoundingClientRect()) - center(button.getBoundingClientRect()))).toBeLessThan(8);
        button.focus();
        await userEvent.keyboard('{Escape}');
        await expectHidden();
    });

    it('clickTriggerToHide：再次点击触发器关闭', async () => {
        render(() => (
            <Tooltip clickTriggerToHide content="toggle tip" trigger="click">
                {(t) => <Button {...t()}>toggle trigger</Button>}
            </Tooltip>
        ));
        const button = screen.getByRole('button', { name: 'toggle trigger' });
        await userEvent.click(button);
        await expectShown('toggle tip');
        await userEvent.click(button);
        await expectHidden();
    });

    it('在内容中嵌套弹层内按下鼠标不关闭外层弹层，外部点击才关闭', async () => {
        const onClickOutSide = vi.fn<NonNullable<TooltipProps['onClickOutSide']>>();
        render(() => (
            <Tooltip
                content={
                    <Tooltip content={<button type="button">inner action</button>} trigger="click">
                        {(t) => <Button {...t()}>open inner</Button>}
                    </Tooltip>
                }
                trigger="click"
                onClickOutSide={onClickOutSide}
            >
                {(t) => <Button {...t()}>open outer</Button>}
            </Tooltip>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'open outer' }));
        await userEvent.click(await screen.findByRole('button', { name: 'open inner' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner action' }));
        await sleep(300);
        expect(screen.getByRole('button', { name: 'open inner' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'inner action' })).toBeVisible();
        expect(onClickOutSide).not.toHaveBeenCalled();
        await clickOutside();
        await waitFor(() => expect(onClickOutSide).toHaveBeenCalledTimes(1));
    });

    it('returnFocusOnClose 下 Escape 关闭后焦点回到 loading Button 本身，而不是外层包裹', async () => {
        render(() => (
            <Tooltip content={<button type="button">inside</button>} returnFocusOnClose trigger="click">
                {(t) => (
                    <Button loading {...t()}>
                        busy
                    </Button>
                )}
            </Tooltip>
        ));
        const button = screen.getByRole('button', { name: 'busy' });
        await userEvent.click(button, { force: true });
        (await screen.findByRole('button', { name: 'inside' })).focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('button', { name: 'inside' })).toBeNull());
        expect(button).toHaveFocus();
    });

    it('悬停判断只检查触发器自身，不扫描整个文档的 :hover', async () => {
        render(() => <Tooltip content="scoped tip">{(t) => <Button {...t()}>scoped hover</Button>}</Tooltip>);
        await sleep(50);
        const querySelectorAll = vi.spyOn(document, 'querySelectorAll');
        await userEvent.hover(screen.getByRole('button', { name: 'scoped hover' }));
        await expectShown('scoped tip');
        expect(querySelectorAll.mock.calls.filter(([selector]) => selector === ':hover')).toHaveLength(0);
    });

    it.each([
        ['hover', true],
        ['hover', false],
        ['click', true],
        ['click', false],
    ] as const)('%s 触发、motion=%s 时 [autofocus] 与 initialFocusRef 都获得焦点', async (trigger, motion) => {
        const view = render(() => (
            <Tooltip content={<input aria-label="auto" autofocus />} motion={motion} position="bottomLeft" trigger={trigger}>
                {(t) => <Button {...t()}>auto</Button>}
            </Tooltip>
        ));
        const button = screen.getByRole('button', { name: 'auto' });
        await (trigger === 'hover' ? userEvent.hover(button) : userEvent.click(button));
        await waitFor(() => expect(screen.getByLabelText('auto')).toHaveFocus());
        await userEvent.unhover(button);
        view.unmount();

        render(() => (
            <Tooltip content={(props: RenderContentProps) => <input ref={props.initialFocusRef} aria-label="initial" />} motion={motion} position="bottomLeft" trigger={trigger}>
                {(t) => <Button {...t()}>initial</Button>}
            </Tooltip>
        ));
        const initial = screen.getByRole('button', { name: 'initial' });
        await (trigger === 'hover' ? userEvent.hover(initial) : userEvent.click(initial));
        await waitFor(() => expect(screen.getByLabelText('initial')).toHaveFocus());
    });
});

describe('Tooltip 定位（浏览器）', () => {
    it('弹层贴着触发器，箭头对准触发器中心', async () => {
        render(() => (
            <div style={{ padding: '200px' }}>
                <Tooltip content="beside tip" motion={false} trigger="custom" visible>
                    {(t) => <Button {...t()}>beside</Button>}
                </Tooltip>
            </div>
        ));
        const button = screen.getByRole('button').getBoundingClientRect();
        await waitFor(() => {
            const tip = wrapperOf('beside tip').getBoundingClientRect();
            expect(tip.bottom).toBeLessThanOrEqual(button.top);
            expect(button.top - tip.bottom).toBeLessThan(20);
            const arrow = (wrapperOf('beside tip').querySelector('svg') as SVGElement).getBoundingClientRect();
            expect(Math.abs(center(arrow) - center(button))).toBeLessThanOrEqual(1);
        });
    });

    it('组合嵌套的两个 Tooltip 都贴着同一个按钮', async () => {
        render(() => (
            <div style={{ padding: '200px' }}>
                <Tooltip content="outer tip" motion={false} position="top" trigger="custom" visible>
                    {(outer) => (
                        <Tooltip content="inner tip" motion={false} position="bottom" trigger="custom" visible>
                            {(inner) => <Button {...inner(outer())}>nested trigger</Button>}
                        </Tooltip>
                    )}
                </Tooltip>
            </div>
        ));
        const button = screen.getByRole('button', { name: 'nested trigger' }).getBoundingClientRect();
        await waitFor(() => {
            const outer = wrapperOf('outer tip').getBoundingClientRect();
            expect(outer.bottom).toBeLessThanOrEqual(button.top);
            expect(button.top - outer.bottom).toBeLessThan(20);
            expect(Math.abs(center(outer) - center(button))).toBeLessThanOrEqual(1);
            const inner = wrapperOf('inner tip').getBoundingClientRect();
            expect(inner.top).toBeGreaterThanOrEqual(button.bottom);
            expect(inner.top - button.bottom).toBeLessThan(20);
        });
    });

    it('挂载后修改 position，弹层换到新的方位', async () => {
        const [position, setPosition] = createSignal<Position>('top');
        render(() => (
            <div style={{ padding: '200px' }}>
                <Tooltip content="moving tip" motion={false} position={position()} trigger="custom" visible>
                    {(t) => <Button {...t()}>moving</Button>}
                </Tooltip>
            </div>
        ));
        await waitFor(() => expect(screen.getByText('moving tip')).toBeVisible());
        setPosition('bottom');
        const button = screen.getByRole('button', { name: 'moving' }).getBoundingClientRect();
        await waitFor(() => expect(wrapperOf('moving tip').getBoundingClientRect().top).toBeGreaterThanOrEqual(button.bottom));
    });

    it('触发器对象 style 更新后，弹层仍贴着它', async () => {
        const [color, setColor] = createSignal('red');
        render(() => (
            <div style={{ padding: '200px' }}>
                <Tooltip content="styled tip" motion={false} trigger="custom" visible>
                    {(t) => (
                        <button type="button" style={{ color: color(), 'margin-left': '40px' }} {...t()}>
                            styled
                        </button>
                    )}
                </Tooltip>
            </div>
        ));
        const button = screen.getByRole('button');
        setColor('blue');
        await waitFor(() => expect(Math.abs(center(wrapperOf('styled tip').getBoundingClientRect()) - center(button.getBoundingClientRect()))).toBeLessThanOrEqual(1));
    });

    it('触发器无尺寸时仍能定位弹层', async () => {
        render(() => (
            <div style={{ 'padding-inline-start': '200px', 'padding-block-start': '100px' }}>
                <Tooltip content="tip" motion={false} position="bottomLeft" showArrow={false} trigger="custom" visible>
                    {(t) => <span data-testid="empty" {...t()} />}
                </Tooltip>
            </div>
        ));
        const trigger = screen.getByTestId('empty');
        await waitFor(() => {
            const popup = popupOf(trigger).getBoundingClientRect();
            expect(popup.left).toBeCloseTo(trigger.getBoundingClientRect().left, 0);
            expect(popup.top).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom);
        });
    });

    it('leftTopOver 与 autoAdjustOverflow', async () => {
        await page.viewport(1200, 660);
        render(() => (
            <div style={{ width: '200vw', height: '200vw', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
                <div>
                    <Tooltip content={<div style={{ height: '200px', width: '200px' }}>Semi Design</div>} position="leftTopOver" showArrow={false} trigger="click">
                        {(t) => (
                            <Button style={{ width: '200px' }} {...t()}>
                                leftTopOver
                            </Button>
                        )}
                    </Tooltip>
                </div>
            </div>
        ));
        const trigger = screen.getByRole('button', { name: 'leftTopOver' });
        let rect = trigger.getBoundingClientRect();
        window.scrollBy(rect.left - 40, rect.top - 40);
        await userEvent.click(trigger);
        const popup = popupOf(trigger);
        await settled(popup);
        let t = trigger.getBoundingClientRect();
        let p = popup.getBoundingClientRect();
        expect(p.left).toBeLessThan(t.left);
        expect(p.top).toBeLessThan(t.top);
        expect(p.bottom).toBeGreaterThan(t.bottom);

        rect = trigger.getBoundingClientRect();
        window.scrollBy(rect.right - document.documentElement.clientWidth + 40, rect.bottom - document.documentElement.clientHeight + 40);
        await waitFor(() => {
            t = trigger.getBoundingClientRect();
            p = popup.getBoundingClientRect();
            expect(p.right).toBeGreaterThan(t.right);
            expect(p.bottom).toBeGreaterThan(t.bottom);
            expect(p.top).toBeLessThan(t.top);
        });
        expectInViewport(p);
    });

    it.each([
        ['top', { left: '20px', top: '40px' }, 'bottom'],
        ['top', { left: '20px', top: '70px' }, 'top'],
        ['bottom', { right: '20px', bottom: '40px' }, 'top'],
        ['bottom', { right: '20px', bottom: '70px' }, 'bottom'],
        ['left', { left: '180px', top: '20px' }, 'right'],
        ['left', { left: '300px', bottom: '20px' }, 'left'],
        ['right', { right: '180px', top: '20px' }, 'left'],
        ['right', { right: '300px', bottom: '20px' }, 'right'],
    ] as const)('%s %j 溢出时翻转并让箭头指向触发器', async (position, style, side) => {
        await page.viewport(1000, 800);
        const vertical = position === 'top' || position === 'bottom';
        render(() => (
            <Tooltip
                content={
                    <article>
                        Hi ByteDancer, this is a tooltip.
                        <br />
                        We have 2 lines.
                        {!vertical && (
                            <>
                                <br />
                                We have 3 lines.
                            </>
                        )}
                    </article>
                }
                motion={false}
                position={position}
                trigger="custom"
                visible
            >
                {(t) => (
                    <button type="button" style={{ position: 'fixed', ...style } as JSX.CSSProperties} {...t()}>
                        trigger
                    </button>
                )}
            </Tooltip>
        ));
        const button = screen.getByRole('button');
        await waitFor(() => {
            const trigger = button.getBoundingClientRect();
            const popup = popupOf(button);
            const rect = popup.getBoundingClientRect();
            expectInViewport(rect);
            const gaps: Record<Side, number> = { bottom: rect.top - trigger.bottom, top: trigger.top - rect.bottom, right: rect.left - trigger.right, left: trigger.left - rect.right };
            expect(gaps[side]).toBeGreaterThanOrEqual(0);
            const arrow = popup.querySelector('svg') as SVGElement;
            const arrowRect = arrow.getBoundingClientRect();
            const difference = vertical ? center(arrowRect) - center(trigger) : arrowRect.top + arrowRect.height / 2 - (trigger.top + trigger.height / 2);
            expect(Math.abs(difference)).toBeLessThanOrEqual(1);
            expect(new DOMMatrix(getComputedStyle(arrow).transform).a < 0).toBe(side === 'bottom' || side === 'right');
        });
    });

    it('触发器右侧被裁切时，topLeft 弹层对齐视口右边缘而非左边缘', async () => {
        const triggerLeft = document.documentElement.clientWidth - 100;
        render(() => (
            <div style={{ width: '100%', height: '200px', overflow: 'hidden', position: 'relative' }}>
                <Tooltip content={<div>贴右显示</div>} motion={false} position="topLeft" trigger="custom" visible>
                    {(t) => (
                        <Button style={{ position: 'absolute', top: '100px', left: `${triggerLeft}px`, width: '200px' }} {...t()}>
                            trigger
                        </Button>
                    )}
                </Tooltip>
            </div>
        ));
        const trigger = screen.getByRole('button', { name: 'trigger' });
        await waitFor(() => {
            const rect = popupOf(trigger).getBoundingClientRect();
            expect(Math.abs(rect.right - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
            expectInViewport(rect);
        });
    });
});

describe('Tooltip 顶层弹层（浏览器）', () => {
    it('默认动效下关闭后卸载弹层，并调用一次 afterClose', async () => {
        const afterClose = vi.fn<Callback>();
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <Tooltip afterClose={afterClose} content="closing tip" trigger="custom" visible={visible()}>
                {(t) => <Button {...t()}>closing</Button>}
            </Tooltip>
        ));
        await waitFor(() => expect(screen.getByText('closing tip')).toBeVisible());
        setVisible(false);
        await waitFor(() => expect(screen.queryByText('closing tip')).toBeNull());
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('visible 为 true 时进场动画后调用一次 afterOpen，弹层在顶层显示，不报告可见性变化', async () => {
        const afterOpen = vi.fn<Callback>();
        const onVisibleChange = vi.fn<NonNullable<TooltipProps['onVisibleChange']>>();
        render(() => (
            <Tooltip afterOpen={afterOpen} content="opening tip" trigger="custom" visible onVisibleChange={onVisibleChange}>
                {(t) => <Button {...t()}>opening</Button>}
            </Tooltip>
        ));
        await expectShown('opening tip');
        expect((shown() as HTMLElement).getAnimations().length).toBeGreaterThan(0);
        expect(afterOpen).not.toHaveBeenCalled();
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        await sleep(100);
        expect((shown() as HTMLElement).matches(':popover-open')).toBe(true);
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });

    it('模态层打开期间，之前打开的弹层不显示在它上面，关闭后恢复', async () => {
        render(() => (
            <Tooltip content={<button type="button">in popup</button>} motion={false} trigger="custom" visible>
                {(t) => <Button {...t()}>anchor</Button>}
            </Tooltip>
        ));
        const inPopup = await screen.findByRole('button', { name: 'in popup' });
        await waitFor(() => expect(inPopup).toBeVisible());
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        document.body.append(dialog);
        const close = openLayer({ element: dialog, modal: true });
        await waitFor(() => expect(inPopup).not.toBeVisible());
        close();
        dialog.remove();
        await waitFor(() => expect(inPopup).toBeVisible());
    });

    it('弹层不在触发器所在的 DOM 里：表单内回车不提交，label 内点击不切换复选框，不继承文字样式', async () => {
        const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
        render(() => (
            <form onSubmit={onSubmit}>
                <label style={{ 'white-space': 'nowrap', 'font-weight': 700 }}>
                    <input type="checkbox" />
                    agree
                    <Tooltip content={<input aria-label="popup input" />} motion={false} trigger="custom" visible>
                        <span>label trigger</span>
                    </Tooltip>
                </label>
            </form>
        ));
        const input = await screen.findByRole('textbox', { name: 'popup input' });
        const checkbox = screen.getByRole('checkbox');
        await userEvent.click(input);
        expect(checkbox).not.toBeChecked();
        await userEvent.keyboard('{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
        const popup = input.closest(wrapperSelector) as HTMLElement;
        expect(getComputedStyle(popup).whiteSpace).toBe('normal');
        expect(getComputedStyle(popup).fontWeight).not.toBe('700');
    });

    it('触发器在 open ShadowRoot 内时弹层挂进该 ShadowRoot，委托的 click、focus 与 Escape 照常运行', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const onClick = vi.fn<Callback>();
        const onFocusIn = vi.fn<Callback>();
        const view = render(
            () => (
                <Tooltip
                    closeOnEsc
                    content={
                        <button type="button" onClick={onClick} onFocusIn={onFocusIn}>
                            shadow inside
                        </button>
                    }
                    motion={false}
                    returnFocusOnClose
                    trigger="click"
                >
                    {(t) => <button {...t({ type: 'button' })}>shadow trigger</button>}
                </Tooltip>
            ),
            { container: mount }
        );
        onTestFinished(() => view.unmount());
        const trigger = shadow.querySelector('button') as HTMLButtonElement;
        trigger.click();
        await waitFor(() => expect(shadow.querySelector('[popover] button')).not.toBeNull());
        const layer = shadow.querySelector('[popover]') as HTMLElement;
        expect(layer.getRootNode()).toBe(shadow);
        const inside = layer.querySelector('button') as HTMLButtonElement;
        inside.focus();
        inside.click();
        expect(onFocusIn).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        inside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }));
        await waitFor(() => expect(shadow.querySelector('[popover]')).toBeNull());
        expect(shadow.activeElement).toBe(trigger);
    });
});

describe('Tooltip 全屏（浏览器）', () => {
    afterEach(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    });

    it('触发元素本身是全屏元素时，弹层挂进它且其中的按钮可点击', async () => {
        const onClick = vi.fn<Callback>();
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <>
                <button
                    type="button"
                    onClick={() => {
                        // the popup must be inserted after fullscreen starts
                        void (document.getElementById('stage') as HTMLElement).requestFullscreen().then(() => setVisible(true));
                    }}
                >
                    enter
                </button>
                <Tooltip
                    content={
                        <button type="button" onClick={onClick}>
                            inside
                        </button>
                    }
                    motion={false}
                    trigger="custom"
                    visible={visible()}
                >
                    {(t) => (
                        <div id="stage" style={{ background: 'white' }} data-testid="stage" {...t()}>
                            stage
                        </div>
                    )}
                </Tooltip>
            </>
        ));
        const stage = screen.getByTestId('stage');
        // requestFullscreen needs a user gesture
        await userEvent.click(screen.getByRole('button', { name: 'enter' }));
        await waitFor(() => expect(document.fullscreenElement).toBe(stage));
        const button = await screen.findByRole('button', { name: 'inside' });
        expect(stage).toContainElement(button);
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
