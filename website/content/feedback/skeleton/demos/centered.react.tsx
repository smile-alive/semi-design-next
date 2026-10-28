import type { CSSProperties } from 'react';
import { Skeleton, Button } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const style: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '300px',
        marginBottom: '10px',
    };

    const placeholder = (
        <div style={style}>
            <Skeleton.Paragraph style={style} rows={3} />
            <Skeleton.Button />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading style={{ textAlign: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <p>Hi, Bytedance dance dance.</p>
                <p>Hi, Bytedance dance dance.</p>
                <Button>Button</Button>
            </div>
        </Skeleton>
    );
}
