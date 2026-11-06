import { IconLoading } from '@fibrae/semi-icons-solid';
import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div style={{ 'margin-inline-start': '30px' }}>
            <div>自定义指示符的加载器</div>
            <Spin indicator={<IconLoading />} />
        </div>
    );
}
