/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import semiGlobal, { semiGlobalKey, SemiGlobal } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider/config-provider.vue';
import type { PopoverEmits, PopoverProps } from '../interface';
import Popover from '../popover.vue';
import Model from './fixtures/model.vue';

function renderPop(props: PopoverProps = {}) {
    return render(Popover, {
        props: { motion: false, ariaLabel: 'Details', ...props },
        slots: { default: () => <button type="button">trigger</button>, content: () => 'content' },
    });
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Popover', () => {
    it('转发 Tooltip 的 afterOpen，父级驱动打开时不发出 visibleChange', async () => {
        const view = renderPop({ trigger: 'custom', visible: false });
        await view.rerender({ visible: true });
        await waitFor(() => expect(view.emitted().afterOpen).toHaveLength(1));
        expect(view.emitted().visibleChange).toBeUndefined();
    });

    it('默认无箭头，卡片与内容拥有对应 class', async () => {
        renderPop({ visible: true });
        const popup = await screen.findByRole('tooltip');
        expect(popup.querySelector('.semi-popover-content')).toHaveTextContent('content');
        expect(popup.querySelector('svg')).toBeNull();
        expect(popup).toHaveAttribute('x-placement', 'bottom');
        expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', popup.id);
        expect(popup).not.toHaveAttribute('aria-label');
        // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing
        expect(popup.style.top).toBe('4px');
    });

    it('点击显示，内部点击与再次点击保持显示，外部点击关闭并发送原生事件', async () => {
        const view = renderPop({ trigger: 'click' });
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.click(trigger);
        const popup = await screen.findByRole('dialog', { name: 'Details' });
        await waitFor(() => expect(view.emitted().visibleChange).toEqual([[true]]));
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('aria-controls', popup.id);
        await fireEvent.click(trigger);
        await fireEvent.mouseDown(popup);
        expect(popup).toBeInTheDocument();
        await fireEvent.mouseDown(document.body);
        expect(document.querySelector('.semi-popover-wrapper')).toBeNull();
        expect(view.emitted().visibleChange).toEqual([[true], [false]]);
        expect(view.emitted()['update:visible']).toEqual([[true], [false]]);
        expect(view.emitted<PopoverEmits['clickOutSide']>('clickOutSide')[0][0]).toBeInstanceOf(MouseEvent);
        expect(view.emitted<PopoverEmits['clickOutSide']>('clickOutSide')[0][0]).not.toHaveProperty('nativeEvent');
    });

    it('单向 visible=false 只通知，父级同值更新保持关闭', async () => {
        const view = renderPop({ visible: false, trigger: 'click' });
        await fireEvent.click(screen.getByRole('button'));
        await fireEvent.click(screen.getByRole('button'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(view.emitted()['update:visible']).toEqual([[true], [true]]);
        await view.rerender({ visible: false });
        expect(screen.queryByRole('dialog')).toBeNull();
        await view.rerender({ visible: true });
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('单向 visible=true 连续关闭请求保持打开', async () => {
        const view = renderPop({ visible: true, trigger: 'click' });
        await screen.findByRole('dialog');
        await fireEvent.mouseDown(document.body);
        await fireEvent.mouseDown(document.body);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(view.emitted<PopoverEmits['update:visible']>('update:visible').filter(([value]) => value === false)).toHaveLength(2);
        await view.rerender({ visible: false });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('显式 undefined 非受控，受控值改 undefined 后恢复交互', async () => {
        const view = renderPop({ visible: undefined, trigger: 'click' });
        await fireEvent.click(screen.getByRole('button'));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        await view.rerender({ visible: false });
        expect(screen.queryByRole('dialog')).toBeNull();
        await view.rerender({ visible: undefined });
        await fireEvent.click(screen.getByRole('button'));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('custom 只跟随 visible，role=presentation 不覆盖触发器关联', async () => {
        const view = renderPop({ trigger: 'custom', visible: false, role: 'presentation' });
        await fireEvent.click(screen.getByRole('button'));
        expect(document.querySelector('.semi-popover-wrapper')).toBeNull();
        await view.rerender({ visible: true });
        await waitFor(() => expect(document.querySelector('.semi-popover-wrapper')).toHaveAttribute('role', 'presentation'));
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-haspopup');
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
    });

    it('contextMenu 默认生成具名 dialog，泛型触发器不注入交互状态', async () => {
        render(Popover, {
            props: { trigger: 'contextMenu', motion: false, ariaLabel: 'Menu' },
            slots: { default: () => <span>trigger</span>, content: () => 'content' },
        });
        const trigger = screen.getByText('trigger');
        await fireEvent.contextMenu(trigger);
        expect(await screen.findByRole('dialog', { name: 'Menu' })).toHaveTextContent('content');
        expect(trigger).not.toHaveAttribute('aria-haspopup');
        expect(trigger).not.toHaveAttribute('aria-expanded');
    });

    it.each(['top', 'left'] as const)('position=%s 箭头保留路径、颜色和箭头间距', async (position) => {
        // away from the viewport edge, so the popup is not clamped back into it
        const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 200, 0, 0));
        onTestFinished(() => rect.mockRestore());
        render(Popover, {
            props: {
                position,
                showArrow: true,
                trigger: 'custom',
                visible: true,
                arrowStyle: { borderColor: 'green', borderOpacity: 0.5 },
                ariaLabel: 'Details',
            },
            attrs: { style: { backgroundColor: 'blue' } },
            slots: { default: () => <button>trigger</button>, content: () => 'content' },
        });
        const popup = await screen.findByRole('dialog');
        const paths = popup.querySelectorAll<SVGPathElement>('path');
        expect(paths).toHaveLength(2);
        expect(paths[0].getAttribute('d')?.startsWith(position === 'top' ? 'M0 0.5' : 'M0.5 0')).toBe(true);
        expect(paths[0].style.fill).toBe('green');
        expect(paths[0].style.opacity).toBe('0.5');
        expect(paths[1].style.fill).toBe('blue');
        // jsdom gives the popup no size, so it sits one spacing before the trigger
        expect(popup.style.left).toBe(position === 'top' ? '200px' : '190px');
        expect(popup.style.top).toBe(position === 'top' ? '190px' : '200px');
    });

    it('class/style 只落弹层，contentClassName 与 prefixCls 落卡片，其余 attrs 丢弃', async () => {
        render(Popover, {
            props: {
                trigger: 'custom',
                visible: true,
                prefixCls: 'custom-pop',
                contentClassName: ['card'],
                ariaLabel: 'Details',
            },
            attrs: { class: 'popup', style: { backgroundColor: 'red' }, 'data-unknown': 'discard' },
            slots: { default: () => <button>trigger</button>, content: () => 'content' },
        });
        const popup = await screen.findByRole('dialog');
        expect(popup).toHaveClass('custom-pop-wrapper', 'popup');
        expect(popup.style.backgroundColor).toBe('red');
        expect(popup.querySelector('.custom-pop')).toHaveClass('card');
        expect(popup.querySelector('.custom-pop-content')).toHaveTextContent('content');
        expect(document.querySelector('[data-unknown]')).toBeNull();
        expect(screen.getByRole('button')).not.toHaveClass('popup');
    });

    it.each([false, true, 'click'] as const)('stopPropagation=%s 按真值决定原生事件冒泡', async (stopPropagation) => {
        renderPop({ trigger: 'custom', visible: true, stopPropagation });
        const handler = vi.fn<(event: MouseEvent) => void>();
        window.addEventListener('mousedown', handler);
        try {
            await fireEvent.mouseDown(await screen.findByRole('dialog'));
            expect(handler).toHaveBeenCalledTimes(stopPropagation ? 0 : 1);
        } finally {
            window.removeEventListener('mousedown', handler);
        }
    });

    it('读取注入全局默认值，显式属性优先且支持 RTL', async () => {
        const config = new SemiGlobal();
        config.config = {
            overrideDefaultProps: { Popover: { visible: true, trigger: 'custom', showArrow: true, position: 'left' } },
        };
        render(ConfigProvider, {
            props: { direction: 'rtl' },
            global: { provide: { [semiGlobalKey as symbol]: config } },
            slots: {
                default: () => (
                    <Popover position="top" ariaLabel="Details">
                        {{
                            default: () => <button>trigger</button>,
                            content: () => 'content',
                        }}
                    </Popover>
                ),
            },
        });
        const popup = await screen.findByRole('dialog');
        expect(popup).toHaveAttribute('x-placement', 'top');
        expect(popup).toHaveAttribute('dir', 'rtl');
        expect(popup.querySelector('.semi-popover-icon-arrow')).not.toBeNull();
    });

    it('v-model 与 initialFocusRef 作用域插槽及 focusTrigger expose 生效', async () => {
        render(Model);
        await fireEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
        expect(screen.getByRole('status')).toHaveTextContent('true');
        await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByRole('button', { name: 'trigger' })).toHaveFocus();
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(screen.getByRole('button', { name: 'trigger' })).toHaveFocus();
    });

    it('对话框命名属性落弹层，未命名只告警一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const view = renderPop({ trigger: 'custom', visible: true, ariaLabel: undefined });
        await screen.findByRole('dialog');
        await view.rerender({ position: 'top' });
        expect(warn.mock.calls.filter(([message]) => String(message).includes('[Semi Popover]'))).toHaveLength(1);
        await view.rerender({ ariaLabelledby: 'heading' });
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'heading');
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-labelledby');
    });

    it('ariaDescribedby 透传给对话框弹层，hover 的 tooltip 角色不带', async () => {
        const view = renderPop({ trigger: 'custom', visible: true, ariaDescribedby: 'note' });
        expect(await screen.findByRole('dialog')).toHaveAttribute('aria-describedby', 'note');
        await view.rerender({ trigger: 'hover' });
        expect(screen.getByRole('tooltip')).not.toHaveAttribute('aria-describedby');
    });

    it('keepDOM 与 condition 透传，打开卸载清理弹层且通知一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const view = render(Popover, {
            props: {
                visible: true,
                trigger: 'custom',
                keepDOM: true,
                motion: false,
                ariaLabel: 'Details',
                onAfterClose: afterClose,
            },
            slots: { default: () => <button>trigger</button>, content: () => 'content' },
        });
        const popup = await screen.findByRole('dialog');
        await view.rerender({ condition: false });
        expect(popup).toHaveClass('semi-popover-wrapper-show');
        expect(view.emitted('update:visible')).toEqual([[false]]);
        await view.rerender({ visible: false });
        expect(popup).not.toHaveClass('semi-popover-wrapper-show');
        view.unmount();
        await nextTick();
        expect(document.querySelector('.semi-popover-wrapper')).toBeNull();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])('keepDOM=%s 打开中卸载时 afterClose 通知一次', async (keepDOM) => {
        const afterClose = vi.fn<() => void>();
        const view = render(Popover, {
            props: {
                visible: true,
                trigger: 'custom',
                keepDOM,
                motion: false,
                ariaLabel: 'Details',
                onAfterClose: afterClose,
            },
            slots: { default: () => <button>trigger</button>, content: () => 'content' },
        });
        await screen.findByRole('dialog');
        expect(afterClose).not.toHaveBeenCalled();
        view.unmount();
        await nextTick();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.semi-popover-wrapper')).toBeNull();
    });
});

