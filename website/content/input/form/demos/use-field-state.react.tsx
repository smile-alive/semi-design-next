import { useFieldState, Form } from '@fibrae/semi-ui-react';

function ComponentUsingFieldState({ field }: { field: string }) {
    const fieldState = useFieldState(field);
    return (
        <div>
            <span>【{field}】FieldState read by 【useFieldState】：</span>
            <code>{JSON.stringify(fieldState)}</code>
        </div>
    );
}

export default function FormDemo() {
    return (
        <Form layout="horizontal">
            <div style={{ width: 400 }}>
                <Form.Input field="name" initValue="mike" />
                <Form.Input field="country" initValue="china" />
            </div>
            <div style={{ width: 500, marginTop: 30 }}>
                <ComponentUsingFieldState field="name" />
                <ComponentUsingFieldState field="country" />
            </div>
        </Form>
    );
}
