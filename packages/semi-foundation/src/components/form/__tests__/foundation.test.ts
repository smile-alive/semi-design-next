import scrollIntoView from 'scroll-into-view-if-needed';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as z from 'zod';
import enUS from '@fibrae/semi-foundation/locale/source/en_US';
import FieldStore from '../field-store';
import { createFormApiProxy } from '../form-api-proxy';
import FormFoundation from '../foundation';
import type { BaseFormAdapter, FieldRegistration, RuleItem, StandardSchemaIssue, StandardSchemaResult } from '../interface';
import { createFieldRegistration } from '../utils';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

type Notify = (...args: unknown[]) => void;

// A framework-free host: the foundation runs with a fake adapter and fake fields, no React involved.
function createHost(props: Record<string, unknown> = {}) {
    const adapter = {
        getProps: () => props,
        getProp: (key: string) => props[key],
        // commits at once, so what waits for the Form's next commit (unregistering) settles before the call returns
        setState: vi.fn<(state: object, callback?: () => void) => void>((_state, callback) => callback?.()),
        cloneDeep: (value: unknown) => structuredClone(value),
        notifyChange: vi.fn<Notify>(),
        notifyValueChange: vi.fn<Notify>(),
        notifyErrorChange: vi.fn<Notify>(),
        notifyReset: vi.fn<Notify>(),
        notifySubmit: vi.fn<Notify>(),
        notifySubmitFail: vi.fn<Notify>(),
        getLocale: () => enUS.Form,
    };
    const foundation = new FormFoundation(adapter as unknown as BaseFormAdapter);
    foundation.connect();
    foundation.init();
    const fieldBridge = foundation.getFieldBridge();
    const api = foundation.getFormApi();

    // The host creates an instance snapshot before mounting, then registers it after committing.
    const addField = (field: string, validation: Partial<ReturnType<FieldRegistration['getValidateOptions']>> = {}, keepState = false, inArrayField = false, store = new FieldStore({})) => {
        const registration: FieldRegistration = {
            id: field,
            field,
            keepState,
            inArrayField,
            allowEmpty: false,
            getValidateOptions: () => ({ trigger: ['change'], ...validation }),
            getChangeOptions: () => ({}),
            store,
        };
        fieldBridge.register(field, registration);
        return registration;
    };

    // the form renders by setting formState; registering and settling set other state
    const renders = () => adapter.setState.mock.calls.filter(([state]) => 'formState' in state);

    return { adapter, foundation, fieldBridge, api, addField, renders };
}

