import { createSignal } from 'solid-js';
import { Button, Col, Form, FormInput, FormSelect, Modal, Row, type FormApi } from '@fibrae/semi-ui-solid';

const message = '该项为必填项';

export default function FormDemo() {
    const [visible, setVisible] = createSignal(false);
    let formApi: FormApi | undefined;

    const handleOk = () => {
        formApi
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
            <Modal title="新建" visible={visible()} onOk={handleOk} style={{ width: '600px' }} onCancel={() => setVisible(false)}>
                <Form getFormApi={(api) => (formApi = api)}>
                    <Row>
                        <Col span={5}>
                            <FormSelect field="region" label="国家/地区" placeholder="请选择" style={{ width: '100%' }} rules={[{ required: true, message }]}>
                                <FormSelect.Option value="China">中国</FormSelect.Option>
                                <FormSelect.Option value="US">美国</FormSelect.Option>
                                <FormSelect.Option value="Europe">欧洲</FormSelect.Option>
                                <FormSelect.Option value="Japan">日本</FormSelect.Option>
                            </FormSelect>
                        </Col>
                        <Col span={15} offset={2}>
                            <FormInput field="owner" label="业务执行人" trigger="blur" rules={[{ required: true, message }]} />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={5}>
                            <FormSelect field="area" label="投放区域" placeholder="请选择" style={{ width: '100%' }} rules={[{ required: true, message }]}>
                                <FormSelect.Option value="China">中国</FormSelect.Option>
                                <FormSelect.Option value="US">美国</FormSelect.Option>
                                <FormSelect.Option value="Europe">欧洲</FormSelect.Option>
                                <FormSelect.Option value="Japan">日本</FormSelect.Option>
                            </FormSelect>
                        </Col>
                        <Col span={15} offset={2}>
                            <FormInput field="department" label="业务执行部门" trigger="blur" rules={[{ required: true, message }]} />
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
}
