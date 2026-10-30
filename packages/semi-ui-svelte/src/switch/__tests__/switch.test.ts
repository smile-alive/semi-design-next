import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import FallbackParent from './fallback-parent.svelte';
import SwitchModes from './switch-modes.svelte';

function setup(mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: boolean, accept = true) {
    const store = createStore<{ value: boolean | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(SwitchModes, { props: { mode, store } });
    const input = screen.getByRole('switch') as HTMLInputElement;
    const click = async () => {
        await fireEvent.click(input);
        flushSync();
    };
    return { store, input, click };
}

describe('Svelte Switch 受控值（$bindable）', () => {
    it('非受控：点击切换，onChange 收到新值', async () => {
        const { store, input, click } = setup('uncontrolled');
        expect(input.checked).toBe(false);
        await click();
        expect(input.checked).toBe(true);
        await click();
        expect(input.checked).toBe(false);
        expect(store.log).toEqual(['change true', 'change false']);
    });

    it('bind:checked：点击写回父级，父级改值同步到组件', async () => {
        const { store, input, click } = setup('bind', false);
        await click();
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
    });

    it('bind:checked 重置为 undefined 后显示未选中', async () => {
        const { store, input, click } = setup('bind', false);
        await click();
        expect(input.checked).toBe(true);
        store.value = undefined;
        flushSync();
        expect(input.checked).toBe(false);
        expect(input.closest('.semi-switch')?.classList.contains('semi-switch-checked')).toBe(false);
    });

    it('函数绑定：setter 拒绝时组件保持原值，DOM 也不翻转', async () => {
        const { store, input, click } = setup('function', false, false);
        await click();
        expect(store.log).toEqual(['set true', 'change true']);
        expect(store.value).toBe(false);
        expect(input.checked).toBe(false);
        expect(input.closest('.semi-switch')?.classList.contains('semi-switch-checked')).toBe(false);
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, input, click } = setup('function', false, true);
        await click();
        expect(store.value).toBe(true);
        expect(input.checked).toBe(true);
    });

    it('单向传值：组件在本地覆盖并翻转，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, input, click } = setup('one-way', false);
        await click();
        expect(store.value).toBe(false);
        expect(input.checked).toBe(true);
        store.value = true;
        flushSync();
        store.value = false;
        flushSync();
        expect(input.checked).toBe(false);
    });

    it('带 fallback 的 bindable 绑定到 undefined 时抛错', () => {
        expect(() => render(FallbackParent)).toThrow(/props_invalid_value|bind/);
    });
});
