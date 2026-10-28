import { StrictMode } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { IconPlusCircle } from '@fibrae/semi-icons-react';
import { Form, ArrayField, Button } from '@fibrae/semi-ui-react';
import type { ArrayFieldChildrenProps } from '../array-field';
import type { FormApi, FormState } from '../interface';

const data = [
    {
        name: 'hzj',
        type: 'rd',
    },
    {
        name: 'dc',
        type: 'ued',
    },
];
const newLine = {
    name: 'yx',
    type: 'rd',
};

function renderForm(props) {
    let { formProps = {}, arrayFieldProps = {}, fieldProps = {} } = props;
    return render(
        <Form
            style={{
                width: 500,
            }}
            {...formProps}
        >
            <ArrayField field="data" {...arrayFieldProps}>
                {({ add, arrayFields, addWithInitValue }) => (
                    <>
                        <Button className="addEmptyLine" theme="light" icon={<IconPlusCircle />} onClick={add}>
                            Add Empty Line
                        </Button>
                        <Button
                            className="addLine"
                            onClick={() => {
                                addWithInitValue(newLine);
                            }}
                        >
                            Add line with setting value
                        </Button>
                        {arrayFields.map(({ field, key, remove }) => (
                            <div key={key}>
                                <Form.Input field={`${field}[name]`} {...fieldProps} />
                                <Form.Input field={`${field}[type]`} {...fieldProps} />
                                <Button type="danger" onClick={remove} />
                            </div>
                        ))}
                    </>
                )}
            </ArrayField>
        </Form>
    );
}

const getFieldInput = (fieldPath) => document.querySelector(`.semi-form-field[x-field-id="${fieldPath}"] .semi-input`);
const clickAddEmptyLine = () => userEvent.click(screen.getByRole('button', { name: /Add Empty Line/ }));

