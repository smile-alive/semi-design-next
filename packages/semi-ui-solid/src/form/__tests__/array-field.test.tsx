import { For, createSignal, onMount } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { IconPlusCircle } from '@fibrae/semi-icons-solid';
import { type ArrayFieldChildrenProps, type ArrayFieldProps, type FormApi, type FormProps, type FormState, ArrayField, Form, FormInput } from '..';
import Button from '../../button';

const data = [
    { name: 'hzj', type: 'rd' },
    { name: 'dc', type: 'ued' },
];
const newLine = { name: 'yx', type: 'rd' };

interface RenderOptions {
    formProps?: FormProps;
    arrayFieldProps?: Partial<ArrayFieldProps>;
    fieldProps?: { initValue?: string; keepState?: boolean };
}

function renderForm({ formProps = {}, arrayFieldProps = {}, fieldProps = {} }: RenderOptions) {
    return render(() => (
        <Form style={{ width: '500px' }} {...formProps}>
            <ArrayField field="data" {...arrayFieldProps}>
                {(props) => (
                    <>
                        <Button class="addEmptyLine" theme="light" icon={<IconPlusCircle />} onClick={props.add}>
                            Add Empty Line
                        </Button>
                        <Button class="addLine" onClick={() => props.addWithInitValue(newLine)}>
                            Add line with setting value
                        </Button>
                        <For each={props.arrayFields}>
                            {(row) => (
                                <div>
                                    <FormInput field={`${row.field}[name]`} {...fieldProps} />
                                    <FormInput field={`${row.field}[type]`} {...fieldProps} />
                                    <Button type="danger" aria-label="remove" onClick={row.remove} />
                                </div>
                            )}
                        </For>
                    </>
                )}
            </ArrayField>
        </Form>
    ));
}

