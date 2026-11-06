import { useState } from 'react';
import { Form, FormCheckbox, FormCheckboxGroup, FormInput, FormInputNumber, FormLabel, FormRadio, FormRadioGroup, FormSelect, FormSwitch, Select, type FormProps } from '@fibrae/semi-ui-react';

const rules = [
    { required: true, message: 'required error' },
    { type: 'string' as const, message: 'type error' },
    { validator: (value: unknown) => value === 'semi', message: 'should be semi' },
];

export default function FormDemo() {
    const [labelPosition, setLabelPosition] = useState<FormProps['labelPosition']>('left');
    const [labelAlign, setLabelAlign] = useState<FormProps['labelAlign']>('left');
    const labelWidth = labelPosition === 'left' ? '180px' : 'auto';

    return (
        <>
            <div style={{ borderBlockEnd: '1px solid var(--semi-color-border)', paddingBlockEnd: 12 }}>
                <FormLabel style={{ marginInlineStart: 10 }}>切换Label位置:</FormLabel>
                <Select onChange={setLabelPosition} value={labelPosition} aria-label="labelPosition" style={{ width: 200 }} prefix="labelPosition">
                    <Select.Option value="top">top</Select.Option>
                    <Select.Option value="left">left</Select.Option>
                </Select>
                <FormLabel style={{ marginInlineStart: 10 }}>切换Label文本对齐方向:</FormLabel>
                <Select onChange={setLabelAlign} value={labelAlign} aria-label="labelAlign" style={{ width: 200 }} prefix="labelAlign">
                    <Select.Option value="left">left</Select.Option>
                    <Select.Option value="right">right</Select.Option>
                </Select>
            </div>
            <Form labelPosition={labelPosition} labelWidth={labelWidth} labelAlign={labelAlign} key={`${labelPosition}${labelAlign}`} style={{ padding: '10px', width: 600 }}>
                <FormInput field="input" label="手机号码" trigger="blur" style={{ width: 200 }} rules={rules} />
                <FormSwitch label="是否同意" field="agree" />
                <FormInputNumber field="price" label="价格" style={{ width: 200 }} />
                <FormSelect label="姓名" field="name" style={{ width: 200 }}>
                    <FormSelect.Option value="mike">mike</FormSelect.Option>
                    <FormSelect.Option value="jane">jane</FormSelect.Option>
                    <FormSelect.Option value="kate">kate</FormSelect.Option>
                </FormSelect>
                <FormCheckboxGroup label="角色" field="role" direction="horizontal">
                    <FormCheckbox value="admin">admin</FormCheckbox>
                    <FormCheckbox value="user">user</FormCheckbox>
                    <FormCheckbox value="guest">guest</FormCheckbox>
                    <FormCheckbox value="root">root</FormCheckbox>
                </FormCheckboxGroup>
                <FormRadioGroup field="性别">
                    <FormRadio value="1">man</FormRadio>
                    <FormRadio value="2">woman</FormRadio>
                </FormRadioGroup>
            </Form>
        </>
    );
}
