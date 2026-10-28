/** @jsxImportSource vue */
import { nextTick, ref } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render, sleep } from '@test/utils/vue';
import { Form, useForm, type FormApi, type FormDefaultSlotProps } from '..';
import { FormInput, renderForm } from './fixtures/fields';

function renderNameForm(props: Record<string, unknown> = {}, fieldProps: Record<string, unknown> = {}) {
    const view = renderForm(props, () => <FormInput field="name" rules={[{ required: true, message: 'req' }]} {...fieldProps} />);
    const input = () => view.container.querySelector('input') as HTMLInputElement;
    return { ...view, input };
}

describe('Form 静默校验', () => {
    it('静默校验失败后填入有效值，再次静默校验与提交都通过', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api, input } = renderNameForm({ onSubmit });
        await expect(api().validate({ silent: true })).rejects.toBeTruthy();
        await fireEvent.update(input(), 'abc');
        await sleep(0);
        expect(api().getFormState().errors).toEqual({});
        await expect(api().validate({ silent: true })).resolves.toEqual({ name: 'abc' });
        api().submitForm();
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('静默校验失败后 reset，formState.errors 为空', async () => {
        const { api } = renderNameForm();
        await expect(api().validate({ silent: true })).rejects.toBeTruthy();
        api().reset();
        expect(api().getFormState().errors).toEqual({});
    });

    it('静默校验不写 formState.errors，也不触发 errorChange', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onErrorChange });
        await expect(api().validate({ silent: true })).rejects.toEqual({ name: 'req' });
        expect(api().getFormState().errors).toEqual({});
        expect(onErrorChange).not.toHaveBeenCalled();
    });
});

describe('Form 校验被取代', () => {
    it('异步校验被后一次 change 校验取代后，validate 仍会 settle', async () => {
        const settlers: Array<() => void> = [];
        const validate = (value?: string) =>
            new Promise<string | undefined>((resolve) => {
                settlers.push(() => resolve(value ? undefined : 'req'));
            });
        const { api, input } = renderNameForm({}, { rules: undefined, validator: validate });
        const pending = api().validate();
        await fireEvent.update(input(), 'a');
        settlers.forEach((settle) => settle());
        const settled = await Promise.race([
            pending.then(
                () => 'resolved',
                () => 'rejected'
            ),
            sleep(2000).then(() => 'pending'),
        ]);
        expect(settled).toBe('resolved');
    });
});

describe('Form 字段校验读取最新属性', () => {
    it('rerender 修改 transform 后，formApi.validate 使用新的 transform', async () => {
        const seen: unknown[] = [];
        const suffix = ref('old');
        let api: FormApi | undefined;
        render(() => (
            <Form onGetFormApi={(formApi: FormApi) => (api = formApi)}>
                {() => (
                    <FormInput
                        field="name"
                        initValue="a"
                        transform={(value: string) => `${value}-${suffix.value}`}
                        validator={(value: unknown) => {
                            seen.push(value);
                            return undefined;
                        }}
                    />
                )}
            </Form>
        ));
        suffix.value = 'new';
        await nextTick();
        await api?.validate();
        expect(seen.at(-1)).toBe('a-new');
    });
});

describe('Form 表单级 validator', () => {
    it('先失败后通过，formState 快照不再保留旧错误，并触发一次 change', async () => {
        const validator = vi.fn<(values: unknown) => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({ validator, onChange }, ({ formState }: FormDefaultSlotProps) => (
            <>
                <FormInput field="name" />
                <output>{JSON.stringify(formState.errors)}</output>
            </>
        ));
        await api()
            .validate()
            .catch(() => undefined);
        await nextTick();
        expect(container.querySelector('output')).toHaveTextContent('{"name":"x","orphan":"y"}');
        const changeCount = onChange.mock.calls.length;
        await api().validate();
        await nextTick();
        expect(container.querySelector('output')).toHaveTextContent('{}');
        expect(api().getFormState().errors).toEqual({});
        expect(onChange).toHaveBeenCalledTimes(changeCount + 1);
    });
});

describe('Form 卸载', () => {
    it('整个 Form 卸载时不触发 change', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { unmount } = renderForm({ onChange }, () => (
            <>
                <FormInput field="a" />
                <FormInput field="b" />
            </>
        ));
        unmount();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('异步校验挂起时 Form 卸载，校验结算后不发出 submit、submitFail、change，validate() 以取消原因 reject', async () => {
        const pending = Promise.withResolvers<string>();
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api, unmount } = renderNameForm({ onSubmit, onSubmitFail, onChange }, { rules: undefined, validator: () => pending.promise });
        api().submitForm();
        const validation = api().validate();
        unmount();
        pending.resolve('err');
        await expect(validation).rejects.toThrow(/unmounted/);
        await sleep(0);
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onSubmitFail).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('挂载不触发 change，字段已注册', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({ initValues: { a: '1' }, onChange }, () => <FormInput field="a" />);
        expect(onChange).not.toHaveBeenCalled();
        expect(api().getFieldExist('a')).toBe(true);
        api().setValue('a', '2');
        await nextTick();
        expect(container.querySelector('input')).toHaveValue('2');
    });

    it('useForm 搭配 keepState 字段，Form 卸载后 formState 为空', async () => {
        const { formApi, formState } = useForm();
        const show = ref(true);
        render(() =>
            show.value ? (
                <Form form={formApi} initValues={{ a: '1' }}>
                    {() => <FormInput field="a" keepState />}
                </Form>
            ) : null
        );
        expect(formState.value.values).toEqual({ a: '1' });
        show.value = false;
        await nextTick();
        expect(formState.value.values).toEqual({});
    });
});

describe('Form 提交', () => {
    it('字段异步 validator reject 时，按校验失败发出一次 submitFail，不发出 submit', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onSubmit, onSubmitFail }, { rules: undefined, validator: () => Promise.reject('async-err') });
        api().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: 'async-err' });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('表单级异步 validator reject 时，发出一次 submitFail', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onSubmit, onSubmitFail, validator: () => Promise.reject(new Error('server down')) }, { rules: undefined });
        api().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submit 监听器抛出的异常经 errorHandler 报出，不发出 submitFail', async () => {
        const boom = new Error('boom');
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const seen: unknown[] = [];
        let api: FormApi | undefined;
        render(
            () => (
                <Form
                    onGetFormApi={(formApi: FormApi) => (api = formApi)}
                    onSubmit={() => {
                        throw boom;
                    }}
                    onSubmitFail={onSubmitFail}
                >
                    {() => <FormInput field="a" />}
                </Form>
            ),
            { global: { config: { errorHandler: (error) => void seen.push(error) } } }
        );
        api?.submitForm();
        await vi.waitFor(() => expect(seen).toEqual([boom]));
        expect(onSubmitFail).not.toHaveBeenCalled();
    });
});

describe('Form errorChange 触发次数', () => {
    it('两个字段校验失败与 reset 各触发一次，第二个参数带上全部变化的字段', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onErrorChange }, () => (
            <>
                <FormInput field="a" rules={[{ required: true, message: 'a-req' }]} />
                <FormInput field="b" rules={[{ required: true, message: 'b-req' }]} />
            </>
        ));
        await expect(api().validate()).rejects.toEqual({ a: 'a-req', b: 'b-req' });
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenLastCalledWith({ a: 'a-req', b: 'b-req' }, { a: 'a-req', b: 'b-req' });

        api().reset();
        expect(onErrorChange).toHaveBeenCalledTimes(2);
        expect(onErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });
});
