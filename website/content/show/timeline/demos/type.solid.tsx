import { Timeline } from '@fibrae/semi-ui-solid';

export default function TimelineDemo() {
    return (
        <Timeline>
            <Timeline.Item time="2019-07-14 10:35" type="ongoing">
                审核中
            </Timeline.Item>
            <Timeline.Item time="2019-06-13 16:17" type="success">
                发布成功
            </Timeline.Item>
            <Timeline.Item time="2019-05-14 18:34" type="error">
                审核失败
            </Timeline.Item>
        </Timeline>
    );
}
