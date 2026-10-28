import { StrictMode, useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form, Select, Button } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

function renderForm(props) {
    return render(<Form {...props} />);
}

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

const getInput = (field) => document.querySelector(`[x-field-id="${field}"] input`);
const getErrorMessage = (field) => document.querySelector(`[x-field-id="${field}"] .semi-form-field-error-message`);

describe('Form-formApi', () => {
    it('StrictMode 模拟重新挂载后，useForm api 保持绑定', () => {
        // StrictMode unmounts and mounts the same Form instance again, which unbinds and rebinds the useForm api
        let formApi;
        let formValues;
        const HookForm = () => {
            const [api, , values] = Form.useForm();
            // handed to the test from an effect, so render never writes outer variables
            useEffect(() => {
                formApi = api;
                formValues = values;
            });
            return (
                <Form form={api} initValues={{ name: 'semi' }}>
                    <Form.Input field="name" />
                </Form>
            );
        };
        render(
            <StrictMode>
                <HookForm />
            </StrictMode>
        );
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        expect(formValues).toEqual({ name: 'semi' });
        void act(() => formApi.setValue('name', 'design'));
        expect(getInput('name')).toHaveValue('design');
        expect(formValues).toEqual({ name: 'design' });
    });

    it('StrictMode 下 getFormApi 交出已挂载 Form 的 api', () => {
        let formApi;
        render(
            <StrictMode>
                <Form getFormApi={(api) => (formApi = api)} initValues={{ name: 'semi' }}>
                    <Form.Input field="name" />
                </Form>
            </StrictMode>
        );
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        void act(() => formApi.setValue('name', 'design'));
        expect(getInput('name')).toHaveValue('design');
    });

    it('Form 卸载后再次挂载时，重新绑定 useForm api', async () => {
        let formApi;
        const HookForm = () => {
            const [api] = Form.useForm();
            const [show, setShow] = useState(true);
            useEffect(() => {
                formApi = api;
            });
            return (
                <>
                    <Button onClick={() => setShow((s) => !s)}>toggle</Button>
                    {show ? (
                        <Form form={api} initValues={{ name: 'semi' }}>
                            <Form.Input field="name" />
                        </Form>
                    ) : null}
                </>
            );
        };
        render(<HookForm />);
        expect(formApi.getValues()).toEqual({ name: 'semi' });

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi.getValues()).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormApi.getValues() is called before Form'));
        warn.mockRestore();

        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        void act(() => formApi.setValue('name', 'design'));
        expect(getInput('name')).toHaveValue('design');
    });

    it('formApi-getFieldExist', () => {
        let formApi = null;
        const getFormApi = vi.fn<(api: FormApi) => void>((api) => {
            formApi = api;
        });
        renderForm({ getFormApi, children: FormInput });
        expect(getFormApi).toHaveBeenCalledTimes(1);
        expect(formApi.getFieldExist('name')).toEqual(true);
        expect(formApi.getFieldExist('business')).toEqual(false);
    });

    it('formApi-getInitValue / getInitValues', () => {
        let formApi!: FormApi;
        let getFormApi = (api: FormApi) => {
            formApi = api;
        };
        let initValues = {
            name: 'semi',
            business: 'abc',
        };
        renderForm({ initValues, getFormApi, children: fields });
        expect(formApi.getInitValue('name')).toEqual('semi');
        expect(formApi.getInitValue('business')).toEqual('abc');
        expect(formApi.getInitValue('notExistField')).toEqual(undefined);
        expect(formApi.getInitValue()).toEqual(initValues);
        expect(formApi.getInitValues()).toEqual(initValues);
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-getTouched', () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        renderForm({ getFormApi, children: fields });
        fireEvent.blur(getInput('name'));
        expect(formApi.getTouched('name')).toEqual(true);
        expect(!formApi.getTouched('business')).toEqual(true);
    });

    it('formApi-getValue', async () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        renderForm({ getFormApi, children: fields });
        expect(formApi.getValue('name')).toEqual(undefined);
        await userEvent.type(getInput('name'), 'semi');
        expect(formApi.getValue('name')).toEqual('semi');
        expect(formApi.getValue()).toEqual({ name: 'semi' });
        expect(formApi.getValues()).toEqual({ name: 'semi' });
    });

    it('formApi-getError', async () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        let errorMessage = 'not muji';
        renderForm({
            getFormApi,
            children: <Form.Input field="name" rules={[{ validator: (_rule, value) => value === 'muji', message: errorMessage }]} trigger="change" />,
        });
        fireEvent.change(getInput('name'), { target: { value: 'semi' } });
        await waitFor(() => expect(formApi.getError('name')).toEqual(errorMessage));
        expect(getErrorMessage('name')).toHaveTextContent(errorMessage);
    });

    it('formApi-getFormState', async () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        renderForm({
            getFormApi,
            children: <Form.Input field="name" rules={[{ validator: (_rule, value) => value === 'muji', message: 'not muji' }]} trigger="change" />,
        });
        fireEvent.change(getInput('name'), { target: { value: 'semi' } });
        let expectFormState = {
            values: { name: 'semi' },
            errors: { name: 'not muji' },
            touched: { name: true },
        };
        await waitFor(() => expect(formApi.getFormState()).toEqual(expectFormState));
    });

    it('formApi-setError', () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        const { container } = renderForm({
            getFormApi,
            children: <Form.Input fieldClassName="test" field="name" trigger="change" />,
        });
        let errorMessage = 'not muji';
        void act(() => formApi.setError('name', errorMessage));
        let expectFormState = {
            values: {},
            errors: { name: errorMessage },
            touched: {},
        };
        expect(formApi.getFormState()).toEqual(expectFormState);
        expect(container.querySelector(`.test .semi-form-field-error-message`)).toHaveTextContent(new RegExp(`^${errorMessage}$`));
    });

    it('formApi-setTouched', () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        renderForm({ getFormApi, children: fields });
        void act(() => formApi.setTouched('business', true));
        expect(formApi.getTouched('business')).toEqual(true);
        expect(!formApi.getTouched('name')).toEqual(true);
        void act(() => formApi.setTouched('business', false));
        expect(formApi.getTouched('business')).toEqual(false);
    });

    it('formApi-setValue', () => {
        let formApi = null;
        let getFormApi = (api) => {
            formApi = api;
        };
        let expectVal = 'semi';
        renderForm({ getFormApi, children: fields });
        void act(() => formApi.setValue('name', expectVal));

        expect(formApi.getValue('name')).toEqual(expectVal);
        expect(getInput('name')).toHaveValue(expectVal);
    });

    it('formApi-reset', async () => {
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
            initValues: {
                name: 'a',
            },
        });
        fireEvent.change(getInput('name'), { target: { value: 'b' } });
        expect(getInput('name')).toHaveValue('b');
        void act(() => formApi.reset());
        expect(getInput('name')).toHaveValue('a');
        expect(formApi.getFormState()).toEqual({
            values: { name: 'a' },
            errors: {},
            touched: {},
        });
    });

    it('formApi-setValues 覆盖模式', () => {
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
            initValues: {
                name: 'a',
                extraKeyA: 'uno',
            },
        });
        let expectVal = {
            name: 'semi',
            business: 'abc',
            extraKeyB: 'Kay tse',
        };
        void act(() => formApi.setValues(expectVal, { isOverride: true }));
        expect(formApi.getValue()).toEqual(expectVal);
        expect(getInput('name')).toHaveValue('semi');
        expect(document.querySelector('[x-field-id="business"] .semi-select-selection-text')).toHaveTextContent('Abc');
    });

    it('formApi-setValues 合并模式', () => {
        let formApi = null;
        let initValues = {
            name: 'a',
            extraKeyA: 'uno',
        };
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
            initValues,
        });
        let expectVal = {
            name: 'semi',
            business: 'abc',
            extraKeyB: 'not exist',
        };
        let mergeVal = { name: 'semi', business: 'abc', extraKeyA: 'uno' };
        void act(() => formApi.setValues(expectVal));
        expect(formApi.getValue()).toEqual(mergeVal);
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-validate：校验所有字段与特殊字段', async () => {
        let fields = (
            <>
                <Form.Input className="ab" field="a.b" validator={(val) => (val ? '' : 'ab-err')} />
                <Form.Input className="ac" field="a.c" validator={(val) => (val ? '' : 'ac-err')} />
            </>
        );
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        // React 19's act does not flush the render when its callback rejects, so the rejection is asserted inside it
        await act(() => expect(formApi.validate()).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } }));
        expect(formApi.getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent('ab-err');
        void act(() => formApi.reset());
        await act(() => expect(formApi.validate(['a.c'])).rejects.toEqual({ a: { c: 'ac-err' } }));
        expect(formApi.getFormState().errors).toEqual({ a: { c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toBeNull();
        expect(getErrorMessage('a.c')).toHaveTextContent('ac-err');
    });

    it('formApi-validate：嵌套字段', async () => {
        let fields = (
            <>
                <Form.Input className="ab" field="a.b" validator={(val) => (val ? '' : 'ab-err')} />
                <Form.Input className="ac" field="a.c" validator={(val) => (val ? '' : 'ac-err')} />
                <Form.Input className="e" field="e" validator={(val) => (val ? '' : 'e-err')} />
            </>
        );
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await expect(act(() => formApi.validate(['a']))).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(formApi.getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setValue：包含嵌套字段时', () => {
        let fields = (
            <>
                <Form.Input className="ab" field="a.b" validator={(val) => (val ? '' : 'ab-err')} />
                <Form.Input className="ac" field="a.c" validator={(val) => (val ? '' : 'ac-err')} />
                <Form.Input className="e" field="e" validator={(val) => (val ? '' : 'e-err')} />
            </>
        );
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        void act(() => formApi.setValue('a', { b: 'semi-b', c: 'semi-c' }));
        expect(formApi.getFormState().values).toEqual({ a: { b: 'semi-b', c: 'semi-c' } });
        expect(getInput('a.b')).toHaveValue('semi-b');
        expect(getInput('a.c')).toHaveValue('semi-c');
        expect(getInput('e')).toHaveValue('');
    });

    it('formApi-setEror：包含嵌套字段时', () => {
        let fields = (
            <>
                <Form.Input className="ab" field="a.b" validator={(val) => (val ? '' : 'ab-err')} />
                <Form.Input className="ac" field="a.c" validator={(val) => (val ? '' : 'ac-err')} />
                <Form.Input className="e" field="e" validator={(val) => (val ? '' : 'e-err')} />
            </>
        );
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        void act(() => formApi.setError('a', { b: 'ab-err', c: 'ac-err' }));
        expect(formApi.getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent(/^ab-err$/);
        expect(getErrorMessage('a.c')).toHaveTextContent(/^ac-err$/);
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setTouched：包含嵌套字段时', () => {
        let fields = (
            <>
                <Form.Input className="ab" field="a.b" validator={(val) => (val ? '' : 'ab-err')} />
                <Form.Input className="ac" field="a.c" validator={(val) => (val ? '' : 'ac-err')} />
                <Form.Input className="e" field="e" validator={(val) => (val ? '' : 'e-err')} />
            </>
        );
        let formApi!: FormApi;
        renderForm({
            children: fields,
            getFormApi: (api: FormApi) => {
                formApi = api;
            },
        });
        act(() => formApi.setTouched('a', { b: true, c: true }));
        expect(formApi.getFormState().touched).toEqual({ a: { b: true, c: true } });
    });

    it('formApi-setValue：字段路径精确匹配', () => {
        let formApi = null;
        const fields = (
            <>
                <Form.Input field="a.b" />
                <Form.Input field="a.c" />
                <Form.Input field="a.d" />
            </>
        );
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        void act(() => formApi.setValue('a.c', 'semi'));
        expect(formApi.getValue('a.c')).toEqual('semi');
        expect(getInput('a.b')).toHaveValue('');
        expect(getInput('a.c')).toHaveValue('semi');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue：字段路径属于父级聚合', () => {
        let formApi = null;
        const fields = (
            <>
                <Form.Input field="a.b" />
                <Form.Input field="a.c" />
                <Form.Input field="a.d" />
            </>
        );
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        void act(() => formApi.setValue('a', { b: 'semi', c: 'design' }));
        expect(formApi.getValue('a.b')).toEqual('semi');
        expect(formApi.getValue('a.c')).toEqual('design');

        expect(getInput('a.b')).toHaveValue('semi');
        expect(getInput('a.c')).toHaveValue('design');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue 数组字段路径，0 -> 3', () => {
        const fields = ({ values }) => {
            return (
                values.a &&
                values.a.map((effect, i) => (
                    <div key={effect.key}>
                        <Form.Input field={`a[${i}].name`} />
                        <Form.Input field={`a[${i}].type`} />
                    </div>
                ))
            );
        };
        let formApi = null;
        renderForm({
            children: fields,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        let targetValue = [
            { name: '0-name', type: '0-type' },
            { name: '1-name', type: '1-type' },
            { name: '2-name', type: '2-type' },
        ];
        void act(() => formApi.setValue('a', targetValue));
        expect(getInput('a[0].name')).toHaveValue('0-name');
        expect(getInput('a[0].type')).toHaveValue('0-type');
        expect(getInput('a[1].name')).toHaveValue('1-name');
        expect(getInput('a[1].type')).toHaveValue('1-type');
        expect(getInput('a[2].name')).toHaveValue('2-name');
        expect(getInput('a[2].type')).toHaveValue('2-type');
    });

    it('formApi-setValue 数组字段路径，1 -> 3，并新增字段', () => {
        const fields = ({ values }) => {
            return (
                values.a &&
                values.a.map((effect, i) => (
                    <div key={effect.key}>
                        <Form.Input field={`a[${i}].name`} />
                        <Form.Input field={`a[${i}].type`} />
                    </div>
                ))
            );
        };
        let formApi = null;
        renderForm({
            children: fields,
            initValues: {
                a: [{ name: 'semi', type: 'design' }],
            },
            getFormApi: (api) => {
                formApi = api;
            },
        });
        expect(getInput('a[0].name')).toHaveValue('semi');
        void act(() =>
            formApi.setValue('a', [
                { name: '0-name', type: '0-type' },
                { name: '1-name', type: '1-type' },
                { name: '2-name', type: '2-type' },
            ])
        );
        expect(getInput('a[0].name')).toHaveValue('0-name');
        expect(getInput('a[0].type')).toHaveValue('0-type');
        expect(getInput('a[1].name')).toHaveValue('1-name');
        expect(getInput('a[1].type')).toHaveValue('1-type');
        expect(getInput('a[2].name')).toHaveValue('2-name');
        expect(getInput('a[2].type')).toHaveValue('2-type');
    });

    it('formApi-validate：表单级校验器', async () => {
        const validatorSpy = vi.fn<() => { name: string }>(() => ({ name: 'from-validator' }));

        let formApi = null;
        renderForm({
            children: <Form.Input field="name" />,
            getFormApi: (api) => {
                formApi = api;
            },
            validator: validatorSpy,
        });
        await act(() => expect(formApi.validate()).rejects.toEqual({ name: 'from-validator' }));
        expect(validatorSpy).toHaveBeenCalled();
        expect(formApi.getFormState().errors).toEqual({ name: 'from-validator' });
        expect(getErrorMessage('name')).toHaveTextContent('from-validator');
    });

    it('formApi-validate：字段校验器返回的 ReactNode 错误会阻止提交', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        let formApi = null;
        renderForm({
            onSubmit,
            children: <Form.Input field="a" validator={() => <span>jsx-error</span>} />,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await expect(act(() => formApi.validate())).rejects.toHaveProperty('a');
        void act(() => formApi.submitForm());
        await screen.findByText('jsx-error');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Debug-SetBugDemo：validate 上报稀疏数组字段路径上的错误，reset 清除这些错误', async () => {
        const rules = [{ required: true, message: 'required' }];
        const paths = ['panels[11].start_time', 'panels[13].end_time', 'a.a1'];
        let formApi = null;
        renderForm({
            children: (
                <>
                    {paths.map((path) => (
                        <Form.Input key={path} field={path} rules={rules} />
                    ))}
                </>
            ),
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        paths.forEach((path) => {
            expect(formApi.getError(path)).toBe('required');
            expect(getErrorMessage(path)).toHaveTextContent('required');
        });
        void act(() => formApi.reset());
        expect(formApi.getFormState().errors).toEqual({});
        paths.forEach((path) => expect(getErrorMessage(path)).toBeNull());
    });

    // Rows are keyed by item while their fields are keyed by index, so removing a middle row unmounts a field path
    // that setValues has already refilled with the next item
    it('Debug-SetValuesDemo：setValues(isOverride) 删除中间行后，保留后续行的值', () => {
        const fields = ({ values }) =>
            values.effects &&
            values.effects.map((effect, i) => (
                <div key={effect.key}>
                    <Form.Input key={`effects[${i}].name`} field={`effects[${i}].name`} />
                </div>
            ));
        let formApi = null;
        renderForm({
            children: fields,
            initValues: {
                effects: [
                    { name: 'A', key: 'a' },
                    { name: 'B', key: 'b' },
                    { name: 'C', key: 'c' },
                ],
            },
            getFormApi: (api) => {
                formApi = api;
            },
        });
        const effects = formApi.getValue('effects').filter((effect) => effect.key !== 'b');
        void act(() => formApi.setValues({ ...formApi.getValue(), effects }, { isOverride: true }));
        expect(formApi.getValue('effects')).toEqual([
            { name: 'A', key: 'a' },
            { name: 'C', key: 'c' },
        ]);
        expect(getInput('effects[0].name')).toHaveValue('A');
        expect(getInput('effects[1].name')).toHaveValue('C');
        expect(getInput('effects[2].name')).toBeNull();

        void act(() => formApi.setValues({ ...formApi.getValue(), effects: [...formApi.getValue('effects'), { name: 'D', key: 'd' }] }, { isOverride: true }));
        expect(getInput('effects[2].name')).toHaveValue('D');
        expect(formApi.getValue('effects').map((effect) => effect.name)).toEqual(['A', 'C', 'D']);
    });
});
