/** @jsxImportSource vue */
import { defineComponent, nextTick } from 'vue';
import { fireEvent, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, type FormState } from '..';
import { FormInput, getInput, renderForm, selectWithOptions } from './fixtures/fields';

describe('Form-change', () => {
    // Known limitation: mounting a field does not emit the Form's change
    it('change：字段卸载时在同一次更新之后触发一次', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const Demo = defineComponent({
            props: { show: Boolean },
            setup(props) {
                return () => (
                    <Form onChange={onChange}>
                        {() =>
                            props.show ? (
                                <>
                                    <FormInput field="name" />
                                    {selectWithOptions()}
                                </>
                            ) : null
                        }
                    </Form>
                );
            },
        });
        const view = render(Demo, { props: { show: true } });
        expect(onChange).not.toHaveBeenCalled();
        await view.rerender({ show: false });
        await nextTick();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: {} });
    });

    it('change：字段内部值更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, () => <FormInput field="name" />);
        await fireEvent.update(getInput(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: { name: 'semi' }, errors: {}, touched: { name: true } });
    });

    it('change：字段内部错误状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, () => <FormInput field="name" rules={[{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }]} trigger="change" />);
        await fireEvent.update(getInput(), 'semi');
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
        expect(onChange).toHaveBeenLastCalledWith({
            values: { name: 'semi' },
            errors: { name: 'not muji' },
            touched: { name: true },
        });
    });

    it('change：字段内部 touched 状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onChange }, () => <FormInput field="name" />);
        await fireEvent.focusOut(getInput());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: { name: true } });
    });
});

describe('Form 状态快照', () => {
    const renderNestedForm = (props: Record<string, unknown>) =>
        renderForm({ initValues: { user: { name: 'a' }, address: { city: 'x' } }, ...props }, () => (
            <>
                <FormInput field="user.name" />
                <FormInput field="address.city" />
            </>
        )).api();

    it('每次变化都交出新的 values，并保留未变化的子树', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const onValueChange = vi.fn<(values: Record<string, any>) => void>();
        const formApi = renderNestedForm({ onChange, onValueChange });
        formApi.setValue('user.name', 'b');
        await nextTick();
        formApi.setValue('user.name', 'c');
        await nextTick();

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
        await nextTick();

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
