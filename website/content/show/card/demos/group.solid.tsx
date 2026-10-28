import { For, createSignal } from 'solid-js';
import { Card, CardGroup, Slider, Typography } from '@fibrae/semi-ui-solid';

const cardIndexes = Array.from({ length: 8 }, (_, index) => index);

export default function CardDemo() {
    const [spacing, setSpacing] = createSignal(12);

    return (
        <>
            <Typography.Text id="card-group-spacing">滑动调节 Card 间距</Typography.Text>
            <Slider
                aria-labelledby="card-group-spacing"
                defaultValue={12}
                max={40}
                min={10}
                style={{ width: '360px' }}
                onChange={(value) => {
                    if (typeof value === 'number') setSpacing(value);
                }}
            />
            <br />
            <CardGroup spacing={spacing()}>
                <For each={cardIndexes}>
                    {() => (
                        <Card shadows="hover" title="Card title" headerLine={false} style={{ width: '260px' }} headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                            <Typography.Text>Card content</Typography.Text>
                        </Card>
                    )}
                </For>
            </CardGroup>
        </>
    );
}
