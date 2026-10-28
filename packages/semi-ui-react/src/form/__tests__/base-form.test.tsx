import { StrictMode, createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form, Select, Button } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { FormApi, FormHandle } from '@fibrae/semi-ui-react/form/interface';
import { sleep } from '@test/utils/react';

function renderForm(props) {
    const result = render(<Form {...props} />);
    return { ...result, rerender: (nextProps) => result.rerender(<Form {...nextProps} />) };
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

const FieldCls = `.${BASE_CLASS_PREFIX}-form-field`;
const labelSelector = `.${BASE_CLASS_PREFIX}-form-field-label`;
const getInput = (scope = '') => document.querySelector(`${scope} .${BASE_CLASS_PREFIX}-input`);

const fields = (
    <>
        {FormInput}
        {FormSelect}
    </>
);

describe('Form-baseForm', () => {
    it('className 与 style', () => {
        const { container } = renderForm({ className: 'form-test', style: { color: 'red' } });
        const form = container.querySelector('form.form-test');
        expect(form).not.toBeNull();
        expect(form).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('layout 布局', () => {
        const { container, rerender } = renderForm({});
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-vertical`)).not.toBeNull();
        rerender({ layout: 'horizontal' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-horizontal`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-vertical`)).toBeNull();
    });

    it('labelPosition', () => {
        const { container } = renderForm({ labelPosition: 'left', children: FormInput });
        expect(container.querySelector(FieldCls)).toHaveAttribute('x-label-pos', 'left');
    });

    it('labelWidth', () => {
        const { container, unmount } = renderForm({ labelWidth: 200, children: fields });
        let labels = container.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '200px' });
        expect(labels[1]).toHaveStyle({ width: '200px' });
        unmount();
        const { container: container2 } = renderForm({ labelWidth: '300px', children: fields });
        labels = container2.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '300px' });
        expect(labels[1]).toHaveStyle({ width: '300px' });
    });

    it('通过 component 声明字段', () => {
        const fields = () => (
            <>
                <Form.Input fieldClassName="role" field="Role" />
                <Form.Input fieldClassName="userName" field="UserName" />
            </>
        );
        const { container } = renderForm({ component: fields });
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
    });

    it('通过 render 声明字段', () => {
        const render = ({ formState }) => (
            <>
                <Form.Select fieldClassName="role" style={{ width: 120 }} field="Role" label="角色">
                    <Option value="admin">管理员</Option>
                    <Option value="user">普通用户</Option>
                    <Option value="guest">访客</Option>
                </Form.Select>
                <Form.Input fieldClassName="userName" field="UserName" label="用户名" />
                <Form.Input fieldClassName="password" field="Password" label="密码" />
                <code style={{ marginTop: 30 }}>{JSON.stringify(formState)}</code>
            </>
        );
        const { container } = renderForm({ render });
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
        expect(container.querySelector('.password')).not.toBeNull();
        fireEvent.change(getInput('.userName'), { target: { value: 'semi' } });
        expect(JSON.parse(container.querySelector('code').textContent).values).toEqual({ UserName: 'semi' });
    });

    it('通过 children 声明字段', () => {
        const { container } = renderForm({ children: <Form.Input fieldClassName="name" field="name" /> });
        expect(container.querySelector('.name')).not.toBeNull();
    });

    it('getFormApi 回调及其参数为有效函数', () => {
        let api = null;
        const getFormApi = vi.fn<(formApi: FormApi) => void>((formApi) => {
            api = formApi;
        });
        renderForm({ getFormApi, children: FormInput });
        expect(getFormApi).toHaveBeenCalledTimes(1);
        const formApis = ['setValue', 'setValues', 'setError', 'setTouched', 'submitForm', 'reset', 'getInitValue', 'getFieldExist', 'getFormState', 'getTouched', 'getValue', 'getError', 'validate'];
        for (const apiName of formApis) {
            expect(api[apiName]).toEqual(expect.any(Function));
        }
    });

    it('未校验时 onSubmit，由 formApi 触发', async () => {
        let api = null;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            getFormApi: (formApi) => {
                api = formApi;
            },
            onSubmit,
            children: (
                <>
                    <Form.Input field="input" />
                </>
            ),
        });
        void act(() => api.submitForm());
        // formApi.submitForm validates asynchronously before submitting
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({});
    });

    it('未校验时 onSubmit，由表单 DOM 事件触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({
            onSubmit,
            children: (
                <>
                    <Form.Input field="input" />
                </>
            ),
        });
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ input: 'semi' });
    });

    // issue #767: Enter in an input implicitly submits a form that has a submit button; the documented way to opt a
    // field out is preventing the default of its keydown
    it('表单提交 #767：按 Enter 提交表单，除非字段 onKeyDown 阻止默认行为', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            onSubmit,
            children: (
                <>
                    <Form.Input
                        field="UserName"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                            }
                        }}
                    />
                    <Form.Input field="Password" />
                    <Button htmlType="submit">submit</Button>
                </>
            ),
        });
        const [userName, password] = screen.getAllByRole('textbox');
        await userEvent.type(userName, 'semi{Enter}');
        await userEvent.type(password, 'design{Enter}');
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ UserName: 'semi', Password: 'design' });
    });

    it('onSubmitFail', async () => {
        let api = null;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        let emptyTips = "can't be empty";
        let validateName = (val) => {
            if (!val) {
                return emptyTips;
            }
            return undefined;
        };
        const { container } = renderForm({
            getFormApi: (formApi) => {
                api = formApi;
            },
            onSubmit,
            onSubmitFail,
            children: (
                <>
                    <Form.Input field="name" validator={validateName} />
                    <Form.Input field="name2" validator={validateName} />
                </>
            ),
        });
        void act(() => api.submitForm());
        await waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail.mock.calls[0][0]).toEqual({
            name: emptyTips,
            name2: emptyTips,
        });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-error-message`)).toHaveLength(2);
    });

    it('onReset', () => {
        let api = null;
        const onReset = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            onReset,
            children: FormInput,
            getFormApi: (formApi) => {
                api = formApi;
            },
            initValues: {
                name: 'a',
            },
        });
        fireEvent.change(getInput(), { target: { value: 'b' } });
        expect(getInput()).toHaveValue('b');
        void act(() => api.reset());
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('a');
    });

    it('allowEmpty', async () => {
        let api = null;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            getFormApi: (formApi) => {
                api = formApi;
            },
            allowEmpty: true,
            onSubmit,
            children: fields,
        });
        void act(() => api.submitForm());
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toStrictEqual({
            name: undefined,
            business: undefined,
        });
    });

    it('即使 Form 未设置 allowEmpty，Field 的 allowEmpty 也会保留值变为 undefined 后的 key', () => {
        let api = null;
        const toUndefined = (value) => (value === 'clear' ? undefined : value);
        renderForm({
            getFormApi: (formApi) => {
                api = formApi;
            },
            children: (
                <>
                    <Form.Input allowEmpty convert={toUndefined} field="kept" />
                    <Form.Input convert={toUndefined} field="dropped" />
                </>
            ),
        });
        const [kept, dropped] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-input`);
        fireEvent.change(kept, { target: { value: 'a' } });
        fireEvent.change(dropped, { target: { value: 'a' } });
        expect(api.getFormState().values).toStrictEqual({ kept: 'a', dropped: 'a' });
        fireEvent.change(kept, { target: { value: 'clear' } });
        fireEvent.change(dropped, { target: { value: 'clear' } });
        const values = api.getFormState().values;
        expect('kept' in values).toBe(true);
        expect(values.kept).toBeUndefined();
        expect('dropped' in values).toBe(false);
    });

    it('onValueChange', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            onValueChange,
            children: (
                <>
                    <Form.Input field="name" />
                </>
            ),
        });
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0][0]).toEqual({ name: 'semi' });
    });

    it('initValues', () => {
        const { container } = renderForm({
            initValues: {
                name: 'semi',
                business: 'abc',
            },
            children: fields,
        });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`)).toHaveTextContent(/^Abc$/);
        expect(getInput()).toHaveValue('semi');
    });

    it('labelAlign', () => {
        const { container, unmount } = renderForm({ children: fields });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).toHaveLength(2);
        unmount();
        const { container: container2 } = renderForm({ labelAlign: 'right', children: fields });
        expect(container2.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).toHaveLength(2);
        expect(container2.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).toHaveLength(0);
    });
    it('labelCol/wrapperCol', () => {
        const { container } = renderForm({
            wrapperCol: { span: 20 },
            labelCol: { span: 2 },
            children: fields,
        });
        const fieldsDom = container.querySelectorAll(FieldCls);
        expect(fieldsDom).toHaveLength(2);
        for (const field of fieldsDom) {
            const [labelBox, wrapperCol] = field.children;
            const labelCol = labelBox.querySelector(`.${BASE_CLASS_PREFIX}-col`);
            expect(labelCol).toHaveClass(`${BASE_CLASS_PREFIX}-col-2`);
            expect(labelCol.querySelector(labelSelector)).not.toBeNull();
            expect(wrapperCol).toHaveClass(`${BASE_CLASS_PREFIX}-col-20`);
            expect(wrapperCol.querySelector(labelSelector)).toBeNull();
        }
    });

    it('自动移除空 key', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            onValueChange,
            children: (
                <>
                    <Form.Input className="ab" field="a.b" />
                    <Form.Input className="arr" field="arr[1]" />
                </>
            ),
        });
        const lastValues = () => JSON.stringify(onValueChange.mock.lastCall[0]);

        fireEvent.change(getInput('.ab'), { target: { value: 'test' } });
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(lastValues()).toEqual('{"a":{"b":"test"}}');

        fireEvent.change(getInput('.ab'), { target: { value: '' } });
        expect(onValueChange).toHaveBeenCalledTimes(2);
        expect(lastValues()).toEqual('{}');

        fireEvent.change(getInput('.arr'), { target: { value: 'ttt' } });
        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(lastValues()).toEqual('{"arr":[null,"ttt"]}');

        fireEvent.change(getInput('.arr'), { target: { value: '' } });
        expect(lastValues()).toEqual('{}');
    });

    it('disabled', () => {
        const { container } = renderForm({ disabled: true, children: fields });
        expect(container.querySelector('.semi-select-disabled')).not.toBeNull();
        expect(container.querySelector('.semi-input-disabled')).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('validataFields：同步校验失败', async () => {
        let err = 'ab not valid';
        let formApi = null;
        renderForm({
            children: (
                <>
                    <Form.Input className="ab" field="a.b" />
                    <Form.Input className="arr" field="arr[1]" />
                </>
            ),
            validator: () => ({ a: { b: err } }),
            getFormApi: (api) => {
                formApi = api;
            },
        });
        // React 19's act does not flush the render when its callback rejects, so the rejection is asserted inside it
        await act(() => expect(formApi.validate()).rejects.toEqual({ a: { b: err } }));
        expect(formApi.getError('a.b')).toEqual(err);
        expect(document.querySelector(`[x-field-id="a.b"] .${BASE_CLASS_PREFIX}-form-field-error-message`)).toHaveTextContent(err);
    });

    it('validataFields：同步校验通过', async () => {
        let formApi = null;
        renderForm({
            children: (
                <>
                    <Form.Input className="ab" field="a.b" />
                    <Form.Input className="arr" field="arr[1]" />
                </>
            ),
            validator: () => '',
            getFormApi: (api) => {
                formApi = api;
            },
        });
        let values;
        await act(async () => {
            values = await formApi.validate();
        });
        expect(values).toEqual({});
        expect(formApi.getFormState().errors).toEqual({});
    });

    it('validteFields：异步 Promise 返回错误字符串，校验失败', async () => {
        let err = 'ab not valid';
        let formApi = null;
        renderForm({
            children: (
                <>
                    <Form.Input className="ab" field="a.b" />
                    <Form.Input className="arr" field="arr[1]" />
                </>
            ),
            validator: () => sleep(200).then(() => ({ a: { b: err } })),
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await expect(act(() => formApi.validate())).rejects.toEqual({ a: { b: err } });
        expect(formApi.getError('a.b')).toEqual(err);
    });

    it('validteFields：异步 Promise resolve，校验通过', async () => {
        let formApi = null;
        renderForm({
            children: (
                <>
                    <Form.Input className="ab" field="a.b" />
                    <Form.Input className="arr" field="arr[1]" />
                </>
            ),
            validator: () => sleep(200).then(() => ''),
            getFormApi: (api) => {
                formApi = api;
            },
        });
        let values;
        await act(async () => {
            values = await formApi.validate();
        });
        expect(values).toEqual({});
        expect(formApi.getFormState().errors).toEqual({});
    });

    it('表单级 validator 同步返回 {} 视为通过，onSubmit 被调用', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({
            onSubmit,
            onSubmitFail,
            validator: () => ({}),
            children: <Form.Input field="input" />,
        });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmitFail).not.toHaveBeenCalled();
    });

    it('表单级 validator 异步 resolve {} 视为通过', async () => {
        let formApi = null;
        renderForm({
            validator: () => Promise.resolve({}),
            children: <Form.Input field="input" />,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await act(() => expect(formApi.validate()).resolves.toEqual({}));
        expect(formApi.getFormState().errors).toEqual({});
    });

    it('表单级 validator 抛出 Error 实例仍视为失败', async () => {
        const error = new Error('boom');
        let formApi = null;
        renderForm({
            validator: () => {
                throw error;
            },
            children: <Form.Input field="input" />,
            getFormApi: (api) => {
                formApi = api;
            },
        });
        await act(() => expect(formApi.validate()).rejects.toBe(error));
    });
});

describe('Form-baseForm 行为', () => {
    it('form 元素默认带 noValidate，可通过 noValidate={false} 关闭', () => {
        const { container, rerender } = renderForm({ children: FormInput });
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
        rerender({ noValidate: false, children: FormInput });
        expect(container.querySelector('form')).not.toHaveAttribute('novalidate');
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('ref 暴露 formApi', () => {
        const ref = createRef<FormHandle>();
        render(
            <Form ref={ref}>
                <Form.Input field="name" />
            </Form>
        );
        act(() => ref.current?.formApi.setValue('name', 'semi'));
        expect(getInput()).toHaveValue('semi');
        expect(ref.current?.formApi.getValues()).toEqual({ name: 'semi' });
    });

    it('data-* 与 aria 属性透传到 form 元素，并将 id 用作 x-form-id', () => {
        const { container } = renderForm({ id: 'my-form', 'data-testid': 'form', 'aria-label': 'profile' });
        const form = container.querySelector('form');
        expect(form).toHaveAttribute('data-testid', 'form');
        expect(form).toHaveAttribute('aria-label', 'profile');
        expect(form).toHaveAttribute('id', 'my-form');
        expect(form).toHaveAttribute('x-form-id', 'my-form');
    });

    it('未传 id 时为 form 元素生成 id', () => {
        const { container } = renderForm({});
        const form = container.querySelector('form');
        expect(form.getAttribute('id')).toBeTruthy();
        expect(form.getAttribute('x-form-id')).toBe(form.getAttribute('id'));
    });

    it('Form 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Form: { labelPosition: 'left', layout: 'horizontal' } };
        const { container } = renderForm({ children: FormInput });
        expect(container.querySelector(FieldCls)).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-horizontal`)).not.toBeNull();
    });

    it('字段在同一次渲染中获取到变化后的 Form 属性', () => {
        const { container, rerender } = renderForm({ children: FormInput });
        expect(getInput()).not.toBeDisabled();
        rerender({ children: FormInput, disabled: true, labelPosition: 'left' });
        expect(getInput()).toBeDisabled();
        expect(container.querySelector(FieldCls)).toHaveAttribute('x-label-pos', 'left');
    });

    it('children 函数接收 formState、values 与 formApi', () => {
        let received;
        renderForm({
            children: (props) => {
                received = props;
                return <Form.Input field="name" />;
            },
        });
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        expect(received.values).toEqual({ name: 'semi' });
        expect(received.formState.values).toEqual({ name: 'semi' });
        expect(received.formApi.getValue('name')).toBe('semi');
    });

    it('stopPropagation 使提交与重置限制在嵌套 Form 内', () => {
        const outerSubmit = vi.fn<(...args: unknown[]) => void>();
        const outerReset = vi.fn<(...args: unknown[]) => void>();
        const innerSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(
            <div onReset={outerReset} onSubmit={outerSubmit}>
                <Form stopPropagation={{ submit: true, reset: true }} onSubmit={innerSubmit} />
            </div>
        );
        fireEvent.submit(container.querySelector('form'));
        fireEvent.reset(container.querySelector('form'));
        expect(outerSubmit).not.toHaveBeenCalled();
        expect(outerReset).not.toHaveBeenCalled();
    });

    it('onErrorChange 上报全部错误及变化的那一项', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({
            onErrorChange,
            children: <Form.Input field="name" validator={(val) => (val === 'ok' ? '' : 'bad')} />,
        });
        fireEvent.change(getInput(), { target: { value: 'x' } });
        await waitFor(() => expect(onErrorChange).toHaveBeenLastCalledWith({ name: 'bad' }, { name: 'bad' }));
    });

    it('trigger 为 custom 时跳过变化校验，挂载时校验', async () => {
        let formApi;
        renderForm({
            getFormApi: (api) => (formApi = api),
            children: (
                <>
                    <Form.Input field="a" trigger="custom" validator={() => 'a-err'} />
                    <Form.Input field="b" trigger="mount" validator={() => 'b-err'} />
                </>
            ),
        });
        await waitFor(() => expect(formApi.getError('b')).toBe('b-err'));
        fireEvent.change(document.querySelector('[x-field-id="a"] input'), { target: { value: 'x' } });
        await sleep(10);
        expect(formApi.getError('a')).toBeUndefined();
        await act(() => expect(formApi.validate(['a'])).rejects.toEqual({ a: 'a-err', b: 'b-err' }));
        expect(formApi.getError('a')).toBe('a-err');
    });

    it('stopValidateWithError 在第一条失败规则处停止', async () => {
        let formApi;
        const rules = [
            { required: true, message: 'required' },
            { validator: () => false, message: 'second' },
        ];
        renderForm({
            getFormApi: (api) => (formApi = api),
            children: (
                <>
                    <Form.Input field="all" rules={rules} />
                    <Form.Input field="first" rules={rules} stopValidateWithError />
                </>
            ),
        });
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(formApi.getError('all')).toEqual(['required', 'second']);
        expect(formApi.getError('first')).toBe('required');
    });

    it('keepState 在字段重新挂载时恢复其值', () => {
        let formApi;
        const Demo = ({ show }) => <Form getFormApi={(api) => (formApi = api)}>{show ? <Form.Input field="name" keepState /> : null}</Form>;
        const { rerender } = render(<Demo show />);
        fireEvent.change(getInput(), { target: { value: 'semi' } });
        rerender(<Demo show={false} />);
        expect(formApi.getValue('name')).toBe('semi');
        rerender(<Demo show />);
        expect(getInput()).toHaveValue('semi');
    });

    it('挂载且字段注册完成后调用一次 getFormApi', () => {
        const getFormApi = vi.fn<(api: FormApi) => void>((api) => expect(api.getFieldExist('name')).toBe(true));
        renderForm({ getFormApi, children: FormInput });
        expect(getFormApi).toHaveBeenCalledTimes(1);
    });

    it('服务端渲染时在 form 元素上输出生成的 id', () => {
        const html = renderToString(<Form>{FormInput}</Form>);
        const id = /<form[^>]* id="([^"]+)"/.exec(html)?.[1];
        expect(id).toBeTruthy();
        expect(html).toContain(`x-form-id="${id}"`);
    });

    it('不把自身属性放到 form 元素上', () => {
        const { container } = renderForm({ disabled: true, stopPropagation: { submit: true } });
        const form = container.querySelector('form');
        expect(form).not.toHaveAttribute('disabled');
        expect(form).not.toHaveAttribute('stopPropagation');
    });

    it('StrictMode 下每个字段只注册一次，卸载时注销', () => {
        let formApi;
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const Demo = () => {
            const [show, setShow] = useState(true);
            return (
                <Form getFormApi={(api) => (formApi = api)} onValueChange={onValueChange}>
                    {show ? <Form.Input field="name" initValue="semi" /> : null}
                    <Button onClick={() => setShow(false)}>hide</Button>
                </Form>
            );
        };
        render(
            <StrictMode>
                <Demo />
            </StrictMode>
        );
        expect(formApi.getFieldExist('name')).toBe(true);
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        fireEvent.change(getInput(), { target: { value: 'design' } });
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'design' }, { name: 'design' });
        fireEvent.click(screen.getByRole('button', { name: 'hide' }));
        expect(formApi.getFieldExist('name')).toBe(false);
        expect(formApi.getValues()).toEqual({});
    });
});
