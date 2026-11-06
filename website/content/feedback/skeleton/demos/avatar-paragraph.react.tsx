import { Skeleton, Avatar } from '@fibrae/semi-ui-react';

const style = {
    display: 'flex',
    alignItems: 'flex-start',
};

export default function SkeletonDemo() {
    const placeholder = (
        <div style={style}>
            <Skeleton.Avatar style={{ marginInlineEnd: 12 }} />
            <div>
                <Skeleton.Title style={{ width: 120, marginBlockEnd: 12, marginBlockStart: 12 }} />
                <Skeleton.Paragraph style={{ width: 240 }} rows={3} />
            </div>
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <div style={style}>
                <Avatar color="blue" style={{ marginInlineEnd: 12 }}>
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