const settle = () => new Promise((resolve) => setTimeout(resolve));
const schemaOf = (validate: (value: unknown) => StandardSchemaResult<unknown> | Promise<StandardSchemaResult<unknown>>) => ({ '~standard': { version: 1, vendor: 'test', validate: vi.fn<typeof validate>(validate) } }) as const;
const failing = (...issues: StandardSchemaIssue[]) => schemaOf(() => ({ issues }));
const changeTo = (host: ReturnType<typeof createHost>, registration: FieldRegistration, value: unknown) => host.fieldBridge.changeFieldValue(registration, value, { onChange: () => {} });

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
            inArrayField: false,
            getValidateOptions: () => ({}),
            getChangeOptions: () => ({}),
        };
        fieldBridge.register('name', registration);
        expect(store.getSnapshot()).toBe(initial);
        expect(api.getValues()).toEqual({});
        fieldBridge.unRegister(registration);
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

    it('字段失焦标记 touched，未变化的快照引用稳定，取消订阅不注销字段', () => {
        const { api, adapter, fieldBridge, addField, renders } = createHost();
        const registration = addField('name');
        const store = registration.store;
        const onField = vi.fn<() => void>();
        const unsubscribeField = store.subscribe(onField);
        adapter.setState.mockClear();
        expect(store.getSnapshot()).toBe(store.getSnapshot());
        fieldBridge.blurField(registration);
        expect(store.getSnapshot().touched).toBe(true);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(renders()).toHaveLength(1);
        const fieldSnapshot = store.getSnapshot();
        api.setTouched('name', true);
        expect(store.getSnapshot()).toBe(fieldSnapshot);
        expect(onField).toHaveBeenCalledTimes(1);
        expect(renders()).toHaveLength(2);
        expect(renders().at(-1)?.[0]).toMatchObject({ formState: { touched: { name: true } } });
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

        fieldBridge.unRegister(registration);
        expect(api.getFieldExist('name')).toBe(false);
        expect(api.getValues()).toEqual({});
        expect(registration.store.getSnapshot().error).toBeUndefined();
    });

    it('注册后切换的 keepState 在注销时生效', () => {
        const { api, fieldBridge } = createHost();
        const view = { props: { keepState: true }, formProps: {} };
        const registration = createFieldRegistration({ id: 'name', field: 'name', store: new FieldStore({ value: 'a' }), inArrayField: false }, () => view);
        fieldBridge.register('name', registration);
        expect(api.getValues()).toEqual({ name: 'a' });

        view.props = { keepState: false };
        fieldBridge.unRegister(registration);
        expect(api.getValues()).toEqual({});
    });

    it('失焦标记 touched，trigger 含 blur 时校验', async () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name', { rules: [{ required: true, message: 'req' }], trigger: ['blur'] });
        fieldBridge.blurField(registration);
        expect(api.getTouched('name')).toBe(true);
        await vi.waitFor(() => expect(api.getError('name')).toEqual(['req']));
    });

    it('每次渲染把 form state 推给 useForm 的 api', () => {
        const pushed: unknown[] = [];
        const { api, addField } = createHost({ form: createFormApiProxy((state) => pushed.push(state)) });
        addField('name');
        api.setValue('name', 'a');
        expect(pushed.at(-1)).toMatchObject({ values: { name: 'a' } });
    });

    it.each([
        ['rules', { rules: [{ required: true, message: 'req' }] }],
        ['validate', { validate: (value: unknown) => (value ? undefined : 'req') }],
    ])('字段用 %s 校验：失败时 reject 错误并写入 errors，修正后 resolve 当前值', async (_name, validation) => {
        const { adapter, api, addField } = createHost();
        addField('name', validation);

        await expect(api.validate()).rejects.toEqual({ name: ['req'] });
        expect(api.getError('name')).toEqual(['req']);
        expect(adapter.notifyChange).toHaveBeenCalled();

        api.setValue('name', 'abc');
        await expect(api.validate()).resolves.toEqual({ name: 'abc' });
        expect(api.getError('name')).toBeUndefined();
    });

    it('静默校验不写 errors、不通知', async () => {
        const { adapter, api, addField } = createHost();
        const registration = addField('name', { rules: [{ required: true, message: 'req' }] });
        adapter.notifyChange.mockClear();

        await expect(api.validate({ silent: true })).rejects.toEqual({ name: ['req'] });
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
        await expect(first).resolves.toEqual(['latest-err']);
        await expect(second).resolves.toEqual(['latest-err']);
        expect(api.getError('name')).toEqual(['latest-err']);
    });

    it('表单级 validator 先失败后通过，errors 清空并通知', async () => {
        const validator = vi.fn<() => Record<string, string>>().mockReturnValueOnce({ name: 'x', orphan: 'y' }).mockReturnValue({});
        const { adapter, api, addField } = createHost({ validator });
        addField('name');

        await expect(api.validate()).rejects.toEqual({ name: ['x'], orphan: ['y'] });
        expect(api.getFormState().errors).toEqual({ name: ['x'], orphan: ['y'] });

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
        expect(adapter.notifySubmitFail).toHaveBeenCalledWith({ name: ['req'] }, {}, undefined);
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
        const { adapter, api, addField, renders } = createHost({ autoScrollToError: true });
        const form = document.createElement('form');
        form.innerHTML = '<div class="semi-form-field" x-field-id="name"><div class="semi-form-field-error-message"></div></div>';
        Object.assign(adapter, { getFormElement: () => form });
        addField('name', { rules: [{ required: true, message: 'req' }] });
        // the render commits later, where the host runs the callback
        adapter.setState.mockImplementation(() => {});

        await expect(api.validate()).rejects.toEqual({ name: ['req'] });
        const afterRender = renders().at(-1)[1];
        expect(afterRender).toThrow('scroll failed');
    });

    it('批量校验只触发一次 onErrorChange，带上全部变化的字段', async () => {
        const { adapter, api, addField } = createHost();
        addField('a', { rules: [{ required: true, message: 'a-req' }] });
        addField('b', { rules: [{ required: true, message: 'b-req' }] });
        adapter.notifyErrorChange.mockClear();

        await expect(api.validate()).rejects.toEqual({ a: ['a-req'], b: ['b-req'] });
        expect(adapter.notifyErrorChange).toHaveBeenCalledTimes(1);
        expect(adapter.notifyErrorChange).toHaveBeenCalledWith({ a: ['a-req'], b: ['b-req'] }, { a: ['a-req'], b: ['b-req'] });

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
        expect(adapter.notifyErrorChange).toHaveBeenLastCalledWith({ a: ['a-err'], b: ['b-err'] }, { a: ['a-err'], b: ['b-err'] });

        await api.validate();
        expect(adapter.notifyErrorChange).toHaveBeenCalledTimes(2);
        expect(adapter.notifyErrorChange).toHaveBeenLastCalledWith({}, { a: undefined, b: undefined });
    });

    it('destroy 之后卸载字段不再通知 onChange', () => {
        const { adapter, foundation, fieldBridge, addField } = createHost();
        const registration = addField('a');
        adapter.notifyChange.mockClear();
        foundation.destroy();
        fieldBridge.unRegister(registration);
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
    const pendingValidate = () => {
        const resolvers: Array<(error?: string) => void> = [];
        const validate = () => new Promise<string | undefined>((resolve) => resolvers.push(resolve));
        return { resolvers, validate };
    };

    it('rules 的 message 为空串时校验失败：validate 与静默校验都 reject，字段状态为 error', async () => {
        const { adapter, api, addField } = createHost();
        const registration = addField('name', { rules: [{ required: true, message: '' }] });

        await expect(api.validate()).rejects.toEqual({ name: [''] });
        expect(api.getError('name')).toEqual(['']);
        expect(registration.store.getSnapshot().status).toBe('error');
        await expect(api.validate({ silent: true })).rejects.toEqual({ name: [''] });

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
        await expect(normal).resolves.toEqual(['err']);
        await expect(silent).rejects.toEqual({ name: ['err'] });
        expect(api.getError('name')).toEqual(['err']);
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
        await expect(first).rejects.toEqual({ name: ['x'] });
        expect(api.getFormState().errors).toEqual({});
        expect(api.getError('name')).toBeUndefined();
    });

    it('表单级 validator 返回字符串时 formState.errors 为空对象，之后写入的字段错误不展开该字符串', async () => {
        const { api, addField } = createHost({ validator: () => 'bad' });
        addField('name');
        await expect(api.validate()).rejects.toBe('bad');
        expect(api.getFormState().errors).toEqual({});
        api.setError('name', 'x');
        expect(api.getFormState().errors).toEqual({ name: ['x'] });
    });

    it('静默校验期间注销字段，结果仍按发起时的字段对位', async () => {
        let resolveB: (error?: string) => void = () => {};
        const { api, fieldBridge, addField } = createHost();
        const a = addField('a', { validate: () => undefined });
        addField('b', { validate: () => new Promise<string | undefined>((resolve) => (resolveB = resolve)) });
        const validation = api.validate({ silent: true });
        fieldBridge.unRegister(a);
        resolveB('b-err');
        await expect(validation).rejects.toEqual({ b: ['b-err'] });
    });

    it('Form 卸载时仍挂起的校验不再通知：validate 以取消原因 reject，submit 不调用 onSubmit、onSubmitFail', async () => {
        const { resolvers, validate } = pendingValidate();
        const { adapter, api, foundation, fieldBridge, addField } = createHost();
        const registration = addField('name', { validate });
        const validation = api.validate();
        api.submitForm();
        adapter.notifyChange.mockClear();
        foundation.destroy();
        fieldBridge.unRegister(registration);
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
        await expect(validation).resolves.toEqual(['err']);
        await vi.waitFor(() => expect(adapter.notifySubmitFail).toHaveBeenCalledTimes(1));
        expect(api.getError('name')).toEqual(['err']);
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
        expect(api.getError('other')).toEqual(['err']);
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

describe('FormFoundation schema', () => {
    it('一轮校验只调用一次 schema，错误落到各字段，没有字段的路径留在 formState', async () => {
        const schema = failing({ message: '姓名必填', path: ['name'] }, { message: '年龄必填', path: ['age'] });
        const { api, addField } = createHost({ schema });
        const name = addField('name');
        addField('city');

        await expect(api.validate()).rejects.toEqual({ name: ['姓名必填'], age: ['年龄必填'] });
        expect(schema['~standard'].validate).toHaveBeenCalledTimes(1);
        expect(name.store.getSnapshot()).toMatchObject({ error: ['姓名必填'], status: 'error', touched: true });
        expect(api.getFormState().errors).toEqual({ name: ['姓名必填'], age: ['年龄必填'] });
    });

    it('同一轮挂载校验的多个字段共用一次异步 schema 调用', async () => {
        const schema = schemaOf(async () => ({ issues: [{ message: 'a 错', path: ['a'] }] }));
        const { fieldBridge, api, addField } = createHost({ schema });
        await Promise.all([fieldBridge.validateField(addField('a'), undefined), fieldBridge.validateField(addField('b'), undefined)]);
        expect(schema['~standard'].validate).toHaveBeenCalledTimes(1);
        expect(api.getError('a')).toEqual(['a 错']);
    });

    it('校验全部字段时 resolve 与 onSubmit 取 schema 的输出，只校验部分路径时取原值', async () => {
        const schema = z.object({ age: z.coerce.number() });
        const { adapter, api, addField } = createHost({ schema, initValues: { extra: 1 } });
        addField('age');
        api.setValue('age', '12');

        await expect(api.validate()).resolves.toEqual({ age: 12 });
        await expect(api.validate(['age'])).resolves.toEqual({ age: '12', extra: 1 });
        api.submitForm();
        await vi.waitFor(() => expect(adapter.notifySubmit).toHaveBeenCalledWith({ age: 12 }, undefined));
    });

    it('issue 路径的下标、{ key } 片段与含路径语法的键都落到对应位置', async () => {
        const schema = failing({ message: '行错误', path: ['items', 0, { key: 'q' }] }, { message: '字符串下标', path: ['items', '1', 'q'] }, { message: '带点的键', path: ['a.b', 'c'] }, { message: '整体错误' });
        const { api, addField } = createHost({ schema });
        const row = addField('items[0].q');
        const stringIndexRow = addField('items[1].q');

        await expect(api.validate()).rejects.toEqual({ '': ['整体错误'], 'a.b': { c: ['带点的键'] }, items: [{ q: ['行错误'] }, { q: ['字符串下标'] }] });
        expect(row.store.getSnapshot().error).toEqual(['行错误']);
        expect(stringIndexRow.store.getSnapshot().error).toEqual(['字符串下标']);
    });

    it('父路径与子路径同时有错时子路径生效，只有父路径有错时子字段不读取父错误的字符', async () => {
        const both = createHost({ schema: failing({ message: '至少两行', path: ['items'] }, { message: '行错误', path: ['items', 0] }) });
        const row = both.addField('items[0]');
        await expect(both.api.validate()).rejects.toEqual({ items: [['行错误']] });
        expect(row.store.getSnapshot().error).toEqual(['行错误']);

        const onlyParent = createHost({ schema: failing({ message: '至少两行', path: ['items'] }) });
        const passingRow = onlyParent.addField('items[0]');
        await expect(onlyParent.api.validate()).rejects.toEqual({ items: ['至少两行'] });
        expect(passingRow.store.getSnapshot().error).toBeUndefined();
        expect(onlyParent.addField('items[1]').store.getSnapshot().error).toBeUndefined();
    });

    it('整体持有数组值的字段接收子路径的错误，多条错误是数组，stopValidateWithError 只留第一条', async () => {
        const issues = [
            { message: '第二项太短', path: ['tags', 1] },
            { message: '太多', path: ['tags'] },
        ];
        const all = createHost({ schema: failing(...issues) });
        all.addField('tags');
        await expect(all.api.validate()).rejects.toEqual({ tags: ['太多', '第二项太短'] });

        const first = createHost({ schema: failing(...issues) });
        first.addField('tags', { stopValidateWithError: true });
        await expect(first.api.validate()).rejects.toEqual({ tags: ['太多'] });
    });

    it('有 schema 时字段的 validator、rules 不运行，注册时警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const validate = vi.fn<() => string>(() => 'validator 错');
        const schema = failing({ message: 'schema 错', path: ['custom'] }, { message: 'schema 错', path: ['ruled'] });
        const { api, addField } = createHost({ schema });
        const custom = addField('custom', { validate });
        const ruled = addField('ruled', { rules: [{ required: true, message: 'rules 错' }] });
        addField('plain');

        expect(warn).toHaveBeenCalledTimes(2);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"custom"'));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"ruled"'));
        await expect(api.validate()).rejects.toEqual({ custom: ['schema 错'], ruled: ['schema 错'] });
        expect(validate).not.toHaveBeenCalled();
        expect(custom.store.getSnapshot().error).toEqual(['schema 错']);
        expect(ruled.store.getSnapshot().error).toEqual(['schema 错']);
    });

    it('没有 schema 的字段照常运行 validator 和 rules，不警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { api, addField } = createHost();
        addField('custom', { validate: () => 'validator 错' });
        addField('ruled', { rules: [{ required: true, message: 'rules 错' }] });

        await expect(api.validate()).rejects.toEqual({ custom: ['validator 错'], ruled: ['rules 错'] });
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('<Form schema>'));
    });

    it('字段值变化时写入本字段与已 touched 的字段，未 touched 的字段不显示错误', async () => {
        const schema = z.object({ password: z.string(), confirm: z.string().optional(), other: z.string() }).refine((values) => values.password === values.confirm, { path: ['confirm'], message: '两次不一致' });
        const host = createHost({ schema });
        const password = host.addField('password');
        const confirm = host.addField('confirm');
        const other = host.addField('other');
        host.api.setValues({ password: 'a', confirm: 'a', other: 'x' });
        host.api.setTouched('confirm', true);
        host.adapter.notifyErrorChange.mockClear();

        changeTo(host, password, 'b');
        await vi.waitFor(() => expect(confirm.store.getSnapshot().error).toEqual(['两次不一致']));
        expect(other.store.getSnapshot().error).toBeUndefined();
        expect(host.adapter.notifyErrorChange).toHaveBeenLastCalledWith({ confirm: ['两次不一致'] }, { confirm: ['两次不一致'] });
    });

    it('异步 schema 乱序返回时，先发起的结果不覆盖后发起的结果', async () => {
        const resolvers: Array<(result: StandardSchemaResult<unknown>) => void> = [];
        const schema = schemaOf(() => new Promise((resolve) => resolvers.push(resolve)));
        const host = createHost({ schema });
        const name = host.addField('name');

        changeTo(host, name, 'a');
        await settle();
        changeTo(host, name, 'ab');
        await settle();
        resolvers[1]({ value: {} });
        await settle();
        resolvers[0]({ issues: [{ message: '旧结果', path: ['name'] }] });
        await settle();
        expect(name.store.getSnapshot().error).toBeUndefined();
        expect(name.store.getSnapshot().status).toBe('success');
    });

    it('静默校验不写入错误，reject 的结果含没有字段的路径', async () => {
        const { adapter, api, addField } = createHost({ schema: failing({ message: '姓名错', path: ['name'] }, { message: '年龄错', path: ['age'] }) });
        const name = addField('name');
        adapter.notifyChange.mockClear();

        await expect(api.validate({ silent: true })).rejects.toEqual({ name: ['姓名错'], age: ['年龄错'] });
        expect(api.getFormState().errors).toEqual({});
        expect(name.store.getSnapshot().error).toBeUndefined();
        expect(adapter.notifyChange).not.toHaveBeenCalled();
    });

    it('validate(fields) 只认这些路径下的 issue', async () => {
        const { api, addField } = createHost({ schema: failing({ message: '姓名错', path: ['name'] }, { message: '年龄错', path: ['age'] }, { message: '城市错', path: ['address', 'city'] }) });
        addField('name');

        await expect(api.validate(['address'])).rejects.toEqual({ address: { city: ['城市错'] } });
        expect(api.getFormState().errors).toEqual({ address: { city: ['城市错'] } });
        await expect(api.validate(['missing'])).resolves.toEqual({});
    });

    it('字段首次挂载时显示校验已写入的错误；校验通过后清掉没有字段的错误并通知', async () => {
        let issues: StandardSchemaIssue[] = [{ message: '年龄错', path: ['age'] }];
        const { adapter, api, addField } = createHost({ schema: schemaOf(() => (issues.length ? { issues } : { value: {} })) });

        await expect(api.validate()).rejects.toEqual({ age: ['年龄错'] });
        expect(addField('age').store.getSnapshot()).toMatchObject({ error: ['年龄错'], status: 'error' });
        issues = [{ message: '整体错', path: [] }];
        await expect(api.validate()).rejects.toEqual({ '': ['整体错'] });

        issues = [];
        adapter.notifyErrorChange.mockClear();
        await expect(api.validate()).resolves.toEqual({});
        expect(api.getFormState().errors).toEqual({});
        expect(adapter.notifyErrorChange).toHaveBeenCalledWith({}, { '': undefined });
    });

    it('校验全部字段时，已卸载的 keepState 字段的旧错误随结果更新；整表 reset 清掉没有字段的错误', async () => {
        let passes = false;
        const { fieldBridge, api, addField } = createHost({ schema: schemaOf(() => (passes ? { value: {} } : { issues: [{ message: '错', path: ['kept'] }] })) });
        const kept = addField('kept', {}, true);
        await expect(api.validate()).rejects.toEqual({ kept: ['错'] });
        fieldBridge.unRegister(kept);
        passes = true;
        await expect(api.validate()).resolves.toEqual({});
        const remounted = addField('kept', {}, true);
        expect(remounted.store.getSnapshot().error).toBeUndefined();

        passes = false;
        fieldBridge.unRegister(remounted);
        await expect(api.validate()).rejects.toEqual({ kept: ['错'] });
        api.reset();
        expect(api.getFormState().errors).toEqual({});
    });

    it('schema 自身抛错时 validate 以该错误 reject', async () => {
        const failure = new Error('schema 坏了');
        const { api, addField } = createHost({
            schema: schemaOf(() => {
                throw failure;
            }),
        });
        addField('name');
        await expect(api.validate()).rejects.toBe(failure);
    });

    it('同时传 validator 时警告并只用 validator', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const schema = failing({ message: 'schema 错', path: ['name'] });
        const { api, addField } = createHost({ schema, validator: () => ({ name: 'validator 错' }) });
        addField('name');

        await expect(api.validate()).rejects.toEqual({ name: ['validator 错'] });
        expect(schema['~standard'].validate).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Form schema>'));
    });
});

