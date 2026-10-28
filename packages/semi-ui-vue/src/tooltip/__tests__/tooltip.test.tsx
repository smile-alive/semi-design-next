/** @jsxImportSource vue */
import { Comment, KeepAlive, defineComponent, h, nextTick, shallowRef, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { strings } from '@fibrae/semi-foundation/tooltip/constants';
import { countLiveListeners, render } from '@test/utils/vue';
import type useClickOutside from '../../_base/use-click-outside';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';
import Modal from '../../modal';
import { useTooltipDescription, type useNestedPopups } from '../context';
import type { RenderContentProps, TooltipHandle, TooltipProps } from '../interface';
import Tooltip from '../tooltip.vue';
import ChangingRoot from './fixtures/changing-root.vue';
import ChangingStyle from './fixtures/changing-style.vue';
import ClickOutsideNested from './fixtures/click-outside-nested.vue';
import Model from './fixtures/model.vue';
import Nested from './fixtures/nested.vue';
import OwnStyle from './fixtures/own-style.vue';

const wrapper = '.semi-tooltip-wrapper';
const shown = '.semi-tooltip-wrapper-show';

function renderTip(props: TooltipProps & { onAfterClose?: () => void } = {}, trigger: () => VNode | string = () => <button type="button">trigger</button>) {
    return render(Tooltip, {
        props: { motion: false, ...props },
        slots: { default: trigger, content: () => <span>content</span> },
    });
}

function holdAnimation() {
    const { promise: finished, resolve } = Promise.withResolvers<void>();
    const spy = vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished } as unknown as Animation]);
    onTestFinished(() => spy.mockRestore());
    return async () => {
        spy.mockRestore();
        resolve();
        await finished;
        await nextTick();
    };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Tooltip', () => {
    it('子组件独立换根后转移触发监听，保留用户 VNode 更新钩子', async () => {
        const updated = vi.fn<() => void>();
        renderTip({ trigger: 'click' }, () => <ChangingRoot onVnodeUpdated={[updated]} />);
        const previous = screen.getByRole('button', { name: 'replace root' }).parentElement;
        if (!previous) throw new Error('触发器根元素尚未挂载');
        await nextTick();
        updated.mockClear();
        await fireEvent.click(screen.getByRole('button', { name: 'replace root' }));
        const replacement = screen.getByRole('button', { name: 'replacement trigger' });
        expect(updated).toHaveBeenCalled();
        await fireEvent.click(previous);
        expect(screen.queryByRole('tooltip')).toBeNull();
        await fireEvent.click(replacement);
        expect(await screen.findByRole('tooltip')).toHaveTextContent('content');
    });

    it('子组件独立更新字符串 style 后保留原有触发监听', async () => {
        renderTip({ trigger: 'click' }, () => <ChangingStyle />);
        const trigger = screen.getByRole('button', { name: 'change style' }).parentElement;
        if (!trigger) throw new Error('触发器根元素尚未挂载');
        await nextTick();
        const listener = vi.spyOn(trigger, 'addEventListener');
        await fireEvent.click(screen.getByRole('button', { name: 'change style' }));
        expect(trigger.style.backgroundColor).toBe('blue');
        expect(listener).not.toHaveBeenCalled();
        await fireEvent.click(trigger);
        expect(await screen.findByRole('tooltip')).toHaveTextContent('content');
    });

    it('不包装的触发器保留调用方的内联 cursor', async () => {
        renderTip({}, () => (
            <button type="button" style={{ cursor: 'help' }}>
                trigger
            </button>
        ));
        await nextTick();
        expect(screen.getByRole('button')).toHaveStyle({ cursor: 'help' });
    });

    it('点击打开、内部点击保持打开、外部点击关闭并清理', async () => {
        const view = renderTip({ trigger: 'click' });
        await fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('content'));
        await fireEvent.mouseDown(screen.getByRole('tooltip'));
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        await fireEvent.mouseDown(document.body);
        expect(document.querySelector(wrapper)).toBeNull();
        await fireEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        view.unmount();
        await fireEvent.mouseDown(document.body);
        expect(document.querySelector(wrapper)).toBeNull();
    });

    it('visible=false 单向受控连续点击只通知，父级同值更新不漂移', async () => {
        const view = renderTip({ trigger: 'click', visible: false });
        await fireEvent.click(screen.getByRole('button'));
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector(wrapper)).toBeNull();
        expect(view.emitted()['update:visible']).toEqual([[true], [true]]);
        await view.rerender({ visible: false });
        expect(document.querySelector(wrapper)).toBeNull();
        await view.rerender({ visible: true });
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
    });

    it('visible=true 单向受控点击外部连续请求关闭但保留弹层', async () => {
        const view = renderTip({ trigger: 'click', visible: true });
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await fireEvent.mouseDown(document.body);
        await fireEvent.mouseDown(document.body);
        expect(document.querySelector(shown)).not.toBeNull();
        expect(view.emitted<[boolean]>('update:visible').filter(([value]) => value === false)).toHaveLength(2);
        await view.rerender({ visible: false });
        expect(document.querySelector(wrapper)).toBeNull();
    });

    it('visible 受控为 true 时，hide()、Esc、clickToHide 与 condition 只请求关闭，使用方关闭时不再重复通知', async () => {
        const condition = shallowRef(true);
        const visible = shallowRef(true);
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const handle = shallowRef<TooltipHandle | null>(null);
        render(() => (
            <Tooltip ref={handle} motion={false} trigger="click" clickToHide condition={condition.value} visible={visible.value} onVisibleChange={onVisibleChange}>
                {{
                    default: () => <button type="button">trigger</button>,
                    content: () => <span>content</span>,
                }}
            </Tooltip>
        ));
        const popup = await screen.findByRole('tooltip');

        handle.value?.hide();
        await fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
        await fireEvent.click(popup);
        condition.value = false;
        await nextTick();
        expect(popup).toHaveClass('semi-tooltip-wrapper-show');
        expect(onVisibleChange.mock.calls).toEqual([[false], [false], [false], [false]]);

        visible.value = false;
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        expect(onVisibleChange).toHaveBeenCalledTimes(4);
    });

    it('visible 受控时使用方自行打开和关闭弹层，不发出 update:visible 与 visibleChange', async () => {
        const view = renderTip({ trigger: 'click', visible: false });
        await view.rerender({ visible: true });
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        await view.rerender({ visible: false });
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(view.emitted()['update:visible']).toBeUndefined();
        expect(view.emitted().visibleChange).toBeUndefined();
    });

    it('使用方拒绝打开请求后自行打开再关闭，弹层照常开合，只通知那次请求', async () => {
        const view = renderTip({ trigger: 'click', visible: false });
        await fireEvent.click(screen.getByRole('button'));
        await view.rerender({ visible: false });
        expect(document.querySelector(wrapper)).toBeNull();

        await view.rerender({ visible: true });
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        await view.rerender({ visible: false });
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(view.emitted().visibleChange).toEqual([[true]]);
        expect(view.emitted()['update:visible']).toEqual([[true]]);
    });

    it('open 在弹层显示时通知一次，早于进场动画结束，受控与非受控相同', async () => {
        const finish = holdAnimation();
        const uncontrolled = renderTip({ trigger: 'click' });
        const controlled = renderTip({ trigger: 'custom', visible: false });
        await fireEvent.click(screen.getAllByRole('button')[0]);
        await controlled.rerender({ visible: true });
        await waitFor(() => expect(uncontrolled.emitted().open).toHaveLength(1));
        await waitFor(() => expect(controlled.emitted().open).toHaveLength(1));
        expect(uncontrolled.emitted().afterOpen).toBeUndefined();
        expect(controlled.emitted().afterOpen).toBeUndefined();

        await finish();
        await waitFor(() => expect(controlled.emitted().afterOpen).toHaveLength(1));
        expect(uncontrolled.emitted().open).toHaveLength(1);
        expect(controlled.emitted().open).toHaveLength(1);
    });

    it('afterOpen 在进场动画结束后通知一次，受控与非受控相同', async () => {
        const finish = holdAnimation();
        const uncontrolled = renderTip({ trigger: 'click' });
        const controlled = renderTip({ trigger: 'custom', visible: false });
        await fireEvent.click(screen.getAllByRole('button')[0]);
        await controlled.rerender({ visible: true });
        await waitFor(() => expect(document.querySelectorAll(shown)).toHaveLength(2));
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(uncontrolled.emitted().afterOpen).toBeUndefined();
        expect(controlled.emitted().afterOpen).toBeUndefined();

        await finish();
        await waitFor(() => expect(uncontrolled.emitted().afterOpen).toHaveLength(1));
        await waitFor(() => expect(controlled.emitted().afterOpen).toHaveLength(1));
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(uncontrolled.emitted().afterOpen).toHaveLength(1);
        expect(controlled.emitted().afterOpen).toHaveLength(1);
    });

    it('进场动画结束前关闭或悬停撤回的这次打开不通知 afterOpen', async () => {
        const finish = holdAnimation();
        const clicked = renderTip({ trigger: 'click' });
        await fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 20));
        await fireEvent.mouseDown(document.body);
        await finish();
        await waitFor(() => expect(clicked.emitted().afterClose).toHaveLength(1));
        clicked.unmount();

        // no real pointer is over the trigger, so handleOpened backs out
        const hovered = renderTip({ mouseEnterDelay: 0 });
        await fireEvent.mouseEnter(screen.getByRole('button'));
        await waitFor(() => expect(hovered.emitted().afterClose).toHaveLength(1));
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(clicked.emitted().afterOpen).toBeUndefined();
        expect(hovered.emitted().afterOpen).toBeUndefined();
    });

    it('悬停触发且 visible 受控为 true 时，挂载后保持显示；请求关闭后使用方回写即关闭，不再等 mouseLeaveDelay', async () => {
        const visible = shallowRef(true);
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const handle = shallowRef<TooltipHandle | null>(null);
        render(() => (
            <Tooltip ref={handle} motion={false} mouseLeaveDelay={2000} visible={visible.value} onVisibleChange={onVisibleChange}>
                {{
                    default: () => <button type="button">trigger</button>,
                    content: () => <span>content</span>,
                }}
            </Tooltip>
        ));
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(document.querySelector(shown)).not.toBeNull();

        handle.value?.hide();
        expect(onVisibleChange.mock.calls).toEqual([[false]]);
        visible.value = false;
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('触发元素以 aria-describedby=null 退出时，内部后代经 useTooltipDescription 指向弹层，且不泄漏到内层 Tooltip 与弹层内容', async () => {
        const Described = defineComponent({
            props: { testId: { type: String, required: true } },
            setup(props) {
                const description = useTooltipDescription();
                return () => (
                    <span aria-describedby={description?.value} data-testid={props.testId}>
                        {props.testId}
                    </span>
                );
            },
        });
        render(() => (
            <Tooltip motion={false} trigger="custom" visible>
                {{
                    default: () => (
                        // null (not undefined) is the opt-out signal under test, which the attribute type does not allow
                        <span aria-describedby={null as never} data-testid="outer-trigger">
                            <Described testId="described" />
                            <Tooltip motion={false} trigger="custom" visible>
                                {{
                                    default: () => (
                                        <span>
                                            <Described testId="in-inner-trigger" />
                                        </span>
                                    ),
                                    content: () => <Described testId="in-inner-content" />,
                                }}
                            </Tooltip>
                        </span>
                    ),
                    content: () => <Described testId="in-content" />,
                }}
            </Tooltip>
        ));
        await screen.findByTestId('in-content');
        await screen.findByTestId('in-inner-content');
        const popupId = screen.getByTestId('outer-trigger').getAttribute('data-popupid');
        await waitFor(() => expect(screen.getByTestId('described')).toHaveAttribute('aria-describedby', popupId));
        expect(screen.getByTestId('outer-trigger')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('in-inner-trigger')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('in-content')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('in-inner-content')).not.toHaveAttribute('aria-describedby');
    });

    it('useClickOutside 接入 useNestedPopups 后，在子孙 Popover 的弹层内按下鼠标不算外部', async () => {
        const onOutside = vi.fn<() => void>();
        render(ClickOutsideNested, { props: { onOutside } });
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(onOutside).not.toHaveBeenCalled();
        await fireEvent.mouseDown(document.body);
        expect(onOutside).toHaveBeenCalledTimes(1);
        expectTypeOf<ReturnType<typeof useNestedPopups>>().toExtend<NonNullable<Parameters<typeof useClickOutside>[3]>>();
    });

    it('visible 回到 undefined 后可继续非受控更新并发出新通知', async () => {
        const view = renderTip({ trigger: 'click', visible: false });
        await fireEvent.click(screen.getByRole('button'));
        await view.rerender({ visible: undefined });
        await fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(view.emitted().visibleChange).toEqual([[true], [true]]));
        await fireEvent.mouseDown(document.body);
        expect(document.querySelector(wrapper)).toBeNull();
    });

    it('v-model 接受更新后仍能反复切换，四个 expose 可调用', async () => {
        render(Model);
        await nextTick();
        const trigger = screen.getByRole('button', { name: 'trigger' });
        expect(trigger).toHaveAttribute('data-popupid', screen.getByRole('status').textContent);
        await fireEvent.click(trigger);
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
        expect(screen.getByTestId('changes')).toHaveTextContent('1');
        await fireEvent.click(trigger);
        expect(document.querySelector(wrapper)).toBeNull();
        expect(screen.getByTestId('changes')).toHaveTextContent('2');
        await fireEvent.click(trigger);
        await fireEvent.click(screen.getByRole('button', { name: 'hide' }));
        expect(document.querySelector(wrapper)).toBeNull();
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(trigger).toHaveFocus();
        await fireEvent.click(screen.getByRole('button', { name: 'position' }));
    });

    it('class/style 只落弹层，其余未声明属性丢弃', async () => {
        render(Tooltip, {
            props: { trigger: 'custom', visible: true },
            attrs: { class: 'custom', style: { backgroundColor: 'red' }, 'data-unknown': 'discarded' },
            slots: { default: () => <button>trigger</button>, content: () => 'content' },
        });
        const popup = await screen.findByRole('tooltip');
        expect(popup).toHaveClass('custom');
        expect(popup.style.backgroundColor).toBe('red');
        expect(document.querySelector('[data-unknown]')).toBeNull();
        expect(screen.getByRole('button')).not.toHaveClass('custom');
    });

    it('对话框可访问名称用声明 prop 接收，ARIA 仅落弹层', async () => {
        const view = render(Tooltip, {
            props: { role: 'dialog', trigger: 'custom', visible: true },
            attrs: { 'aria-label': 'Details' },
            slots: {
                default: () => <button>trigger</button>,
                content: () => <h2 id="details-heading">Heading</h2>,
            },
        });
        expect(await screen.findByRole('dialog', { name: 'Details' })).toHaveAttribute('aria-label', 'Details');
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
        await view.rerender({ ariaLabelledby: 'details-heading' });
        expect(screen.getByRole('dialog', { name: 'Heading' })).toHaveAttribute('aria-labelledby', 'details-heading');
        expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('ariaDescribedby 只在 role=dialog 时落弹层', async () => {
        const view = renderTip({
            role: 'dialog',
            ariaLabel: 'Details',
            ariaDescribedby: 'note',
            trigger: 'custom',
            visible: true,
        });
        expect(await screen.findByRole('dialog')).toHaveAttribute('aria-describedby', 'note');
        await view.rerender({ role: 'tooltip' });
        expect(screen.getByRole('tooltip')).not.toHaveAttribute('aria-describedby');
    });

    it.each(strings.POSITION_SET)('position=%s 保留位置属性及箭头方向', async (position) => {
        renderTip({ position, trigger: 'custom', visible: true });
        const popup = await screen.findByRole('tooltip');
        expect(popup).toHaveAttribute('x-placement', position);
        expect(popup.querySelector('svg')).toHaveAttribute('width', position.includes('left') || position.includes('right') ? '7' : '24');
    });

    it('arrow 插槽替换箭头，showArrow=false 不渲染箭头', async () => {
        const view = render(Tooltip, {
            props: { visible: true, trigger: 'custom' },
            slots: { default: () => <button>trigger</button>, arrow: () => <span>arrow</span> },
        });
        expect(await screen.findByText('arrow')).toBeInTheDocument();
        await view.rerender({ showArrow: false });
        expect(screen.queryByText('arrow')).toBeNull();
    });

    it('clickOutSide 与 escKeyDown 收到原生事件', async () => {
        const view = renderTip({ trigger: 'click', closeOnEsc: true });
        await fireEvent.click(screen.getByRole('button'));
        await fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
        expect(view.emitted<[KeyboardEvent]>('escKeyDown')[0][0]).toBeInstanceOf(KeyboardEvent);
        await fireEvent.click(screen.getByRole('button'));
        await fireEvent.mouseDown(document.body);
        expect(view.emitted<[MouseEvent]>('clickOutSide')[0][0]).toBeInstanceOf(MouseEvent);
        expect(view.emitted<[MouseEvent]>('clickOutSide')[0][0]).not.toHaveProperty('nativeEvent');
    });

    it('子节点属性优先，keydown 在自身处理前执行并保留原 ref', async () => {
        const own = vi.fn<(event: KeyboardEvent) => void>();
        const reference = vi.fn<(element: unknown) => void>();
        render(Tooltip, {
            props: { trigger: 'click', motion: false },
            slots: {
                default: () => (
                    <button ref={reference} aria-describedby="own" tabindex={-1} onKeydown={own}>
                        trigger
                    </button>
                ),
                content: () => <input aria-label="inside" />,
            },
        });
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-describedby', 'own');
        expect(trigger).toHaveAttribute('tabindex', '-1');
        expect(reference).toHaveBeenCalledWith(trigger, expect.anything());
        await fireEvent.click(trigger);
        await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(own.mock.calls[0][0].defaultPrevented).toBe(true);
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('Escape 到达触发器自身与 DOM 祖先', async () => {
        const own = vi.fn<(event: KeyboardEvent) => void>();
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        render(Tooltip, {
            slots: {
                default: () => (
                    <div onKeydown={ancestor}>
                        <button onKeydown={own}>trigger</button>
                    </div>
                ),
            },
        });
        await userEvent.click(screen.getByRole('button'));
        await userEvent.keyboard('{Escape}');
        expect(own).toHaveBeenCalledOnce();
        expect(ancestor).toHaveBeenCalledOnce();
    });

    it('生成可作为 CSS 选择器的唯一 id', () => {
        renderTip();
        const first = screen.getByRole('button').getAttribute('data-popupid');
        expect(first).toMatch(/^semi-tooltip-/);
        renderTip();
        const second = screen.getAllByRole('button')[1].getAttribute('data-popupid');
        expect(first).not.toBe(second);
        expect(() => document.querySelector(`#${first}`)).not.toThrow();
    });

    it('aria-describedby 只在浮层节点存在时输出，condition 为 false 时不输出', async () => {
        const view = renderTip({ trigger: 'click' });
        const trigger = screen.getByRole('button');
        expect(trigger).not.toHaveAttribute('aria-describedby');
        await fireEvent.click(trigger);
        expect(trigger).toHaveAccessibleDescription('content');
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        expect(trigger).not.toHaveAttribute('aria-describedby');
        await view.rerender({ condition: false });
        await fireEvent.click(trigger);
        expect(document.querySelector(wrapper)).toBeNull();
        expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    it('role=dialog 的 aria-controls 只在浮层节点存在时输出，keepDOM 时关闭后保留', async () => {
        const view = renderTip({ role: 'dialog', ariaLabel: 'Details', trigger: 'click' });
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger).not.toHaveAttribute('aria-controls');
        await fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-controls', (await screen.findByRole('dialog')).id);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        expect(trigger).not.toHaveAttribute('aria-controls');
        await view.rerender({ keepDOM: true });
        await fireEvent.click(trigger);
        const popup = await screen.findByRole('dialog');
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        expect(popup).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-controls', popup.id);
    });

    it('condition=false 阻止打开并关闭已显示的弹层', async () => {
        const view = renderTip({ trigger: 'click', condition: false });
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector(wrapper)).toBeNull();
        await view.rerender({ condition: true });
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector(shown)).not.toBeNull();
        await view.rerender({ condition: false });
        expect(document.querySelector(wrapper)).toBeNull();
    });

    it('弹层方向键保留输入焦点，触发器方向键进入首尾控件', async () => {
        render(Tooltip, {
            props: { trigger: 'click', motion: false },
            slots: {
                default: () => <button>trigger</button>,
                content: () => (
                    <>
                        <input aria-label="first" />
                        <input aria-label="last" />
                    </>
                ),
            },
        });
        const trigger = screen.getByRole('button');
        await fireEvent.click(trigger);
        await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        expect(screen.getByLabelText('first')).toHaveFocus();
        await fireEvent.keyDown(trigger, { key: 'ArrowUp' });
        expect(screen.getByLabelText('last')).toHaveFocus();
        await fireEvent.keyDown(screen.getByLabelText('last'), { key: 'ArrowDown' });
        expect(screen.getByLabelText('last')).toHaveFocus();
    });

    it('guardFocus 循环 Tab，Escape 返回触发器', async () => {
        render(Tooltip, {
            props: { trigger: 'click', motion: false, guardFocus: true, closeOnEsc: true, returnFocusOnClose: true },
            slots: {
                default: () => <button>trigger</button>,
                content: () => (
                    <>
                        <input aria-label="first" />
                        <input aria-label="last" />
                    </>
                ),
            },
        });
        await fireEvent.click(screen.getByRole('button'));
        screen.getByLabelText('last').focus();
        await fireEvent.keyDown(screen.getByLabelText('last'), { key: 'Tab' });
        expect(screen.getByLabelText('first')).toHaveFocus();
        await fireEvent.keyDown(screen.getByLabelText('first'), { key: 'Tab', shiftKey: true });
        expect(screen.getByLabelText('last')).toHaveFocus();
        await fireEvent.keyDown(screen.getByLabelText('last'), { key: 'Escape' });
        expect(screen.getByRole('button')).toHaveFocus();
    });

    it('content 初始焦点 ref 在弹层打开后生效', async () => {
        render(Tooltip, {
            props: { trigger: 'custom', visible: true },
            slots: {
                default: () => <button>trigger</button>,
                content: ({ initialFocusRef }: RenderContentProps) => <input ref={initialFocusRef} aria-label="initial" />,
            },
        });
        await waitFor(() => expect(screen.getByLabelText('initial')).toHaveFocus());
    });

    it('stopPropagation 阻止原生 focus/blur 事件到达 document', async () => {
        const focus = vi.fn<(event: Event) => void>();
        const blur = vi.fn<(event: Event) => void>();
        document.addEventListener('focusin', focus);
        document.addEventListener('focusout', blur);
        try {
            const view = render(Tooltip, {
                props: { trigger: 'custom', visible: true, stopPropagation: true },
                slots: { default: () => <button>trigger</button>, content: () => <input aria-label="inside" /> },
            });
            const input = await screen.findByRole('textbox');
            input.focus();
            input.blur();
            expect(focus).not.toHaveBeenCalled();
            expect(blur).not.toHaveBeenCalled();
            await view.rerender({ stopPropagation: false });
            input.focus();
            input.blur();
            expect(focus).toHaveBeenCalledOnce();
            expect(blur).toHaveBeenCalledOnce();
        } finally {
            document.removeEventListener('focusin', focus);
            document.removeEventListener('focusout', blur);
        }
    });

    it('离场动画期间再次打开不被旧动画完成卸载', async () => {
        const view = renderTip({ trigger: 'custom', visible: true });
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        const finish = holdAnimation();
        await view.rerender({ visible: false });
        expect(document.querySelector(wrapper)).not.toBeNull();
        await view.rerender({ visible: true });
        await finish();
        expect(document.querySelector(shown)).not.toBeNull();
    });

    it('离场动画完成仍保留重新悬停排下的延迟打开', async () => {
        renderTip({ mouseEnterDelay: 100, mouseLeaveDelay: 0 });
        const trigger = screen.getByRole('button');
        await userEvent.hover(trigger);
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        const finish = holdAnimation();
        await userEvent.unhover(trigger);
        await waitFor(() => expect(document.querySelector(shown)).toBeNull());
        await userEvent.hover(trigger);
        await finish();
        expect(document.querySelector(wrapper)).toBeNull();
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
    });

    it('跳过注释并展开 Fragment，单个子节点直接接收触发属性', async () => {
        const ownRef = vi.fn<(element: unknown) => void>();
        renderTip({ trigger: 'click' }, () => (
            <>
                {h(Comment)}
                <>
                    <button ref={ownRef}>trigger</button>
                </>
            </>
        ));
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-popupid');
        expect(button.parentElement).not.toHaveClass('semi-tooltip-trigger-wrapper');
        expect(ownRef).toHaveBeenCalledWith(button, expect.anything());
        await fireEvent.click(button);
        expect(screen.getByRole('tooltip')).toHaveTextContent('content');
    });

    it('文本始终可触发，wrapWhenSpecial=false 不影响文本', async () => {
        renderTip({ trigger: 'click', wrapWhenSpecial: false }, () => 'plain text');
        await fireEvent.click(screen.getByText('plain text'));
        expect(screen.getByRole('tooltip')).toHaveTextContent('content');
    });

    it('组件触发器无需转发事件或 ref', async () => {
        renderTip({ trigger: 'click' }, () => <OwnStyle />);
        await fireEvent.click(screen.getByText('own style'));
        expect(screen.getByRole('tooltip')).toHaveTextContent('content');
    });

    it('trigger 改变后移除旧事件', async () => {
        const view = renderTip({ trigger: 'click' });
        await view.rerender({ trigger: 'custom' });
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector(wrapper)).toBeNull();
        await view.rerender({ trigger: 'click' });
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector(shown)).not.toBeNull();
    });

    it('未打开不注册 resize，卸载清理点击外部监听', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const remove = vi.spyOn(window, 'removeEventListener');
        const view = renderTip({ trigger: 'click' });
        expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
        await fireEvent.click(screen.getByRole('button'));
        view.unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        add.mockRestore();
        remove.mockRestore();
    });

    it('最近局部亮暗色带到弹层', async () => {
        const host = document.createElement('div');
        host.className = 'semi-always-dark';
        document.body.append(host);
        const view = render(Tooltip, {
            container: host,
            props: { trigger: 'custom', visible: true },
            slots: { default: () => <button>trigger</button> },
        });
        expect(await screen.findByRole('tooltip')).toHaveClass('semi-always-dark');
        view.unmount();
        host.remove();
    });

    it('延迟配置警告不随无关重渲染重复', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const view = renderTip({ mouseEnterDelay: 200, mouseLeaveDelay: 100 });
        await view.rerender({ wrapperId: 'updated' });
        expect(warn.mock.calls.filter(([message]) => String(message).includes('mouseLeaveDelay'))).toHaveLength(1);
        warn.mockRestore();
    });

    it('禁用 click 包裹、禁用 hover 不包裹，block wrapper 占满宽度', async () => {
        const view = renderTip({ trigger: 'click', wrapperClassName: 'wrapper' }, () => (
            <button disabled style={{ display: 'block' }}>
                disabled
            </button>
        ));
        expect(screen.getByRole('button').parentElement).toHaveClass('wrapper');
        expect(screen.getByRole('button').parentElement).toHaveStyle({ width: '100%' });
        await fireEvent.click(screen.getByRole('button').parentElement as HTMLElement);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        view.unmount();
        renderTip({ wrapperClassName: 'wrapper' }, () => <button disabled>disabled</button>);
        expect(document.querySelector('.wrapper')).toBeNull();
    });

    it('loading Button 的包装只有一个 Tab 停靠点且描述在按钮', async () => {
        renderTip({ trigger: 'click', wrapperClassName: 'loading-wrapper' }, () => <Button loading />);
        const button = screen.getByRole('button');
        await fireEvent.click(button.parentElement as HTMLElement);
        expect(button).toHaveAccessibleDescription('content');
        expect(button.parentElement).toHaveAttribute('tabindex', '-1');
        expect(button.parentElement).not.toHaveAttribute('aria-describedby');
        await userEvent.tab();
        expect(button).toHaveFocus();
    });

    it('role=dialog 不给角色不在白名单内的子节点加 aria-haspopup 与 aria-expanded', () => {
        const childRole = 'img';
        renderTip({ role: 'dialog', ariaLabel: 'Details', trigger: 'click' }, () => <span aria-label="icon" role={childRole} tabindex={0} />);
        const trigger = screen.getByRole('img');
        expect(trigger).not.toHaveAttribute('aria-haspopup');
        expect(trigger).not.toHaveAttribute('aria-expanded');
    });

    it('disabled 且 loading 的 Button 在 hover 触发时不加包裹元素', () => {
        renderTip({ wrapperClassName: 'wrapper' }, () => <Button disabled loading />);
        expect(document.querySelector('.wrapper')).toBeNull();
    });

    it('后代 Teleport 点击不关闭祖先，Escape 每次只关顶层', async () => {
        render(Nested);
        await fireEvent.click(screen.getByRole('button', { name: 'outer' }));
        await fireEvent.click(screen.getByRole('button', { name: 'inner' }));
        await fireEvent.mouseDown(screen.getByRole('button', { name: 'action' }));
        expect(screen.getAllByRole('tooltip')).toHaveLength(2);
        await fireEvent.keyDown(screen.getByRole('button', { name: 'action' }), { key: 'Escape' });
        expect(screen.getAllByRole('tooltip')).toHaveLength(1);
        await fireEvent.keyDown(screen.getByRole('button', { name: 'inner' }), { key: 'Escape' });
        expect(document.querySelector(wrapper)).toBeNull();
    });

    it('KeepAlive 失活时关闭弹层并通知', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => (
                <Tooltip trigger="click" motion={false} onVisibleChange={onVisibleChange}>
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => 'content',
                    }}
                </Tooltip>
            ),
        });
        const cached = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [cached.value ? <Cached /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await fireEvent.click(screen.getByRole('button'));
        await screen.findByRole('tooltip');
        cached.value = false;
        await nextTick();
        expect(document.querySelector(wrapper)).toBeNull();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('KeepAlive 失活时单向绑定 visible 为 true 的弹层随缓存子树移出页面，激活后回到页面', async () => {
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => (
                <Tooltip trigger="click" motion={false} visible>
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => 'content',
                    }}
                </Tooltip>
            ),
        });
        const cached = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [cached.value ? <Cached /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await screen.findByRole('tooltip');
        cached.value = false;
        await nextTick();
        await nextTick();
        expect(document.querySelector(wrapper)).toBeNull();

        cached.value = true;
        await nextTick();
        await nextTick();
        expect(document.body.querySelector(shown)).toBeInTheDocument();
    });

    it('keepDOM 关闭保留内容，再次打开可复用', async () => {
        const view = renderTip({ trigger: 'custom', visible: true, keepDOM: true });
        const popup = await screen.findByRole('tooltip');
        await view.rerender({ visible: false });
        expect(document.querySelector(wrapper)).toBe(popup);
        expect(popup).not.toHaveClass('semi-tooltip-wrapper-show');
        await view.rerender({ visible: true });
        expect(document.querySelector(shown)).toBe(popup);
    });

    it('全屏元素包含触发器或就是触发器时，弹层挂进全屏元素', async () => {
        let fullscreen: Element | null = null;
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
        onTestFinished(() => {
            delete (document as { fullscreenElement?: unknown }).fullscreenElement;
        });
        const visible = shallowRef(false);
        const tip = (name: string, trigger: () => VNode) => (
            <Tooltip motion={false} trigger="custom" visible={visible.value}>
                {{ default: trigger, content: () => name }}
            </Tooltip>
        );
        render(() => (
            <div data-testid="stage">
                {tip('inner', () => (
                    <button type="button">inner</button>
                ))}
                {tip('self', () => (
                    <div data-testid="self">self</div>
                ))}
            </div>
        ));
        fullscreen = screen.getByTestId('stage');
        visible.value = true;
        await waitFor(() => expect(document.querySelectorAll(wrapper)).toHaveLength(2));
        expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement).toBe(fullscreen);
        visible.value = false;
        await waitFor(() => expect(document.querySelector(wrapper)).toBeNull());
        fullscreen = screen.getByTestId('self');
        visible.value = true;
        await waitFor(() => expect(document.querySelectorAll(wrapper)).toHaveLength(2));
        expect(screen.getByRole('tooltip', { name: 'self' }).parentElement).toBe(fullscreen);
        expect(screen.getByRole('tooltip', { name: 'inner' }).parentElement).toBe(document.body);
    });

    it('非受控打开的 visibleChange(true) 与父级驱动打开的 afterOpen 时弹层内容已在文档中', async () => {
        const inDocument: boolean[] = [];
        const record = (name: string) => () => inDocument.push(Boolean(screen.queryByRole('textbox', { name })));
        const content = (name: string) => ({
            default: () => <button type="button">{name}</button>,
            content: () => <input aria-label={name} />,
        });
        const visible = shallowRef(false);
        render(() => (
            <div>
                <Tooltip motion={false} trigger="click" onVisibleChange={(next: boolean) => next && record('uncontrolled')()}>
                    {content('uncontrolled')}
                </Tooltip>
                <Tooltip motion={false} trigger="custom" visible={visible.value} onAfterOpen={record('custom')}>
                    {content('custom')}
                </Tooltip>
            </div>
        ));
        await fireEvent.click(screen.getByRole('button', { name: 'uncontrolled' }));
        await waitFor(() => expect(inDocument).toEqual([true]));
        visible.value = true;
        await waitFor(() => expect(inDocument).toEqual([true, true]));
    });

    it('role=dialog 的 aria-labelledby 指向内容里的标题时不告警，没有名称时仍告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        onTestFinished(() => warn.mockRestore());
        const unnamed = () => warn.mock.calls.filter(([message]) => String(message).includes('no accessible name'));
        const dialog = (props: TooltipProps) =>
            render(Tooltip, {
                props: { motion: false, role: 'dialog', trigger: 'click', ...props },
                slots: {
                    default: () => <button type="button">trigger</button>,
                    content: () => <h2 id="card-title">Card</h2>,
                },
            });
        const named = dialog({ ariaLabelledby: 'card-title' });
        await fireEvent.click(screen.getByRole('button'));
        await screen.findByRole('dialog', { name: 'Card' });
        await nextTick();
        expect(unnamed()).toHaveLength(0);
        named.unmount();
        dialog({});
        await fireEvent.click(screen.getByRole('button'));
        await screen.findByRole('dialog');
        await waitFor(() => expect(unnamed()).toHaveLength(1));
    });

    it('全局默认值及显式传值优先级', async () => {
        semiGlobal.config = {
            overrideDefaultProps: { Tooltip: { trigger: 'custom', visible: true, position: 'bottom' } },
        };
        renderTip({ position: 'left' });
        expect(await screen.findByRole('tooltip')).toHaveAttribute('x-placement', 'left');
    });

    it('全局默认值里的 wrapperId 不影响 Tooltip', async () => {
        // the global type omits per-instance ids; cast for an untyped app that sets one
        semiGlobal.config = { overrideDefaultProps: { Tooltip: { wrapperId: 'popup-global' } } as object };
        renderTip({ trigger: 'custom', visible: true });
        await screen.findByRole('tooltip');
        expect(document.getElementById('popup-global')).toBeNull();
    });

    it('关闭后到离场结束前再次在外部按下，不重复发出 clickOutSide 与关闭', async () => {
        const view = renderTip({ trigger: 'click', motion: true });
        await fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(view.emitted().visibleChange).toEqual([[true]]));
        holdAnimation();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await nextTick();
        expect(view.emitted().clickOutSide).toHaveLength(1);
        expect(view.emitted().visibleChange).toEqual([[true], [false]]);
    });

    it('keepDOM 的悬停提示关闭后再离开触发器，不再发出关闭', async () => {
        const view = renderTip({ keepDOM: true, mouseEnterDelay: 0, mouseLeaveDelay: 0 });
        const trigger = screen.getByRole('button');
        await userEvent.hover(trigger);
        await waitFor(() => expect(view.emitted().visibleChange).toEqual([[true]]));
        await userEvent.unhover(trigger);
        await waitFor(() => expect(document.querySelector(shown)).toBeNull());
        await fireEvent.mouseLeave(trigger);
        await fireEvent.focusOut(trigger);
        expect(view.emitted().visibleChange).toEqual([[true], [false]]);
    });

    it('默认在 Modal 内按 Escape 关闭聚焦打开的提示，Modal 保持打开', async () => {
        const view = render(Modal, {
            props: { motion: false, title: 'Dialog', visible: true },
            slots: {
                default: () => (
                    <Tooltip motion={false}>
                        {{
                            default: () => <button type="button">hint</button>,
                            content: () => 'Content',
                        }}
                    </Tooltip>
                ),
            },
        });
        const trigger = await screen.findByRole('button', { name: 'hint' });
        trigger.focus();
        await waitFor(() => expect(document.querySelector(shown)).not.toBeNull());
        await fireEvent.keyDown(trigger, { key: 'Escape' });
        await waitFor(() => expect(document.querySelector(shown)).toBeNull());
        expect(view.emitted().cancel).toBeUndefined();
    });

    it('触发器自带的 aria-describedby 与提示的 id 合并', async () => {
        renderTip({ trigger: 'custom', visible: true }, () => (
            <button aria-describedby="own" type="button">
                merged
            </button>
        ));
        const popup = await screen.findByRole('tooltip');
        expect(screen.getByRole('button', { name: 'merged' })).toHaveAttribute('aria-describedby', `own ${popup.id}`);
    });

    it.each(['open', 'leaving', 'closed', 'never'] as const)('%s 卸载的 afterClose 仅通知一次', async (phase) => {
        const afterClose = vi.fn<() => void>();
        const view = renderTip({ trigger: 'custom', visible: phase !== 'never', onAfterClose: afterClose });
        await nextTick();
        let finish: (() => Promise<void>) | undefined;
        if (phase === 'leaving') finish = holdAnimation();
        if (phase === 'leaving' || phase === 'closed') await view.rerender({ visible: false });
        await nextTick();
        view.unmount();
        await nextTick();
        await finish?.();
        expect(afterClose).toHaveBeenCalledTimes(phase === 'never' ? 0 : 1);
    });
});
