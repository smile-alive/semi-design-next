import { type JSX, Index, Show, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { type FormApi, type FormProps, type FormRenderProps, Form, FormInput, FormSelect, useForm } from '..';
import Button from '../../button';

function renderForm(props: FormProps, children?: () => JSX.Element) {
    let formApi: FormApi | undefined;
    render(() => (
        <Form
            {...props}
            getFormApi={(api) => {
                formApi = api;
                props.getFormApi?.(api);
            }}
        >
            {children?.()}
        </Form>
    ));
    return () => formApi as FormApi;
}

function renderRows(props: FormProps, list: string, fields: string[]) {
    let formApi: FormApi | undefined;
    render(() => (
        <Form {...props} getFormApi={(api) => (formApi = api)}>
            {(renderProps: FormRenderProps) => (
                <Show when={renderProps.values[list]}>
                    {(rows) => (
                        <Index each={rows() as unknown[]}>
                            {(_, i) => (
                                <div>
                                    <Index each={fields}>{(name) => <FormInput field={`${list}[${i}].${name()}`} />}</Index>
                                </div>
                            )}
                        </Index>
                    )}
                </Show>
            )}
        </Form>
    ));
    return () => formApi as FormApi;
}

const fields = () => (
    <>
        <FormInput field="name" />
        <FormSelect style={{ width: '200px' }} field="business" label="business">
            <FormSelect.Option value="abc">Abc</FormSelect.Option>
            <FormSelect.Option value="hotsoon">Hotsoon</FormSelect.Option>
            <FormSelect.Option value="topbuzz">TopBuzz</FormSelect.Option>
        </FormSelect>
    </>
);

const nestedFields = () => (
    <>
        <FormInput class="ab" field="a.b" validator={(val: unknown) => (val ? '' : 'ab-err')} />
        <FormInput class="ac" field="a.c" validator={(val: unknown) => (val ? '' : 'ac-err')} />
        <FormInput class="e" field="e" validator={(val: unknown) => (val ? '' : 'e-err')} />
    </>
);

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`) as HTMLInputElement | null;
const getErrorMessage = (field: string) => document.querySelector(`[x-field-id="${field}"] .semi-form-field-error-message`);
const notMuji = [{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }];

describe('Form-formApi', () => {
    it('useForm api 绑定到挂载的 Form', () => {
        let state: ReturnType<typeof useForm> | undefined;
        const HookForm = () => {
            state = useForm();
            return (
                <Form form={state[0]} initValues={{ name: 'semi' }}>
                    <FormInput field="name" />
                </Form>
            );
        };
        render(() => <HookForm />);
        const [formApi, , values] = state as ReturnType<typeof useForm>;
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        expect(values()).toEqual({ name: 'semi' });
        formApi.setValue('name', 'design');
        expect(getInput('name')).toHaveValue('design');
        expect(values()).toEqual({ name: 'design' });
    });

    it('Form 卸载后再次挂载时，重新绑定 useForm api', async () => {
        let formApi: FormApi | undefined;
        const HookForm = () => {
            const [api] = useForm();
            formApi = api;
            const [show, setShow] = createSignal(true);
            return (
                <>
                    <Button onClick={() => setShow((s) => !s)}>toggle</Button>
                    <Show when={show()}>
                        <Form form={api} initValues={{ name: 'semi' }}>
                            <FormInput field="name" />
                        </Form>
                    </Show>
                </>
            );
        };
        render(() => <HookForm />);
        expect(formApi?.getValues()).toEqual({ name: 'semi' });

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi?.getValues()).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormApi.getValues() is called before Form'));
        warn.mockRestore();

        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi?.getValues()).toEqual({ name: 'semi' });
        formApi?.setValue('name', 'design');
        expect(getInput('name')).toHaveValue('design');
    });

    it('formApi-getFieldExist', () => {
        const getFormApi = vi.fn<(api: FormApi) => void>();
        const api = renderForm({ getFormApi }, () => <FormInput field="name" />);
        expect(getFormApi).toHaveBeenCalledTimes(1);
        expect(api().getFieldExist('name')).toEqual(true);
        expect(api().getFieldExist('business')).toEqual(false);
    });

    it('formApi-getInitValue / getInitValues', () => {
        const initValues = { name: 'semi', business: 'abc' };
        const api = renderForm({ initValues }, fields);
        expect(api().getInitValue('name')).toEqual('semi');
        expect(api().getInitValue('business')).toEqual('abc');
        expect(api().getInitValue('notExistField')).toEqual(undefined);
        expect(api().getInitValue()).toEqual(initValues);
        expect(api().getInitValues()).toEqual(initValues);
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-getTouched', () => {
        const api = renderForm({}, fields);
        fireEvent.focusOut(getInput('name') as HTMLInputElement);
        expect(api().getTouched('name')).toEqual(true);
        expect(api().getTouched('business')).toBeFalsy();
    });

    it('formApi-getValue', async () => {
        const api = renderForm({}, fields);
        expect(api().getValue('name')).toEqual(undefined);
        await userEvent.type(getInput('name') as HTMLInputElement, 'semi');
        expect(api().getValue('name')).toEqual('semi');
        expect(api().getValue()).toEqual({ name: 'semi' });
        expect(api().getValues()).toEqual({ name: 'semi' });
    });

    it('formApi-getError', async () => {
        const api = renderForm({}, () => <FormInput field="name" rules={notMuji} trigger="change" />);
        fireEvent.input(getInput('name') as HTMLInputElement, { target: { value: 'semi' } });
        await waitFor(() => expect(api().getError('name')).toEqual('not muji'));
        expect(getErrorMessage('name')).toHaveTextContent('not muji');
    });

    it('formApi-getFormState', async () => {
        const api = renderForm({}, () => <FormInput field="name" rules={notMuji} trigger="change" />);
        fireEvent.input(getInput('name') as HTMLInputElement, { target: { value: 'semi' } });
        await waitFor(() => expect(api().getFormState()).toEqual({ values: { name: 'semi' }, errors: { name: 'not muji' }, touched: { name: true } }));
    });

    it('formApi-setError', () => {
        const api = renderForm({}, () => <FormInput fieldClassName="test" field="name" trigger="change" />);
        api().setError('name', 'not muji');
        expect(api().getFormState()).toEqual({ values: {}, errors: { name: 'not muji' }, touched: {} });
        expect(document.querySelector('.test .semi-form-field-error-message')).toHaveTextContent(/^not muji$/);
    });

    it('formApi-setTouched', () => {
        const api = renderForm({}, fields);
        api().setTouched('business', true);
        expect(api().getTouched('business')).toEqual(true);
        expect(api().getTouched('name')).toBeFalsy();
        api().setTouched('business', false);
        expect(api().getTouched('business')).toEqual(false);
    });

    it('formApi-setValue', () => {
        const api = renderForm({}, fields);
        api().setValue('name', 'semi');
        expect(api().getValue('name')).toEqual('semi');
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-reset', () => {
        const api = renderForm({ initValues: { name: 'a' } }, fields);
        fireEvent.input(getInput('name') as HTMLInputElement, { target: { value: 'b' } });
        expect(getInput('name')).toHaveValue('b');
        api().reset();
        expect(getInput('name')).toHaveValue('a');
        expect(api().getFormState()).toEqual({ values: { name: 'a' }, errors: {}, touched: {} });
    });

    it('formApi-setValues 覆盖模式', () => {
        const api = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields);
        const expectVal = { name: 'semi', business: 'abc', extraKeyB: 'Kay tse' };
        api().setValues(expectVal, { isOverride: true });
        expect(api().getValue()).toEqual(expectVal);
        expect(getInput('name')).toHaveValue('semi');
        expect(document.querySelector('[x-field-id="business"] .semi-select-selection-text')).toHaveTextContent('Abc');
    });

    it('formApi-setValues 合并模式', () => {
        const api = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields);
        api().setValues({ name: 'semi', business: 'abc', extraKeyB: 'not exist' });
        expect(api().getValue()).toEqual({ name: 'semi', business: 'abc', extraKeyA: 'uno' });
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-validate：校验所有字段与指定字段', async () => {
        const api = renderForm({}, () => (
            <>
                <FormInput class="ab" field="a.b" validator={(val: unknown) => (val ? '' : 'ab-err')} />
                <FormInput class="ac" field="a.c" validator={(val: unknown) => (val ? '' : 'ac-err')} />
            </>
        ));
        await expect(api().validate()).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent('ab-err');
        api().reset();
        await expect(api().validate(['a.c'])).rejects.toEqual({ a: { c: 'ac-err' } });
        expect(api().getFormState().errors).toEqual({ a: { c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toBeNull();
        expect(getErrorMessage('a.c')).toHaveTextContent('ac-err');
    });

    it('formApi-validate：嵌套字段', async () => {
        const api = renderForm({}, nestedFields);
        await expect(api().validate(['a'])).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setValue：包含嵌套字段时', () => {
        const api = renderForm({}, nestedFields);
        api().setValue('a', { b: 'semi-b', c: 'semi-c' });
        expect(api().getFormState().values).toEqual({ a: { b: 'semi-b', c: 'semi-c' } });
        expect(getInput('a.b')).toHaveValue('semi-b');
        expect(getInput('a.c')).toHaveValue('semi-c');
        expect(getInput('e')).toHaveValue('');
    });

    it('formApi-setError：包含嵌套字段时', () => {
        const api = renderForm({}, nestedFields);
        api().setError('a', { b: 'ab-err', c: 'ac-err' });
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent(/^ab-err$/);
        expect(getErrorMessage('a.c')).toHaveTextContent(/^ac-err$/);
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setTouched：包含嵌套字段时', () => {
        const api = renderForm({}, nestedFields);
        api().setTouched('a', { b: true, c: true } as unknown as boolean);
        expect(api().getFormState().touched).toEqual({ a: { b: true, c: true } });
    });

    it('formApi-setValue：字段路径精确匹配', () => {
        const api = renderForm({}, () => (
            <>
                <FormInput field="a.b" />
                <FormInput field="a.c" />
                <FormInput field="a.d" />
            </>
        ));
        api().setValue('a.c', 'semi');
        expect(api().getValue('a.c')).toEqual('semi');
        expect(getInput('a.b')).toHaveValue('');
        expect(getInput('a.c')).toHaveValue('semi');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue：字段路径属于父级聚合', () => {
        const api = renderForm({}, () => (
            <>
                <FormInput field="a.b" />
                <FormInput field="a.c" />
                <FormInput field="a.d" />
            </>
        ));
        api().setValue('a', { b: 'semi', c: 'design' });
        expect(api().getValue('a.b')).toEqual('semi');
        expect(api().getValue('a.c')).toEqual('design');
        expect(getInput('a.b')).toHaveValue('semi');
        expect(getInput('a.c')).toHaveValue('design');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue 数组字段路径，0 -> 3', () => {
        const api = renderRows({}, 'a', ['name', 'type']);
        api().setValue('a', [
            { name: '0-name', type: '0-type' },
            { name: '1-name', type: '1-type' },
            { name: '2-name', type: '2-type' },
        ]);
        for (const i of [0, 1, 2]) {
            expect(getInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(getInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-setValue 数组字段路径，1 -> 3，并新增字段', () => {
        const api = renderRows({ initValues: { a: [{ name: 'semi', type: 'design' }] } }, 'a', ['name', 'type']);
        expect(getInput('a[0].name')).toHaveValue('semi');
        api().setValue('a', [
            { name: '0-name', type: '0-type' },
            { name: '1-name', type: '1-type' },
            { name: '2-name', type: '2-type' },
        ]);
        for (const i of [0, 1, 2]) {
            expect(getInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(getInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-validate：表单级校验器', async () => {
        const validatorSpy = vi.fn<() => { name: string }>(() => ({ name: 'from-validator' }));
        const api = renderForm({ validator: validatorSpy }, () => <FormInput field="name" />);
        await expect(api().validate()).rejects.toEqual({ name: 'from-validator' });
        expect(validatorSpy).toHaveBeenCalled();
        expect(api().getFormState().errors).toEqual({ name: 'from-validator' });
        expect(getErrorMessage('name')).toHaveTextContent('from-validator');
    });

    it('formApi-validate：字段校验器返回的节点错误会阻止提交', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const api = renderForm({ onSubmit }, () => <FormInput field="a" validator={() => <span>node-error</span>} />);
        await expect(api().validate()).rejects.toHaveProperty('a');
        api().submitForm();
        await screen.findByText('node-error');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validate 上报稀疏数组字段路径上的错误，reset 清除这些错误', async () => {
        const rules = [{ required: true, message: 'required' }];
        const paths = ['panels[11].start_time', 'panels[13].end_time', 'a.a1'];
        const api = renderForm({}, () => <Index each={paths}>{(path) => <FormInput field={path()} rules={rules} />}</Index>);
        await expect(api().validate()).rejects.toBeDefined();
        paths.forEach((path) => {
            expect(api().getError(path)).toBe('required');
            expect(getErrorMessage(path)).toHaveTextContent('required');
        });
        api().reset();
        expect(api().getFormState().errors).toEqual({});
        paths.forEach((path) => expect(getErrorMessage(path)).toBeNull());
    });

    it('setValues(isOverride) 删除中间行后，保留后续行的值', () => {
        const api = renderRows(
            {
                initValues: {
                    effects: [
                        { name: 'A', key: 'a' },
                        { name: 'B', key: 'b' },
                        { name: 'C', key: 'c' },
                    ],
                },
            },
            'effects',
            ['name']
        );
        const effects = (api().getValue('effects') as Array<{ key: string }>).filter((effect) => effect.key !== 'b');
        api().setValues({ ...api().getValue(), effects }, { isOverride: true });
        expect(api().getValue('effects')).toEqual([
            { name: 'A', key: 'a' },
            { name: 'C', key: 'c' },
        ]);
        expect(getInput('effects[0].name')).toHaveValue('A');
        expect(getInput('effects[1].name')).toHaveValue('C');
        expect(getInput('effects[2].name')).toBeNull();

        api().setValues({ ...api().getValue(), effects: [...api().getValue('effects'), { name: 'D', key: 'd' }] }, { isOverride: true });
        expect(getInput('effects[2].name')).toHaveValue('D');
        expect((api().getValue('effects') as Array<{ name: string }>).map((effect) => effect.name)).toEqual(['A', 'C', 'D']);
    });
});
