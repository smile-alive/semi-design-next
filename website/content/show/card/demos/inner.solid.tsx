import { Card, Typography } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card title="Card title">
            <Card title="Inner Card title" style={{ 'margin-bottom': '20px' }} headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                Inner Card content
            </Card>
            <Card title="Inner Card title" headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                Inner Card content
            </Card>
        </Card>
    );
}
