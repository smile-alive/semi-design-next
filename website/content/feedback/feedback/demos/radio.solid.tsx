import { createSignal } from 'solid-js';
import { Button, Feedback } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Popup, radio</Button>
            <Feedback
                type="radio"
                radioGroupProps={{
                    options: ['访客', '开发者', '维护者'],
                }}
                title="您的身份是"
                visible={visible()}
                onOk={() => setVisible(false)}
                onCancel={() => setVisible(false)}
            />
        </>
    );
}
