import { Form } from '@fibrae/semi-ui-react';

const startDate = new Date(2019, 6, 23, 12);

export default function FormDemo() {
    return (
        <Form labelPosition="inset" layout="horizontal">
            <Form.Input field="name" label="姓名" trigger="blur" style={{ width: 250 }} placeholder="请输入姓名" initValue="semi" />
            <Form.Select field="role" label="角色" style={{ width: '250px' }} initValue="rd">
                <Form.Select.Option value="operate">运营</Form.Select.Option>
                <Form.Select.Option value="rd">开发</Form.Select.Option>
                <Form.Select.Option value="pm">产品</Form.Select.Option>
                <Form.Select.Option value="ued">设计</Form.Select.Option>
            </Form.Select>
            <Form.DatePicker field="date" label="开始日期" style={{ width: '250px' }} initValue={startDate} />
        </Form>
    );
}
