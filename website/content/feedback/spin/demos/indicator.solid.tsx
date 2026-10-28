import { IconLoading } from '@fibrae/semi-icons-solid';
import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div style={{ 'margin-left': '30px' }}>
            <div>A spin with customized indicator.</div>
            <Spin indicator={<IconLoading />} />
        </div>
    );
}
