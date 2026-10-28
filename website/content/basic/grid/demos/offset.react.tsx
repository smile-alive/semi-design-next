import { Col, Row } from '@fibrae/semi-ui-react';

export default function GridDemo() {
    return (
        <div className="grid">
            <Row>
                <Col span={8}>
                    <div className="col-content">col-8</div>
                </Col>
                <Col span={8} offset={8}>
                    <div className="col-content">col-8</div>
                </Col>
            </Row>
            <br />
            <Row>
                <Col span={6} offset={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6} offset={6}>
                    <div className="col-content">col-6</div>
                </Col>
            </Row>
            <br />
            <Row>
                <Col span={12} offset={6}>
                    <div className="col-content">col-12</div>
                </Col>
            </Row>
        </div>
    );
}
