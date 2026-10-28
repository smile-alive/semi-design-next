import { Col, Form, FormInput, Row, TextArea, Toast } from '@fibrae/semi-ui-solid';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => Toast.info({ content: JSON.stringify(values) })}>
            {(form) => (
                <Row>
                    <Col span={12}>
                        <FormInput field="username" aria-label="username" placeholder="请尝试输入值" />
                        <FormInput field="user[0]" aria-label="user[0]" placeholder="请尝试输入值" />
                        <FormInput field="siblings.1" aria-label="siblings.1" placeholder="请尝试输入值" />
                        <FormInput field="siblings['2']" aria-label="siblings['2']" placeholder="请尝试输入值" />
                        <FormInput field="parents[0].name" aria-label="parents[0].name" placeholder="请尝试输入值" />
                        <FormInput field="parents[1]['name']" aria-label="parents[1]['name']" placeholder="请尝试输入值" />
                    </Col>
                    <Col span={10} offset={1} style={{ 'margin-top': '12px' }}>
                        <Form.Label text="FormState实时映射值：" />
                        <TextArea aria-label="FormState实时映射值" value={JSON.stringify(form.formState.values)} />
                    </Col>
                </Row>
            )}
        </Form>
    );
}
