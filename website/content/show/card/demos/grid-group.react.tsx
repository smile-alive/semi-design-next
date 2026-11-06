import { Card, CardGroup, Typography } from '@fibrae/semi-ui-react';

const cardIndexes = Array.from({ length: 7 }, (_, index) => index);

export default function CardDemo() {
    return (
        <CardGroup type="grid">
            {cardIndexes.map((idx) => (
                <Card key={idx} shadows="hover" title="Card title" headerLine={false} style={{ width: 260 }} headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                    <Typography.Text>Card content</Typography.Text>
                </Card>
            ))}
        </CardGroup>
    );
}
