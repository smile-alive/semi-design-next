import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '../../_utils/semi-global';
import type { FormApi } from '../interface';
import FormRef from './form-ref.svelte';
import { errorSelector, fieldSelector, getInput, input, inputIn, labelSelector, prefix, renderForm, select, settle, sleep, typeInto } from './helpers';

const nameInput = () => [input('name')];
const fields = () => [input('name'), select()];
const pathFields = () => [input('a.b', { class: 'ab' }), input('arr[1]', { class: 'arr' })];
const inputs = () => Array.from(document.querySelectorAll<HTMLInputElement>('input.semi-input'));

describe('Svelte Form-baseForm', () => {
    it('class 与 style', () => {
        const { container } = renderForm({ class: 'form-test', style: 'color: red' });
        const form = container.querySelector('form.form-test');
        expect(form).not.toBeNull();
        expect(form).toHaveClass(prefix, `${prefix}-vertical`);
        expect(form).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('layout 布局', () => {
        const { container, store } = renderForm();
        expect(container.querySelector(`.${prefix}-vertical`)).not.toBeNull();
        store.form.layout = 'horizontal';
        flushSync();
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-vertical`)).toBeNull();
    });

    it('labelPosition', () => {
        const { container } = renderForm({ labelPosition: 'left' }, nameInput());
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
    });

    it('labelWidth', () => {
        const { container, store, unmount } = renderForm({ labelWidth: 200 }, fields());
        let labels = container.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '200px' });
        expect(labels[1]).toHaveStyle({ width: '200px' });
        store.form.labelWidth = '250px';
        flushSync();
        expect(labels[1]).toHaveStyle({ width: '250px' });
        unmount();
        const second = renderForm({ labelWidth: '300px' }, fields());
        labels = second.container.querySelectorAll(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '300px' });
        expect(labels[1]).toHaveStyle({ width: '300px' });
    });

    it('通过 children snippet 声明字段', () => {
        const { container } = renderForm({}, [input('Role', { fieldClassName: 'role' }), input('UserName', { fieldClassName: 'userName' })]);
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
    });

    it('children snippet 读到实时的 formState', async () => {
        const { container } = renderForm({}, [select({ fieldClassName: 'role', field: 'Role', label: '角色' }), input('UserName', { fieldClassName: 'userName', label: '用户名' }), input('Password', { fieldClassName: 'password', label: '密码' })], { showState: true });
        expect(container.querySelector('.role')).not.toBeNull();
        expect(container.querySelector('.userName')).not.toBeNull();
        expect(container.querySelector('.password')).not.toBeNull();
        await typeInto(inputIn('.userName'), 'semi');
        expect(JSON.parse(screen.getByTestId('state').textContent ?? '').values).toEqual({ UserName: 'semi' });
    });

    it('getFormApi 回调及其参数为有效函数', () => {
        const { api, onGetFormApi } = renderForm({}, nameInput());
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
        for (const name of ['setValue', 'setValues', 'setError', 'setTouched', 'submitForm', 'reset', 'getInitValue', 'getFieldExist', 'getFormState', 'getTouched', 'getValue', 'getError', 'validate'] as const) {
            expect(api()[name]).toEqual(expect.any(Function));
        }
    });

    it('未校验时 submit，由 formApi 触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onSubmit }, [input('input')]);
        api().submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({});
    });

    it('未校验时 submit，由表单 DOM 事件触发', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit }, [input('input')]);
        await typeInto(getInput(), 'semi');
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ input: 'semi' });
    });

    // issue #767: Enter in an input implicitly submits a form that has a submit button; the documented way to opt a
    // field out is preventing the default of its keydown
    it('表单提交 #767：按 Enter 提交表单，除非字段 keydown 阻止默认行为', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') event.preventDefault();
        };
        renderForm({ onSubmit }, [input('UserName', { onKeyDown }), input('Password')], { submitButton: true });
        const [userName, password] = screen.getAllByRole('textbox');
        await userEvent.type(userName, 'semi{Enter}');
        await userEvent.type(password, 'design{Enter}');
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toEqual({ UserName: 'semi', Password: 'design' });
    });

    it('submitFail', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const emptyTips = "can't be empty";
        const validator = (value: unknown) => (value ? undefined : emptyTips);
        const { api, container } = renderForm({ onSubmit, onSubmitFail }, [input('name', { validator }), input('name2', { validator })]);
        api().submitForm();
        await waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: emptyTips, name2: emptyTips });
        await waitFor(() => expect(container.querySelectorAll(errorSelector)).toHaveLength(2));
        expect(container.querySelector(errorSelector)).toHaveTextContent(emptyTips);
    });

    it.each([
        [
            'formApi.reset()',
            async (_container: HTMLElement, api: () => FormApi) => {
                api().reset();
            },
        ],
        ['DOM reset 事件', async (container: HTMLElement) => void (await fireEvent.reset(container.querySelector('form') as HTMLFormElement))],
    ])('reset：%s 恢复初值、清除错误并发出 onReset', async (_name, trigger) => {
        const onReset = vi.fn<(...args: unknown[]) => void>();
        const { container, api } = renderForm({ onReset, initValues: { name: 'init' } }, [input('name', { rules: [{ required: true, message: '必填' }] })]);
        expect(getInput()).toHaveValue('init');
        await typeInto(getInput(), '');
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('必填');
        await trigger(container, api);
        await settle();
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('init');
        expect(container.querySelector(errorSelector)).toBeNull();
        expect(api().getValues()).toEqual({ name: 'init' });
    });

    it('allowEmpty', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ allowEmpty: true, onSubmit }, fields());
        api().submitForm();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0]).toStrictEqual({ name: undefined, business: undefined });
    });

    it('即使 Form 未设置 allowEmpty，Field 的 allowEmpty 也会保留值变为 undefined 后的 key', async () => {
        const convert = (value: unknown) => (value === 'clear' ? undefined : value);
        const { api } = renderForm({}, [input('kept', { allowEmpty: true, convert }), input('dropped', { convert })]);
        const [kept, dropped] = inputs();
        await typeInto(kept, 'a');
        await typeInto(dropped, 'a');
        expect(api().getFormState().values).toStrictEqual({ kept: 'a', dropped: 'a' });
        await typeInto(kept, 'clear');
        await typeInto(dropped, 'clear');
        const values = api().getFormState().values ?? {};
        expect('kept' in values).toBe(true);
        expect(values.kept).toBeUndefined();
        expect('dropped' in values).toBe(false);
    });

    it('valueChange', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const onChange = vi.fn<(state: { values: unknown }) => void>();
        renderForm({ onValueChange, onChange }, nameInput());
        await typeInto(getInput(), 'semi');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'semi' }, { name: 'semi' });
        expect(onChange.mock.lastCall?.[0].values).toEqual({ name: 'semi' });
    });

    it('initValues', () => {
        const { container } = renderForm({ initValues: { name: 'semi', business: 'abc' } }, fields());
        expect(container.querySelector('.semi-select-selection-text')).toHaveTextContent(/^Abc$/);
        expect(getInput()).toHaveValue('semi');
    });

    it('labelAlign', () => {
        const { container, unmount } = renderForm({}, fields());
        expect(container.querySelectorAll(`.${prefix}-field-label-right`)).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-field-label-left`)).toHaveLength(2);
        unmount();
        const second = renderForm({ labelAlign: 'right' }, fields());
        expect(second.container.querySelectorAll(`.${prefix}-field-label-right`)).toHaveLength(2);
        expect(second.container.querySelectorAll(`.${prefix}-field-label-left`)).toHaveLength(0);
    });

    it('labelCol/wrapperCol', () => {
        const { container } = renderForm({ wrapperCol: { span: 20 }, labelCol: { span: 2 } }, fields());
        const fieldsDom = container.querySelectorAll(fieldSelector);
        expect(fieldsDom).toHaveLength(2);
        expect(container.querySelector('.semi-row > form')).not.toBeNull();
        for (const field of fieldsDom) {
            expect(field.querySelector('.semi-row')).toBeNull();
            expect(field.querySelector(`.semi-col-20 .${prefix}-field-main`)).not.toBeNull();
            const [labelBox, wrapperCol] = field.children;
            const labelCol = labelBox.querySelector('.semi-col');
            expect(labelCol).toHaveClass('semi-col-2');
            expect(labelCol?.querySelector(labelSelector)).not.toBeNull();
            expect(wrapperCol).toHaveClass('semi-col-20');
            expect(wrapperCol.querySelector(labelSelector)).toBeNull();
        }
    });

    it('自动移除空 key', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onValueChange }, pathFields());
        const lastValues = () => JSON.stringify(onValueChange.mock.lastCall?.[0]);
        await typeInto(inputIn('.ab'), 'test');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(lastValues()).toEqual('{"a":{"b":"test"}}');
        await typeInto(inputIn('.ab'), '');
        expect(onValueChange).toHaveBeenCalledTimes(2);
        expect(lastValues()).toEqual('{}');
        await typeInto(inputIn('.arr'), 'ttt');
        expect(onValueChange).toHaveBeenCalledTimes(3);
        expect(lastValues()).toEqual('{"arr":[null,"ttt"]}');
        await typeInto(inputIn('.arr'), '');
        expect(lastValues()).toEqual('{}');
    });

    it('disabled', () => {
        const { container } = renderForm({ disabled: true }, fields());
        expect(container.querySelector('.semi-select-disabled')).not.toBeNull();
        expect(container.querySelector('.semi-input-disabled')).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('字段自身的 disabled 优先于 Form 的 disabled', () => {
        const { container } = renderForm({ disabled: true }, [input('a'), input('b', { disabled: false })]);
        const [first, second] = container.querySelectorAll('input');
        expect(first).toBeDisabled();
        expect(second).not.toBeDisabled();
    });

    it('validateFields：同步校验失败', async () => {
        const err = 'ab not valid';
        const { api } = renderForm({ validator: () => ({ a: { b: err } }) }, pathFields());
        await expect(api().validate()).rejects.toEqual({ a: { b: err } });
        await settle();
        expect(api().getError('a.b')).toEqual(err);
        expect(document.querySelector(`[x-field-id="a.b"] .${prefix}-field-error-message`)).toHaveTextContent(err);
    });

    it('validateFields：同步校验通过', async () => {
        const { api } = renderForm({ validator: () => '' }, pathFields());
        expect(await api().validate()).toEqual({});
        expect(api().getFormState().errors).toEqual({});
    });

    it('validateFields：异步 Promise 返回错误，校验失败', async () => {
        const err = 'ab not valid';
        const { api } = renderForm({ validator: () => sleep(200).then(() => ({ a: { b: err } })) }, pathFields());
        await expect(api().validate()).rejects.toEqual({ a: { b: err } });
        expect(api().getError('a.b')).toEqual(err);
    });

    it('validateFields：异步 Promise resolve，校验通过', async () => {
        const { api } = renderForm({ validator: () => sleep(200).then(() => '') }, pathFields());
        expect(await api().validate()).toEqual({});
        expect(api().getFormState().errors).toEqual({});
    });

    it('表单级 validator 同步返回 {} 视为通过，onSubmit 被调用', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { container } = renderForm({ onSubmit, onSubmitFail, validator: () => ({}) }, [input('input')]);
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmitFail).not.toHaveBeenCalled();
    });

    it('表单级 validator 异步 resolve {} 视为通过', async () => {
        const { api } = renderForm({ validator: () => Promise.resolve({}) }, [input('input')]);
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
            [input('input')]
        );
        await expect(api().validate()).rejects.toBe(error);
    });
});