describe('Popover 嵌套焦点', () => {
    const focusProps = { motion: false, trigger: 'focus', mouseEnterDelay: 0, mouseLeaveDelay: 20 } as const;
    const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

    it('焦点进入内容中 Popover 的弹层时，trigger 为 focus 的外层保持打开', async () => {
        render(Popover, {
            props: { ...focusProps, ariaLabel: 'Outer' },
            slots: {
                default: () => <button type="button">outer trigger</button>,
                content: () => (
                    <Popover {...focusProps} ariaLabel="Inner">
                        {{
                            default: () => <button type="button">inner trigger</button>,
                            content: () => <button type="button">inner action</button>,
                        }}
                    </Popover>
                ),
            },
        });
        screen.getByRole('button', { name: 'outer trigger' }).focus();
        const innerTrigger = await screen.findByRole('button', { name: 'inner trigger' });
        innerTrigger.focus();
        const innerAction = await screen.findByRole('button', { name: 'inner action' });
        innerAction.focus();
        await settle();
        expect(innerAction).toHaveFocus();
        expect(innerTrigger).toBeInTheDocument();
        expect(document.querySelectorAll('.semi-popover-wrapper')).toHaveLength(2);
        innerAction.blur();
        await settle();
        expect(document.querySelector('.semi-popover-wrapper')).toBeNull();
    });

    it('触发器中嵌套的 Popover 不替外层保持打开', async () => {
        render(Popover, {
            props: { ...focusProps, ariaLabel: 'Outer' },
            slots: {
                default: () => (
                    <Popover {...focusProps} ariaLabel="Inner">
                        {{
                            default: () => <button type="button">shared trigger</button>,
                            content: () => <button type="button">inner action</button>,
                        }}
                    </Popover>
                ),
                content: () => 'outer content',
            },
        });
        screen.getByRole('button', { name: 'shared trigger' }).focus();
        await screen.findByText('outer content');
        const innerAction = await screen.findByRole('button', { name: 'inner action' });
        innerAction.focus();
        await settle();
        expect(innerAction).toHaveFocus();
        expect(screen.queryByText('outer content')).toBeNull();
    });
});
