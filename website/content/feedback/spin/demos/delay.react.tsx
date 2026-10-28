import { useState } from 'react';
import { Spin, Button } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    const [loading, toggleLoading] = useState(false);

    const toggle = () => {
        toggleLoading(!loading);
    };
    return (
        <div>
            <Button onClick={toggle} style={{ marginRight: 20 }}>
                延迟显示的spin
            </Button>
            <Spin delay={1000} spinning={loading} />
        </div>
    );
}
