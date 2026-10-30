import { useFormApi, Form, Button } from '@fibrae/semi-ui-react';

function ComponentUsingFormApi() {
    const formApi = useFormApi();
    const change = () => {
        formApi.setValue('name', Math.random());
    };
    return <Button onClick={change}>ChangeName By【formApi】</Button>;
}

export default function FormDemo() {
    return (
        <Form>
            <Form.Input field="name" initValue="mike" />
            <ComponentUsingFormApi />
        </Form>
    );
}
