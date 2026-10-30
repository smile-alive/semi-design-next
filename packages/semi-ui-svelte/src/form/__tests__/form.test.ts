import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import semiGlobal from '../../_utils/semi-global';
import type { FormApi } from '../interface';
import FormRef from './form-ref.svelte';
import { errorSelector, fieldSelector, getInput, input, labelSelector, prefix, renderForm, settle, typeInto } from './helpers';

describe('Svelte Form 基础', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class、style 与未声明属性落在 form 元素上，id 同时写入 x-form-id', () => {
        const { container } = renderForm({ class: 'form-test', style: 'color: red', 'data-x': '1', 'aria-label': '表单', id: 'my-form' });
        const form = container.querySelector('form') as HTMLFormElement;
        expect(form).toHaveClass('form-test', prefix, `${prefix}-vertical`);
        expect(form).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(form).toHaveAttribute('data-x', '1');
        expect(form).toHaveAttribute('aria-label', '表单');
        expect(form).toHaveAttribute('id', 'my-form');
        expect(form).toHaveAttribute('x-form-id', 'my-form');
        expect(form).not.toHaveAttribute('labelposition');
    });

    it('未传 id 时生成 id；默认带 novalidate，novalidate={false} 可关闭', () => {
        const { container, store } = renderForm();
        const form = container.querySelector('form') as HTMLFormElement;
        expect(form.id).not.toBe('');
        expect(form.getAttribute('x-form-id')).toBe(form.id);
        expect(form).toHaveAttribute('novalidate');
        store.form.novalidate = false;
        flushSync();
        expect(form).not.toHaveAttribute('novalidate');
    });

    it('layout 变化时切换布局类', () => {
        const { container, store } = renderForm();
        store.form.layout = 'horizontal';
        flushSync();
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-vertical`)).toBeNull();
    });

    it('labelPosition、labelWidth、labelAlign 下发到字段，Form 属性变化时字段同步更新', () => {
        const { container, store } = renderForm({ labelPosition: 'left', labelWidth: 200, labelAlign: 'right' }, [input('a'), input('b')]);
        const fields = container.querySelectorAll(fieldSelector);
        expect(fields[0]).toHaveAttribute('x-label-pos', 'left');
        const labels = container.querySelectorAll<HTMLElement>(labelSelector);
        expect(labels).toHaveLength(2);
        expect(labels[0]).toHaveStyle({ width: '200px' });
        expect(labels[0]).toHaveClass(`${prefix}-field-label-right`);
        store.form.labelWidth = '300px';
        flushSync();
        expect(labels[1]).toHaveStyle({ width: '300px' });
    });

    it('children snippet 收到实时的 formState 与 values', async () => {
        renderForm({}, [input('UserName')], { showState: true });
        await typeInto(getInput(), 'semi');
        expect(JSON.parse(screen.getByTestId('state').textContent ?? '').values).toEqual({ UserName: 'semi' });
        expect(JSON.parse(screen.getByTestId('values').textContent ?? '')).toEqual({ UserName: 'semi' });
    });

    it('挂载且字段注册后调用一次 getFormApi，api 方法齐全并能读到字段初值', () => {
        let valuesAtMount: unknown;
        const { onGetFormApi, api } = renderForm({}, [input('name', { initValue: 'semi' })]);
        valuesAtMount = api().getValues();
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
        for (const name of ['setValue', 'setValues', 'setError', 'setTouched', 'submitForm', 'reset', 'getInitValue', 'getFieldExist', 'getFormState', 'getTouched', 'getValue', 'getError', 'validate'] as const) {
            expect(api()[name]).toEqual(expect.any(Function));
        }
        expect(valuesAtMount).toEqual({ name: 'semi' });
        expect(api().getFieldExist('name')).toBe(true);
    });

    it('formApi.submitForm 与 DOM submit 都发出 onSubmit，参数为表单值', async () => {
        const onSubmit = vi.fn<(values: unknown) => void>();
        const { container, api } = renderForm({ onSubmit }, [input('input')]);
        api().submitForm();
        await settle();
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][0]).toEqual({});
        await typeInto(getInput(), 'semi');
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await settle();
        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onSubmit.mock.calls[1][0]).toEqual({ input: 'semi' });
    });

    it('校验失败时发出 onSubmitFail，不发出 onSubmit', async () => {
        const onSubmit = vi.fn<(values: unknown) => void>();
        const onSubmitFail = vi.fn<(errors: unknown) => void>();
        const { api } = renderForm({ onSubmit, onSubmitFail }, [input('name', { validator: (value: unknown) => (value ? '' : '必填') })]);
        api().submitForm();
        await settle();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail).toHaveBeenCalledTimes(1);
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: '必填' });
        expect(document.querySelector(errorSelector)).toHaveTextContent('必填');
    });

    it('reset 恢复初值、清除错误并发出 onReset', async () => {
        const onReset = vi.fn<() => void>();
        const { container, api } = renderForm({ onReset, initValues: { name: 'init' } }, [input('name', { rules: [{ required: true, message: '必填' }] })]);
        expect(getInput()).toHaveValue('init');
        await typeInto(getInput(), '');
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('必填');
        await fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        await settle();
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('init');
        expect(container.querySelector(errorSelector)).toBeNull();
        expect(api().getValues()).toEqual({ name: 'init' });
    });

    it('allowEmpty 时值变为空后保留 key', async () => {
        const { api } = renderForm({ allowEmpty: true }, [input('name', { initValue: 'a' })]);
        await typeInto(getInput(), '');
        expect(api().getValues()).toHaveProperty('name');
        const other = renderForm({}, [input('name', { initValue: 'a' })]);
        await typeInto(getInput(other.container), '');
        expect(other.api().getValues()).not.toHaveProperty('name');
    });

    it('onValueChange 与 onChange 收到最新的值与状态', async () => {
        const onValueChange = vi.fn<(values: unknown, changed: unknown) => void>();
        const onChange = vi.fn<(state: { values: unknown }) => void>();
        renderForm({ onValueChange, onChange }, [input('name')]);
        await typeInto(getInput(), 'semi');
        expect(onValueChange).toHaveBeenLastCalledWith({ name: 'semi' }, { name: 'semi' });
        expect(onChange.mock.lastCall?.[0].values).toEqual({ name: 'semi' });
    });

    it('disabled 下发到字段，字段自身的 disabled 优先', () => {
        const { container } = renderForm({ disabled: true }, [input('a'), input('b', { disabled: false })]);
        const inputs = container.querySelectorAll('input');
        expect(inputs[0]).toBeDisabled();
        expect(inputs[1]).not.toBeDisabled();
    });

    it('labelCol 与 wrapperCol 同时设置时，Form 外包一层 Row，字段按栅格布局', () => {
        const { container } = renderForm({ labelCol: { span: 6 }, wrapperCol: { span: 18 } }, [input('a')]);
        expect(container.querySelector('.semi-row > form')).not.toBeNull();
        expect(container.querySelector(`${fieldSelector} .semi-col-6 ${labelSelector}`)).not.toBeNull();
        expect(container.querySelector(`${fieldSelector} .semi-col-18 .${prefix}-field-main input`)).not.toBeNull();
        // the Form wraps the columns in one Row, so the field adds none
        expect(container.querySelector(`${fieldSelector} .semi-row`)).toBeNull();
    });

    it('stopPropagation 让提交与重置不冒泡到外层', async () => {
        const outer = vi.fn<(event: Event) => void>();
        const { container } = renderForm({ stopPropagation: { submit: true, reset: true } });
        container.addEventListener('submit', outer);
        container.addEventListener('reset', outer);
        await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
        await fireEvent.reset(container.querySelector('form') as HTMLFormElement);
        expect(outer).not.toHaveBeenCalled();
    });

    it('从 semiGlobal 的 overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Form: { layout: 'horizontal', labelPosition: 'left' } };
        const { container } = renderForm({}, [input('a')]);
        expect(container.querySelector(`.${prefix}-horizontal`)).not.toBeNull();
        expect(container.querySelector(fieldSelector)).toHaveAttribute('x-label-pos', 'left');
    });

    it('bind:this 拿到的实例 getFormApi() 与 getFormApi 回调给出同一个 api', () => {
        let reported: FormApi | undefined;
        const holder: { instance?: { getFormApi: () => FormApi } } = {};
        render(FormRef, { props: { holder, onApi: (api: FormApi) => (reported = api) } });
        expect(holder.instance?.getFormApi()).toBe(reported);
    });
});
