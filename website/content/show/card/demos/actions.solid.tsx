import { Card, Rating } from '@fibrae/semi-ui-solid';

const coverSrc = '/assets/root-web-sites/card-cover-docs-demo.jpeg';

export default function CardDemo() {
    return (
        <Card style={{ 'max-width': '300px' }} actions={[<Rating size="small" defaultValue={4} />]} headerLine={false} cover={<img alt="example" src={coverSrc} />}>
            <Card.Meta title="Semi Doc" description="全面、易用、优质" />
        </Card>
    );
}
