import { Card } from '@fibrae/semi-ui-solid';

const coverSrc = '/assets/root-web-sites/card-cover-docs-demo2.jpeg';

export default function CardDemo() {
    return (
        <Card style={{ 'max-width': '300px' }} cover={<img alt="example" src={coverSrc} />}>
            <Card.Meta title="卡片封面" />
        </Card>
    );
}
