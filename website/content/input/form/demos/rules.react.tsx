import { Form, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const initValues = {
        name: 'semi',
        shortcut: 'se',
    };

    const style = { width: '100%' };

    const { Input } = Form;

    return (
        <Form initValues={initValues}>
            <Input
                field="name"
                style={style}
                trigger="blur"
                rules={[
                    { required: true, message: 'required error' },
                    { type: 'string', message: 'type error' },
                    { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
                    {
                        validator: (_rule, value) => Boolean(value && value.startsWith('se')),
                        message: 'should startsWith se',
                    },
                ]}
            />
            <Input
                field="shortcut"
                style={style}
                stopValidateWithError
                rules={[
                    { required: true, message: 'required error' },
                    { type: 'string', message: 'type error' },
                    { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
                    {
                        validator: (_rule, value) => Boolean(value && value.startsWith('se')),
                        message: 'should startsWith se',
                    },
                ]}
            />
            <Button htmlType="submit">提交</Button>
        </Form>
    );
}
