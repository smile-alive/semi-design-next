import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { type FormApi, Form, FormAutoComplete, FormCascader, FormCheckbox, FormCheckboxGroup, FormDatePicker, FormRadio, FormRadioGroup, FormSwitch, FormTagInput, FormTransfer, FormTreeSelect, FormUpload } from '..';

const leakedAttrs = ['insetlabel', 'insetlabelid', 'validatestatus'];
function expectNoLeakedAttrs(element: Element | null) {
    for (const attr of leakedAttrs) {
        expect(element).not.toHaveAttribute(attr);
    }
}

describe('FormSwitch', () => {
    const getSwitch = () => screen.getByRole<HTMLInputElement>('switch');
    const getWrapper = () => getSwitch().parentElement as HTMLElement;

    it('formApi.reset 后再次取消选中', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormSwitch field="on" />
            </Form>
        ));
        await userEvent.click(getSwitch());
        expect(getSwitch()).toBeChecked();
        expect(formApi?.getValue('on')).toBe(true);
        formApi?.reset();
        expect(getSwitch()).not.toBeChecked();
    });

    it('在 blur 时校验，且不把 Form 属性泄漏到 DOM', () => {
        const validate = vi.fn<() => string>(() => '');
        render(() => (
            <Form>
                <FormSwitch field="on" trigger="blur" validator={validate} />
            </Form>
        ));
        getSwitch().focus();
        getSwitch().blur();
        expect(validate).toHaveBeenCalled();
        expectNoLeakedAttrs(getWrapper());
    });

    it('必填时 aria-required 落在 role="switch" 的 input 上', () => {
        render(() => (
            <Form>
                <FormSwitch field="s" rules={[{ required: true }]} />
            </Form>
        ));
        expect(getSwitch()).toHaveAttribute('aria-required', 'true');
        expect(getWrapper()).not.toHaveAttribute('aria-required');
    });
});

describe('FormCheckbox 与 FormRadio', () => {
    it('FormCheckbox 以 checked 为字段值', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormCheckbox field="agree" noLabel>
                    Agree
                </FormCheckbox>
            </Form>
        ));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Agree' }));
        expect(formApi?.getValue('agree')).toBe(true);
        formApi?.setValue('agree', false);
        expect(screen.getByRole('checkbox', { name: 'Agree' })).not.toBeChecked();
    });

    it('FormCheckboxGroup 与组内不带 field 的 FormCheckbox 以数组为字段值', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormCheckboxGroup field="roles" label="Roles">
                    <FormCheckbox value="admin">Admin</FormCheckbox>
                    <FormCheckbox value="user">User</FormCheckbox>
                </FormCheckboxGroup>
            </Form>
        ));
        await userEvent.click(screen.getByRole('checkbox', { name: 'User' }));
        expect(formApi?.getValue('roles')).toEqual(['user']);
        formApi?.setValue('roles', ['admin']);
        expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'User' })).not.toBeChecked();
    });

    it('FormRadioGroup 以选中项的 value 为字段值，FormRadio 以 checked 为字段值', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormRadioGroup field="size" label="Size">
                    <FormRadio value="s">Small</FormRadio>
                    <FormRadio value="l">Large</FormRadio>
                </FormRadioGroup>
                <FormRadio field="single" noLabel>
                    Single
                </FormRadio>
            </Form>
        ));
        await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
        expect(formApi?.getValue('size')).toBe('l');
        await userEvent.click(screen.getByRole('radio', { name: 'Single' }));
        expect(formApi?.getValue('single')).toBe(true);
        formApi?.reset();
        expect(screen.getByRole('radio', { name: 'Large' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'Single' })).not.toBeChecked();
    });
});