describe('FormFoundation schemaDebounce', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('连续变化只在最后一次变化的静默期后校验一次，用最新的值', async () => {
        vi.useFakeTimers();
        const schema = schemaOf(() => ({ value: {} }));
        const host = createHost({ schema, schemaDebounce: 300 });
        const name = host.addField('name');

        changeTo(host, name, 'a');
        await vi.advanceTimersByTimeAsync(200);
        changeTo(host, name, 'ab');
        await vi.advanceTimersByTimeAsync(299);
        expect(schema['~standard'].validate).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(schema['~standard'].validate).toHaveBeenCalledTimes(1);
        expect(schema['~standard'].validate).toHaveBeenCalledWith({ name: 'ab' });
        expect(name.store.getSnapshot().status).toBe('success');
    });

    it('validate() 与 submit 不等静默期，立即校验', async () => {
        vi.useFakeTimers();
        const schema = schemaOf(() => ({ value: {} }));
        const host = createHost({ schema, schemaDebounce: 300 });
        const name = host.addField('name');

        changeTo(host, name, 'a');
        await expect(host.api.validate()).resolves.toEqual({});
        expect(schema['~standard'].validate).toHaveBeenCalledTimes(1);

        host.api.submitForm();
        await vi.advanceTimersByTimeAsync(0);
        expect(schema['~standard'].validate).toHaveBeenCalledTimes(2);
        expect(host.adapter.notifySubmit).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['整表 reset', (host: ReturnType<typeof createHost>) => host.api.reset()],
        ['destroy', (host: ReturnType<typeof createHost>) => host.foundation.destroy()],
    ])('%s 取消待执行的防抖校验', async (_name, cancel) => {
        vi.useFakeTimers();
        const schema = schemaOf(() => ({ value: {} }));
        const host = createHost({ schema, schemaDebounce: 300 });
        const name = host.addField('name');

        changeTo(host, name, 'a');
        cancel(host);
        await vi.advanceTimersByTimeAsync(1000);
        expect(schema['~standard'].validate).not.toHaveBeenCalled();
    });

    it('没有 schema 时 schemaDebounce 不生效，字段校验立即发起', async () => {
        vi.useFakeTimers();
        const host = createHost({ schemaDebounce: 300 });
        const name = host.addField('name', { rules: [{ required: true, message: 'req' }] });

        changeTo(host, name, '');
        await vi.advanceTimersByTimeAsync(0);
        expect(host.api.getError('name')).toEqual(['req']);
    });
});

