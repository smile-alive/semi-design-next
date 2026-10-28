import { Show, createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { type FormApi, type FormProps, Form, FormInput, useForm } from '..';

function renderNameForm(props: FormProps = {}, fieldProps: Record<string, unknown> = {}) {
    let api: FormApi | undefined;
    const utils = render(() => (
        <Form getFormApi={(formApi) => (api = formApi)} {...props}>
            <FormInput field="name" rules={[{ required: true, message: 'req' }]} {...fieldProps} />
        </Form>
    ));
    return { ...utils, getApi: () => api as FormApi, input: () => utils.container.querySelector('input') as HTMLInputElement };
}

describe('Form 静默校验', () => {
    it('静默校验失败后填入有效值，再次静默校验与提交都通过', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { getApi, input } = renderNameForm({ onSubmit });
        await expect(getApi().validate({ silent: true })).rejects.toBeTruthy();
        await userEvent.type(input(), 'abc');
        expect(getApi().getFormState().errors).toEqual({});
        await expect(getApi().validate({ silent: true })).resolves.toEqual({ name: 'abc' });
        getApi().submitForm();
        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('静默校验失败后 reset，formState.errors 为空', async () => {
        const { getApi } = renderNameForm();
        await expect(getApi().validate({ silent: true })).rejects.toBeTruthy();
        getApi().reset();
        expect(getApi().getFormState().errors).toEqual({});
    });

    it('静默校验不写 formState.errors，也不触发 onErrorChange', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onErrorChange });
        await expect(getApi().validate({ silent: true })).rejects.toEqual({ name: 'req' });
        expect(getApi().getFormState().errors).toEqual({});
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
        const { getApi, input } = renderNameForm({}, { rules: undefined, validator: validate });
        const pending = getApi().validate();
        await userEvent.type(input(), 'a');
        settlers.forEach((settle) => settle());
        const settled = await Promise.race([
            pending.then(
                () => 'resolved',
                () => 'rejected'
            ),
            new Promise((resolve) => {
                setTimeout(() => resolve('pending'), 2000);
            }),
        ]);
        expect(settled).toBe('resolved');
    });

    it('blur 发起的异步校验未结束时 setValue，结束后不把旧错误写回该字段', async () => {
        let settle: (error?: string) => void = () => undefined;
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const validator = () => new Promise<string | undefined>((resolve) => (settle = resolve));
        const { container, getApi, input } = renderNameForm({ onErrorChange }, { rules: undefined, trigger: 'blur', validator });
        await userEvent.click(input());
        await userEvent.tab();
        getApi().setValue('name', 'abcdef');
        settle('err');
        await new Promise((resolve) => setTimeout(resolve));
        expect(getApi().getError('name')).toBeUndefined();
        expect(input().getAttribute('aria-invalid')).not.toBe('true');
        expect(container).not.toHaveTextContent('err');
        expect(onErrorChange).not.toHaveBeenCalled();
    });
});

describe('Form 字段校验读取最新属性', () => {
    it('修改 transform 后，formApi.validate 使用新的 transform', async () => {
        const seen: unknown[] = [];
        const [suffix, setSuffix] = createSignal('old');
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(formApi) => (api = formApi)}>
                <FormInput
                    field="name"
                    initValue="a"
                    transform={(value: string) => `${value}-${suffix()}`}
                    validator={(value: unknown) => {
                        seen.push(value);
                        return undefined;
                    }}
                />
            </Form>
        ));
        setSuffix('new');
        await api?.validate();
        expect(seen.at(-1)).toBe('a-new');
    });
});

describe('Form 表单级 validator', () => {
    it('先失败后通过，formState 快照不再保留旧错误，并触发一次 onChange', async () => {
        const validator = vi.fn<(values: unknown) => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const onChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} validator={validator} onChange={onChange}>
                {(props) => (
                    <>
                        <FormInput field="name" />
                        <output>{JSON.stringify(props.formState.errors)}</output>
                    </>
                )}
            </Form>
        ));
        await api?.validate().catch(() => undefined);
        expect(container.querySelector('output')).toHaveTextContent('{"name":"x","orphan":"y"}');
        const changeCount = onChange.mock.calls.length;
        await api?.validate();
        expect(container.querySelector('output')).toHaveTextContent('{}');
        expect(api?.getFormState().errors).toEqual({});
        expect(onChange).toHaveBeenCalledTimes(changeCount + 1);
    });
});

