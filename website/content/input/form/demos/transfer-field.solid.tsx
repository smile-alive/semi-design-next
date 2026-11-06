import { Form, FormTransfer, type RuleItem } from '@fibrae/semi-ui-solid';

const dataSource = Array.from({ length: 6 }, (_, index) => ({ label: `成员 ${index + 1}`, value: index + 1, key: index + 1 }));
const initValues = { members: [1, 3] };
const rules: RuleItem[] = [{ required: true, type: 'array', message: '请至少选择一名成员' }];

export default function FormDemo() {
    return (
        <Form initValues={initValues}>
            <FormTransfer dataSource={dataSource} field="members" label="项目成员" rules={rules} style={{ width: '480px', height: '320px' }} />
        </Form>
    );
}
