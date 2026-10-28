import { createSignal } from 'solid-js';
import { Button, Feedback, type FeedbackValue } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);
    const onValueChange = (value: FeedbackValue) => {
        console.log('emoji value', value);
    };

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Modal, emoji</Button>
            <Feedback mode="modal" title="Why did you choose this rating?" visible={visible()} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} onValueChange={onValueChange} />
        </>
    );
}
