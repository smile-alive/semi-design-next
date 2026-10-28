import { IconLoading } from '@fibrae/semi-icons-react';
import { Spin } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    return (
        <div style={{ marginLeft: 30 }}>
            <div>A spin with customized indicator.</div>
            <Spin indicator={<IconLoading />} />
        </div>
    );
}
