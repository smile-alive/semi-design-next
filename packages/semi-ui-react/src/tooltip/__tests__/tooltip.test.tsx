import { StrictMode, createRef, useEffect, useState, type Ref } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, expectTypeOf, it, onTestFinished, test, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/tooltip/constants';
import Button from '@fibrae/semi-ui-react/button';
import Modal from '@fibrae/semi-ui-react/modal';
import Select from '@fibrae/semi-ui-react/select';
import { sleep } from '@test/utils/react';
import { PopupLayerContext, usePopupLayer } from '../../_base/popup-layer';
import { useTooltipDescription } from '../context';
import Tooltip, { type TooltipHandle, type TooltipProps } from '../index';

const wrapperSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper`;
const shownWrapperSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`;
const clickOutside = (target: EventTarget = document) =>
    act(() => {
        target.dispatchEvent(new Event('mousedown', { bubbles: true, cancelable: true }));
    });

// jsdom runs no transitions, so a close unmounts at once; this fakes a running animation (exit, or enter for
// afterOpen) until the returned function is called.
function holdLeaveAnimation() {
    const { promise: finished, resolve } = Promise.withResolvers<void>();
    const spy = vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished } as unknown as Animation]);
    onTestFinished(() => spy.mockRestore());
    return () =>
        act(async () => {
            spy.mockRestore();
            resolve();
            await finished;
        });
}

