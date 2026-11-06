import { Avatar, Skeleton } from '@fibrae/semi-ui-solid';

export default function SkeletonDemo() {
    const placeholder = (
        <div style={{ display: 'flex', 'align-items': 'center' }}>
            <Skeleton.Avatar style={{ 'margin-inline-end': '12px' }} />
            <Skeleton.Title style={{ width: '120px' }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <Avatar color="blue" style={{ 'margin-inline-end': '12px' }}>
                UI
            </Avatar>
            <span>Semi UI</span>
        </Skeleton>
    );
}
