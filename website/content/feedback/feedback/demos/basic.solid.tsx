import { createSignal } from 'solid-js';
import { Button, Feedback, type FeedbackValue } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);
    const onValueChange = (value: FeedbackValue) => {
        console.log('emoji value', value);
    };

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Popup, emoji</Button>
            <Feedback title="您对本产品的评分是？" visible={visible()} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} onValueChange={onValueChange} />
        </>
    );
}
