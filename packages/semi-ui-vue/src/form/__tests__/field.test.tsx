/** @jsxImportSource vue */
import { defineComponent, nextTick, ref, type VNodeChild } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render, sleep } from '@test/utils/vue';
import { Form, type FieldHandle, type FormApi } from '..';
import type { InputHandle } from '../../input';
import { FormInput, renderForm } from './fixtures/fields';

const inputSelector = `.${BASE_CLASS_PREFIX}-input`;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;
const getInputDOM = (scope = '') => document.querySelector(`${scope} ${inputSelector}`) as HTMLInputElement;
const getErrorMessage = (scope = '') => document.querySelector(`${scope} ${emSelector}`);
const input = (props: { field: string } & Record<string, unknown>, slots?: Record<string, () => VNodeChild>) => <FormInput {...props}>{slots}</FormInput>;

describe('Form-field', () => {
    it('class、style 与 fieldClassName', () => {
        const { container } = renderForm({}, () => input({ field: 'name', class: 'test-a', style: { color: 'red' }, fieldClassName: 'field-test-b' }));
        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper.test-a`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field.field-test-b`)).toHaveLength(1);
    });

    it('label', () => {
        const { container } = renderForm({}, () => input({ label: 'Company', field: 'name' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toHaveTextContent(/^Company$/);
    });

    it('#fieldLabel 插槽里的多个节点是标签内容，inset 布局同样使用它', () => {
        const { container } = renderForm({}, () => [input({ field: 'top' }, { fieldLabel: () => ['A', 'b'] }), input({ field: 'inset', labelPosition: 'inset' }, { fieldLabel: () => ['C', 'd'] })]);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-text`)).toHaveTextContent(/^Ab$/);
        expect(screen.getByRole('textbox', { name: 'Cd' })).toBeInTheDocument();
    });

    it('inset 布局下没有 label 时以 field 为标签', () => {
        renderForm({}, () => input({ field: 'empty', labelPosition: 'inset' }));
        expect(screen.getByRole('textbox', { name: 'empty' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        const { container } = renderForm({ labelPosition: 'top' }, () => [input({ field: 'a', labelPosition: 'left', fieldClassName: 'left-input' }), input({ field: 'b', fieldClassName: 'top-input' })]);
        expect(container.querySelector('.left-input')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.top-input')).toHaveAttribute('x-label-pos', 'top');
    });

    it('labelAlign', () => {
        const { container } = renderForm({ labelAlign: 'right' }, () => [input({ field: 'a', labelAlign: 'left', fieldClassName: 'left-input' }), input({ field: 'b', fieldClassName: 'right-input' })]);
        expect(container.querySelector(`.left-input .${BASE_CLASS_PREFIX}-form-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`.right-input .${BASE_CLASS_PREFIX}-form-field-label-right`)).not.toBeNull();
    });

    it('noLabel', () => {
        const { container } = renderForm({}, () => input({ noLabel: true, field: 'name' }));
        expect(container.querySelector(inputSelector)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toBeNull();
    });

    it('未渲染 label 时，控件不引用不存在的 id 作为标签', () => {
        renderForm({}, () => [input({ 'aria-label': 'Name', field: 'name', noLabel: true }), input({ id: 'pure', field: 'pure', pure: true }), input({ id: 'inset', field: 'inset', label: 'Inset', labelPosition: 'inset', pure: true })]);
        expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-labelledby');
        expect(document.getElementById('pure')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('textbox', { name: 'Inset' })).toHaveAttribute('aria-labelledby', 'inset-label');
    });

    it('name', () => {
        const { container } = renderForm({}, () => input({ field: 'name', name: 'company' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field.${BASE_CLASS_PREFIX}-form-field-company`)).not.toBeNull();
    });

    it('initValue', () => {
        renderForm({ initValues: { name: 'a' } }, () => input({ initValue: 'b', field: 'name' }));
        expect(getInputDOM()).toHaveValue('b');
    });

    it('change', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({}, () => input({ onChange, field: 'name' }));
        await fireEvent.update(getInputDOM(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('semi', expect.anything(), { name: 'semi' });
    });

    it('validate-sync 同步校验', async () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 'semi' ? 'invalid' : ''));
        renderForm({}, () =>
            input({
                field: 'name',
                trigger: 'change',
                validator: validate,
                rules: [
                    { type: 'string', message: 'rules error1' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'rules error2' },
                ],
            })
        );
        await fireEvent.update(getInputDOM(), 'milk');
        expect(validate).toHaveBeenCalledWith('milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        await fireEvent.update(getInputDOM(), 'semi');
        await waitFor(() => expect(getErrorMessage()).toBeNull());
    });

    it('validate-async 异步校验', async () => {
        const validate = vi.fn<(val: unknown) => Promise<string>>((val) => sleep(50).then(() => (val !== 'semi' ? 'invalid' : '')));
        const { api } = renderForm({}, () => input({ trigger: 'change', validator: validate, field: 'name' }));
        await fireEvent.update(getInputDOM(), 'milk');
        expect(validate).toHaveBeenNthCalledWith(1, 'milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        expect(api().getError('name')).toEqual('invalid');
        await fireEvent.update(getInputDOM(), 'semi');
        expect(validate).toHaveBeenNthCalledWith(2, 'semi', { name: 'semi' });
        await waitFor(() => expect(getErrorMessage()).toBeNull());
        expect(api().getError('name')).toEqual(undefined);
    });

    it('rules', async () => {
        const { api } = renderForm({}, () =>
            input({
                field: 'name',
                trigger: 'change',
                rules: [
                    { type: 'string', message: 'type error' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' },
                ],
            })
        );
        // a DOM input always emits strings, so put a number into the field through formApi to break the type rule
        api().setValue('name', 2);
        await api()
            .validate()
            .catch(() => undefined);
        await nextTick();
        expect(getErrorMessage()).toHaveTextContent(/^type error, not muji$/);

        await fireEvent.update(getInputDOM(), 'semi');
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^not muji$/));
    });

    it('transform', async () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 5 ? 'invalid' : ''));
        const { api } = renderForm({}, () => input({ transform: (stringVal: unknown) => Number(stringVal), validator: validate, field: 'count' }));
        await fireEvent.update(getInputDOM(), '5');
        expect(validate).toHaveBeenCalledWith(5, { count: '5' });
        expect(api().getValue('count')).toEqual('5');
        expect(getInputDOM()).toHaveValue('5');
    });

    it('convert', async () => {
        const convert = vi.fn<(stringVal: unknown) => number>((stringVal) => Number(stringVal));
        const { api } = renderForm({}, () => input({ convert, field: 'count' }));
        await fireEvent.update(getInputDOM(), '5');
        expect(convert).toHaveBeenCalledWith('5');
        expect(api().getValue('count')).toEqual(5);
    });

    it('trigger：mount / change / blur', async () => {
        const validate = (val: unknown) => (val !== 'semi' ? 'invalid' : '');
        renderForm({}, () => [input({ trigger: 'change', field: 'a', fieldClassName: 'a', validator: validate }), input({ trigger: 'blur', field: 'b', fieldClassName: 'b', initValue: 'milk', validator: validate }), input({ trigger: 'mount', field: 'c', fieldClassName: 'c', validator: validate })]);
        await waitFor(() => expect(getErrorMessage('.c')).toHaveTextContent(/^invalid$/));
        await fireEvent.update(getInputDOM('.a'), 'trigger');
        await fireEvent.update(getInputDOM('.b'), 'trigger');
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^invalid$/));
        expect(getErrorMessage('.b')).toBeNull();
        await fireEvent.focusOut(getInputDOM('.b'));
        await waitFor(() => expect(getErrorMessage('.b')).toHaveTextContent(/^invalid$/));
    });

    it('trigger：change 与 blur', async () => {
        const validate = (val: unknown) => {
            if (val === 'changeVal') {
                return 'changeError';
            }
            return val === 'blurVal' ? 'blurError' : '';
        };
        renderForm({}, () => input({ trigger: ['change', 'blur'], field: 'a', fieldClassName: 'a', validator: validate }));
        await fireEvent.update(getInputDOM('.a'), 'changeVal');
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^changeError$/));
        await fireEvent.update(getInputDOM('.a'), 'blurVal');
        await fireEvent.focusOut(getInputDOM('.a'));
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^blurError$/));
    });

    it('field', () => {
        const fields = ['username', 'user[0]', 'siblings.1', 'siblings[2]', 'parents[0].name', "parents[1]['name']"];
        const { container } = renderForm(
            {
                initValues: {
                    username: 'a',
                    user: ['b'],
                    siblings: [0, 'c', 'd'],
                    parents: [{ name: 'e' }, { name: 'f' }],
                },
            },
            () => fields.map((field, index) => input({ key: field, field, fieldClassName: `field-${index}` }))
        );
        const fieldsDOM = container.querySelectorAll<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-form-field ${inputSelector}`);
        expect(Array.from(fieldsDOM, (el) => el.value)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label`), (l) => l.textContent)).toEqual(fields);
    });

    it('validate 竞态条件', async () => {
        let asyncValidatorCallback: (() => void) | undefined;
        const { api } = renderForm({}, () =>
            input({
                field: 'text',
                rules: [
                    { type: 'string', max: 10 },
                    {
                        asyncValidator(_rule: unknown, _value: unknown, callback: () => void) {
                            if (!asyncValidatorCallback) {
                                asyncValidatorCallback = callback;
                            } else {
                                callback();
                            }
                        },
                    },
                ],
            })
        );
        await fireEvent.update(getInputDOM(), 'semi');
        await waitFor(() => expect(asyncValidatorCallback).toBeDefined());
        expect(api().getError('text')).toBeUndefined();

        await fireEvent.update(getInputDOM(), 'Prefer knowledge to wealth, for the one is transitory, the other perpetual.');
        await waitFor(() => expect(api().getError('text')).not.toBeUndefined());

        // finishing the outdated validation must not clear the newer error; nothing signals that it was dropped,
        // so give its promise chain a moment to settle
        asyncValidatorCallback?.();
        await sleep(50);
        expect(api().getError('text')).not.toBeUndefined();
        expect(getErrorMessage()).not.toBeNull();
    });

    it('数组路径字段 value[0].name 卸载后，其他数组项保持原索引', async () => {
        let formApi: FormApi | undefined;
        const show = ref(true);
        render(() => (
            <Form onGetFormApi={(api: FormApi) => (formApi = api)} initValues={{ value: [{ name: 'kkk' }, { name: 'ccc' }, { name: 'ddd' }] }}>
                {() => (show.value ? input({ field: 'value[0].name' }) : null)}
            </Form>
        ));
        expect(getInputDOM()).toHaveValue('kkk');
        show.value = false;
        await nextTick();
        const value = formApi?.getValue('value') as unknown[];
        expect(value).toHaveLength(3);
        expect(value[0]).toBeUndefined();
        expect(value.slice(1)).toEqual([{ name: 'ccc' }, { name: 'ddd' }]);
    });

    it('字段带自身 labelCol 与 wrapperCol 时，在自己的 Row 中布局', () => {
        const { container } = renderForm({}, () => input({ field: 'name', label: 'Name', labelCol: { span: 6 }, wrapperCol: { span: 18 } }));
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        const row = field?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-row`);
        expect(row).not.toBeNull();
        expect(row?.querySelector(`.${BASE_CLASS_PREFIX}-col-6`)).not.toBeNull();
        expect(row?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('Form 同时设置两列时，保留单个表单级 Row', () => {
        const { container } = renderForm({ labelCol: { span: 6 }, wrapperCol: { span: 18 } }, () => input({ field: 'name', label: 'Name' }));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-row`)).toHaveLength(1);
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        expect(field?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('ref 的 control 是被包裹组件的 handle', () => {
        const handle = ref<FieldHandle<InputHandle>>();
        renderForm({}, () => input({ ref: handle, field: 'name' }));
        expect(handle.value?.control?.input).toBe(getInputDOM());
    });

    it('pure 只渲染控件，noErrorMessage 去掉错误信息块', async () => {
        const { api, container } = renderForm({}, () => [input({ class: 'pure', field: 'pure', pure: true }), input({ field: 'quiet', noErrorMessage: true, validator: () => 'quiet-err' })]);
        const pure = container.querySelector('.pure');
        expect(pure).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-pure`);
        expect(pure?.closest(`.${BASE_CLASS_PREFIX}-form-field`)).toBeNull();
        await expect(api().validate(['quiet'])).rejects.toEqual({ quiet: 'quiet-err' });
        await nextTick();
        expect(getErrorMessage('[x-field-id="quiet"]')).toBeNull();
        expect(getInputDOM('[x-field-id="quiet"]')).toHaveAttribute('aria-invalid', 'true');
    });

    it('#helpText 与 #extraText 描述控件', () => {
        const { container } = renderForm({}, () => input({ id: 'name', extraTextPosition: 'middle', field: 'name' }, { extraText: () => 'extra', helpText: () => 'help' }));
        expect(getInputDOM()).toHaveAttribute('aria-describedby', 'name-helpText name-extraText');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-extra-middle`)).toHaveTextContent('extra');
        expect(container.querySelector('#name-helpText')).toHaveTextContent('help');
    });

    it('属性中的 validateStatus 优先于校验状态', async () => {
        const { api, container } = renderForm({}, () => input({ field: 'name', validateStatus: 'warning', validator: () => 'err' }));
        await expect(api().validate()).rejects.toEqual({ name: 'err' });
        await nextTick();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    // the error still reaches app.config.errorHandler, which here swallows it as a production app may
    it('有 initValue 时 change 监听器抛错，表单值与输入框都回滚', async () => {
        const errors: unknown[] = [];
        const Demo = defineComponent(() => () => (
            <Form initValues={{ name: 'init' }} onGetFormApi={(api: FormApi) => (formApi = api)}>
                {() =>
                    input({
                        field: 'name',
                        onChange: () => {
                            throw new Error('rejected');
                        },
                    })
                }
            </Form>
        ));
        let formApi: FormApi | undefined;
        render(Demo, {
            global: {
                config: {
                    errorHandler: (error) => {
                        errors.push(error);
                    },
                },
            },
        });
        await fireEvent.update(getInputDOM(), 'a');
        expect(errors).toHaveLength(1);
        expect(formApi?.getValue('name')).toBe('init');
        expect(getInputDOM()).toHaveValue('init');
    });
});
