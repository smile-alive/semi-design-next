/** @jsxImportSource vue */
import { type CSSProperties, KeepAlive, defineComponent, nextTick, ref } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { IconHelpCircle } from '@fibrae/semi-icons-vue';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Button from '../../button';
import Modal from '../../modal';
import Popover from '../../popover';
import Switch from '../../switch';
import type { Position, RenderContentProps, TooltipProps } from '../interface';
import Tooltip from '../tooltip.vue';
import ChangingRoot from './fixtures/changing-root.vue';
import DoubleAnchor from './fixtures/double-anchor.vue';
import Model from './fixtures/model.vue';
import Nested from './fixtures/nested.vue';
import OwnStyle from './fixtures/own-style.vue';
import Portal from './fixtures/portal.vue';

// The margin keeps a centered popup clear of the viewport edge, where the flip to the opposite side would shift it.
function renderTip(props: TooltipProps = {}, style?: CSSProperties) {
    return render(Tooltip, {
        props,
        slots: {
            default: () => (
                <button type="button" style={style}>
                    trigger
                </button>
            ),
            content: () => 'content',
        },
    });
}

function popup() {
    const element = document.querySelector<HTMLElement>('.semi-tooltip-wrapper');
    if (!element) throw new Error('Tooltip 尚未挂载');
    return element;
}

async function settled() {
    await waitFor(() => expect(popup().getAnimations()).toHaveLength(0));
}

function center(element: Element) {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
}

afterEach(async () => {
    await page.viewport(1000, 660);
    window.scrollTo(0, 0);
});

