import { Timeline } from '@fibrae/semi-ui-react';

export default function TimelineDemo() {
    return (
        <Timeline mode="right">
            <Timeline.Item time="2019-07-14 10:35" extra="节点辅助说明信息">
                第一个节点内容
            </Timeline.Item>
            <Timeline.Item time="2019-06-13 16:17" extra="节点辅助说明信息">
                第二个节点内容
            </Timeline.Item>
            <Timeline.Item time="2019-05-14 18:34" extra="节点辅助说明信息">
                第三个节点内容
            </Timeline.Item>
            <Timeline.Item time="2019-05-09 09:12" extra="节点辅助说明信息">
                第四个节点内容
            </Timeline.Item>
        </Timeline>
    );
}
