import { Card, Row, Col } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    return (
        <div
            style={{
                backgroundColor: 'var(--semi-color-fill-0)',
                padding: 20,
            }}
        >
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card title="Card Title" bordered={false}>
                        Card Content
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Card Title" bordered={false}>
                        Card Content
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Card Title" bordered={false}>
                        Card Content
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={16}>
                    <Card title="Card Title" bordered={false}>
                        Card Content
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Card Title" bordered={false}>
                        Card Content
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
