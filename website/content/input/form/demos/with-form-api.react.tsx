import { withFormApi, Form, FormInput, Button, type FormApi } from '@fibrae/semi-ui-react';

function SomeComponetInsideForm(props: { formApi: FormApi }) {
    return (
        <Button
            onClick={() => {
                props.formApi.setValue('name', Math.random());
            }}
        >
            Click Me!!! ChangeName By【formApi】
        </Button>
    );
}
const ComponentWithFormApi = withFormApi(SomeComponetInsideForm);

export default function FormDemo() {
    return (
        <Form>
            <FormInput field="name" initValue="semi" />
            <FormInput field="familyName" initValue="design" />
            <Button htmlType="submit" style={{ marginInlineEnd: 4 }}>
                submit
            </Button>
            <ComponentWithFormApi />
        </Form>
    );
}
