import { Button, Form, FormInput, useFormApi } from '@fibrae/semi-ui-solid';

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
            <FormInput field="name" initValue="mike" />
            <ComponentUsingFormApi />
        </Form>
    );
}
