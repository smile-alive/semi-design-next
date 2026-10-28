import { Skeleton, Avatar } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const placeholder = (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton.Avatar style={{ marginRight: 12 }} />
            <Skeleton.Title style={{ width: 120 }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <Avatar color="blue" style={{ marginRight: 12 }}>
                UI
            </Avatar>
            <span>Semi UI</span>
        </Skeleton>
    );
}
