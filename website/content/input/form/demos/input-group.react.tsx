import { Form, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => console.log(values)} labelPosition="top" style={{ width: 400 }}>
            <Form.InputGroup label={{ text: <span>手机号码</span>, required: true }} labelPosition="top">
                <Form.Select style={{ width: 150 }} field="phonePrefix" initValue="+86" rules={[{ required: true }]} showClear>
                    <Form.Select.Option value="+1">美国+1</Form.Select.Option>
                    <Form.Select.Option value="+852">香港+852</Form.Select.Option>
                    <Form.Select.Option value="+86">中国+86</Form.Select.Option>
                    <Form.Select.Option value="+81">日本+81</Form.Select.Option>
                </Form.Select>
                <Form.Input initValue="18912345678" style={{ width: 250 }} field="phoneNumber" rules={[{ required: true }]} showClear />
            </Form.InputGroup>
            <Form.Input field="姓名" trigger="blur" initValue="Semi" />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
