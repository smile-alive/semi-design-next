import { For, Show } from 'solid-js';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type PromptPositionType, Upload } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';

const positions: PromptPositionType[] = ['right', 'left', 'bottom'];

const getPromptStyle = (pos: PromptPositionType) => ({
    display: 'flex',
    'align-items': 'center',
    color: 'var(--semi-color-text-2)',
    height: '32px',
    ...(pos === 'left' ? { 'margin-right': '10px' } : pos === 'right' ? { 'margin-left': '10px' } : {}),
});

export default function UploadDemo() {
    return (
        <For each={positions}>
            {(pos, index) => (
                <>
                    <Show when={index() > 0}>
                        <div style={{ 'margin-bottom': '12px', 'margin-top': '12px', 'border-bottom': '1px solid var(--semi-color-border)' }} />
                    </Show>
                    <Upload action={action} prompt={<div style={getPromptStyle(pos)}>请上传资格认证材料</div>} promptPosition={pos}>
                        <Button icon={<IconUpload />} theme="light">
                            点击上传
                        </Button>
                    </Upload>
                </>
            )}
        </For>
    );
}
