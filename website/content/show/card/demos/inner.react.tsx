import { Card, Typography } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Text } = Typography;

    return (
        <Card title="Card title">
            <Card title="Inner Card title" style={{ marginBottom: 20 }} headerExtraContent={<Text link>More</Text>}>
                Inner Card content
            </Card>
            <Card title="Inner Card title" headerExtraContent={<Text link>More</Text>}>
                Inner Card content
            </Card>
        </Card>
    );
}