describe('FormFoundation 错误归一化', () => {
    it('Form validator 返回的空串视为通过，只有非空的字段出错', async () => {
        const validator = vi.fn<() => Record<string, string>>().mockReturnValueOnce({ a: '', b: 'x' }).mockReturnValueOnce({ a: '' });
        const { api, addField } = createHost({ validator });
        const a = addField('a');
        const b = addField('b');

        await expect(api.validate()).rejects.toEqual({ b: ['x'] });
        expect(api.getFormState().errors).toEqual({ b: ['x'] });
        expect(a.store.getSnapshot().error).toBeUndefined();
        expect(b.store.getSnapshot()).toMatchObject({ error: ['x'], status: 'error' });

        await expect(api.validate()).resolves.toEqual({});
    });

    it('Form validator 返回字符串数组时，数组是该字段的多条错误', async () => {
        const { api, addField } = createHost({ validator: () => ({ tags: ['x', 'y'] }) });
        const tags = addField('tags');

        await expect(api.validate()).rejects.toEqual({ tags: ['x', 'y'] });
        expect(api.getError('tags')).toEqual(['x', 'y']);
        expect(tags.store.getSnapshot().error).toEqual(['x', 'y']);
    });

    it('字段 validate 返回 [""] 与 message 为空串的规则一样校验失败却没有文案', async () => {
        const { api, addField } = createHost();
        const name = addField('name', { validate: () => [''] });

        await expect(api.validate()).rejects.toEqual({ name: [''] });
        expect(api.getError('name')).toEqual(['']);
        expect(name.store.getSnapshot().status).toBe('error');
    });

    it.each([
        ['空串', ''],
        ['undefined', undefined],
        ['null', null],
        ['空数组', []],
    ])('字段 validate 返回%s视为通过', async (_name, result) => {
        const { api, addField } = createHost();
        addField('name', { validate: () => result as undefined });
        await expect(api.validate()).resolves.toEqual({});
    });
});

