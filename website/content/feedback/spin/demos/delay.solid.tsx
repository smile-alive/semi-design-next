import { createSignal } from 'solid-js';
import { Button, Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    const [loading, setLoading] = createSignal(false);

    const toggle = () => {
        setLoading(!loading());
    };

    return (
        <div>
            <Button onClick={toggle} style={{ 'margin-right': '20px' }}>
                延迟显示的spin
            </Button>
            <Spin delay={1000} spinning={loading()} />
        </div>
    );
}
