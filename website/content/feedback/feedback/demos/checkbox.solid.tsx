import { createSignal } from 'solid-js';
import { Button, Feedback } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Popup, checkbox</Button>
            <Feedback
                type="checkbox"
                checkboxGroupProps={{
                    options: ['短视频', '直播', '资讯'],
                }}
                title="您最常使用以下哪些产品？"
                visible={visible()}
                onOk={() => setVisible(false)}
                onCancel={() => setVisible(false)}
            />
        </>
    );
}