describe('formApi.setError', () => {
    it('字段路径上的字符串与数组归一化为字符串数组', () => {
        const { api, addField } = createHost();
        const name = addField('name');

        api.setError('name', 'x');
        expect(api.getError('name')).toEqual(['x']);
        expect(name.store.getSnapshot()).toMatchObject({ error: ['x'], status: 'error' });
        api.setError('name', ['a', 'b']);
        expect(api.getError('name')).toEqual(['a', 'b']);
    });

    it.each([
        ['空串', ''],
        ['undefined', undefined],
        ['空数组', []],
    ])('字段路径上传入%s清除错误', (_name, cleared) => {
        const { api, addField } = createHost();
        const name = addField('name');
        api.setError('name', ['x']);

        api.setError('name', cleared);
        expect(api.getError('name')).toBeUndefined();
        expect(name.store.getSnapshot().error).toBeUndefined();
        expect(api.getFormState().errors).toEqual({});
    });

    it('没有字段的父路径按错误树写入：空串被丢弃，字符串转数组，下属字段取到自己的错误', () => {
        const { api, addField } = createHost();
        const city = addField('address.city');
        const tags = addField('address.tags');

        api.setError('address', { city: 'bad', zip: '', tags: ['x', 'y'] });
        expect(api.getError('address')).toEqual({ city: ['bad'], tags: ['x', 'y'] });
        expect(city.store.getSnapshot().error).toEqual(['bad']);
        expect(tags.store.getSnapshot().error).toEqual(['x', 'y']);

        api.setError('address', { city: '' });
        expect(api.getError('address')).toBeUndefined();
    });

    it('没有字段的父路径接收嵌套数组：每一项是子路径自己的错误', () => {
        const { api } = createHost();
        api.setError('rows', [['a'], undefined, 'b']);
        expect(api.getError('rows')).toEqual([['a'], undefined, ['b']]);
    });
});

