import { Button, Form, FormInput } from '@fibrae/semi-ui-solid';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FormValues {
    name?: string;
    sex?: string;
}

const asyncValidate = (values: FormValues) =>
    sleep(2000).then(() => {
        const errors: FormValues = {};
        if (values.name !== 'mike') {
            errors.name = 'you must name mike';
        }
        if (values.sex !== 'female') {
            errors.sex = 'sex not valid';
        }
        return errors;
    });

export default function FormDemo() {
    return (
        <Form validator={asyncValidate} layout="horizontal">
            <FormInput field="name" trigger="blur" />
            <FormInput field="familyName[0].before" trigger="blur" />
            <FormInput field="familyName[1]" trigger="blur" />
            <FormInput field="sex" trigger="blur" />
            <div style={{ display: 'flex', 'align-items': 'flex-end' }}>
                <Button type="primary" htmlType="submit" class="btn-margin-right">
                    Submit
                </Button>
                <Button htmlType="reset">reset</Button>
            </div>
        </Form>
    );
}
