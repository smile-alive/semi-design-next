import { useState, useCallback } from 'react';
import { Feedback, Button, TextArea } from '@fibrae/semi-ui-react';

export default function FeedbackDemo() {
    const [visible, setVisible] = useState(false);
    const [value, setValue] = useState('');
    const handleOk = useCallback(() => setVisible(false), []);
    const handleCancel = useCallback(() => setVisible(false), []);
    const onTextAreaChange = useCallback((value: string) => {
        setValue(value);
    }, []);

    const renderContent = useCallback(() => {
        return (
            <>
                <span>这是一段自定义的内容</span>
                <TextArea onChange={onTextAreaChange} />
            </>
        );
    }, [onTextAreaChange]);

    return (
        <>
            <Button onClick={() => setVisible(!visible)}>展示反馈: Popup, custom</Button>
            <Feedback type="custom" okButtonProps={{ disabled: !value }} title="您对本产品的建议是？" visible={visible} onOk={handleOk} onCancel={handleCancel} renderContent={renderContent} />
        </>
    );
}
