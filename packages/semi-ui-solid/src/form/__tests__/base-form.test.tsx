import { type JSX, Show, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import { type FormApi, type FormElement, type FormProps, type FormRenderProps, Form, FormInput, FormSelect } from '..';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';

function renderForm(initial: FormProps = {}, content?: () => JSX.Element) {
    const [props, setProps] = createSignal<FormProps>(initial);
    const result = render(() => (content ? <Form {...props()}>{content()}</Form> : <Form {...props()} />));
    return { ...result, rerender: (next: FormProps) => setProps(next) };
}

const fieldCls = `.${BASE_CLASS_PREFIX}-form-field`;
const labelSelector = `.${BASE_CLASS_PREFIX}-form-field-label`;
const getInput = (scope = '') => document.querySelector(`${scope} .${BASE_CLASS_PREFIX}-input`) as HTMLInputElement;
const type = (input: Element, value: string) => fireEvent.input(input, { target: { value } });

const nameInput = () => <FormInput field="name" />;

const fields = () => (
    <>
        <FormInput field="name" />
        <FormSelect style={{ width: '200px' }} field="business" label="business">
            <FormSelect.Option value="abc">Abc</FormSelect.Option>
            <FormSelect.Option value="hotsoon">Hotsoon</FormSelect.Option>
            <FormSelect.Option value="topbuzz">TopBuzz</FormSelect.Option>
        </FormSelect>
    </>
);

const nestedFields = () => (
    <>
        <FormInput class="ab" field="a.b" />
        <FormInput class="arr" field="arr[1]" />
    </>
);

describe('Form-baseForm', () => {
    it('class 与 style', () => {
        const { container } = renderForm({ class: 'form-test', style: { color: 'red' } });
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
        const { container } = renderForm({ labelPosition: 'left' }, nameInput);
        expect(container.querySelector(fieldCls)).toHaveAttribute('x-label-pos', 'left');
    });

    it('labelWidth', () => {
        const { container, unmount } = renderForm({ labelWidth: 200 }, fields);
        let labels = container.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '200px' });
        expect(labels[1]).toHaveStyle({ width: '200px' });
        unmount();
        const { container: container2 } = renderForm({ labelWidth: '300px' }, fields);
        labels = container2.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '300px' });
        expect(labels[1]).toHaveStyle({ width: '300px' });
    });

    it('通过 component 声明字段', () => {
        const component = () => (
            <>
                <FormInput fieldClassName="role" field="Role" />
                <FormInput fieldClassName="userName" field="UserName" />
            </>
        );
        const { container } = renderForm({ component });
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
    });

    it('component 收到随表单状态更新的 formState', () => {
        const component = (props: FormRenderProps) => (
            <>
                <FormInput fieldClassName="userName" field="UserName" />
                <code>{JSON.stringify(props.formState.values)}</code>
            </>
        );
        const { container } = renderForm({ component });
        type(getInput('.userName'), 'semi');
        expect(container.querySelector('code')).toHaveTextContent('{"UserName":"semi"}');
    });

    it('通过 render 声明字段', () => {
        const renderFields = (props: FormRenderProps) => (
            <>
                <FormSelect fieldClassName="role" style={{ width: '120px' }} field="Role" label="角色">
                    <FormSelect.Option value="admin">管理员</FormSelect.Option>
                    <FormSelect.Option value="user">普通用户</FormSelect.Option>
                    <FormSelect.Option value="guest">访客</FormSelect.Option>
                </FormSelect>
                <FormInput fieldClassName="userName" field="UserName" label="用户名" />
                <FormInput fieldClassName="password" field="Password" label="密码" />
                <code style={{ 'margin-top': '30px' }}>{JSON.stringify(props.formState)}</code>
            </>
        );
        const { container } = renderForm({ render: renderFields });
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
        expect(container.querySelector('.password')).not.toBeNull();
        type(getInput('.userName'), 'semi');
        expect(JSON.parse(container.querySelector('code')?.textContent ?? '').values).toEqual({ UserName: 'semi' });
    });

    it('render 只调用一次', () => {
        const renderFields = vi.fn<NonNullable<FormProps['render']>>((props) => <code>{JSON.stringify(props.values)}</code>);
        const { container } = renderForm({ render: renderFields }, undefined);
        const api = (container.querySelector('form') as FormElement).formApi;
        api.setValue('name', 'semi');
        expect(container.querySelector('code')).toHaveTextContent('{"name":"semi"}');
        expect(renderFields).toHaveBeenCalledTimes(1);
    });

    it('component 或 render 与 children 同时传入时告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderForm({ render: () => <span /> }, nameInput);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Form render> and <Form>{children}</Form>'));
        renderForm({ component: () => <span /> }, nameInput);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Form component> and <Form>{children}</Form>'));
        warn.mockRestore();
    });

    it('通过 children 声明字段', () => {
        const { container } = renderForm({}, () => <FormInput fieldClassName="name" field="name" />);
        expect(container.querySelector('.name')).not.toBeNull();
    });

    it('getFormApi 回调及其参数为有效函数', () => {
        let api: FormApi | undefined;
        const getFormApi = vi.fn<(formApi: FormApi) => void>((formApi) => {
            api = formApi;
        });
        renderForm({ getFormApi }, nameInput);
        expect(getFormApi).toHaveBeenCalledTimes(1);
        const formApis = ['setValue', 'setValues', 'setError', 'setTouched', 'submitForm', 'reset', 'getInitValue', 'getFieldExist', 'getFormState', 'getTouched', 'getValue', 'getError', 'validate'] as const;
        for (const apiName of formApis) {
            expect(api?.[apiName]).toEqual(expect.any(Function));
        }
    });

    it('未校验时 onSubmit，由 formApi 触发', async () => {
        let api: FormApi | undefined;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm(
            {
                getFormApi: (formApi) => {
                    api = formApi;
                },
                onSubmit,
            },
            () => <FormInput field="input" />
        );
        api?.submitForm();
        // formApi.submitForm validates asynchronously before submitting
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({});
    });

    it('未校验时 onSubmit，由表单 DOM 事件触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit }, () => <FormInput field="input" />);
        type(getInput(), 'semi');
        fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ input: 'semi' });
    });

    // issue #767: Enter in an input implicitly submits a form that has a submit button; the documented way to opt a
    // field out is preventing the default of its keydown
    it('表单提交 #767：按 Enter 提交表单，除非字段 onKeyDown 阻止默认行为', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onSubmit }, () => (
            <>
                <FormInput
                    field="UserName"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    }}
                />
                <FormInput field="Password" />
                <Button htmlType="submit">submit</Button>
            </>
        ));
        const [userName, password] = screen.getAllByRole('textbox');
        await userEvent.type(userName, 'semi{Enter}');
        await userEvent.type(password, 'design{Enter}');
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ UserName: 'semi', Password: 'design' });
    });

    it('onSubmitFail', async () => {
        let api: FormApi | undefined;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const emptyTips = "can't be empty";
        const validateName = (val: unknown) => (val ? undefined : emptyTips);
        const { container } = renderForm(
            {
                getFormApi: (formApi) => {
                    api = formApi;
                },
                onSubmit,
                onSubmitFail,
            },
            () => (
                <>
                    <FormInput field="name" validator={validateName} />
                    <FormInput field="name2" validator={validateName} />
                </>
            )
        );
        api?.submitForm();
        await waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: emptyTips, name2: emptyTips });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-error-message`)).toHaveLength(2);
    });

    it('onReset', () => {
        let api: FormApi | undefined;
        const onReset = vi.fn<(...args: unknown[]) => void>();
        renderForm(
            {
                onReset,
                getFormApi: (formApi) => {
                    api = formApi;
                },
                initValues: { name: 'a' },
            },
            nameInput
        );
        type(getInput(), 'b');
        expect(getInput()).toHaveValue('b');
        api?.reset();
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('a');
    });

    it('allowEmpty', async () => {
        let api: FormApi | undefined;
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm(
            {
                getFormApi: (formApi) => {
                    api = formApi;
                },
                allowEmpty: true,
                onSubmit,
            },
            fields
        );
        api?.submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toStrictEqual({ name: undefined, business: undefined });
    });

    it('即使 Form 未设置 allowEmpty，Field 的 allowEmpty 也会保留值变为 undefined 后的 key', () => {
        let api: FormApi | undefined;
        const toUndefined = (value: unknown) => (value === 'clear' ? undefined : value);
        renderForm(
            {
                getFormApi: (formApi) => {
                    api = formApi;
                },
            },
            () => (
                <>
                    <FormInput allowEmpty convert={toUndefined} field="kept" />
                    <FormInput convert={toUndefined} field="dropped" />
                </>
            )
        );
        const [kept, dropped] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-input`);
        type(kept, 'a');
        type(dropped, 'a');
        expect(api?.getFormState().values).toStrictEqual({ kept: 'a', dropped: 'a' });
        type(kept, 'clear');
        type(dropped, 'clear');
        const values = api?.getFormState().values ?? {};
        expect('kept' in values).toBe(true);
        expect(values.kept).toBeUndefined();
        expect('dropped' in values).toBe(false);
    });

    it('onValueChange', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onValueChange }, nameInput);
        type(getInput(), 'semi');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0][0]).toEqual({ name: 'semi' });
    });

    it('initValues', () => {
        const { container } = renderForm({ initValues: { name: 'semi', business: 'abc' } }, fields);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`)).toHaveTextContent(/^Abc$/);
        expect(getInput()).toHaveValue('semi');
    });

    it('labelAlign', () => {
        const { container, unmount } = renderForm({}, fields);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).toHaveLength(2);
        unmount();
        const { container: container2 } = renderForm({ labelAlign: 'right' }, fields);
        expect(container2.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).toHaveLength(2);
        expect(container2.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label-left`)).toHaveLength(0);
    });

    it('labelCol/wrapperCol', () => {
        const { container } = renderForm({ wrapperCol: { span: 20 }, labelCol: { span: 2 } }, fields);
        const fieldsDom = container.querySelectorAll(fieldCls);
        expect(fieldsDom).toHaveLength(2);
        for (const field of fieldsDom) {
            const [labelBox, wrapperCol] = field.children;
            const labelCol = labelBox.querySelector(`.${BASE_CLASS_PREFIX}-col`);
            expect(labelCol).toHaveClass(`${BASE_CLASS_PREFIX}-col-2`);
            expect(labelCol?.querySelector(labelSelector)).not.toBeNull();
            expect(wrapperCol).toHaveClass(`${BASE_CLASS_PREFIX}-col-20`);
            expect(wrapperCol.querySelector(labelSelector)).toBeNull();
        }
        // the Form sets both cols, so it wraps the form in one Row and the fields add none
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-row`)).toHaveLength(1);
    });

    it('自动移除空 key', () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onValueChange }, nestedFields);
        const lastValues = () => JSON.stringify(onValueChange.mock.lastCall?.[0]);

        type(getInput('.ab'), 'test');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(lastValues()).toEqual('{"a":{"b":"test"}}');

        type(getInput('.ab'), '');
        expect(onValueChange).toHaveBeenCalledTimes(2);
        expect(lastValues()).toEqual('{}');

        type(getInput('.arr'), 'ttt');
        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(lastValues()).toEqual('{"arr":[null,"ttt"]}');

        type(getInput('.arr'), '');
        expect(lastValues()).toEqual('{}');
    });

    it('disabled', () => {
        const { container } = renderForm({ disabled: true }, fields);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select-disabled`)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-disabled`)).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('validataFields：同步校验失败', async () => {
        const err = 'ab not valid';
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => ({ a: { b: err } }),
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            nestedFields
        );
        await expect(formApi?.validate()).rejects.toEqual({ a: { b: err } });
        expect(formApi?.getError('a.b')).toEqual(err);
        expect(document.querySelector(`[x-field-id="a.b"] .${BASE_CLASS_PREFIX}-form-field-error-message`)).toHaveTextContent(err);
    });

    it('validataFields：同步校验通过', async () => {
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => '',
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            nestedFields
        );
        await expect(formApi?.validate()).resolves.toEqual({});
        expect(formApi?.getFormState().errors).toEqual({});
    });

    it('validteFields：异步 Promise 返回错误字符串，校验失败', async () => {
        const err = 'ab not valid';
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => sleep(200).then(() => ({ a: { b: err } })),
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            nestedFields
        );
        await expect(formApi?.validate()).rejects.toEqual({ a: { b: err } });
        expect(formApi?.getError('a.b')).toEqual(err);
    });

    it('validteFields：异步 Promise resolve，校验通过', async () => {
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => sleep(200).then(() => ''),
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            nestedFields
        );
        await expect(formApi?.validate()).resolves.toEqual({});
        expect(formApi?.getFormState().errors).toEqual({});
    });

    it('表单级 validator 同步返回 {} 视为通过，onSubmit 被调用', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit, onSubmitFail, validator: () => ({}) }, () => <FormInput field="input" />);
        fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmitFail).not.toHaveBeenCalled();
    });

    it('表单级 validator 异步 resolve {} 视为通过', async () => {
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => Promise.resolve({}),
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            () => <FormInput field="input" />
        );
        await expect(formApi?.validate()).resolves.toEqual({});
        expect(formApi?.getFormState().errors).toEqual({});
    });

    it('表单级 validator 抛出 Error 实例仍视为失败', async () => {
        const error = new Error('boom');
        let formApi: FormApi | undefined;
        renderForm(
            {
                validator: () => {
                    throw error;
                },
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            () => <FormInput field="input" />
        );
        await expect(formApi?.validate()).rejects.toBe(error);
    });
});

describe('Form-baseForm 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('form 元素默认带 novalidate，可通过 novalidate={false} 关闭', () => {
        const { container, rerender } = renderForm({}, nameInput);
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
        rerender({ novalidate: false });
        expect(container.querySelector('form')).not.toHaveAttribute('novalidate');
    });

    it('ref 收到挂着 formApi 的 form 元素', () => {
        let ref: FormElement | undefined;
        render(() => (
            <Form ref={(node) => (ref = node)}>
                <FormInput field="name" />
            </Form>
        ));
        expect(ref).toBe(document.querySelector('form'));
        ref?.formApi.setValue('name', 'semi');
        expect(getInput()).toHaveValue('semi');
        expect(ref?.formApi.getValues()).toEqual({ name: 'semi' });
    });

    it('data-* 与 aria 属性透传到 form 元素，并将 id 用作 x-form-id', () => {
        const { container } = renderForm({ id: 'my-form', 'data-testid': 'form', 'aria-label': 'profile' } as FormProps);
        const form = container.querySelector('form');
        expect(form).toHaveAttribute('data-testid', 'form');
        expect(form).toHaveAttribute('aria-label', 'profile');
        expect(form).toHaveAttribute('id', 'my-form');
        expect(form).toHaveAttribute('x-form-id', 'my-form');
    });

    it('未传 id 时为 form 元素生成 id', () => {
        const { container } = renderForm({});
        const form = container.querySelector('form');
        expect(form?.getAttribute('id')).toBeTruthy();
        expect(form?.getAttribute('x-form-id')).toBe(form?.getAttribute('id'));
    });

    it('Form 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Form: { labelPosition: 'left', layout: 'horizontal' } } as typeof semiGlobal.config.overrideDefaultProps;
        const { container } = renderForm({}, nameInput);
        expect(container.querySelector(fieldCls)).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-horizontal`)).not.toBeNull();
    });

    it('字段跟随变化后的 Form 属性', () => {
        const { container, rerender } = renderForm({}, nameInput);
        expect(getInput()).not.toBeDisabled();
        rerender({ disabled: true, labelPosition: 'left' });
        expect(getInput()).toBeDisabled();
        expect(container.querySelector(fieldCls)).toHaveAttribute('x-label-pos', 'left');
    });

    it('children 函数接收 formState、values 与 formApi，只调用一次', () => {
        // a declared parameter marks the child as a render function, as Form tells it from a children accessor
        const child = vi.fn<(props: FormRenderProps) => JSX.Element>((_props) => <FormInput field="name" />);
        renderForm({ children: child });
        type(getInput(), 'semi');
        expect(child).toHaveBeenCalledTimes(1);
        const [received] = child.mock.calls[0];
        expect(received.values).toEqual({ name: 'semi' });
        expect(received.formState.values).toEqual({ name: 'semi' });
        expect(received.formApi.getValue('name')).toBe('semi');
    });

    it('stopPropagation 使提交与重置限制在嵌套 Form 内', () => {
        const outerSubmit = vi.fn<(...args: unknown[]) => void>();
        const outerReset = vi.fn<(...args: unknown[]) => void>();
        const innerSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(() => (
            <div on:reset={outerReset} on:submit={outerSubmit}>
                <Form stopPropagation={{ submit: true, reset: true }} onSubmit={innerSubmit} />
            </div>
        ));
        fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        expect(outerSubmit).not.toHaveBeenCalled();
        expect(outerReset).not.toHaveBeenCalled();
    });

    it('未设置 stopPropagation 时提交与重置冒泡到外层', () => {
        const outerSubmit = vi.fn<(...args: unknown[]) => void>();
        const outerReset = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(() => (
            <div on:reset={outerReset} on:submit={outerSubmit}>
                <Form />
            </div>
        ));
        fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        expect(outerSubmit).toHaveBeenCalledTimes(1);
        expect(outerReset).toHaveBeenCalledTimes(1);
    });

    it('onErrorChange 上报全部错误及变化的那一项', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onErrorChange }, () => <FormInput field="name" validator={(val) => (val === 'ok' ? '' : 'bad')} />);
        type(getInput(), 'x');
        await waitFor(() => expect(onErrorChange).toHaveBeenLastCalledWith({ name: 'bad' }, { name: 'bad' }));
    });

    it('trigger 为 custom 时跳过变化校验，挂载时校验', async () => {
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => (
            <>
                <FormInput field="a" trigger="custom" validator={() => 'a-err'} />
                <FormInput field="b" trigger="mount" validator={() => 'b-err'} />
            </>
        ));
        await waitFor(() => expect(formApi?.getError('b')).toBe('b-err'));
        type(document.querySelector('[x-field-id="a"] input') as HTMLInputElement, 'x');
        await sleep(10);
        expect(formApi?.getError('a')).toBeUndefined();
        await expect(formApi?.validate(['a'])).rejects.toEqual({ a: 'a-err', b: 'b-err' });
        expect(formApi?.getError('a')).toBe('a-err');
    });

    it('stopValidateWithError 在第一条失败规则处停止', async () => {
        let formApi: FormApi | undefined;
        const rules = [
            { required: true, message: 'required' },
            { validator: () => false, message: 'second' },
        ];
        renderForm({ getFormApi: (api) => (formApi = api) }, () => (
            <>
                <FormInput field="all" rules={rules} />
                <FormInput field="first" rules={rules} stopValidateWithError />
            </>
        ));
        await expect(formApi?.validate()).rejects.toBeDefined();
        expect(formApi?.getError('all')).toEqual(['required', 'second']);
        expect(formApi?.getError('first')).toBe('required');
    });

    it('keepState 在字段重新挂载时恢复其值', () => {
        let formApi: FormApi | undefined;
        const [show, setShow] = createSignal(true);
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <Show when={show()}>
                    <FormInput field="name" keepState />
                </Show>
            </Form>
        ));
        type(getInput(), 'semi');
        setShow(false);
        expect(formApi?.getValue('name')).toBe('semi');
        setShow(true);
        expect(getInput()).toHaveValue('semi');
    });

    it('挂载且字段注册完成后调用一次 getFormApi', () => {
        const getFormApi = vi.fn<(api: FormApi) => void>((api) => expect(api.getFieldExist('name')).toBe(true));
        renderForm({ getFormApi }, nameInput);
        expect(getFormApi).toHaveBeenCalledTimes(1);
    });

    it('不把自身属性放到 form 元素上', () => {
        const { container } = renderForm({ disabled: true, stopPropagation: { submit: true } });
        const form = container.querySelector('form');
        expect(form).not.toHaveAttribute('disabled');
        expect(form).not.toHaveAttribute('stopPropagation');
    });

    it('每个字段只注册一次，卸载时注销', () => {
        let formApi: FormApi | undefined;
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const [show, setShow] = createSignal(true);
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} onValueChange={onValueChange}>
                <Show when={show()}>
                    <FormInput field="name" initValue="semi" />
                </Show>
                <Button onClick={() => setShow(false)}>hide</Button>
            </Form>
        ));
        expect(formApi?.getFieldExist('name')).toBe(true);
        expect(formApi?.getValues()).toEqual({ name: 'semi' });
        type(getInput(), 'design');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'design' }, { name: 'design' });
        fireEvent.click(screen.getByRole('button', { name: 'hide' }));
        expect(formApi?.getFieldExist('name')).toBe(false);
        expect(formApi?.getValues()).toEqual({});
    });

    it('卸载整个 Form 时不为每个字段调用 onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { unmount } = renderForm({ onChange }, fields);
        onChange.mockClear();
        unmount();
        expect(onChange).not.toHaveBeenCalled();
    });
});
