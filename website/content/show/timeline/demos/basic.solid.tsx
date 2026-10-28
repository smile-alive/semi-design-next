import { Timeline } from '@fibrae/semi-ui-solid';

export default function TimelineDemo() {
    return (
        <Timeline>
            <Timeline.Item time="2019-07-14 10:35">第一个节点内容</Timeline.Item>
            <Timeline.Item time="2019-06-13 16:17">第二个节点内容</Timeline.Item>
            <Timeline.Item time="2019-05-14 18:34">第三个节点内容</Timeline.Item>
        </Timeline>
    );
}
