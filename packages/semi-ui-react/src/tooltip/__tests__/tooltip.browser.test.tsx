import { Activity, Component, StrictMode, useState, type Ref } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconHelpCircle } from '@fibrae/semi-icons-react';
import { Button, Input, Modal, Popover, Select, Switch, Tag, Tooltip, Typography } from '@fibrae/semi-ui-react';
import type { InputProps } from '@fibrae/semi-ui-react/input';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { sleep } from '@test/utils/react';
import type { Position } from '../index';

// the lowercase attribute is not an InputProps member; the tests check that the popup still focuses its input
const autofocusAttr = { autofocus: true } as unknown as InputProps;

const popupOf = (trigger) => document.getElementById(trigger.getAttribute('data-popupid'));

type Side = 'top' | 'bottom' | 'left' | 'right';

// the popup's open transition scales it, which getBoundingClientRect includes
const settled = (popup: HTMLElement) => waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

function expectInViewport(rect: DOMRect) {
    expect(rect.left).toBeGreaterThanOrEqual(-1);
    expect(rect.top).toBeGreaterThanOrEqual(-1);
    expect(rect.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    expect(rect.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight + 1);
}

/** The popup sits on `side` of the trigger inside the viewport, and its arrow points at the trigger's center */
function expectBeside(trigger: Element, popup: HTMLElement, side: Side) {
    const t = trigger.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    expectInViewport(p);
    const arrowEl = popup.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-icon-arrow`);
    const arrow = arrowEl.getBoundingClientRect();
    const vertical = side === 'top' || side === 'bottom';
    const [arrowCenter, triggerCenter] = vertical ? [arrow.left + arrow.width / 2, t.left + t.width / 2] : [arrow.top + arrow.height / 2, t.top + t.height / 2];
    expect(Math.abs(arrowCenter - triggerCenter)).toBeLessThanOrEqual(1);
    // [gap from the popup to the trigger, how far the arrow sticks out of the popup towards the trigger]
    const [gap, arrowOut] = {
        top: [t.top - p.bottom, arrow.bottom - p.bottom],
        bottom: [p.top - t.bottom, p.top - arrow.top],
        left: [t.left - p.right, arrow.right - p.right],
        right: [p.left - t.right, p.left - arrow.left],
    }[side];
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(arrowOut).toBeGreaterThan(0);
    // the arrow points away from the popup: the bottom and right looks are the top and left ones turned over
    const flipped = new DOMMatrix(getComputedStyle(arrowEl).transform).a < 0;
    expect(flipped).toBe(side === 'bottom' || side === 'right');
}

function AutoFocusControlled({ motion }) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button onClick={() => setVisible(!visible)}>toggle</Button>
            <Popover content={<Input data-testid="input" {...autofocusAttr} />} motion={motion} position="bottomLeft" trigger="custom" visible={visible}>
                <Button disabled>disabled trigger</Button>
            </Popover>
        </>
    );
}

describe('Tooltip（浏览器）', () => {
    afterEach(async () => {
        await page.viewport(1000, 660);
        window.scrollTo(0, 0);
    });

    it('leftTopOver 与 autoAdjustOverflow', async () => {
        await page.viewport(1200, 660);
        render(
            <div
                style={{
                    width: '200vw',
                    height: '200vw',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div>
                    <Tooltip content={<div style={{ height: 200, width: 200 }}>Semi Design</div>} position="leftTopOver" showArrow={false} trigger="click">
                        <Button style={{ width: 200 }}>leftTopOver</Button>
                    </Tooltip>
                </div>
            </div>
        );
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

    it('autoFocusHover', async () => {
        render(
            <Popover content={<Input data-testid="input" {...autofocusAttr} />} position="bottomLeft">
                <Button>motion</Button>
            </Popover>
        );
        await userEvent.hover(screen.getByRole('button', { name: 'motion' }));
        await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());
    });

    it('autoFocusHoverNoMotion', async () => {
        render(
            <Popover content={<Input data-testid="input" {...autofocusAttr} />} motion={false} position="bottomLeft">
                <Button>no motion</Button>
            </Popover>
        );
        await userEvent.hover(screen.getByRole('button', { name: 'no motion' }));
        await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());
    });

    it('autoFocusClick', async () => {
        render(
            <Popover content={<Input data-testid="input" {...autofocusAttr} />} position="bottomLeft" trigger="click">
                <Button>motion</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'motion' }));
        await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());
    });

    it('autoFocusClickNoMotion', async () => {
        render(
            <Popover content={<Input data-testid="input" {...autofocusAttr} />} motion={false} position="bottomLeft" trigger="click">
                <Button>no motion</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'no motion' }));
        await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());
    });

    it.each([
        ['autoFocusControlled', true],
        ['autoFocusControlledNoMotion', false],
    ])('%s', async (_, motion) => {
        render(<AutoFocusControlled motion={motion} />);
        await userEvent.click(screen.getByRole('button', { name: 'disabled trigger' }), { force: true });
        expect(screen.queryByTestId('input')).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());
    });

    it('tblr 方向的位置，微调到其他方向', async () => {
        await page.viewport(1000, 800);
        const content = (
            <article>
                Hi ByteDancer, this is a tooltip.
                <br /> We have 2 lines.
            </article>
        );
        const contentHigh = (
            <article>
                Hi ByteDancer, this is a tooltip.
                <br /> We have 2 lines.
                <br /> We have 2 lines.
            </article>
        );
        // [label, requested position, tag style, the placement the popup looks like after the overflow adjustment]
        const cases: [string, Position, Record<string, number>, Position][] = [
            ['top to bottomLeft', 'top', { left: 20, top: 40 }, 'bottomLeft'],
            ['top to bottomRight', 'top', { right: 20, top: 40 }, 'bottomRight'],
            ['top to topLeft', 'top', { left: 20, top: 70 }, 'topLeft'],
            ['top to topRight', 'top', { right: 20, top: 70 }, 'topRight'],
            ['bottom to bottomLeft', 'bottom', { left: 20, bottom: 70 }, 'bottomLeft'],
            ['bottom to bottomRight', 'bottom', { right: 20, bottom: 70 }, 'bottomRight'],
            ['bottom to topLeft', 'bottom', { left: 20, bottom: 40 }, 'topLeft'],
            ['bottom to topRight', 'bottom', { right: 20, bottom: 40 }, 'topRight'],
            ['left to leftTop', 'left', { left: 300, top: 20 }, 'leftTop'],
            ['left to leftBottom', 'left', { left: 300, bottom: 20 }, 'leftBottom'],
            ['left to rightTop', 'left', { left: 180, top: 20 }, 'rightTop'],
            ['left to rightBottom', 'left', { left: 180, bottom: 20 }, 'rightBottom'],
            ['right to rightTop', 'right', { right: 300, top: 20 }, 'rightTop'],
            ['right to rightBottom', 'right', { right: 300, bottom: 20 }, 'rightBottom'],
            ['right to leftTop', 'right', { right: 180, top: 20 }, 'leftTop'],
            ['right to leftBottom', 'right', { right: 180, bottom: 20 }, 'leftBottom'],
        ];
        render(
            <div style={{ width: 800, height: '100%' }}>
                {cases.map(([label, position, style]) => (
                    <Tooltip key={label} arrowPointAtCenter content={position === 'top' || position === 'bottom' ? content : contentHigh} position={position} showArrow>
                        <Tag style={{ position: 'absolute', ...style }}>{label}</Tag>
                    </Tooltip>
                ))}
            </div>
        );
        for (const [label, , , placement] of cases) {
            const tag = screen.getByText(label).closest(`.${BASE_CLASS_PREFIX}-tag`);
            await userEvent.hover(tag);
            await waitFor(() => expect(popupOf(tag)).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-wrapper-show`));
            const popup = popupOf(tag);
            await settled(popup);
            expect(popup).toHaveAttribute('x-placement', placement);
            expectBeside(tag, popup, placement.match(/^(top|bottom|left|right)/)[1] as Side);
            await userEvent.unhover(tag);
        }
    });

    it('Fix1449 #1449：触发器右侧被裁切时，topLeft 弹层对齐视口右边缘而非左边缘', async () => {
        const triggerLeft = document.documentElement.clientWidth - 100;
        render(
            <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
                <Tooltip content={<div>贴右显示</div>} motion={false} position="topLeft" trigger="custom" visible>
                    <Button style={{ position: 'absolute', top: 100, left: triggerLeft, width: 200 }}>trigger</Button>
                </Tooltip>
            </div>
        );

        const trigger = screen.getByRole('button', { name: 'trigger' });
        await waitFor(() => {
            const rect = popupOf(trigger).getBoundingClientRect();
            expect(Math.abs(rect.right - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
            expectInViewport(rect);
        });
    });
});

