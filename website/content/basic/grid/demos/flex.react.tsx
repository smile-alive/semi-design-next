import { Col, Row } from '@fibrae/semi-ui-react';

export default function GridDemo() {
    return (
        <div className="grid">
            <p>sub-element align left</p>
            <Row justify="start">
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
            </Row>

            <p>sub-element align center</p>
            <Row justify="center">
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
            </Row>

            <p>sub-element align right</p>
            <Row justify="end">
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
            </Row>

            <p>sub-element monospaced arrangement</p>
            <Row justify="space-between">
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
            </Row>

            <p>sub-element align full</p>
            <Row justify="space-around">
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div className="col-content">col-4</div>
                </Col>
            </Row>
        </div>
    );
}
