import { useState } from 'react';
import { Card, CardGroup, Typography, Slider } from '@fibrae/semi-ui-react';

const cardIndexes = Array.from({ length: 8 }, (_, index) => index);

export default function CardDemo() {
    const [spacing, setSpacing] = useState(12);

    return (
        <>
            <Typography.Text id="card-group-spacing">滑动调节 Card 间距</Typography.Text>
            <Slider aria-labelledby="card-group-spacing" defaultValue={12} max={40} min={10} style={{ width: 360 }} onChange={(v) => typeof v === 'number' && setSpacing(v)} />
            <br />
            <CardGroup spacing={spacing}>
                {cardIndexes.map((idx) => (
                    <Card key={idx} shadows="hover" title="Card title" headerLine={false} style={{ width: 260 }} headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                        <Typography.Text>Card content</Typography.Text>
                    </Card>
                ))}
            </CardGroup>
        </>
    );
}