describe('Svelte Form-baseForm 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('form 元素默认带 novalidate，可通过 novalidate={false} 关闭', () => {
        const { container, store } = renderForm({}, nameInput());
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
        store.form.novalidate = false;
        flushSync();
        expect(container.querySelector('form')).not.toHaveAttribute('novalidate');
    });

    it('bind:this 拿到的实例通过 getFormApi() 暴露 formApi', () => {
        let reported: FormApi | undefined;
        const { component } = render(FormRef, { props: { onApi: (api: FormApi) => (reported = api) } });
        expect(component.getInstance()?.getFormApi()).toBe(reported);
    });

    it('data-* 与 aria 属性透传到 form 元素，并将 id 用作 x-form-id', () => {
        const { container } = renderForm({ id: 'my-form', 'data-testid': 'form', 'aria-label': 'profile' });
        const form = container.querySelector('form');
        expect(form).not.toHaveAttribute('labelposition');
        expect(form).toHaveAttribute('data-testid', 'form');
        expect(form).toHaveAttribute('aria-label', 'profile');
        expect(form).toHaveAttribute('id', 'my-form');
        expect(form).toHaveAttribute('x-form-id', 'my-form');
    });

    it('未传 id 时为 form 元素生成 id', () => {
        const { container } = renderForm();
        const form = container.querySelector('form');
        expect(form?.getAttribute('id')).toBeTruthy();
        expect(form?.getAttribute('x-form-id')).toBe(form?.getAttribute('id'));
    });

    it('Form 从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Form: { labelPosition: 'left', layout: 'horizontal' } };
        const { container } = renderForm({}, nameInput());
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
    });

    it('字段在同一次渲染中获取到变化后的 Form 属性', () => {
        const { container, store } = renderForm({}, nameInput());
        expect(getInput()).not.toBeDisabled();
        store.form.disabled = true;
        store.form.labelPosition = 'left';
        flushSync();
        expect(getInput()).toBeDisabled();
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
    });

    it('children snippet 接收 formState、values 与 formApi', async () => {
        renderForm({}, nameInput(), { showState: true });
        await typeInto(getInput(), 'semi');
        expect(JSON.parse(screen.getByTestId('values').textContent ?? '')).toEqual({ name: 'semi' });
        expect(JSON.parse(screen.getByTestId('state').textContent ?? '').values).toEqual({ name: 'semi' });
        expect(JSON.parse(screen.getByTestId('scope-api').textContent ?? '')).toEqual({ name: 'semi' });
    });

    it('stopPropagation 使提交与重置限制在嵌套 Form 内', async () => {
        const outer = vi.fn<(event: Event) => void>();
        const { container } = renderForm({ stopPropagation: { submit: true, reset: true } });
        container.addEventListener('submit', outer);
        container.addEventListener('reset', outer);
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        expect(outer).not.toHaveBeenCalled();
    });

    it('onErrorChange 上报全部错误及变化的那一项', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ onErrorChange }, [input('name', { validator: (value: unknown) => (value === 'ok' ? '' : 'bad') })]);
        await typeInto(getInput(), 'x');
        await waitFor(() => expect(onErrorChange).toHaveBeenLastCalledWith({ name: 'bad' }, { name: 'bad' }));
    });

    it('trigger 为 custom 时跳过变化校验，mount 时挂载即校验', async () => {
        const { api } = renderForm({}, [input('a', { trigger: 'custom', validator: () => 'a-err' }), input('b', { trigger: 'mount', validator: () => 'b-err' })]);
        await waitFor(() => expect(api().getError('b')).toBe('b-err'));
        await typeInto(document.querySelector('[x-field-id="a"] input') as HTMLInputElement, 'x');
        await sleep(10);
        expect(api().getError('a')).toBeUndefined();
        await expect(api().validate(['a'])).rejects.toEqual({ a: 'a-err', b: 'b-err' });
        expect(api().getError('a')).toBe('a-err');
    });

    it('stopValidateWithError 在第一条失败规则处停止', async () => {
        const rules = [
            { required: true, message: 'required' },
            { validator: () => false, message: 'second' },
        ];
        const { api } = renderForm({}, [input('all', { rules }), input('first', { rules, stopValidateWithError: true })]);
        await expect(api().validate()).rejects.toBeDefined();
        expect(api().getError('all')).toEqual(['required', 'second']);
        expect(api().getError('first')).toBe('required');
    });

    it('keepState 在字段重新挂载时恢复其值', async () => {
        const { api, store } = renderForm({}, [input('name', { keepState: true })]);
        await typeInto(getInput(), 'semi');
        store.fields[0].shown = false;
        flushSync();
        expect(api().getValue('name')).toBe('semi');
        store.fields[0].shown = true;
        flushSync();
        expect(getInput()).toHaveValue('semi');
    });

    it('挂载且字段注册完成后调用一次 getFormApi', () => {
        let existed: boolean | undefined;
        const { onGetFormApi, api } = renderForm({}, nameInput());
        existed = api().getFieldExist('name');
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
        expect(existed).toBe(true);
    });

    it('不把自身属性放到 form 元素上', () => {
        const { container } = renderForm({ disabled: true, stopPropagation: { submit: true } });
        const form = container.querySelector('form');
        expect(form).not.toHaveAttribute('disabled');
        expect(form).not.toHaveAttribute('stopPropagation');
        expect(form).not.toHaveAttribute('stoppropagation');
    });

    it('每个字段只注册一次，卸载时注销', async () => {
        const onValueChange = vi.fn<(...args: unknown[]) => void>();
        const { api, store } = renderForm({ onValueChange }, [input('name', { initValue: 'semi' })]);
        expect(api().getFieldExist('name')).toBe(true);
        expect(api().getValues()).toEqual({ name: 'semi' });
        await typeInto(getInput(), 'design');
        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'design' }, { name: 'design' });
        store.fields[0].shown = false;
        flushSync();
        expect(api().getFieldExist('name')).toBe(false);
        expect(api().getValues()).toEqual({});
    });
});
