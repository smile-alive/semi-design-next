import { Form, FormInput } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form layout="horizontal">
            <FormInput field="phone" label="PhoneNumber" placeholder="Enter your phone number" />
            <FormInput field="password" label="Password" placeholder="Enter your password" />
        </Form>
    );
}
