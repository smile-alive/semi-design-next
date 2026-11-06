import { Form, FormCheckbox, FormInput, Toast, Button } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const handleSubmit = (values: Record<string, unknown>) => {
        console.log(values);
        Toast.info('表单已提交');
    };
    return (
        <Form onSubmit={(values) => handleSubmit(values)} style={{ width: 400 }}>
            {(form) => (
                <>
                    <FormInput field="phone" label="PhoneNumber" style={{ width: '100%' }} placeholder="Enter your phone number" />
                    <FormInput field="password" label="Password" style={{ width: '100%' }} placeholder="Enter your password" />
                    <FormCheckbox field="agree" noLabel>
                        I have read and agree to the terms of service
                    </FormCheckbox>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p>
                            <span>Or</span>
                            <Button theme="borderless" style={{ color: 'var(--semi-color-primary)', marginInlineStart: 10, cursor: 'pointer' }}>
                                Sign up
                            </Button>
                        </p>
                        <Button disabled={!form.values.agree} htmlType="submit" type="tertiary">
                            Log in
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
