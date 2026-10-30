import type { ComponentProps } from 'react';
import { withField, Form, useFormState } from '@fibrae/semi-ui-react';

function htmlInput(props: ComponentProps<'input'> & { validateStatus?: string }) {
    const value = props.value || '';
    const { validateStatus, ...rest } = props; // keep these props off the DOM
    return <input {...rest} value={value} />;
}
const CustomInput = withField(htmlInput, {
    valueKey: 'value',
    onKeyChangeFnName: 'onChange',
    valuePath: 'target.value',
});

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState)}</code>
        </pre>
    );
}

export default function FormDemo() {
    return (
        <Form>
            <CustomInput field="name" />
            <ComponentUsingFormState />
        </Form>
    );
}
