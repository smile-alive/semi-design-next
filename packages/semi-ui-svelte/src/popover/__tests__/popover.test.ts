import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { PopoverProps } from '../interface';
import PopoverFixture from './popover-fixture.svelte';
import PopoverNested from './popover-nested.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Store = {
    value?: boolean;
    accept: boolean;
    log: string[];
    shown: boolean;
    child: boolean;
    focus: boolean;
    actions: boolean;
    rtl: boolean;
    props: Omit<PopoverProps, 'visible' | 'children' | 'child' | 'content'>;
};

const popup = () => document.querySelector<HTMLElement>('.semi-popover-wrapper');
const shown = () => document.querySelector<HTMLElement>('.semi-popover-wrapper-show');

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Store['props'] = {}, { mode = 'uncontrolled' as Mode, ...init }: Partial<Omit<Store, 'props'>> & { mode?: Mode } = {}) {
    const store = createStore<Store>({ accept: true, log: [], shown: true, child: true, focus: false, actions: false, rtl: false, ...init, props: { motion: false, 'aria-label': 'Details', ...props } });
    const result = render(PopoverFixture, { props: { mode, store } });
    flushSync();
    const trigger = () => (store.child ? screen.getByRole('button', { name: 'trigger' }) : screen.getByText('trigger'));
    const click = async (target: Element = trigger()) => {
        await fireEvent.mouseDown(target);
        await fireEvent.click(target);
        await settle();
    };
    return { store, trigger, click, ...result };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Popover', () => {
    it('转发 afterOpen，父级驱动打开时不通知 onVisibleChange', async () => {
        const { store } = setup({ trigger: 'custom' }, { mode: 'bind', value: false });
        store.value = true;
        await settle();
        await waitFor(() => expect(store.log).toContain('afterOpen'));
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual([]);
    });

    it('默认无箭头，卡片与内容拥有对应 class', async () => {
        setup({}, { mode: 'one-way', value: true });
        await settle();
        const tip = screen.getByRole('tooltip');
        expect(tip.querySelector('.semi-popover > .semi-popover-content')).toHaveTextContent('content');
        expect(tip.querySelector('svg')).toBe(null);
        expect(tip).toHaveAttribute('x-placement', 'bottom');
        expect(screen.getByRole('button', { name: 'trigger' })).toHaveAttribute('aria-describedby', tip.id);
        expect(tip).not.toHaveAttribute('aria-label');
        // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing
        expect(tip.style.top).toBe('4px');
    });

    it('点击显示，内部点击与再次点击保持显示，外部点击关闭并通知原生事件', async () => {
        const { store, click, trigger } = setup({ trigger: 'click' });
        expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        await click();
        const dialog = screen.getByRole('dialog', { name: 'Details' });
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(trigger()).toHaveAttribute('aria-controls', dialog.id);
        await click();
        await click(screen.getByText('content'));
        expect(dialog).toBeInTheDocument();
        await click(screen.getByText('outside'));
        expect(popup()).toBe(null);
        expect(store.log.filter((entry) => !entry.startsWith('after') && entry !== 'open')).toEqual(['change true', 'outside true', 'change false']);
    });

    it('bind:visible：交互写回父级，父级改值开合弹层', async () => {
        const { store, click } = setup({ trigger: 'click' }, { mode: 'bind', value: false });
        await click();
        expect(store.value).toBe(true);
        expect(screen.getByRole('status')).toHaveTextContent('true');
        store.value = false;
        await settle();
        expect(popup()).toBe(null);
        store.value = true;
        await settle();
        expect(shown()).not.toBe(null);
        await click(screen.getByText('outside'));
        expect(store.value).toBe(false);
        expect(popup()).toBe(null);
    });

    it('函数绑定：setter 拒绝打开时保持关闭只通知请求，父级改值后打开', async () => {
        const { store, click } = setup({ trigger: 'click' }, { mode: 'function', value: false, accept: false });
        await click();
        await click();
        expect(screen.queryByRole('dialog')).toBe(null);
        expect(store.log).toEqual(['set true', 'change true', 'set true', 'change true']);
        store.value = true;
        await settle();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('函数绑定：setter 拒绝关闭时连续关闭请求保持打开', async () => {
        const { store } = setup({ trigger: 'click' }, { mode: 'function', value: true, accept: false });
        await settle();
        await fireEvent.mouseDown(screen.getByText('outside'));
        await fireEvent.mouseDown(screen.getByText('outside'));
        await settle();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(store.log.filter((entry) => entry === 'change false')).toHaveLength(2);
        store.value = false;
        await settle();
        expect(screen.queryByRole('dialog')).toBe(null);
    });

    it('单向传值只作初值，交互在本地覆盖', async () => {
        const { store } = setup({ trigger: 'click' }, { mode: 'one-way', value: true });
        await settle();
        expect(shown()).not.toBe(null);
        await fireEvent.mouseDown(screen.getByText('outside'));
        await settle();
        expect(popup()).toBe(null);
        expect(store.value).toBe(true);
    });

    it('绑定值改回 undefined 后恢复非受控交互', async () => {
        const { store, click } = setup({ trigger: 'click' }, { mode: 'bind', value: undefined });
        await click();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        store.value = false;
        await settle();
        expect(screen.queryByRole('dialog')).toBe(null);
        store.value = undefined;
        await settle();
        await click();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('custom 只跟随 visible，role=presentation 不给触发器加弹层关联', async () => {
        const { store, click, trigger } = setup({ trigger: 'custom', role: 'presentation' }, { mode: 'bind', value: false });
        await click();
        expect(popup()).toBe(null);
        store.value = true;
        await settle();
        expect(popup()).toHaveAttribute('role', 'presentation');
        expect(trigger()).not.toHaveAttribute('aria-haspopup');
        expect(trigger()).not.toHaveAttribute('aria-describedby');
    });

    it('contextMenu 默认生成具名 dialog，包装 span 不带弹层状态', async () => {
        const { trigger } = setup({ trigger: 'contextMenu', 'aria-label': 'Menu' }, { child: false });
        await fireEvent.contextMenu(trigger());
        await settle();
        expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveTextContent('content');
        expect(trigger()).not.toHaveAttribute('aria-haspopup');
        expect(trigger()).not.toHaveAttribute('aria-expanded');
    });

    it.each(['top', 'left'] as const)('position=%s 箭头保留路径、颜色和箭头间距', async (position) => {
        // away from the viewport edge, so the popup is not clamped back into it
        const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 200, 0, 0));
        onTestFinished(() => rect.mockRestore());
        setup({ position, showArrow: true, trigger: 'custom', arrowStyle: { borderColor: 'green', borderOpacity: 0.5 }, style: 'background-color: blue' }, { mode: 'one-way', value: true });
        await settle();
        const dialog = screen.getByRole('dialog');
        const svg = dialog.querySelector('svg.semi-popover-icon-arrow');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        const paths = dialog.querySelectorAll<SVGPathElement>('path');
        expect(paths).toHaveLength(2);
        expect(paths[0].getAttribute('d')?.startsWith(position === 'top' ? 'M0 0.5' : 'M0.5 0')).toBe(true);
        expect(paths[0].style.fill).toBe('green');
        expect(paths[0].style.opacity).toBe('0.5');
        expect(paths[1].style.fill).toBe('blue');
        // jsdom gives the popup no size, so it sits one spacing before the trigger
        expect(dialog.style.left).toBe(position === 'top' ? '200px' : '190px');
        expect(dialog.style.top).toBe(position === 'top' ? '190px' : '200px');
    });

    it('class/style 只落弹层，contentClassName 与 prefixCls 落卡片', async () => {
        const { trigger } = setup({ trigger: 'custom', prefixCls: 'custom-pop', contentClassName: ['card'], class: 'popup', style: 'background-color: red' }, { mode: 'one-way', value: true });
        await settle();
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveClass('custom-pop-wrapper', 'popup');
        expect(dialog.style.backgroundColor).toBe('red');
        expect(dialog.querySelector('.custom-pop')).toHaveClass('card');
        expect(dialog.querySelector('.custom-pop-content')).toHaveTextContent('content');
        expect(trigger()).not.toHaveClass('popup');
    });

    it.each([false, true, 'click'] as const)('stopPropagation=%s 按真值决定原生事件冒泡', async (stopPropagation) => {
        setup({ trigger: 'custom', stopPropagation }, { mode: 'one-way', value: true });
        await settle();
        const handler = vi.fn<(event: MouseEvent) => void>();
        window.addEventListener('mousedown', handler);
        onTestFinished(() => window.removeEventListener('mousedown', handler));
        await fireEvent.mouseDown(screen.getByRole('dialog'));
        expect(handler).toHaveBeenCalledTimes(stopPropagation ? 0 : 1);
    });

    it('读取全局默认值，显式属性优先且支持 RTL', async () => {
        semiGlobal.config = { overrideDefaultProps: { Popover: { trigger: 'custom', showArrow: true, position: 'left' } } };
        setup({ position: 'top' }, { mode: 'one-way', value: true, rtl: true });
        await settle();
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('x-placement', 'top');
        expect(dialog).toHaveAttribute('dir', 'rtl');
        expect(dialog.querySelector('.semi-popover-icon-arrow')).not.toBe(null);
    });

    it('bind:visible 与 initialFocusRef 生效，Escape 关闭后焦点回到触发器，focusTrigger 可调用', async () => {
        const { click, trigger } = setup({ trigger: 'click' }, { mode: 'bind', value: false, focus: true, actions: true });
        await click();
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'initial' })).toHaveFocus());
        expect(screen.getByRole('status')).toHaveTextContent('true');
        await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
        await settle();
        expect(screen.queryByRole('dialog')).toBe(null);
        expect(screen.getByRole('status')).toHaveTextContent('false');
        expect(trigger()).toHaveFocus();
        screen.getByRole('button', { name: 'focus' }).focus();
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(trigger()).toHaveFocus();
    });

    it('对话框命名属性落弹层，未命名只告警一次', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        onTestFinished(() => warn.mockRestore());
        const { store, trigger } = setup({ trigger: 'custom', 'aria-label': undefined }, { mode: 'one-way', value: true });
        await settle();
        store.props = { ...store.props, position: 'top' };
        await settle();
        expect(warn.mock.calls.filter(([message]) => String(message).includes('[Semi Popover]'))).toHaveLength(1);
        store.props = { ...store.props, 'aria-labelledby': 'heading' };
        await settle();
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'heading');
        expect(trigger()).not.toHaveAttribute('aria-labelledby');
    });

    it('aria-describedby 落对话框弹层，tooltip 角色不带', async () => {
        const { store } = setup({ trigger: 'custom', 'aria-describedby': 'note' }, { mode: 'one-way', value: true });
        await settle();
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'note');
        store.props = { ...store.props, trigger: 'hover' };
        await settle();
        expect(screen.getByRole('tooltip')).not.toHaveAttribute('aria-describedby');
    });

    it('keepDOM 与 condition 透传，卸载时清理弹层且 afterClose 只通知一次', async () => {
        const { store } = setup({ trigger: 'custom', keepDOM: true }, { mode: 'function', value: true, accept: false });
        await settle();
        const node = popup();
        store.props = { ...store.props, condition: false };
        await settle();
        expect(node).toHaveClass('semi-popover-wrapper-show');
        expect(store.log).toContain('change false');
        store.value = false;
        await settle();
        expect(node).not.toHaveClass('semi-popover-wrapper-show');
        store.shown = false;
        flushSync();
        expect(popup()).toBe(null);
        expect(store.log.filter((entry) => entry === 'afterClose')).toHaveLength(1);
    });

    it.each([false, true])('keepDOM=%s 打开中卸载时 afterClose 通知一次', async (keepDOM) => {
        const { store } = setup({ trigger: 'custom', keepDOM }, { mode: 'one-way', value: true });
        await settle();
        expect(store.log).not.toContain('afterClose');
        store.shown = false;
        flushSync();
        expect(store.log.filter((entry) => entry === 'afterClose')).toHaveLength(1);
        expect(popup()).toBe(null);
    });
});