describe('Form.ArrayField', () => {
    it('通过 ArrayField 属性声明 initValue', () => {
        renderForm({ arrayFieldProps: { initValue: data } });
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[0][type]')).toHaveValue(data[0].type);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });
    it('通过 Form 的 initValues 声明 initValue', () => {
        renderForm({ formProps: { initValues: { data } } });
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[0][type]')).toHaveValue(data[0].type);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });
    it('通过 Field 属性声明 initValue；Field 属性设置 initValue 时新增行', async () => {
        renderForm({
            formProps: {
                initValues: {
                    data: [{}],
                },
            },
            fieldProps: {
                initValue: 'semi',
            },
        });
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
        expect(getFieldInput('data[0][type]')).toHaveValue('semi');
        await clickAddEmptyLine();
        expect(getFieldInput('data[1][name]')).toHaveValue('semi');
        expect(getFieldInput('data[1][type]')).toHaveValue('semi');
    });
    it('ArrayField 基础用法', async () => {
        renderForm({ formProps: { initValues: { data } } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).toHaveValue('');
        expect(getFieldInput('data[2][type]')).toHaveValue('');
        await clickAddEmptyLine();
        expect(getFieldInput('data[3][name]')).toHaveValue('');
        expect(getFieldInput('data[3][type]')).toHaveValue('');
        // existing lines are kept
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('addWithInitValue', async () => {
        renderForm({ formProps: { initValues: { data } } });
        // ArrayField re-renders its lines when updateKey (a Date.now() value) changes, and Date is frozen in tests
        vi.setSystemTime(Date.now() + 1);
        await userEvent.click(screen.getByRole('button', { name: 'Add line with setting value' }));
        expect(getFieldInput('data[2][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][type]')).toHaveValue(newLine.type);
    });
    it('Debug-SetValuesWithArrayField：setValues(isOverride) 重写 ArrayField 的行', () => {
        let formApi = null;
        renderForm({
            formProps: {
                getFormApi: (api) => {
                    formApi = api;
                },
            },
            arrayFieldProps: { initValue: [] },
        });
        const lines = [
            { name: 'a', type: '1' },
            { name: 'b', type: '2' },
            { name: 'c', type: '3' },
        ];
        // ArrayField re-renders its lines when updateKey (a Date.now() value) changes, and Date is frozen in tests
        vi.setSystemTime(Date.now() + 1);
        void act(() => formApi.setValues({ name: 'nike', data: lines }, { isOverride: true }));
        expect(formApi.getValues()).toEqual({ name: 'nike', data: lines });
        lines.forEach((line, i) => {
            expect(getFieldInput(`data[${i}][name]`)).toHaveValue(line.name);
            expect(getFieldInput(`data[${i}][type]`)).toHaveValue(line.type);
        });

        vi.setSystemTime(Date.now() + 1);
        void act(() => formApi.setValues({ data: [{ name: 'z', type: '9' }] }, { isOverride: true }));
        expect(formApi.getValues()).toEqual({ data: [{ name: 'z', type: '9' }] });
        expect(getFieldInput('data[0][name]')).toHaveValue('z');
        expect(getFieldInput('data[1][name]')).toBeNull();
    });
    it('remove 删除该行，并保留后续行的值', async () => {
        let formApi = null;
        renderForm({
            formProps: { initValues: { data: [...data, newLine] }, getFormApi: (api) => (formApi = api) },
        });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[1]);
        expect(formApi.getValue('data')).toEqual([data[0], newLine]);
        expect(getFieldInput('data[1][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('formApi.reset 恢复初始行', async () => {
        let formApi = null;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).not.toBeNull();
        // ArrayField re-renders its lines when updateKey (a Date.now() value) changes, and Date is frozen in tests
        vi.setSystemTime(Date.now() + 1);
        void act(() => formApi.reset());
        expect(formApi.getValue('data')).toEqual(data);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });
    it('initValue 行里的 React 元素按引用保留，不被深拷贝', () => {
        let formApi = null;
        const icon = <IconPlusCircle />;
        renderForm({ formProps: { getFormApi: (api) => (formApi = api) }, arrayFieldProps: { initValue: [{ name: 'hzj', icon }] } });
        expect(formApi.getValue('data[0].icon')).toBe(icon);
    });
    it('每次 reset 都恢复不属于任何 Field 的 key', () => {
        let formApi = null;
        const rows = [{ id: 1, name: 'hzj', type: 'rd' }];
        renderForm({ formProps: { initValues: { data: rows }, getFormApi: (api) => (formApi = api) } });
        for (let round = 0; round < 2; round++) {
            void act(() => formApi.setValue('data[0].id', 99));
            void act(() => formApi.reset());
            expect(formApi.getValue('data[0].id')).toBe(1);
        }
    });
    it('每次 setValues 都重写行，同一毫秒内也不例外', () => {
        let formApi = null;
        renderForm({ formProps: { getFormApi: (api) => (formApi = api) }, arrayFieldProps: { initValue: [] } });
        // Date stays frozen: a Date.now() updateKey would repeat and the second update would keep stale lines
        void act(() => formApi.setValues({ data }, { isOverride: true }));
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        void act(() => formApi.setValues({ data: [newLine] }, { isOverride: true }));
        expect(getFieldInput('data[0][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[1][name]')).toBeNull();
        void act(() => formApi.setValue('data', data));
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('StrictMode 下保持注册，reset 与 setValues 仍会重写行', async () => {
        let formApi = null;
        render(
            <StrictMode>
                <Form getFormApi={(api) => (formApi = api)} initValues={{ data }}>
                    <ArrayField field="data">
                        {({ add, arrayFields }) => (
                            <>
                                <Button onClick={() => add()}>Add Empty Line</Button>
                                {arrayFields.map(({ field, key }) => (
                                    <Form.Input key={key} field={`${field}[name]`} />
                                ))}
                            </>
                        )}
                    </ArrayField>
                </Form>
            </StrictMode>
        );
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).not.toBeNull();
        void act(() => formApi.reset());
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[2][name]')).toBeNull();
        void act(() => formApi.setValues({ data: [newLine] }, { isOverride: true }));
        expect(getFieldInput('data[0][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[1][name]')).toBeNull();
    });

    it('remove 中间行时 onChange 只交出删行后的完整值，不交出缺行的中间态', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        renderForm({ formProps: { initValues: { data: [...data, newLine] }, onChange } });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[1]);
        expect(onChange).toHaveBeenCalled();
        for (const [formState] of onChange.mock.calls) {
            expect(formState.values).toEqual({ data: [data[0], newLine] });
        }
    });

    it('删行后 reset，留下的行显示恢复的初值', async () => {
        let formApi: FormApi = null;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) } });
        await userEvent.click(screen.getAllByRole('button').filter((b) => b.classList.contains('semi-button-danger'))[0]);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[1].name);
        act(() => formApi.reset());
        expect(formApi.getValue('data')).toEqual(data);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('行内字段与 ArrayField 的初值不同时，reset 后输入框与表单值一致', async () => {
        let formApi: FormApi = null;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) }, fieldProps: { initValue: 'semi' } });
        await userEvent.type(getFieldInput('data[0][name]'), 'x');
        act(() => formApi.reset());
        expect(getFieldInput('data[0][name]')).toHaveValue(formApi.getValue('data[0][name]'));
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
    });

    it('reset(fields) 不改动路径之外的 ArrayField', async () => {
        let formApi: FormApi = null;
        let addRow: () => void;
        render(
            <Form getFormApi={(api) => (formApi = api)} initValues={{ name: 'n', data: [data[0]] }}>
                <Form.Input field="name" />
                <ArrayField field="data">
                    {({ add, arrayFields }) => {
                        addRow = () => add();
                        return arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}[name]`} />);
                    }}
                </ArrayField>
            </Form>
        );
        act(() => addRow());
        await userEvent.type(getFieldInput('data[1][name]'), 'x');
        await userEvent.type(getFieldInput('name'), 'm');
        act(() => formApi.reset(['name']));
        expect(formApi.getValue('name')).toBe('n');
        expect(formApi.getValue('data')).toEqual([data[0], { name: 'x' }]);
        expect(getFieldInput('data[1][name]')).toHaveValue('x');
    });

    it('add 之后带 index 调用 addWithInitValue，插入行取传入的行值', () => {
        let helpers: ArrayFieldChildrenProps;
        render(
            <Form>
                <ArrayField field="data" initValue={[]}>
                    {(props) => {
                        helpers = props;
                        return props.arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}[name]`} initValue="def" />);
                    }}
                </ArrayField>
            </Form>
        );
        act(() => helpers.add());
        act(() => helpers.addWithInitValue({ name: 'x' }, 0));
        expect(getFieldInput('data[0][name]')).toHaveValue('x');
        expect(getFieldInput('data[1][name]')).toHaveValue('def');
    });

    it('field 改名后 reset 恢复新字段的初值', () => {
        let formApi: FormApi = null;
        const initValues = { a: [{ name: 'a0' }], b: [{ name: 'b0' }, { name: 'b1' }] };
        const Demo = ({ field }: { field: string }) => (
            <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                <ArrayField field={field}>{({ arrayFields }) => arrayFields.map(({ field: row, key }) => <Form.Input key={key} field={`${row}[name]`} />)}</ArrayField>
            </Form>
        );
        const { rerender } = render(<Demo field="a" />);
        rerender(<Demo field="b" />);
        act(() => formApi.reset());
        expect(formApi.getValue('b')).toEqual(initValues.b);
        expect(getFieldInput('b[1][name]')).toHaveValue('b1');
    });

    it('ArrayField 内的 keepState 警告每个字段只打印一次，Form 更新时不重复', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const keepStateWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes("'keepState' is not supported")).length;
        let formApi: FormApi = null;
        renderForm({ formProps: { initValues: { data: [data[0]] }, getFormApi: (api) => (formApi = api) }, fieldProps: { keepState: true } });
        expect(keepStateWarnings()).toBe(2);
        act(() => formApi.setValue('other', 1));
        act(() => formApi.setValue('other', 2));
        expect(keepStateWarnings()).toBe(2);
    });

    it('同一事件中连续调用两次 add 会新增两行', () => {
        let api;
        render(
            <Form>
                <ArrayField field="data" initValue={[]}>
                    {({ add, arrayFields }) => {
                        api = add;
                        return arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}[name]`} />);
                    }}
                </ArrayField>
            </Form>
        );
        act(() => {
            api();
            api();
        });
        expect(getFieldInput('data[1][name]')).not.toBeNull();
    });
});
