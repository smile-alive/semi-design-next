import { Form, Button } from '@fibrae/semi-ui-react';

interface FormValues {
    name?: string;
    sex?: string;
}

const syncValidate = (values: FormValues) => {
    const errors: Record<string, unknown> = {};
    if (values.name !== 'mike') {
        errors.name = 'you must name mike';
    }
    if (values.sex !== 'female') {
        errors.sex = 'must be woman';
    }
    errors.familyName = [{ before: 'before error balabala ', after: 'after error balabala' }, 'familyName[1] error balabala'];
    return errors;
};

export default function FormDemo() {
    return (
        <Form validator={syncValidate} layout="horizontal">
            <Form.Input field="name" trigger="blur" />
            <Form.Input field="familyName[0].before" trigger="blur" />
            <Form.Input field="familyName[0].after" trigger="blur" />
            <Form.Input field="familyName[1]" trigger="blur" />
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button type="primary" htmlType="submit" className="btn-margin-right">
                    Submit
                </Button>
                <Button htmlType="reset">reset</Button>
            </div>
        </Form>
    );
}
