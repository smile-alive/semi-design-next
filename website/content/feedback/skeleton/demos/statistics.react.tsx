import { Skeleton, Descriptions } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const placeholder = (
        <div>
            <Skeleton.Paragraph rows={1} style={{ width: 80, marginBottom: 10 }} />
            <Skeleton.Title style={{ width: 120 }} />
        </div>
    );

    const data = [{ key: '实际用户数量', value: '1,480,000' }];

    return (
        <Skeleton placeholder={placeholder} loading>
            <Descriptions data={data} row />
        </Skeleton>
    );
}
