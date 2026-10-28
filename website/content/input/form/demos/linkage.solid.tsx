import { Button, Form, FormInput, FormSelect, Row, type FormApi } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    let formApi: FormApi | undefined;

    const handleSelectChange = (value: unknown) => {
        const text = value === 'male' ? 'Hi male' : 'Hi female!';
        formApi?.setValue('Note', text);
    };

    return (
        <Form getFormApi={(api) => (formApi = api)} onValueChange={(values) => console.log(values)} style={{ width: '250px' }}>
            <span>Note will change after Sex select</span>
            <FormInput field="Note" style={{ width: '250px' }} />
            <FormSelect field="Sex" onChange={handleSelectChange} style={{ width: '250px' }}>
                <FormSelect.Option value="female">female</FormSelect.Option>
                <FormSelect.Option value="male">male</FormSelect.Option>
            </FormSelect>
            <Row>
                <Button type="primary" htmlType="submit" class="btn-margin-right">
                    Submit
                </Button>
                <Button htmlType="reset">reset</Button>
            </Row>
        </Form>
    );
}
