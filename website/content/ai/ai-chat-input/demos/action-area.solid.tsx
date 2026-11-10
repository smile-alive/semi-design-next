import { For } from 'solid-js';
import { AIChatInput, type AIChatInputActionAreaProps as ActionAreaProps } from '@fibrae/semi-ai-solid';
import { IconDeleteStroked } from '@fibrae/semi-icons-solid';
import { Button, Divider } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
const outerStyle = { margin: '12px' };

const renderActionArea = (actionArea: ActionAreaProps) => (
    <div class={actionArea.class}>
        <div style={{ display: 'flex', 'align-items': 'center' }}>
            <Button aria-label="清空内容" type="tertiary" style={{ 'border-radius': '50%' }} icon={<IconDeleteStroked />} />
            <Divider layout="vertical" style={{ 'margin-inline-start': '8px' }} />
        </div>
        <For each={actionArea.menuItem}>{(item) => item()}</For>
    </div>
);

export default function AIChatInputDemo() {
    return <AIChatInput renderActionArea={renderActionArea} placeholder="输入内容或者上传内容..." uploadProps={uploadProps} style={outerStyle} />;
}
