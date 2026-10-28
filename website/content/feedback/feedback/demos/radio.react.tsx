import { useState, useCallback } from 'react';
import { Feedback, Button } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible, setVisible] = useState(false);
    const handleOk = useCallback(() => setVisible(false), []);
    const handleCancel = useCallback(() => setVisible(false), []);

    return (
        <>
            <Button onClick={() => setVisible(!visible)}>展示反馈: Popup, radio</Button>
            <Feedback
                type="radio"
                radioGroupProps={{
                    options: ['访客', '开发者', '维护者'],
                }}
                title="您的身份是"
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
            />
        </>
    );
}
