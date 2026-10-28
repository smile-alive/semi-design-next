import { Form, FormInput, FormSelect } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form wrapperCol={{ span: 20 }} labelCol={{ span: 2 }} labelPosition="left" labelAlign="right">
            <FormInput field="name" style={{ width: '250px' }} label="姓名" trigger="blur" placeholder="请输入姓名" />
            <FormSelect field="role" label="角色" placeholder="请选择角色" style={{ width: '250px' }}>
                <FormSelect.Option value="operate">运营</FormSelect.Option>
                <FormSelect.Option value="rd">开发</FormSelect.Option>
                <FormSelect.Option value="pm">产品</FormSelect.Option>
                <FormSelect.Option value="ued">设计</FormSelect.Option>
            </FormSelect>
        </Form>
    );
}
