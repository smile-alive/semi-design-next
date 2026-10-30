import { fireEvent, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FormState } from '../interface';
import { getInput, input, renderForm, select, settle, typeInto } from './helpers';

const muji = [{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }];

describe('Svelte Form-change', () => {
    // known limitation, as in the other frameworks: mounting a field does not call the Form's onChange
    it('onChange：字段卸载时在同一次更新之后触发一次', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { store } = renderForm({ onChange }, [input('name'), select()]);
        expect(onChange).not.toHaveBeenCalled();
        for (const spec of store.fields) spec.shown = false;
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: {} });
    });

    it('onChange：字段内部值更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, [input('name')]);
        await typeInto(getInput(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: { name: 'semi' }, errors: {}, touched: { name: true } });
    });

    it('onChange：字段内部错误状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, [input('name', { rules: muji, trigger: 'change' })]);
        await typeInto(getInput(), 'semi');
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
        expect(onChange).toHaveBeenLastCalledWith({ values: { name: 'semi' }, errors: { name: 'not muji' }, touched: { name: true } });
    });

    it('onChange：字段内部 touched 状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, [input('name')]);
        await fireEvent.focusOut(getInput());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: { name: true } });
    });
});

describe('Svelte Form 状态快照', () => {
    const renderNestedForm = (props: Record<string, unknown>) => renderForm({ initValues: { user: { name: 'a' }, address: { city: 'x' } }, ...props }, [input('user.name'), input('address.city')]).api();

    it('每次变化都交出新的 values，并保留未变化的子树', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const onValueChange = vi.fn<(values: Record<string, any>) => void>();
        const formApi = renderNestedForm({ onChange, onValueChange });
        formApi.setValue('user.name', 'b');
        await settle();
        formApi.setValue('user.name', 'c');
        await settle();
        const [first, second] = onValueChange.mock.calls.map(([values]) => values);
        expect(second).not.toBe(first);
        expect(second.user).not.toBe(first.user);
        expect(first.user.name).toBe('b');
        expect(second.user.name).toBe('c');
        expect(second.address).toBe(first.address);
        const [firstState, secondState] = onChange.mock.calls.map(([formState]) => formState);
        expect(secondState).not.toBe(firstState);
        expect(secondState.values).not.toBe(firstState.values);
        expect(firstState.values?.user.name).toBe('b');
    });

    it('每次变化都交出新的 errors 与 touched，并保留未变化的子树', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const formApi = renderNestedForm({ onChange });
        formApi.setError('user.name', 'e1');
        formApi.setError('address.city', 'e2');
        formApi.setTouched('user.name', true);
        formApi.setTouched('address.city', true);
        await settle();
        const states = onChange.mock.calls.map(([formState]) => formState);
        expect(states).toHaveLength(4);
        expect(states[1].errors).not.toBe(states[0].errors);
        expect(states[0].errors).toEqual({ user: { name: 'e1' } });
        expect(states[1].errors?.user).toBe(states[0].errors?.user);
        expect(states[3].touched).not.toBe(states[2].touched);
        expect(states[2].touched).toEqual({ user: { name: true } });
        expect(states[3].touched?.user).toBe(states[2].touched?.user);
    });
});
