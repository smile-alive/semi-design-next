import { createSignal } from 'solid-js';
import { Button, Feedback, TextArea } from '@fibrae/semi-ui-solid';

export default function FeedbackDemo() {
    const [visible, setVisible] = createSignal(false);
    const [value, setValue] = createSignal('');

    return (
        <>
            <Button onClick={() => setVisible(!visible())}>展示反馈: Popup, custom</Button>
            <Feedback type="custom" okButtonProps={{ disabled: !value() }} title="您对本产品的建议是？" visible={visible()} onOk={() => setVisible(false)} onCancel={() => setVisible(false)}>
                <span>这是一段自定义的内容</span>
                <TextArea onChange={(text) => setValue(text)} />
            </Feedback>
        </>
    );
}
