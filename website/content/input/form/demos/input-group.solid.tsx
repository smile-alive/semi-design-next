import { Button, Form, FormInput, FormSelect } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => console.log(values)} labelPosition="top" style={{ width: '400px' }}>
            <Form.InputGroup label={{ text: <span>手机号码</span>, required: true }} labelPosition="top">
                <FormSelect style={{ width: '150px' }} field="phonePrefix" initValue="+86" rules={[{ required: true }]} showClear>
                    <FormSelect.Option value="+1">美国+1</FormSelect.Option>
                    <FormSelect.Option value="+852">香港+852</FormSelect.Option>
                    <FormSelect.Option value="+86">中国+86</FormSelect.Option>
                    <FormSelect.Option value="+81">日本+81</FormSelect.Option>
                </FormSelect>
                <FormInput initValue="18912345678" style={{ width: '250px' }} field="phoneNumber" rules={[{ required: true }]} showClear />
            </Form.InputGroup>
            <FormInput field="姓名" trigger="blur" initValue="Semi" />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
