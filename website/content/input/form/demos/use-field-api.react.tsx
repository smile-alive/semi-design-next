import { useFieldApi, Form, FormInput, Button } from '@fibrae/semi-ui-react';

function ComponentUsingFieldApi() {
    const nameFieldApi = useFieldApi('name');
    const change = () => {
        nameFieldApi.setValue(Math.random());
    };
    return <Button onClick={change}>Click Me!!! changeNameBy【fieldApi】</Button>;
}

export default function FormDemo() {
    return (
        <Form>
            <FormInput field="name" initValue="mike" />
            <ComponentUsingFieldApi />
        </Form>
    );
}
