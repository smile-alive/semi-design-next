import { Card, Rating } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card style={{ 'max-width': '300px' }} actions={[<Rating size="small" defaultValue={4} />]} headerLine={false} cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />}>
            <Card.Meta title="Semi Doc" description="全面、易用、优质" />
        </Card>
    );
}
