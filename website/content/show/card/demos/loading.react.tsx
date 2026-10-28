import { useState } from 'react';
import { Card, Switch } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const [loading, setLoading] = useState(true);
    const { Meta } = Card;

    return (
        <>
            <Switch aria-label="显示内容" onChange={(v) => setLoading(!v)} />
            <br />
            <br />
            <Card style={{ maxWidth: 360 }} loading={loading}>
                <Meta title="Semi Doc" description="全面、易用、优质" />
            </Card>
        </>
    );
}
