import { Spin } from '@fibrae/semi-ui-solid';

export default function SpinDemo() {
    return (
        <div style={{ 'margin-inline-start': '30px' }}>
            <div style={{ 'margin-block-end': '10px' }}>基本的加载器</div>
            <Spin />
        </div>
    );
}
