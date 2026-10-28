import { Form } from '@fibrae/semi-ui-react';

const roleOptions = [
    { label: '管理员', value: 'admin' },
    { label: '访客', value: 'guest' },
];

export default function FormDemo() {
    return (
        <Form initValues={{ keep: 'admin', drop: 'admin' }}>
            {({ values }) => (
                <>
                    <Form.Select field="keep" label="设置了 allowEmpty" allowEmpty showClear optionList={roleOptions} style={{ width: 176 }} />
                    <Form.Select field="drop" label="未设置" showClear optionList={roleOptions} style={{ width: 176 }} />
                    <code>{JSON.stringify(Object.keys(values))}</code>
                </>
            )}
        </Form>
    );
}
