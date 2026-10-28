import { createSignal } from 'solid-js';
import { Card, Switch } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    const [loading, setLoading] = createSignal(true);

    return (
        <>
            <Switch aria-label="显示内容" onChange={(checked) => setLoading(!checked)} />
            <br />
            <br />
            <Card style={{ 'max-width': '360px' }} loading={loading()}>
                <Card.Meta title="Semi Doc" description="全面、易用、优质" />
            </Card>
        </>
    );
}