describe('FormTagInput', () => {
    const tagInputCls = `${BASE_CLASS_PREFIX}-tagInput`;
    const getRoot = () => document.querySelector(`.${tagInputCls}`) as HTMLElement;
    const getInput = () => getRoot().querySelector('input') as HTMLInputElement;

    it('formApi.reset 后清空，并在 blur 时校验', async () => {
        let formApi: FormApi | undefined;
        const validate = vi.fn<() => string>(() => '');
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTagInput field="tags" label="Tags" trigger="blur" validator={validate} />
                <button type="button">outside</button>
            </Form>
        ));
        await userEvent.type(getInput(), 'a');
        fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(formApi?.getValue('tags')).toEqual(['a']);
        expect(validate).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('outside'));
        expect(validate).toHaveBeenCalledTimes(1);
        formApi?.reset();
        expect(getRoot().querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`)).toHaveLength(0);
        expectNoLeakedAttrs(getRoot());
    });

    it('Form 属性透传到文本输入框', () => {
        render(() => (
            <Form>
                <FormTagInput id="tags" field="tags" label="Tags" rules={[{ required: true, message: 'need tags' }]} />
            </Form>
        ));
        expect(getInput()).toHaveAttribute('id', 'tags');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'tags-label');
        expect(getInput()).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('textbox', { name: 'Tags' })).toBe(getInput());
        for (const attr of ['id', 'aria-labelledby', 'aria-required']) {
            expect(getRoot()).not.toHaveAttribute(attr);
        }
    });
});

describe('FormAutoComplete', () => {
    const data = ['semi', 'design'];
    const getRoot = () => document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`) as HTMLElement;
    const getInput = () => getRoot().querySelector('input') as HTMLInputElement;

    it('Form label 可聚焦并命名 input', () => {
        render(() => (
            <Form>
                <FormAutoComplete data={data} field="city" label="City" motion={false} />
            </Form>
        ));
        expect(screen.getByRole('combobox', { name: 'City' })).toBe(getInput());
        expect(document.querySelector('label')?.control).toBe(getInput());
    });

    it('formApi.reset 后再次为空', () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormAutoComplete data={data} field="name" motion={false} />
            </Form>
        ));
        fireEvent.input(getInput(), { target: { value: 'semi' } });
        expect(formApi?.getValue('name')).toBe('semi');
        formApi?.reset();
        expect(formApi?.getValue('name')).toBeUndefined();
        expect(getInput()).toHaveValue('');
    });

    it('未声明的属性落到根 div 上；Form 属性不进入 DOM，name 传给 input', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormAutoComplete name="city-name" title="tip" data={data} field="city" motion={false} />
            </Form>
        ));
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getInput()).toHaveAttribute('name', 'city-name');
        expect(getRoot()).not.toHaveAttribute('name');
        expectNoLeakedAttrs(getRoot());
    });
});

describe('FormCascader', () => {
    const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;
    const treeData = [
        { label: '北美洲', value: 'North America', key: 'na', children: [{ label: '美国', value: 'United States', key: 'us' }] },
        { label: '亚洲', value: 'Asia', key: 'asia', children: [{ label: '中国', value: 'China', key: 'cn' }] },
    ];
    const getTrigger = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
    const getSelection = () => document.querySelector(`.${prefixCls}-selection`) as HTMLElement;
    const getOption = (label: string) => screen.getByText(label, { selector: `.${prefixCls}-option-label > span` }).closest('li') as HTMLElement;

    it('formApi.reset 后为空，失焦时校验一次', async () => {
        let formApi: FormApi | undefined;
        const validate = vi.fn<() => string>(() => '');
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormCascader placeholder="pick" field="region" label="Region" treeData={treeData} trigger="blur" validator={validate} motion={false} />
            </Form>
        ));
        await userEvent.click(getSelection());
        await userEvent.click(getOption('北美洲'));
        await userEvent.click(getOption('美国'));
        expect(formApi?.getValue('region')).toEqual(['North America', 'United States']);
        expect(validate).toHaveBeenCalledTimes(1);
        await userEvent.click(getSelection());
        await userEvent.click(document.body);
        expect(validate).toHaveBeenCalledTimes(2);
        formApi?.reset();
        expect(formApi?.getValue('region')).toBeUndefined();
        expect(getSelection().textContent).toBe('pick');
        expectNoLeakedAttrs(getTrigger());
    });

    it('未声明的属性落在根元素上，Form 属性不出现在 DOM 中', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormCascader id="region" title="tip" field="region" treeData={treeData} motion={false} />
            </Form>
        ));
        expect(getTrigger()).toHaveAttribute('title', 'tip');
        expect(getTrigger()).toHaveAttribute('id', 'region');
        expectNoLeakedAttrs(getTrigger());
        expect(getTrigger()).not.toHaveAttribute('treedata');
    });
});

