import { withFormApi, Form, Button, type FormApi } from '@fibrae/semi-ui-react';

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
            <Form.Input field="name" initValue="semi" />
            <Form.Input field="familyName" initValue="design" />
            <Button htmlType="submit" style={{ marginRight: 4 }}>
                submit
            </Button>
            <ComponentWithFormApi />
        </Form>
    );
}
