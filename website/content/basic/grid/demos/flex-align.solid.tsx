import { Col, Row } from '@fibrae/semi-ui-solid';

export default function GridDemo() {
    return (
        <div class="grid grid-flex">
            <p>Align Top</p>
            <Row type="flex" justify="center" align="top">
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
            </Row>

            <p>Align Center</p>
            <Row type="flex" justify="space-around" align="middle">
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
            </Row>

            <p>Align Bottom</p>
            <Row type="flex" justify="space-between" align="bottom">
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
                <Col span={4}>
                    <div class="col-content">col-4</div>
                </Col>
            </Row>
        </div>
    );
}
