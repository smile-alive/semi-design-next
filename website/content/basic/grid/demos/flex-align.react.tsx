import { Col, Row } from '@fibrae/semi-ui-react';

export default function GridDemo() {
    return (
        <div className="grid grid-flex">
            <p>Align Top</p>
            <Row type="flex" justify="center" align="top">
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

            <p>Align Center</p>
            <Row type="flex" justify="space-around" align="middle">
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

            <p>Align Bottom</p>
            <Row type="flex" justify="space-between" align="bottom">
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
