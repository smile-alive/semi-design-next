import { Form, type FormFCChild } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const fields = ({ formState }: FormFCChild) => (
        <>
            <Form.Input field="Role" style={{ width: 176 }} />
            <Form.Input field="UserName" style={{ width: 80 }} />
            <Form.Input field="Password" style={{ width: 176 }} />
            <code style={{ marginTop: 24 }}>{JSON.stringify(formState)}</code>
        </>
    );
    return <Form component={fields} layout="horizontal" onValueChange={(values) => console.log(values)} />;
}
