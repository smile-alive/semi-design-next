import { Component, useEffect, useRef, type Ref } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Form, ArrayField, useFormApi, useFormState, useFieldApi, useFieldState, withFormApi, withFormState, withField } from '@fibrae/semi-ui-react';
import { useArrayFieldState } from '../hooks/index';
import type { FormApi, FormState } from '../interface';

const getInput = (field) => document.querySelector(`[x-field-id="${field}"] input`);

describe('Form hooks 与 HOC', () => {
    it('useFormApi 返回 getFormApi 交出的 api', () => {
        let fromHook;
        let fromCallback;
        const Probe = () => {
            const api = useFormApi();
            return <button onClick={() => (fromHook = api)}>probe</button>;
        };
        render(
            <Form getFormApi={(api) => (fromCallback = api)}>
                <Form.Input field="name" />
                <Probe />
            </Form>
        );
        fireEvent.click(screen.getByRole('button', { name: 'probe' }));
        expect(fromHook).toBe(fromCallback);
        void act(() => fromHook.setValue('name', 'semi'));
        expect(getInput('name')).toHaveValue('semi');
    });

    it('useFormState 以最新的 values、errors 与 touched 重新渲染', () => {
        const Probe = () => {
            const formState = useFormState();
            return <pre data-testid="state">{JSON.stringify(formState)}</pre>;
        };
        render(
            <Form>
                <Form.Input field="name" />
                <Probe />
            </Form>
        );
        fireEvent.change(getInput('name'), { target: { value: 'semi' } });
        expect(JSON.parse(screen.getByTestId('state').textContent)).toEqual({
            values: { name: 'semi' },
            errors: {},
            touched: { name: true },
        });
    });

    it('useFieldState 读取单个字段，useFieldApi 写入该字段', async () => {
        let fieldApi;
        const Probe = () => {
            const { value, error, touched } = useFieldState('name');
            const api = useFieldApi('name');
            useEffect(() => {
                fieldApi = api;
            });
            return <span data-testid="field">{JSON.stringify({ value, error, touched })}</span>;
        };
        render(
            <Form>
                <Form.Input field="name" />
                <Probe />
            </Form>
        );
        void act(() => fieldApi.setValue('semi'));
        expect(getInput('name')).toHaveValue('semi');
        expect(fieldApi.getValue()).toBe('semi');
        void act(() => fieldApi.setError('bad'));
        void act(() => fieldApi.setTouched(true));
        expect(fieldApi.getError()).toBe('bad');
        expect(fieldApi.getTouched()).toBe(true);
        expect(JSON.parse(screen.getByTestId('field').textContent)).toEqual({
            value: 'semi',
            error: 'bad',
            touched: true,
        });
    });

    it('useArrayFieldState 判断子树是否位于 ArrayField 内', () => {
        const seen = [];
        const Probe = ({ label }) => {
            const state = useArrayFieldState();
            seen.push([label, state.inArrayField]);
            return null;
        };
        render(
            <Form>
                <Probe label="outside" />
                <ArrayField field="rows" initValue={[{}]}>
                    {() => <Probe label="inside" />}
                </ArrayField>
            </Form>
        );
        expect(seen).toContainEqual(['outside', false]);
        expect(seen).toContainEqual(['inside', true]);
    });

    it('withFormApi 注入 formApi，允许属性覆盖，并转发 ref', () => {
        class Inner extends Component<{ formApi: FormApi; text: string }> {
            override render() {
                return <button onClick={() => this.props.formApi.setValue('name', 'semi')}>{this.props.text}</button>;
            }
        }
        const WithApi = withFormApi(Inner);
        let instance;
        render(
            <Form>
                <Form.Input field="name" />
                <WithApi
                    ref={(node) => {
                        instance = node;
                    }}
                    text="set"
                />
            </Form>
        );
        expect(instance).toBeInstanceOf(Inner);
        fireEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(getInput('name')).toHaveValue('semi');

        const setValue = vi.fn<FormApi['setValue']>();
        // Only setValue is needed, so the partial api is cast
        const override = { setValue } as unknown as FormApi;
        const { unmount } = render(
            <Form>
                <WithApi formApi={override} text="override" />
            </Form>
        );
        fireEvent.click(screen.getByRole('button', { name: 'override' }));
        expect(setValue).toHaveBeenCalledWith('name', 'semi');
        unmount();
    });

    it('withFormState 注入最新的 formState 并转发 ref', () => {
        const Inner = ({ formState, ref }: { formState: FormState; ref?: Ref<HTMLSpanElement> }) => (
            <span ref={ref} data-testid="values">
                {JSON.stringify(formState.values)}
            </span>
        );
        const WithState = withFormState(Inner);
        let node;
        render(
            <Form>
                <Form.Input field="name" />
                <WithState
                    ref={(el) => {
                        node = el;
                    }}
                />
            </Form>
        );
        fireEvent.change(getInput('name'), { target: { value: 'semi' } });
        expect(screen.getByTestId('values')).toHaveTextContent('{"name":"semi"}');
        expect(node).toBe(screen.getByTestId('values'));
    });

    it('withField 向自定义控件注入 value 与 onChange，并把 ref 转发给它', () => {
        const Control = ({ value, onChange, ref, validateStatus, ...rest }) => <input {...rest} ref={ref} data-status={validateStatus} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
        const FormControl = withField(Control);
        let api;
        const Demo = () => {
            const inputRef = useRef(null);
            return (
                <Form getFormApi={(formApi) => (api = formApi)}>
                    <FormControl ref={inputRef} id="custom" data-testid="custom" field="custom" />
                    <button onClick={() => inputRef.current.focus()}>focus</button>
                </Form>
            );
        };
        render(<Demo />);
        const input = screen.getByTestId('custom');
        fireEvent.change(input, { target: { value: 'semi' } });
        expect(api.getValue('custom')).toBe('semi');
        expect(input).toHaveValue('semi');
        fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('id', 'custom');
        expect(input).toHaveAttribute('aria-labelledby', 'custom-label');
    });
});

describe('Form.useForm 挂载前的 formApi', () => {
    function renderUnbound() {
        let api: ReturnType<typeof Form.useForm>[0];
        function Demo() {
            const [formApi] = Form.useForm();
            useEffect(() => {
                api = formApi;
            }, [formApi]);
            return null;
        }
        render(<Demo />);
        return api;
    }

    it('读取 Symbol 属性不抛错', () => {
        const api = renderUnbound();
        expect(() => String(api)).not.toThrow();
        expect(Object.prototype.toString.call(api)).toBe('[object Object]');
    });

    it('不是 thenable，await 立即得到它本身', async () => {
        const api = renderUnbound();
        expect((api as unknown as { then?: unknown }).then).toBeUndefined();
        await expect(Promise.resolve(api)).resolves.toBe(api);
    });
});
