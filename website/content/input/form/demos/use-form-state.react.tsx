import { useFormState, Form } from '@fibrae/semi-ui-react';

const ComponentUsingFormState = () => {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState)}</code>
        </pre>
    );
};

export default function FormDemo() {
    return (
        <Form>
            <Form.Input field="name" initValue="mike" />
            <h5>FormState read by 【useFormState】：</h5>
            <ComponentUsingFormState />
        </Form>
    );
}