describe('Svelte Popover 嵌套焦点', () => {
    const props = { motion: false, trigger: 'focus', mouseEnterDelay: 0, mouseLeaveDelay: 20 } as const;
    const wait = () => new Promise((resolve) => setTimeout(resolve, 60));

    it('焦点进入内容中 Popover 的弹层时，trigger 为 focus 的外层保持打开', async () => {
        render(PopoverNested, { props: { where: 'content', props } });
        screen.getByRole('button', { name: 'outer trigger' }).focus();
        const innerTrigger = await screen.findByRole('button', { name: 'inner trigger' });
        innerTrigger.focus();
        const innerAction = await screen.findByRole('button', { name: 'inner action' });
        innerAction.focus();
        await wait();
        expect(innerAction).toHaveFocus();
        expect(innerTrigger).toBeInTheDocument();
        expect(document.querySelectorAll('.semi-popover-wrapper')).toHaveLength(2);
        innerAction.blur();
        await wait();
        flushSync();
        expect(popup()).toBe(null);
    });

    it('触发器中嵌套的 Popover 不替外层保持打开', async () => {
        render(PopoverNested, { props: { where: 'trigger', props } });
        screen.getByRole('button', { name: 'shared trigger' }).focus();
        await screen.findByText('outer content');
        const innerAction = await screen.findByRole('button', { name: 'inner action' });
        innerAction.focus();
        await wait();
        flushSync();
        expect(innerAction).toHaveFocus();
        expect(screen.queryByText('outer content')).toBe(null);
    });
});
