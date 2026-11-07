/** @jsxImportSource vue */
import { nextTick, ref } from 'vue';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { ArrayField, type ArrayFieldSlotProps, type FormState } from '..';
import { getFieldInput, newLine, renderArrayForm } from './fixtures/array-rows';
import { flush, FormInput, renderForm } from './fixtures/fields';

const data = [
    { name: 'hzj', type: 'rd' },
    { name: 'dc', type: 'ued' },
];
const clickAddEmptyLine = () => userEvent.click(screen.getByRole('button', { name: /Add Empty Line/ }));

describe('Form.ArrayField', () => {
    it('通过 ArrayField 属性声明 initValue', () => {
        renderArrayForm({ arrayFieldProps: { initValue: data } });
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[0][type]')).toHaveValue(data[0].type);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('通过 Form 的 initValues 声明 initValue', () => {
        renderArrayForm({ formProps: { initValues: { data } } });
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[0][type]')).toHaveValue(data[0].type);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('通过 Field 属性声明 initValue；Field 属性设置 initValue 时新增行', async () => {
        renderArrayForm({ formProps: { initValues: { data: [{}] } }, fieldProps: { initValue: 'semi' } });
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
        expect(getFieldInput('data[0][type]')).toHaveValue('semi');
        await clickAddEmptyLine();
        expect(getFieldInput('data[1][name]')).toHaveValue('semi');
        expect(getFieldInput('data[1][type]')).toHaveValue('semi');
    });

    it('ArrayField 基础用法', async () => {
        renderArrayForm({ formProps: { initValues: { data } } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).toHaveValue('');
        expect(getFieldInput('data[2][type]')).toHaveValue('');
        await clickAddEmptyLine();
        expect(getFieldInput('data[3][name]')).toHaveValue('');
        expect(getFieldInput('data[3][type]')).toHaveValue('');
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('onAddWithInitValue', async () => {
        renderArrayForm({ formProps: { initValues: { data } } });
        await userEvent.click(screen.getByRole('button', { name: 'Add line with setting value' }));
        expect(getFieldInput('data[2][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][type]')).toHaveValue(newLine.type);
    });

    it('Debug-SetValuesWithArrayField：setValues(isOverride) 重写 ArrayField 的行', async () => {
        const { api } = renderArrayForm({ arrayFieldProps: { initValue: [] } });
        const lines = [
            { name: 'a', type: '1' },
            { name: 'b', type: '2' },
            { name: 'c', type: '3' },
        ];
        api().setValues({ name: 'nike', data: lines }, { isOverride: true });
        await nextTick();
        expect(api().getValues()).toEqual({ name: 'nike', data: lines });
        lines.forEach((line, i) => {
            expect(getFieldInput(`data[${i}][name]`)).toHaveValue(line.name);
            expect(getFieldInput(`data[${i}][type]`)).toHaveValue(line.type);
        });

        api().setValues({ data: [{ name: 'z', type: '9' }] }, { isOverride: true });
        await nextTick();
        expect(api().getValues()).toEqual({ data: [{ name: 'z', type: '9' }] });
        expect(getFieldInput('data[0][name]')).toHaveValue('z');
        expect(getFieldInput('data[1][name]')).toBeNull();
    });

    it('onRemove 删除该行，并保留后续行的值', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data: [...data, newLine] } } });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[1]);
        expect(api().getValue('data')).toEqual([data[0], newLine]);
        expect(getFieldInput('data[1][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('formApi.reset 恢复初始行', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).not.toBeNull();
        api().reset();
        await nextTick();
        expect(api().getValue('data')).toEqual(data);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('每次 reset 都恢复不属于任何 Field 的 key', async () => {
        const rows = [{ id: 1, name: 'hzj', type: 'rd' }];
        const { api } = renderArrayForm({ formProps: { initValues: { data: rows } } });
        for (let round = 0; round < 2; round++) {
            api().setValue('data[0].id', 99);
            await nextTick();
            api().reset();
            await nextTick();
            expect(api().getValue('data[0].id')).toBe(1);
        }
    });

    it('每次 setValues 都重写行，同一毫秒内也不例外', async () => {
        const { api } = renderArrayForm({ arrayFieldProps: { initValue: [] } });
        // Date stays frozen: an updateKey taken from Date.now() would repeat and keep stale lines
        api().setValues({ data }, { isOverride: true });
        await nextTick();
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        api().setValues({ data: [newLine] }, { isOverride: true });
        await nextTick();
        expect(getFieldInput('data[0][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[1][name]')).toBeNull();
        api().setValue('data', data);
        await nextTick();
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('同一事件中连续调用两次 onAdd 会新增两行', async () => {
        let add: ArrayFieldSlotProps['onAdd'] | undefined;
        renderForm({}, () => (
            <ArrayField field="data" initValue={[]}>
                {{
                    default: ({ arrayFields, onAdd }: ArrayFieldSlotProps) => {
                        add = onAdd;
                        return arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}[name]`} />);
                    },
                }}
            </ArrayField>
        ));
        add?.();
        add?.();
        await nextTick();
        expect(getFieldInput('data[1][name]')).not.toBeNull();
    });

    it('field 改名后立即按新字段的值渲染行', async () => {
        const field = ref('empty');
        renderForm({ initValues: { empty: [], data } }, () => (
            <ArrayField field={field.value}>
                {{
                    default: ({ arrayFields }: ArrayFieldSlotProps) => arrayFields.map(({ field: row, key }) => <FormInput key={key} field={`${row}[name]`} />),
                }}
            </ArrayField>
        ));
        await nextTick();
        expect(document.querySelectorAll('.semi-input')).toHaveLength(0);
        field.value = 'data';
        await flush();
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('onRemove 中间行时 change 只交出删行后的完整值，不交出缺行的中间态', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        renderArrayForm({ formProps: { initValues: { data: [...data, newLine] }, onChange } });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[1]);
        await flush();
        expect(onChange).toHaveBeenCalled();
        for (const [formState] of onChange.mock.calls) {
            expect(formState.values).toEqual({ data: [data[0], newLine] });
        }
    });

    it('删行后 reset，留下的行显示恢复的初值', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } } });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[0]);
        await flush();
        expect(getFieldInput('data[0][name]')).toHaveValue(data[1].name);
        api().reset();
        await flush();
        expect(api().getValue('data')).toEqual(data);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('行内字段与 ArrayField 的初值不同时，reset 后输入框与表单值一致', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } }, fieldProps: { initValue: 'semi' } });
        await flush();
        await userEvent.type(getFieldInput('data[0][name]') as HTMLInputElement, 'x');
        api().reset();
        await flush();
        expect(getFieldInput('data[0][name]')).toHaveValue(api().getValue('data[0][name]'));
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
    });

    it('reset(fields) 不改动路径之外的 ArrayField', async () => {
        let add: ArrayFieldSlotProps['onAdd'] | undefined;
        const { api } = renderForm({ initValues: { name: 'n', data: [data[0]] } }, () => (
            <>
                <FormInput field="name" />
                <ArrayField field="data">
                    {{
                        default: ({ arrayFields, onAdd }: ArrayFieldSlotProps) => {
                            add = onAdd;
                            return arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}[name]`} />);
                        },
                    }}
                </ArrayField>
            </>
        ));
        add?.();
        await flush();
        await userEvent.type(getFieldInput('data[1][name]') as HTMLInputElement, 'x');
        await userEvent.type(getFieldInput('name') as HTMLInputElement, 'm');
        api().reset(['name']);
        await flush();
        expect(api().getValue('name')).toBe('n');
        expect(api().getValue('data')).toEqual([data[0], { name: 'x' }]);
        expect(getFieldInput('data[1][name]')).toHaveValue('x');
    });

    it('onAdd 之后带 index 调用 onAddWithInitValue，插入行取传入的行值', async () => {
        let helpers: ArrayFieldSlotProps | undefined;
        renderForm({}, () => (
            <ArrayField field="data" initValue={[]}>
                {{
                    default: (props: ArrayFieldSlotProps) => {
                        helpers = props;
                        return props.arrayFields.map(({ field, key }) => <FormInput key={key} field={`${field}[name]`} initValue="def" />);
                    },
                }}
            </ArrayField>
        ));
        helpers?.onAdd();
        await flush();
        helpers?.onAddWithInitValue({ name: 'x' }, 0);
        await flush();
        expect(getFieldInput('data[0][name]')).toHaveValue('x');
        expect(getFieldInput('data[1][name]')).toHaveValue('def');
    });

    it('field 改名后 reset 恢复新字段的初值', async () => {
        const field = ref('a');
        const initValues = { a: [{ name: 'a0' }], b: [{ name: 'b0' }, { name: 'b1' }] };
        const { api } = renderForm({ initValues }, () => (
            <ArrayField field={field.value}>
                {{
                    default: ({ arrayFields }: ArrayFieldSlotProps) => arrayFields.map(({ field: row, key }) => <FormInput key={key} field={`${row}[name]`} />),
                }}
            </ArrayField>
        ));
        await flush();
        field.value = 'b';
        await flush();
        api().reset();
        await flush();
        expect(api().getValue('b')).toEqual(initValues.b);
        expect(getFieldInput('b[1][name]')).toHaveValue('b1');
    });
});
