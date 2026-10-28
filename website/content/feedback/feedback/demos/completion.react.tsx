import { useState, useCallback, useMemo } from 'react';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-react';
import { Feedback, Button, Empty, TextArea } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible1, setVisible1] = useState(false);
    const [value1, setValue1] = useState('');
    const [showThanks1, setShowThanks1] = useState(false);

    const [visible2, setVisible2] = useState(false);
    const [value2, setValue2] = useState('');
    const [showThanks2, setShowThanks2] = useState(false);

    const handleOk1 = useCallback(() => {
        setShowThanks1(true);
        setTimeout(() => {
            setVisible1(false);
            setTimeout(() => {
                setShowThanks1(false);
            }, 200);
        }, 1500);
    }, []);

    const hideFeedback1 = useCallback(() => {
        setVisible1(false);
    }, []);

    const onTextAreaChange1 = useCallback((value: string) => {
        setValue1(value);
    }, []);

    const handleOk2 = useCallback(() => {
        setShowThanks2(true);
        setTimeout(() => {
            setVisible2(false);
            setTimeout(() => {
                setShowThanks2(false);
            }, 200);
        }, 1500);
    }, []);

    const hideFeedback2 = useCallback(() => {
        setVisible2(false);
    }, []);

    const onTextAreaChange2 = useCallback((value: string) => {
        setValue2(value);
    }, []);

    const showThankProps = useMemo(() => ({ title: ' ', footer: null }), []);

    return (
        <div>
            <Button onClick={() => setVisible1(!visible1)}>Open Feedback: Popup, Custom</Button>
            <Feedback
                visible={visible1}
                onOk={handleOk1}
                onCancel={hideFeedback1}
                okButtonProps={{
                    disabled: !value1,
                }}
                title="What is your feedback on this product?"
                type="custom"
                {...(showThanks1 ? showThankProps : {})}
                renderContent={() => {
                    return showThanks1 ? (
                        <>
                            <Empty image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="感谢您的反馈" style={{ padding: 30 }} />
                        </>
                    ) : (
                        <>
                            <span>这是一段自定义的内容</span>
                            <TextArea onChange={onTextAreaChange1} />
                        </>
                    );
                }}
            />
            <br />
            <br />
            <Button onClick={() => setVisible2(!visible2)}>Open Feedback: Modal, Custom</Button>
            <Feedback
                visible={visible2}
                onOk={handleOk2}
                onCancel={hideFeedback2}
                okButtonProps={{
                    disabled: !value2,
                }}
                title="What is your feedback on this product?"
                type="custom"
                mode="modal"
                {...(showThanks2 ? showThankProps : {})}
                renderContent={() => {
                    return showThanks2 ? (
                        <>
                            <Empty image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="感谢您的反馈" style={{ padding: 30 }} />
                        </>
                    ) : (
                        <>
                            <span>这是一段自定义的内容</span>
                            <TextArea onChange={onTextAreaChange2} />
                        </>
                    );
                }}
            />
        </div>
    );
}
