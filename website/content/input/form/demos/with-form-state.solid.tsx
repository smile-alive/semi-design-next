import { Form, FormInput } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form>
            {(form) => (
                <>
                    <FormInput field="name" initValue="semi" />
                    <FormInput field="familyName" initValue="design" />
                    <code>{JSON.stringify(form.formState)}</code>
                </>
            )}
        </Form>
    );
}
