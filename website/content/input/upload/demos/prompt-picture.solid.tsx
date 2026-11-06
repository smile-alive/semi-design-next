import { For, Show, type JSX } from 'solid-js';
import { IconPlus } from '@fibrae/semi-icons-solid';
import { type FileItem, type PromptPositionType, Upload } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';
const marginStyle: Partial<Record<PromptPositionType, JSX.CSSProperties>> = {
    right: { 'margin-inline-start': '10px' },
};
const promptStyle = (pos: PromptPositionType): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    color: 'var(--semi-color-text-2)',
    height: '100%',
    ...marginStyle[pos],
});
const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'dy.jpeg',
        status: 'success',
        size: '130kb',
        url: '/assets/placeholder/avatar-a.svg',
    },
    {
        uid: '5',
        name: 'resso.jpeg',
        status: 'wait',
        percent: 50,
        size: '222kb',
        url: '/assets/placeholder/avatar-b.svg',
    },
];
const positions: PromptPositionType[] = ['right', 'bottom'];

export default function UploadDemo() {
    return (
        <For each={positions}>
            {(pos, index) => (
                <>
                    <Show when={index() > 0}>
                        <div style={{ 'margin-block-end': '12px', 'margin-block-start': '12px', 'border-block-end': '1px solid var(--semi-color-border)' }} />
                    </Show>
                    <Upload action={action} prompt={<div style={promptStyle(pos)}>请上传认证材料</div>} promptPosition={pos} listType="picture" defaultFileList={defaultFileList}>
                        <IconPlus aria-label="上传图片" size="extra-large" />
                    </Upload>
                </>
            )}
        </For>
    );
}
