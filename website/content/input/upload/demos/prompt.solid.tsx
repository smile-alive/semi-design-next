import { For, Show, type JSX } from 'solid-js';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type PromptPositionType, Upload } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';
const marginStyle: Partial<Record<PromptPositionType, JSX.CSSProperties>> = {
    left: { 'margin-inline-end': '10px' },
    right: { 'margin-inline-start': '10px' },
};
const promptStyle = (pos: PromptPositionType): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    color: 'var(--semi-color-text-2)',
    height: '32px',
    ...marginStyle[pos],
});
const positions: PromptPositionType[] = ['right', 'left', 'bottom'];

export default function UploadDemo() {
    return (
        <For each={positions}>
            {(pos, index) => (
                <>
                    <Show when={index() > 0}>
                        <div style={{ 'margin-block-end': '12px', 'margin-block-start': '12px', 'border-block-end': '1px solid var(--semi-color-border)' }} />
                    </Show>
                    <Upload action={action} prompt={<div style={promptStyle(pos)}>请上传资格认证材料</div>} promptPosition={pos}>
                        <Button icon={<IconUpload />} theme="light">
                            点击上传
                        </Button>
                    </Upload>
                </>
            )}
        </For>
    );
}
