import { Skeleton } from '@fibrae/semi-ui-solid';

export default function SkeletonDemo() {
    const placeholder = (
        <div>
            <Skeleton.Image style={{ width: '200px', height: '150px' }} />
            <Skeleton.Title style={{ width: '120px', 'margin-top': '10px' }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <img src="/assets/placeholder/avatar-a.svg" height="150" alt="avatar" />
            <h4>Semi UI</h4>
        </Skeleton>
    );
}
