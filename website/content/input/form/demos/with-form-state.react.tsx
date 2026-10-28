import { withFormState, Form, type FormState } from '@fibrae/semi-ui-react';

const SomeComponentInsideForm = (props: { formState: FormState }) => <code>{JSON.stringify(props.formState)}</code>;
const ComponentWithFormState = withFormState(SomeComponentInsideForm);

export default function FormDemo() {
    return (
        <Form>
            <Form.Input field="name" initValue="semi" />
            <Form.Input field="familyName" initValue="design" />
            <ComponentWithFormState />
        </Form>
    );
}
