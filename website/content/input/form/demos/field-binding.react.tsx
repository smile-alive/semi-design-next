import { Form, Toast, Row, Col, TextArea } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form onSubmit={(values) => Toast.info({ content: JSON.stringify(values) })}>
            {({ formState }) => (
                <Row>
                    <Col span={12}>
                        <Form.Input field="username" aria-label="username" placeholder="请尝试输入值" />
                        <Form.Input field="user[0]" aria-label="user[0]" placeholder="请尝试输入值" />
                        <Form.Input field="siblings.1" aria-label="siblings.1" placeholder="请尝试输入值" />
                        <Form.Input field="siblings['2']" aria-label="siblings['2']" placeholder="请尝试输入值" />
                        <Form.Input field="parents[0].name" aria-label="parents[0].name" placeholder="请尝试输入值" />
                        <Form.Input field="parents[1]['name']" aria-label="parents[1]['name']" placeholder="请尝试输入值" />
                    </Col>
                    <Col span={10} offset={1} style={{ marginTop: 12 }}>
                        <Form.Label text="FormState实时映射值：" />
                        <TextArea aria-label="FormState实时映射值" value={JSON.stringify(formState.values)} />
                    </Col>
                </Row>
            )}
        </Form>
    );
}
