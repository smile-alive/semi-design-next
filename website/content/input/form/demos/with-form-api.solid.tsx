import { Button, Form, FormInput } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form>
            {(form) => (
                <>
                    <FormInput field="name" initValue="semi" />
                    <FormInput field="familyName" initValue="design" />
                    <Button htmlType="submit" style={{ 'margin-right': '4px' }}>
                        submit
                    </Button>
                    <Button onClick={() => form.formApi.setValue('name', Math.random())}>Click Me!!! ChangeName By【formApi】</Button>
                </>
            )}
        </Form>
    );
}
