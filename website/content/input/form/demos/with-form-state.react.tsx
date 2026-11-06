import { withFormState, Form, FormInput, type FormState } from '@fibrae/semi-ui-react';

function SomeComponentInsideForm(props: { formState: FormState }) {
    return <code>{JSON.stringify(props.formState)}</code>;
}
const ComponentWithFormState = withFormState(SomeComponentInsideForm);

export default function FormDemo() {
    return (
        <Form>
            <FormInput field="name" initValue="semi" />
            <FormInput field="familyName" initValue="design" />
            <ComponentWithFormState />
        </Form>
    );
}
