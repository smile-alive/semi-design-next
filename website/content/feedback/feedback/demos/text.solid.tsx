import { createSignal } from 'solid-js';
import { Button, Feedback } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Popup, text</Button>
            <Feedback type="text" textAreaProps={{ maxCount: 200 }} title="您对本产品的建议是？" visible={visible()} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} />
        </>
    );
}
