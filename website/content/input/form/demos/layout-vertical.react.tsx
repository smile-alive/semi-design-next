import { Form, Toast, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const handleSubmit = (values: Record<string, unknown>) => {
        console.log(values);
        Toast.info('表单已提交');
    };
    return (
        <Form onSubmit={(values) => handleSubmit(values)} style={{ width: 400 }}>
            {({ values }) => (
                <>
                    <Form.Input field="phone" label="PhoneNumber" style={{ width: '100%' }} placeholder="Enter your phone number" />
                    <Form.Input field="password" label="Password" style={{ width: '100%' }} placeholder="Enter your password" />
                    <Form.Checkbox field="agree" noLabel>
                        I have read and agree to the terms of service
                    </Form.Checkbox>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p>
                            <span>Or</span>
                            <Button theme="borderless" style={{ color: 'var(--semi-color-primary)', marginLeft: 10, cursor: 'pointer' }}>
                                Sign up
                            </Button>
                        </p>
                        <Button disabled={!values.agree} htmlType="submit" type="tertiary">
                            Log in
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