describe('FormTreeSelect', () => {
    const treeData = [
        { label: '北京', value: 'Beijing', key: 'bj' },
        { label: '上海', value: 'Shanghai', key: 'sh' },
    ];
    const getTrigger = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select`) as HTMLElement;
    const getSelection = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection`) as HTMLElement;
    const getNode = (label: string) => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option`)].find((node) => node.textContent === label) as HTMLElement;

    it('blur 校验与重置', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTreeSelect motion={false} defaultExpandAll field="region" rules={[{ required: true, message: 'required' }]} treeData={treeData} trigger="blur" />
            </Form>
        ));
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        await waitFor(() => expect(screen.getByText('required')).toBeInTheDocument());
        await userEvent.click(getTrigger());
        await userEvent.click(getNode('北京'));
        expect(formApi?.getValue('region')).toBe('Beijing');
        expect(getSelection()).toHaveTextContent('北京');
        formApi?.reset();
        expect(formApi?.getValue('region')).toBeUndefined();
        expect(getSelection()).not.toHaveTextContent('北京');
        expectNoLeakedAttrs(getTrigger());
    });
});

describe('FormDatePicker', () => {
    const dp = `${BASE_CLASS_PREFIX}-datepicker`;
    const getPopup = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover .${dp}`);
    const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;

    it('范围字段按 Label 取到 group，必填标在输入框上', () => {
        render(() => (
            <Form>
                <FormDatePicker type="dateRange" field="period" label="Period" motion={false} rules={[{ required: true, message: 'need period' }]} />
            </Form>
        ));
        expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument();
        const [start, end] = screen.getAllByRole('combobox');
        expect(start).toHaveAttribute('aria-required', 'true');
        expect(end).toHaveAttribute('aria-required', 'true');
    });

    it('校验失败后输入框带 aria-invalid', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormDatePicker field="day" label="Day" rules={[{ required: true, message: 'need day' }]} />
            </Form>
        ));
        await formApi?.validate().catch(() => undefined);
        expect(screen.getByRole('combobox', { name: 'Day' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('报告选中日期，formApi.reset 后恢复为空', async () => {
        let formApi: FormApi | undefined;
        const { container } = render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormDatePicker defaultPickerValue="2019-09-01" field="day" motion={false} />
            </Form>
        ));
        await userEvent.click(container.querySelector('input') as HTMLInputElement);
        await userEvent.click(getDay('2019-09-12'));
        expect(format(formApi?.getValue('day') as Date, 'yyyy-MM-dd')).toBe('2019-09-12');
        formApi?.reset();
        expect(formApi?.getValue('day')).toBeUndefined();
        expect(container.querySelector('input')).toHaveValue('');
    });

    it('在面板关闭时校验，而非输入框失焦时校验', async () => {
        const { container } = render(() => (
            <Form>
                <FormDatePicker field="day" motion={false} rules={[{ required: true, message: 'required' }]} trigger="blur" />
            </Form>
        ));
        const input = container.querySelector('input') as HTMLInputElement;
        await userEvent.click(input);
        expect(getPopup()).not.toBeNull();
        fireEvent.focusOut(input);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(screen.queryByText('required')).toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.getByText('required')).toBeInTheDocument());
    });

    it('inset 标签下 dateRange 的 group 名称指向渲染出的标签', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormDatePicker type="dateRange" field="range" label="区间" />
            </Form>
        ));
        const group = screen.getByRole('group', { name: '区间' });
        expect(document.getElementById(group.getAttribute('aria-labelledby') ?? '')).not.toBeNull();
    });
});

