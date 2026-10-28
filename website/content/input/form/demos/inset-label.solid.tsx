import { Form, FormDatePicker, FormInput, FormSelect } from '@fibrae/semi-ui-solid';

const today = new Date(2024, 4, 6, 12);

export default function FormDemo() {
    return (
        <Form labelPosition="inset" layout="horizontal">
            <FormInput field="name" label="姓名" trigger="blur" style={{ width: '250px' }} placeholder="请输入姓名" initValue="semi" />
            <FormSelect field="role" label="角色" style={{ width: '250px' }} initValue="rd">
                <FormSelect.Option value="operate">运营</FormSelect.Option>
                <FormSelect.Option value="rd">开发</FormSelect.Option>
                <FormSelect.Option value="pm">产品</FormSelect.Option>
                <FormSelect.Option value="ued">设计</FormSelect.Option>
            </FormSelect>
            <FormDatePicker field="date" label="开始日期" style={{ width: '250px' }} initValue={today} />
        </Form>
    );
}
