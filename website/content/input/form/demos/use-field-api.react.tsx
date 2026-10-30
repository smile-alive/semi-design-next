import { useFieldApi, Form, Button } from '@fibrae/semi-ui-react';

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
            <Form.Input field="name" initValue="mike" />
            <ComponentUsingFieldApi />
        </Form>
    );
}
