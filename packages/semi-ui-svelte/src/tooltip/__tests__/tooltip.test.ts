import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TooltipProps } from '../interface';
import TooltipFixture from './tooltip-fixture.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Store = { value?: boolean; accept: boolean; log: string[]; shown: boolean; child: boolean; focus: boolean; arrow: boolean };

const popup = () => document.querySelector<HTMLElement>('.semi-tooltip-wrapper');
const shown = () => document.querySelector<HTMLElement>('.semi-tooltip-wrapper-show');

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(props: Omit<TooltipProps, 'visible' | 'children' | 'child' | 'content' | 'arrow'> = {}, { mode = 'uncontrolled' as Mode, ...init }: Partial<Store> & { mode?: Mode } = {}) {
    const store = createStore<Store>({ accept: true, log: [], shown: true, child: false, focus: false, arrow: false, ...init });
    const result = render(TooltipFixture, { props: { mode, store, props: { motion: false, trigger: 'click', ...props } } });
    flushSync();
    const trigger = () => (store.child ? screen.getByRole('button', { name: 'trigger' }) : screen.getByText('trigger'));
    const click = async (target: Element = trigger()) => {
        await fireEvent.mouseDown(target);
        await fireEvent.click(target);
        await settle();
    };
    const api = () => {
        const tip = result.component.api();
        if (!tip) throw new Error('Tooltip 尚未挂载');
        return tip;
    };
    return { store, trigger, click, api, ...result };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Tooltip', () => {
    it('点击打开、内部点击保持打开、外部点击关闭并移除弹层', async () => {
        const { store, click, trigger } = setup();
        expect(popup()).toBe(null);
        await click();
        expect(shown()).not.toBe(null);
        expect(popup()?.parentElement).toBe(document.body);
        expect(screen.getByText('content')).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-describedby', popup()?.id);
        await click(screen.getByText('content'));
        expect(shown()).not.toBe(null);
        await click(screen.getByText('outside'));
        expect(popup()).toBe(null);
        expect(trigger()).not.toHaveAttribute('aria-describedby');
        expect(store.log).toEqual(['open', 'change true', 'afterOpen', 'outside true', 'change false', 'afterClose']);
    });

    it('内容里的 Portal 移到 body，在其中按下鼠标不算点击外部', async () => {
        const { click } = setup();
        await click();
        const inner = screen.getByRole('button', { name: 'in portal' });
        expect(popup()?.contains(inner)).toBe(false);
        await click(inner);
        expect(shown()).not.toBe(null);
        await click(screen.getByText('outside'));
        expect(popup()).toBe(null);
        expect(inner.isConnected).toBe(false);
    });

    it('非函数触发器包进 span：文本保持行内，带 data-popupid 与 tabindex', () => {
        const { trigger } = setup();
        const span = trigger();
        expect(span).toHaveClass('semi-tooltip-trigger-wrapper');
        expect(span).toHaveAttribute('tabindex', '0');
        expect(span.dataset.popupid).toMatch(/^semi-tooltip-/);
        expect(span.style.display).toBe('');
    });

    it('child snippet：触发属性展开到使用方元素上，没有包装 span', async () => {
        const { click, trigger } = setup({}, { child: true });
        expect(trigger().closest('.semi-tooltip-trigger-wrapper')).toBe(null);
        expect(trigger().dataset.popupid).toMatch(/^semi-tooltip-/);
        await click();
        expect(trigger()).toHaveAttribute('aria-describedby', popup()?.id);
    });

    it('role=dialog 时按钮触发器带 aria-haspopup、aria-expanded 与 aria-controls，名称只落弹层', async () => {
        const { click, trigger } = setup({ role: 'dialog', 'aria-label': '对话框' }, { child: true });
        expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        expect(trigger()).not.toHaveAttribute('aria-controls');
        await click();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(trigger()).toHaveAttribute('aria-controls', popup()?.id);
        expect(trigger()).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('dialog', { name: '对话框' })).toBe(popup());
    });

    it('role=dialog 不给包装 span 加弹层状态', () => {
        const { trigger } = setup({ role: 'dialog' });
        expect(trigger()).not.toHaveAttribute('aria-haspopup');
        expect(trigger()).not.toHaveAttribute('aria-expanded');
    });

    it('bind:visible：交互写回父级，父级改值开合弹层，每次变化只通知一次', async () => {
        const { store, click } = setup({}, { mode: 'bind', value: false });
        await click();
        expect(store.value).toBe(true);
        expect(shown()).not.toBe(null);
        store.value = false;
        await settle();
        expect(popup()).toBe(null);
        store.value = true;
        await settle();
        expect(shown()).not.toBe(null);
        await click(screen.getByText('outside'));
        expect(store.value).toBe(false);
        expect(popup()).toBe(null);
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change true', 'change false']);
    });

    it('函数绑定：setter 拒绝时弹层保持关闭，只通知请求', async () => {
        const { store, click } = setup({}, { mode: 'function', value: false, accept: false });
        await click();
        expect(popup()).toBe(null);
        expect(store.log).toEqual(['set true', 'change true']);
        store.accept = true;
        await click();
        expect(store.value).toBe(true);
        expect(shown()).not.toBe(null);
    });

    it('单向传值只作初值：初值 true 时挂载即打开，交互在本地覆盖', async () => {
        const { store } = setup({}, { mode: 'one-way', value: true });
        await settle();
        expect(shown()).not.toBe(null);
        await fireEvent.mouseDown(screen.getByText('outside'));
        await settle();
        expect(popup()).toBe(null);
        expect(store.value).toBe(true);
    });

    it('不传 visible 时反复开合，onVisibleChange 每次变化只通知一次', async () => {
        const { store, click } = setup();
        await click();
        await click(screen.getByText('outside'));
        await click();
        await click(screen.getByText('outside'));
        expect(popup()).toBe(null);
        expect(store.log.filter((entry) => entry.startsWith('change'))).toEqual(['change true', 'change false', 'change true', 'change false']);
    });

    it('Escape 关闭弹层，onEscKeyDown 收到原生事件', async () => {
        const { store, click, trigger } = setup();
        await click();
        await fireEvent.keyDown(trigger(), { key: 'Escape' });
        await settle();
        expect(popup()).toBe(null);
        expect(store.log).toContain('esc true');
    });

    it('content 的 initialFocusRef 在弹层打开后获得焦点', async () => {
        const { click } = setup({}, { focus: true });
        await click();
        expect(screen.getByRole('textbox', { name: 'inner' })).toHaveFocus();
    });

    it('class、style 只落弹层，style 的背景色给箭头着色', async () => {
        const { click } = setup({ class: 'own', style: 'background-color: red' });
        await click();
        expect(popup()).toHaveClass('own');
        expect(popup()?.style.backgroundColor).toBe('red');
        expect(popup()?.querySelector('svg')?.getAttribute('style')).toContain('red');
    });

    it('arrow snippet 替换箭头，showArrow=false 不渲染箭头', async () => {
        const { click } = setup({}, { arrow: true });
        await click();
        expect(screen.getByTestId('custom-arrow')).toBeInTheDocument();
        expect(popup()?.querySelector('svg')).toBe(null);
        expect(popup()).toHaveClass('semi-tooltip-with-arrow');
    });

    it('showArrow=false 不渲染箭头', async () => {
        const { click } = setup({ showArrow: false });
        await click();
        expect(popup()?.querySelector('svg')).toBe(null);
        expect(popup()).not.toHaveClass('semi-tooltip-with-arrow');
    });

    it('condition=false 阻止打开并关闭已显示的弹层', async () => {
        const { click, store } = setup({ condition: false });
        await click();
        expect(popup()).toBe(null);
        expect(store.log).toEqual([]);
    });

    it('clickToHide 在弹层内点击时关闭', async () => {
        const { click } = setup({ clickToHide: true });
        await click();
        await click(screen.getByText('content'));
        expect(popup()).toBe(null);
    });

    it('触发器后没有多余的文本节点，两种触发写法都一样', () => {
        for (const child of [false, true]) {
            document.body.replaceChildren();
            const { trigger } = setup({}, { child });
            const texts: string[] = [];
            for (let node = trigger().nextSibling; node; node = node.nextSibling) {
                // empty text nodes are Svelte's block anchors
                if (node.nodeType === Node.TEXT_NODE && node.textContent) texts.push(JSON.stringify(node.textContent));
            }
            expect(texts).toEqual([]);
        }
    });

    it('focus 触发：首次打开的同一帧内失焦，弹层按 mouseLeaveDelay 关闭', async () => {
        const { store, trigger } = setup({ trigger: 'focus', mouseEnterDelay: 0, mouseLeaveDelay: 20 }, { child: true });
        trigger().focus();
        trigger().blur();
        await new Promise((resolve) => setTimeout(resolve, 150));
        flushSync();
        expect(popup()).toBe(null);
        expect(store.log.filter((entry) => entry !== 'afterOpen')).toEqual(['open', 'change true', 'change false', 'afterClose']);
    });

    it('keepDOM 关闭后保留弹层节点，再次打开复用', async () => {
        const { click } = setup({ keepDOM: true });
        await click();
        const node = popup();
        await click(screen.getByText('outside'));
        expect(popup()).toBe(node);
        expect(shown()).toBe(null);
        await click();
        expect(shown()).toBe(node);
    });

    it('卸载时移除弹层并补发 afterClose', async () => {
        const { click, store } = setup();
        await click();
        const node = popup();
        store.shown = false;
        flushSync();
        expect(node?.isConnected).toBe(false);
        expect(store.log.at(-1)).toBe('afterClose');
    });

    it('对外方法：getPopupId 与弹层 id 一致，hide() 关闭弹层', async () => {
        const { click, api } = setup({ wrapperId: 'tip-id' });
        await click();
        expect(api().getPopupId()).toBe('tip-id');
        expect(popup()?.id).toBe('tip-id');
        api().hide();
        await settle();
        expect(popup()).toBe(null);
    });

    it('读取全局默认值，显式传值优先', async () => {
        semiGlobal.config = { overrideDefaultProps: { Tooltip: { showArrow: false, position: 'bottom' } } };
        const { click } = setup({ position: 'left' });
        await click();
        expect(popup()?.querySelector('svg')).toBe(null);
        expect(popup()).toHaveAttribute('x-placement', 'left');
    });

    it('mouseLeaveDelay 小于 mouseEnterDelay 时告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ mouseEnterDelay: 100, mouseLeaveDelay: 0 });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('mouseLeaveDelay'));
        warn.mockRestore();
    });
});
