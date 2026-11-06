import { Form, FormInput, type FormFCChild } from '@fibrae/semi-ui-react';

const fields = (form: FormFCChild) => (
    <>
        <FormInput field="Role" style={{ width: 176 }} />
        <FormInput field="UserName" style={{ width: 80 }} />
        <FormInput field="Password" style={{ width: 176 }} />
        <code style={{ marginBlockStart: 24 }}>{JSON.stringify(form.formState)}</code>
    </>
);

export default function FormDemo() {
    return <Form component={fields} layout="horizontal" onValueChange={(values) => console.log(values)} />;
}