describe('Tooltip 触发事件（浏览器）', () => {
    const shown = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
    const expectShown = (text) => waitFor(() => expect(shown()).toHaveTextContent(text));
    const expectHidden = () => waitFor(() => expect(shown()).toBeNull());

    it('悬停显示，离开隐藏', async () => {
        render(
            <Tooltip content="hover tip">
                <Button>hover me</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'hover me' });
        await userEvent.hover(button);
        await expectShown('hover tip');
        await userEvent.unhover(button);
        await expectHidden();
    });

    it('不透传 props 的类组件作为 children 时，悬停显示并定位在触发元素上方', async () => {
        class ClassTrigger extends Component {
            override render() {
                return <span>class trigger</span>;
            }
        }
        render(
            <div style={{ padding: 100 }}>
                <Tooltip content="class tip">
                    <ClassTrigger />
                </Tooltip>
            </div>
        );
        const trigger = screen.getByText('class trigger');
        await userEvent.hover(trigger);
        await expectShown('class tip');
        const popup = shown() as HTMLElement;
        await settled(popup);
        const triggerRect = trigger.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        expect(popupRect.bottom).toBeLessThanOrEqual(triggerRect.top);
        expect(Math.abs(popupRect.left + popupRect.width / 2 - (triggerRect.left + triggerRect.width / 2))).toBeLessThan(2);
        await userEvent.unhover(trigger);
        await expectHidden();
    });

    it('悬停禁用或加载中的按钮时显示 tooltip', async () => {
        render(
            <>
                <Tooltip content="disabled tip">
                    <Button disabled>disabled</Button>
                </Tooltip>
                <Tooltip content="loading tip">
                    <Button loading>loading</Button>
                </Tooltip>
            </>
        );
        // force: the pointer lands on whatever receives events at the button's position (a wrapper or the button)
        await userEvent.hover(screen.getByText('disabled'), { force: true });
        await expectShown('disabled tip');
        await userEvent.hover(screen.getByText('loading'), { force: true });
        await expectShown('loading tip');
    });

    it('点击禁用按钮的触发器仍可打开', async () => {
        render(
            <Tooltip content="click tip" trigger="click">
                <Button disabled>disabled click</Button>
            </Tooltip>
        );
        await userEvent.click(screen.getByText('disabled click'), { force: true });
        await expectShown('click tip');
    });

    it('键盘聚焦打开的悬停 tooltip 在无指针时仍保持显示，失焦后隐藏', async () => {
        render(
            <Tooltip content="keyboard tip">
                <Button>keyboard focus me</Button>
            </Tooltip>
        );
        screen.getByRole('button', { name: 'keyboard focus me' }).focus();
        await expectShown('keyboard tip');
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(shown()).toHaveTextContent('keyboard tip');
        screen.getByRole('button', { name: 'keyboard focus me' }).blur();
        await expectHidden();
    });

    it('焦点移入弹层时，focus 触发器保持打开', async () => {
        render(
            <Tooltip content={<input aria-label="inside popup" />} trigger="focus">
                <Button>focus me</Button>
            </Tooltip>
        );
        screen.getByRole('button', { name: 'focus me' }).focus();
        await expectShown('');
        screen.getByLabelText('inside popup').focus();
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(shown()).not.toBeNull();
    });

    it('焦点在定位前移入的悬停弹层保持打开', async () => {
        render(
            <Tooltip content={<button type="button">inside popup</button>}>
                <Button>arrow down from me</Button>
            </Tooltip>
        );
        screen.getByRole('button', { name: 'arrow down from me' }).focus();
        // what ArrowDown does; positioning waits at least 32ms for a stable size, so this lands before it
        (await screen.findByRole('button', { name: 'inside popup' })).focus();
        await expectShown('inside popup');
        expect(screen.getByRole('button', { name: 'inside popup' })).toHaveFocus();
    });

    it('淡出期间再次打开的弹层会重新显示', async () => {
        function Toggle() {
            const [visible, setVisible] = useState(false);
            return (
                <Tooltip content="fading tip" trigger="custom" visible={visible}>
                    <Button onClick={() => setVisible(!visible)}>toggle</Button>
                </Tooltip>
            );
        }
        render(<Toggle />);
        const toggle = screen.getByRole('button', { name: 'toggle' });
        await userEvent.click(toggle);
        await expectShown('fading tip');
        const popup = shown();
        toggle.click();
        // React commits the close in a microtask, so the second click must not run in the same task
        await new Promise(requestAnimationFrame);
        // reopen while the exit transition the close started is still running
        expect(popup.getAnimations().length).toBeGreaterThan(0);
        toggle.click();
        await sleep(300);
        expect(screen.getByText('fading tip').closest(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toBe(popup);
        expect(popup.matches(':popover-open')).toBe(true);
        await expectShown('fading tip');
    });

    it('进出场是 keyframes 动画：出场期间弹层仍在顶层可见，结束后才隐藏', async () => {
        const afterClose = vi.fn<() => void>();
        const { rerender } = render(
            <Tooltip afterClose={afterClose} content="keyframe tip" keepDOM trigger="custom" visible>
                <Button>keyframe</Button>
            </Tooltip>
        );
        await expectShown('keyframe tip');
        const popup = shown() as HTMLElement;
        expect(popup.getAnimations().map((animation) => (animation as CSSAnimation).animationName)).toEqual([`${BASE_CLASS_PREFIX}-tooltip-zoom-in`]);
        await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));

        rerender(
            <Tooltip afterClose={afterClose} content="keyframe tip" keepDOM trigger="custom" visible={false}>
                <Button>keyframe</Button>
            </Tooltip>
        );
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
        const { rerender } = render(
            <Tooltip content="still tip" keepDOM motion={false} trigger="custom" visible>
                <Button>still</Button>
            </Tooltip>
        );
        await expectShown('still tip');
        const popup = shown() as HTMLElement;
        expect(popup.getAnimations()).toHaveLength(0);
        rerender(
            <Tooltip content="still tip" keepDOM motion={false} trigger="custom" visible={false}>
                <Button>still</Button>
            </Tooltip>
        );
        expect(popup.matches(':popover-open')).toBe(false);
    });

    it('contextMenu 触发器右键打开，closeOnEsc 下按 Escape 关闭', async () => {
        render(
            <Tooltip closeOnEsc content="menu tip" trigger="contextMenu">
                <Button>right click me</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'right click me' });
        await userEvent.click(button, { button: 'right' });
        await expectShown('menu tip');
        button.focus();
        await userEvent.keyboard('{Escape}');
        await expectHidden();
    });

    it('contextMenu 弹层对齐触发器中心，不跟随右键在按钮上的位置', async () => {
        render(
            <Tooltip content="menu tip" motion={false} trigger="contextMenu">
                <Button>right click corner</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'right click corner' });
        const buttonRect = button.getBoundingClientRect();
        fireEvent.contextMenu(button, { clientX: buttonRect.left + 1, clientY: buttonRect.top + 1 });
        const tip = await screen.findByRole('tooltip');
        await waitFor(() => {
            const tipRect = tip.getBoundingClientRect();
            expect(Math.abs(tipRect.left + tipRect.width / 2 - (buttonRect.left + buttonRect.width / 2))).toBeLessThan(8);
        });
    });

    it('函数组件用自己的 style 覆盖传入 style 时，弹层仍贴着触发器', async () => {
        function OwnStyle({ ref, ...props }: { ref?: Ref<HTMLSpanElement> }) {
            return (
                <span {...props} ref={ref} style={{ display: 'inline-block', padding: 4 }}>
                    Functional Component
                </span>
            );
        }
        render(
            <div style={{ marginTop: 200 }}>
                <Tooltip content="fc tip" motion={false}>
                    <OwnStyle />
                </Tooltip>
            </div>
        );
        const trigger = screen.getByText('Functional Component');
        await userEvent.hover(trigger);
        const tip = await screen.findByRole('tooltip');
        const triggerRect = trigger.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();
        expect(Math.abs(tipRect.left + tipRect.width / 2 - (triggerRect.left + triggerRect.width / 2))).toBeLessThan(16);
        expect(Math.abs(triggerRect.top - tipRect.bottom)).toBeLessThan(20);
    });

    it('中间省略的文字，提示贴着可见文字而不是屏幕外的测量节点', async () => {
        render(
            <div style={{ marginTop: 200 }}>
                <Typography.Text style={{ width: 150 }} ellipsis={{ showTooltip: true, pos: 'middle' }} link>
                    是一个很长很长很长很长的链接
                </Typography.Text>
            </div>
        );
        const trigger = await screen.findByText(/链接/);
        await waitFor(() => expect(trigger.textContent).toContain('...'));
        await userEvent.hover(trigger);
        const tip = await screen.findByRole('tooltip');
        const triggerRect = trigger.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();
        expect(tipRect.top).toBeGreaterThan(0);
        expect(tipRect.bottom).toBeLessThanOrEqual(triggerRect.top + 12);
    });

    it('点击作为触发器的 Select 弹层内部，不算点击外层 Popover 的外部', async () => {
        const onClickOutSide = vi.fn<() => void>();
        render(
            <Popover content={<div>outer popover</div>} trigger="custom" visible onClickOutSide={onClickOutSide}>
                <Select style={{ width: 160 }} defaultOpen optionList={[{ label: 'Option A', value: 'a' }]} />
            </Popover>
        );
        await waitFor(() => expect(screen.getByText('outer popover')).toBeVisible());
        const options = await screen.findAllByRole('option');
        await userEvent.click(options.find((option) => option.textContent === 'Option A'));
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(onClickOutSide).not.toHaveBeenCalled();
        await clickOutside();
        await waitFor(() => expect(onClickOutSide).toHaveBeenCalledTimes(1));
    });

    it('clickTriggerToHide：再次点击触发器', async () => {
        render(
            <Tooltip clickTriggerToHide content="toggle tip" trigger="click">
                <Button>toggle trigger</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'toggle trigger' });
        await userEvent.click(button);
        await expectShown('toggle tip');
        await userEvent.click(button);
        await expectHidden();
    });

    it('有两个根元素的触发器对准第一个元素（F1）', async () => {
        // renders two siblings and forwards nothing, which only the Fragment ref can see
        function Pair() {
            return (
                <>
                    <span style={{ display: 'inline-block', width: 100 }}>left</span>
                    <span style={{ display: 'inline-block', width: 100, marginLeft: 100 }}>right</span>
                </>
            );
        }
        render(
            <div style={{ padding: 100 }}>
                <Tooltip content="union tip" motion={false} position="bottom" trigger="custom" visible>
                    <Pair />
                </Tooltip>
            </div>
        );
        const left = screen.getByText('left').getBoundingClientRect();
        await waitFor(() => {
            const popup = document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`).getBoundingClientRect();
            expect(Math.abs(popup.left + popup.width / 2 - (left.left + left.width / 2))).toBeLessThanOrEqual(1);
        });
    });

    it('在嵌套弹层内按下鼠标不关闭外层弹层', async () => {
        render(
            <Popover
                content={
                    <Popover content={<button type="button">inner action</button>} trigger="click">
                        <Button>open inner</Button>
                    </Popover>
                }
                trigger="click"
            >
                <Button>open outer</Button>
            </Popover>
        );
        await userEvent.click(screen.getByRole('button', { name: 'open outer' }));
        await userEvent.click(await screen.findByRole('button', { name: 'open inner' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner action' }));
        await sleep(300);
        expect(screen.getByRole('button', { name: 'open inner' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'inner action' })).toBeVisible();
    });

    it('文本触发器被包裹后悬停仍然有效（G1）', async () => {
        render(<Tooltip content="text tip">plain text trigger</Tooltip>);
        await userEvent.hover(screen.getByText('plain text trigger'));
        await expectShown('text tip');
    });

    it('以 Select 作为 click Popover 的触发器时可打开它', async () => {
        render(
            <Popover content={<div>select popover</div>} trigger="click">
                <Select style={{ width: 160 }} optionList={[{ label: 'Option A', value: 'a' }]} />
            </Popover>
        );
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getByText('select popover')).toBeVisible());
    });

    it('StrictMode 下一次悬停只报告一次可见性变化', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <StrictMode>
                <Tooltip content="strict tip" onVisibleChange={onVisibleChange}>
                    <Button>strict</Button>
                </Tooltip>
            </StrictMode>
        );
        await userEvent.hover(screen.getByRole('button', { name: 'strict' }));
        await expectShown('strict tip');
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('StrictMode 下 visible 为 true 时打开一次，弹层在顶层显示，进场动画后调用一次 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const afterOpen = vi.fn<() => void>();
        render(
            <StrictMode>
                <Tooltip afterOpen={afterOpen} content="strict visible tip" trigger="custom" visible onVisibleChange={onVisibleChange}>
                    <Button>strict visible</Button>
                </Tooltip>
            </StrictMode>
        );
        await expectShown('strict visible tip');
        expect(shown().getAnimations().length).toBeGreaterThan(0);
        expect(afterOpen).not.toHaveBeenCalled();
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        expect(shown().getAnimations()).toHaveLength(0);
        await sleep(100);
        expect(shown().matches(':popover-open')).toBe(true);
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(afterOpen).toHaveBeenCalledTimes(1);
    });

    it('由 Tooltip 设为可聚焦的图标触发器显示主题焦点环', async () => {
        const { container } = render(
            <Tooltip content="tip">
                <IconHelpCircle />
            </Tooltip>
        );
        const icon = container.querySelector(`.${BASE_CLASS_PREFIX}-icon`);
        await tabTo(icon);
        expectThemeFocusRing(icon);
    });

    it('禁用的点击触发器外层 span 是 Tab 停留点，并显示主题焦点环', async () => {
        const { container } = render(
            <Tooltip content="tip" trigger="click">
                <Button disabled>disabled</Button>
            </Tooltip>
        );
        const wrapper = container.querySelector('span[tabindex="0"]');
        await tabTo(wrapper);
        expectThemeFocusRing(wrapper);
    });

    // e.g. a Dropdown with no children, shown as a static menu: the empty wrapper span still has a position
    it('触发器无尺寸时仍能定位弹层', async () => {
        render(
            <div style={{ paddingInlineStart: 200, paddingBlockStart: 100 }}>
                <Tooltip content="tip" motion={false} position="bottomLeft" showArrow={false} trigger="custom" visible>
                    <span data-testid="empty" />
                </Tooltip>
            </div>
        );
        const trigger = screen.getByTestId('empty').getBoundingClientRect();
        await waitFor(() => {
            const popup = popupOf(screen.getByTestId('empty')).getBoundingClientRect();
            expect(popup.left).toBeCloseTo(trigger.left, 0);
            expect(popup.top).toBeGreaterThanOrEqual(trigger.bottom);
        });
    });

    it('body 的 position 在首次打开后改变时，弹层仍居中对齐触发器', async () => {
        const bodyStyle = document.body.style;
        const saved = { margin: bodyStyle.margin, position: bodyStyle.position };
        const centerOf = (rect: DOMRect) => rect.left + rect.width / 2;
        try {
            // a body margin is what the static-body compensation corrects for, so a stale position shows up as that offset
            bodyStyle.margin = '24px';
            render(
                <Tooltip content="body tip" motion={false} position="bottom" trigger="click">
                    <Button>body position</Button>
                </Tooltip>
            );
            const trigger = screen.getByRole('button', { name: 'body position' });
            await userEvent.click(trigger);
            await expectShown('body tip');
            await clickOutside();
            await waitFor(() => expect(popupOf(trigger)).toBeNull());

            bodyStyle.position = 'relative';
            await userEvent.click(trigger);
            await expectShown('body tip');
            await waitFor(() => expect(centerOf(popupOf(trigger).getBoundingClientRect())).toBeCloseTo(centerOf(trigger.getBoundingClientRect()), 0));
            expect(document.body).not.toHaveAttribute('data-position');
        } finally {
            bodyStyle.margin = saved.margin;
            bodyStyle.position = saved.position;
        }
    });

    it.each([
        ['Switch', <Switch key="switch" aria-label="inner switch" />],
        [
            'loading Button',
            <Button key="loading" loading>
                inner loading
            </Button>,
        ],
    ])('焦点落在 %s 内层控件上时，键盘打开的悬停提示保持显示', async (_, child) => {
        render(<Tooltip content="inner tip">{child}</Tooltip>);
        await tab();
        expect(document.activeElement).not.toBe(document.body);
        await expectShown('inner tip');
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(shown()).toHaveTextContent('inner tip');
    });

    it('Escape 关闭后焦点回到 loading Button 本身，而不是外层包裹', async () => {
        render(
            <Popover content={<button type="button">inside</button>} trigger="click">
                <Button loading>busy</Button>
            </Popover>
        );
        const button = screen.getByRole('button', { name: 'busy' });
        await userEvent.click(button, { force: true });
        (await screen.findByRole('button', { name: 'inside' })).focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('button', { name: 'inside' })).toBeNull());
        expect(button).toHaveFocus();
    });

    it('模态覆盖层打开期间，之前打开的弹层不显示在它上面', async () => {
        function Demo() {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <Popover content={<Button onClick={() => setOpen(true)}>open modal</Button>} motion={false} trigger="custom" visible>
                        <Button>anchor</Button>
                    </Popover>
                    <Modal title="Dialog" motion={false} visible={open} onCancel={() => setOpen(false)}>
                        modal body
                    </Modal>
                </>
            );
        }
        render(<Demo />);
        const opener = await screen.findByRole('button', { name: 'open modal' });
        await userEvent.click(opener);
        await screen.findByRole('dialog', { name: 'Dialog' });
        await waitFor(() => expect(opener).not.toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Dialog' })).toBeNull());
        await waitFor(() => expect(opener).toBeVisible());
    });

    it('悬停判断只检查触发器自身，不扫描整个文档的 :hover', async () => {
        render(
            <Tooltip content="scoped tip">
                <Button>scoped hover</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'scoped hover' });
        await new Promise((resolve) => setTimeout(resolve, 50));
        const querySelectorAll = vi.spyOn(document, 'querySelectorAll');
        try {
            await userEvent.hover(button);
            await expectShown('scoped tip');
            expect(querySelectorAll.mock.calls.filter(([selector]) => selector === ':hover')).toHaveLength(0);
        } finally {
            querySelectorAll.mockRestore();
        }
    });
});

describe('Tooltip 顶层弹层（浏览器）', () => {
    const wrapperOf = (text: string) => screen.getByText(text).closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`);

    it('默认动效下关闭后卸载弹层，并调用一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const renderTip = (visible: boolean) => (
            <Tooltip afterClose={afterClose} content="closing tip" trigger="custom" visible={visible}>
                <Button>closing</Button>
            </Tooltip>
        );
        const { rerender } = render(renderTip(true));
        await waitFor(() => expect(screen.getByText('closing tip')).toBeVisible());
        rerender(renderTip(false));
        await waitFor(() => expect(screen.queryByText('closing tip')).toBeNull());
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('Tooltip 包着 Popover 时，两个弹层都贴着按钮', async () => {
        render(
            <div style={{ padding: 200 }}>
                <Tooltip content="outer tip" motion={false} position="top" trigger="custom" visible>
                    <Popover content="inner pop" motion={false} position="bottom" trigger="custom" visible>
                        <Button>nested trigger</Button>
                    </Popover>
                </Tooltip>
            </div>
        );
        const button = screen.getByRole('button', { name: 'nested trigger' }).getBoundingClientRect();
        await waitFor(() => {
            const tip = wrapperOf('outer tip').getBoundingClientRect();
            expect(tip.bottom).toBeLessThanOrEqual(button.top);
            expect(button.top - tip.bottom).toBeLessThan(20);
            expect(Math.abs(tip.left + tip.width / 2 - (button.left + button.width / 2))).toBeLessThanOrEqual(1);
        });
        const pop = screen.getByText('inner pop').closest(`.${BASE_CLASS_PREFIX}-popover-wrapper`).getBoundingClientRect();
        expect(pop.top).toBeGreaterThanOrEqual(button.bottom);
        expect(pop.top - button.bottom).toBeLessThan(20);
    });

    it('挂载后修改 position，弹层换到新的方位', async () => {
        const renderTip = (position: Position) => (
            <div style={{ padding: 200 }}>
                <Tooltip content="moving tip" motion={false} position={position} trigger="custom" visible>
                    <Button>moving</Button>
                </Tooltip>
            </div>
        );
        const { rerender } = render(renderTip('top'));
        await waitFor(() => expect(screen.getByText('moving tip')).toBeVisible());
        rerender(renderTip('bottom'));
        const button = screen.getByRole('button', { name: 'moving' }).getBoundingClientRect();
        await waitFor(() => expect(wrapperOf('moving tip').getBoundingClientRect().top).toBeGreaterThanOrEqual(button.bottom));
    });

    it('弹层不在触发器所在的 DOM 里：表单内回车不提交外层表单，label 内点击不切换复选框，不继承触发器处的文字样式', async () => {
        const onSubmit = vi.fn<(e: React.FormEvent) => void>((e) => e.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <label style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                    <input type="checkbox" />
                    agree
                    <Popover content={<input aria-label="popup input" />} motion={false} trigger="custom" visible>
                        <span>label trigger</span>
                    </Popover>
                </label>
            </form>
        );
        const input = await screen.findByRole('textbox', { name: 'popup input' });
        const checkbox = screen.getByRole('checkbox');
        await userEvent.click(input);
        expect(checkbox).not.toBeChecked();
        await userEvent.keyboard('{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
        const popup = input.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(getComputedStyle(popup).whiteSpace).toBe('normal');
        expect(getComputedStyle(popup).fontWeight).not.toBe('700');
    });
});

describe('Activity 隐藏 keepDOM 弹层（浏览器）', () => {
    const wrapperOf = (text: string) => screen.getByText(text).closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-tooltip-wrapper`);
    const expectGone = (popup: HTMLElement) =>
        waitFor(() => {
            expect(popup.matches(':popover-open')).toBe(false);
            expect(popup.checkVisibility()).toBe(false);
        });

    it('打开中被隐藏时弹层离开顶层且不可见，重新显示后保持关闭，点击触发器能再次打开', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Tooltip content="kept tip" keepDOM trigger="click">
                    <Button>kept</Button>
                </Tooltip>
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('button', { name: 'kept' }));
        await waitFor(() => expect(screen.getByText('kept tip')).toBeVisible());
        const popup = wrapperOf('kept tip');
        expect(popup.matches(':popover-open')).toBe(true);

        rerender(view('hidden'));
        await expectGone(popup);

        rerender(view('visible'));
        await sleep(300);
        expect(popup.isConnected).toBe(true);
        expect(popup.matches(':popover-open')).toBe(false);
        expect(popup.checkVisibility()).toBe(false);

        await userEvent.click(screen.getByRole('button', { name: 'kept' }));
        await waitFor(() => expect(popup.matches(':popover-open')).toBe(true));
        await waitFor(() => expect(screen.getByText('kept tip')).toBeVisible());
    });

    it('离场动画进行中被隐藏时弹层不可见，重新显示后没有残留的打开弹层，之后仍能打开', async () => {
        const view = (mode: 'visible' | 'hidden', visible: boolean) => (
            <Activity mode={mode}>
                <Tooltip content="leaving tip" keepDOM trigger="custom" visible={visible}>
                    <Button>leaving</Button>
                </Tooltip>
            </Activity>
        );
        const { rerender } = render(view('visible', true));
        await waitFor(() => expect(screen.getByText('leaving tip')).toBeVisible());
        const popup = wrapperOf('leaving tip');
        await settled(popup);

        rerender(view('visible', false));
        // React commits the close in a microtask; the exit transition starts in the layout effect
        await new Promise(requestAnimationFrame);
        expect(popup.getAnimations().length).toBeGreaterThan(0);
        rerender(view('hidden', false));
        await expectGone(popup);

        rerender(view('visible', false));
        await sleep(300);
        expect(popup.isConnected).toBe(true);
        expect(popup.matches(':popover-open')).toBe(false);
        expect(popup.checkVisibility()).toBe(false);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toBeNull();

        rerender(view('visible', true));
        await waitFor(() => expect(popup.matches(':popover-open')).toBe(true));
        await waitFor(() => expect(screen.getByText('leaving tip')).toBeVisible());
    });
});

describe('Tooltip 全屏（浏览器）', () => {
    afterEach(async () => {
        if (document.fullscreenElement) await document.exitFullscreen();
    });

    it('触发元素本身是全屏元素时，弹层挂进它且其中的按钮可点击', async () => {
        const onClick = vi.fn<() => void>();
        function Demo() {
            const [visible, setVisible] = useState(false);
            return (
                <>
                    <button
                        onClick={() => {
                            // the popup must be inserted after fullscreen starts
                            void document
                                .getElementById('stage')
                                .requestFullscreen()
                                .then(() => setVisible(true));
                        }}
                    >
                        enter
                    </button>
                    <Tooltip content={<button onClick={onClick}>inside</button>} motion={false} trigger="custom" visible={visible}>
                        <div id="stage" style={{ background: 'white' }} data-testid="stage">
                            stage
                        </div>
                    </Tooltip>
                </>
            );
        }
        render(<Demo />);
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