describe(`Tooltip`, () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it(`Tooltip 外观`, async () => {
        const triggerId = `trigger`;

        const { unmount } = render(
            <Tooltip content="Content" motion={false} trigger="click">
                <Button id={triggerId}>Click here</Button>
            </Tooltip>
        );

        await userEvent.click(document.getElementById(triggerId));
        expect(document.querySelectorAll(wrapperSelector)).toHaveLength(1);
        await waitFor(() => expect(document.querySelectorAll(shownWrapperSelector)).toHaveLength(1));

        await userEvent.click(document.querySelector(wrapperSelector));
        expect(document.querySelectorAll(shownWrapperSelector)).toHaveLength(1);

        clickOutside();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());

        await userEvent.click(document.getElementById(triggerId));
        await waitFor(() => expect(document.querySelectorAll(shownWrapperSelector)).toHaveLength(1));

        unmount();
        clickOutside();
        expect(document.getElementsByClassName(`${BASE_CLASS_PREFIX}-tooltip-wrapper`)).toHaveLength(0);
    });

    test(`带 motion 的外观`, async () => {
        const triggerId = `trigger`;
        const refObj = { current: null };
        const refFn = vi.fn<(element: HTMLElement | null) => void>();
        function Tip(props: TooltipProps) {
            const [visible, setVisible] = useState(true);
            return <Tooltip {...props} visible={visible} onVisibleChange={setVisible} />;
        }

        render(
            <div>
                <Tip content="Content" motion showArrow trigger="click">
                    <Button ref={refObj} id={triggerId}>
                        Click here
                    </Button>
                </Tip>
                <Tip content="Content" motion showArrow trigger="click" wrapWhenSpecial={false}>
                    <Button ref={refFn}>Click here</Button>
                </Tip>
            </div>
        );

        expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2);
        await waitFor(() => expect(document.querySelectorAll(shownWrapperSelector)).toHaveLength(2));

        expect(refObj.current).not.toBeNull();
        expect(refFn).toHaveBeenCalled();

        clickOutside();
        await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(0));
    });

    test(`特殊外观`, async () => {
        render(
            <div>
                <Tooltip content="Content" motion showArrow trigger="click" visible>
                    <span style={{ display: 'block' }}>Click here</span>
                </Tooltip>
                <Tooltip content="Content" motion showArrow trigger="click" visible>
                    <Button block>Click here</Button>
                </Tooltip>
                <Tooltip content="Content" motion showArrow trigger="click" visible>
                    Click Me
                </Tooltip>
            </div>
        );

        expect(document.querySelectorAll(wrapperSelector)).toHaveLength(3);
        expect(screen.getAllByText('Content')).toHaveLength(3);
    });

    test(`事件`, async () => {
        function Demo() {
            const [visible, setVisible] = useState(true);
            return (
                <Tooltip
                    content={
                        <article>
                            <Button onClick={() => setVisible(false)}>close</Button>
                        </article>
                    }
                    motion
                    showArrow
                    trigger="click"
                    visible={visible}
                >
                    <span style={{ display: 'block' }}>Click here</span>
                </Tooltip>
            );
        }
        render(<Demo />);

        expect(document.querySelectorAll(wrapperSelector)).toHaveLength(1);

        await userEvent.click(screen.getByRole('button', { name: 'close' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
    });

    test(`position 为 left 时的箭头路径`, async () => {
        render(
            <Tooltip
                content={
                    <article>
                        <Button />
                    </article>
                }
                motion={(() => false) as unknown as boolean}
                position="left"
                showArrow
                trigger="click"
                visible
            >
                <span style={{ display: 'block' }}>Click here</span>
            </Tooltip>
        );

        expect(document.querySelector(`${wrapperSelector} svg path`)).toHaveAttribute('d', 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z');
    });

    test(`每个 position 的 x-placement`, async () => {
        const positionList = strings.POSITION_SET;
        for (const position of positionList) {
            const { unmount } = render(
                <Tooltip content={<article>1</article>} position={position} visible>
                    <span style={{ display: 'block' }}>Click here</span>
                </Tooltip>
            );
            await waitFor(() => expect(document.querySelector(wrapperSelector)).toHaveAttribute('x-placement', position));
            unmount();
        }
    });

    it(`点击外部处理函数`, async () => {
        const containerId = `container`;
        render(
            <div style={{ height: 480, width: 320 }}>
                <div id={containerId}>Hello Semi</div>
                <Tooltip content="Content" motion={false} trigger="click">
                    <Button>Click here</Button>
                </Tooltip>
            </div>
        );

        const button = screen.getByRole('button', { name: 'Click here' });
        await userEvent.click(button);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        clickOutside();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());

        await userEvent.click(button);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        clickOutside(document.getElementById(containerId));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
    });

    it('onClickOutSide 收到原生 MouseEvent', async () => {
        expectTypeOf<Parameters<NonNullable<TooltipProps['onClickOutSide']>>[0]>().toEqualTypeOf<MouseEvent>();
        const onClickOutSide = vi.fn<(e: MouseEvent) => void>();
        render(
            <Tooltip content="Content" motion={false} trigger="click" onClickOutSide={onClickOutSide}>
                <Button>Click here</Button>
            </Tooltip>
        );
        await userEvent.click(screen.getByRole('button', { name: 'Click here' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        fireEvent.mouseDown(document.body);

        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        const event = onClickOutSide.mock.calls[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event).not.toHaveProperty('nativeEvent');
    });

    it('ref 暴露 focusTrigger、getPopupId 和 rePosition', async () => {
        const ref = createRef<TooltipHandle>();
        render(
            <Tooltip ref={ref} content="Content" motion={false} returnFocusOnClose trigger="click">
                <Button>ref trigger</Button>
            </Tooltip>
        );
        const button = screen.getByRole('button', { name: 'ref trigger' });
        await waitFor(() => expect(ref.current.getPopupId()).toBeTruthy());
        expect(button).toHaveAttribute('data-popupid', ref.current.getPopupId());
        act(() => ref.current.focusTrigger());
        expect(button).toHaveFocus();
        await userEvent.click(button);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        expect(() => act(() => ref.current.rePosition())).not.toThrow();
    });

    it('触发器上的 Escape 会到达触发器自身的 onKeyDown 及其 React 祖先', () => {
        const own = vi.fn<() => void>();
        const ancestor = vi.fn<() => void>();
        render(
            <div role="toolbar" tabIndex={-1} onKeyDown={ancestor}>
                <Tooltip content="Content" motion={false} trigger="click">
                    <Button onKeyDown={own}>esc trigger</Button>
                </Tooltip>
            </div>
        );
        fireEvent.keyDown(screen.getByRole('button', { name: 'esc trigger' }), { key: 'Escape' });
        expect(own).toHaveBeenCalledTimes(1);
        expect(ancestor).toHaveBeenCalledTimes(1);
    });

    it('Escape 关闭 Modal 内打开的浮层，下一次 Escape 才关闭 Modal', async () => {
        const onCancel = vi.fn<() => void>();
        render(
            <Modal title="Dialog" motion={false} visible onCancel={onCancel}>
                <Tooltip closeOnEsc content="Content" motion={false} trigger="click">
                    <Button>open</Button>
                </Tooltip>
            </Modal>
        );
        const trigger = screen.getByRole('button', { name: 'open' });
        fireEvent.click(trigger);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        fireEvent.keyDown(trigger, { key: 'Escape' });
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('随机部分以数字开头时，生成的浮层 id 仍是合法的 CSS id 选择器', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        try {
            render(
                <Tooltip content="popup" motion={false} trigger="custom" visible>
                    <span>trigger</span>
                </Tooltip>
            );
            const id = screen.getByText('trigger').getAttribute('aria-describedby');
            await waitFor(() => expect(screen.getByText('popup')).toBeInTheDocument());
            expect(document.querySelector(`#${id}`)).toHaveTextContent('popup');
        } finally {
            vi.restoreAllMocks();
        }
    });

    it('condition 变为 false 时隐藏已显示的浮层', async () => {
        const { rerender } = render(
            <Tooltip condition content="hi" motion={false}>
                <span>Test</span>
            </Tooltip>
        );
        await userEvent.hover(screen.getByText('Test'));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        rerender(
            <Tooltip condition={false} content="hi" motion={false}>
                <span>Test</span>
            </Tooltip>
        );
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
    });

    it('visible 受控为 true 时，hide()、点击外部、Esc、clickToHide 与 condition 只报告 onVisibleChange(false)，使用方关闭时不再重复报告', async () => {
        const ref = createRef<TooltipHandle>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const tip = ({ condition = true, visible = true }) => (
            <Tooltip ref={ref} clickToHide condition={condition} content="Content" motion={false} trigger="click" visible={visible} onVisibleChange={onVisibleChange}>
                <Button>controlled</Button>
            </Tooltip>
        );
        const { rerender } = render(tip({}));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        const popup = document.querySelector(wrapperSelector);

        act(() => ref.current.hide());
        clickOutside();
        fireEvent.keyDown(screen.getByRole('button', { name: 'controlled' }), { key: 'Escape' });
        fireEvent.click(popup);
        rerender(tip({ condition: false }));
        await sleep(50);
        expect(popup).toBeInTheDocument();
        expect(popup).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
        expect(onVisibleChange.mock.calls).toEqual([[false], [false], [false], [false], [false]]);

        rerender(tip({ condition: false, visible: false }));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        expect(onVisibleChange).toHaveBeenCalledTimes(5);
    });

    it('悬停触发且 visible 受控为 true 时，挂载后保持显示；hide() 请求关闭后使用方回写即关闭，不再等 mouseLeaveDelay', async () => {
        const ref = createRef<TooltipHandle>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const tip = (visible: boolean) => (
            <Tooltip ref={ref} content="Content" motion={false} mouseLeaveDelay={2000} visible={visible} onVisibleChange={onVisibleChange}>
                <Button>hover controlled</Button>
            </Tooltip>
        );
        const { rerender } = render(tip(true));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await sleep(50);
        expect(document.querySelector(shownWrapperSelector)).not.toBeNull();

        act(() => ref.current.hide());
        expect(onVisibleChange.mock.calls).toEqual([[false]]);
        rerender(tip(false));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('visible 受控时使用方自行打开和关闭弹层，不调用 onVisibleChange', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const tip = (visible: boolean) => (
            <Tooltip content="Content" motion={false} trigger="click" visible={visible} onVisibleChange={onVisibleChange}>
                <Button>owner</Button>
            </Tooltip>
        );
        const { rerender } = render(tip(false));
        rerender(tip(true));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await sleep(50);
        rerender(tip(false));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        await sleep(50);
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('使用方拒绝打开请求后自行打开再关闭，弹层照常开合，只报告那次请求', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const tip = (visible: boolean) => (
            <Tooltip content="Content" motion={false} trigger="click" visible={visible} onVisibleChange={onVisibleChange}>
                <Button>rejected</Button>
            </Tooltip>
        );
        const { rerender } = render(tip(false));
        fireEvent.click(screen.getByRole('button', { name: 'rejected' }));
        rerender(tip(false));
        await sleep(50);
        expect(document.querySelector(wrapperSelector)).toBeNull();

        rerender(tip(true));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await sleep(50);
        rerender(tip(false));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        await sleep(50);
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('visible 受控为 false 时，点击触发器只报告 onVisibleChange(true)，不自行打开；使用方回写后打开且不重复报告', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const tip = (visible: boolean) => (
            <Tooltip content="Content" motion={false} trigger="click" visible={visible} onVisibleChange={onVisibleChange}>
                <Button>closed controlled</Button>
            </Tooltip>
        );
        const { rerender } = render(tip(false));

        fireEvent.click(screen.getByRole('button', { name: 'closed controlled' }));
        await sleep(50);
        expect(document.querySelector(wrapperSelector)).toBeNull();
        expect(onVisibleChange.mock.calls).toEqual([[true]]);

        rerender(tip(true));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeInTheDocument());
        await sleep(50);
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('弹层内容读到新的弹层层级，触发器仍读到外层层级', async () => {
        const outer = Symbol('outer');
        const onLayer = vi.fn<(name: string, layer: symbol | undefined) => void>();
        function LayerProbe({ name }: { name: string }) {
            const layer = usePopupLayer();
            useEffect(() => onLayer(name, layer), [name, layer]);
            return <span>{name}</span>;
        }
        render(
            <PopupLayerContext value={outer}>
                <Tooltip content={<LayerProbe name="content" />} motion={false} trigger="custom" visible>
                    <button>
                        <LayerProbe name="trigger" />
                    </button>
                </Tooltip>
            </PopupLayerContext>
        );
        await screen.findByText('content');
        const layers = new Map(onLayer.mock.calls);
        expect(layers.get('trigger')).toBe(outer);
        expect(typeof layers.get('content')).toBe('symbol');
        expect(layers.get('content')).not.toBe(outer);
    });

    it('触发元素以 aria-describedby={undefined} 退出时，内部后代经 useTooltipDescription 指向弹层，且不泄漏到内层 Tooltip 与弹层内容', async () => {
        function Described({ testId }: { testId: string }) {
            return (
                <span data-testid={testId} aria-describedby={useTooltipDescription()}>
                    {testId}
                </span>
            );
        }
        render(
            <Tooltip content={<Described testId="in-content" />} motion={false} trigger="custom" visible>
                <span data-testid="outer-trigger" aria-describedby={undefined}>
                    <Described testId="described" />
                    <Tooltip content={<Described testId="in-inner-content" />} motion={false} trigger="custom" visible>
                        <span>
                            <Described testId="in-inner-trigger" />
                        </span>
                    </Tooltip>
                </span>
            </Tooltip>
        );
        await screen.findByTestId('in-content');
        expect(await screen.findByTestId('in-inner-content')).not.toHaveAttribute('aria-describedby');
        const popupId = screen.getByTestId('outer-trigger').getAttribute('data-popupid');
        expect(screen.getByTestId('described')).toHaveAttribute('aria-describedby', popupId);
        expect(screen.getByTestId('outer-trigger')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('in-inner-trigger')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('in-content')).not.toHaveAttribute('aria-describedby');
    });

    it('悬停浮层内容里的方向键不会被当作触发器的方向键', async () => {
        render(
            <Tooltip
                content={
                    <>
                        <input aria-label="first" />
                        <input aria-label="second" />
                    </>
                }
                motion={false}
            >
                <span>Test</span>
            </Tooltip>
        );
        await userEvent.hover(screen.getByText('Test'));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        const second = screen.getByLabelText('second');
        second.focus();
        const prevented = !fireEvent.keyDown(second, { key: 'ArrowUp' });

        expect(prevented).toBe(false);
        expect(second).toHaveFocus();
    });

    it('离场动画期间重新悬停排下的延时显示，在动画结束后仍会执行', async () => {
        render(
            <Tooltip content="hint" mouseEnterDelay={150} mouseLeaveDelay={0}>
                <span>Test</span>
            </Tooltip>
        );
        const trigger = screen.getByText('Test');
        await userEvent.hover(trigger);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull(), { timeout: 2000 });
        const finishLeave = holdLeaveAnimation();
        await userEvent.unhover(trigger);
        await waitFor(() => {
            expect(document.querySelector(wrapperSelector)).not.toBeNull();
            expect(document.querySelector(shownWrapperSelector)).toBeNull();
        });

        await userEvent.hover(trigger);
        await finishLeave();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());

        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull(), { timeout: 2000 });
    });

    it('延时显示排下的渲染提交前离场动画结束，浮层仍显示并报告打开', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <Tooltip content="hint" mouseEnterDelay={1} mouseLeaveDelay={1} trigger="focus" onVisibleChange={onVisibleChange}>
                <button>Test</button>
            </Tooltip>
        );
        const trigger = screen.getByRole('button', { name: 'Test' });
        act(() => trigger.focus());
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        const { promise: finished, resolve } = Promise.withResolvers<void>();
        const spy = vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished } as unknown as Animation]);
        onTestFinished(() => spy.mockRestore());
        act(() => trigger.blur());
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(document.querySelector(wrapperSelector)).not.toBeNull();
        onVisibleChange.mockClear();

        // show() runs in the delay timer, outside any event, so its render is not urgent; act holds that render
        // while the leave settles, the order a real browser can produce
        await act(async () => {
            trigger.focus();
            await sleep(10);
            spy.mockRestore();
            resolve();
            await sleep(0);
        });

        await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
        expect(document.querySelector(shownWrapperSelector)).not.toBeNull();
    });

    it('悬停触发器上的 ArrowDown 仍把焦点移入浮层', async () => {
        render(
            <Tooltip content={<input aria-label="inside" />} motion={false}>
                <span>Test</span>
            </Tooltip>
        );
        const trigger = screen.getByText('Test');
        await userEvent.hover(trigger);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        expect(screen.getByLabelText('inside')).toHaveFocus();
    });

    it('wrapWhenSpecial=false 时文本子节点也能渲染并悬停显示', async () => {
        render(
            <Tooltip content="hint" motion={false} wrapWhenSpecial={false}>
                plain text
            </Tooltip>
        );
        await userEvent.hover(screen.getByText('plain text'));
        await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());
    });

    it('motion=false 修复 #1402：悬停接收 ref 的函数组件触发器时显示浮层', async () => {
        const Trigger = ({ ref, ...props }: { ref?: Ref<HTMLSpanElement> }) => (
            <span {...props} ref={ref}>
                Test
            </span>
        );
        render(
            <Tooltip content="hi bytedance" motion={false}>
                <Trigger />
            </Tooltip>
        );

        await userEvent.hover(screen.getByText('Test'));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        expect(document.querySelector(shownWrapperSelector)).toHaveTextContent('hi bytedance');
        expect(document.querySelector(shownWrapperSelector)).toBeVisible();

        await userEvent.unhover(screen.getByText('Test'));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
    });

    // A hover-triggered ancestor popup (Dropdown) listens to focus/blur on its portal; a nested Popconfirm must not
    // bubble them up and close it
    it('修复 #1557：stopPropagation 阻止浮层内的 focus 和 blur 冒泡到 React 祖先', () => {
        const onFocus = vi.fn<() => void>();
        const onBlur = vi.fn<() => void>();
        const renderTooltip = (stopPropagation) =>
            render(
                <div onBlur={onBlur} onFocus={onFocus}>
                    <Tooltip content={<input aria-label="inner" />} motion={false} stopPropagation={stopPropagation} trigger="custom" visible>
                        <span>trigger</span>
                    </Tooltip>
                </div>
            );
        const focusAndBlurInner = () =>
            act(() => {
                screen.getByLabelText('inner').focus();
                screen.getByLabelText('inner').blur();
            });

        const { unmount } = renderTooltip(true);
        focusAndBlurInner();
        expect(onFocus).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();
        unmount();

        renderTooltip(false);
        focusAndBlurInner();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('运行时把 trigger 由 hover 改为 click 后，悬停不再打开而点击打开', async () => {
        const { rerender } = render(
            <Tooltip content="hint" motion={false}>
                <span>Test</span>
            </Tooltip>
        );
        rerender(
            <Tooltip content="hint" motion={false} trigger="click">
                <span>Test</span>
            </Tooltip>
        );

        await userEvent.hover(screen.getByText('Test'));
        await sleep(200);
        expect(document.querySelector(wrapperSelector)).toBeNull();

        await userEvent.click(screen.getByText('Test'));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
    });

    it('挂载后未打开的 Tooltip 不注册 window resize 监听', () => {
        const addEventListener = vi.spyOn(window, 'addEventListener');
        try {
            render(
                <Tooltip content="hint">
                    <span>Test</span>
                </Tooltip>
            );
            expect(addEventListener.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
        } finally {
            addEventListener.mockRestore();
        }
    });

    it('浮层带上触发器最近的局部亮暗色类名', async () => {
        const dark = `${BASE_CLASS_PREFIX}-always-dark`;
        const light = `${BASE_CLASS_PREFIX}-always-light`;
        render(
            <div className={dark}>
                <Tooltip content="outer" trigger="custom" visible>
                    <span>outer</span>
                </Tooltip>
                <div className={light}>
                    <Tooltip content="inner" trigger="custom" visible>
                        <span>inner</span>
                    </Tooltip>
                </div>
            </div>
        );
        await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
        const [outer, inner] = [...document.querySelectorAll(wrapperSelector)];
        expect(outer).toHaveTextContent('outer');
        expect(outer).toHaveClass(dark);
        expect(outer).not.toHaveClass(light);
        expect(inner).toHaveClass(light);
        expect(inner).not.toHaveClass(dark);
    });

    it('aria-describedby 只在浮层节点存在时输出，condition 为 false 时不输出', async () => {
        const { rerender } = render(
            <Tooltip content="hint" motion={false} trigger="click">
                <button type="button">trigger</button>
            </Tooltip>
        );
        const trigger = screen.getByRole('button');
        expect(trigger).not.toHaveAttribute('aria-describedby');
        expect(trigger.getAttribute('data-popupid')).toMatch(/^semi-tooltip-/);
        fireEvent.click(trigger);
        await waitFor(() => expect(trigger).toHaveAccessibleDescription('hint'));
        clickOutside();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        expect(trigger).not.toHaveAttribute('aria-describedby');
        rerender(
            <Tooltip condition={false} content="hint" motion={false} trigger="click">
                <button type="button">trigger</button>
            </Tooltip>
        );
        fireEvent.click(trigger);
        expect(document.querySelector(wrapperSelector)).toBeNull();
        expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    it('role=dialog 的 aria-controls 只在浮层节点存在时输出，keepDOM 时关闭后保留', async () => {
        // Tooltip takes the popup's role as a prop; there is no element to swap for a native <dialog>
        const role = 'dialog';
        const dialogTip = (keepDOM: boolean) => (
            <Tooltip aria-label="Details" role={role} content="hint" keepDOM={keepDOM} motion={false} trigger="click">
                <button type="button">trigger</button>
            </Tooltip>
        );
        const { rerender } = render(dialogTip(false));
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger).not.toHaveAttribute('aria-controls');
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-controls', (await screen.findByRole('dialog')).id);
        clickOutside();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        expect(trigger).not.toHaveAttribute('aria-controls');
        rerender(dialogTip(true));
        fireEvent.click(trigger);
        const popup = await screen.findByRole('dialog');
        clickOutside();
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        expect(popup).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-controls', popup.id);
    });

    it('role=dialog 不给角色不在白名单内的子节点加 aria-haspopup 与 aria-expanded', () => {
        // roles held in variables: the point is a role outside the allow-list on a focusable span
        const role = 'dialog';
        const childRole = 'img';
        render(
            <Tooltip aria-label="Details" role={role} content="hint" motion={false} trigger="click">
                <span aria-label="icon" role={childRole} tabIndex={0} />
            </Tooltip>
        );
        const trigger = screen.getByRole('img');
        expect(trigger).not.toHaveAttribute('aria-haspopup');
        expect(trigger).not.toHaveAttribute('aria-expanded');
    });

    it('disabled 且 loading 的 Button 在 hover 触发时不加包裹元素', () => {
        const { container } = render(
            <Tooltip wrapperClassName="probe" content="hint" motion={false}>
                <Button disabled loading>
                    save
                </Button>
            </Tooltip>
        );
        expect(container.querySelector('.probe')).toBeNull();
    });

    it('全屏元素包含触发器或就是触发器时，浮层挂进全屏元素', async () => {
        let fullscreen: Element | null = null;
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
        onTestFinished(() => {
            delete (document as { fullscreenElement?: unknown }).fullscreenElement;
        });
        const tip = (visible: boolean) => (
            <div data-testid="stage">
                <Tooltip content="inner" motion={false} trigger="custom" visible={visible}>
                    <button type="button">inner</button>
                </Tooltip>
                <Tooltip content="self" motion={false} trigger="custom" visible={visible}>
                    <div data-testid="self">self</div>
                </Tooltip>
            </div>
        );
        const { rerender } = render(tip(false));
        fullscreen = screen.getByTestId('stage');
        rerender(tip(true));
        await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
        expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement).toBe(fullscreen);
        rerender(tip(false));
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        fullscreen = screen.getByTestId('self');
        rerender(tip(true));
        await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
        expect(screen.getByRole('tooltip', { name: 'self' }).parentElement).toBe(fullscreen);
        expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement).toBe(document.body);
    });

    it('非受控时 onVisibleChange(true) 时浮层内容已在文档中，受控时它是早于浮层挂载的打开请求', async () => {
        const contentInDocument: boolean[] = [];
        function Controlled() {
            const [visible, setVisible] = useState(false);
            return (
                <Tooltip
                    content={<input aria-label="field" />}
                    motion={false}
                    trigger="click"
                    visible={visible}
                    onVisibleChange={(next) => {
                        if (next) contentInDocument.push(Boolean(screen.queryByRole('textbox', { name: 'field' })));
                        setVisible(next);
                    }}
                >
                    <button type="button">controlled</button>
                </Tooltip>
            );
        }
        render(
            <>
                <Tooltip
                    content={<input aria-label="field" />}
                    motion={false}
                    trigger="click"
                    onVisibleChange={(next) => {
                        if (next) contentInDocument.push(Boolean(screen.queryByRole('textbox', { name: 'field' })));
                    }}
                >
                    <button type="button">uncontrolled</button>
                </Tooltip>
                <Controlled />
            </>
        );
        fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
        await waitFor(() => expect(contentInDocument).toEqual([true]));
        clickOutside();
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        fireEvent.click(screen.getByRole('button', { name: 'controlled' }));
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'field' })).toBeInTheDocument());
        expect(contentInDocument).toEqual([true, false]);
    });

    it('mouseLeaveDelay 小于 mouseEnterDelay 的告警在重新渲染时不重复输出', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const tooltip = (content: string) => (
                <Tooltip content={content} mouseEnterDelay={200} mouseLeaveDelay={100}>
                    <span>Test</span>
                </Tooltip>
            );
            const { rerender } = render(tooltip('a'));
            rerender(tooltip('b'));
            rerender(tooltip('c'));
            expect(warn.mock.calls.filter(([message]) => String(message).includes('mouseLeaveDelay'))).toHaveLength(1);
        } finally {
            warn.mockRestore();
        }
    });

    it('悬停加 clickToHide 时，stopPropagation 仍阻止浮层内的 click、focus 冒泡到 React 祖先，且只报告一次关闭', async () => {
        const onClick = vi.fn<() => void>();
        const onFocus = vi.fn<() => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <div onClick={onClick} onFocus={onFocus}>
                <Tooltip clickToHide content={<button type="button">inside</button>} motion={false} stopPropagation onVisibleChange={onVisibleChange}>
                    <span>Test</span>
                </Tooltip>
            </div>
        );
        await userEvent.hover(screen.getByText('Test'));
        const inside = await screen.findByRole('button', { name: 'inside' });
        act(() => inside.focus());
        fireEvent.click(inside);
        await waitFor(() => expect(document.querySelector(wrapperSelector)).toBeNull());
        expect(onClick).not.toHaveBeenCalled();
        expect(onFocus).not.toHaveBeenCalled();
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('默认在 Modal 内按 Escape 关闭聚焦打开的提示，Modal 保持打开', async () => {
        const onCancel = vi.fn<() => void>();
        render(
            <Modal title="Dialog" motion={false} visible onCancel={onCancel}>
                <Tooltip content="Content" motion={false}>
                    <Button>hint</Button>
                </Tooltip>
            </Modal>
        );
        const trigger = screen.getByRole('button', { name: 'hint' });
        act(() => trigger.focus());
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        fireEvent.keyDown(trigger, { key: 'Escape' });
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('关闭后到离场结束前再次在外部按下，不重复报告 onClickOutSide 与关闭', async () => {
        const onClickOutSide = vi.fn<(e: MouseEvent) => void>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <Tooltip content="Content" trigger="click" onClickOutSide={onClickOutSide} onVisibleChange={onVisibleChange}>
                <Button>Click here</Button>
            </Tooltip>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Click here' }));
        await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
        holdLeaveAnimation();
        clickOutside();
        clickOutside();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('keepDOM 的悬停提示关闭后再离开触发器，不再报告关闭', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <Tooltip content="Content" keepDOM motion={false} mouseLeaveDelay={0} onVisibleChange={onVisibleChange}>
                <span>Test</span>
            </Tooltip>
        );
        const trigger = screen.getByText('Test');
        await userEvent.hover(trigger);
        await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
        fireEvent.mouseLeave(trigger);
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        fireEvent.mouseLeave(trigger);
        fireEvent.blur(trigger);
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('触发器自带的 aria-describedby 与提示的 id 合并，显式 undefined 时不注入', async () => {
        render(
            <>
                <span id="own">own description</span>
                <Tooltip content="hint" motion={false} trigger="custom" visible>
                    <button type="button" aria-describedby="own">
                        merged
                    </button>
                </Tooltip>
                <Tooltip content="hint" motion={false} trigger="custom" visible>
                    <button type="button" aria-describedby={undefined}>
                        opted out
                    </button>
                </Tooltip>
            </>
        );
        const merged = screen.getByRole('button', { name: 'merged' });
        await waitFor(() => expect(merged).toHaveAccessibleDescription('own description hint'));
        expect(screen.getByRole('button', { name: 'opted out' })).not.toHaveAttribute('aria-describedby');
    });
});

it('wrapperClassName', () => {
    const { container, unmount } = render(
        <Tooltip wrapperClassName="test" content="hi bytedance">
            <Button>正常的多个按钮</Button>
            <Button>正常的多个按钮</Button>
        </Tooltip>
    );
    expect(container.querySelector('.test')).not.toBeNull();
    unmount();

    // hover reaches a disabled element directly (F4); click does not, so it still gets the wrapper
    const disabledHover = render(
        <Tooltip wrapperClassName="test" content="hi bytedance">
            <Button disabled>正常的多个按钮</Button>
        </Tooltip>
    );
    expect(disabledHover.container.querySelector('.test')).toBeNull();
    disabledHover.unmount();

    const disabledButton = render(
        <Tooltip wrapperClassName="test" content="hi bytedance" trigger="click">
            <Button disabled>正常的多个按钮</Button>
        </Tooltip>
    );
    expect(disabledButton.container.querySelector('.test')).not.toBeNull();
    disabledButton.unmount();

    const disabledSelect = render(
        <Tooltip wrapperClassName="test" content="hi bytedance" trigger="click">
            <Select style={{ width: 120 }} disabled placeholder="请选择业务线">
                <Select.Option value="abc">抖音</Select.Option>
                <Select.Option value="hotsoon">火山</Select.Option>
                <Select.Option disabled value="jianying">
                    剪映
                </Select.Option>
                <Select.Option value="xigua">西瓜视频</Select.Option>
            </Select>
        </Tooltip>
    );
    expect(disabledSelect.container.querySelector('.test')).not.toBeNull();
});

it('wrapper span 内 loading 状态的 Button 保持唯一 Tab 停靠点和描述信息', async () => {
    const { container } = render(
        <Tooltip wrapperClassName="loading-wrapper" content="Saving" motion={false} trigger="click">
            <Button loading>Save</Button>
        </Tooltip>
    );
    const button = screen.getByRole('button');
    await userEvent.tab();
    expect(button).toHaveFocus();
    fireEvent.click(container.querySelector('.loading-wrapper'));
    await waitFor(() => expect(button).toHaveAccessibleDescription('Saving'));
    expect(container.querySelector('.loading-wrapper')).not.toHaveAttribute('aria-describedby');
    await userEvent.tab();
    expect(document.body).toHaveFocus();
});

describe('卸载时的 afterClose', () => {
    const flushMicrotasks = () => act(async () => {});

    it('打开中卸载时异步补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <Tooltip afterClose={afterClose} content="tip" motion={false} trigger="custom" visible>
                <Button>trigger</Button>
            </Tooltip>
        );
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        unmount();
        expect(afterClose).not.toHaveBeenCalled();
        await flushMicrotasks();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('离场动画中卸载时补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { rerender, unmount } = render(
            <Tooltip afterClose={afterClose} content="tip" trigger="custom" visible>
                <Button>trigger</Button>
            </Tooltip>
        );
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        const finishLeave = holdLeaveAnimation();
        rerender(
            <Tooltip afterClose={afterClose} content="tip" trigger="custom" visible={false}>
                <Button>trigger</Button>
            </Tooltip>
        );
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).toBeNull());
        expect(document.querySelector(wrapperSelector)).not.toBeNull();
        expect(afterClose).not.toHaveBeenCalled();
        unmount();
        await flushMicrotasks();
        expect(afterClose).toHaveBeenCalledTimes(1);
        await finishLeave();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('关闭后再卸载只调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { rerender, unmount } = render(
            <Tooltip afterClose={afterClose} content="tip" motion={false} trigger="custom" visible>
                <Button>trigger</Button>
            </Tooltip>
        );
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        rerender(
            <Tooltip afterClose={afterClose} content="tip" motion={false} trigger="custom" visible={false}>
                <Button>trigger</Button>
            </Tooltip>
        );
        await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        unmount();
        await flushMicrotasks();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('从未打开过的 Tooltip 卸载时不调 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <Tooltip afterClose={afterClose} content="tip" trigger="click">
                <Button>trigger</Button>
            </Tooltip>
        );
        unmount();
        await flushMicrotasks();
        expect(afterClose).not.toHaveBeenCalled();
    });
});