describe('Tooltip 浏览器', () => {
    it('子组件独立换根后点击新根并以新根定位', async () => {
        render(Tooltip, {
            props: { trigger: 'click', motion: false },
            slots: { default: () => <ChangingRoot />, content: () => 'content' },
        });
        const previous = screen.getByRole('button', { name: 'replace root' }).parentElement;
        if (!previous) throw new Error('触发器根元素尚未挂载');
        await userEvent.click(screen.getByRole('button', { name: 'replace root' }));
        const replacement = screen.getByRole('button', { name: 'replacement trigger' });
        await userEvent.click(replacement);
        await expect.element(await screen.findByRole('tooltip')).toBeVisible();
        expect(Math.abs(center(popup()) - center(replacement))).toBeLessThan(1);
    });

    it('悬停显示并在离开后卸载', async () => {
        renderTip();
        await userEvent.hover(screen.getByRole('button'));
        await expect.element(await screen.findByRole('tooltip')).toBeVisible();
        await userEvent.unhover(screen.getByRole('button'));
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    });

    it('禁用 hover 触发器可悬停，click 触发器包装可点击', async () => {
        const view = render(Tooltip, {
            props: { motion: false },
            slots: { default: () => <button disabled>disabled</button>, content: () => 'content' },
        });
        await userEvent.hover(screen.getByRole('button'), { force: true });
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
        view.unmount();
        render(Tooltip, {
            props: { trigger: 'click', motion: false },
            slots: { default: () => <button disabled>disabled</button>, content: () => 'content' },
        });
        await userEvent.click(screen.getByRole('button'), { force: true });
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
    });

    it.each(['hover', 'focus'] as const)('%s 键盘打开后焦点移入内容保持打开', async (trigger) => {
        render(Tooltip, {
            props: { trigger, motion: false },
            slots: { default: () => <button>trigger</button>, content: () => <input aria-label="inside" /> },
        });
        screen.getByRole('button').focus();
        const input = await screen.findByRole('textbox');
        input.focus();
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(screen.getByRole('tooltip')).toBeVisible();
        expect(input).toHaveFocus();
    });

    it.each([
        ['click', true],
        ['click', false],
        ['hover', true],
        ['hover', false],
    ] as const)('%s motion=%s 内容 ref 在原生弹层打开后聚焦', async (trigger, motion) => {
        render(Tooltip, {
            props: { trigger, motion },
            slots: {
                default: () => <button>trigger</button>,
                content: ({ initialFocusRef }: RenderContentProps) => <input ref={initialFocusRef} aria-label="inside" />,
            },
        });
        if (trigger === 'click') await userEvent.click(screen.getByRole('button'));
        else await userEvent.hover(screen.getByRole('button'));
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    });

    it.each([true, false])('motion=%s custom 受控打开内容后可 autofocus', async (motion) => {
        const view = render(Tooltip, {
            props: { trigger: 'custom', motion, visible: false },
            slots: {
                default: () => <button>trigger</button>,
                content: () => <input autofocus aria-label="inside" />,
            },
        });
        await userEvent.click(screen.getByRole('button'));
        expect(screen.queryByRole('textbox')).toBeNull();
        await view.rerender({ visible: true });
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    });

    it('contextMenu 对准触发器中心，Escape 关闭', async () => {
        renderTip({ trigger: 'contextMenu', motion: false, closeOnEsc: true }, { margin: '200px' });
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger, { button: 'right' });
        await waitFor(() => expect(Math.abs(center(popup()) - center(trigger))).toBeLessThan(8));
        trigger.focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    });

    it('自己的 style 不覆盖直接挂到 DOM 的 anchor', async () => {
        render(Tooltip, {
            props: { trigger: 'custom', visible: true, motion: false },
            slots: { default: () => <OwnStyle />, content: () => 'content' },
        });
        await waitFor(() => expect(Math.abs(center(popup()) - center(screen.getByText('own style')))).toBeLessThan(1));
    });

    it('loading 触发器的 wrapper 接收悬停，按钮保持唯一焦点目标', async () => {
        const view = render(Tooltip, {
            props: { motion: false },
            slots: { default: () => <Button loading />, content: () => 'content' },
        });
        const trigger = view.container.querySelector<HTMLElement>('.semi-tooltip-trigger-wrapper');
        if (!trigger) throw new Error('缺少 loading 触发器包装');
        await userEvent.hover(trigger);
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
        expect(trigger).toHaveAttribute('tabindex', '-1');
        await tabTo(screen.getByRole('button'));
        expect(screen.getByRole('button')).toHaveAccessibleDescription('content');
    });

    it('clickTriggerToHide 与 v-model 可反复切换', async () => {
        render(Model);
        const trigger = screen.getByRole('button', { name: 'trigger' });
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
    });

    it('多个 slot 节点包进同一个 wrapper，点击任一节点打开并对准 wrapper', async () => {
        render(Tooltip, {
            props: { trigger: 'click', position: 'bottom', motion: false },
            slots: {
                default: () => (
                    <>
                        <button>首个元素</button>
                        <span>第二个元素</span>
                    </>
                ),
                content: () => 'content',
            },
        });
        const wrapper = screen.getByRole('button', { name: '首个元素' }).parentElement as HTMLElement;
        expect(screen.getByText('第二个元素').parentElement).toBe(wrapper);
        await userEvent.click(screen.getByText('第二个元素'));
        await waitFor(() => expect(Math.abs(center(popup()) - center(wrapper))).toBeLessThanOrEqual(1));
    });

    it('嵌套 Teleport 点击不关闭祖先', async () => {
        render(Nested);
        await userEvent.click(screen.getByRole('button', { name: 'outer' }));
        await userEvent.click(await screen.findByRole('button', { name: 'inner' }));
        await userEvent.click(await screen.findByRole('button', { name: 'action' }));
        expect(screen.getAllByRole('tooltip')).toHaveLength(2);
        await clickOutside();
        await waitFor(() => expect(screen.queryAllByRole('tooltip')).toHaveLength(0));
    });

    it('文本触发器可悬停', async () => {
        render(Tooltip, { slots: { default: () => 'plain text', content: () => 'content' } });
        await userEvent.hover(screen.getByText('plain text'));
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
    });

    it('图标触发器的主题焦点环', async () => {
        const view = render(Tooltip, { slots: { default: () => <IconHelpCircle />, content: () => 'content' } });
        const icon = view.container.querySelector<HTMLElement>('.semi-icon');
        if (!icon) throw new Error('缺少图标触发器');
        await tabTo(icon);
        expectThemeFocusRing(icon);
    });

    it('禁用点击触发器的 wrapper 是有主题焦点环的 Tab 目标', async () => {
        const view = render(Tooltip, {
            props: { trigger: 'click' },
            slots: { default: () => <button disabled>disabled</button> },
        });
        const wrapper = view.container.querySelector<HTMLElement>('span[tabindex="0"]');
        if (!wrapper) throw new Error('缺少禁用触发器包装');
        await tabTo(wrapper);
        expectThemeFocusRing(wrapper);
    });

    it('无尺寸触发器仍有定位', async () => {
        const view = render(Tooltip, {
            props: { visible: true, trigger: 'custom', position: 'bottomLeft', showArrow: false, motion: false },
            slots: {
                default: () => <span style={{ marginLeft: '200px' }} data-testid="empty" />,
                content: () => 'content',
            },
        });
        await waitFor(() => {
            const trigger = view.getByTestId('empty').getBoundingClientRect();
            expect(popup().getBoundingClientRect().left).toBeCloseTo(trigger.left, 0);
            expect(popup().getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger.bottom);
        });
    });

    it('body position 改变后仍对齐，悬停不扫描整个文档', async () => {
        const original = document.body.style.position;
        const query = vi.spyOn(document, 'querySelectorAll');
        try {
            renderTip({ position: 'bottom', motion: false }, { margin: '200px' });
            const trigger = screen.getByRole('button');
            await userEvent.hover(trigger);
            await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
            document.body.style.position = 'relative';
            await waitFor(() => expect(center(popup())).toBeCloseTo(center(trigger), 0));
            expect(query.mock.calls.filter(([selector]) => selector === ':hover')).toHaveLength(0);
        } finally {
            document.body.style.position = original;
            query.mockRestore();
        }
    });

    it('默认动画结束卸载并只通知一次 afterClose', async () => {
        const view = renderTip({ trigger: 'custom', visible: true });
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
        await view.rerender({ visible: false });
        await waitFor(() => expect(screen.queryByText('content')).toBeNull());
        expect(view.emitted().afterClose).toHaveLength(1);
    });

    it('淡出期间重新打开保留同一弹层', async () => {
        const view = renderTip({ trigger: 'custom', visible: true });
        await settled();
        const element = popup();
        await view.rerender({ visible: false });
        expect(element.getAnimations().length).toBeGreaterThan(0);
        await view.rerender({ visible: true });
        await settled();
        expect(popup()).toBe(element);
        expect(element.matches(':popover-open')).toBe(true);
    });

    it('进出场是 keyframes 动画：出场期间弹层仍在顶层可见，结束后才隐藏', async () => {
        const onAfterClose = vi.fn<() => void>();
        const view = renderTip({ trigger: 'custom', visible: true, keepDOM: true, onAfterClose } as TooltipProps);
        await waitFor(() => expect(popup().matches(':popover-open')).toBe(true));
        const element = popup();
        expect(element.getAnimations().map((animation) => (animation as CSSAnimation).animationName)).toEqual(['semi-tooltip-zoom-in']);
        await settled();

        await view.rerender({ visible: false });
        const [exit] = element.getAnimations() as CSSAnimation[];
        expect(exit.animationName).toBe('semi-tooltip-zoom-out');
        exit.pause();
        exit.currentTime = 0;
        expect(element.matches(':popover-open')).toBe(true);
        expect(element.checkVisibility()).toBe(true);
        expect(onAfterClose).not.toHaveBeenCalled();
        exit.finish();
        await waitFor(() => expect(element.matches(':popover-open')).toBe(false));
        expect(element.checkVisibility()).toBe(false);
        expect(onAfterClose).toHaveBeenCalledTimes(1);
    });

    it('motion 为 false 时没有进出场动画，关闭后立即隐藏', async () => {
        const view = renderTip({ trigger: 'custom', visible: true, keepDOM: true, motion: false });
        await waitFor(() => expect(popup().matches(':popover-open')).toBe(true));
        const element = popup();
        expect(element.getAnimations()).toHaveLength(0);
        await view.rerender({ visible: false });
        expect(element.matches(':popover-open')).toBe(false);
    });

    it('运行时 position 改变后换边', async () => {
        const view = render(Tooltip, {
            props: { trigger: 'custom', visible: true, position: 'top', motion: false },
            slots: { default: () => <button style={{ margin: '200px' }}>trigger</button>, content: () => 'content' },
        });
        await waitFor(() => expect(popup().getBoundingClientRect().bottom).toBeLessThanOrEqual(screen.getByRole('button').getBoundingClientRect().top));
        await view.rerender({ position: 'bottom' });
        await waitFor(() => expect(popup().getBoundingClientRect().top).toBeGreaterThanOrEqual(screen.getByRole('button').getBoundingClientRect().bottom));
    });

    it('同一按钮可同时定位嵌套的两个弹层', async () => {
        render(DoubleAnchor);
        await waitFor(() => {
            const button = screen.getByRole('button');
            const layers = screen.getAllByRole('tooltip');
            expect(layers).toHaveLength(2);
            for (const layer of layers) expect(center(layer)).toBeCloseTo(center(button), 0);
        });
    });

    it('右侧被裁切的 topLeft 触发器将弹层贴合视口右边缘', async () => {
        render(Tooltip, {
            props: { trigger: 'custom', visible: true, motion: false, position: 'topLeft' },
            slots: {
                default: () => <button style={{ position: 'fixed', top: '100px', left: '900px', width: '200px' }}>trigger</button>,
                content: () => 'content',
            },
        });
        await waitFor(() => expect(popup().getBoundingClientRect().right).toBeCloseTo(document.documentElement.clientWidth, 0));
    });

    it('leftTopOver 随滚动翻转并保持在视口内', async () => {
        const host = document.createElement('div');
        host.style.cssText = 'width: 200vw; height: 200vh; display: flex; align-items: center; justify-content: center';
        document.body.append(host);
        const view = render(Tooltip, {
            container: host,
            props: { trigger: 'click', position: 'leftTopOver', showArrow: false, motion: false },
            slots: {
                default: () => <button style={{ width: '200px' }}>trigger</button>,
                content: () => <div style={{ width: '200px', height: '200px' }}>content</div>,
            },
        });
        try {
            const button = screen.getByRole('button');
            const initial = button.getBoundingClientRect();
            window.scrollBy(initial.left - 40, initial.top - 40);
            await userEvent.click(button);
            await waitFor(() => expect(popup().getBoundingClientRect().left).toBeLessThan(button.getBoundingClientRect().left));
            const rect = button.getBoundingClientRect();
            window.scrollBy(rect.right - document.documentElement.clientWidth + 40, rect.bottom - document.documentElement.clientHeight + 40);
            await waitFor(() => {
                const layer = popup().getBoundingClientRect();
                expect(layer.top).toBeLessThan(button.getBoundingClientRect().top);
                expect(layer.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight + 1);
            });
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('Teleport 不继承 form/label 行为与周围文字样式', async () => {
        const view = render(Portal);
        const input = await screen.findByRole('textbox');
        await userEvent.click(input);
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(view.emitted().submit).toBeUndefined();
        expect(getComputedStyle(popup()).whiteSpace).toBe('normal');
        expect(getComputedStyle(popup()).fontWeight).not.toBe('700');
    });

    it('ShadowRoot 内 Teleport 同根，焦点和 Escape 正常', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(Tooltip, {
            container: mount,
            props: { trigger: 'click', closeOnEsc: true, returnFocusOnClose: true, motion: false },
            slots: {
                default: () => <button>shadow trigger</button>,
                content: () => <input aria-label="shadow input" />,
            },
        });
        try {
            const trigger = shadow.querySelector('button');
            if (!trigger) throw new Error('缺少 ShadowRoot 触发器');
            trigger.click();
            await nextTick();
            const layer = shadow.querySelector<HTMLElement>('[popover]');
            expect(layer).not.toBeNull();
            expect(layer?.getRootNode()).toBe(shadow);
            const input = shadow.querySelector('input');
            input?.focus();
            input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
            await nextTick();
            expect(shadow.activeElement).toBe(trigger);
            expect(shadow.querySelector('[popover]')).toBeNull();
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it.each([
        ['top', { left: '20px', top: '40px' }, 'bottom'],
        ['top', { right: '20px', top: '40px' }, 'bottom'],
        ['top', { left: '20px', top: '70px' }, 'top'],
        ['top', { right: '20px', top: '70px' }, 'top'],
        ['bottom', { left: '20px', bottom: '70px' }, 'bottom'],
        ['bottom', { right: '20px', bottom: '70px' }, 'bottom'],
        ['bottom', { left: '20px', bottom: '40px' }, 'top'],
        ['bottom', { right: '20px', bottom: '40px' }, 'top'],
        ['left', { left: '300px', top: '20px' }, 'left'],
        ['left', { left: '300px', bottom: '20px' }, 'left'],
        ['left', { left: '180px', top: '20px' }, 'right'],
        ['left', { left: '180px', bottom: '20px' }, 'right'],
        ['right', { right: '300px', top: '20px' }, 'right'],
        ['right', { right: '300px', bottom: '20px' }, 'right'],
        ['right', { right: '180px', top: '20px' }, 'left'],
        ['right', { right: '180px', bottom: '20px' }, 'left'],
    ] as const)('%s %j 溢出时翻转并让箭头指向触发器', async (position, style, side) => {
        await page.viewport(1000, 800);
        const vertical = position === 'top' || position === 'bottom';
        render(Tooltip, {
            props: { position: position as Position, trigger: 'custom', visible: true, motion: false },
            slots: {
                default: () => <button style={{ position: 'fixed', ...style }}>trigger</button>,
                content: () => (
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
                ),
            },
        });
        await waitFor(() => {
            const trigger = screen.getByRole('button').getBoundingClientRect();
            const rect = popup().getBoundingClientRect();
            expect(rect.left).toBeGreaterThanOrEqual(-1);
            expect(rect.top).toBeGreaterThanOrEqual(-1);
            expect(rect.right).toBeLessThanOrEqual(1001);
            expect(rect.bottom).toBeLessThanOrEqual(801);
            const gaps = {
                bottom: rect.top - trigger.bottom,
                top: trigger.top - rect.bottom,
                right: rect.left - trigger.right,
                left: trigger.left - rect.right,
            };
            expect(gaps[side]).toBeGreaterThanOrEqual(0);
            const arrow = popup().querySelector('svg');
            if (!arrow) throw new Error('缺少箭头');
            const arrowRect = arrow.getBoundingClientRect();
            const difference = vertical ? arrowRect.left + arrowRect.width / 2 - (trigger.left + trigger.width / 2) : arrowRect.top + arrowRect.height / 2 - (trigger.top + trigger.height / 2);
            expect(Math.abs(difference)).toBeLessThanOrEqual(1);
            expect(new DOMMatrix(getComputedStyle(arrow).transform).a < 0).toBe(side === 'bottom' || side === 'right');
        });
    });

    it.each([
        ['Switch', () => <Switch aria-label="inner switch" />],
        ['loading Button', () => <Button loading>{() => 'inner loading'}</Button>],
    ])('焦点落在 %s 内层控件上时，键盘打开的悬停提示保持显示', async (_, child) => {
        render(Tooltip, { slots: { default: child, content: () => 'inner tip' } });
        await tab();
        expect(document.activeElement).not.toBe(document.body);
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.getByRole('tooltip')).toHaveTextContent('inner tip');
    });

    it('Escape 关闭后焦点回到 loading Button 本身，而不是外层包裹', async () => {
        render(Popover, {
            props: { trigger: 'click', ariaLabel: 'busy details' },
            slots: { default: () => <Button loading>{() => 'busy'}</Button>, content: () => <button type="button">inside</button> },
        });
        const button = screen.getByRole('button', { name: 'busy' });
        await userEvent.click(button, { force: true });
        (await screen.findByRole('button', { name: 'inside' })).focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('button', { name: 'inside' })).toBeNull());
        expect(button).toHaveFocus();
    });

    it('模态覆盖层打开期间，之前打开的弹层不显示在它上面', async () => {
        const open = ref(false);
        render({
            render: () => (
                <>
                    <Popover ariaLabel="anchor details" motion={false} trigger="custom" visible>
                        {{
                            default: () => <Button>{() => 'anchor'}</Button>,
                            content: () => (
                                <Button
                                    onClick={() => {
                                        open.value = true;
                                    }}
                                >
                                    {() => 'open modal'}
                                </Button>
                            ),
                        }}
                    </Popover>
                    <Modal
                        title="Dialog"
                        motion={false}
                        visible={open.value}
                        onCancel={() => {
                            open.value = false;
                        }}
                    >
                        {() => 'modal body'}
                    </Modal>
                </>
            ),
        });
        const opener = await screen.findByRole('button', { name: 'open modal' });
        await userEvent.click(opener);
        await screen.findByRole('dialog', { name: 'Dialog' });
        await waitFor(() => expect(opener).not.toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Dialog' })).toBeNull());
        await waitFor(() => expect(opener).toBeVisible());
    });

    it('KeepAlive 失活时单向绑定 visible 为 true 的弹层不可见，激活后重新显示', async () => {
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => (
                <Tooltip motion={false} trigger="click" visible>
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => 'cached content',
                    }}
                </Tooltip>
            ),
        });
        const cached = ref(true);
        render(() => <KeepAlive>{{ default: () => [cached.value ? <Cached /> : <p>other view</p>] }}</KeepAlive>);
        const content = await screen.findByText('cached content');
        await waitFor(() => expect(content).toBeVisible());

        cached.value = false;
        await screen.findByText('other view');
        await waitFor(() => expect(screen.queryByText('cached content')).toBeNull());

        cached.value = true;
        await waitFor(() => expect(screen.getByText('cached content')).toBeVisible());
        expect(popup().matches(':popover-open')).toBe(true);
    });

    it('KeepAlive 失活期间单向绑定的 visible 由 false 变为 true，激活后弹层显示，不通知 visibleChange', async () => {
        const shown = ref(false);
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => (
                <Tooltip motion={false} trigger="click" visible={shown.value} onVisibleChange={onVisibleChange}>
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => 'cached content',
                    }}
                </Tooltip>
            ),
        });
        const cached = ref(true);
        render(() => <KeepAlive>{{ default: () => [cached.value ? <Cached /> : <p>other view</p>] }}</KeepAlive>);
        await screen.findByRole('button', { name: 'trigger' });

        cached.value = false;
        await screen.findByText('other view');
        shown.value = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(screen.queryByText('cached content')).toBeNull();

        cached.value = true;
        await waitFor(() => expect(screen.getByText('cached content')).toBeVisible());
        expect(popup().matches(':popover-open')).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('KeepAlive 失活时 v-model:visible 的弹层随回写关闭，激活后保持关闭并能再次打开', async () => {
        const shown = ref(false);
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => (
                <Tooltip
                    motion={false}
                    trigger="click"
                    visible={shown.value}
                    onUpdate:visible={(visible: boolean) => {
                        shown.value = visible;
                    }}
                    onVisibleChange={onVisibleChange}
                >
                    {{
                        default: () => <button type="button">trigger</button>,
                        content: () => 'cached content',
                    }}
                </Tooltip>
            ),
        });
        const cached = ref(true);
        render(() => <KeepAlive>{{ default: () => [cached.value ? <Cached /> : <p>other view</p>] }}</KeepAlive>);
        await userEvent.click(await screen.findByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(screen.getByText('cached content')).toBeVisible());

        cached.value = false;
        await screen.findByText('other view');
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(false));
        expect(shown.value).toBe(false);
        await waitFor(() => expect(screen.queryByText('cached content')).toBeNull());

        cached.value = true;
        const trigger = await screen.findByRole('button', { name: 'trigger' });
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(screen.queryByText('cached content')).toBeNull();

        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByText('cached content')).toBeVisible());
        expect(shown.value).toBe(true);
    });
});