const getFieldInput = (fieldPath: string) => document.querySelector(`.semi-form-field[x-field-id="${fieldPath}"] .semi-input`) as HTMLInputElement | null;
const clickAddEmptyLine = () => userEvent.click(screen.getByRole('button', { name: /Add Empty Line/ }));
const removeButtons = () => screen.getAllByRole('button', { name: 'remove' });

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
        renderForm({ formProps: { initValues: { data: [{}] } }, fieldProps: { initValue: 'semi' } });
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
        await userEvent.click(screen.getByRole('button', { name: 'Add line with setting value' }));
        expect(getFieldInput('data[2][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][type]')).toHaveValue(newLine.type);
    });

    it('setValues(isOverride) 重写 ArrayField 的行', () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { getFormApi: (api) => (formApi = api) }, arrayFieldProps: { initValue: [] } });
        const lines = [
            { name: 'a', type: '1' },
            { name: 'b', type: '2' },
            { name: 'c', type: '3' },
        ];
        formApi?.setValues({ name: 'nike', data: lines }, { isOverride: true });
        expect(formApi?.getValues()).toEqual({ name: 'nike', data: lines });
        lines.forEach((line, i) => {
            expect(getFieldInput(`data[${i}][name]`)).toHaveValue(line.name);
            expect(getFieldInput(`data[${i}][type]`)).toHaveValue(line.type);
        });

        formApi?.setValues({ data: [{ name: 'z', type: '9' }] }, { isOverride: true });
        expect(formApi?.getValues()).toEqual({ data: [{ name: 'z', type: '9' }] });
        expect(getFieldInput('data[0][name]')).toHaveValue('z');
        expect(getFieldInput('data[1][name]')).toBeNull();
    });

    it('remove 删除该行，并保留后续行的值', async () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { initValues: { data: [...data, newLine] }, getFormApi: (api) => (formApi = api) } });
        await userEvent.click(removeButtons()[1]);
        expect(formApi?.getValue('data')).toEqual([data[0], newLine]);
        expect(getFieldInput('data[1][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('formApi.reset 恢复初始行', async () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) } });
        await clickAddEmptyLine();
        expect(getFieldInput('data[2][name]')).not.toBeNull();
        formApi?.reset();
        expect(formApi?.getValue('data')).toEqual(data);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        expect(getFieldInput('data[2][name]')).toBeNull();
    });

    it('initValue 行里的 DOM 节点按引用保留，不被深拷贝', () => {
        let formApi: FormApi | undefined;
        const icon = document.createElement('span');
        renderForm({ formProps: { getFormApi: (api) => (formApi = api) }, arrayFieldProps: { initValue: [{ name: 'hzj', icon }] } });
        expect(formApi?.getValue('data[0].icon')).toBe(icon);
    });

    it('每次 reset 都恢复不属于任何 Field 的 key', () => {
        let formApi: FormApi | undefined;
        const rows = [{ id: 1, name: 'hzj', type: 'rd' }];
        renderForm({ formProps: { initValues: { data: rows }, getFormApi: (api) => (formApi = api) } });
        for (let round = 0; round < 2; round++) {
            formApi?.setValue('data[0].id', 99);
            formApi?.reset();
            expect(formApi?.getValue('data[0].id')).toBe(1);
        }
    });

    it('每次 setValues 都重写行', () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { getFormApi: (api) => (formApi = api) }, arrayFieldProps: { initValue: [] } });
        formApi?.setValues({ data }, { isOverride: true });
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
        formApi?.setValues({ data: [newLine] }, { isOverride: true });
        expect(getFieldInput('data[0][name]')).toHaveValue(newLine.name);
        expect(getFieldInput('data[1][name]')).toBeNull();
        formApi?.setValue('data', data);
        expect(getFieldInput('data[1][type]')).toHaveValue(data[1].type);
    });

    it('remove 中间行时 onChange 只交出删行后的完整值，不交出缺行的中间态', async () => {
        const onChange = vi.fn<(formState: FormState) => void>();
        renderForm({ formProps: { initValues: { data: [...data, newLine] }, onChange } });
        await userEvent.click(removeButtons()[1]);
        expect(onChange).toHaveBeenCalled();
        for (const [formState] of onChange.mock.calls) {
            expect(formState.values).toEqual({ data: [data[0], newLine] });
        }
    });

    it('删行后 reset，留下的行显示恢复的初值', async () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) } });
        await userEvent.click(removeButtons()[0]);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[1].name);
        formApi?.reset();
        expect(formApi?.getValue('data')).toEqual(data);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[0].name);
        expect(getFieldInput('data[1][name]')).toHaveValue(data[1].name);
    });

    it('行内字段与 ArrayField 的初值不同时，reset 后输入框与表单值一致', async () => {
        let formApi: FormApi | undefined;
        renderForm({ formProps: { initValues: { data }, getFormApi: (api) => (formApi = api) }, fieldProps: { initValue: 'semi' } });
        await userEvent.type(getFieldInput('data[0][name]') as HTMLInputElement, 'x');
        formApi?.reset();
        expect(getFieldInput('data[0][name]')).toHaveValue(formApi?.getValue('data[0][name]'));
        expect(getFieldInput('data[0][name]')).toHaveValue('semi');
    });

    it('reset(fields) 不改动路径之外的 ArrayField', async () => {
        let formApi: FormApi | undefined;
        let helpers: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={{ name: 'n', data: [data[0]] }}>
                <FormInput field="name" />
                <ArrayField field="data">
                    {(props) => {
                        helpers = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        helpers?.add();
        await userEvent.type(getFieldInput('data[1][name]') as HTMLInputElement, 'x');
        await userEvent.type(getFieldInput('name') as HTMLInputElement, 'm');
        formApi?.reset(['name']);
        expect(formApi?.getValue('name')).toBe('n');
        expect(formApi?.getValue('data')).toEqual([data[0], { name: 'x' }]);
        expect(getFieldInput('data[1][name]')).toHaveValue('x');
    });

    it('add 之后带 index 调用 addWithInitValue，插入行取传入的行值', () => {
        let helpers: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form>
                <ArrayField field="data" initValue={[]}>
                    {(props) => {
                        helpers = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} initValue="def" />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        helpers?.add();
        helpers?.addWithInitValue({ name: 'x' }, 0);
        expect(getFieldInput('data[0][name]')).toHaveValue('x');
        expect(getFieldInput('data[1][name]')).toHaveValue('def');
    });

    it('field 改名后 reset 恢复新字段的初值', () => {
        let formApi: FormApi | undefined;
        const initValues = { a: [{ name: 'a0' }], b: [{ name: 'b0' }, { name: 'b1' }] };
        const [field, setField] = createSignal('a');
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                <ArrayField field={field()}>{(props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>}</ArrayField>
            </Form>
        ));
        setField('b');
        formApi?.reset();
        expect(formApi?.getValue('b')).toEqual(initValues.b);
        expect(getFieldInput('b[1][name]')).toHaveValue('b1');
    });

    it('父组件挂载时就改了 field，行跟随新字段', () => {
        let formApi: FormApi | undefined;
        const initValues = { a: [{ name: 'a0' }], b: [{ name: 'b0' }, { name: 'b1' }] };
        const [field, setField] = createSignal('a');
        const Demo = () => {
            onMount(() => setField('b'));
            return (
                <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                    <ArrayField field={field()}>{(props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>}</ArrayField>
                </Form>
            );
        };
        render(() => <Demo />);
        expect(getFieldInput('b[1][name]')).toHaveValue('b1');
        formApi?.reset();
        expect(formApi?.getValue('b')).toEqual(initValues.b);
    });

    it('ArrayField 内的 keepState 警告每个字段只打印一次，Form 更新时不重复', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const keepStateWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes("'keepState' is not supported")).length;
        let formApi: FormApi | undefined;
        renderForm({ formProps: { initValues: { data: [data[0]] }, getFormApi: (api) => (formApi = api) }, fieldProps: { keepState: true } });
        expect(keepStateWarnings()).toBe(2);
        formApi?.setValue('other', 1);
        formApi?.setValue('other', 2);
        expect(keepStateWarnings()).toBe(2);
        warn.mockRestore();
    });

    it('连续调用两次 add 会新增两行', () => {
        let helpers: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form>
                <ArrayField field="data" initValue={[]}>
                    {(props) => {
                        helpers = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        helpers?.add();
        helpers?.add();
        expect(getFieldInput('data[1][name]')).not.toBeNull();
    });

    it('arrayFields 的行对象在行存在期间保持身份，children 只调用一次', () => {
        const child = vi.fn<ArrayFieldProps['children']>((props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>);
        render(() => (
            <Form>
                <ArrayField field="data" initValue={data}>
                    {child}
                </ArrayField>
            </Form>
        ));
        const [helpers] = child.mock.calls[0];
        const second = helpers.arrayFields[1];
        helpers.arrayFields[0].remove();
        expect(helpers.arrayFields[0]).toBe(second);
        expect(second.field).toBe('data[0]');
        expect(child).toHaveBeenCalledTimes(1);
    });

    it('已删除行的 remove 再次调用时不删除其他行', () => {
        let api: FormApi | undefined;
        let helpers: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form getFormApi={(formApi) => (api = formApi)} initValues={{ data }}>
                <ArrayField field="data">
                    {(props) => {
                        helpers = props;
                        return <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} />}</For>;
                    }}
                </ArrayField>
            </Form>
        ));
        const first = helpers?.arrayFields[0];
        first?.remove();
        first?.remove();
        expect(api?.getValue('data')).toEqual([data[1]]);
        expect(getFieldInput('data[0][name]')).toHaveValue(data[1].name);
    });

    it('initValue 不是数组时告警并按空数组处理', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        let helpers: ArrayFieldChildrenProps | undefined;
        render(() => (
            <Form>
                <ArrayField field="data" initValue={'x' as unknown as unknown[]}>
                    {(props) => {
                        helpers = props;
                        return null;
                    }}
                </ArrayField>
            </Form>
        ));
        expect(helpers?.arrayFields).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('initValue of ArrayField must be an array'));
        warn.mockRestore();
    });

    it('Form 外使用时抛错', () => {
        expect(() => render(() => <ArrayField field="data">{() => null}</ArrayField>)).toThrow('ArrayField must be used inside Form');
    });
});
