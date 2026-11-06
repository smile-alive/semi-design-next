import { useFieldState, Form, FormInput } from '@fibrae/semi-ui-react';

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
                <FormInput field="name" initValue="mike" />
                <FormInput field="country" initValue="china" />
            </div>
            <div style={{ width: 500, marginBlockStart: 30 }}>
                <ComponentUsingFieldState field="name" />
                <ComponentUsingFieldState field="country" />
            </div>
        </Form>
    );
}
