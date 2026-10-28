import { Empty, Typography } from '@fibrae/semi-ui-solid';

export default function EmptyDemo() {
    return (
        <Empty
            title="暂未找到匹配的筛选结果"
            description={
                <span>
                    <Typography.Text>试试 </Typography.Text>
                    <Typography.Text link>重置筛选条件</Typography.Text>
                </span>
            }
        />
    );
}
