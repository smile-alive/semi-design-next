import { Avatar, Skeleton } from '@fibrae/semi-ui-solid';

const style = {
    display: 'flex',
    'align-items': 'flex-start',
};

export default function SkeletonDemo() {
    const placeholder = (
        <div style={style}>
            <Skeleton.Avatar style={{ 'margin-right': '12px' }} />
            <div>
                <Skeleton.Title style={{ width: '120px', 'margin-bottom': '12px', 'margin-top': '12px' }} />
                <Skeleton.Paragraph style={{ width: '240px' }} rows={3} />
            </div>
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading active>
            <div style={style}>
                <Avatar color="blue" style={{ 'margin-right': '12px' }}>
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
