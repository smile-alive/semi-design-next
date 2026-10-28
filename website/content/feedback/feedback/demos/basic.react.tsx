import { useState, useCallback } from 'react';
import { Feedback, Button, type FeedbackValue } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible, setVisible] = useState(false);
    const handleOk = useCallback(() => setVisible(false), []);
    const handleCancel = useCallback(() => setVisible(false), []);
    const onValueChange = useCallback((value: FeedbackValue) => {
        console.log('emoji value', value);
    }, []);

    return (
        <>
            <Button onClick={() => setVisible(!visible)}>展示反馈: Popup, emoji</Button>
            <Feedback title="您对本产品的评分是？" visible={visible} onOk={handleOk} onCancel={handleCancel} onValueChange={onValueChange} />
        </>
    );
}
