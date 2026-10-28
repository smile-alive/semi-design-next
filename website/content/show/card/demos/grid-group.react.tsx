import { Card, CardGroup, Typography } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Text } = Typography;

    return (
        <CardGroup type="grid">
            {Array.from({ length: 7 }).map((_v, idx) => (
                <Card key={idx} shadows="hover" title="Card title" headerLine={false} style={{ width: 260 }} headerExtraContent={<Text link>More</Text>}>
                    <Text>Card content</Text>
                </Card>
            ))}
        </CardGroup>
    );
}
