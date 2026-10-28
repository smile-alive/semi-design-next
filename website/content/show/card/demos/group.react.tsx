import { useState } from 'react';
import { Card, CardGroup, Typography, Slider } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Text } = Typography;
    const [spacing, setSpacing] = useState(12);

    return (
        <>
            <Text id="card-group-spacing">滑动调节 Card 间距</Text>
            <Slider aria-labelledby="card-group-spacing" defaultValue={12} max={40} min={10} style={{ width: 360 }} onChange={(v) => typeof v === 'number' && setSpacing(v)} />
            <br />
            <CardGroup spacing={spacing}>
                {Array.from({ length: 8 }).map((_v, idx) => (
                    <Card key={idx} shadows="hover" title="Card title" headerLine={false} style={{ width: 260 }} headerExtraContent={<Text link>More</Text>}>
                        <Text>Card content</Text>
                    </Card>
                ))}
            </CardGroup>
        </>
    );
}
