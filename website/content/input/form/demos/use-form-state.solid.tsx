import { Form, FormInput, useFormState } from '@fibrae/semi-ui-solid';

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState())}</code>
        </pre>
    );
}

export default function FormDemo() {
    return (
        <Form>
            <FormInput field="name" initValue="mike" />
            <h5>FormState read by 【useFormState】：</h5>
            <ComponentUsingFormState />
        </Form>
    );
}
