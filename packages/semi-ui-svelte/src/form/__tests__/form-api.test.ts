import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FormApi } from '../interface';
import CompositeFixture from './composite-fixture.svelte';
import { input, renderForm, select, settle, typeInto } from './helpers';

const fields = () => [input('name'), select({ style: 'width: 200px' })];
const fieldInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`) as HTMLInputElement | null;
const errorOf = (field: string) => document.querySelector(`[x-field-id="${field}"] .semi-form-field-error-message`);
const required = (message: string) => (value: unknown) => (value ? '' : message);
const nestedAB = () => input('a.b', { class: 'ab', validator: required('ab-err') });
const nestedAC = () => input('a.c', { class: 'ac', validator: required('ac-err') });
const nestedFields = () => [nestedAB(), nestedAC(), input('e', { class: 'e', validator: required('e-err') })];
const rowValues = (count: number) => Array.from({ length: count }, (_, i) => ({ name: `${i}-name`, type: `${i}-type` }));
const muji = [{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }];

describe('Svelte Form-formApi', () => {
    it('Form 卸载后再次挂载时，重新绑定 useForm api', async () => {
        let formApi = {} as FormApi;
        render(CompositeFixture, { props: { kind: 'useForm', onExternal: (external) => (formApi = external.formApi) } });
        expect(formApi.getValues()).toEqual({ name: 'init' });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await fireEvent.click(screen.getByRole('button', { name: '切换表单' }));
        await settle();
        expect(formApi.getValues()).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormApi.getValues() is called before Form'));
        warn.mockRestore();
        await fireEvent.click(screen.getByRole('button', { name: '切换表单' }));
        await settle();
        expect(formApi.getValues()).toEqual({ name: 'init' });
        formApi.setValue('name', 'design');
        await settle();
        expect(fieldInput('name')).toHaveValue('design');
    });

    it('formApi-getFieldExist', () => {
        const { api, onGetFormApi } = renderForm({}, [input('name')]);
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
        expect(api().getFieldExist('name')).toEqual(true);
        expect(api().getFieldExist('business')).toEqual(false);
    });

    it('formApi-getInitValue / getInitValues', () => {
        const initValues = { name: 'semi', business: 'abc' };
        const { api } = renderForm({ initValues }, fields());
        expect(api().getInitValue('name')).toEqual('semi');
        expect(api().getInitValue('business')).toEqual('abc');
        expect(api().getInitValue('notExistField')).toEqual(undefined);
        expect(api().getInitValue()).toEqual(initValues);
        expect(api().getInitValues()).toEqual(initValues);
        expect(fieldInput('name')).toHaveValue('semi');
    });

    it('formApi-getTouched', async () => {
        const { api } = renderForm({}, fields());
        await fireEvent.focusOut(fieldInput('name') as HTMLInputElement);
        expect(api().getTouched('name')).toEqual(true);
        expect(!api().getTouched('business')).toEqual(true);
    });

    it('formApi-getValue', async () => {
        const { api } = renderForm({}, fields());
        expect(api().getValue('name')).toEqual(undefined);
        await typeInto(fieldInput('name') as HTMLInputElement, 'semi');
        expect(api().getValue('name')).toEqual('semi');
        expect(api().getValue()).toEqual({ name: 'semi' });
        expect(api().getValues()).toEqual({ name: 'semi' });
    });

    it('formApi-getError', async () => {
        const { api } = renderForm({}, [input('name', { rules: muji, trigger: 'change' })]);
        await typeInto(fieldInput('name') as HTMLInputElement, 'semi');
        await waitFor(() => expect(api().getError('name')).toEqual('not muji'));
        expect(errorOf('name')).toHaveTextContent('not muji');
    });

    it('formApi-getFormState', async () => {
        const { api } = renderForm({}, [input('name', { rules: muji, trigger: 'change' })]);
        await typeInto(fieldInput('name') as HTMLInputElement, 'semi');
        await waitFor(() => expect(api().getFormState()).toEqual({ values: { name: 'semi' }, errors: { name: 'not muji' }, touched: { name: true } }));
    });

    it('formApi-setError', async () => {
        const { api, container } = renderForm({}, [input('name', { fieldClassName: 'test', trigger: 'change' })]);
        api().setError('name', 'not muji');
        await settle();
        expect(api().getFormState()).toEqual({ values: {}, errors: { name: 'not muji' }, touched: {} });
        expect(container.querySelector('.test .semi-form-field-error-message')).toHaveTextContent(/^not muji$/);
    });

    it('formApi-setTouched', () => {
        const { api } = renderForm({}, fields());
        api().setTouched('business', true);
        expect(api().getTouched('business')).toEqual(true);
        expect(!api().getTouched('name')).toEqual(true);
        api().setTouched('business', false);
        expect(api().getTouched('business')).toEqual(false);
    });

    it('formApi-setValue', async () => {
        const { api } = renderForm({}, fields());
        api().setValue('name', 'semi');
        await settle();
        expect(api().getValue('name')).toEqual('semi');
        expect(fieldInput('name')).toHaveValue('semi');
    });

    it('formApi-reset', async () => {
        const { api } = renderForm({ initValues: { name: 'a' } }, fields());
        await typeInto(fieldInput('name') as HTMLInputElement, 'b');
        expect(fieldInput('name')).toHaveValue('b');
        api().reset();
        await settle();
        expect(fieldInput('name')).toHaveValue('a');
        expect(api().getFormState()).toEqual({ values: { name: 'a' }, errors: {}, touched: {} });
    });

    it('formApi-setValues 覆盖模式', async () => {
        const { api } = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields());
        const expected = { name: 'semi', business: 'abc', extraKeyB: 'Kay tse' };
        api().setValues(expected, { isOverride: true });
        await settle();
        expect(api().getValue()).toEqual(expected);
        expect(fieldInput('name')).toHaveValue('semi');
        expect(document.querySelector('[x-field-id="business"] .semi-select-selection-text')).toHaveTextContent('Abc');
    });

    it('formApi-setValues 合并模式', async () => {
        const { api } = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields());
        api().setValues({ name: 'semi', business: 'abc', extraKeyB: 'not exist' });
        await settle();
        expect(api().getValue()).toEqual({ name: 'semi', business: 'abc', extraKeyA: 'uno' });
        expect(fieldInput('name')).toHaveValue('semi');
    });

    it('formApi-validate：校验所有字段与指定字段', async () => {
        const { api } = renderForm({}, [nestedAB(), nestedAC()]);
        await expect(api().validate()).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        await settle();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(errorOf('a.b')).toHaveTextContent('ab-err');
        api().reset();
        await expect(api().validate(['a.c'])).rejects.toEqual({ a: { c: 'ac-err' } });
        await settle();
        expect(api().getFormState().errors).toEqual({ a: { c: 'ac-err' } });
        expect(errorOf('a.b')).toBeNull();
        expect(errorOf('a.c')).toHaveTextContent('ac-err');
    });

    it('formApi-validate：嵌套字段', async () => {
        const { api } = renderForm({}, nestedFields());
        await expect(api().validate(['a'])).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        await settle();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(errorOf('e')).toBeNull();
    });

    it('formApi-setValue：包含嵌套字段时', async () => {
        const { api } = renderForm({}, nestedFields());
        api().setValue('a', { b: 'semi-b', c: 'semi-c' });
        await settle();
        expect(api().getFormState().values).toEqual({ a: { b: 'semi-b', c: 'semi-c' } });
        expect(fieldInput('a.b')).toHaveValue('semi-b');
        expect(fieldInput('a.c')).toHaveValue('semi-c');
        expect(fieldInput('e')).toHaveValue('');
    });

    it('formApi-setError：包含嵌套字段时', async () => {
        const { api } = renderForm({}, nestedFields());
        api().setError('a', { b: 'ab-err', c: 'ac-err' });
        await settle();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(errorOf('a.b')).toHaveTextContent(/^ab-err$/);
        expect(errorOf('a.c')).toHaveTextContent(/^ac-err$/);
        expect(errorOf('e')).toBeNull();
    });

    it('formApi-setTouched：包含嵌套字段时', () => {
        const { api } = renderForm({}, nestedFields());
        api().setTouched('a', { b: true, c: true });
        expect(api().getFormState().touched).toEqual({ a: { b: true, c: true } });
    });

    it('formApi-setValue：字段路径精确匹配', async () => {
        const { api } = renderForm(
            {},
            ['a.b', 'a.c', 'a.d'].map((field) => input(field))
        );
        api().setValue('a.c', 'semi');
        await settle();
        expect(api().getValue('a.c')).toEqual('semi');
        expect(fieldInput('a.b')).toHaveValue('');
        expect(fieldInput('a.c')).toHaveValue('semi');
        expect(fieldInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue：字段路径属于父级聚合', async () => {
        const { api } = renderForm(
            {},
            ['a.b', 'a.c', 'a.d'].map((field) => input(field))
        );
        api().setValue('a', { b: 'semi', c: 'design' });
        await settle();
        expect(api().getValue('a.b')).toEqual('semi');
        expect(api().getValue('a.c')).toEqual('design');
        expect(fieldInput('a.b')).toHaveValue('semi');
        expect(fieldInput('a.c')).toHaveValue('design');
        expect(fieldInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue 数组字段路径，0 -> 3', async () => {
        const { api } = renderForm({}, [], { rows: { path: 'a', subs: ['name', 'type'] } });
        api().setValue('a', rowValues(3));
        await settle();
        for (const i of [0, 1, 2]) {
            expect(fieldInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(fieldInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-setValue 数组字段路径，1 -> 3，并新增字段', async () => {
        const { api } = renderForm({ initValues: { a: [{ name: 'semi', type: 'design' }] } }, [], { rows: { path: 'a', subs: ['name', 'type'] } });
        expect(fieldInput('a[0].name')).toHaveValue('semi');
        api().setValue('a', rowValues(3));
        await settle();
        for (const i of [0, 1, 2]) {
            expect(fieldInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(fieldInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-validate：表单级校验器', async () => {
        const validator = vi.fn<() => { name: string }>(() => ({ name: 'from-validator' }));
        const { api } = renderForm({ validator }, [input('name')]);
        await expect(api().validate()).rejects.toEqual({ name: 'from-validator' });
        await settle();
        expect(validator).toHaveBeenCalled();
        expect(api().getFormState().errors).toEqual({ name: 'from-validator' });
        expect(errorOf('name')).toHaveTextContent('from-validator');
    });

    it('formApi-validate：字段校验器返回的字符串数组错误会阻止提交', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onSubmit }, [input('a', { validator: () => ['array-error'] })]);
        await expect(api().validate()).rejects.toHaveProperty('a');
        api().submitForm();
        expect(await screen.findByText('array-error')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Debug-SetBugDemo：validate 上报稀疏数组字段路径上的错误，reset 清除这些错误', async () => {
        const rules = [{ required: true, message: 'required' }];
        const paths = ['panels[11].start_time', 'panels[13].end_time', 'a.a1'];
        const { api } = renderForm(
            {},
            paths.map((path) => input(path, { rules }))
        );
        await expect(api().validate()).rejects.toBeDefined();
        await settle();
        for (const path of paths) {
            expect(api().getError(path)).toBe('required');
            expect(errorOf(path)).toHaveTextContent('required');
        }
        api().reset();
        await settle();
        expect(api().getFormState().errors).toEqual({});
        for (const path of paths) expect(errorOf(path)).toBeNull();
    });

    // rows are keyed by item and their fields are not, so removing the middle row renames the last row's fields in place
    it('formApi-setValue 删除三行数组字段的中间行后，第二行显示原第三行的值', async () => {
        type Effect = { name: string; type: string; key: number };
        const effects = [1, 2, 3].map((n, key) => ({ name: `${n}-name`, type: `${n}-type`, key }));
        const { api } = renderForm({ initValues: { effects } }, [], { rows: { path: 'effects', subs: ['name', 'type'], keyBy: 'key' } });
        api().setValue(
            'effects',
            (api().getValue('effects') as Effect[]).filter((effect) => effect.key !== 1)
        );
        await settle();
        expect(fieldInput('effects[0].name')).toHaveValue('1-name');
        expect(fieldInput('effects[1].name')).toHaveValue('3-name');
        expect(fieldInput('effects[1].type')).toHaveValue('3-type');
        expect(fieldInput('effects[2].name')).toBeNull();
    });
});
