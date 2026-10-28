import { For, type JSX, Show, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import { type FormApi, type FormProps, Form, FormInput, FormSelect } from '..';

function renderForm(props: FormProps, content: () => JSX.Element) {
    return render(() => <Form {...props}>{content()}</Form>);
}

const inputSelector = `.${BASE_CLASS_PREFIX}-input`;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;
const getInputDOM = (scope = '') => document.querySelector(`${scope} ${inputSelector}`) as HTMLInputElement;
const getErrorMessage = (scope = '') => document.querySelector(`${scope} ${emSelector}`);
const type = (input: Element, value: string) => fireEvent.input(input, { target: { value } });

describe('Form-field', () => {
    it('FormSelect 承接 Select 的 Option 与 OptGroup', () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={{ city: 'sh' }}>
                <FormSelect field="city">
                    <FormSelect.OptGroup label="cn">
                        <FormSelect.Option value="sh">Shanghai</FormSelect.Option>
                    </FormSelect.OptGroup>
                </FormSelect>
            </Form>
        ));
        expect(formApi?.getValue('city')).toBe('sh');
        expect(document.body).toHaveTextContent('Shanghai');
    });

    it('class、style 与 fieldClassName', () => {
        const { container } = renderForm({}, () => <FormInput class="test-a" style={{ color: 'red' }} field="name" fieldClassName="field-test-b" />);
        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper.test-a`);
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field.field-test-b`)).toHaveLength(1);
    });

    it('label', () => {
        const { container } = renderForm({}, () => <FormInput label="Company" field="name" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toHaveTextContent(/^Company$/);
    });

    it('label 为 Label 属性对象', () => {
        const { container } = renderForm({}, () => <FormInput label={{ text: 'Company', extra: 'more', required: true }} field="name" />);
        const label = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`);
        expect(label).toHaveTextContent('Company');
        expect(label).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-label-required`);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-extra`)).toHaveTextContent('more');
    });

    it('节点 label 只创建一次', () => {
        const { container } = renderForm({}, () => <FormInput label={<b class="node-label">Company</b>} field="name" />);
        expect(container.querySelectorAll('.node-label')).toHaveLength(1);
    });

    it('数组形式的 label 是标签内容，不当作 Label 属性', () => {
        const { container } = render(() => (
            <Form>
                <FormInput field="top" label={['A', 'b']} />
                <FormInput field="inset" label={['C', 'd']} labelPosition="inset" />
            </Form>
        ));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-text`)).toHaveTextContent(/^Ab$/);
        expect(screen.getByRole('textbox', { name: 'Cd' })).toBeInTheDocument();
    });

    it('inset 布局下 label 为 null 时以 field 为标签', () => {
        render(() => (
            <Form>
                <FormInput field="empty" label={null} labelPosition="inset" />
            </Form>
        ));
        expect(screen.getByRole('textbox', { name: 'empty' })).toBeInTheDocument();
    });

    it('labelPosition', () => {
        const { container } = renderForm({ labelPosition: 'top' }, () => (
            <>
                <FormInput field="a" labelPosition="left" fieldClassName="left-input" />
                <FormInput field="b" fieldClassName="top-input" />
            </>
        ));
        expect(container.querySelector('.left-input')).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector('.top-input')).toHaveAttribute('x-label-pos', 'top');
    });

    it('labelAlign', () => {
        const { container } = renderForm({ labelAlign: 'right' }, () => (
            <>
                <FormInput field="a" labelAlign="left" fieldClassName="left-input" />
                <FormInput field="b" fieldClassName="right-input" />
            </>
        ));
        expect(container.querySelector(`.left-input .${BASE_CLASS_PREFIX}-form-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`.right-input .${BASE_CLASS_PREFIX}-form-field-label-right`)).not.toBeNull();
    });

    it('noLabel', () => {
        const { container } = renderForm({}, () => <FormInput noLabel field="name" />);
        expect(container.querySelector(inputSelector)).not.toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label`)).toBeNull();
    });

    it('未渲染 label 时，控件不引用不存在的 id 作为标签', () => {
        render(() => (
            <Form>
                <FormInput aria-label="Name" field="name" noLabel />
                <FormInput id="pure" field="pure" pure />
                <FormInput id="inset" field="inset" label="Inset" labelPosition="inset" pure />
            </Form>
        ));
        expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-labelledby');
        expect(document.getElementById('pure')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('textbox', { name: 'Inset' })).toHaveAttribute('aria-labelledby', 'inset-label');
    });

    it('name', () => {
        const { container } = renderForm({}, () => <FormInput field="name" name="company" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field.${BASE_CLASS_PREFIX}-form-field-company`)).not.toBeNull();
        expect(getInputDOM()).toHaveAttribute('name', 'company');
    });

    it('initValue', () => {
        renderForm({ initValues: { name: 'a' } }, () => <FormInput initValue="b" field="name" />);
        expect(getInputDOM()).toHaveValue('b');
    });

    it('onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({}, () => <FormInput onChange={onChange} field="name" />);
        type(getInputDOM(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('semi', expect.anything(), { name: 'semi' });
    });

    it('validate-sync 同步校验', async () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 'semi' ? 'invalid' : ''));
        renderForm({}, () => (
            <FormInput
                field="name"
                trigger="change"
                validator={validate}
                // rules are invalidated when validator is also declared
                rules={[
                    { type: 'string', message: 'rules error1' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'rules error2' },
                ]}
            />
        ));
        type(getInputDOM(), 'milk');
        expect(validate).toHaveBeenCalledWith('milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        type(getInputDOM(), 'semi');
        await waitFor(() => expect(getErrorMessage()).toBeNull());
    });

    it('validate-async 异步校验', async () => {
        const validate = vi.fn<(val: unknown) => Promise<string>>((val) => sleep(50).then(() => (val !== 'semi' ? 'invalid' : '')));
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => <FormInput trigger="change" validator={validate} field="name" />);
        type(getInputDOM(), 'milk');
        expect(validate).toHaveBeenNthCalledWith(1, 'milk', { name: 'milk' });
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^invalid$/));
        expect(formApi?.getError('name')).toEqual('invalid');
        type(getInputDOM(), 'semi');
        expect(validate).toHaveBeenNthCalledWith(2, 'semi', { name: 'semi' });
        await waitFor(() => expect(getErrorMessage()).toBeNull());
        expect(formApi?.getError('name')).toEqual(undefined);
    });

    it('rules', async () => {
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => (
            <FormInput
                field="name"
                trigger="change"
                rules={[
                    { type: 'string', message: 'type error' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' },
                ]}
            />
        ));
        // a DOM input always emits strings, so put a number into the field through formApi to break the type rule
        formApi?.setValue('name', 2);
        await formApi?.validate().catch(() => {});
        expect(getErrorMessage()).toHaveTextContent(/^type error, not muji$/);

        type(getInputDOM(), 'semi');
        await waitFor(() => expect(getErrorMessage()).toHaveTextContent(/^not muji$/));
    });

    it('transform', () => {
        const validate = vi.fn<(value: unknown) => string>((value) => (value !== 5 ? 'invalid' : ''));
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => <FormInput transform={(stringVal) => Number(stringVal)} validator={validate} field="count" />);
        type(getInputDOM(), '5');
        expect(validate).toHaveBeenCalledWith(5, { count: '5' });
        // only transform value before validate, can't change value in formState
        expect(formApi?.getValue('count')).toEqual('5');
        expect(getInputDOM()).toHaveValue('5');
    });

    it('convert', () => {
        const convert = vi.fn<(stringVal: unknown) => number>((stringVal) => Number(stringVal));
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => <FormInput convert={convert} field="count" />);
        type(getInputDOM(), '5');
        expect(convert).toHaveBeenCalledWith('5');
        expect(formApi?.getValue('count')).toEqual(5);
    });

    it('trigger：mounted / change / blur', async () => {
        const validate = (val: unknown) => (val !== 'semi' ? 'invalid' : '');
        renderForm({}, () => (
            <>
                <FormInput trigger="change" field="a" fieldClassName="a" validator={validate} />
                <FormInput trigger="blur" field="b" fieldClassName="b" initValue="milk" validator={validate} />
            </>
        ));
        type(getInputDOM('.a'), 'trigger');
        type(getInputDOM('.b'), 'trigger');
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^invalid$/));
        expect(getErrorMessage('.b')).toBeNull();
        fireEvent.focusOut(getInputDOM('.b'));
        await waitFor(() => expect(getErrorMessage('.b')).toHaveTextContent(/^invalid$/));
    });

    it('trigger：change 与 blur', async () => {
        const validate = (val: unknown) => {
            if (val === 'changeVal') {
                return 'changeError';
            }
            return val === 'blurVal' ? 'blurError' : '';
        };
        renderForm({}, () => <FormInput trigger={['change', 'blur']} field="a" fieldClassName="a" validator={validate} />);
        type(getInputDOM('.a'), 'changeVal');
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^changeError$/));
        type(getInputDOM('.a'), 'blurVal');
        fireEvent.focusOut(getInputDOM('.a'));
        await waitFor(() => expect(getErrorMessage('.a')).toHaveTextContent(/^blurError$/));
    });

    it('失焦时调用使用方的 onBlur 并标记 touched', () => {
        const onBlur = vi.fn<(e: FocusEvent) => void>();
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => <FormInput field="name" onBlur={onBlur} />);
        fireEvent.focusOut(getInputDOM());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(formApi?.getTouched('name')).toBe(true);
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
            () => <For each={fields}>{(field, index) => <FormInput field={field} fieldClassName={`field-${index()}`} />}</For>
        );
        const fieldsDOM = container.querySelectorAll<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-form-field ${inputSelector}`);
        expect(Array.from(fieldsDOM, (input) => input.value)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-form-field-label`), (l) => l.textContent)).toEqual(fields);
    });

    it('validate 竞态条件', async () => {
        let formApi: FormApi | undefined;
        let asyncValidatorCallback: (() => void) | null = null;
        renderForm({ getFormApi: (api) => (formApi = api) }, () => (
            <FormInput
                field="text"
                rules={[
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
                ]}
            />
        ));

        // the first validation hangs until its callback is called by hand
        type(getInputDOM(), 'semi');
        await waitFor(() => expect(asyncValidatorCallback).not.toBeNull());
        expect(formApi?.getError('text')).toBeUndefined();

        type(getInputDOM(), 'Prefer knowledge to wealth, for the one is transitory, the other perpetual.');
        await waitFor(() => expect(formApi?.getError('text')).not.toBeUndefined());

        // finishing the outdated validation must not clear the newer error; nothing signals that it was dropped,
        // so give its promise chain a moment to settle
        (asyncValidatorCallback as unknown as () => void)();
        await sleep(50);
        expect(formApi?.getError('text')).not.toBeUndefined();
        expect(getErrorMessage()).not.toBeNull();
    });

    it('数组类 field：卸载 value[0].name 后其余数组项保持原位', () => {
        let formApi: FormApi | undefined;
        const [show, setShow] = createSignal(true);
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={{ value: [{ name: 'kkk' }, { name: 'ccc' }, { name: 'ddd' }] }}>
                <Show when={show()}>
                    <FormInput field="value[0].name" />
                </Show>
            </Form>
        ));
        expect(getInputDOM()).toHaveValue('kkk');

        setShow(false);
        const value = formApi?.getValue('value');
        expect(value).toHaveLength(3);
        expect(value[0]).toBeUndefined();
        expect(value.slice(1)).toEqual([{ name: 'ccc' }, { name: 'ddd' }]);
    });

    it('字段带自身 labelCol 与 wrapperCol 时，在自己的 Row 中布局', () => {
        const { container } = render(() => (
            <Form>
                <FormInput field="name" label="Name" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} />
            </Form>
        ));
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        const row = field?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-row`);
        expect(row).not.toBeNull();
        expect(row?.querySelector(`.${BASE_CLASS_PREFIX}-col-6`)).not.toBeNull();
        expect(row?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('Form 同时设置两列时，保留单个表单级 Row', () => {
        const { container } = render(() => (
            <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <FormInput field="name" label="Name" />
            </Form>
        ));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-row`)).toHaveLength(1);
        const field = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field`);
        expect(field?.querySelector(`:scope > .${BASE_CLASS_PREFIX}-col-18`)).not.toBeNull();
    });

    it('labelPosition 为 top 且分两列时，标签列包在 overflow hidden 的容器中', () => {
        const { container } = render(() => (
            <Form labelPosition="top" labelAlign="right" labelCol={{ span: 6, class: 'own-col' }} wrapperCol={{ span: 18 }}>
                <FormInput field="name" label="Name" />
            </Form>
        ));
        const labelCol = container.querySelector(`.${BASE_CLASS_PREFIX}-col-6`);
        expect(labelCol?.parentElement).toHaveStyle({ overflow: 'hidden' });
        expect(labelCol).toHaveClass('own-col', `${BASE_CLASS_PREFIX}-form-col-right`);
    });

    it('ref 传到被包裹的组件', () => {
        let ref: HTMLDivElement | undefined;
        render(() => (
            <Form>
                <FormInput ref={(node) => (ref = node)} field="name" />
            </Form>
        ));
        expect(ref).toBe(getInputDOM().closest(`.${BASE_CLASS_PREFIX}-input-wrapper`));
    });

    it('pure 只渲染控件，noErrorMessage 去掉错误信息块', async () => {
        let formApi: FormApi | undefined;
        const { container } = renderForm({ getFormApi: (api) => (formApi = api) }, () => (
            <>
                <FormInput class="pure" field="pure" pure name="p" fieldClassName="pure-field" />
                <FormInput field="quiet" noErrorMessage validator={() => 'quiet-err'} />
            </>
        ));
        const pure = container.querySelector('.pure');
        expect(pure).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-pure`, `${BASE_CLASS_PREFIX}-form-field-p`, 'pure-field');
        expect(pure?.closest(`.${BASE_CLASS_PREFIX}-form-field`)).toBeNull();
        await expect(formApi?.validate(['quiet'])).rejects.toEqual({ quiet: 'quiet-err' });
        expect(getErrorMessage('[x-field-id="quiet"]')).toBeNull();
        expect(getInputDOM('[x-field-id="quiet"]')).toHaveAttribute('aria-invalid', 'true');
    });

    it('helpText 与 extraText 描述控件', () => {
        const { container } = renderForm({}, () => <FormInput id="name" extraText="extra" extraTextPosition="middle" field="name" helpText="help" />);
        expect(getInputDOM()).toHaveAttribute('aria-describedby', 'name-helpText name-extraText');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-extra-middle`)).toHaveTextContent('extra');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-extra-string`)).not.toBeNull();
        expect(container.querySelector('#name-helpText')).toHaveTextContent('help');
    });

    it('extraText 默认显示在底部', () => {
        const { container } = renderForm({}, () => <FormInput extraText={<i>extra</i>} field="name" />);
        const extra = container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-extra`);
        expect(extra).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-extra-bottom`);
        expect(extra).not.toHaveClass(`${BASE_CLASS_PREFIX}-form-field-extra-string`);
        expect(extra?.previousElementSibling).toHaveClass(`${BASE_CLASS_PREFIX}-input-wrapper`);
    });

    it('属性中的 validateStatus 优先于校验状态', async () => {
        let formApi: FormApi | undefined;
        const { container } = renderForm({ getFormApi: (api) => (formApi = api) }, () => <FormInput field="name" validateStatus="warning" validator={() => 'err'} />);
        await expect(formApi?.validate()).rejects.toEqual({ name: 'err' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('onChange 抛错时表单值回滚', () => {
        let formApi: FormApi | undefined;
        renderForm({ getFormApi: (api) => (formApi = api), initValues: { name: 'init' } }, () => (
            <FormInput
                field="name"
                onChange={() => {
                    throw new Error('rejected');
                }}
            />
        ));
        const onError = (e: ErrorEvent) => e.preventDefault();
        window.addEventListener('error', onError);
        try {
            type(getInputDOM(), 'a');
        } finally {
            window.removeEventListener('error', onError);
        }
        expect(formApi?.getValue('name')).toBe('init');
        expect(getInputDOM()).toHaveValue('init');
    });

    it('Form 外的字段告警且不渲染', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => <FormInput field="name" />);
        expect(container).toBeEmptyDOMElement();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('must be use inside the Form'));
        warn.mockRestore();
    });

    it('缺少 field 时告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(() => (
            <Form>
                <FormInput {...({} as { field: string })} />
            </Form>
        ));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("'field' is required"));
        warn.mockRestore();
    });
});
