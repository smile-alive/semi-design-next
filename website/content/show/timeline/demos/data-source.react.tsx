import { IconAlertTriangle } from '@fibrae/semi-icons-react';
import { Timeline } from '@fibrae/semi-ui-react';

export default function TimelineDemo() {
    return (
        <Timeline
            mode="alternate"
            dataSource={[
                {
                    time: '2019-07-14 10:35',
                    extra: '节点辅助说明信息',
                    content: '第一个节点内容',
                    type: 'ongoing',
                },
                {
                    time: '2019-06-13 16:17',
                    extra: '节点辅助说明信息',
                    content: <span style={{ fontSize: '18px' }}>第二个节点内容</span>,
                    color: 'pink',
                },
                {
                    time: '2019-05-14 18:34',
                    extra: '节点辅助说明信息',
                    dot: <IconAlertTriangle />,
                    content: '第三个节点内容',
                    type: 'warning',
                },
                {
                    time: '2019-05-09 09:12',
                    extra: '节点辅助说明信息',
                    content: '第四个节点内容',
                    type: 'success',
                },
            ]}
        />
    );
}
