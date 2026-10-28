import { useState, useCallback } from 'react';
import { Feedback, Button } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible, setVisible] = useState(false);
    const handleOk = useCallback(() => setVisible(false), []);
    const handleCancel = useCallback(() => setVisible(false), []);

    return (
        <>
            <Button onClick={() => setVisible(!visible)}>展示反馈: Popup, text</Button>
            <Feedback type="text" textAreaProps={{ maxCount: 200 }} title="您对本产品的建议是？" visible={visible} onOk={handleOk} onCancel={handleCancel} />
        </>
    );
}