describe('FormTransfer', () => {
    const dataSource = [
        { label: 'Alice', value: 'a', key: 'a' },
        { label: 'Bob', value: 'b', key: 'b' },
        { label: 'Carol', value: 'c', key: 'c' },
    ];
    const selectedTexts = () => Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-transfer-right-item-text`)).map((item) => item.textContent);
    const pick = (name: string) => userEvent.click(within(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).getByText(name));
    const getRoot = () => document.querySelector(`.${BASE_CLASS_PREFIX}-transfer`) as HTMLElement;

    it('显示 initValue 的已选项并以 label 命名，Form 的 disabled 传给 Transfer，Form 属性不进入 DOM', () => {
        render(() => (
            <Form disabled labelPosition="inset">
                <FormTransfer dataSource={dataSource} field="members" initValue={['b']} label="Members" validateStatus="error" />
            </Form>
        ));
        expect(selectedTexts()).toEqual(['Bob']);
        expect(screen.getByRole('group', { name: 'Members' })).toBeInTheDocument();
        expect(getRoot()).toHaveClass(`${BASE_CLASS_PREFIX}-transfer-disabled`);
        expectNoLeakedAttrs(getRoot());
    });

    it('选择后 formApi 取值更新，onChange 末参是最新表单值，reset 回到 initValue', async () => {
        let formApi: FormApi | undefined;
        const onChange = vi.fn<(...args: unknown[]) => void>();
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTransfer dataSource={dataSource} field="members" initValue={['a']} onChange={onChange} />
            </Form>
        ));
        await pick('Carol');
        expect(formApi?.getValue('members')).toEqual(['a', 'c']);
        expect(selectedTexts()).toEqual(['Alice', 'Carol']);
        expect(onChange.mock.lastCall?.at(-1)).toEqual({ members: ['a', 'c'] });
        formApi?.setValue('members', ['b']);
        expect(selectedTexts()).toEqual(['Bob']);
        formApi?.reset();
        expect(selectedTexts()).toEqual(['Alice']);
        expect(formApi?.getValue('members')).toEqual(['a']);
    });

    it('没有 initValue 时 reset 回到空', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTransfer dataSource={dataSource} field="members" />
            </Form>
        ));
        await pick('Alice');
        expect(selectedTexts()).toEqual(['Alice']);
        formApi?.reset();
        expect(formApi?.getValue('members')).toBeUndefined();
        expect(selectedTexts()).toEqual([]);
    });

    it('校验失败时显示错误信息，选择后错误消失', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormTransfer dataSource={dataSource} field="members" label="Members" rules={[{ required: true, type: 'array', message: '请选择成员' }]} />
            </Form>
        ));
        await formApi?.validate().catch(() => undefined);
        expect(await screen.findByText('请选择成员')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Members' })).toHaveAttribute('aria-invalid', 'true');
        await pick('Alice');
        await waitFor(() => expect(screen.queryByText('请选择成员')).toBeNull());
    });
});

describe('FormUpload', () => {
    it('以 fileList 为字段值，formApi.setValue 更新文件列表', () => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)}>
                <FormUpload action="https://semi.design/upload" field="files" label="Files" initValue={[{ uid: '1', name: 'a.png', status: 'success', url: '' }]} />
            </Form>
        ));
        expect(screen.getByText('a.png')).toBeInTheDocument();
        formApi?.setValue('files', [{ uid: '2', name: 'b.png', status: 'success', url: '' }]);
        expect(screen.queryByText('a.png')).toBeNull();
        expect(screen.getByText('b.png')).toBeInTheDocument();
    });
});