describe('Tooltip 全屏（浏览器）', () => {
    afterEach(async () => {
        if (document.fullscreenElement) await document.exitFullscreen();
    });

    it('触发元素本身是全屏元素时，弹层挂进它且其中的按钮可点击', async () => {
        const onClick = vi.fn<() => void>();
        const visible = ref(false);
        render({
            render: () => (
                <div>
                    <button
                        type="button"
                        onClick={() =>
                            void document
                                .getElementById('stage')
                                ?.requestFullscreen()
                                .then(() => (visible.value = true))
                        }
                    >
                        enter
                    </button>
                    <Tooltip motion={false} trigger="custom" visible={visible.value}>
                        {{
                            default: () => (
                                <div id="stage" data-testid="stage" style={{ background: 'white' }}>
                                    stage
                                </div>
                            ),
                            content: () => (
                                <button type="button" onClick={onClick}>
                                    inside
                                </button>
                            ),
                        }}
                    </Tooltip>
                </div>
            ),
        });
        const stage = screen.getByTestId('stage');
        await userEvent.click(screen.getByRole('button', { name: 'enter' }));
        await waitFor(() => expect(document.fullscreenElement).toBe(stage));
        const button = await screen.findByRole('button', { name: 'inside' });
        expect(stage).toContainElement(button);
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