describe('FormFoundation 字段 keepState', () => {
    it('keepState 字段卸载后 formState 保留 value、error、touched，重新注册时恢复', () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name', {}, true);
        api.setValue('name', 'kept');
        api.setError('name', 'bad');
        api.setTouched('name', true);

        fieldBridge.unRegister(registration);
        expect(api.getFieldExist('name')).toBe(false);
        expect(api.getValue('name')).toBe('kept');
        expect(api.getError('name')).toEqual(['bad']);
        expect(api.getTouched('name')).toBe(true);

        const remounted = addField('name', {}, true);
        expect(remounted.store.getSnapshot()).toMatchObject({ value: 'kept', error: ['bad'], touched: true, status: 'error' });
    });

    it('非 keepState 字段卸载后 value、error、touched 都被删除', () => {
        const { api, fieldBridge, addField } = createHost();
        const registration = addField('name');
        api.setValue('name', 'gone');
        api.setError('name', 'bad');
        api.setTouched('name', true);

        fieldBridge.unRegister(registration);
        expect(api.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
    });
});

describe('FormFoundation 字段 validate 为 Standard Schema', () => {
    it('错误是 issue 文案数组，修正后 resolve 当前值', async () => {
        const { api, addField } = createHost();
        const name = addField('name', { validate: z.string().min(3, '太短').regex(/^\d+$/, '须为数字') });

        api.setValue('name', 'a');
        await expect(api.validate()).rejects.toEqual({ name: ['太短', '须为数字'] });
        expect(name.store.getSnapshot()).toMatchObject({ error: ['太短', '须为数字'], status: 'error' });

        api.setValue('name', '123');
        await expect(api.validate()).resolves.toEqual({ name: '123' });
        expect(api.getError('name')).toBeUndefined();
    });

    it('stopValidateWithError 只留第一条 issue', async () => {
        const { api, addField } = createHost();
        addField('name', { validate: z.string().min(3, '太短').regex(/^\d+$/, '须为数字'), stopValidateWithError: true });

        api.setValue('name', 'a');
        await expect(api.validate()).rejects.toEqual({ name: ['太短'] });
    });

    it('异步 schema 同样产生错误数组', async () => {
        const { api, addField } = createHost();
        addField('name', { validate: z.string().refine(async (value) => value.length >= 3, '异步太短') });

        api.setValue('name', 'a');
        await expect(api.validate()).rejects.toEqual({ name: ['异步太短'] });
        api.setValue('name', 'abc');
        await expect(api.validate()).resolves.toEqual({ name: 'abc' });
    });

    it('rules 与 validate 同时存在时注册只警告一次，只运行 validate', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ruleValidator = vi.fn<NonNullable<RuleItem['validator']>>(() => false);
        const validate = vi.fn<() => string>(() => 'validate 错');
        const { api, addField } = createHost();
        const validation = { rules: [{ validator: ruleValidator }], validate };
        addField('name', validation);
        addField('name', validation);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('exclusive'));
        await expect(api.validate()).rejects.toEqual({ name: ['validate 错'] });
        expect(validate).toHaveBeenCalled();
        expect(ruleValidator).not.toHaveBeenCalled();
    });
});

