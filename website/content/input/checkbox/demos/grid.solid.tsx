import { Checkbox, CheckboxGroup, Col, Row } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    return (
        <CheckboxGroup style={{ width: '100%' }} aria-label="CheckboxGroup 示例">
            <Row>
                <Col span={8}>
                    <Checkbox value="A">A</Checkbox>
                </Col>
                <Col span={8}>
                    <Checkbox value="B">B</Checkbox>
                </Col>
                <Col span={8}>
                    <Checkbox value="C">C</Checkbox>
                </Col>
                <Col span={8}>
                    <Checkbox value="D">D</Checkbox>
                </Col>
                <Col span={8}>
                    <Checkbox value="E">E</Checkbox>
                </Col>
            </Row>
        </CheckboxGroup>
    );
}
