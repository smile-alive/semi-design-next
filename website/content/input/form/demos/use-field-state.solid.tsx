import { Form, FormInput, useFieldState } from '@fibrae/semi-ui-solid';

function ComponentUsingFieldState(props: { field: string }) {
    const fieldState = useFieldState(() => props.field);
    return (
        <div>
            <span>【{props.field}】FieldState read by 【useFieldState】：</span>
            <code>{JSON.stringify(fieldState())}</code>
        </div>
    );
}

export default function FormDemo() {
    return (
        <Form layout="horizontal">
            <div style={{ width: '400px' }}>
                <FormInput field="name" initValue="mike" />
                <FormInput field="country" initValue="china" />
            </div>
            <div style={{ width: '500px', 'margin-top': '30px' }}>
                <ComponentUsingFieldState field="name" />
                <ComponentUsingFieldState field="country" />
            </div>
        </Form>
    );
}
