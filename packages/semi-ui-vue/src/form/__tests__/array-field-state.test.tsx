/** @jsxImportSource vue */
import { nextTick, shallowRef } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { ArrayField, type ArrayFieldSlotProps } from '..';
import { getFieldInput } from './fixtures/array-rows';
import { flush, FormInput, renderForm } from './fixtures/fields';

const rows = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];

function renderRows(formProps: Record<string, unknown>, arrayFieldProps: Record<string, unknown> = {}, show = shallowRef(true)) {
    let scope: ArrayFieldSlotProps | undefined;
    const view = renderForm(formProps, () =>
        show.value ? (
            <ArrayField field="rows" {...arrayFieldProps}>
                {{
                    default: (slotProps: ArrayFieldSlotProps) => {
                        scope = slotProps;
                        return slotProps.arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}.name`} />);
                    },
                }}
            </ArrayField>
        ) : null
    );
    return { ...view, scope: () => scope as ArrayFieldSlotProps };
}

const inputValues = () => Array.from(document.querySelectorAll<HTMLInputElement>('.semi-input'), (input) => input.value);

describe('ArrayField keepState', () => {
    it('整体卸载默认保留行的值、错误与 touched，再挂载显示保留的行而不是 initValue', async () => {
        const show = shallowRef(true);
        const { api } = renderRows({}, { initValue: rows }, show);
        api().setValue('rows[1].name', 'changed');
        api().setError('rows[1].name', 'bad');
        api().setTouched('rows[1].name', true);
        await nextTick();
        show.value = false;
        await flush();
        expect(api().getValue('rows')).toEqual([{ name: 'a' }, { name: 'changed' }, { name: 'c' }]);
        expect(api().getError('rows[1].name')).toEqual(['bad']);
        show.value = true;
        await flush();
        expect(inputValues()).toEqual(['a', 'changed', 'c']);
        expect(api().getTouched('rows[1].name')).toBe(true);
        expect(api().getError('rows[1].name')).toEqual(['bad']);
        expect(document.querySelector('[x-field-id="rows[1].name"] .semi-form-field-error-message')).toHaveTextContent('bad');
        expect(getFieldInput('rows[1].name')).toHaveAttribute('aria-invalid', 'true');
        api().reset();
        await flush();
        expect(inputValues()).toEqual(['a', 'b', 'c']);
    });

    it.each([
        ['ArrayField', {}, { keepState: false }],
        ['Form', { keepState: false }, {}],
    ])('%s 的 keepState 为 false 时，整体卸载删除行的值、错误与 touched', async (_, formProps, arrayFieldProps) => {
        const show = shallowRef(true);
        const { api } = renderRows({ ...formProps, initValues: { rows } }, arrayFieldProps, show);
        api().setError('rows[0].name', 'bad');
        api().setTouched('rows[0].name', true);
        await nextTick();
        show.value = false;
        await flush();
        expect(api().getFormState()).toEqual({ values: {}, errors: {}, touched: {} });
    });

    it('行内字段未设 keepState 时跟随 ArrayField', async () => {
        const visible = shallowRef(true);
        const { api } = renderForm({ initValues: { rows } }, () => (
            <ArrayField field="rows" keepState={false}>
                {{ default: ({ arrayFields }: ArrayFieldSlotProps) => arrayFields.map(({ field, key }) => (visible.value ? <FormInput key={key} field={`${field}.name`} /> : null)) }}
            </ArrayField>
        ));
        visible.value = false;
        await flush();
        expect([0, 1, 2].map((index) => api().getValue(`rows[${index}].name`))).toEqual([undefined, undefined, undefined]);
    });

    it('删除中间行后，后面的行不复活被删行的状态，新增行为空', async () => {
        const { api, scope } = renderRows({ initValues: { rows } });
        api().setError('rows[1].name', 'b-error');
        api().setTouched('rows[1].name', true);
        await nextTick();
        scope().arrayFields[1].onRemove();
        await flush();
        expect(inputValues()).toEqual(['a', 'c']);
        expect(api().getValue('rows')).toEqual([{ name: 'a' }, { name: 'c' }]);
        expect(api().getError('rows[1].name')).toBeUndefined();
        expect(api().getTouched('rows[1].name')).toBeUndefined();
        scope().onAdd();
        await flush();
        expect(inputValues()).toEqual(['a', 'c', '']);
        expect(api().getValue('rows[2].name')).toBeUndefined();
        expect(api().getError('rows[2].name')).toBeUndefined();
    });
});

describe('ArrayField onMove', () => {
    it('行连同 key、值、错误与 touched 一起移动', async () => {
        const { api, scope } = renderRows({ initValues: { rows } });
        api().setError('rows[0].name', 'a-error');
        api().setTouched('rows[0].name', true);
        await nextTick();
        const keys = scope().arrayFields.map(({ key }) => key);
        scope().onMove(0, 2);
        await flush();
        expect(scope().arrayFields.map(({ key }) => key)).toEqual([keys[1], keys[2], keys[0]]);
        expect(inputValues()).toEqual(['b', 'c', 'a']);
        expect(api().getValue('rows')).toEqual([{ name: 'b' }, { name: 'c' }, { name: 'a' }]);
        expect(api().getError('rows[2].name')).toEqual(['a-error']);
        expect(api().getError('rows[0].name')).toBeUndefined();
        expect(api().getTouched('rows[2].name')).toBe(true);
        expect(getFieldInput('rows[2].name')).toHaveAttribute('aria-invalid', 'true');
    });

    it('越界的索引钳制到行的范围，from 与 to 相同时不做事', async () => {
        const { api, scope } = renderRows({ initValues: { rows } });
        scope().onMove(5, -1);
        await flush();
        expect(api().getValue('rows')).toEqual([{ name: 'c' }, { name: 'a' }, { name: 'b' }]);
        const keys = scope().arrayFields.map(({ key }) => key);
        scope().onMove(1, 1);
        await flush();
        expect(scope().arrayFields.map(({ key }) => key)).toEqual(keys);
        expect(inputValues()).toEqual(['c', 'a', 'b']);
    });
});
