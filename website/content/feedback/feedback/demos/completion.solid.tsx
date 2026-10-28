import { createSignal, Show } from 'solid-js';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Button, Empty, Feedback, TextArea } from '@fibrae/semi-ui-solid';

function createCompletion() {
    const [visible, setVisible] = createSignal(false);
    const [value, setValue] = createSignal('');
    const [showThanks, setShowThanks] = createSignal(false);

    const handleOk = () => {
        setShowThanks(true);
        setTimeout(() => {
            setVisible(false);
            setTimeout(() => {
                setShowThanks(false);
            }, 200);
        }, 1500);
    };

    return { visible, setVisible, value, setValue, showThanks, handleOk };
}

const showThankProps = { title: ' ', footer: null };

export default function FeedbackDemo() {
    const popup = createCompletion();
    const modal = createCompletion();

    return (
        <div>
            <Button onClick={() => popup.setVisible(!popup.visible())}>Open Feedback: Popup, Custom</Button>
            <Feedback visible={popup.visible()} onOk={popup.handleOk} onCancel={() => popup.setVisible(false)} okButtonProps={{ disabled: !popup.value() }} title="What is your feedback on this product?" type="custom" {...(popup.showThanks() ? showThankProps : {})}>
                <Show when={!popup.showThanks()} fallback={<Empty image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />} darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />} description="感谢您的反馈" style={{ padding: '30px' }} />}>
                    <span>这是一段自定义的内容</span>
                    <TextArea onChange={(text) => popup.setValue(text)} />
                </Show>
            </Feedback>
            <br />
            <br />
            <Button onClick={() => modal.setVisible(!modal.visible())}>Open Feedback: Modal, Custom</Button>
            <Feedback visible={modal.visible()} onOk={modal.handleOk} onCancel={() => modal.setVisible(false)} okButtonProps={{ disabled: !modal.value() }} title="What is your feedback on this product?" type="custom" mode="modal" {...(modal.showThanks() ? showThankProps : {})}>
                <Show when={!modal.showThanks()} fallback={<Empty image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />} darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />} description="感谢您的反馈" style={{ padding: '30px' }} />}>
                    <span>这是一段自定义的内容</span>
                    <TextArea onChange={(text) => modal.setValue(text)} />
                </Show>
            </Feedback>
        </div>
    );
}
