import { Form, FormTransfer } from '@fibrae/semi-ui-solid';

const dataSource = Array.from({ length: 6 }, (_, index) => ({ label: `成员 ${index + 1}`, value: index + 1, key: index + 1 }));

export default function FormDemo() {
    return (
        <Form initValues={{ members: [1, 3] }}>
            <FormTransfer dataSource={dataSource} field="members" label="项目成员" rules={[{ required: true, type: 'array', message: '请至少选择一名成员' }]} style={{ width: '480px', height: '320px' }} />
        </Form>
    );
}
