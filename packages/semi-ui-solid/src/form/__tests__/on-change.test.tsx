import { Show, createSignal } from 'solid-js';
import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type FormApi, type FormProps, type FormState, Form, FormInput, FormSelect } from '..';

const getInput = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;

describe('Form-onChange', () => {
    // Known limitation: mounting a field does not call the Form's onChange
    it('onChange：字段卸载时在同一次更新之后触发一次', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const [show, setShow] = createSignal(true);
        render(() => (
            <Form onChange={onChange}>
                <Show when={show()}>
                    <FormInput field="name" />
                    <FormSelect style={{ width: '200px' }} field="business" label="business">
                        <FormSelect.Option value="abc">Abc</FormSelect.Option>
                        <FormSelect.Option value="hotsoon">Hotsoon</FormSelect.Option>
                    </FormSelect>
                </Show>
            </Form>
        ));
        expect(onChange).not.toHaveBeenCalled();
        setShow(false);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: {} });
    });

    it('onChange：字段内部值更新时触发', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(() => (
            <Form onChange={onChange}>
                <FormInput field="name" />
            </Form>
        ));
        fireEvent.input(getInput(), { target: { value: 'semi' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: { name: 'semi' }, errors: {}, touched: { name: true } });
    });

    it('onChange：字段内部错误状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(() => (
            <Form onChange={onChange}>
                <FormInput field="name" rules={[{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }]} trigger="change" />
            </Form>
        ));
        fireEvent.input(getInput(), { target: { value: 'semi' } });
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
        expect(onChange).toHaveBeenLastCalledWith({ values: { name: 'semi' }, errors: { name: 'not muji' }, touched: { name: true } });
    });

    it('onChange：字段内部 touched 状态更新时触发', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(() => (
            <Form onChange={onChange}>
                <FormInput field="name" />
            </Form>
        ));
        fireEvent.focusOut(getInput());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: { name: true } });
    });
});

describe('Form 状态快照', () => {
    function renderNestedForm(props: FormProps) {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={{ user: { name: 'a' }, address: { city: 'x' } }} {...props}>
                <FormInput field="user.name" />
                <FormInput field="address.city" />
            </Form>
        ));
        return formApi as FormApi;
    }

    it('每次变化都交出新的 values，并保留未变化的子树', () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const onValueChange = vi.fn<(values: FormState['values']) => void>();
        const formApi = renderNestedForm({ onChange, onValueChange });
        formApi.setValue('user.name', 'b');
        formApi.setValue('user.name', 'c');

        const [first, second] = onValueChange.mock.calls.map(([values]) => values);
        expect(second).not.toBe(first);
        expect(second.user).not.toBe(first.user);
        expect(first.user.name).toBe('b');
        expect(second.user.name).toBe('c');
        expect(second.address).toBe(first.address);

        const [firstState, secondState] = onChange.mock.calls.map(([formState]) => formState);
        expect(secondState).not.toBe(firstState);
        expect(secondState.values).not.toBe(firstState.values);
        expect(firstState.values.user.name).toBe('b');
    });

    it('每次变化都交出新的 errors 与 touched，并保留未变化的子树', () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const formApi = renderNestedForm({ onChange });
        formApi.setError('user.name', 'e1');
        formApi.setError('address.city', 'e2');
        formApi.setTouched('user.name', true);
        formApi.setTouched('address.city', true);

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
