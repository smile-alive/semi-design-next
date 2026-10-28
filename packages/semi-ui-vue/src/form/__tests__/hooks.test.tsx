/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { ArrayField, Form, useFieldApi, useFieldState, useForm, useFormApi, useFormState, withField, type FieldHandle, type FormApi } from '..';
import { useArrayFieldState } from '../hooks';
import { FormInput } from './fixtures/fields';

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`) as HTMLInputElement;

describe('Form hooks', () => {
    it('useFormApi 返回 getFormApi 交出的 api', async () => {
        let fromHook: FormApi | undefined;
        let fromCallback: FormApi | undefined;
        const Probe = defineComponent(() => {
            fromHook = useFormApi();
            return () => null;
        });
        render(() => (
            <Form onGetFormApi={(api: FormApi) => (fromCallback = api)}>
                {() => (
                    <>
                        <FormInput field="name" />
                        <Probe />
                    </>
                )}
            </Form>
        ));
        expect(fromHook).toBe(fromCallback);
        fromHook?.setValue('name', 'semi');
        await nextTick();
        expect(getInput('name')).toHaveValue('semi');
    });

    it('useFormState 以最新的 values、errors 与 touched 重新渲染', async () => {
        const Probe = defineComponent(() => {
            const formState = useFormState();
            return () => <pre data-testid="state">{JSON.stringify(formState.value)}</pre>;
        });
        render(() => (
            <Form>
                {() => (
                    <>
                        <FormInput field="name" />
                        <Probe />
                    </>
                )}
            </Form>
        ));
        await fireEvent.update(getInput('name'), 'semi');
        expect(JSON.parse(screen.getByTestId('state').textContent ?? '')).toEqual({
            values: { name: 'semi' },
            errors: {},
            touched: { name: true },
        });
    });

    it('useFieldState 读取单个字段，useFieldApi 写入该字段', async () => {
        let fieldApi: ReturnType<typeof useFieldApi> | undefined;
        const Probe = defineComponent(() => {
            const state = useFieldState('name');
            fieldApi = useFieldApi('name');
            return () => <span data-testid="field">{JSON.stringify(state.value)}</span>;
        });
        render(() => (
            <Form>
                {() => (
                    <>
                        <FormInput field="name" />
                        <Probe />
                    </>
                )}
            </Form>
        ));
        fieldApi?.setValue('semi');
        await nextTick();
        expect(getInput('name')).toHaveValue('semi');
        expect(fieldApi?.getValue()).toBe('semi');
        fieldApi?.setError('bad');
        fieldApi?.setTouched(true);
        await nextTick();
        expect(fieldApi?.getError()).toBe('bad');
        expect(fieldApi?.getTouched()).toBe(true);
        expect(JSON.parse(screen.getByTestId('field').textContent ?? '')).toEqual({
            value: 'semi',
            error: 'bad',
            touched: true,
        });
    });

    it('useFieldState 与 useFieldApi 跟随字段名 ref 的变化', async () => {
        let fieldApi: ReturnType<typeof useFieldApi> | undefined;
        const field = ref('a');
        const Probe = defineComponent(() => {
            const state = useFieldState(field);
            fieldApi = useFieldApi(field);
            return () => <span data-testid="field">{String(state.value.value)}</span>;
        });
        render(() => (
            <Form initValues={{ a: 'A', b: 'B' }}>
                {() => (
                    <>
                        <FormInput field="a" />
                        <FormInput field="b" />
                        <Probe />
                    </>
                )}
            </Form>
        ));
        expect(screen.getByTestId('field')).toHaveTextContent('A');
        field.value = 'b';
        await nextTick();
        expect(screen.getByTestId('field')).toHaveTextContent('B');
        fieldApi?.setValue('semi');
        await nextTick();
        expect(getInput('b')).toHaveValue('semi');
        expect(getInput('a')).toHaveValue('A');
    });

    it('useArrayFieldState 判断子树是否位于 ArrayField 内', () => {
        const seen: [string, boolean][] = [];
        const Probe = defineComponent({
            props: { label: { type: String, required: true } },
            setup(props) {
                const state = useArrayFieldState();
                return () => {
                    seen.push([props.label, state.value.inArrayField]);
                    return null;
                };
            },
        });
        render(() => (
            <Form>
                {() => (
                    <>
                        <Probe label="outside" />
                        <ArrayField field="rows" initValue={[{}]}>
                            {() => <Probe label="inside" />}
                        </ArrayField>
                    </>
                )}
            </Form>
        ));
        expect(seen).toContainEqual(['outside', false]);
        expect(seen).toContainEqual(['inside', true]);
    });

    it('在 Form 之外调用时抛错并指明调用方', () => {
        const errors: unknown[] = [];
        const Probe = defineComponent(() => {
            for (const hook of [useFormApi, useFormState, () => useFieldApi('a'), () => useFieldState('a')]) {
                try {
                    hook();
                } catch (error) {
                    errors.push(error);
                }
            }
            return () => null;
        });
        render(Probe);
        expect(errors.map((error) => (error as Error).message)).toEqual(['[Semi Form] useFormApi must be called inside <Form>', '[Semi Form] useFormState must be called inside <Form>', '[Semi Form] useFieldApi must be called inside <Form>', '[Semi Form] useFieldState must be called inside <Form>']);
    });

    it('withField 向自定义控件注入 modelValue 与 change，并通过 control 暴露它', async () => {
        const Control = defineComponent({
            props: {
                modelValue: { type: String, default: undefined },
                validateStatus: { type: String, default: undefined },
            },
            emits: ['change'],
            setup(props, { emit, expose }) {
                const input = ref<HTMLInputElement>();
                expose({ focus: () => input.value?.focus() });
                return () => <input ref={input} data-status={props.validateStatus} value={props.modelValue ?? ''} onInput={(event: Event) => emit('change', (event.target as HTMLInputElement).value)} />;
            },
        });
        const FormControl = withField(Control);
        let api: FormApi | undefined;
        const handle = ref<FieldHandle<{ focus: () => void }>>();
        render(() => <Form onGetFormApi={(formApi: FormApi) => (api = formApi)}>{() => <FormControl ref={handle} id="custom" data-testid="custom" field="custom" />}</Form>);
        const input = screen.getByTestId('custom');
        await fireEvent.update(input, 'semi');
        expect(api?.getValue('custom')).toBe('semi');
        expect(input).toHaveValue('semi');
        handle.value?.control?.focus();
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('id', 'custom');
        expect(input).toHaveAttribute('aria-labelledby', 'custom-label');
    });
});

describe('useForm 挂载前的 formApi', () => {
    it('读取 Symbol 属性不抛错', () => {
        const { formApi } = useForm();
        expect(() => String(formApi)).not.toThrow();
        expect(Object.prototype.toString.call(formApi)).toBe('[object Object]');
    });

    it('不是 thenable，await 立即得到它本身', async () => {
        const { formApi } = useForm();
        expect((formApi as unknown as { then?: unknown }).then).toBeUndefined();
        await expect(Promise.resolve(formApi)).resolves.toBe(formApi);
    });

    it('绑定到 Form 后 values 跟随表单状态', async () => {
        const { formApi, values } = useForm<{ name?: string }>();
        render(() => <Form form={formApi}>{() => <FormInput field="name" />}</Form>);
        await fireEvent.update(getInput('name'), 'semi');
        expect(values.value).toEqual({ name: 'semi' });
        formApi.setValue('name', 'x');
        await nextTick();
        expect(getInput('name')).toHaveValue('x');
    });
});
