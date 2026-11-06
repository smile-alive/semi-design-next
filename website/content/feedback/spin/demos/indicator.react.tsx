import { IconLoading } from '@fibrae/semi-icons-react';
import { Spin } from '@fibrae/semi-ui-react';

export default function SpinDemo() {
    return (
        <div style={{ marginInlineStart: 30 }}>
            <div>自定义指示符的加载器</div>
            <Spin indicator={<IconLoading />} />
        </div>
    );
}
