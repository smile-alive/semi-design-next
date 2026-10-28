import { type JSX, splitProps } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { type FormApi, Form, FormInput, useFieldApi, useFieldState, useForm, useFormApi, useFormState, withField } from '..';

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`) as HTMLInputElement;

describe('Form hooks', () => {
    it('useFormApi 返回 getFormApi 交出的 api', () => {
        let fromHook: FormApi | undefined;
        let fromCallback: FormApi | undefined;
        const Probe = () => {
            fromHook = useFormApi();
            return null;
        };
        render(() => (
            <Form getFormApi={(api) => (fromCallback = api)}>
                <FormInput field="name" />
                <Probe />
            </Form>
        ));
        expect(fromHook).toBe(fromCallback);
        fromHook?.setValue('name', 'semi');
        expect(getInput('name')).toHaveValue('semi');
    });

    it('Form 之外 useFormApi 与 useFormState 返回空对象', () => {
        let api: FormApi | undefined;
        let state: unknown;
        const Probe = () => {
            api = useFormApi();
            state = useFormState()();
            return null;
        };
        render(() => <Probe />);
        expect(api).toEqual({});
        expect(state).toEqual({});
    });

    it('useFormState 跟随最新的 values、errors 与 touched', () => {
        const Probe = () => {
            const formState = useFormState();
            return <pre data-testid="state">{JSON.stringify(formState())}</pre>;
        };
        render(() => (
            <Form>
                <FormInput field="name" />
                <Probe />
            </Form>
        ));
        fireEvent.input(getInput('name'), { target: { value: 'semi' } });
        expect(JSON.parse(screen.getByTestId('state').textContent ?? '')).toEqual({ values: { name: 'semi' }, errors: {}, touched: { name: true } });
    });

    it('useFieldState 读取单个字段，useFieldApi 写入该字段', () => {
        let fieldApi: ReturnType<typeof useFieldApi> | undefined;
        const Probe = () => {
            const fieldState = useFieldState('name');
            fieldApi = useFieldApi('name');
            return <span data-testid="field">{JSON.stringify(fieldState())}</span>;
        };
        render(() => (
            <Form>
                <FormInput field="name" />
                <Probe />
            </Form>
        ));
        fieldApi?.setValue('semi');
        expect(getInput('name')).toHaveValue('semi');
        expect(fieldApi?.getValue()).toBe('semi');
        fieldApi?.setError('bad');
        fieldApi?.setTouched(true);
        expect(fieldApi?.getError()).toBe('bad');
        expect(fieldApi?.getTouched()).toBe(true);
        expect(JSON.parse(screen.getByTestId('field').textContent ?? '')).toEqual({ value: 'semi', error: 'bad', touched: true });
    });

    it('withField 向自定义控件注入 value 与 onChange，并把 ref 转发给它', () => {
        interface ControlProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
            value?: string;
            onChange?: (value: string) => void;
            validateStatus?: string;
        }
        const Control = (props: ControlProps) => {
            const [local, rest] = splitProps(props, ['value', 'onChange', 'validateStatus']);
            return <input {...rest} data-status={local.validateStatus} value={local.value ?? ''} onInput={(e) => local.onChange?.(e.currentTarget.value)} />;
        };
        const FormControl = withField(Control);
        let api: FormApi | undefined;
        let inputRef: HTMLInputElement | undefined;
        render(() => (
            <Form getFormApi={(formApi) => (api = formApi)}>
                <FormControl ref={(el: HTMLInputElement) => (inputRef = el)} id="custom" data-testid="custom" field="custom" />
            </Form>
        ));
        const input = screen.getByTestId('custom');
        fireEvent.input(input, { target: { value: 'semi' } });
        expect(api?.getValue('custom')).toBe('semi');
        expect(input).toHaveValue('semi');
        expect(inputRef).toBe(input);
        expect(input).toHaveAttribute('id', 'custom');
        expect(input).toHaveAttribute('aria-labelledby', 'custom-label');
    });
});

describe('Form.useForm', () => {
    it('绑定到 Form 后 formState 与 values 跟随表单', () => {
        let state: ReturnType<typeof useForm> | undefined;
        const Demo = () => {
            state = useForm();
            const [formApi, , values] = state;
            return (
                <Form form={formApi}>
                    <FormInput field="name" />
                    <span data-testid="values">{JSON.stringify(values())}</span>
                </Form>
            );
        };
        render(() => <Demo />);
        fireEvent.input(getInput('name'), { target: { value: 'semi' } });
        expect(screen.getByTestId('values')).toHaveTextContent('{"name":"semi"}');
        expect(state?.[1]().touched).toEqual({ name: true });
        state?.[0].setValue('name', 'next');
        expect(getInput('name')).toHaveValue('next');
    });

    it('挂载前读取 Symbol 属性不抛错', () => {
        const [api] = useForm();
        expect(() => String(api)).not.toThrow();
        expect(Object.prototype.toString.call(api)).toBe('[object Object]');
    });

    it('挂载前不是 thenable，await 立即得到它本身', async () => {
        const [api] = useForm();
        expect((api as unknown as { then?: unknown }).then).toBeUndefined();
        await expect(Promise.resolve(api)).resolves.toBe(api);
    });

    it('Form.useForm 与 useForm 是同一个函数', () => {
        expect(Form.useForm).toBe(useForm);
    });
});
