import { useState, useRef } from 'react';
import { Form, Modal, Button, Row, Col, type FormApi } from '@fibrae/semi-ui-react';

const message = '该项为必填项';

export default function FormDemo() {
    const [visible, setVisible] = useState(false);
    const formApiRef = useRef<FormApi | null>(null);

    const handleOk = () => {
        formApiRef.current
            ?.validate()
            .then((values) => {
                console.log(values);
            })
            .catch((errors) => {
                console.log(errors);
            });
    };

    return (
        <>
            <Button onClick={() => setVisible(true)}>打开弹窗</Button>
            <Modal title="新建" visible={visible} onOk={handleOk} style={{ width: 600 }} onCancel={() => setVisible(false)}>
                <Form
                    getFormApi={(api) => {
                        formApiRef.current = api;
                    }}
                >
                    <Row>
                        <Col span={5}>
                            <Form.Select field="region" label="国家/地区" placeholder="请选择" style={{ width: '100%' }} rules={[{ required: true, message }]}>
                                <Form.Select.Option value="China">中国</Form.Select.Option>
                                <Form.Select.Option value="US">美国</Form.Select.Option>
                                <Form.Select.Option value="Europe">欧洲</Form.Select.Option>
                                <Form.Select.Option value="Japan">日本</Form.Select.Option>
                            </Form.Select>
                        </Col>
                        <Col span={15} offset={2}>
                            <Form.Input field="owner" label="业务执行人" trigger="blur" rules={[{ required: true, message }]} />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={5}>
                            <Form.Select field="area" label="投放区域" placeholder="请选择" style={{ width: '100%' }} rules={[{ required: true, message }]}>
                                <Form.Select.Option value="China">中国</Form.Select.Option>
                                <Form.Select.Option value="US">美国</Form.Select.Option>
                                <Form.Select.Option value="Europe">欧洲</Form.Select.Option>
                                <Form.Select.Option value="Japan">日本</Form.Select.Option>
                            </Form.Select>
                        </Col>
                        <Col span={15} offset={2}>
                            <Form.Input field="department" label="业务执行部门" trigger="blur" rules={[{ required: true, message }]} />
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
