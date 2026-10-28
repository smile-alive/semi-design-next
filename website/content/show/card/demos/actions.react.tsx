import { Card, Rating } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Meta } = Card;

    return (
        <Card style={{ maxWidth: 300 }} actions={[<Rating key="rating" size="small" defaultValue={4} />]} headerLine={false} cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />}>
            <Meta title="Semi Doc" description="全面、易用、优质" />
        </Card>
    );
}
