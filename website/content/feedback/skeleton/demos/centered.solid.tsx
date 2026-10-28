import type { JSX } from 'solid-js';
import { Button, Skeleton } from '@fibrae/semi-ui-solid';

const style: JSX.CSSProperties = {
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    width: '300px',
    'margin-bottom': '10px',
};

export default function SkeletonDemo() {
    const placeholder = (
        <div style={style}>
            <Skeleton.Paragraph style={style} rows={3} />
            <Skeleton.Button />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading style={{ 'text-align': 'center' }}>
            <div style={{ 'text-align': 'center' }}>
                <p>Hi, Bytedance dance dance.</p>
                <p>Hi, Bytedance dance dance.</p>
                <Button>Button</Button>
            </div>
        </Skeleton>
    );
}
