import { Form } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form wrapperCol={{ span: 20 }} labelCol={{ span: 2 }} labelPosition="left" labelAlign="right">
            <Form.Input field="name" style={{ width: 250 }} label="姓名" trigger="blur" placeholder="请输入姓名" />
            <Form.Select field="role" label="角色" placeholder="请选择角色" style={{ width: 250 }}>
                <Form.Select.Option value="operate">运营</Form.Select.Option>
                <Form.Select.Option value="rd">开发</Form.Select.Option>
                <Form.Select.Option value="pm">产品</Form.Select.Option>
                <Form.Select.Option value="ued">设计</Form.Select.Option>
            </Form.Select>
        </Form>
    );
}
