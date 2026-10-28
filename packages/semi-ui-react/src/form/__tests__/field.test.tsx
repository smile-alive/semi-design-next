import { createRef, type ComponentProps } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form } from '@fibrae/semi-ui-react';
import type { InputHandle } from '@fibrae/semi-ui-react/input';
import { sleep } from '@test/utils/react';
import type { FormApi } from '../interface';

function renderForm(props: Record<string, unknown>) {
    return render(<Form {...props} />);
}

// Cases pass loosely typed prop bags (some intentionally invalid), so the bag is cast to the real props
function getInput({ key, ...props }: Record<string, unknown>) {
    return <Form.Input key={key as string} {...(props as unknown as ComponentProps<typeof Form.Input>)} />;
}

const inputSelector = `.${BASE_CLASS_PREFIX}-input`;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;
const getInputDOM = (scope = '') => document.querySelector(`${scope} ${inputSelector}`);
const getErrorMessage = (scope = '') => document.querySelector(`${scope} ${emSelector}`);

describe('Form-field', () => {
    it('Form.Select 承接 Select 的 Option 与 OptGroup', () => {
        const formApi: { current: FormApi | null } = { current: null };
        render(
            <Form getFormApi={(api) => (formApi.current = api)} initValues={{ city: 'sh' }}>
                <Form.Select field="city">
                    <Form.Select.OptGroup label="cn">
                        <Form.Select.Option value="sh">Shanghai</Form.Select.Option>
                    </Form.Select.OptGroup>
                </Form.Select>
            </Form>
        );
        expect(formApi.current?.getValue('city')).toBe('sh');
        expect(document.body).toHaveTextContent('Shanghai');
    });

    it('className、style 与 fieldClassName', () => {
        const fieldProps = {
            className: 'test-a',
            style: {
                color: 'red',
            },
            fieldClassName: 'field-test-b',
        };
        const { container } = renderForm({ children: getInput(fieldProps) });
        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper.test-a`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field.field-test-b`)).toHaveLength(1);
    });
    it('label', () => {
        const { container } = renderForm({
            children: getInput({
                label: 'Company',
                field: 'name',
            }),
        });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toHaveTextContent(/^Company$/);
    });
    it('数组形式的 label 是标签内容，不当作 Label 属性', () => {
        const { container, getByRole } = render(
            <Form>
                <Form.Input field="top" label={['A', 'b']} />
                <Form.Input field="inset" label={['C', 'd']} labelPosition="inset" />
            </Form>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-text`)).toHaveTextContent(/^Ab$/);
        expect(getByRole('textbox', { name: 'Cd' })).toBeInTheDocument();
    });
    it('inset 布局下 label 为 null 时以 field 为标签', () => {
        const { getByRole } = render(
            <Form>
                <Form.Input field="empty" label={null} labelPosition="inset" />
            </Form>
        );
        expect(getByRole('textbox', { name: 'empty' })).toBeInTheDocument();
    });
    it('labelPosition', () => {
        const { container } = renderForm({
            labelPosition: 'top',
            children: (
                <>
                    {getInput({ field: 'a', labelPosition: 'left', fieldClassName: 'left-input' })}
                    {getInput({ field: 'b', fieldClassName: 'top-input' })}
                </>
            ),
        });
        expect(container.querySelector('.left-input')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.top-input')).toHaveAttribute('x-label-pos', 'top');
    });
    it('labelAlign', () => {
        const { container } = renderForm({
            labelAlign: 'right',
            children: (
                <>
                    {getInput({ field: 'a', labelAlign: 'left', fieldClassName: 'left-input' })}
                    {getInput({ field: 'b', fieldClassName: 'right-input' })}
                </>
            ),
        });
        expect(container.querySelector(`.left-input .${BASE_CLASS_PREFIX}-form-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`.right-input .${BASE_CLASS_PREFIX}-form-field-label-right`)).not.toBeNull();
    });
    it('noLabel', () => {
        const { container } = renderForm({ children: getInput({ noLabel: true, field: 'name' }) });
        expect(container.querySelector(inputSelector)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toBeNull();
    });
    it('未渲染 label 时，控件不引用不存在的 id 作为标签', () => {
        const { getByRole } = render(
            <Form>
                <Form.Input aria-label="Name" field="name" noLabel />
                <Form.Input id="pure" field="pure" pure />
                <Form.Input id="inset" field="inset" label="Inset" labelPosition="inset" pure />
            </Form>
        );
        expect(getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-labelledby');
        expect(document.getElementById('pure')).not.toHaveAttribute('aria-labelledby');
        expect(getByRole('textbox', { name: 'Inset' })).toHaveAttribute('aria-labelledby', 'inset-label');
    });
    it('name', () => {
        const { container } = renderForm({ children: getInput({ field: 'name', name: 'company' }) });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field.${BASE_CLASS_PREFIX}-form-field-company`)).not.toBeNull();
    });
    it('initValue', () => {
        renderForm({
            children: getInput({ initValue: 'b', field: 'name' }),
            initValues: {
                name: 'a',
            },
        });
        expect(getInputDOM()).toHaveValue('b');
    });
    it('onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({ children: getInput({ onChange, field: 'name' }) });
        fireEvent.change(getInputDOM(), { target: { value: 'semi' } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('semi', expect.anything(), { name: 'semi' });
    });
    it('validate-sync 同步校验', async () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 'semi' ? 'invalid' : ''));
        renderForm({
            children: getInput({
                field: 'name',
                trigger: 'change',
                validator: validate,
                // rules are invalidated when validator is also declared
                rules: [
                    { type: 'string', message: 'rules error1' },
                    { validator: (_rule, value) => value === 'muji', message: 'rules error2' },
                ],
            }),
        });
        fireEvent.change(getInputDOM(), { target: { value: 'milk' } });
        expect(validate).toHaveBeenCalledWith('milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        fireEvent.change(getInputDOM(), { target: { value: 'semi' } });
        await waitFor(() => expect(getErrorMessage()).toBeNull());
    });
    it('validate-async 异步校验', async () => {
        const validate = vi.fn<(val: unknown) => Promise<string>>((val) => sleep(50).then(() => (val !== 'semi' ? 'invalid' : '')));
        let formApi = null;
        renderForm({
            getFormApi: (api) => {
                formApi = api;
            },
            children: getInput({ trigger: 'change', validator: validate, field: 'name' }),
        });
        fireEvent.change(getInputDOM(), { target: { value: 'milk' } });
        expect(validate).toHaveBeenNthCalledWith(1, 'milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        expect(formApi.getError('name')).toEqual('invalid');
        fireEvent.change(getInputDOM(), { target: { value: 'semi' } });
        expect(validate).toHaveBeenNthCalledWith(2, 'semi', { name: 'semi' });
        await waitFor(() => expect(getErrorMessage()).toBeNull());
        expect(formApi.getError('name')).toEqual(undefined);
    });
    it('rules', async () => {
        let formApi = null;
        renderForm({
            getFormApi: (api) => {
                formApi = api;
            },
            children: getInput({
                field: 'name',
                trigger: 'change',
                rules: [
                    { type: 'string', message: 'type error' },
                    { validator: (_rule, value) => value === 'muji', message: 'not muji' },
                ],
            }),
        });
        // a DOM input always emits strings, so put a number into the field through formApi to break the type rule
        void act(() => formApi.setValue('name', 2));
        await act(() => formApi.validate().catch(() => {}));
        expect(getErrorMessage()).toHaveTextContent(/^type error, not muji$/);

        fireEvent.change(getInputDOM(), { target: { value: 'semi' } });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^not muji$/));
    });
    it('transform', () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 5 ? 'invalid' : ''));
        let formApi = null;
        renderForm({
            getFormApi: (api) => {
                formApi = api;
            },
            children: getInput({ transform: (stringVal) => Number(stringVal), validator: validate, field: 'count' }),
        });
        fireEvent.change(getInputDOM(), { target: { value: '5' } });
        expect(validate).toHaveBeenCalledWith(5, { count: '5' });
        // only transform value before validate, can't change value in formState
        expect(formApi.getValue('count')).toEqual('5');
        expect(getInputDOM()).toHaveValue('5');
    });
    it('convert', () => {
        const convert = vi.fn<(stringVal: unknown) => number>((stringVal) => Number(stringVal));
        let formApi = null;
        renderForm({
            getFormApi: (api) => {
                formApi = api;
            },
            children: getInput({ convert, field: 'count' }),
        });
        fireEvent.change(getInputDOM(), { target: { value: '5' } });
        expect(convert).toHaveBeenCalledWith('5');
        expect(formApi.getValue('count')).toEqual(5);
    });

    it('trigger：mounted / change / blur', async () => {
        const validate = (val) => (val !== 'semi' ? 'invalid' : '');
        const propsChange = {
            trigger: 'change',
            field: 'a',
            fieldClassName: 'a',
            validator: validate,
        };
        const propsBlur = {
            trigger: 'blur',
            field: 'b',
            fieldClassName: 'b',
            initValue: 'milk',
            validator: validate,
        };
        renderForm({
            children: (
                <>
                    {getInput(propsChange)}
                    {getInput(propsBlur)}
                </>
            ),
        });
        fireEvent.change(getInputDOM('.a'), { target: { value: 'trigger' } });
        fireEvent.change(getInputDOM('.b'), { target: { value: 'trigger' } });
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^invalid$/));
        expect(getErrorMessage('.b')).toBeNull();
        fireEvent.blur(getInputDOM('.b'));
        await waitFor(() => expect(getErrorMessage('.b')).toHaveTextContent(/^invalid$/));
    });

    it('trigger：change 与 blur', async () => {
        const validate = (val) => {
            if (val === 'changeVal') {
                return 'changeError';
            } else if (val === 'blurVal') {
                return 'blurError';
            } else {
                return '';
            }
        };
        renderForm({
            children: <>{getInput({ trigger: ['change', 'blur'], field: 'a', fieldClassName: 'a', validator: validate })}</>,
        });
        fireEvent.change(getInputDOM('.a'), { target: { value: 'changeVal' } });
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^changeError$/));
        fireEvent.change(getInputDOM('.a'), { target: { value: 'blurVal' } });
        fireEvent.blur(getInputDOM('.a'));
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^blurError$/));
    });

    it('field', () => {
        const fields = ['username', 'user[0]', 'siblings.1', 'siblings[2]', 'parents[0].name', "parents[1]['name']"];

        const { container } = renderForm({
            children: <>{fields.map((field, index) => getInput({ key: field, field, fieldClassName: `field-${index}` }))}</>,
            initValues: {
                username: 'a',
                user: ['b'],
                siblings: [0, 'c', 'd'],
                parents: [{ name: 'e' }, { name: 'f' }],
            },
        });
        const fieldsDOM = container.querySelectorAll<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-form-field ${inputSelector}`);
        expect(Array.from(fieldsDOM, (input) => input.value)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label`), (l) => l.textContent)).toEqual(fields);
    });

    it('validate 竞态条件', async () => {
        let formApi = null;
        let asyncValidatorCallback = null;

        renderForm({
            getFormApi(api) {
                formApi = api;
            },
            children: getInput({
                field: 'text',
                rules: [
                    { type: 'string', max: 10 },
                    {
                        asyncValidator(_rule, _value, callback) {
                            if (!asyncValidatorCallback) {
                                asyncValidatorCallback = callback;
                            } else {
                                callback();
                            }
                        },
                    },
                ],
            }),
        });

        // the first validation hangs until its callback is called by hand
        fireEvent.change(getInputDOM(), { target: { value: 'semi' } });
        await waitFor(() => expect(asyncValidatorCallback).not.toBeNull());
        expect(formApi.getError('text')).toBeUndefined();

        fireEvent.change(getInputDOM(), {
            target: { value: 'Prefer knowledge to wealth, for the one is transitory, the other perpetual.' },
        });
        await waitFor(() => expect(formApi.getError('text')).not.toBeUndefined());

        // finishing the outdated validation must not clear the newer error; nothing signals that it was dropped,
        // so give its promise chain a moment to settle
        void act(() => asyncValidatorCallback());
        await act(() => sleep(50));
        expect(formApi.getError('text')).not.toBeUndefined();
        expect(getErrorMessage()).not.toBeNull();
    });

    it('Debug-数组类fieldPath: unmounting value[0].name leaves the other array items at their index', () => {
        let formApi = null;
        const props = {
            getFormApi(api) {
                formApi = api;
            },
            initValues: { value: [{ name: 'kkk' }, { name: 'ccc' }, { name: 'ddd' }] },
        };
        const { rerender } = renderForm({ ...props, children: getInput({ field: 'value[0].name' }) });
        expect(getInputDOM()).toHaveValue('kkk');

        rerender(<Form {...props} />);
        const value = formApi.getValue('value');
        expect(value).toHaveLength(3);
        expect(value[0]).toBeUndefined();
        expect(value.slice(1)).toEqual([{ name: 'ccc' }, { name: 'ddd' }]);
    });

    it('字段带自身 labelCol 与 wrapperCol 时，在自己的 Row 中布局', () => {
        const { container } = render(
            <Form>
                <Form.Input field="name" label="Name" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} />
            </Form>
        );
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        const row = field.querySelector(`:scope > .${BASE_CLASS_PREFIX}-row`);
        expect(row).not.toBeNull();
        expect(row.querySelector(`.${BASE_CLASS_PREFIX}-col-6`)).not.toBeNull();
        expect(row.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('Form 同时设置两列时，保留单个表单级 Row', () => {
        const { container } = render(
            <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Form.Input field="name" label="Name" />
            </Form>
        );
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-row`)).toHaveLength(1);
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        expect(field.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('ref 传到被包裹的组件', () => {
        const ref = createRef<InputHandle>();
        render(
            <Form>
                <Form.Input ref={ref} field="name" />
            </Form>
        );
        expect(ref.current?.input).toBe(getInputDOM());
    });

    it('pure 只渲染控件，noErrorMessage 去掉错误信息块', async () => {
        let formApi;
        const { container } = renderForm({
            getFormApi: (api) => (formApi = api),
            children: (
                <>
                    <Form.Input className="pure" field="pure" pure />
                    <Form.Input field="quiet" noErrorMessage validator={() => 'quiet-err'} />
                </>
            ),
        });
        const pure = container.querySelector('.pure');
        expect(pure).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-pure`);
        expect(pure.closest(`.${BASE_CLASS_PREFIX}-form-field`)).toBeNull();
        await act(() => expect(formApi.validate(['quiet'])).rejects.toEqual({ quiet: 'quiet-err' }));
        expect(getErrorMessage('[x-field-id="quiet"]')).toBeNull();
        expect(getInputDOM('[x-field-id="quiet"]')).toHaveAttribute('aria-invalid', 'true');
    });

    it('helpText 与 extraText 描述控件', () => {
        const { container } = renderForm({
            children: <Form.Input id="name" extraText="extra" extraTextPosition="middle" field="name" helpText="help" />,
        });
        expect(getInputDOM()).toHaveAttribute('aria-describedby', 'name-helpText name-extraText');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-extra-middle`)).toHaveTextContent('extra');
        expect(container.querySelector('#name-helpText')).toHaveTextContent('help');
    });

    it('属性中的 validateStatus 优先于校验状态', async () => {
        let formApi;
        const { container } = renderForm({
            getFormApi: (api) => (formApi = api),
            children: <Form.Input field="name" validateStatus="warning" validator={() => 'err'} />,
        });
        await act(() => expect(formApi.validate()).rejects.toEqual({ name: 'err' }));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    // without an initValue the control gets value={undefined}, is uncontrolled and keeps the rejected text
    it('有 initValue 时 onChange 抛错，表单值与输入框都回滚', () => {
        let formApi;
        renderForm({
            getFormApi: (api) => (formApi = api),
            initValues: { name: 'init' },
            children: getInput({
                field: 'name',
                onChange: () => {
                    throw new Error('rejected');
                },
            }),
        });
        const onError = (e: ErrorEvent) => e.preventDefault();
        window.addEventListener('error', onError);
        try {
            fireEvent.change(getInputDOM(), { target: { value: 'a' } });
        } catch {
            // React may rethrow the handler error synchronously in tests
        } finally {
            window.removeEventListener('error', onError);
        }
        expect(formApi.getValue('name')).toBe('init');
        expect(getInputDOM()).toHaveValue('init');
    });
});
