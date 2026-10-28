import { Form, FormSelect } from '@fibrae/semi-ui-solid';

const initValues = { keep: 'admin', drop: 'admin' };

const roleOptions = [
    { label: '管理员', value: 'admin' },
    { label: '访客', value: 'guest' },
];

export default function FormDemo() {
    return (
        <Form initValues={initValues}>
            {(form) => (
                <>
                    <FormSelect field="keep" label="设置了 allowEmpty" allowEmpty showClear optionList={roleOptions} style={{ width: '176px' }} />
                    <FormSelect field="drop" label="未设置" showClear optionList={roleOptions} style={{ width: '176px' }} />
                    <code>{JSON.stringify(Object.keys(form.values))}</code>
                </>
            )}
        </Form>
    );
}
