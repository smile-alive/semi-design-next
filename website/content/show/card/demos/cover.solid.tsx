import { Card } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card style={{ 'max-width': '300px' }} cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo2.jpeg" />}>
            <Card.Meta title="卡片封面" />
        </Card>
    );
}
