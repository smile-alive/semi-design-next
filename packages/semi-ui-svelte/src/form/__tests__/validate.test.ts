import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import CompositeFixture from './composite-fixture.svelte';
import { getInput, input, renderForm, settle, sleep, typeInto } from './helpers';

function renderNameForm(props: Record<string, unknown> = {}, fieldProps: Record<string, unknown> = {}) {
    return renderForm(props, [input('name', { rules: [{ required: true, message: 'req' }], ...fieldProps })]);
}

describe('Svelte Form 静默校验', () => {
    it('静默校验失败后填入有效值，再次静默校验与提交都通过', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onSubmit });
        await expect(api().validate({ silent: true })).rejects.toBeTruthy();
        await typeInto(getInput(), 'abc');
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

    it('静默校验不写 formState.errors，也不触发 onErrorChange', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onErrorChange });
        await expect(api().validate({ silent: true })).rejects.toEqual({ name: 'req' });
        expect(api().getFormState().errors).toEqual({});
        expect(onErrorChange).not.toHaveBeenCalled();
    });
});

describe('Svelte Form 校验被取代', () => {
    it('异步校验被后一次 change 校验取代后，validate 仍会 settle', async () => {
        const settlers: Array<() => void> = [];
        const validator = (value?: string) =>
            new Promise<string | undefined>((resolve) => {
                settlers.push(() => resolve(value ? undefined : 'req'));
            });
        const { api } = renderNameForm({}, { rules: undefined, validator });
        const pending = api().validate();
        await typeInto(getInput(), 'a');
        for (const settleOne of settlers) settleOne();
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

describe('Svelte Form 字段校验读取最新属性', () => {
    it('修改 transform 后，formApi.validate 使用新的 transform', async () => {
        const seen: unknown[] = [];
        const validator = (value: unknown) => {
            seen.push(value);
            return undefined;
        };
        const { api, store } = renderForm({}, [input('name', { initValue: 'a', transform: (value: string) => `${value}-old`, validator })]);
        store.fields[0].props.transform = (value: string) => `${value}-new`;
        await settle();
        await api().validate();
        expect(seen.at(-1)).toBe('a-new');
    });
});

describe('Svelte Form 表单级 validator', () => {
    it('先失败后通过，formState 快照不再保留旧错误，并触发一次 onChange', async () => {
        const validator = vi.fn<(values: unknown) => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ validator, onChange }, [input('name')], { showState: true });
        const errorsShown = () => JSON.parse(screen.getByTestId('state').textContent ?? '').errors;
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        expect(errorsShown()).toEqual({ name: 'x', orphan: 'y' });
        const changeCount = onChange.mock.calls.length;
        await api().validate();
        await settle();
        expect(errorsShown()).toEqual({});
        expect(api().getFormState().errors).toEqual({});
        expect(onChange).toHaveBeenCalledTimes(changeCount + 1);
    });
});

describe('Svelte Form 卸载', () => {
    it('整个 Form 卸载时不触发 onChange', () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { unmount } = renderForm({ onChange }, [input('a'), input('b')]);
        unmount();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('异步校验挂起时 Form 卸载，校验结算后不发出 onSubmit、onSubmitFail、onChange，validate() 以取消原因 reject', async () => {
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

    it('挂载不触发 onChange，字段已注册', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api, container } = renderForm({ initValues: { a: '1' }, onChange }, [input('a')]);
        expect(onChange).not.toHaveBeenCalled();
        expect(api().getFieldExist('a')).toBe(true);
        api().setValue('a', '2');
        await settle();
        expect(container.querySelector('input')).toHaveValue('2');
    });

    it('useForm 搭配 keepState 字段，Form 卸载后 formState 为空', async () => {
        let external = {} as { formState: { values?: unknown } };
        render(CompositeFixture, { props: { kind: 'useForm', onExternal: (value) => (external = value) } });
        expect(external.formState.values).toEqual({ name: 'init' });
        await fireEvent.click(screen.getByRole('button', { name: '切换表单' }));
        await settle();
        expect(external.formState.values).toEqual({});
    });
});

describe('Svelte Form 提交', () => {
    it('字段异步 validator reject 时，按校验失败调用一次 onSubmitFail，不调用 onSubmit', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onSubmit, onSubmitFail }, { rules: undefined, validator: () => Promise.reject('async-err') });
        api().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmitFail.mock.calls[0][0]).toEqual({ name: 'async-err' });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('表单级异步 validator reject 时，调用一次 onSubmitFail', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const onSubmitFail = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderNameForm({ onSubmit, onSubmitFail, validator: () => Promise.reject(new Error('server down')) }, { rules: undefined });
        api().submitForm();
        await vi.waitFor(() => expect(onSubmitFail).toHaveBeenCalledTimes(1));
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('Svelte Form onErrorChange 触发次数', () => {
    it('两个字段校验失败与 reset 各触发一次，第二个参数带上全部变化的字段', async () => {
        const onErrorChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onErrorChange }, [input('a', { rules: [{ required: true, message: 'a-req' }] }), input('b', { rules: [{ required: true, message: 'b-req' }] })]);
        await expect(api().validate()).rejects.toEqual({ a: 'a-req', b: 'b-req' });
        expect(onErrorChange).toHaveBeenCalledTimes(1);
        expect(onErrorChange).toHaveBeenLastCalledWith({ a: 'a-req', b: 'b-req' }, { a: 'a-req', b: 'b-req' });
        api().reset();
        expect(onErrorChange).toHaveBeenCalledTimes(2);
        expect(onErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });
});