describe('FormFoundation ArrayField 行', () => {
    const setupRows = () => {
        const host = createHost();
        const rows = [0, 1, 2].map((index) => host.addField(`a[${index}]`, {}, true, true));
        return { ...host, rows };
    };

    it('删除中间一行后，行内字段的 value、error、touched 左移，被删行的状态不会复活', () => {
        const { api, fieldBridge, addField, rows } = setupRows();
        ['v0', 'v1', 'v2'].forEach((value, index) => api.setValue(`a[${index}]`, value));
        api.setError('a[1]', 'e1');
        api.setError('a[2]', 'e2');
        api.setTouched('a[1]', true);
        api.setTouched('a[2]', true);

        // React's commit order: the removed row and the renamed row unregister their old paths, then the renamed row registers its new one with the same store
        fieldBridge.removeArrayFieldRow('a', 1);
        fieldBridge.unRegister(rows[1]);
        fieldBridge.unRegister(rows[2]);
        addField('a[1]', {}, true, true, rows[2].store);

        expect(api.getValue('a')).toEqual(['v0', 'v2']);
        expect(api.getError('a')).toEqual([undefined, ['e2']]);
        expect(api.getTouched('a')).toEqual([undefined, true]);
        expect(api.getTouched('a')).toHaveLength(2);
        expect(rows[2].store.getSnapshot()).toMatchObject({ value: 'v2', error: ['e2'], touched: true });

        fieldBridge.addArrayFieldRow('a');
        const added = addField('a[2]', {}, true, true);
        expect(api.getValue('a[2]')).toBeUndefined();
        expect(api.getError('a[2]')).toBeUndefined();
        expect(api.getTouched('a[2]')).toBeUndefined();
        expect(added.store.getSnapshot().error).toBeUndefined();
    });

    it('moveArrayFieldRow 同步移动 value、error、touched，并返回该 ArrayField 新的 updateKey', () => {
        const { api, fieldBridge } = setupRows();
        ['v0', 'v1', 'v2'].forEach((value, index) => api.setValue(`a[${index}]`, value));
        ['e0', 'e1', 'e2'].forEach((error, index) => api.setError(`a[${index}]`, error));
        [false, false, true].forEach((touched, index) => api.setTouched(`a[${index}]`, touched));

        const updateKey = fieldBridge.moveArrayFieldRow('a', 2, 0);
        expect(api.getValue('a')).toEqual(['v2', 'v0', 'v1']);
        expect(api.getError('a')).toEqual([['e2'], ['e0'], ['e1']]);
        expect(api.getTouched('a')).toEqual([true, false, false]);
        expect(fieldBridge.getArrayField('a')?.updateKey).toBe(updateKey);
    });

    it('数组路径上的错误叶子属于数组本身，移动行时不跟着移动', () => {
        const { api, fieldBridge } = createHost();
        api.setValue('a', ['v0', 'v1']);
        api.setError('a', ['至少三行']);

        fieldBridge.moveArrayFieldRow('a', 0, 1);
        expect(api.getValue('a')).toEqual(['v1', 'v0']);
        expect(api.getError('a')).toEqual(['至少三行']);
    });

    it('unRegisterArrayField 不带 keepState 时删除 value、error、touched 与注册项', () => {
        const { api, fieldBridge } = createHost();
        fieldBridge.mountArrayField('a', ['x', 'y']);
        api.setError('a', [['bad']]);
        api.setTouched('a', [true]);

        fieldBridge.unRegisterArrayField('a', false);
        expect(api.getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
        expect(fieldBridge.getArrayField('a')).toBeUndefined();
    });

    it('unRegisterArrayField 带 keepState 时保留 value 与注册项，再挂载不改变 reset 恢复的值', () => {
        const { api, fieldBridge } = createHost();
        fieldBridge.mountArrayField('a', ['x', 'y']);
        api.setValue('a', ['x', 'y', 'z']);

        fieldBridge.unRegisterArrayField('a', true);
        expect(api.getValue('a')).toEqual(['x', 'y', 'z']);
        expect(fieldBridge.getArrayField('a')).toMatchObject({ initValue: ['x', 'y'] });

        fieldBridge.mountArrayField('a', ['x', 'y', 'z']);
        expect(api.getValue('a')).toEqual(['x', 'y', 'z']);
        api.reset();
        expect(api.getValue('a')).toEqual(['x', 'y']);
    });

    it('保留的 ArrayField 再挂载时，新的行字段取回保留的错误与 touched', () => {
        const { api, fieldBridge, addField } = createHost();
        fieldBridge.mountArrayField('a', ['x']);
        const first = addField('a[0]', {}, true, true, new FieldStore({ value: 'x' }));
        api.setError('a[0]', '行错误');
        api.setTouched('a[0]', true);

        fieldBridge.unRegister(first);
        fieldBridge.unRegisterArrayField('a', true);
        fieldBridge.mountArrayField('a', ['x']);
        const row = addField('a[0]', {}, true, true, new FieldStore({ value: 'x' }));

        expect(row.store.getSnapshot()).toMatchObject({ value: 'x', error: ['行错误'], touched: true });
        expect(api.getError('a[0]')).toEqual(['行错误']);
    });
});
