import { IconAlertTriangle } from '@fibrae/semi-icons-solid';
import { Timeline, type TimelineData } from '@fibrae/semi-ui-solid';

const dataSource: TimelineData[] = [
    {
        time: '2019-07-14 10:35',
        extra: '节点辅助说明信息',
        content: '第一个节点内容',
        type: 'ongoing',
    },
    {
        time: '2019-06-13 16:17',
        extra: '节点辅助说明信息',
        content: '第二个节点内容',
        color: 'pink',
    },
    {
        time: '2019-05-14 18:34',
        extra: '节点辅助说明信息',
        content: '第三个节点内容',
        type: 'warning',
    },
    {
        time: '2019-05-09 09:12',
        extra: '节点辅助说明信息',
        content: '第四个节点内容',
        type: 'success',
    },
];

const renderContent = (item: TimelineData, index: number) => (index === 1 ? <span style={{ 'font-size': '18px' }}>{item.content}</span> : item.content);

const renderDot = (_: TimelineData, index: number) => (index === 2 ? <IconAlertTriangle /> : undefined);

export default function TimelineDemo() {
    return <Timeline mode="alternate" dataSource={dataSource} renderContent={renderContent} renderDot={renderDot} />;
}
