import { Skeleton, Avatar } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const style = {
        display: 'flex',
        alignItems: 'flex-start',
    };

    const placeholder = (
        <div style={style}>
            <Skeleton.Avatar style={{ marginRight: 12 }} />
            <div>
                <Skeleton.Title style={{ width: 120, marginBottom: 12, marginTop: 12 }} />
                <Skeleton.Paragraph style={{ width: 240 }} rows={3} />
            </div>
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading active>
            <div style={style}>
                <Avatar color="blue" style={{ marginRight: 12 }}>
                    UI
                </Avatar>
                <div>
                    <h3>Semi UI</h3>
                    <p>Hi, Bytedance dance dance.</p>
                    <p>Hi, Bytedance dance dance.</p>
                    <p>Hi, Bytedance dance dance.</p>
                </div>
            </div>
        </Skeleton>
    );
}
