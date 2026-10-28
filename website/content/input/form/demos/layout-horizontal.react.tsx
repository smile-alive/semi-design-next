import { Form } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form layout="horizontal">
            <Form.Input field="phone" label="PhoneNumber" placeholder="Enter your phone number" />
            <Form.Input field="password" label="Password" placeholder="Enter your password" />
        </Form>
    );
}
