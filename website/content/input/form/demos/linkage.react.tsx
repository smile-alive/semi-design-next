import { useRef } from 'react';
import { Form, FormInput, FormSelect, Button, Row, type FormHandle } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const formRef = useRef<FormHandle>(null);

    const handleSelectChange = (value: unknown) => {
        const text = value === 'male' ? 'Hi male' : 'Hi female!';
        formRef.current?.formApi.setValue('Note', text);
    };

    return (
        <Form ref={formRef} onValueChange={(values) => console.log(values)} style={{ width: 250 }}>
            <span>Note will change after Sex select</span>
            <FormInput field="Note" style={{ width: 250 }} />
            <FormSelect field="Sex" onChange={handleSelectChange} style={{ width: 250 }}>
                <FormSelect.Option value="female">female</FormSelect.Option>
                <FormSelect.Option value="male">male</FormSelect.Option>
            </FormSelect>
            <Row>
                <Button type="primary" htmlType="submit" className="btn-margin-right">
                    Submit
                </Button>
                <Button htmlType="reset">reset</Button>
            </Row>
        </Form>
    );
}
