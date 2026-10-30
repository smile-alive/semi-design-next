import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './special-trigger.svelte';

type Store = NonNullable<Parameters<typeof Fixture>[1]>['store'];

const shown = () => document.querySelector<HTMLElement>('.semi-tooltip-wrapper-show');

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

function setup(init: Partial<Store> = {}) {
    const store = createStore<Store>({ kind: 'button', tip: { trigger: 'click', wrapperClassName: 'wrapper' }, props: {}, ...init });
    render(Fixture, { props: { store } });
    flushSync();
    const span = () => document.querySelector<HTMLElement>('.wrapper') as HTMLElement;
    return { store, span };
}

describe('Svelte Tooltip 的特殊触发器', () => {
    it('禁用的 Button 在 click 触发下由 span 承接指针：span 光标禁用、按钮不接收指针，点 span 打开', async () => {
        const { span } = setup({ props: { disabled: true } });
        const button = screen.getByRole('button');
        expect(span()).toHaveStyle({ cursor: 'not-allowed', display: 'inline-block' });
        expect(button).toHaveStyle({ pointerEvents: 'none' });
        expect(span()).toHaveAttribute('tabindex', '0');
        await fireEvent.click(span());
        await settle();
        expect(shown()).not.toBeNull();
        expect(span()).toHaveAttribute('aria-describedby', document.querySelector('.semi-tooltip-wrapper')?.id);
    });

    it('禁用的 Button 在 hover 触发下不改指针与光标，custom 触发只让按钮忽略指针', () => {
        const hover = setup({ tip: { trigger: 'hover', wrapperClassName: 'wrapper' }, props: { disabled: true } });
        expect(screen.getByRole('button')).not.toHaveStyle({ pointerEvents: 'none' });
        expect(hover.span().style.cursor).toBe('');
        document.body.replaceChildren();
        const custom = setup({ tip: { trigger: 'custom', wrapperClassName: 'wrapper' }, props: { disabled: true } });
        expect(screen.getByRole('button')).toHaveStyle({ pointerEvents: 'none' });
        expect(custom.span().style.cursor).toBe('');
    });

    it('loading 的 Button：span 只有一个 Tab 停靠点，描述与弹层状态在按钮上，点 span 打开', async () => {
        const { span } = setup({ tip: { trigger: 'click', role: 'dialog', 'aria-label': 'name', wrapperClassName: 'wrapper' }, props: { loading: true } });
        const button = screen.getByRole('button');
        expect(span()).toHaveAttribute('tabindex', '-1');
        expect(button).toHaveStyle({ pointerEvents: 'none' });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.click(span());
        await settle();
        const popup = document.querySelector('.semi-tooltip-wrapper-show');
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveAttribute('aria-controls', popup?.id);
        expect(span()).not.toHaveAttribute('aria-expanded');
    });

    it('loading 的 Button 在 tooltip 角色下由按钮持有描述，span 不重复', async () => {
        const { span } = setup({ tip: { trigger: 'click', wrapperClassName: 'wrapper' }, props: { loading: true } });
        await fireEvent.click(span());
        await settle();
        expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', document.querySelector('.semi-tooltip-wrapper')?.id);
        expect(span()).not.toHaveAttribute('aria-describedby');
    });

    it('loading 的 Button 在 hover 触发下也由 span 承接指针', () => {
        setup({ tip: { trigger: 'hover', wrapperClassName: 'wrapper' }, props: { loading: true } });
        expect(screen.getByRole('button')).toHaveStyle({ pointerEvents: 'none' });
    });

    it('按钮自己的 aria-describedby 保留在弹层描述之前', async () => {
        const { span } = setup({ props: { loading: true, 'aria-describedby': 'own' } });
        await fireEvent.click(span());
        await settle();
        expect(screen.getByRole('button').getAttribute('aria-describedby')).toMatch(/^own semi-tooltip-/);
    });

    it('同时 disabled 与 loading 的 Button 按禁用处理，hover 下不改指针', () => {
        setup({ tip: { trigger: 'hover', wrapperClassName: 'wrapper' }, props: { disabled: true, loading: true } });
        expect(screen.getByRole('button')).not.toHaveStyle({ pointerEvents: 'none' });
    });

    it('IconButton 同样识别', async () => {
        const { span } = setup({ kind: 'icon-button', props: { disabled: true } });
        expect(screen.getByRole('button')).toHaveStyle({ pointerEvents: 'none' });
        await fireEvent.click(span());
        await settle();
        expect(shown()).not.toBeNull();
    });

    it('wrapWhenSpecial=false 时不处理禁用的 Button', () => {
        const { span } = setup({ tip: { trigger: 'click', wrapWhenSpecial: false, wrapperClassName: 'wrapper' }, props: { disabled: true } });
        expect(screen.getByRole('button')).not.toHaveStyle({ pointerEvents: 'none' });
        expect(span().style.cursor).toBe('');
    });

    it('block 的 Button 让 span 占满宽度', () => {
        const { span } = setup({ props: { block: true } });
        expect(span()).toHaveStyle({ width: '100%' });
    });

    it('被 ButtonGroup 禁用的按钮同样被识别，组的分隔线不影响单一子元素的判断', async () => {
        const { span } = setup({ kind: 'group' });
        expect(document.querySelector('.semi-button-group-line')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'trigger' })).toHaveStyle({ pointerEvents: 'none' });
        await fireEvent.click(span());
        await settle();
        expect(shown()).not.toBeNull();
    });

    it('按钮状态变化时 span 跟着更新：恢复可用后按钮成为唯一的 Tab 停靠点', async () => {
        const { store, span } = setup({ props: { disabled: true } });
        expect(span()).toHaveAttribute('tabindex', '0');
        store.props.disabled = false;
        await settle();
        expect(span()).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('button')).not.toHaveStyle({ pointerEvents: 'none' });
        expect(span().style.cursor).toBe('');
    });

    it('Switch：输入框持有描述，span 不重复且只有输入框是 Tab 停靠点', async () => {
        const { span } = setup({ kind: 'switch', tip: { trigger: 'click', wrapperClassName: 'wrapper' } });
        expect(span()).toHaveAttribute('tabindex', '-1');
        await fireEvent.click(screen.getByRole('switch'));
        await settle();
        const id = document.querySelector('.semi-tooltip-wrapper')?.id;
        expect(screen.getByRole('switch')).toHaveAttribute('aria-describedby', id);
        expect(span()).not.toHaveAttribute('aria-describedby');
    });

    it('Checkbox：输入框持有描述，span 不重复且只有输入框是 Tab 停靠点', async () => {
        const { span } = setup({ kind: 'checkbox', tip: { trigger: 'click', wrapperClassName: 'wrapper' } });
        expect(span()).toHaveAttribute('tabindex', '-1');
        await fireEvent.click(screen.getByRole('checkbox'));
        await settle();
        const id = document.querySelector('.semi-tooltip-wrapper')?.id;
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-describedby', id);
        expect(span()).not.toHaveAttribute('aria-describedby');
    });

    it('禁用的 Switch、Checkbox 在 click 触发下由 span 承接指针', async () => {
        for (const kind of ['switch', 'checkbox'] as const) {
            document.body.replaceChildren();
            const { span } = setup({ kind, props: { disabled: true } });
            const control = screen.getByRole(kind);
            expect(control.parentElement === span() ? control : (control.closest('.semi-switch, .semi-checkbox') as HTMLElement)).toHaveStyle({ pointerEvents: 'none' });
            expect(span()).toHaveStyle({ cursor: 'not-allowed' });
            await fireEvent.click(span());
            await settle();
            expect(shown()).not.toBeNull();
        }
    });

    it('不对原生子元素做特殊处理，也不告警已描述的组件', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        setup({ kind: 'switch' });
        expect(warn.mock.calls.filter(([message]) => String(message).includes('focusable element'))).toHaveLength(0);
        warn.mockRestore();
    });
});
