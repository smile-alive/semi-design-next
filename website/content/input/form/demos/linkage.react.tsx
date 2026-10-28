import { useRef } from 'react';
import { Form, Button, Row, type FormHandle } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    const formRef = useRef<FormHandle>(null);

    const handleSelectChange = (value: unknown) => {
        let text = value === 'male' ? 'Hi male' : 'Hi female!';
        formRef.current?.formApi.setValue('Note', text);
    };

    return (
        <Form ref={formRef} onValueChange={(values) => console.log(values)} style={{ width: 250 }}>
            <span>Note will change after Sex select</span>
            <Form.Input field="Note" style={{ width: 250 }} />
            <Form.Select field="Sex" onChange={handleSelectChange} style={{ width: 250 }}>
                <Form.Select.Option value="female">female</Form.Select.Option>
                <Form.Select.Option value="male">male</Form.Select.Option>
            </Form.Select>
            <Row>
                <Button type="primary" htmlType="submit" className="btn-margin-right">
                    Submit
                </Button>
                <Button htmlType="reset">reset</Button>
            </Row>
        </Form>
    );
}
