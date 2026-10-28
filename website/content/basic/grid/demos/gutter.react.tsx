import { Col, Row } from '@fibrae/semi-ui-react';

export default function GridDemo() {
    return (
        <div className="grid grid-gutter">
            <p>horizontal</p>
            <hr />
            <Row gutter={16}>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
            </Row>
            <p>vertical</p>
            <hr />
            <Row gutter={[16, 24]}>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
                <Col span={6}>
                    <div className="col-content">col-6</div>
                </Col>
            </Row>
        </div>
    );
}