describe('Form 卸载', () => {
    it('整个 Form 卸载时不触发 onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { unmount } = render(() => (
            <Form onChange={onChange}>
                <FormInput field="a" />
                <FormInput field="b" />
            </Form>
        ));
        unmount();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('挂载不触发 onChange，字段已注册', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ a: '1' }} onChange={onChange}>
                <FormInput field="a" />
            </Form>
        ));
        expect(onChange).not.toHaveBeenCalled();
        expect(api?.getFieldExist('a')).toBe(true);
        api?.setValue('a', '2');
        expect(container.querySelector('input')).toHaveValue('2');
    });

    it('useForm 搭配 keepState 字段，Form 卸载后 formState 为空', () => {
        const [show, setShow] = createSignal(true);
        let formState: ReturnType<typeof useForm>[1] | undefined;
        const Host = () => {
            const [api, state] = useForm();
            formState = state;
            return (
                <Show when={show()}>
                    <Form form={api} initValues={{ a: '1' }}>
                        <FormInput field="a" keepState />
                    </Form>
                </Show>
            );
        };
        render(() => <Host />);
        expect(formState?.().values).toEqual({ a: '1' });
        setShow(false);
        expect(formState?.().values).toEqual({});
    });
});

describe('Form 提交', () => {
    it('字段异步 validator reject 时，按校验失败调用一次 onSubmitFail，不调用 onSubmit', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onSubmit, onSubmitFail }, { rules: undefined, validator: () => Promise.reject('async-err') });
        getApi().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: 'async-err' });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('表单级异步 validator reject 时，调用一次 onSubmitFail', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { getApi } = renderNameForm({ onSubmit, onSubmitFail, validator: () => Promise.reject(new Error('server down')) }, { rules: undefined });
        getApi().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('onSubmit 抛出的异常不会被当成 onSubmitFail', async () => {
        const boom = new Error('boom');
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        render(() => (
            <Form
                getFormApi={(formApi) => (api = formApi)}
                onSubmit={() => {
                    throw boom;
                }}
                onSubmitFail={onSubmitFail}
            >
                <FormInput field="a" />
            </Form>
        ));
        // The thrown error surfaces as an unhandled rejection by design; the runner's own listener would fail the run
        const runnerListeners = process.listeners('unhandledRejection');
        process.removeAllListeners('unhandledRejection');
        const seen: unknown[] = [];
        const collect = (reason: unknown) => seen.push(reason);
        process.on('unhandledRejection', collect);
        try {
            api?.submitForm();
            await new Promise((resolve) => {
                setTimeout(resolve, 50);
            });
        } finally {
            process.off('unhandledRejection', collect);
            runnerListeners.forEach((listener) => process.on('unhandledRejection', listener));
        }
        expect(onSubmitFail).not.toHaveBeenCalled();
        expect(seen).toEqual([boom]);
    });
});

describe('Form onErrorChange 触发次数', () => {
    it('两个字段校验失败与 reset 各触发一次，第二个参数带上全部变化的字段', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        let api: FormApi | undefined;
        render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} onErrorChange={onErrorChange}>
                <FormInput field="a" rules={[{ required: true, message: 'a-req' }]} />
                <FormInput field="b" rules={[{ required: true, message: 'b-req' }]} />
            </Form>
        ));
        await expect(api?.validate()).rejects.toEqual({ a: 'a-req', b: 'b-req' });
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenLastCalledWith({ a: 'a-req', b: 'b-req' }, { a: 'a-req', b: 'b-req' });

        api?.reset();
        expect(onErrorChange).toHaveBeenCalledTimes(2);
        expect(onErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });
});
