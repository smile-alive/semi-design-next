import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { FormApi, FormState } from '../interface';
import AArrayRowsFixture, { type ArrayRowsStore, newLine } from './a-array-rows-fixture.svelte';
import { settle, typeInto } from './helpers';

const data = [
    { name: 'hzj', type: 'rd' },
    { name: 'dc', type: 'ued' },
];

function renderArrayForm(options: Partial<ArrayRowsStore> = {}) {
    const store = createStore<ArrayRowsStore>({ field: 'data', ...options });
    let formApi: FormApi | undefined;
    const view = render(AArrayRowsFixture, {
        props: {
            store,
            onApi: (api: FormApi) => {
                formApi = api;
            },
        },
    });
    return { ...view, store, api: () => formApi as FormApi };
}

const getFieldInput = (path: string) => document.querySelector<HTMLInputElement>(`.semi-form-field[x-field-id="${path}"] .semi-input`);
async function click(name: string | RegExp, index = 0) {
    await fireEvent.click(screen.getAllByRole('button', { name })[index]);
    await settle();
}
const clickAddEmptyLine = () => click(/Add Empty Line/);

describe('Svelte Form ArrayField 行为', () => {
    it('通过 ArrayField 属性声明 initValue', () => {
        renderArrayForm({ arrayInitValue: data });
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

    it('onAddWithInitValue 追加带值的行', async () => {
        renderArrayForm({ formProps: { initValues: { data } } });
        await click('Add line with setting value');
        expect(getFieldInput('data[2][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][type]')).toHaveValue(newLine.type);
    });

    it('setValues(isOverride) 重写 ArrayField 的行', async () => {
        const { api } = renderArrayForm({ arrayInitValue: [] });
        const lines = [
            { name: 'a', type: '1' },
            { name: 'b', type: '2' },
            { name: 'c', type: '3' },
        ];
        api().setValues({ name: 'nike', data: lines }, { isOverride: true });
        await settle();
        expect(api().getValues()).toEqual({ name: 'nike', data: lines });
        lines.forEach((line, i) => {
            expect(getFieldInput(`data[${i}][name]`)).toHaveValue(line.name);
            expect(getFieldInput(`data[${i}][type]`)).toHaveValue(line.type);
        });

        api().setValues({ data: [{ name: 'z', type: '9' }] }, { isOverride: true });
        await settle();
        expect(api().getValues()).toEqual({ data: [{ name: 'z', type: '9' }] });
        expect(getFieldInput('data[0][name]')).toHaveValue('z');
        expect(getFieldInput('data[1][name]')).toBeNull();
    });

    it('onRemove 删除该行，并保留后续行的值', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data: [...data, newLine] } } });
        await click('Remove', 1);
        expect(api().getValue('data')).toEqual([data[0], newLine]);
        expect(getFieldInput('data[1][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('formApi.reset 恢复初始行', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).not.toBeNull();
        api().reset();
        await settle();
        expect(api().getValue('data')).toEqual(data);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('每次 reset 都恢复不属于任何 Field 的 key', async () => {
        const rows = [{ id: 1, name: 'hzj', type: 'rd' }];
        const { api } = renderArrayForm({ formProps: { initValues: { data: rows } } });
        for (let round = 0; round < 2; round++) {
            api().setValue('data[0].id', 99);
            await settle();
            api().reset();
            await settle();
            expect(api().getValue('data[0].id')).toBe(1);
        }
    });

    it('每次 setValues 都重写行，同一毫秒内也不例外', async () => {
        const { api } = renderArrayForm({ arrayInitValue: [] });
        // Date stays frozen: an updateKey taken from Date.now() would repeat and keep stale lines
        api().setValues({ data }, { isOverride: true });
        await settle();
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        api().setValues({ data: [newLine] }, { isOverride: true });
        await settle();
        expect(getFieldInput('data[0][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[1][name]')).toBeNull();
        api().setValue('data', data);
        await settle();
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('同一事件中连续调用两次 onAdd 会新增两行', async () => {
        renderArrayForm({ arrayInitValue: [] });
        await click('Add two lines');
        expect(getFieldInput('data[1][name]')).not.toBeNull();
    });

    it('field 改名后立即按新字段的值渲染行', async () => {
        const { store } = renderArrayForm({ field: 'empty', formProps: { initValues: { empty: [], data } } });
        await settle();
        expect(document.querySelectorAll('.semi-input')).toHaveLength(0);
        store.field = 'data';
        await settle();
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('onRemove 中间行时 change 只交出删行后的完整值，不交出缺行的中间态', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        renderArrayForm({ formProps: { initValues: { data: [...data, newLine] }, onChange } });
        await click('Remove', 1);
        expect(onChange).toHaveBeenCalled();
        for (const [formState] of onChange.mock.calls) {
            expect(formState.values).toEqual({ data: [data[0], newLine] });
        }
    });

    it('删行后 reset，留下的行显示恢复的初值', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } } });
        await click('Remove', 0);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[1].name);
        api().reset();
        await settle();
        expect(api().getValue('data')).toEqual(data);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('行内字段与 ArrayField 的初值不同时，reset 后输入框与表单值一致', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { data } }, fieldProps: { initValue: 'semi' } });
        await settle();
        await typeInto(getFieldInput('data[0][name]') as HTMLInputElement, 'semix');
        api().reset();
        await settle();
        expect(getFieldInput('data[0][name]')).toHaveValue(api().getValue('data[0][name]'));
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
    });

    it('reset(fields) 不改动路径之外的 ArrayField', async () => {
        const { api } = renderArrayForm({ formProps: { initValues: { name: 'n', data: [data[0]] } }, withName: true });
        await clickAddEmptyLine();
        await typeInto(getFieldInput('data[1][name]') as HTMLInputElement, 'x');
        await typeInto(getFieldInput('name') as HTMLInputElement, 'nm');
        api().reset(['name']);
        await settle();
        expect(api().getValue('name')).toBe('n');
        expect(api().getValue('data')).toEqual([data[0], { name: 'x' }]);
        expect(getFieldInput('data[1][name]')).toHaveValue('x');
    });

    it('onAdd 之后带 index 调用 onAddWithInitValue，插入行取传入的行值', async () => {
        renderArrayForm({ arrayInitValue: [], fieldProps: { initValue: 'def' } });
        await clickAddEmptyLine();
        await click('Insert x at head');
        expect(getFieldInput('data[0][name]')).toHaveValue('x');
        expect(getFieldInput('data[1][name]')).toHaveValue('def');
    });

    it('field 改名后 reset 恢复新字段的初值', async () => {
        const initValues = { a: [{ name: 'a0' }], b: [{ name: 'b0' }, { name: 'b1' }] };
        const { api, store } = renderArrayForm({ field: 'a', formProps: { initValues } });
        await settle();
        store.field = 'b';
        await settle();
        api().reset();
        await settle();
        expect(api().getValue('b')).toEqual(initValues.b);
        expect(getFieldInput('b[1][name]')).toHaveValue('b1');
    });
});
