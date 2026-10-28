import { AIChatInput, type AIChatInputActionAreaProps as ActionAreaProps } from '@fibrae/semi-ai-solid';
import { IconDeleteStroked } from '@fibrae/semi-icons-solid';
import { Button, Divider } from '@fibrae/semi-ui-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

const renderActionArea = (props: ActionAreaProps) => (
    <div class={props.class}>
        <div style={{ display: 'flex', 'align-items': 'center' }}>
            <Button aria-label="清空内容" type="tertiary" style={{ 'border-radius': '50%' }} icon={<IconDeleteStroked />} />
            <Divider layout="vertical" style={{ 'margin-left': '8px' }} />
        </div>
        {props.menuItem}
    </div>
);

export default function AIChatInputDemo() {
    return <AIChatInput renderActionArea={renderActionArea} placeholder="输入内容或者上传内容..." uploadProps={uploadProps} style={outerStyle} />;
}
