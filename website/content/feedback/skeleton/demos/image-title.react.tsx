import { Skeleton } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const placeholder = (
        <div>
            <Skeleton.Image style={{ width: 200, height: 150 }} />
            <Skeleton.Title style={{ width: 120, marginTop: 10 }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <img src="/assets/placeholder/avatar-a.svg" height="150" alt="avatar" />
            <h4>Semi UI</h4>
        </Skeleton>
    );
}
