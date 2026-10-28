import { useState } from 'react';
import { Form, Select, type FormProps } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const [labelPosition, setLabelPosition] = useState<FormProps['labelPosition']>('left');
    const [labelAlign, setLabelAlign] = useState<FormProps['labelAlign']>('left');
    const labelWidth = labelPosition === 'left' ? '180px' : 'auto';

    return (
        <>
            <div style={{ borderBottom: '1px solid var(--semi-color-border)', paddingBottom: 12 }}>
                <Form.Label style={{ marginLeft: 10 }}>切换Label位置:</Form.Label>
                <Select onChange={setLabelPosition} value={labelPosition} style={{ width: 200 }} prefix="labelPosition">
                    <Select.Option value="top">top</Select.Option>
                    <Select.Option value="left">left</Select.Option>
                </Select>
                <Form.Label style={{ marginLeft: 10 }}>切换Label文本对齐方向:</Form.Label>
                <Select onChange={setLabelAlign} value={labelAlign} style={{ width: 200 }} prefix="labelAlign">
                    <Select.Option value="left">left</Select.Option>
                    <Select.Option value="right">right</Select.Option>
                </Select>
            </div>
            <Form labelPosition={labelPosition} labelWidth={labelWidth} labelAlign={labelAlign} key={`${labelPosition}${labelAlign}`} style={{ padding: '10px', width: 600 }}>
                <Form.Input
                    field="input"
                    label="手机号码"
                    trigger="blur"
                    style={{ width: 200 }}
                    rules={[
                        { required: true, message: 'required error' },
                        { type: 'string', message: 'type error' },
                        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
                    ]}
                />
                <Form.Switch label="是否同意" field="agree" />
                <Form.InputNumber field="price" label="价格" style={{ width: 200 }} />
                <Form.Select label="姓名" field="name" style={{ width: 200 }}>
                    <Form.Select.Option value="mike">mike</Form.Select.Option>
                    <Form.Select.Option value="jane">jane</Form.Select.Option>
                    <Form.Select.Option value="kate">kate</Form.Select.Option>
                </Form.Select>
                <Form.CheckboxGroup label="角色" field="role" direction="horizontal">
                    <Form.Checkbox value="admin">admin</Form.Checkbox>
                    <Form.Checkbox value="user">user</Form.Checkbox>
                    <Form.Checkbox value="guest">guest</Form.Checkbox>
                    <Form.Checkbox value="root">root</Form.Checkbox>
                </Form.CheckboxGroup>
                <Form.RadioGroup field="性别">
                    <Form.Radio value="1">man</Form.Radio>
                    <Form.Radio value="2">woman</Form.Radio>
                </Form.RadioGroup>
            </Form>
        </>
    );
}
