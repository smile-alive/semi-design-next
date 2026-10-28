import { type ComponentProps, splitProps } from 'solid-js';
import { Form, useFormState, withField } from '@fibrae/semi-ui-solid';

// validateStatus stays off the DOM; a native input fires change on blur, so the field listens to input instead
function HtmlInput(props: ComponentProps<'input'> & { validateStatus?: string }) {
    const [, rest] = splitProps(props, ['validateStatus', 'value']);
    return <input {...rest} value={props.value ?? ''} />;
}

const CustomInput = withField(HtmlInput, {
    valueKey: 'value',
    onKeyChangeFnName: 'onInput',
    valuePath: 'target.value',
});

function ComponentUsingFormState() {
    const formState = useFormState();
    return (
        <pre>
            <code>{JSON.stringify(formState())}</code>
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
