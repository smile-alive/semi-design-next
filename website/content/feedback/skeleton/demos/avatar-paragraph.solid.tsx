import { Avatar, Skeleton } from '@fibrae/semi-ui-solid';

const style = {
    display: 'flex',
    'align-items': 'flex-start',
};

export default function SkeletonDemo() {
    const placeholder = (
        <div style={style}>
            <Skeleton.Avatar style={{ 'margin-inline-end': '12px' }} />
            <div>
                <Skeleton.Title style={{ width: '120px', 'margin-block-end': '12px', 'margin-block-start': '12px' }} />
                <Skeleton.Paragraph style={{ width: '240px' }} rows={3} />
            </div>
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <div style={style}>
                <Avatar color="blue" style={{ 'margin-inline-end': '12px' }}>
                    UI
                </Avatar>
                <div>
                    <h3>Semi UI</h3>
                    <p>Hi, Semi dance dance.</p>
                    <p>Hi, Semi dance dance.</p>
                    <p>Hi, Semi dance dance.</p>
                </div>
            </div>
        </Skeleton>
    );
}
