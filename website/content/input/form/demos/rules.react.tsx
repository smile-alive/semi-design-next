import { Form, FormInput, Button, type RuleItem } from '@fibrae/semi-ui-react';

const initValues = {
    name: 'semi',
    shortcut: 'se',
};

const style = { width: '100%' };

const rules: RuleItem[] = [
    { required: true, message: 'required error' },
    { type: 'string', message: 'type error' },
    { validator: (value) => value === 'semi', message: 'should be semi' },
    {
        validator: (value) => Boolean(value && value.startsWith('se')),
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
