import { Card } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    return (
        <Card style={{ maxWidth: 300 }} cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo2.jpeg" />}>
            <Card.Meta title="卡片封面" />
        </Card>
    );
}
