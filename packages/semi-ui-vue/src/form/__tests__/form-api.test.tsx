/** @jsxImportSource vue */
import { defineComponent, nextTick, ref } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, useForm, type FormApi, type FormDefaultSlotProps } from '..';
import { FormInput, renderForm, selectWithOptions } from './fixtures/fields';

const fields = () => (
    <>
        <FormInput field="name" />
        {selectWithOptions({ style: { width: '200px' } })}
    </>
);

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`) as HTMLInputElement | null;
const getErrorMessage = (field: string) => document.querySelector(`[x-field-id="${field}"] .semi-form-field-error-message`);

const nestedAB = () => <FormInput class="ab" field="a.b" validator={(val: unknown) => (val ? '' : 'ab-err')} />;
const nestedAC = () => <FormInput class="ac" field="a.c" validator={(val: unknown) => (val ? '' : 'ac-err')} />;
const nestedE = () => <FormInput class="e" field="e" validator={(val: unknown) => (val ? '' : 'e-err')} />;
const nestedFields = () => (
    <>
        {nestedAB()}
        {nestedAC()}
        {nestedE()}
    </>
);

const arrayRows = ({ values }: FormDefaultSlotProps) =>
    (values.a as unknown[] | undefined)?.map((_, i) => (
        <div>
            <FormInput field={`a[${i}].name`} />
            <FormInput field={`a[${i}].type`} />
        </div>
    ));

describe('Form-formApi', () => {
    it('Form 卸载后再次挂载时，重新绑定 useForm api', async () => {
        const { formApi } = useForm();
        const show = ref(true);
        render(() => (
            <>
                <button type="button" onClick={() => (show.value = !show.value)}>
                    toggle
                </button>
                {show.value ? (
                    <Form form={formApi} initValues={{ name: 'semi' }}>
                        {() => <FormInput field="name" />}
                    </Form>
                ) : null}
            </>
        ));
        expect(formApi.getValues()).toEqual({ name: 'semi' });

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi.getValues()).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormApi.getValues() is called before Form'));
        warn.mockRestore();

        await fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(formApi.getValues()).toEqual({ name: 'semi' });
        formApi.setValue('name', 'design');
        await nextTick();
        expect(getInput('name')).toHaveValue('design');
    });

    it('formApi-getFieldExist', () => {
        const onGetFormApi = vi.fn<(api: FormApi) => void>();
        const { api } = renderForm({ onGetFormApi }, () => <FormInput field="name" />);
        expect(onGetFormApi).toHaveBeenCalledTimes(1);
        expect(api().getFieldExist('name')).toEqual(true);
        expect(api().getFieldExist('business')).toEqual(false);
    });

    it('formApi-getInitValue / getInitValues', () => {
        const initValues = { name: 'semi', business: 'abc' };
        const { api } = renderForm({ initValues }, fields);
        expect(api().getInitValue('name')).toEqual('semi');
        expect(api().getInitValue('business')).toEqual('abc');
        expect(api().getInitValue('notExistField')).toEqual(undefined);
        expect(api().getInitValue()).toEqual(initValues);
        expect(api().getInitValues()).toEqual(initValues);
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-getTouched', async () => {
        const { api } = renderForm({}, fields);
        await fireEvent.focusOut(getInput('name') as HTMLInputElement);
        expect(api().getTouched('name')).toEqual(true);
        expect(!api().getTouched('business')).toEqual(true);
    });

    it('formApi-getValue', async () => {
        const { api } = renderForm({}, fields);
        expect(api().getValue('name')).toEqual(undefined);
        await fireEvent.update(getInput('name') as HTMLInputElement, 'semi');
        expect(api().getValue('name')).toEqual('semi');
        expect(api().getValue()).toEqual({ name: 'semi' });
        expect(api().getValues()).toEqual({ name: 'semi' });
    });

    it('formApi-getError', async () => {
        const errorMessage = 'not muji';
        const { api } = renderForm({}, () => <FormInput field="name" rules={[{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: errorMessage }]} trigger="change" />);
        await fireEvent.update(getInput('name') as HTMLInputElement, 'semi');
        await waitFor(() => expect(api().getError('name')).toEqual(errorMessage));
        expect(getErrorMessage('name')).toHaveTextContent(errorMessage);
    });

    it('formApi-getFormState', async () => {
        const { api } = renderForm({}, () => <FormInput field="name" rules={[{ validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' }]} trigger="change" />);
        await fireEvent.update(getInput('name') as HTMLInputElement, 'semi');
        await waitFor(() =>
            expect(api().getFormState()).toEqual({
                values: { name: 'semi' },
                errors: { name: 'not muji' },
                touched: { name: true },
            })
        );
    });

    it('formApi-setError', async () => {
        const errorMessage = 'not muji';
        const { api, container } = renderForm({}, () => <FormInput fieldClassName="test" field="name" trigger="change" />);
        api().setError('name', errorMessage);
        await nextTick();
        expect(api().getFormState()).toEqual({ values: {}, errors: { name: errorMessage }, touched: {} });
        expect(container.querySelector('.test .semi-form-field-error-message')).toHaveTextContent(/^not muji$/);
    });

    it('formApi-setTouched', () => {
        const { api } = renderForm({}, fields);
        api().setTouched('business', true);
        expect(api().getTouched('business')).toEqual(true);
        expect(!api().getTouched('name')).toEqual(true);
        api().setTouched('business', false);
        expect(api().getTouched('business')).toEqual(false);
    });

    it('formApi-setValue', async () => {
        const { api } = renderForm({}, fields);
        api().setValue('name', 'semi');
        await nextTick();
        expect(api().getValue('name')).toEqual('semi');
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-reset', async () => {
        const { api } = renderForm({ initValues: { name: 'a' } }, fields);
        await fireEvent.update(getInput('name') as HTMLInputElement, 'b');
        expect(getInput('name')).toHaveValue('b');
        api().reset();
        await nextTick();
        expect(getInput('name')).toHaveValue('a');
        expect(api().getFormState()).toEqual({ values: { name: 'a' }, errors: {}, touched: {} });
    });

    it('formApi-setValues 覆盖模式', async () => {
        const { api } = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields);
        const expectVal = { name: 'semi', business: 'abc', extraKeyB: 'Kay tse' };
        api().setValues(expectVal, { isOverride: true });
        await nextTick();
        expect(api().getValue()).toEqual(expectVal);
        expect(getInput('name')).toHaveValue('semi');
        expect(document.querySelector('[x-field-id="business"] .semi-select-selection-text')).toHaveTextContent('Abc');
    });

    it('formApi-setValues 合并模式', async () => {
        const { api } = renderForm({ initValues: { name: 'a', extraKeyA: 'uno' } }, fields);
        api().setValues({ name: 'semi', business: 'abc', extraKeyB: 'not exist' });
        await nextTick();
        expect(api().getValue()).toEqual({ name: 'semi', business: 'abc', extraKeyA: 'uno' });
        expect(getInput('name')).toHaveValue('semi');
    });

    it('formApi-validate：校验所有字段与特殊字段', async () => {
        const { api } = renderForm({}, () => (
            <>
                {nestedAB()}
                {nestedAC()}
            </>
        ));
        await expect(api().validate()).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        await nextTick();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent('ab-err');
        api().reset();
        await expect(api().validate(['a.c'])).rejects.toEqual({ a: { c: 'ac-err' } });
        await nextTick();
        expect(api().getFormState().errors).toEqual({ a: { c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toBeNull();
        expect(getErrorMessage('a.c')).toHaveTextContent('ac-err');
    });

    it('formApi-validate：嵌套字段', async () => {
        const { api } = renderForm({}, nestedFields);
        await expect(api().validate(['a'])).rejects.toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        await nextTick();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setValue：包含嵌套字段时', async () => {
        const { api } = renderForm({}, nestedFields);
        api().setValue('a', { b: 'semi-b', c: 'semi-c' });
        await nextTick();
        expect(api().getFormState().values).toEqual({ a: { b: 'semi-b', c: 'semi-c' } });
        expect(getInput('a.b')).toHaveValue('semi-b');
        expect(getInput('a.c')).toHaveValue('semi-c');
        expect(getInput('e')).toHaveValue('');
    });

    it('formApi-setError：包含嵌套字段时', async () => {
        const { api } = renderForm({}, nestedFields);
        api().setError('a', { b: 'ab-err', c: 'ac-err' });
        await nextTick();
        expect(api().getFormState().errors).toEqual({ a: { b: 'ab-err', c: 'ac-err' } });
        expect(getErrorMessage('a.b')).toHaveTextContent(/^ab-err$/);
        expect(getErrorMessage('a.c')).toHaveTextContent(/^ac-err$/);
        expect(getErrorMessage('e')).toBeNull();
    });

    it('formApi-setTouched：包含嵌套字段时', () => {
        const { api } = renderForm({}, nestedFields);
        api().setTouched('a', { b: true, c: true });
        expect(api().getFormState().touched).toEqual({ a: { b: true, c: true } });
    });

    it('formApi-setValue：字段路径精确匹配', async () => {
        const { api } = renderForm({}, () => ['a.b', 'a.c', 'a.d'].map((field) => <FormInput field={field} />));
        api().setValue('a.c', 'semi');
        await nextTick();
        expect(api().getValue('a.c')).toEqual('semi');
        expect(getInput('a.b')).toHaveValue('');
        expect(getInput('a.c')).toHaveValue('semi');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue：字段路径属于父级聚合', async () => {
        const { api } = renderForm({}, () => ['a.b', 'a.c', 'a.d'].map((field) => <FormInput field={field} />));
        api().setValue('a', { b: 'semi', c: 'design' });
        await nextTick();
        expect(api().getValue('a.b')).toEqual('semi');
        expect(api().getValue('a.c')).toEqual('design');
        expect(getInput('a.b')).toHaveValue('semi');
        expect(getInput('a.c')).toHaveValue('design');
        expect(getInput('a.d')).toHaveValue('');
    });

    it('formApi-setValue 数组字段路径，0 -> 3', async () => {
        const { api } = renderForm({}, arrayRows);
        api().setValue('a', [
            { name: '0-name', type: '0-type' },
            { name: '1-name', type: '1-type' },
            { name: '2-name', type: '2-type' },
        ]);
        await nextTick();
        for (const i of [0, 1, 2]) {
            expect(getInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(getInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-setValue 数组字段路径，1 -> 3，并新增字段', async () => {
        const { api } = renderForm({ initValues: { a: [{ name: 'semi', type: 'design' }] } }, arrayRows);
        expect(getInput('a[0].name')).toHaveValue('semi');
        api().setValue('a', [
            { name: '0-name', type: '0-type' },
            { name: '1-name', type: '1-type' },
            { name: '2-name', type: '2-type' },
        ]);
        await nextTick();
        for (const i of [0, 1, 2]) {
            expect(getInput(`a[${i}].name`)).toHaveValue(`${i}-name`);
            expect(getInput(`a[${i}].type`)).toHaveValue(`${i}-type`);
        }
    });

    it('formApi-validate：表单级校验器', async () => {
        const validatorSpy = vi.fn<() => { name: string }>(() => ({ name: 'from-validator' }));
        const { api } = renderForm({ validator: validatorSpy }, () => <FormInput field="name" />);
        await expect(api().validate()).rejects.toEqual({ name: 'from-validator' });
        await nextTick();
        expect(validatorSpy).toHaveBeenCalled();
        expect(api().getFormState().errors).toEqual({ name: 'from-validator' });
        expect(getErrorMessage('name')).toHaveTextContent('from-validator');
    });

    it('formApi-validate：字段校验器返回的字符串数组错误会阻止提交', async () => {
        const onSubmit = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ onSubmit }, () => <FormInput field="a" validator={() => ['array-error']} />);
        await expect(api().validate()).rejects.toHaveProperty('a');
        api().submitForm();
        expect(await screen.findByText('array-error')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Debug-SetBugDemo：validate 上报稀疏数组字段路径上的错误，reset 清除这些错误', async () => {
        const rules = [{ required: true, message: 'required' }];
        const paths = ['panels[11].start_time', 'panels[13].end_time', 'a.a1'];
        const { api } = renderForm({}, () => paths.map((path) => <FormInput key={path} field={path} rules={rules} />));
        await expect(api().validate()).rejects.toBeDefined();
        await nextTick();
        paths.forEach((path) => {
            expect(api().getError(path)).toBe('required');
            expect(getErrorMessage(path)).toHaveTextContent('required');
        });
        api().reset();
        await nextTick();
        expect(api().getFormState().errors).toEqual({});
        paths.forEach((path) => expect(getErrorMessage(path)).toBeNull());
    });

    // Rows are keyed by item and their fields are not keyed, so removing the middle row renames the last row's fields
    // from effects[2] to effects[1] in place; the rename registers after the Form's forceUpdate callback was queued
    it('formApi-setValue 删除三行数组字段的中间行后，第二行显示原第三行的值', async () => {
        type Effect = { name: string; type: string; key: number };
        const { api } = renderForm(
            {
                initValues: {
                    effects: [
                        { name: '1-name', type: '1-type', key: 0 },
                        { name: '2-name', type: '2-type', key: 1 },
                        { name: '3-name', type: '3-type', key: 2 },
                    ],
                },
            },
            ({ values }) =>
                (values.effects as Effect[] | undefined)?.map((effect, i) => (
                    <div key={effect.key}>
                        <FormInput field={`effects[${i}].name`} />
                        <FormInput field={`effects[${i}].type`} />
                    </div>
                ))
        );
        api().setValue(
            'effects',
            (api().getValue('effects') as Effect[]).filter((effect) => effect.key !== 1)
        );
        await nextTick();
        expect(getInput('effects[0].name')).toHaveValue('1-name');
        expect(getInput('effects[1].name')).toHaveValue('3-name');
        expect(getInput('effects[1].type')).toHaveValue('3-type');
        expect(getInput('effects[2].name')).toBeNull();
    });

    // Rows are keyed by item while their fields are keyed by index, so removing a middle row unmounts a field path
    // that setValues has already refilled with the next item
    it('Debug-SetValuesDemo：setValues(isOverride) 删除中间行后，保留后续行的值', async () => {
        type Effect = { name: string; key: string };
        const Rows = defineComponent({
            props: { effects: { type: Array, default: undefined } },
            setup: (props) => () =>
                (props.effects as Effect[] | undefined)?.map((effect, i) => (
                    <div key={effect.key}>
                        <FormInput key={`effects[${i}].name`} field={`effects[${i}].name`} />
                    </div>
                )),
        });
        const { api } = renderForm(
            {
                initValues: {
                    effects: [
                        { name: 'A', key: 'a' },
                        { name: 'B', key: 'b' },
                        { name: 'C', key: 'c' },
                    ],
                },
            },
            ({ values }) => <Rows effects={values.effects as Effect[]} />
        );
        const effects = (api().getValue('effects') as Effect[]).filter((effect) => effect.key !== 'b');
        api().setValues({ ...api().getValue(), effects }, { isOverride: true });
        await nextTick();
        expect(api().getValue('effects')).toEqual([
            { name: 'A', key: 'a' },
            { name: 'C', key: 'c' },
        ]);
        expect(getInput('effects[0].name')).toHaveValue('A');
        expect(getInput('effects[1].name')).toHaveValue('C');
        expect(getInput('effects[2].name')).toBeNull();

        api().setValues({ ...api().getValue(), effects: [...(api().getValue('effects') as Effect[]), { name: 'D', key: 'd' }] }, { isOverride: true });
        await nextTick();
        expect(getInput('effects[2].name')).toHaveValue('D');
        expect((api().getValue('effects') as Effect[]).map((effect) => effect.name)).toEqual(['A', 'C', 'D']);
    });
});
