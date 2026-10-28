import { Button, Form, FormInput } from '@fibrae/semi-ui-solid';

const initValues = {
    name: 'semi',
    shortcut: 'se',
};

const style = { width: '100%' };

const rules = [
    { required: true, message: 'required error' },
    { type: 'string' as const, message: 'type error' },
    { validator: (_rule: unknown, value: unknown) => value === 'semi', message: 'should be semi' },
    {
        validator: (_rule: unknown, value: unknown) => Boolean(typeof value === 'string' && value.startsWith('se')),
        message: 'should startsWith se',
    },
];

export default function FormDemo() {
    return (
        <Form initValues={initValues}>
            <FormInput field="name" style={style} trigger="blur" rules={rules} />
            <FormInput field="shortcut" style={style} stopValidateWithError rules={rules} />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
