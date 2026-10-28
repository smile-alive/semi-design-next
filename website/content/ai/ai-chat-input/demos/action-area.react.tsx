import { useCallback } from 'react';
import { AIChatInput, type AIChatInputActionAreaProps as ActionAreaProps } from '@fibrae/semi-ai-react';
import { IconDeleteStroked } from '@fibrae/semi-icons-react';
import { Divider, Button } from '@fibrae/semi-ui-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };

export default function AIChatInputDemo() {
    const renderActionArea = useCallback((props: ActionAreaProps) => {
        return (
            <div className={props.className}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button aria-label="清空内容" type="tertiary" style={{ borderRadius: '50%' }} icon={<IconDeleteStroked />} />
                    <Divider layout="vertical" style={{ marginLeft: 8 }} />
                </div>
                {props.menuItem}
            </div>
        );
    }, []);

    return <AIChatInput renderActionArea={renderActionArea} placeholder="输入内容或者上传内容..." uploadProps={uploadProps} style={outerStyle} />;
}
