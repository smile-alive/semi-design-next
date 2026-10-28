import scrollIntoView from 'scroll-into-view-if-needed';
import { describe, expect, it, vi } from 'vite-plus/test';
import FieldStore from '../field-store';
import FormFoundation from '../foundation';
import type { BaseFormAdapter, FieldRegistration } from '../interface';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

type Notify = (...args: unknown[]) => void;

// A framework-free host: the foundation runs with a fake adapter and fake fields, no React involved.
function createHost(props: Record<string, unknown> = {}) {
    const adapter = {
        getProps: () => props,
        getProp: (key: string) => props[key],
        cloneDeep: (value: unknown) => structuredClone(value),
        getInitValues: () => props.initValues ?? {},
        getFormProps: () => props,
        forceUpdate: vi.fn<Notify>(),
        notifyChange: vi.fn<Notify>(),
        notifyValueChange: vi.fn<Notify>(),
        notifyErrorChange: vi.fn<Notify>(),
        notifyReset: vi.fn<Notify>(),
        notifySubmit: vi.fn<Notify>(),
        notifySubmitFail: vi.fn<Notify>(),
    };
    const foundation = new FormFoundation(adapter as unknown as BaseFormAdapter);
    foundation.init();
    const fieldBridge = foundation.getFieldBridge();
    const api = foundation.getFormApi();

    // The host creates an instance snapshot before mounting, then registers it after committing.
    function addField(field: string, validation: Partial<ReturnType<FieldRegistration['getValidateOptions']>> = {}) {
        const registration: FieldRegistration = {
            id: field,
            field,
            keepState: false,
            allowEmpty: false,
            getValidateOptions: () => validation,
            getChangeOptions: () => ({}),
            store: new FieldStore({}),
        };
        fieldBridge.register(field, registration);
        return registration;
    }

    return { adapter, foundation, fieldBridge, api, addField };
}

