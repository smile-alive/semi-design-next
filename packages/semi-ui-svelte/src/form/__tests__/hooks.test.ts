import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FormApi } from '../interface';
import useForm from '../use-form.svelte';
import HooksFixture from './b-hooks.svelte';
import { settle, typeInto } from './helpers';

type Probe = Parameters<NonNullable<ComponentProps<typeof HooksFixture>['onProbe']>>[0];

function renderHooks(field = 'a', initValues?: Record<string, unknown>, outside = false) {
    const store = createStore<{ field: string; initValues?: Record<string, unknown> }>({ field, initValues });
    let formApi: FormApi | undefined;
    const probes: Probe[] = [];
    const view = render(HooksFixture, {
        props: {
            store,
            outside,
            onApi: (api: FormApi) => (formApi = api),
            onProbe: (probe: Probe) => probes.push(probe),
        },
    });
    return { ...view, store, api: () => formApi as FormApi, probe: () => probes[0] };
}

const stateOf = (testId: string) => JSON.parse(screen.getByTestId(testId).textContent ?? '');
const inputOf = (field: string) => document.querySelector<HTMLInputElement>(`[x-field-id="${field}"] input`) as HTMLInputElement;

describe('Svelte Form hooks', () => {
    it('useFormApi 返回 getFormApi 交出的 api', async () => {
        const { api, probe } = renderHooks();
        expect(probe().formApi).toBe(api());
        probe().formApi.setValue('a', 'semi');
        await settle();
        expect(inputOf('a')).toHaveValue('semi');
    });

    it('useFormState 以最新的 values、errors 与 touched 重新渲染', async () => {
        renderHooks();
        await typeInto(inputOf('a'), 'semi');
        expect(stateOf('form-state')).toEqual({ values: { a: 'semi' }, errors: {}, touched: { a: true } });
    });

    it('useFieldState 读取单个字段，useFieldApi 写入该字段', async () => {
        const { probe } = renderHooks();
        const { fieldApi } = probe();
        fieldApi.setValue('semi');
        await settle();
        expect(inputOf('a')).toHaveValue('semi');
        expect(fieldApi.getValue()).toBe('semi');
        fieldApi.setError('bad');
        fieldApi.setTouched(true);
        await settle();
        expect(fieldApi.getError()).toBe('bad');
        expect(fieldApi.getTouched()).toBe(true);
        expect(stateOf('field-state')).toEqual({ value: 'semi', error: 'bad', touched: true });
    });

    it('useFieldState 与 useFieldApi 跟随返回字段名的函数', async () => {
        const { store, probe } = renderHooks('a', { a: 'A', b: 'B' });
        expect(stateOf('field-state').value).toBe('A');
        store.field = 'b';
        await settle();
        expect(stateOf('field-state').value).toBe('B');
        probe().fieldApi.setValue('semi');
        await settle();
        expect(inputOf('b')).toHaveValue('semi');
        expect(inputOf('a')).toHaveValue('A');
    });

    it('在 Form 之外调用时返回空对象，不抛错', () => {
        const { probe } = renderHooks('a', undefined, true);
        expect(probe().formApi).toEqual({});
        expect(probe().formState()).toEqual({});
        expect(stateOf('form-state')).toEqual({});
        expect(stateOf('field-state')).toEqual({});
    });
});

describe('Svelte useForm 挂载前的 formApi', () => {
    it('读取 Symbol 属性不抛错', () => {
        const { formApi } = useForm();
        expect(() => String(formApi)).not.toThrow();
        expect(Object.prototype.toString.call(formApi)).toBe('[object Object]');
    });

    it('不是 thenable，await 立即得到它本身', async () => {
        const { formApi } = useForm();
        expect((formApi as unknown as { then?: unknown }).then).toBeUndefined();
        await expect(Promise.resolve(formApi)).resolves.toBe(formApi);
    });
});
