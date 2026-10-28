import { Descriptions, Skeleton } from '@fibrae/semi-ui-solid';

const data = [{ key: '实际用户数量', value: '1,480,000' }];

export default function SkeletonDemo() {
    const placeholder = (
        <div>
            <Skeleton.Paragraph rows={1} style={{ width: '80px', 'margin-bottom': '10px' }} />
            <Skeleton.Title style={{ width: '120px' }} />
        </div>
    );

    return (
        <Skeleton placeholder={placeholder} loading>
            <Descriptions data={data} row />
        </Skeleton>
    );
}
