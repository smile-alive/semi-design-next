import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form, Select } from '@fibrae/semi-ui-react';
import type { FormState } from '@fibrae/semi-ui-react/form/interface';

const Option = Select.Option;
const FormSelect = (
    <Form.Select style={{ width: 200 }} field="business" label="business">
        <Option value="abc">Abc</Option>
        <Option value="hotsoon">Hotsoon</Option>
        <Option value="topbuzz">TopBuzz</Option>
    </Form.Select>
);

const FormInput = <Form.Input field="name" />;

const fields = (
    <>
        {FormInput}
        {FormSelect}
    </>
);

const getInput = () => document.querySelector(`.${BASE_CLASS_PREFIX}-input`);

describe('Form-onChange', () => {
    // Known limitation: mounting a field does not call the Form's onChange
    it('onChange：字段卸载时在同一次提交之后触发一次', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { rerender } = render(<Form onChange={onChange}>{fields}</Form>);
        expect(onChange).not.toHaveBeenCalled();
        rerender(<Form onChange={onChange}>{undefined}</Form>);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ values: {}, errors: {}, touched: {} });
    });

    it('onChange：字段内部值更新时触发', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(
            <Form onChange={onChange}>
                <Form.Input field="name" />
            </Form>
        );
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        let expectFormState = {
            values: { name: 'semi' },
            errors: {},
            touched: { name: true },
        };
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expectFormState);
    });

    it('onChange：字段内部错误状态更新时触发', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(
            <Form onChange={onChange}>
                <Form.Input field="name" rules={[{ validator: (_rule, value) => value === 'muji', message: 'not muji' }]} trigger="change" />
            </Form>
        );
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        let expectFormState = {
            values: { name: 'semi' },
            errors: { name: 'not muji' },
            touched: { name: true },
        };

        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
        expect(onChange).toHaveBeenLastCalledWith(expectFormState);
    });

    it('onChange：字段内部 touched 状态更新时触发', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(
            <Form onChange={onChange}>
                <Form.Input field="name" />
            </Form>
        );
        fireEvent.blur(getInput());
        let expectFormState = {
            values: {},
            errors: {},
            touched: { name: true },
        };
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expectFormState);
    });
});

describe('Form 状态快照', () => {
    const renderNestedForm = (props) => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)} initValues={{ user: { name: 'a' }, address: { city: 'x' } }} {...props}>
                <Form.Input field="user.name" />
                <Form.Input field="address.city" />
            </Form>
        );
        return formApi;
    };

    it('每次变化都交出新的 values，并保留未变化的子树', () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        const onValueChange = vi.fn<(values: FormState['values']) => void>();
        const formApi = renderNestedForm({ onChange, onValueChange });
        void act(() => formApi.setValue('user.name', 'b'));
        void act(() => formApi.setValue('user.name', 'c'));

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
        void act(() => formApi.setError('user.name', 'e1'));
        void act(() => formApi.setError('address.city', 'e2'));
        void act(() => formApi.setTouched('user.name', true));
        void act(() => formApi.setTouched('address.city', true));

        const states = onChange.mock.calls.map(([formState]) => formState);
        expect(states).toHaveLength(4);
        expect(states[1].errors).not.toBe(states[0].errors);
        expect(states[0].errors).toEqual({ user: { name: 'e1' } });
        expect(states[1].errors.user).toBe(states[0].errors.user);
        expect(states[3].touched).not.toBe(states[2].touched);
        expect(states[2].touched).toEqual({ user: { name: true } });
        expect(states[3].touched.user).toBe(states[2].touched.user);
    });
});
