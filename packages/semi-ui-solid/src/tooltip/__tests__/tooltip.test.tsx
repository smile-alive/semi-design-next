import { createSignal, For, onMount, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/tooltip/constants';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import { sleep } from '@test/utils/solid';
import Tooltip, { type RenderContentProps, type TooltipHandle, type TooltipProps } from '..';
import { PopupLayerContext, usePopupLayer } from '../../_base/popup-layer';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import Button, { ButtonGroup } from '../../button';
import ConfigProvider from '../../config-provider';
import { useTooltipDescription } from '../context';

const wrapperSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper`;
const shownSelector = `.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`;
const popup = () => document.querySelector<HTMLElement>(wrapperSelector);
const shown = () => document.querySelector<HTMLElement>(shownSelector);
const clickOutside = (target: EventTarget = document) => target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
// Tooltip takes the popup's role as a prop; there is no element to swap for a native <dialog>
const dialogRole = 'dialog';
// a string style is a supported prop type under test
const stringStyle: string = 'color: blue';
type VisibleChange = NonNullable<TooltipProps['onVisibleChange']>;
type Callback = () => void;

// jsdom runs no transitions, so a close unmounts at once; this fakes a running animation (exit, or enter for
// afterOpen) until the returned function is called
function holdAnimation() {
    const { promise: finished, resolve } = Promise.withResolvers<void>();
    const spy = vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished } as unknown as Animation]);
    onTestFinished(() => spy.mockRestore());
    return async () => {
        spy.mockRestore();
        resolve();
        await finished;
        await sleep(0);
    };
}

function spyWarn() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    return (text: string) => warn.mock.calls.filter(([message]) => String(message).includes(text));
}

describe('Tooltip', () => {
    it('点击打开，点击弹层保持打开，点击外部关闭，卸载后不留弹层', async () => {
        const view = render(() => (
            <Tooltip content="Content" motion={false} trigger="click">
                {(t) => <Button {...t()}>Click here</Button>}
            </Tooltip>
        ));
        const trigger = screen.getByRole('button', { name: 'Click here' });
        await userEvent.click(trigger);
        expect(document.querySelectorAll(wrapperSelector)).toHaveLength(1);
        await waitFor(() => expect(shown()).not.toBeNull());

        await userEvent.click(popup() as HTMLElement);
        expect(shown()).not.toBeNull();

        clickOutside();
        await waitFor(() => expect(popup()).toBeNull());

        await userEvent.click(trigger);
        await waitFor(() => expect(shown()).not.toBeNull());
        view.unmount();
        clickOutside();
        expect(popup()).toBeNull();
    });

    it('弹层结构：Portal 包裹 div 下的 popover，带 role、x-placement、箭头与内容', async () => {
        render(() => (
            <Tooltip content="hint" trigger="custom" visible>
                <span>trigger</span>
            </Tooltip>
        ));
        const tip = await screen.findByRole('tooltip');
        expect(tip).toHaveAttribute('popover', 'manual');
        expect(tip).toHaveAttribute('x-placement', 'top');
        expect(tip.parentElement?.parentElement).toBe(document.body);
        expect(tip.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-content`)).toHaveTextContent('hint');
        expect(tip.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    describe('函数 children', () => {
        it('按钮带 tabindex 与 data-popupid，aria-describedby 只在弹层插入期间输出', async () => {
            const [condition, setCondition] = createSignal(true);
            render(() => (
                <Tooltip condition={condition()} content="hint" motion={false} trigger="click">
                    {(t) => <button {...t({ type: 'button' })}>trigger</button>}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('tabindex', '0');
            expect(trigger.getAttribute('data-popupid')).toMatch(/^semi-tooltip-/);
            expect(trigger).not.toHaveAttribute('aria-describedby');
            fireEvent.click(trigger);
            await waitFor(() => expect(trigger).toHaveAccessibleDescription('hint'));
            expect(trigger).toHaveAttribute('aria-describedby', trigger.getAttribute('data-popupid'));
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
            expect(trigger).not.toHaveAttribute('aria-describedby');

            setCondition(false);
            fireEvent.click(trigger);
            await sleep(20);
            expect(popup()).toBeNull();
            expect(trigger).not.toHaveAttribute('aria-describedby');
        });

        it('own 的 ref 收到元素，onClick 照常触发，tabIndex 的显式值与 tabindex 归一', async () => {
            const ref = vi.fn<(element: HTMLElement) => void>();
            const onClick = vi.fn<(event: MouseEvent) => void>();
            render(() => (
                <>
                    <Tooltip content="a" motion={false} trigger="click">
                        {(t) => <span {...t({ ref, onClick })}>own</span>}
                    </Tooltip>
                    <Tooltip content="b">{(t) => <span {...t({ tabIndex: -1 })}>minus</span>}</Tooltip>
                    <Tooltip content="c">{(t) => <span {...t({ tabIndex: undefined })}>unset</span>}</Tooltip>
                    <Tooltip content="d">{(t) => <span {...t({ tabindex: '-1' })}>lower</span>}</Tooltip>
                </>
            ));
            const own = screen.getByText('own');
            expect(ref).toHaveBeenCalledWith(own);
            await userEvent.click(own);
            expect(onClick).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(shown()).not.toBeNull());
            expect(screen.getByText('minus')).toHaveAttribute('tabindex', '-1');
            expect(screen.getByText('unset')).toHaveAttribute('tabindex', '0');
            const lower = screen.getByText('lower');
            expect(lower).toHaveAttribute('tabindex', '-1');
            expect(lower.getAttributeNames().filter((name) => name === 'tabindex')).toHaveLength(1);
        });

        it('own 的 aria-describedby 与弹层 id 拼接，null 时退出并经 useTooltipDescription 交给后代', async () => {
            function Described(props: { testId: string }) {
                const description = useTooltipDescription();
                return (
                    <span data-testid={props.testId} aria-describedby={description?.()}>
                        {props.testId}
                    </span>
                );
            }
            render(() => (
                <>
                    <span id="own">own description</span>
                    <Tooltip content="hint" motion={false} trigger="custom" visible>
                        {(t) => (
                            <button type="button" {...t({ 'aria-describedby': 'own' })}>
                                merged
                            </button>
                        )}
                    </Tooltip>
                    <Tooltip content={<Described testId="in-content" />} motion={false} trigger="custom" visible>
                        {(t) => (
                            <span data-testid="outer-trigger" {...t({ 'aria-describedby': null })}>
                                <Described testId="described" />
                                <Tooltip content={<Described testId="in-inner-content" />} motion={false} trigger="custom" visible>
                                    <Described testId="in-inner-trigger" />
                                </Tooltip>
                            </span>
                        )}
                    </Tooltip>
                </>
            ));
            const merged = screen.getByRole('button', { name: 'merged' });
            await waitFor(() => expect(merged).toHaveAccessibleDescription('own description hint'));
            await screen.findByTestId('in-content');
            await screen.findByTestId('in-inner-content');
            const outer = screen.getByTestId('outer-trigger');
            expect(outer).not.toHaveAttribute('aria-describedby');
            expect(screen.getByTestId('described')).toHaveAttribute('aria-describedby', outer.getAttribute('data-popupid'));
            expect(screen.getByTestId('in-inner-trigger')).not.toHaveAttribute('aria-describedby');
            expect(screen.getByTestId('in-content')).not.toHaveAttribute('aria-describedby');
            expect(screen.getByTestId('in-inner-content')).not.toHaveAttribute('aria-describedby');
        });

        it('role=dialog：打开前就有 aria-haspopup 与 aria-expanded，aria-controls 只在弹层插入后输出，keepDOM 关闭后保留', async () => {
            const [keepDOM, setKeepDOM] = createSignal(false);
            render(() => (
                <Tooltip aria-label="Details" role={dialogRole} content="hint" keepDOM={keepDOM()} motion={false} trigger="click">
                    {(t) => (
                        <button type="button" {...t()}>
                            trigger
                        </button>
                    )}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
            expect(trigger).not.toHaveAttribute('aria-controls');
            expect(trigger).not.toHaveAttribute('aria-describedby');
            fireEvent.click(trigger);
            const dialog = await screen.findByRole('dialog', { name: 'Details' });
            expect(trigger).toHaveAttribute('aria-controls', dialog.id);
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
            expect(trigger).not.toHaveAttribute('aria-controls');

            setKeepDOM(true);
            fireEvent.click(trigger);
            const kept = await screen.findByRole('dialog');
            clickOutside();
            await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
            await sleep(20);
            expect(kept).toBeInTheDocument();
            expect(trigger).toHaveAttribute('aria-controls', kept.id);
        });

        it('role=dialog：generic 与白名单外角色不带弹层状态，own 的 role 与 aria 值优先', () => {
            render(() => (
                <>
                    <Tooltip aria-label="a" role={dialogRole} content="a" trigger="click">
                        {(t) => <div {...t()}>generic</div>}
                    </Tooltip>
                    <Tooltip aria-label="b" role={dialogRole} content="b" trigger="click">
                        {(t) => <span aria-label="icon" {...t({ role: 'img' })} />}
                    </Tooltip>
                    <Tooltip aria-label="c" role={dialogRole} content="c" trigger="click">
                        {(t) => <div {...t({ role: 'button' })}>own role</div>}
                    </Tooltip>
                    <Tooltip aria-label="d" role={dialogRole} content="d" trigger="click">
                        {(t) => (
                            <button type="button" {...t({ 'aria-haspopup': 'menu' })}>
                                menu
                            </button>
                        )}
                    </Tooltip>
                </>
            ));
            const generic = screen.getByText('generic');
            expect(generic).not.toHaveAttribute('aria-haspopup');
            expect(generic).not.toHaveAttribute('aria-expanded');
            expect(screen.getByRole('img')).not.toHaveAttribute('aria-haspopup');
            expect(screen.getByRole('button', { name: 'own role' })).toHaveAttribute('aria-haspopup', 'dialog');
            expect(screen.getByRole('button', { name: 'menu' })).toHaveAttribute('aria-haspopup', 'menu');
        });

        it('没有展开 getTriggerProps 时挂载后告警一次', () => {
            const warned = spyWarn();
            render(() => <Tooltip content="hint">{(_t) => <button type="button">forgot</button>}</Tooltip>);
            expect(warned('spread getTriggerProps')).toHaveLength(1);
        });

        it('组合嵌套时 data-popupid 列出两层 id，两层都绑定监听', async () => {
            render(() => (
                <Tooltip content="outer" motion={false} trigger="click">
                    {(outer) => (
                        <Tooltip content="inner" motion={false} trigger="focus">
                            {(inner) => <Button {...inner(outer())}>both</Button>}
                        </Tooltip>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            expect(button.getAttribute('data-popupid')?.split(' ')).toHaveLength(2);
            fireEvent.click(button);
            fireEvent.focusIn(button);
            await waitFor(() => expect(document.querySelectorAll(shownSelector)).toHaveLength(2));
            const ids = [...document.querySelectorAll(wrapperSelector)].map((element) => element.id);
            expect(button.getAttribute('aria-describedby')?.split(' ').toSorted()).toEqual(ids.toSorted());
        });

        it('组合嵌套时在内层弹层内按下不关闭外层', async () => {
            render(() => (
                <Tooltip content="outer" motion={false} trigger="click">
                    {(outer) => (
                        <Tooltip content={<span>inner</span>} motion={false} trigger="custom" visible>
                            {(inner) => <Button {...inner(outer())}>both</Button>}
                        </Tooltip>
                    )}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(document.querySelectorAll(shownSelector)).toHaveLength(2));
            fireEvent.mouseDown(screen.getByText('inner'));
            await sleep(20);
            expect(screen.getByText('outer')).toBeInTheDocument();
            clickOutside();
            await waitFor(() => expect(screen.queryByText('outer')).toBeNull());
        });
    });

    describe('非函数 children', () => {
        it('文本包进 span：tabindex=0，不设 inline-block，wrapperClassName 落在 span 上', async () => {
            render(() => (
                <Tooltip content="hint" motion={false} wrapperClassName="probe">
                    plain text
                </Tooltip>
            ));
            const span = screen.getByText('plain text');
            expect(span).toHaveClass('probe', `${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`);
            expect(span).toHaveAttribute('tabindex', '0');
            expect(span.style.display).toBe('');
            await userEvent.hover(span);
            await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());
            expect(span).toHaveAttribute('aria-describedby', popup()?.id);
        });

        it('元素 children 时 span 为 inline-block，块级子元素撑满宽度', () => {
            render(() => (
                <>
                    <Tooltip content="a">
                        <i>inline</i>
                    </Tooltip>
                    <Tooltip content="b">
                        <div style={{ display: 'block' }}>block</div>
                    </Tooltip>
                </>
            ));
            const inline = screen.getByText('inline').parentElement as HTMLElement;
            expect(inline.style.display).toBe('inline-block');
            expect(inline.style.width).toBe('');
            expect((screen.getByText('block').parentElement as HTMLElement).style.width).toBe('100%');
        });

        it('span 内有可聚焦元素时 span 为 -1 并告警一次，Tab 只停一次', async () => {
            const warned = spyWarn();
            render(() => (
                <Tooltip content="hint">
                    <Button>inside</Button>
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            expect(button.parentElement).toHaveAttribute('tabindex', '-1');
            expect(warned('focusable element')).toHaveLength(1);
            await userEvent.tab();
            expect(button).toHaveFocus();
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });

        it('多个元素子节点包进同一个 span，wrapperClassName 落在 span 上', () => {
            const warned = spyWarn();
            render(() => (
                <Tooltip content="hint" wrapperClassName="probe">
                    <Button>first</Button>
                    <Button>second</Button>
                </Tooltip>
            ));
            const span = document.querySelector('.probe') as HTMLElement;
            expect(span).toContainElement(screen.getByRole('button', { name: 'first' }));
            expect(span).toContainElement(screen.getByRole('button', { name: 'second' }));
            expect(span).toHaveAttribute('tabindex', '-1');
            expect(span.style.display).toBe('inline-block');
            expect(warned('focusable element')).toHaveLength(1);
        });

        it('子组件切换自己的顶层节点时不重新创建，内部状态保留', () => {
            const created = vi.fn<Callback>();
            function Toggle() {
                created();
                const [on, setOn] = createSignal(false);
                const [count, setCount] = createSignal(0);
                return (
                    <Show
                        when={on()}
                        fallback={
                            <button
                                onClick={() => {
                                    setCount(count() + 1);
                                    setOn(true);
                                }}
                            >
                                off
                            </button>
                        }
                    >
                        <i>on {count()}</i>
                    </Show>
                );
            }
            render(() => (
                <Tooltip content="hint">
                    <Toggle />
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'off' }));
            expect(screen.getByText('on 1').parentElement).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`);
            expect(created).toHaveBeenCalledOnce();
        });

        it('wrapWhenSpecial=false 时文本仍包 span 并能悬停显示', async () => {
            render(() => (
                <Tooltip content="hint" motion={false} wrapWhenSpecial={false}>
                    plain text
                </Tooltip>
            ));
            await userEvent.hover(screen.getByText('plain text'));
            await waitFor(() => expect(screen.getByText('hint')).toBeInTheDocument());
        });
    });

    describe('特殊触发器', () => {
        it('disabled Button 配 click：外包 span 是停靠点并带描述，Button 不接收指针且元素身份不变', async () => {
            render(() => (
                <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                    {(t) => (
                        <Button disabled {...t()}>
                            save
                        </Button>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            const span = document.querySelector('.probe') as HTMLElement;
            expect(span).toContainElement(button);
            expect(span).toHaveAttribute('tabindex', '0');
            expect(span.style.cursor).toBe('not-allowed');
            expect(span).toHaveAttribute('data-popupid');
            expect(button).not.toHaveAttribute('data-popupid');
            expect(button.style.pointerEvents).toBe('none');
            await userEvent.click(span);
            await waitFor(() => expect(shown()).not.toBeNull());
            expect(span).toHaveAttribute('aria-describedby', popup()?.id);
            expect(button).not.toHaveAttribute('aria-describedby');
        });

        it('ButtonGroup 禁用的 Button 配 click 同样包裹', () => {
            render(() => (
                <ButtonGroup disabled>
                    <Tooltip wrapperClassName="probe" content="hint" trigger="click">
                        {(t) => <Button {...t()}>save</Button>}
                    </Tooltip>
                </ButtonGroup>
            ));
            expect(document.querySelector('.probe')).toContainElement(screen.getByRole('button'));
        });

        it('loading Button 配 hover：span 为 -1，Button 带描述且是唯一停靠点', async () => {
            render(() => (
                <Tooltip wrapperClassName="probe" content="Saving" motion={false}>
                    {(t) => (
                        <Button loading {...t()}>
                            Save
                        </Button>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            const span = document.querySelector('.probe') as HTMLElement;
            expect(span).toHaveAttribute('tabindex', '-1');
            expect(span).toHaveAttribute('data-popupid');
            expect(button.style.pointerEvents).toBe('none');
            await userEvent.tab();
            expect(button).toHaveFocus();
            await waitFor(() => expect(button).toHaveAccessibleDescription('Saving'));
            expect(span).not.toHaveAttribute('aria-describedby');
            await userEvent.tab();
            expect(document.body).toHaveFocus();
        });

        it('disabled 且 loading 的 Button 配 hover 不包裹，disabled 配 hover 也不包裹', () => {
            render(() => (
                <>
                    <Tooltip wrapperClassName="probe" content="hint">
                        {(t) => (
                            <Button disabled loading {...t()}>
                                both
                            </Button>
                        )}
                    </Tooltip>
                    <Tooltip wrapperClassName="probe" content="hint">
                        {(t) => (
                            <Button disabled {...t()}>
                                disabled
                            </Button>
                        )}
                    </Tooltip>
                </>
            ));
            expect(document.querySelector('.probe')).toBeNull();
            expect(screen.getByRole('button', { name: 'disabled' })).toHaveAttribute('data-popupid');
        });

        it('custom 不包裹但设 pointer-events: none，卸载后恢复原值', () => {
            const view = render(() => (
                <Tooltip wrapperClassName="probe" content="hint" trigger="custom">
                    {(t) => (
                        <Button loading style={{ 'pointer-events': 'auto' }} {...t()}>
                            custom
                        </Button>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            expect(document.querySelector('.probe')).toBeNull();
            expect(button.style.pointerEvents).toBe('none');
            view.unmount();
            expect(button.style.pointerEvents).toBe('auto');
        });

        it('wrapWhenSpecial=false 时不包裹也不改 pointer-events', () => {
            render(() => (
                <Tooltip wrapperClassName="probe" content="hint" trigger="click" wrapWhenSpecial={false}>
                    {(t) => (
                        <Button disabled {...t()}>
                            save
                        </Button>
                    )}
                </Tooltip>
            ));
            expect(document.querySelector('.probe')).toBeNull();
            expect(screen.getByRole('button').style.pointerEvents).toBe('');
        });

        it('运行时切换 disabled：包裹出现又消失，监听随之转移，元素身份不变', async () => {
            const [disabled, setDisabled] = createSignal(false);
            render(() => (
                <Tooltip wrapperClassName="probe" content="hint" motion={false} trigger="click">
                    {(t) => (
                        <Button disabled={disabled()} {...t()}>
                            save
                        </Button>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            setDisabled(true);
            const span = document.querySelector('.probe') as HTMLElement;
            expect(span).toContainElement(screen.getByRole('button'));
            expect(screen.getByRole('button')).toBe(button);
            await userEvent.click(span);
            await waitFor(() => expect(shown()).not.toBeNull());
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());

            setDisabled(false);
            expect(document.querySelector('.probe')).toBeNull();
            expect(screen.getByRole('button')).toBe(button);
            expect(button.style.pointerEvents).toBe('');
            await userEvent.click(button);
            await waitFor(() => expect(shown()).not.toBeNull());
        });

        it('包裹期间 render 输出换了元素：span 里是新按钮，旧按钮离开文档', () => {
            const [busy, setBusy] = createSignal(false);
            render(() => (
                <Tooltip wrapperClassName="probe" content="hint" trigger="click">
                    {(t) => (
                        <Show
                            when={busy()}
                            fallback={
                                <Button disabled {...t()}>
                                    idle
                                </Button>
                            }
                        >
                            <Button disabled {...t()}>
                                busy
                            </Button>
                        </Show>
                    )}
                </Tooltip>
            ));
            const idle = screen.getByRole('button', { name: 'idle' });
            setBusy(true);
            const span = document.querySelector('.probe') as HTMLElement;
            expect(span).toContainElement(screen.getByRole('button', { name: 'busy' }));
            expect(idle).not.toBeInTheDocument();
            expect(span).toHaveTextContent(/^busy$/);
        });

        it('组合嵌套时外层先包裹、内层后包裹：按钮留在外层 span 中，不出现多余文本，内层仍能打开', async () => {
            const [status, setStatus] = createSignal<'disabled' | 'loading'>('disabled');
            render(() => (
                <Tooltip wrapperClassName="outer" content="outer" trigger="click">
                    {(outer) => (
                        <Tooltip wrapperClassName="inner" content="inner">
                            {(inner) => (
                                <Button disabled={status() === 'disabled'} loading={status() === 'loading'} {...inner(outer())}>
                                    btn
                                </Button>
                            )}
                        </Tooltip>
                    )}
                </Tooltip>
            ));
            const outerSpan = document.querySelector('.outer') as HTMLElement;
            expect(outerSpan).toContainElement(screen.getByRole('button'));
            expect(outerSpan).toHaveTextContent(/^btn$/);
            setStatus('loading');
            expect(outerSpan).toContainElement(document.querySelector('.inner') as HTMLElement);
            expect(document.querySelector('.inner')).toContainElement(screen.getByRole('button'));
            expect(outerSpan).toHaveTextContent(/^btn$/);
            await userEvent.hover(document.querySelector('.inner') as HTMLElement);
            await waitFor(() => expect(screen.getByText('inner')).toBeInTheDocument());
        });
    });

    describe('键盘', () => {
        it('触发器上的 ArrowDown 把焦点移入弹层，触发器自己的 onKeyDown 读到 defaultPrevented', async () => {
            let prevented: boolean | undefined;
            render(() => (
                <Tooltip content={<input aria-label="inside" />} motion={false} trigger="click">
                    {(t) => (
                        <button type="button" {...t({ onKeyDown: (e: KeyboardEvent) => (prevented = e.defaultPrevented) })}>
                            trigger
                        </button>
                    )}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            await screen.findByLabelText('inside');
            fireEvent.keyDown(trigger, { key: 'ArrowDown' });
            expect(screen.getByLabelText('inside')).toHaveFocus();
            expect(prevented).toBe(true);
        });

        it('弹层方向键保留输入焦点，触发器方向键进入首尾控件', async () => {
            render(() => (
                <Tooltip
                    content={
                        <>
                            <input aria-label="first" />
                            <input aria-label="last" />
                        </>
                    }
                    motion={false}
                    trigger="click"
                >
                    {(t) => (
                        <button type="button" {...t()}>
                            trigger
                        </button>
                    )}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            await screen.findByLabelText('first');
            fireEvent.keyDown(trigger, { key: 'ArrowUp' });
            expect(screen.getByLabelText('last')).toHaveFocus();
            const notPrevented = fireEvent.keyDown(screen.getByLabelText('last'), { key: 'ArrowDown' });
            expect(notPrevented).toBe(true);
            expect(screen.getByLabelText('last')).toHaveFocus();
        });

        it('Escape 先到达触发器的 onKeyDown 及其 JSX 祖先，再关闭弹层', async () => {
            const order: string[] = [];
            render(() => (
                <div role="toolbar" tabIndex={-1} onKeyDown={() => order.push('ancestor')}>
                    <Tooltip content="Content" motion={false} trigger="click" onVisibleChange={(visible) => order.push(`visible:${visible}`)}>
                        {(t) => <Button {...t({ onKeyDown: () => order.push('own') })}>esc trigger</Button>}
                    </Tooltip>
                </div>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            await waitFor(() => expect(order).toEqual(['visible:true']));
            fireEvent.keyDown(trigger, { key: 'Escape' });
            expect(order).toEqual(['visible:true', 'own', 'ancestor', 'visible:false']);
        });

        it('弹层内的组件 preventDefault 能认领 Escape', async () => {
            render(() => (
                <Tooltip content={<input aria-label="claims" onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />} motion={false} trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            const input = await screen.findByLabelText('claims');
            fireEvent.keyDown(input, { key: 'Escape' });
            await sleep(20);
            expect(shown()).not.toBeNull();
        });

        it('guardFocus 循环 Tab，returnFocusOnClose 时 Escape 把焦点交回触发器', async () => {
            render(() => (
                <Tooltip
                    closeOnEsc
                    content={
                        <>
                            <input aria-label="first" />
                            <input aria-label="last" />
                        </>
                    }
                    guardFocus
                    motion={false}
                    returnFocusOnClose
                    trigger="click"
                >
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            const last = await screen.findByLabelText('last');
            last.focus();
            fireEvent.keyDown(last, { key: 'Tab' });
            expect(screen.getByLabelText('first')).toHaveFocus();
            fireEvent.keyDown(screen.getByLabelText('first'), { key: 'Tab', shiftKey: true });
            expect(last).toHaveFocus();
            fireEvent.keyDown(last, { key: 'Escape' });
            expect(screen.getByRole('button')).toHaveFocus();
        });
    });

    describe('批处理与回调时序', () => {
        it('一次悬停只报告一次 onVisibleChange(true)', async () => {
            const onVisibleChange = vi.fn<VisibleChange>();
            render(() => (
                <Tooltip content="hint" motion={false} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>hover</Button>}
                </Tooltip>
            ));
            await userEvent.hover(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            await sleep(20);
            expect(onVisibleChange.mock.calls).toEqual([[true]]);
        });

        it('点击外部关闭时 onVisibleChange(false) 在同一批次内、DOM 更新之前调用', async () => {
            const shownAtCallback: boolean[] = [];
            render(() => (
                <Tooltip content="hint" motion={false} trigger="click" onVisibleChange={(visible) => !visible && shownAtCallback.push(Boolean(shown()))}>
                    {(t) => <Button {...t()}>click</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            clickOutside();
            expect(shownAtCallback).toEqual([true]);
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('无动效时 afterClose 晚于 onVisibleChange(false)，mouseLeaveDelay 定时器触发的关闭也是', async () => {
            const order: string[] = [];
            render(() => (
                <>
                    <Tooltip afterClose={() => order.push('click:afterClose')} content="a" motion={false} trigger="click" onVisibleChange={(visible) => order.push(`click:${visible}`)}>
                        {(t) => <Button {...t()}>click</Button>}
                    </Tooltip>
                    <Tooltip afterClose={() => order.push('hover:afterClose')} content="b" motion={false} mouseLeaveDelay={10} onVisibleChange={(visible) => order.push(`hover:${visible}${visible || shown() ? '' : ':hidden'}`)}>
                        {(t) => <Button {...t()}>hover</Button>}
                    </Tooltip>
                </>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'click' }));
            await waitFor(() => expect(order).toEqual(['click:true']));
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
            const hover = screen.getByRole('button', { name: 'hover' });
            await userEvent.hover(hover);
            await waitFor(() => expect(shown()).not.toBeNull());
            await userEvent.unhover(hover);
            await waitFor(() => expect(order).toContain('hover:afterClose'));
            expect(order).toEqual(['click:true', 'click:false', 'click:afterClose', 'hover:true', 'hover:false:hidden', 'hover:afterClose']);
        });

        it('非受控 onVisibleChange(true) 时内容已在文档中，受控时它是早于挂载的打开请求', async () => {
            const contentAtCallback: boolean[] = [];
            const [visible, setVisible] = createSignal(false);
            const record = (next: boolean) => next && contentAtCallback.push(Boolean(screen.queryByRole('textbox')));
            render(() => (
                <>
                    <Tooltip content={<input aria-label="a" />} motion={false} trigger="click" onVisibleChange={record}>
                        {(t) => <Button {...t()}>uncontrolled</Button>}
                    </Tooltip>
                    <Tooltip
                        content={<input aria-label="b" />}
                        motion={false}
                        trigger="click"
                        visible={visible()}
                        onVisibleChange={(next) => {
                            record(next);
                            setVisible(next);
                        }}
                    >
                        {(t) => <Button {...t()}>controlled</Button>}
                    </Tooltip>
                </>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
            await waitFor(() => expect(contentAtCallback).toEqual([true]));
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
            fireEvent.click(screen.getByRole('button', { name: 'controlled' }));
            await screen.findByLabelText('b');
            expect(contentAtCallback).toEqual([true, false]);
        });
    });

    describe('受控 visible', () => {
        it('visible 为 true 时 hide()、点击外部、Esc、clickToHide 与 condition 只报告，使用方关闭时不再报告', async () => {
            let tip: TooltipHandle | undefined;
            const onVisibleChange = vi.fn<VisibleChange>();
            const [visible, setVisible] = createSignal(true);
            const [condition, setCondition] = createSignal(true);
            render(() => (
                <Tooltip ref={(handle) => (tip = handle)} clickToHide condition={condition()} content="Content" motion={false} trigger="click" visible={visible()} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>controlled</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            const element = popup() as HTMLElement;

            tip?.hide();
            clickOutside();
            fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
            fireEvent.click(element);
            setCondition(false);
            await sleep(50);
            expect(element).toBeInTheDocument();
            expect(element).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
            expect(onVisibleChange.mock.calls).toEqual([[false], [false], [false], [false], [false]]);

            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            expect(onVisibleChange).toHaveBeenCalledTimes(5);
        });

        it('悬停触发且 visible 为 true 时挂载后保持显示，hide() 请求关闭后使用方回写即关闭', async () => {
            let tip: TooltipHandle | undefined;
            const onVisibleChange = vi.fn<VisibleChange>();
            const [visible, setVisible] = createSignal(true);
            render(() => (
                <Tooltip ref={(handle) => (tip = handle)} content="Content" motion={false} mouseLeaveDelay={2000} visible={visible()} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>hover controlled</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            await sleep(50);
            expect(shown()).not.toBeNull();
            tip?.hide();
            expect(onVisibleChange.mock.calls).toEqual([[false]]);
            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            expect(onVisibleChange).toHaveBeenCalledTimes(1);
        });

        it('使用方自行打开和关闭不报告', async () => {
            const onVisibleChange = vi.fn<VisibleChange>();
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <Tooltip content="Content" motion={false} trigger="click" visible={visible()} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>owner</Button>}
                </Tooltip>
            ));
            setVisible(true);
            await waitFor(() => expect(shown()).not.toBeNull());
            await sleep(50);
            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            await sleep(50);
            expect(onVisibleChange).not.toHaveBeenCalled();
        });

        it('visible 为 false 时点击只请求打开；拒绝后使用方自行开合，只报告那次请求', async () => {
            const onVisibleChange = vi.fn<VisibleChange>();
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <Tooltip content="Content" motion={false} trigger="click" visible={visible()} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>rejected</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await sleep(50);
            expect(popup()).toBeNull();
            expect(onVisibleChange.mock.calls).toEqual([[true]]);

            setVisible(true);
            await waitFor(() => expect(shown()).not.toBeNull());
            await sleep(50);
            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            await sleep(50);
            expect(onVisibleChange.mock.calls).toEqual([[true]]);
        });

        it('显式 undefined 不算受控，受控转为非受控后照常开合并报告', async () => {
            const onVisibleChange = vi.fn<VisibleChange>();
            const [visible, setVisible] = createSignal<boolean | undefined>(undefined);
            render(() => (
                <Tooltip content="Content" motion={false} trigger="click" visible={visible()} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>toggle</Button>}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());

            setVisible(true);
            await waitFor(() => expect(shown()).not.toBeNull());
            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            setVisible(undefined);
            fireEvent.click(trigger);
            await waitFor(() => expect(onVisibleChange.mock.calls).toEqual([[true], [false], [true]]));
        });
    });

    describe('生命周期', () => {
        it('showPopover 调用时弹层已在文档中；打开期间改 trigger 不重建弹层', async () => {
            const connected: boolean[] = [];
            const showPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover')?.value as (this: HTMLElement) => void;
            const spy = vi.spyOn(HTMLElement.prototype, 'showPopover').mockImplementation(function (this: HTMLElement) {
                connected.push(this.isConnected);
                showPopover.call(this);
            });
            onTestFinished(() => spy.mockRestore());
            const [trigger, setTrigger] = createSignal<TooltipProps['trigger']>('click');
            render(() => (
                <Tooltip content="hint" motion={false} trigger={trigger()}>
                    {(t) => <Button {...t()}>open</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            const element = popup();
            setTrigger('custom');
            await sleep(20);
            expect(popup()).toBe(element);
            expect(connected).toEqual([true]);
        });

        it('onOpen 在每次显示时调用，afterOpen 在进场动画结束后调用，受控与非受控相同', async () => {
            const onOpen = vi.fn<Callback>();
            const afterOpen = vi.fn<Callback>();
            const finishEnter = holdAnimation();
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <>
                    <Tooltip afterOpen={afterOpen} content="uncontrolled" trigger="click" onOpen={onOpen}>
                        {(t) => <Button {...t()}>uncontrolled</Button>}
                    </Tooltip>
                    <Tooltip afterOpen={afterOpen} content="controlled" trigger="custom" visible={visible()} onOpen={onOpen}>
                        {(t) => <Button {...t()}>controlled</Button>}
                    </Tooltip>
                </>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
            setVisible(true);
            await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(2));
            await sleep(50);
            expect(afterOpen).not.toHaveBeenCalled();
            await finishEnter();
            await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(2));
            await sleep(50);
            expect(afterOpen).toHaveBeenCalledTimes(2);
            expect(onOpen).toHaveBeenCalledTimes(2);
        });

        it('同一个 Tooltip 关闭后再打开，onOpen 再调用一次', async () => {
            const onOpen = vi.fn<Callback>();
            render(() => (
                <Tooltip content="hint" motion={false} trigger="click" onOpen={onOpen}>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(2));
        });

        it('没有进场动画时打开后即调用 afterOpen', async () => {
            const afterOpen = vi.fn<Callback>();
            render(() => (
                <Tooltip afterOpen={afterOpen} content="hint" motion={false} trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
            await sleep(20);
            expect(afterOpen).toHaveBeenCalledTimes(1);
        });

        it('自定义 showArrow 元素只创建一次，开合不重新创建', async () => {
            const created = vi.fn<Callback>();
            const Arrow = () => {
                created();
                return <i data-testid="arrow" />;
            };
            render(() => (
                <Tooltip content="hint" motion={false} showArrow={<Arrow />} trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            for (let i = 0; i < 2; i++) {
                fireEvent.click(screen.getByRole('button'));
                await waitFor(() => expect(shown()).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`));
                expect(screen.getAllByTestId('arrow')).toHaveLength(1);
                clickOutside();
                await waitFor(() => expect(popup()).toBeNull());
            }
            expect(created).toHaveBeenCalledTimes(1);
        });

        it('进场动画结束前关闭的这次打开不调 afterOpen', async () => {
            const afterOpen = vi.fn<Callback>();
            const afterClose = vi.fn<Callback>();
            const finishEnter = holdAnimation();
            render(() => (
                <Tooltip afterClose={afterClose} afterOpen={afterOpen} content="tip" trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            await sleep(20);
            clickOutside();
            await finishEnter();
            await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
            await sleep(50);
            expect(afterOpen).not.toHaveBeenCalled();
        });

        it('悬停打开后指针已离开而撤回的这次打开不调 afterOpen', async () => {
            const afterOpen = vi.fn<Callback>();
            const afterClose = vi.fn<Callback>();
            render(() => (
                <Tooltip afterClose={afterClose} afterOpen={afterOpen} content="tip" motion={false} mouseEnterDelay={0} mouseLeaveDelay={5000}>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            // the pointer is gone before handleOpened runs; the long mouseLeaveDelay keeps the leave itself from closing
            fireEvent.mouseEnter(trigger);
            await sleep(100);
            expect(afterClose).toHaveBeenCalledTimes(1);
            expect(afterOpen).not.toHaveBeenCalled();
        });

        it('打开中卸载时同步补调一次 afterClose，从未打开过的不调', async () => {
            const afterClose = vi.fn<Callback>();
            const opened = render(() => (
                <Tooltip afterClose={afterClose} content="tip" motion={false} trigger="custom" visible>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            opened.unmount();
            expect(afterClose).toHaveBeenCalledTimes(1);

            const never = render(() => (
                <Tooltip afterClose={afterClose} content="tip" trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            never.unmount();
            await sleep(0);
            expect(afterClose).toHaveBeenCalledTimes(1);
        });

        it('离场动画中卸载补调一次 afterClose，动画随后结束不再调用', async () => {
            const afterClose = vi.fn<Callback>();
            const [visible, setVisible] = createSignal(true);
            const view = render(() => (
                <Tooltip afterClose={afterClose} content="tip" trigger="custom" visible={visible()}>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            const finishLeave = holdAnimation();
            setVisible(false);
            expect(shown()).toBeNull();
            expect(popup()).not.toBeNull();
            expect(afterClose).not.toHaveBeenCalled();
            view.unmount();
            expect(afterClose).toHaveBeenCalledTimes(1);
            await finishLeave();
            expect(afterClose).toHaveBeenCalledTimes(1);
        });

        it('关闭后再卸载只调一次 afterClose', async () => {
            const afterClose = vi.fn<Callback>();
            const [visible, setVisible] = createSignal(true);
            const view = render(() => (
                <Tooltip afterClose={afterClose} content="tip" motion={false} trigger="custom" visible={visible()}>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            setVisible(false);
            await waitFor(() => expect(afterClose).toHaveBeenCalledTimes(1));
            view.unmount();
            expect(afterClose).toHaveBeenCalledTimes(1);
        });

        it('keepDOM 关闭后保留弹层，再次打开复用同一容器', async () => {
            render(() => (
                <Tooltip content={<span>kept</span>} keepDOM motion={false} trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            await waitFor(() => expect(shown()).not.toBeNull());
            const element = popup();
            clickOutside();
            await waitFor(() => expect(shown()).toBeNull());
            await sleep(20);
            expect(popup()).toBe(element);
            fireEvent.click(trigger);
            await waitFor(() => expect(shown()).not.toBeNull());
            expect(popup()).toBe(element);
        });

        it('keepDOM 的悬停提示关闭后再离开触发器，不再报告关闭', async () => {
            const onVisibleChange = vi.fn<VisibleChange>();
            render(() => (
                <Tooltip content="Content" keepDOM motion={false} mouseLeaveDelay={0} onVisibleChange={onVisibleChange}>
                    {(t) => <span {...t()}>Test</span>}
                </Tooltip>
            ));
            const trigger = screen.getByText('Test');
            await userEvent.hover(trigger);
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
            fireEvent.mouseLeave(trigger);
            await waitFor(() => expect(shown()).toBeNull());
            fireEvent.mouseLeave(trigger);
            fireEvent.focusOut(trigger);
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        it('离场动画期间再次打开，不会被旧动画的完成卸载', async () => {
            const [visible, setVisible] = createSignal(true);
            render(() => (
                <Tooltip content="tip" trigger="custom" visible={visible()}>
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            await waitFor(() => expect(shown()).not.toBeNull());
            const finish = holdAnimation();
            setVisible(false);
            expect(popup()).not.toBeNull();
            setVisible(true);
            await finish();
            await sleep(20);
            expect(shown()).not.toBeNull();
        });

        it('离场动画期间重新悬停排下的延时显示，在动画结束后仍会执行', async () => {
            render(() => (
                <Tooltip content="hint" mouseEnterDelay={150} mouseLeaveDelay={0}>
                    {(t) => <span {...t()}>Test</span>}
                </Tooltip>
            ));
            const trigger = screen.getByText('Test');
            await userEvent.hover(trigger);
            await waitFor(() => expect(shown()).not.toBeNull(), { timeout: 2000 });
            const finishLeave = holdAnimation();
            await userEvent.unhover(trigger);
            await waitFor(() => {
                expect(popup()).not.toBeNull();
                expect(shown()).toBeNull();
            });
            await userEvent.hover(trigger);
            await finishLeave();
            await waitFor(() => expect(popup()).toBeNull());
            await waitFor(() => expect(shown()).not.toBeNull(), { timeout: 2000 });
        });

        it('condition 变为 false 时隐藏已显示的弹层', async () => {
            const [condition, setCondition] = createSignal(true);
            render(() => (
                <Tooltip condition={condition()} content="hi" motion={false}>
                    {(t) => <span {...t()}>Test</span>}
                </Tooltip>
            ));
            await userEvent.hover(screen.getByText('Test'));
            await waitFor(() => expect(shown()).not.toBeNull());
            setCondition(false);
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('父组件挂载时就把 condition 改为 false，受控显示的弹层请求关闭', async () => {
            function Demo() {
                const [visible, setVisible] = createSignal(true);
                const [condition, setCondition] = createSignal(true);
                onMount(() => setCondition(false));
                return (
                    <Tooltip condition={condition()} content="hi" motion={false} trigger="custom" visible={visible()} onVisibleChange={setVisible}>
                        Test
                    </Tooltip>
                );
            }
            render(() => <Demo />);
            expect(popup()).not.toBeNull();
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('运行时把 trigger 由 hover 改为 click 后，悬停不再打开而点击打开', async () => {
            const [trigger, setTrigger] = createSignal<TooltipProps['trigger']>('hover');
            render(() => (
                <Tooltip content="hint" motion={false} trigger={trigger()}>
                    {(t) => <span {...t()}>Test</span>}
                </Tooltip>
            ));
            setTrigger('click');
            await userEvent.hover(screen.getByText('Test'));
            await sleep(200);
            expect(popup()).toBeNull();
            await userEvent.click(screen.getByText('Test'));
            await waitFor(() => expect(shown()).not.toBeNull());
        });

        it('挂载后未打开时不注册 window 的 resize 与 mousedown 监听，卸载后移除点击外部监听', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const view = render(() => (
                <Tooltip content="hint" motion={false} trigger="click">
                    {(t) => <Button {...t()}>trigger</Button>}
                </Tooltip>
            ));
            expect(add.mock.calls.filter(([type]) => type === 'resize' || type === 'mousedown')).toHaveLength(0);
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            const options = add.mock.calls.find(([type]) => type === 'mousedown')?.[2] as AddEventListenerOptions | undefined;
            const signal = options?.signal;
            expect(signal?.aborted).toBe(false);
            view.unmount();
            expect(signal?.aborted).toBe(true);
        });
    });

    describe('点击外部', () => {
        it('onClickOutSide 收到原生 MouseEvent', async () => {
            expectTypeOf<Parameters<NonNullable<TooltipProps['onClickOutSide']>>[0]>().toEqualTypeOf<MouseEvent>();
            const onClickOutSide = vi.fn<NonNullable<TooltipProps['onClickOutSide']>>();
            render(() => (
                <Tooltip content="Content" motion={false} trigger="click" onClickOutSide={onClickOutSide}>
                    {(t) => <Button {...t()}>Click here</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            fireEvent.mouseDown(document.body);
            expect(onClickOutSide).toHaveBeenCalledTimes(1);
            expect(onClickOutSide.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        });

        it('外部元素在 mousedown 中打开弹层时，这次按下不算点击外部', async () => {
            const onClickOutSide = vi.fn<NonNullable<TooltipProps['onClickOutSide']>>();
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <>
                    <button type="button" onMouseDown={() => setVisible(true)}>
                        Open
                    </button>
                    <Tooltip content="Content" motion={false} trigger="custom" visible={visible()} onClickOutSide={onClickOutSide}>
                        <span>Anchor</span>
                    </Tooltip>
                </>
            ));
            fireEvent.mouseDown(screen.getByRole('button', { name: 'Open' }));
            await waitFor(() => expect(shown()).not.toBeNull());
            expect(onClickOutSide).not.toHaveBeenCalled();
            fireEvent.mouseDown(document.body);
            expect(onClickOutSide).toHaveBeenCalledTimes(1);
        });

        it('Escape 关闭时 onEscKeyDown 收到原生 KeyboardEvent', async () => {
            const onEscKeyDown = vi.fn<NonNullable<TooltipProps['onEscKeyDown']>>();
            render(() => (
                <Tooltip content="Content" motion={false} trigger="click" onEscKeyDown={onEscKeyDown}>
                    {(t) => <Button {...t()}>Click here</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(popup()).toBeNull());
            expect(onEscKeyDown).toHaveBeenCalledTimes(1);
            expect(onEscKeyDown.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        });

        it('在触发器、弹层与内容中嵌套 Tooltip 的弹层内按下都不关闭', async () => {
            render(() => (
                <Tooltip
                    content={
                        <Tooltip content={<span>nested</span>} motion={false} trigger="custom" visible>
                            {(t) => <span {...t()}>inner trigger</span>}
                        </Tooltip>
                    }
                    motion={false}
                    trigger="click"
                >
                    {(t) => <Button {...t()}>outer</Button>}
                </Tooltip>
            ));
            const trigger = screen.getByRole('button');
            fireEvent.click(trigger);
            const nested = await screen.findByText('nested');
            const outerPopup = screen.getByText('inner trigger').closest(wrapperSelector) as HTMLElement;
            fireEvent.mouseDown(trigger);
            fireEvent.mouseDown(outerPopup);
            fireEvent.mouseDown(nested);
            await sleep(20);
            expect(outerPopup).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
            clickOutside();
            await waitFor(() => expect(outerPopup).not.toBeInTheDocument());
        });

        it('在触发器中嵌套 Tooltip 的弹层内按下不关闭外层，在外部按下关闭每一层', async () => {
            render(() => (
                <Tooltip content="outer content" motion={false} trigger="click">
                    {(t) => (
                        <span {...t()}>
                            outer trigger
                            <Tooltip content={<span>trigger nested</span>} motion={false} trigger="click">
                                {(inner) => (
                                    <button type="button" {...inner()}>
                                        inner trigger
                                    </button>
                                )}
                            </Tooltip>
                        </span>
                    )}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'inner trigger' }));
            const nested = await screen.findByText('trigger nested');
            await screen.findByText('outer content');
            fireEvent.mouseDown(nested);
            await sleep(20);
            expect(document.querySelectorAll(shownSelector)).toHaveLength(2);
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('在内容渲染的 Portal 内按下不关闭', async () => {
            render(() => (
                <Tooltip
                    content={
                        <Portal>
                            <button type="button">portaled</button>
                        </Portal>
                    }
                    motion={false}
                    trigger="click"
                >
                    {(t) => <Button {...t()}>open</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'open' }));
            fireEvent.mouseDown(await screen.findByRole('button', { name: 'portaled' }));
            await sleep(20);
            expect(shown()).not.toBeNull();
            clickOutside();
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('关闭后到离场结束前再次在外部按下，不重复报告', async () => {
            const onClickOutSide = vi.fn<NonNullable<TooltipProps['onClickOutSide']>>();
            const onVisibleChange = vi.fn<VisibleChange>();
            render(() => (
                <Tooltip content="Content" trigger="click" onClickOutSide={onClickOutSide} onVisibleChange={onVisibleChange}>
                    {(t) => <Button {...t()}>Click here</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
            holdAnimation();
            clickOutside();
            clickOutside();
            expect(onClickOutSide).toHaveBeenCalledTimes(1);
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });
    });

    describe('嵌套弹层的悬停', () => {
        it('焦点从弹层移入内容中嵌套的弹层时外层保持打开，移出两者后都关闭', async () => {
            const delays = { mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false };
            render(() => (
                <Tooltip
                    {...delays}
                    content={
                        <Tooltip {...delays} content={<button type="button">inner action</button>} trigger="focus">
                            {(t) => (
                                <button type="button" {...t()}>
                                    inner trigger
                                </button>
                            )}
                        </Tooltip>
                    }
                    trigger="focus"
                >
                    {(t) => <Button {...t()}>outer trigger</Button>}
                </Tooltip>
            ));
            screen.getByRole('button', { name: 'outer trigger' }).focus();
            const innerTrigger = await screen.findByRole('button', { name: 'inner trigger' });
            innerTrigger.focus();
            const innerAction = await screen.findByRole('button', { name: 'inner action' });
            innerAction.focus();
            await sleep(20);
            expect(document.querySelectorAll(shownSelector)).toHaveLength(2);
            innerAction.blur();
            await waitFor(() => expect(popup()).toBeNull());
        });
    });

    describe('触发器中组合的弹层', () => {
        it('指针或焦点从触发器移入它时外层照常关闭，在它上面移动也不打开外层', async () => {
            const delays = { mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false };
            render(() => (
                <Tooltip {...delays} content="outer tip">
                    {(outer) => (
                        <Tooltip {...delays} aria-label="inner panel" content={<button type="button">inner action</button>} role={dialogRole} trigger="custom" visible>
                            {(inner) => <Button {...inner(outer())}>both</Button>}
                        </Tooltip>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button', { name: 'both' });
            const innerAction = await screen.findByRole('button', { name: 'inner action' });
            const innerPopup = innerAction.closest(wrapperSelector) as HTMLElement;
            button.focus();
            await screen.findByText('outer tip');
            // past the hover check that runs a task after opening
            await sleep(20);
            expect(screen.getByText('outer tip')).toBeInTheDocument();
            innerAction.focus();
            await waitFor(() => expect(screen.queryByText('outer tip')).toBeNull());
            fireEvent.mouseEnter(innerPopup, { relatedTarget: document.body });
            await sleep(20);
            expect(screen.queryByText('outer tip')).toBeNull();
        });
    });

    describe('stopPropagation', () => {
        it('弹层内的 click、focusin、focusout、mousedown 不到达逻辑父元素的 JSX 处理函数，不设时能到达', async () => {
            const onClick = vi.fn<Callback>();
            const onFocusIn = vi.fn<Callback>();
            const onFocusOut = vi.fn<Callback>();
            const onMouseDown = vi.fn<Callback>();
            const [stop, setStop] = createSignal(true);
            render(() => (
                <div role="presentation" onClick={onClick} onFocusIn={onFocusIn} onFocusOut={onFocusOut} onMouseDown={onMouseDown}>
                    <Tooltip content={<input aria-label="inner" />} motion={false} stopPropagation={stop()} trigger="custom" visible>
                        {(t) => <span {...t()}>trigger</span>}
                    </Tooltip>
                </div>
            ));
            const input = await screen.findByLabelText('inner');
            const press = () => {
                input.focus();
                fireEvent.mouseDown(input);
                fireEvent.click(input);
                input.blur();
            };
            press();
            expect([onClick, onFocusIn, onFocusOut, onMouseDown].map((fn) => fn.mock.calls.length)).toEqual([0, 0, 0, 0]);
            setStop(false);
            press();
            expect([onClick, onFocusIn, onFocusOut, onMouseDown].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1, 1]);
        });

        it('悬停加 clickToHide 时仍阻止冒泡，且只报告一次关闭', async () => {
            const onClick = vi.fn<Callback>();
            const onFocusIn = vi.fn<Callback>();
            const onVisibleChange = vi.fn<VisibleChange>();
            render(() => (
                <div role="presentation" onClick={onClick} onFocusIn={onFocusIn}>
                    <Tooltip clickToHide content={<button type="button">inside</button>} motion={false} stopPropagation onVisibleChange={onVisibleChange}>
                        {(t) => <span {...t()}>Test</span>}
                    </Tooltip>
                </div>
            ));
            await userEvent.hover(screen.getByText('Test'));
            const inside = await screen.findByRole('button', { name: 'inside' });
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
            inside.focus();
            fireEvent.click(inside);
            await waitFor(() => expect(popup()).toBeNull());
            expect(onClick).not.toHaveBeenCalled();
            expect(onFocusIn).not.toHaveBeenCalled();
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });
    });

    describe('Handle', () => {
        it('ref 在挂载前已赋值，getPopupId 等于 data-popupid，focusTrigger、hide、rePosition 可用', async () => {
            let tip: TooltipHandle | undefined;
            let assignedBeforeMount = false;
            function Probe() {
                onMount(() => (assignedBeforeMount = Boolean(tip)));
                return null;
            }
            render(() => (
                <>
                    <Tooltip ref={(handle) => (tip = handle)} content="Content" motion={false} returnFocusOnClose trigger="click">
                        {(t) => <Button {...t()}>ref trigger</Button>}
                    </Tooltip>
                    <Probe />
                </>
            ));
            expect(assignedBeforeMount).toBe(true);
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('data-popupid', tip?.getPopupId());
            tip?.focusTrigger();
            expect(button).toHaveFocus();
            fireEvent.click(button);
            await waitFor(() => expect(shown()).not.toBeNull());
            expect(() => tip?.rePosition()).not.toThrow();
            tip?.hide();
            await waitFor(() => expect(popup()).toBeNull());
        });

        it('returnFocusOnClose 下 Escape 把焦点交回 loading Button 本身', async () => {
            render(() => (
                <Tooltip content={<input aria-label="inside" />} motion={false} returnFocusOnClose>
                    {(t) => (
                        <Button loading {...t()}>
                            Save
                        </Button>
                    )}
                </Tooltip>
            ));
            const button = screen.getByRole('button');
            await userEvent.tab();
            const input = await screen.findByLabelText('inside');
            fireEvent.keyDown(button, { key: 'ArrowDown' });
            expect(input).toHaveFocus();
            fireEvent.keyDown(input, { key: 'Escape' });
            expect(button).toHaveFocus();
        });
    });

    describe('context 与属性落点', () => {
        it('弹层内容读到新的弹层层级，触发器仍读到外层层级', async () => {
            const outer = Symbol('outer');
            const layers = new Map<string, symbol | undefined>();
            function LayerProbe(props: { name: string }) {
                const layer = usePopupLayer();
                onMount(() => layers.set(props.name, layer));
                return <span>{props.name}</span>;
            }
            render(() => (
                <PopupLayerContext.Provider value={outer}>
                    <Tooltip content={<LayerProbe name="content" />} motion={false} trigger="custom" visible>
                        {(t) => (
                            <button type="button" {...t()}>
                                <LayerProbe name="trigger" />
                            </button>
                        )}
                    </Tooltip>
                </PopupLayerContext.Provider>
            ));
            await screen.findByText('content');
            expect(layers.get('trigger')).toBe(outer);
            expect(typeof layers.get('content')).toBe('symbol');
            expect(layers.get('content')).not.toBe(outer);
        });

        it('弹层带上触发器最近的局部亮暗色类名', async () => {
            const dark = `${BASE_CLASS_PREFIX}-always-dark`;
            const light = `${BASE_CLASS_PREFIX}-always-light`;
            render(() => (
                <div class={dark}>
                    <Tooltip content="outer" trigger="custom" visible>
                        outer
                    </Tooltip>
                    <div class={light}>
                        <Tooltip content="inner" trigger="custom" visible>
                            inner
                        </Tooltip>
                    </div>
                </div>
            ));
            await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
            const outer = screen.getByRole('tooltip', { name: 'outer' });
            const inner = screen.getByRole('tooltip', { name: 'inner' });
            expect(outer).toHaveClass(dark);
            expect(outer).not.toHaveClass(light);
            expect(inner).toHaveClass(light);
            expect(inner).not.toHaveClass(dark);
        });

        it('dir 跟随 ConfigProvider，x-placement 跟随每个 position', async () => {
            render(() => (
                <ConfigProvider direction="rtl">
                    <Tooltip content="rtl" trigger="custom" visible>
                        rtl
                    </Tooltip>
                </ConfigProvider>
            ));
            expect(await screen.findByRole('tooltip')).toHaveAttribute('dir', 'rtl');
            const [position, setPosition] = createSignal<TooltipProps['position']>('top');
            render(() => (
                <Tooltip content="placed" position={position()} trigger="custom" visible>
                    placed
                </Tooltip>
            ));
            const placed = await screen.findByRole('tooltip', { name: 'placed' });
            for (const next of strings.POSITION_SET) {
                setPosition(next);
                expect(placed).toHaveAttribute('x-placement', next);
            }
        });

        it('class、对象与字符串 style 落在弹层，间距落在 top；未声明属性丢弃', async () => {
            const undeclared = { 'data-x': 'dropped' } as unknown as TooltipProps;
            render(() => (
                <>
                    <Tooltip {...undeclared} class="custom" content="object" position="bottom" spacing={{ x: 4, y: 6 }} style={{ 'background-color': 'red' }} trigger="custom" visible>
                        object
                    </Tooltip>
                    <Tooltip autoAdjustOverflow={false} content="string" position="bottom" style={stringStyle} trigger="custom" visible>
                        string
                    </Tooltip>
                </>
            ));
            const object = await screen.findByRole('tooltip', { name: 'object' });
            expect(object).toHaveClass('custom');
            expect(object.style.backgroundColor).toBe('red');
            // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing along y
            expect(object.style.top).toBe('6px');
            expect(object.querySelector('svg')?.style.color).toBe('red');
            const string = screen.getByRole('tooltip', { name: 'string' });
            expect(string.style.color).toBe('blue');
            expect(string.style.top).toBe('8px');
            expect(document.querySelector('[data-x]')).toBeNull();
        });

        it('aria-label 与 aria-labelledby 只在 role=dialog 时落到弹层，未命名的对话框告警', async () => {
            const warned = spyWarn();
            render(() => (
                <>
                    <Tooltip aria-label="ignored" content="tooltip" trigger="custom" visible>
                        tooltip
                    </Tooltip>
                    <Tooltip aria-labelledby="card-title" role={dialogRole} content={<h2 id="card-title">Card</h2>} trigger="custom" visible>
                        named
                    </Tooltip>
                    <Tooltip role={dialogRole} content="unnamed" trigger="custom" visible>
                        unnamed
                    </Tooltip>
                </>
            ));
            expect(await screen.findByRole('tooltip')).not.toHaveAttribute('aria-label');
            expect(await screen.findByRole('dialog', { name: 'Card' })).toBeInTheDocument();
            await waitFor(() => expect(warned('no accessible name')).toHaveLength(1));
        });

        it('打开后才挂载的对话框在内容插入后检查名称', async () => {
            const warned = spyWarn();
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <Tooltip aria-labelledby="late-title" role={dialogRole} content={<h2 id="late-title">Card</h2>} trigger="custom" visible={visible()}>
                    late
                </Tooltip>
            ));
            setVisible(true);
            expect(await screen.findByRole('dialog', { name: 'Card' })).toBeInTheDocument();
            await sleep(50);
            expect(warned('no accessible name')).toHaveLength(0);
        });

        it('箭头：left 用竖向路径，showArrow=false 不渲染，传 JSX 时原样渲染', async () => {
            render(() => (
                <>
                    <Tooltip content="left" position="left" trigger="custom" visible>
                        left
                    </Tooltip>
                    <Tooltip content="none" showArrow={false} trigger="custom" visible>
                        none
                    </Tooltip>
                    <Tooltip content="custom" showArrow={<i data-testid="arrow" />} trigger="custom" visible>
                        custom
                    </Tooltip>
                </>
            ));
            const left = await screen.findByRole('tooltip', { name: 'left' });
            expect(left.querySelector('svg path')).toHaveAttribute('d', 'M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z');
            const none = screen.getByRole('tooltip', { name: 'none' });
            expect(none.querySelector('svg')).toBeNull();
            expect(none).not.toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
            expect(screen.getByRole('tooltip', { name: 'custom' })).toContainElement(screen.getByTestId('arrow'));
        });

        it('弹层 id 是合法的 CSS id 选择器，wrapperId 替换它', async () => {
            render(() => (
                <>
                    <Tooltip content="generated" trigger="custom" visible>
                        generated
                    </Tooltip>
                    <Tooltip content="given content" trigger="custom" visible wrapperId="given-id">
                        given
                    </Tooltip>
                </>
            ));
            const id = (await screen.findByRole('tooltip', { name: 'generated' })).id;
            expect(document.querySelector(`#${id}`)).toHaveTextContent('generated');
            expect(screen.getByText('given')).toHaveAttribute('data-popupid', 'given-id');
            expect(document.getElementById('given-id')).toHaveTextContent('given content');
        });

        it('content 的 initialFocusRef 在弹层打开后获得焦点，[autofocus] 同样', async () => {
            render(() => (
                <>
                    <Tooltip content={(props: RenderContentProps) => <input ref={props.initialFocusRef} aria-label="initial" />} trigger="custom" visible>
                        a
                    </Tooltip>
                </>
            ));
            await waitFor(() => expect(screen.getByLabelText('initial')).toHaveFocus());
            render(() => (
                <Tooltip content={<input aria-label="auto" autofocus />} motion={false} trigger="click">
                    {(t) => <Button {...t()}>auto</Button>}
                </Tooltip>
            ));
            fireEvent.click(screen.getByRole('button', { name: 'auto' }));
            await waitFor(() => expect(screen.getByLabelText('auto')).toHaveFocus());
        });

        it('编译为访问器的 JSX content 在弹层打开时随数据更新，已有行不重建；函数体读取 signal 的函数 content 同样更新', () => {
            const [items, setItems] = createSignal(['a']);
            render(() => (
                <>
                    <Tooltip content={<For each={items()}>{(item) => <span data-testid="row">{item}</span>}</For>} trigger="custom" visible>
                        rows
                    </Tooltip>
                    <Tooltip content={(props: RenderContentProps) => (items().length > 1 ? <input ref={props.initialFocusRef} aria-label="count 2" /> : <input ref={props.initialFocusRef} aria-label="count 1" />)} trigger="custom" visible>
                        count
                    </Tooltip>
                </>
            ));
            const first = screen.getByTestId('row');
            expect(screen.getByRole('textbox', { name: 'count 1' })).toBeInTheDocument();
            setItems(['a', 'b']);
            expect(screen.getAllByTestId('row').map((row) => row.textContent)).toEqual(['a', 'b']);
            expect(screen.getAllByTestId('row')[0]).toBe(first);
            expect(screen.getByRole('textbox', { name: 'count 2' })).toBeInTheDocument();
        });

        it('悬停弹层内容里的方向键不被当作触发器的方向键', async () => {
            render(() => (
                <Tooltip
                    content={
                        <>
                            <input aria-label="first" />
                            <input aria-label="second" />
                        </>
                    }
                    motion={false}
                >
                    {(t) => <span {...t()}>Test</span>}
                </Tooltip>
            ));
            await userEvent.hover(screen.getByText('Test'));
            const second = await screen.findByLabelText('second');
            second.focus();
            expect(fireEvent.keyDown(second, { key: 'ArrowUp' })).toBe(true);
            expect(second).toHaveFocus();
        });

        it('全屏元素包含触发器或就是触发器时，弹层挂进全屏元素', async () => {
            let fullscreen: Element | null = null;
            Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
            onTestFinished(() => {
                delete (document as { fullscreenElement?: unknown }).fullscreenElement;
            });
            const [visible, setVisible] = createSignal(false);
            render(() => (
                <div data-testid="stage">
                    <Tooltip content="inner" motion={false} trigger="custom" visible={visible()}>
                        {(t) => (
                            <button type="button" {...t()}>
                                inner
                            </button>
                        )}
                    </Tooltip>
                    <Tooltip content="self" motion={false} trigger="custom" visible={visible()}>
                        {(t) => (
                            <div data-testid="self" {...t()}>
                                self
                            </div>
                        )}
                    </Tooltip>
                </div>
            ));
            fullscreen = screen.getByTestId('stage');
            setVisible(true);
            await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
            expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement?.parentElement).toBe(fullscreen);
            setVisible(false);
            await waitFor(() => expect(popup()).toBeNull());
            fullscreen = screen.getByTestId('self');
            setVisible(true);
            await waitFor(() => expect(document.querySelectorAll(wrapperSelector)).toHaveLength(2));
            expect(screen.getByRole('tooltip', { name: 'self' }).parentElement?.parentElement).toBe(fullscreen);
            expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement?.parentElement).toBe(document.body);
        });

        it('模态层打开后，之前打开的弹层标记为被覆盖，关闭后移除标记', async () => {
            render(() => (
                <Tooltip content="covered" motion={false} trigger="custom" visible>
                    covered
                </Tooltip>
            ));
            const tip = await screen.findByRole('tooltip');
            const dialog = document.createElement('div');
            document.body.append(dialog);
            const close = openLayer({ element: dialog, modal: true });
            expect(tip).toHaveAttribute('data-semi-covered');
            close();
            dialog.remove();
            expect(tip).not.toHaveAttribute('data-semi-covered');
        });
    });

    describe('全局默认值与告警', () => {
        let saved: OverrideDefaultProps | undefined;

        beforeEach(() => {
            saved = semiGlobal.config.overrideDefaultProps;
        });

        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = saved;
        });

        it('全局默认值生效，显式传值优先，全局 wrapperId 被忽略', async () => {
            // the global type omits per-instance ids; cast for an untyped app that sets one
            semiGlobal.config.overrideDefaultProps = { Tooltip: { trigger: 'custom', visible: true, position: 'bottom', wrapperId: 'popup-global' } as object };
            render(() => (
                <Tooltip content="global" position="left">
                    global
                </Tooltip>
            ));
            expect(await screen.findByRole('tooltip')).toHaveAttribute('x-placement', 'left');
            expect(document.getElementById('popup-global')).toBeNull();
        });

        it('mouseLeaveDelay 小于 mouseEnterDelay 的告警不随无关更新重复', () => {
            const warned = spyWarn();
            const [content, setContent] = createSignal('a');
            render(() => (
                <Tooltip content={content()} mouseEnterDelay={200} mouseLeaveDelay={100}>
                    Test
                </Tooltip>
            ));
            setContent('b');
            setContent('c');
            expect(warned('mouseLeaveDelay')).toHaveLength(1);
        });

        it('使用方展开信号对象时，mouseLeaveDelay 的告警不随无关属性变化重复', () => {
            const warned = spyWarn();
            const [p, setP] = createSignal<TooltipProps>({ content: 'a', mouseEnterDelay: 200, mouseLeaveDelay: 100 });
            render(() => <Tooltip {...p()}>Test</Tooltip>);
            setP((prev) => ({ ...prev, class: 'b' }));
            setP((prev) => ({ ...prev, class: 'c' }));
            expect(warned('mouseLeaveDelay')).toHaveLength(1);
        });

        it('使用方展开信号对象时，无关属性变化不关闭非受控的弹层', async () => {
            const [p, setP] = createSignal<TooltipProps>({ content: 'Content', motion: false, trigger: 'click' });
            render(() => <Tooltip {...p()}>{(t) => <Button {...t()}>Click here</Button>}</Tooltip>);
            await userEvent.click(screen.getByRole('button'));
            await waitFor(() => expect(shown()).not.toBeNull());
            setP((prev) => ({ ...prev, class: 'other' }));
            await sleep(0);
            expect(shown()).not.toBeNull();
        });
    });
});
