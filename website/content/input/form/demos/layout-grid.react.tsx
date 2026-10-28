import { Form, Col, Row } from '@fibrae/semi-ui-react';

export default function FormDemo() {
    return (
        <Form labelPosition="top" style={{ padding: '10px' }}>
            <Row>
                <Col span={8}>
                    <Form.Input
                        field="nickName1"
                        label="用户名"
                        style={{ width: '250px' }}
                        trigger="blur"
                        rules={[
                            { required: true, message: 'required error' },
                            { type: 'string', message: 'type error' },
                            { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
                        ]}
                    />
                </Col>
                <Col span={8}>
                    <Form.DatePicker field="date1" label="有效日期" style={{ width: '250px' }} />
                </Col>
                <Col span={8}>
                    <Form.Select label="业务线" field="business1" style={{ width: '250px' }}>
                        <Form.Select.Option value="abc">Semi</Form.Select.Option>
                        <Form.Select.Option value="ulikeCam">轻颜相机</Form.Select.Option>
                        <Form.Select.Option value="toutiao">今日头条</Form.Select.Option>
                    </Form.Select>
                </Col>
            </Row>
            <Row>
                <Col span={6}>
                    <Form.Input
                        field="nickName2"
                        label="用户名"
                        style={{ width: '200px' }}
                        trigger="blur"
                        rules={[
                            { required: true, message: 'required error' },
                            { type: 'string', message: 'type error' },
                            { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
                        ]}
                    />
                </Col>
                <Col span={6}>
                    <Form.DatePicker field="date2" label="有效日期" style={{ width: '200px' }} />
                </Col>
                <Col span={6}>
                    <Form.Select label="业务线" field="business2" style={{ width: '200px' }}>
                        <Form.Select.Option value="abc">Semi</Form.Select.Option>
                        <Form.Select.Option value="ulikeCam">轻颜相机</Form.Select.Option>
                        <Form.Select.Option value="toutiao">今日头条</Form.Select.Option>
                    </Form.Select>
                </Col>
                <Col span={6}>
                    <Form.Select field="role" label="角色" style={{ width: '200px' }}>
                        <Form.Select.Option value="operate">运营</Form.Select.Option>
                        <Form.Select.Option value="rd">开发</Form.Select.Option>
                        <Form.Select.Option value="pm">产品</Form.Select.Option>
                        <Form.Select.Option value="ued">设计</Form.Select.Option>
                    </Form.Select>
                </Col>
            </Row>
        </Form>
    );
}
