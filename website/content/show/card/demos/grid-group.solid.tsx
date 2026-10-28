import { For } from 'solid-js';
import { Card, CardGroup, Typography } from '@fibrae/semi-ui-solid';

const cardIndexes = Array.from({ length: 7 }, (_, index) => index);

export default function CardDemo() {
    return (
        <CardGroup type="grid">
            <For each={cardIndexes}>
                {() => (
                    <Card shadows="hover" title="Card title" headerLine={false} style={{ width: '260px' }} headerExtraContent={<Typography.Text link>More</Typography.Text>}>
                        <Typography.Text>Card content</Typography.Text>
                    </Card>
                )}
            </For>
        </CardGroup>
    );
}
