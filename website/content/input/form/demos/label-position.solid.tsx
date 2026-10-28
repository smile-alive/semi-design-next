import { createSignal } from 'solid-js';
import { Form, FormCheckbox, FormCheckboxGroup, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormSelect, FormSwitch, Select, type FormProps } from '@fibrae/semi-ui-solid';

const rules = [
    { required: true, message: 'required error' },
    { type: 'string' as const, message: 'type error' },
    { validator: (_rule: unknown, value: unknown) => value === 'semi', message: 'should be semi' },
];

export default function FormDemo() {
    const [labelPosition, setLabelPosition] = createSignal<FormProps['labelPosition']>('left');
    const [labelAlign, setLabelAlign] = createSignal<FormProps['labelAlign']>('left');
    const labelWidth = () => (labelPosition() === 'left' ? '180px' : 'auto');

    return (
        <>
            <div style={{ 'border-bottom': '1px solid var(--semi-color-border)', 'padding-bottom': '12px' }}>
                <Form.Label style={{ 'margin-left': '10px' }}>切换Label位置:</Form.Label>
                <Select onChange={(value) => setLabelPosition(value as FormProps['labelPosition'])} value={labelPosition()} style={{ width: '200px' }} prefix="labelPosition">
                    <Select.Option value="top">top</Select.Option>
                    <Select.Option value="left">left</Select.Option>
                </Select>
                <Form.Label style={{ 'margin-left': '10px' }}>切换Label文本对齐方向:</Form.Label>
                <Select onChange={(value) => setLabelAlign(value as FormProps['labelAlign'])} value={labelAlign()} style={{ width: '200px' }} prefix="labelAlign">
                    <Select.Option value="left">left</Select.Option>
                    <Select.Option value="right">right</Select.Option>
                </Select>
            </div>
            <Form labelPosition={labelPosition()} labelWidth={labelWidth()} labelAlign={labelAlign()} style={{ padding: '10px', width: '600px' }}>
                <FormInput field="input" label="手机号码" trigger="blur" style={{ width: '200px' }} rules={rules} />
                <FormSwitch label="是否同意" field="agree" />
                <FormInputNumber field="price" label="价格" style={{ width: '200px' }} />
                <FormSelect label="姓名" field="name" style={{ width: '200px' }}>
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