describe('FormFoundation 契约', () => {
    it('字段初始快照在注册前稳定，注册后的空字符串只从整表值中省略', () => {
        const { api, fieldBridge } = createHost();
        const store = new FieldStore({ value: '', status: 'warning' });
        const initial = store.getSnapshot();
        expect(store.getSnapshot()).toBe(initial);
        expect(api.getFieldExist('name')).toBe(false);
        const registration: FieldRegistration = {
            id: 'name',
            field: 'name',
            store,
            initValue: '',
            allowEmpty: false,
            keepState: false,
            getValidateOptions: () => ({}),
            getChangeOptions: () => ({}),
        };
        fieldBridge.register('name', registration);
        expect(store.getSnapshot()).toBe(initial);
        expect(api.getValues()).toEqual({});
        fieldBridge.unRegister('name');
        expect(store.getSnapshot()).toBe(initial);
    });

    it('changeFieldValue 规整载荷，回调读取新值，字段订阅只收到提交后的完整快照', () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name');
        registration.valuePath = 'target.value';
        registration.getChangeOptions = () => ({ convert: (value: string) => value.trim(), emptyValue: '' });
        const onField = vi.fn<() => void>();
        registration.store.subscribe(onField);
        const onChange = vi.fn<(values: Record<string, unknown>) => void>((values) => {
            expect(values).toEqual({ name: 'next' });
            expect(api.getValue('name')).toBe('next');
            expect(api.getTouched('name')).toBeUndefined();
            expect(onField).not.toHaveBeenCalled();
        });
        fieldBridge.changeFieldValue(registration, { target: { value: ' next ' } }, { onChange });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(registration.store.getSnapshot()).toEqual({ value: 'next', touched: true });
        fieldBridge.changeFieldValue(registration, { target: { value: ' ' } }, { onChange: () => {} });
        expect(api.getValues()).toEqual({});
        expect(registration.store.getSnapshot().value).toBeUndefined();
    });

    it('字段回调抛错时订阅只看到回滚值，错误继续抛给调用方', () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name');
        api.setValue('name', 'before');
        const seen: unknown[] = [];
        registration.store.subscribe(() => seen.push(registration.store.getSnapshot().value));
        expect(() =>
            fieldBridge.changeFieldValue(registration, 'after', {
                onChange: () => {
                    throw new Error('rejected');
                },
            })
        ).toThrow('rejected');
        expect(seen).toEqual(['before']);
        expect(api.getValue('name')).toBe('before');
        expect(api.getTouched('name')).toBeUndefined();
    });

    it('字段订阅独立于整表发布，未变化的快照引用稳定，取消订阅不注销字段', () => {
        const { api, adapter, fieldBridge, addField } = createHost();
        const registration = addField('name');
        const store = registration.store;
        const onField = vi.fn<() => void>();
        const unsubscribeField = store.subscribe(onField);
        adapter.forceUpdate.mockClear();
        expect(store.getSnapshot()).toBe(store.getSnapshot());
        fieldBridge.setFieldTouched(registration, true, { skipRender: true, skipNotify: true });
        expect(store.getSnapshot().touched).toBe(true);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(adapter.forceUpdate).not.toHaveBeenCalled();
        const fieldSnapshot = store.getSnapshot();
        api.setTouched('name', true);
        expect(store.getSnapshot()).toBe(fieldSnapshot);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(adapter.forceUpdate).toHaveBeenCalledTimes(1);
        expect(adapter.forceUpdate.mock.lastCall?.[0]).toMatchObject({ touched: { name: true } });
        unsubscribeField();
        api.setTouched('name', false);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(api.getFieldExist('name')).toBe(true);
    });

    it('注册字段后写入初始值，卸载非 keepState 字段会清掉它的状态', () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name');
        api.setValue('name', 'a');
        expect(api.getValue('name')).toBe('a');
        expect(api.getFieldExist('name')).toBe(true);

        fieldBridge.unRegister('name');
        expect(api.getFieldExist('name')).toBe(false);
        expect(api.getValues()).toEqual({});
        expect(registration.store.getSnapshot().error).toBeUndefined();
    });

    it.each([
        ['rules', { rules: [{ required: true, message: 'req' }] }],
        ['validate', { validate: (value: unknown) => (value ? undefined : 'req') }],
    ])('字段用 %s 校验：失败时 reject 错误并写入 errors，修正后 resolve 当前值', async (_name, validation) => {
        const { adapter, api, addField } = createHost();
        addField('name', validation);

        await expect(api.validate()).rejects.toEqual({ name: 'req' });
        expect(api.getError('name')).toBe('req');
        expect(adapter.notifyChange).toHaveBeenCalled();

        api.setValue('name', 'abc');
        await expect(api.validate()).resolves.toEqual({ name: 'abc' });
        expect(api.getError('name')).toBeUndefined();
    });

    it('静默校验不写 errors、不通知', async () => {
        const { adapter, api, addField } = createHost();
        const registration = addField('name', { rules: [{ required: true, message: 'req' }] });
        adapter.notifyChange.mockClear();

        await expect(api.validate({ silent: true })).rejects.toEqual({ name: 'req' });
        expect(api.getFormState().errors).toEqual({});
        expect(adapter.notifyChange).not.toHaveBeenCalled();
        expect(registration.store.getSnapshot().touched).toBeUndefined();
    });

    it('异步校验被后一次校验取代后，先发起的校验以后一次的结果 settle', async () => {
        const { api, fieldBridge, addField } = createHost();
        const resolvers: Array<(error?: string) => void> = [];
        const registration = addField('name', {
            validate: () => new Promise<string | undefined>((resolve) => resolvers.push(resolve)),
        });
        const first = fieldBridge.validateField(registration, 'a');
        const second = fieldBridge.validateField(registration, 'ab');
        resolvers[1]('latest-err');
        resolvers[0]('old-err');
        await expect(first).resolves.toBe('latest-err');
        await expect(second).resolves.toBe('latest-err');
        expect(api.getError('name')).toBe('latest-err');
    });

    it('表单级 validator 先失败后通过，errors 清空并通知', async () => {
        const validator = vi.fn<() => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const { adapter, api, addField } = createHost({ validator });
        addField('name');

        await expect(api.validate()).rejects.toEqual({ name: 'x', orphan: 'y' });
        expect(api.getFormState().errors).toEqual({ name: 'x', orphan: 'y' });

        adapter.notifyChange.mockClear();
        await api.validate();
        expect(api.getFormState().errors).toEqual({});
        expect(adapter.notifyChange).toHaveBeenCalledTimes(1);
    });

    it('submit：通过时 notifySubmit，失败时 notifySubmitFail；onSubmit 抛错不会进入 notifySubmitFail', async () => {
        const { adapter, api, addField } = createHost();
        addField('name', { rules: [{ required: true, message: 'req' }] });

        api.submitForm();
        await vi.waitFor(() => expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1));
        expect(adapter.notifySubmitFail).toHaveBeenCalledWith({ name: 'req' }, {}, undefined);
        expect(adapter.notifySubmit).not.toHaveBeenCalled();

        api.setValue('name', 'abc');
        api.submitForm();
        await vi.waitFor(() => expect(adapter.notifySubmit).toHaveBeenCalledWith({ name: 'abc' }, undefined));
        expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1);
    });

    it('reset：重置每个字段并通知', () => {
        const { adapter, api, addField } = createHost();
        const a = addField('a');
        const b = addField('b');
        api.setValue('a', 'changed-a');
        api.setValue('b', 'changed-b');
        api.reset();
        expect(a.store.getSnapshot()).toEqual({ value: undefined, status: 'default' });
        expect(b.store.getSnapshot()).toEqual({ value: undefined, status: 'default' });
        expect(adapter.notifyReset).toHaveBeenCalledTimes(1);
    });

    it('自动滚动时 scrollIntoView 抛出的错误不被吞掉', async () => {
        vi.mocked(scrollIntoView).mockImplementationOnce(() => {
            throw new Error('scroll failed');
        });
        const { adapter, api, addField } = createHost({ autoScrollToError: true });
        const form = document.createElement('form');
        form.innerHTML = '<div class="semi-form-field" x-field-id="name"><div class="semi-form-field-error-message"></div></div>';
        Object.assign(adapter, { getFormElement: () => form });
        addField('name', { rules: [{ required: true, message: 'req' }] });

        await expect(api.validate()).rejects.toEqual({ name: 'req' });
        const afterRender = adapter.forceUpdate.mock.lastCall[1] as () => void;
        expect(afterRender).toThrow('scroll failed');
    });

    it('批量校验只触发一次 onErrorChange，带上全部变化的字段', async () => {
        const { adapter, api, addField } = createHost();
        addField('a', { rules: [{ required: true, message: 'a-req' }] });
        addField('b', { rules: [{ required: true, message: 'b-req' }] });
        adapter.notifyErrorChange.mockClear();

        await expect(api.validate()).rejects.toEqual({ a: 'a-req', b: 'b-req' });
        expect(adapter.notifyErrorChange).toHaveBeenCalledTimes(1);
        expect(adapter.notifyErrorChange).toHaveBeenCalledWith({ a: 'a-req', b: 'b-req' }, { a: 'a-req', b: 'b-req' });

        adapter.notifyErrorChange.mockClear();
        await expect(api.validate({ silent: true })).rejects.toBeDefined();
        await expect(api.validate()).rejects.toBeDefined();
        expect(adapter.notifyErrorChange).not.toHaveBeenCalled();
    });

    it('表单级 validator 失败与转为通过时各触发一次 onErrorChange', async () => {
        const validator = vi.fn<() => Record<string, string>>().mockReturnValueOnce({ a: 'a-err', b: 'b-err' }).mockReturnValue({});
        const { adapter, api, addField } = createHost({ validator });
        addField('a');
        addField('b');
        adapter.notifyErrorChange.mockClear();

        await expect(api.validate()).rejects.toBeDefined();
        expect(adapter.notifyErrorChange).toHaveBeenCalledTimes(1);
        expect(adapter.notifyErrorChange).toHaveBeenLastCalledWith({ a: 'a-err', b: 'b-err' }, { a: 'a-err', b: 'b-err' });

        await api.validate();
        expect(adapter.notifyErrorChange).toHaveBeenCalledTimes(2);
        expect(adapter.notifyErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });

    it('destroy 之后卸载字段不再通知 onChange', () => {
        const { adapter, foundation, fieldBridge, addField } = createHost();
        addField('a');
        adapter.notifyChange.mockClear();
        foundation.destroy();
        fieldBridge.unRegister('a');
        expect(adapter.notifyChange).not.toHaveBeenCalled();
    });

    it('scrollToField 找不到字段根节点时不滚动', () => {
        const { adapter, api, addField } = createHost();
        Object.assign(adapter, { getFormElement: () => document.createElement('form') });
        addField('name');
        vi.mocked(scrollIntoView).mockClear();
        api.scrollToField('name');
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});

describe('FormFoundation 校验结算', () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve));
    function pendingValidate() {
        const resolvers: Array<(error?: string) => void> = [];
        const validate = () => new Promise<string | undefined>((resolve) => resolvers.push(resolve));
        return { resolvers, validate };
    }

    it('rules 的 message 为空串时校验失败：validate 与静默校验都 reject，字段状态为 error', async () => {
        const { adapter, api, addField } = createHost();
        const registration = addField('name', { rules: [{ required: true, message: '' }] });

        await expect(api.validate()).rejects.toEqual({ name: '' });
        expect(registration.store.getSnapshot().status).toBe('error');
        await expect(api.validate({ silent: true })).rejects.toEqual({ name: '' });

        api.submitForm();
        await vi.waitFor(() => expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1));
        expect(adapter.notifySubmit).not.toHaveBeenCalled();
    });

    it('静默校验不取代同一字段尚未结束的普通校验，普通校验的错误照常写入', async () => {
        const { resolvers, validate } = pendingValidate();
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        const normal = fieldBridge.validateField(registration, 'a');
        const silent = api.validate({ silent: true });
        resolvers[0]('err');
        resolvers[1]('err');
        await expect(normal).resolves.toBe('err');
        await expect(silent).rejects.toEqual({ name: 'err' });
        expect(api.getError('name')).toBe('err');
        expect(registration.store.getSnapshot().status).toBe('error');
    });

    it('表单级异步 validator 先发起、后返回的结果不覆盖后一次的结果', async () => {
        const resolvers: Array<(result: unknown) => void> = [];
        const validator = () => new Promise((resolve) => resolvers.push(resolve));
        const { api, addField } = createHost({ validator });
        addField('name');
        const first = api.validate();
        const second = api.validate();
        resolvers[1]({});
        await second;
        resolvers[0]({ name: 'x' });
        await expect(first).rejects.toEqual({ name: 'x' });
        expect(api.getFormState().errors).toEqual({});
        expect(api.getError('name')).toBeUndefined();
    });

    it('表单级 validator 返回字符串时 formState.errors 为空对象，之后写入的字段错误不展开该字符串', async () => {
        const { api, addField } = createHost({ validator: () => 'bad' });
        addField('name');
        await expect(api.validate()).rejects.toBe('bad');
        expect(api.getFormState().errors).toEqual({});
        api.setError('name', 'x');
        expect(api.getFormState().errors).toEqual({ name: 'x' });
    });

    it('静默校验期间注销字段，结果仍按发起时的字段对位', async () => {
        let resolveB: (error?: string) => void = () => {};
        const { api, fieldBridge, addField } = createHost();
        addField('a', { validate: () => undefined });
        addField('b', { validate: () => new Promise<string | undefined>((resolve) => (resolveB = resolve)) });
        const validation = api.validate({ silent: true });
        fieldBridge.unRegister('a');
        resolveB('b-err');
        await expect(validation).rejects.toEqual({ b: 'b-err' });
    });

    it('Form 卸载时仍挂起的校验不再通知：validate 以取消原因 reject，submit 不调用 onSubmit、onSubmitFail', async () => {
        const { resolvers, validate } = pendingValidate();
        const { adapter, api, foundation, fieldBridge, addField } = createHost();
        addField('name', { validate });
        const validation = api.validate();
        api.submitForm();
        adapter.notifyChange.mockClear();
        foundation.destroy();
        fieldBridge.unRegister('name');
        resolvers.forEach((resolve) => resolve('err'));
        await expect(validation).rejects.toThrow('unmounted');
        await settle();
        expect(adapter.notifySubmit).not.toHaveBeenCalled();
        expect(adapter.notifySubmitFail).not.toHaveBeenCalled();
        expect(adapter.notifyChange).not.toHaveBeenCalled();
    });

    it('reset 作废进行中的字段校验：结束后不写回错误，挂起的 validate 以取消原因 reject，submit 不回调', async () => {
        const { resolvers, validate } = pendingValidate();
        const { adapter, api, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        void fieldBridge.validateField(registration, 'abc');
        const validation = api.validate();
        api.submitForm();
        api.reset();
        adapter.notifyChange.mockClear();
        adapter.notifyErrorChange.mockClear();
        resolvers.forEach((resolve) => resolve('err'));
        await expect(validation).rejects.toThrow('reset');
        await settle();
        expect(api.getError('name')).toBeUndefined();
        expect(registration.store.getSnapshot().status).toBe('default');
        expect(adapter.notifyChange).not.toHaveBeenCalled();
        expect(adapter.notifyErrorChange).not.toHaveBeenCalled();
        expect(adapter.notifySubmit).not.toHaveBeenCalled();
        expect(adapter.notifySubmitFail).not.toHaveBeenCalled();
    });

    it('reset(fields) 只作废目标字段的校验：其他字段的异步校验照常写入，挂起的 submit 照常回调', async () => {
        const { resolvers, validate } = pendingValidate();
        const { adapter, api, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        addField('other');
        const validation = fieldBridge.validateField(registration, 'abc');
        api.submitForm();
        api.reset(['other']);
        resolvers.forEach((resolve) => resolve('err'));
        await expect(validation).resolves.toBe('err');
        await vi.waitFor(() => expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1));
        expect(api.getError('name')).toBe('err');
        expect(registration.store.getSnapshot().status).toBe('error');
        expect(adapter.notifySubmit).not.toHaveBeenCalled();
    });

    it('reset(fields) 作废目标字段进行中的校验：结束后不写回错误', async () => {
        const { resolvers, validate } = pendingValidate();
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        void fieldBridge.validateField(registration, 'abc');
        api.reset(['name']);
        resolvers.forEach((resolve) => resolve('err'));
        await settle();
        expect(api.getError('name')).toBeUndefined();
        expect(registration.store.getSnapshot().status).toBe('default');
    });

    it('setValue 作废被写字段进行中的校验：结束后不写回错误，其他字段与挂起的 submit 照常结算', async () => {
        const { resolvers, validate } = pendingValidate();
        const { adapter, api, fieldBridge, addField } = createHost();
        const name = addField('name', { validate });
        const other = addField('other', { validate });
        void fieldBridge.validateField(name, 'abc');
        void fieldBridge.validateField(other, 'abc');
        api.submitForm();
        api.setValue('name', 'abcdef');
        resolvers.forEach((resolve) => resolve('err'));
        await vi.waitFor(() => expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1));
        expect(api.getError('name')).toBeUndefined();
        expect(name.store.getSnapshot().status).not.toBe('error');
        expect(api.getError('other')).toBe('err');
    });

    it('setValues 作废被写字段进行中的校验：结束后不写回错误', async () => {
        const { resolvers, validate } = pendingValidate();
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        void fieldBridge.validateField(registration, 'abc');
        api.setValues({ name: 'abcdef' });
        resolvers.forEach((resolve) => resolve('err'));
        await settle();
        expect(api.getError('name')).toBeUndefined();
        expect(registration.store.getSnapshot().status).not.toBe('error');
    });

    it('没有校验的字段被 setError 写入空串后不算失败，validate 照常 resolve', async () => {
        const { api, addField } = createHost();
        addField('name');
        api.setError('name', '');
        await expect(api.validate()).resolves.toEqual({});
    });
});
