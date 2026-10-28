import { Button, Form, FormCheckbox, FormInput, Toast } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    const handleSubmit = (values: Record<string, unknown>) => {
        console.log(values);
        Toast.info('表单已提交');
    };
    return (
        <Form onSubmit={(values) => handleSubmit(values)} style={{ width: '400px' }}>
            {(form) => (
                <>
                    <FormInput field="phone" label="PhoneNumber" style={{ width: '100%' }} placeholder="Enter your phone number" />
                    <FormInput field="password" label="Password" style={{ width: '100%' }} placeholder="Enter your password" />
                    <FormCheckbox field="agree" noLabel>
                        I have read and agree to the terms of service
                    </FormCheckbox>
                    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                        <p>
                            <span>Or</span>
                            <Button theme="borderless" style={{ color: 'var(--semi-color-primary)', 'margin-left': '10px', cursor: 'pointer' }}>
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
