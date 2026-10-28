import { useState, useCallback } from 'react';
import { Feedback, Button } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible, setVisible] = useState(false);
    const handleOk = useCallback(() => setVisible(false), []);
    const handleCancel = useCallback(() => setVisible(false), []);

    return (
        <>
            <Button onClick={() => setVisible(!visible)}>展示反馈: Popup, checkbox</Button>
            <Feedback
                type="checkbox"
                checkboxGroupProps={{
                    options: ['抖音', '火山', '豆包'],
                }}
                title="您最常使用以下哪些产品？"
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
            />
        </>
    );
}