describe('onOpen', () => {
    it('弹层显示时调用一次，早于进场动画结束，受控与非受控相同', async () => {
        const onOpen = vi.fn<() => void>();
        const afterOpen = vi.fn<() => void>();
        const finishEnter = holdLeaveAnimation();
        const tip = (visible?: boolean) => (
            <>
                <Tooltip afterOpen={afterOpen} content="uncontrolled" trigger="click" onOpen={onOpen}>
                    <Button>uncontrolled</Button>
                </Tooltip>
                <Tooltip afterOpen={afterOpen} content="controlled" trigger="custom" visible={visible} onOpen={onOpen}>
                    <Button>controlled</Button>
                </Tooltip>
            </>
        );
        const { rerender } = render(tip(false));
        fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
        rerender(tip(true));
        await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(2));
        expect(afterOpen).not.toHaveBeenCalled();

        await finishEnter();
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(2));
        expect(onOpen).toHaveBeenCalledTimes(2);
    });
});

describe('afterOpen', () => {
    it('进场动画结束后调用一次，受控与非受控相同', async () => {
        const afterOpen = vi.fn<() => void>();
        const finishEnter = holdLeaveAnimation();
        const tip = (visible?: boolean) => (
            <>
                <Tooltip afterOpen={afterOpen} content="uncontrolled" trigger="click">
                    <Button>uncontrolled</Button>
                </Tooltip>
                <Tooltip afterOpen={afterOpen} content="controlled" trigger="custom" visible={visible}>
                    <Button>controlled</Button>
                </Tooltip>
            </>
        );
        const { rerender } = render(tip(false));
        fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
        rerender(tip(true));
        await waitFor(() => expect(document.querySelectorAll(shownWrapperSelector)).toHaveLength(2));
        await sleep(50);
        expect(afterOpen).not.toHaveBeenCalled();

        await finishEnter();
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(2));
        await sleep(50);
        expect(afterOpen).toHaveBeenCalledTimes(2);
    });

    it('没有进场动画时打开后即调用', async () => {
        const afterOpen = vi.fn<() => void>();
        render(
            <Tooltip afterOpen={afterOpen} content="tip" motion={false} trigger="click">
                <Button>trigger</Button>
            </Tooltip>
        );
        fireEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
    });

    it('进场动画结束前关闭的这次打开不调用', async () => {
        const afterOpen = vi.fn<() => void>();
        const afterClose = vi.fn<() => void>();
        const finishEnter = holdLeaveAnimation();
        render(
            <Tooltip afterClose={afterClose} afterOpen={afterOpen} content="tip" trigger="click">
                <Button>trigger</Button>
            </Tooltip>
        );
        fireEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(document.querySelector(shownWrapperSelector)).not.toBeNull());
        await sleep(20);
        clickOutside();
        await finishEnter();
        await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
        await sleep(50);
        expect(afterOpen).not.toHaveBeenCalled();
    });

    it('悬停打开后指针已离开而撤回的这次打开不调用', async () => {
        const afterOpen = vi.fn<() => void>();
        const afterClose = vi.fn<() => void>();
        render(
            <Tooltip afterClose={afterClose} afterOpen={afterOpen} content="tip" motion={false} mouseEnterDelay={0} mouseLeaveDelay={5000}>
                <Button>trigger</Button>
            </Tooltip>
        );
        const trigger = screen.getByRole('button', { name: 'trigger' });
        // the pointer leaves before handleOpened runs; the long mouseLeaveDelay keeps the leave itself from closing
        fireEvent.mouseEnter(trigger);
        fireEvent.mouseLeave(trigger);
        await sleep(100);
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(afterOpen).not.toHaveBeenCalled();
    });

    it('StrictMode 下每次打开只调用一次', async () => {
        const afterOpen = vi.fn<() => void>();
        render(
            <StrictMode>
                <Tooltip afterOpen={afterOpen} content="controlled" motion={false} trigger="custom" visible>
                    <Button>controlled</Button>
                </Tooltip>
                <Tooltip afterOpen={afterOpen} content="uncontrolled" motion={false} trigger="click">
                    <Button>uncontrolled</Button>
                </Tooltip>
            </StrictMode>
        );
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(2));
        await sleep(50);
        expect(afterOpen).toHaveBeenCalledTimes(2);
    });
});
