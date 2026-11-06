import { Form, FormInput, FormInputGroup, FormSelect, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => console.log(values)} labelPosition="top" style={{ width: 400 }}>
            <FormInputGroup label={{ text: <span>手机号码</span>, required: true }} labelPosition="top">
                <FormSelect style={{ width: 150 }} field="phonePrefix" initValue="+86" rules={[{ required: true }]} showClear>
                    <FormSelect.Option value="+1">美国+1</FormSelect.Option>
                    <FormSelect.Option value="+852">香港+852</FormSelect.Option>
                    <FormSelect.Option value="+86">中国+86</FormSelect.Option>
                    <FormSelect.Option value="+81">日本+81</FormSelect.Option>
                </FormSelect>
                <FormInput initValue="18912345678" style={{ width: 250 }} field="phoneNumber" rules={[{ required: true }]} showClear />
            </FormInputGroup>
            <FormInput field="姓名" trigger="blur" initValue="Semi" />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
