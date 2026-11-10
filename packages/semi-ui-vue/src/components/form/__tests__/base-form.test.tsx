/** @jsxImportSource vue */
import { createSSRApp, defineComponent, nextTick, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-vue/utils/semi-global';
import { render, sleep } from '@test/utils/vue';
import { Form, type FormApi, type FormDefaultSlotProps, type FormHandle } from '..';
import Button from '../../button';
import { fieldSelector, flush, FormInput, getInput, getInputs, labelSelector, prefix, renderForm, selectWithOptions } from './fixtures/fields';

const nameInput = () => <FormInput field="name" />;
const fields = () => [nameInput(), selectWithOptions()];

describe('Form-baseForm', () => {
    it('className 与 style', () => {
        const { container } = renderForm({ class: 'form-test', style: { color: 'red' } });
        const form = container.querySelector('form.form-test');
        expect(form).not.toBeNull();
        expect(form).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('layout 布局', async () => {
        const { container, rerender } = renderForm({});
        expect(container.querySelector(`.${prefix}-vertical`)).not.toBeNull();
        await rerender({ layout: 'horizontal' });
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-vertical`)).toBeNull();
    });

    it('labelPosition 决定 Field 的标签位置', () => {
        const { container } = renderForm({ labelPosition: 'left' }, nameInput);
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
    });

    it('labelWidth 设置所有标签的宽度，数字按 px 处理', () => {
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

    it('通过默认插槽声明字段', () => {
        const { container } = renderForm({}, () => (
            <>
                <FormInput fieldClassName="role" field="Role" />
                <FormInput fieldClassName="userName" field="UserName" />
            </>
        ));
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
    });

    it('通过默认作用域插槽声明字段，并读到实时的 formState', async () => {
        const { container } = renderForm({}, ({ formState }) => (
            <>
                {selectWithOptions({ fieldClassName: 'role', field: 'Role', label: '角色' })}
                <FormInput fieldClassName="userName" field="UserName" label="用户名" />
                <FormInput fieldClassName="password" field="Password" label="密码" />
                <code>{JSON.stringify(formState)}</code>
            </>
        ));
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
        expect(container.querySelector('.password')).not.toBeNull();
        await fireEvent.update(getInput('.userName'), 'semi');
        expect(JSON.parse(container.querySelector('code')?.textContent ?? '').values).toEqual({ UserName: 'semi' });
    });

    it('未校验时 submit，由 formApi 触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onSubmit }, () => <FormInput field="input" />);
        api().submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({});
    });

    it('未校验时 submit，由表单 DOM 事件触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit }, () => <FormInput field="input" />);
        await fireEvent.update(getInput(), 'semi');
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ input: 'semi' });
    });

    // issue #767: Enter in an input implicitly submits a form that has a submit button; the documented way to opt a
    // field out is preventing the default of its keydown
    it('表单提交 #767：按 Enter 提交表单，除非字段 keydown 阻止默认行为', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onSubmit }, () => (
            <>
                <FormInput
                    field="UserName"
                    onKeydown={(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    }}
                />
                <FormInput field="Password" />
                <Button htmlType="submit">{() => 'submit'}</Button>
            </>
        ));
        const [userName, password] = screen.getAllByRole('textbox');
        await userEvent.type(userName, 'semi{Enter}');
        await userEvent.type(password, 'design{Enter}');
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ UserName: 'semi', Password: 'design' });
    });

    it('校验不通过时触发 onSubmitFail 而不触发 onSubmit，并显示各字段错误', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const emptyTips = "can't be empty";
        const validateName = (val: unknown) => (val ? undefined : emptyTips);
        const { api, container } = renderForm({ onSubmit, onSubmitFail }, () => (
            <>
                <FormInput field="name" validator={validateName} />
                <FormInput field="name2" validator={validateName} />
            </>
        ));
        api().submitForm();
        await waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: [emptyTips], name2: [emptyTips] });
        await waitFor(() => expect(container.querySelectorAll(`.${prefix}-field-error-message`)).toHaveLength(2));
    });

    it('reset 触发 onReset 并把值恢复为 initValues', async () => {
        const onReset = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onReset, initValues: { name: 'a' } }, nameInput);
        await fireEvent.update(getInput(), 'b');
        expect(getInput()).toHaveValue('b');
        api().reset();
        await nextTick();
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('a');
    });

    it('Form 的 allowEmpty 使提交值保留值为 undefined 的 key', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ allowEmpty: true, onSubmit }, fields);
        api().submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toStrictEqual({ name: undefined, business: undefined });
    });

    it('即使 Form 未设置 allowEmpty，Field 的 allowEmpty 也会保留值变为 undefined 后的 key', async () => {
        const toUndefined = (value: unknown) => (value === 'clear' ? undefined : value);
        const { api } = renderForm({}, () => (
            <>
                <FormInput allowEmpty convert={toUndefined} field="kept" />
                <FormInput convert={toUndefined} field="dropped" />
            </>
        ));
        const [kept, dropped] = getInputs();
        await fireEvent.update(kept, 'a');
        await fireEvent.update(dropped, 'a');
        expect(api().getFormState().values).toStrictEqual({ kept: 'a', dropped: 'a' });
        await fireEvent.update(kept, 'clear');
        await fireEvent.update(dropped, 'clear');
        const values = api().getFormState().values ?? {};
        expect('kept' in values).toBe(true);
        expect(values.kept).toBeUndefined();
        expect('dropped' in values).toBe(false);
    });

    it('输入变化时触发 onValueChange 并传入全部值', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onValueChange }, nameInput);
        await fireEvent.update(getInput(), 'semi');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange.mock.calls[0][0]).toEqual({ name: 'semi' });
    });

    it('initValues 作为各字段的初始值', () => {
        const { container } = renderForm({ initValues: { name: 'semi', business: 'abc' } }, fields);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`)).toHaveTextContent(/^Abc$/);
        expect(getInput()).toHaveValue('semi');
    });

    it('labelAlign 默认左对齐，可设为右对齐', () => {
        const { container, unmount } = renderForm({}, fields);
        expect(container.querySelectorAll(`.${prefix}-field-label-right`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-field-label-left`)).toHaveLength(2);
        unmount();
        const { container: container2 } = renderForm({ labelAlign: 'right' }, fields);
        expect(container2.querySelectorAll(`.${prefix}-field-label-right`)).toHaveLength(2);
        expect(container2.querySelectorAll(`.${prefix}-field-label-left`)).toHaveLength(0);
    });

    it('labelCol 与 wrapperCol 按栅格 span 布局标签和控件', () => {
        const { container } = renderForm({ wrapperCol: { span: 20 }, labelCol: { span: 2 } }, fields);
        const fieldsDom = container.querySelectorAll(fieldSelector);
        expect(fieldsDom).toHaveLength(2);
        for (const field of fieldsDom) {
            const [labelBox, wrapperCol] = field.children;
            const labelCol = labelBox.querySelector(`.${BASE_CLASS_PREFIX}-col`);
            expect(labelCol).toHaveStyle({ '--semi-col-span': '2' });
            expect(labelCol?.querySelector(labelSelector)).not.toBeNull();
            expect(wrapperCol).toHaveStyle({ '--semi-col-span': '20' });
            expect(wrapperCol.querySelector(labelSelector)).toBeNull();
        }
    });

    it('自动移除空 key', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onValueChange }, () => (
            <>
                <FormInput class="ab" field="a.b" />
                <FormInput class="arr" field="arr[1]" />
            </>
        ));
        const lastValues = () => JSON.stringify(onValueChange.mock.lastCall?.[0]);

        await fireEvent.update(getInput('.ab'), 'test');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(lastValues()).toEqual('{"a":{"b":"test"}}');

        await fireEvent.update(getInput('.ab'), '');
        expect(onValueChange).toHaveBeenCalledTimes(2);
        expect(lastValues()).toEqual('{}');

        await fireEvent.update(getInput('.arr'), 'ttt');
        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(lastValues()).toEqual('{"arr":[null,"ttt"]}');

        await fireEvent.update(getInput('.arr'), '');
        expect(lastValues()).toEqual('{}');
    });

    it('Form 的 disabled 使所有控件禁用', () => {
        const { container } = renderForm({ disabled: true }, fields);
        expect(container.querySelector('.semi-select-disabled')).not.toBeNull();
        expect(container.querySelector('.semi-input-disabled')).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    const pathFields = () => (
        <>
            <FormInput class="ab" field="a.b" />
            <FormInput class="arr" field="arr[1]" />
        </>
    );

    it('validataFields：同步校验失败', async () => {
        const err = 'ab not valid';
        const { api } = renderForm({ validator: () => ({ a: { b: err } }) }, pathFields);
        await expect(api().validate()).rejects.toEqual({ a: { b: [err] } });
        await flush();
        expect(api().getError('a.b')).toEqual([err]);
        expect(document.querySelector(`[x-field-id="a.b"] .${prefix}-field-error-message`)).toHaveTextContent(err);
    });

    it('validataFields：同步校验通过', async () => {
        const { api } = renderForm({ validator: () => '' }, pathFields);
        expect(await api().validate()).toEqual({});
        expect(api().getFormState().errors).toEqual({});
    });

    it('validteFields：异步 Promise 返回错误字符串，校验失败', async () => {
        const err = 'ab not valid';
        const { api } = renderForm({ validator: () => sleep(200).then(() => ({ a: { b: err } })) }, pathFields);
        await expect(api().validate()).rejects.toEqual({ a: { b: [err] } });
        expect(api().getError('a.b')).toEqual([err]);
    });

    it('validteFields：异步 Promise resolve，校验通过', async () => {
        const { api } = renderForm({ validator: () => sleep(200).then(() => '') }, pathFields);
        expect(await api().validate()).toEqual({});
        expect(api().getFormState().errors).toEqual({});
    });

    it('表单级 validator 同步返回 {} 视为通过，submit 被发出', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit, onSubmitFail, validator: () => ({}) }, () => <FormInput field="input" />);
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmitFail).not.toHaveBeenCalled();
    });

    it('表单级 validator 异步 resolve {} 视为通过', async () => {
        const { api } = renderForm({ validator: () => Promise.resolve({}) }, () => <FormInput field="input" />);
        await expect(api().validate()).resolves.toEqual({});
        expect(api().getFormState().errors).toEqual({});
    });

    it('表单级 validator 抛出 Error 实例仍视为失败', async () => {
        const error = new Error('boom');
        const { api } = renderForm(
            {
                validator: () => {
                    throw error;
                },
            },
            () => <FormInput field="input" />
        );
        await expect(api().validate()).rejects.toBe(error);
    });
});

describe('Form-baseForm 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('form 元素默认带 novalidate，可通过 :novalidate="false" 关闭', async () => {
        const { container, rerender } = renderForm({}, nameInput);
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
        await rerender({ novalidate: false });
        expect(container.querySelector('form')).not.toHaveAttribute('novalidate');
    });

    it('模板 ref 暴露 formApi', async () => {
        const handle = shallowRef<FormHandle | null>(null);
        render(() => <Form ref={handle}>{() => <FormInput field="name" />}</Form>);
        handle.value?.formApi.setValue('name', 'semi');
        await nextTick();
        expect(getInput()).toHaveValue('semi');
        expect(handle.value?.formApi.getValues()).toEqual({ name: 'semi' });
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
        expect(form?.getAttribute('id')).toBeTruthy();
        expect(form?.getAttribute('x-form-id')).toBe(form?.getAttribute('id'));
    });

    it('Form 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Form: { labelPosition: 'left', layout: 'horizontal' } };
        const { container } = renderForm({}, nameInput);
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
    });

    it('字段在同一次渲染中获取到变化后的 Form 属性', async () => {
        const { container, rerender } = renderForm({}, nameInput);
        expect(getInput()).not.toBeDisabled();
        await rerender({ disabled: true, labelPosition: 'left' });
        expect(getInput()).toBeDisabled();
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
    });

    it('默认作用域插槽接收 formState、values 与 formApi', async () => {
        let received: FormDefaultSlotProps | undefined;
        renderForm({}, (scope) => {
            received = scope;
            return <FormInput field="name" />;
        });
        await fireEvent.update(getInput(), 'semi');
        expect(received?.values).toEqual({ name: 'semi' });
        expect(received?.formState.values).toEqual({ name: 'semi' });
        expect(received?.formApi.getValue('name')).toBe('semi');
    });

    it('stopPropagation 使提交与重置限制在嵌套 Form 内', async () => {
        const outerSubmit = vi.fn<(...args: unknown[]) => void>();
        const outerReset = vi.fn<(...args: unknown[]) => void>();
        const { container } = render(() => (
            <div onReset={outerReset} onSubmit={outerSubmit}>
                <Form stopPropagation={{ submit: true, reset: true }} />
            </div>
        ));
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        expect(outerSubmit).not.toHaveBeenCalled();
        expect(outerReset).not.toHaveBeenCalled();
    });

    it('errorChange 上报全部错误及变化的那一项', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onErrorChange }, () => <FormInput field="name" validator={(val: unknown) => (val === 'ok' ? '' : 'bad')} />);
        await fireEvent.update(getInput(), 'x');
        await waitFor(() => expect(onErrorChange).toHaveBeenLastCalledWith({ name: ['bad'] }, { name: ['bad'] }));
    });

    it('trigger 为 custom 时跳过变化校验，挂载时校验', async () => {
        const { api } = renderForm({}, () => (
            <>
                <FormInput field="a" trigger="custom" validator={() => 'a-err'} />
                <FormInput field="b" trigger="mount" validator={() => 'b-err'} />
            </>
        ));
        await waitFor(() => expect(api().getError('b')).toEqual(['b-err']));
        await fireEvent.update(document.querySelector('[x-field-id="a"] input') as HTMLInputElement, 'x');
        await sleep(10);
        expect(api().getError('a')).toBeUndefined();
        await expect(api().validate(['a'])).rejects.toEqual({ a: ['a-err'], b: ['b-err'] });
        expect(api().getError('a')).toEqual(['a-err']);
    });

    it('stopValidateWithError 在第一条失败规则处停止', async () => {
        const rules = [
            { required: true, message: 'required' },
            { validator: () => false, message: 'second' },
        ];
        const { api } = renderForm({}, () => (
            <>
                <FormInput field="all" rules={rules} />
                <FormInput field="first" rules={rules} stopValidateWithError />
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        expect(api().getError('all')).toEqual(['required', 'second']);
        expect(api().getError('first')).toEqual(['required']);
    });

    it('字段默认保留卸载前的值、错误与 touched，重新挂载时恢复', async () => {
        let formApi: FormApi | undefined;
        const Demo = defineComponent({
            props: { show: Boolean },
            setup(props) {
                return () => <Form onGetFormApi={(api: FormApi) => (formApi = api)}>{() => (props.show ? <FormInput field="name" validator={() => 'bad'} /> : null)}</Form>;
            },
        });
        const view = render(Demo, { props: { show: true } });
        await fireEvent.update(getInput(), 'semi');
        await waitFor(() => expect(formApi?.getError('name')).toEqual(['bad']));
        await view.rerender({ show: false });
        expect(formApi?.getFormState()).toEqual({ values: { name: 'semi' }, errors: { name: ['bad'] }, touched: { name: true } });
        await view.rerender({ show: true });
        expect(getInput()).toHaveValue('semi');
        expect(document.querySelector(`.${prefix}-field-error-message`)).toHaveTextContent('bad');
    });

    it.each([
        ['Form', { keepState: false }, {}],
        ['字段', {}, { keepState: false }],
    ])('%s 的 keepState 为 false 时，卸载删除字段的值、错误与 touched', async (_, formProps, fieldProps) => {
        let formApi: FormApi | undefined;
        const show = shallowRef(true);
        render(() => (
            <Form {...formProps} onGetFormApi={(api: FormApi) => (formApi = api)}>
                {() => (show.value ? <FormInput field="name" validator={() => 'bad'} {...fieldProps} /> : null)}
            </Form>
        ));
        await fireEvent.update(getInput(), 'semi');
        await waitFor(() => expect(formApi?.getError('name')).toEqual(['bad']));
        show.value = false;
        await nextTick();
        expect(formApi?.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        show.value = true;
        await nextTick();
        expect(getInput()).toHaveValue('');
    });

    it('字段的 keepState 优先于 Form 的设置', async () => {
        let formApi: FormApi | undefined;
        const show = shallowRef(true);
        render(() => (
            <Form keepState={false} onGetFormApi={(api: FormApi) => (formApi = api)}>
                {() => (show.value ? <FormInput field="name" keepState /> : null)}
            </Form>
        ));
        await fireEvent.update(getInput(), 'semi');
        show.value = false;
        await nextTick();
        expect(formApi?.getValue('name')).toBe('semi');
    });

    it('挂载且字段注册完成后发出一次 getFormApi', () => {
        const onGetFormApi = vi.fn<(api: FormApi) => void>((api) => expect(api.getFieldExist('name')).toBe(true));
        renderForm({ onGetFormApi }, nameInput);
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
    });

    it('服务端渲染时在 form 元素上输出生成的 id', async () => {
        const html = await renderToString(createSSRApp({ render: () => <Form>{nameInput}</Form> }));
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

    it('每个字段只注册一次，卸载时注销', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        let formApi: FormApi | undefined;
        const show = shallowRef(true);
        render(() => (
            <Form onGetFormApi={(api: FormApi) => (formApi = api)} onValueChange={onValueChange}>
                {() => (
                    <>
                        {show.value ? <FormInput field="name" initValue="semi" keepState={false} /> : null}
                        <Button onClick={() => (show.value = false)}>{() => 'hide'}</Button>
                    </>
                )}
            </Form>
        ));
        expect(formApi?.getFieldExist('name')).toBe(true);
        expect(formApi?.getValues()).toEqual({ name: 'semi' });
        await fireEvent.update(getInput(), 'design');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'design' }, { name: 'design' });
        await fireEvent.click(screen.getByRole('button', { name: 'hide' }));
        expect(formApi?.getFieldExist('name')).toBe(false);
        expect(formApi?.getValues()).toEqual({});
    });
});
