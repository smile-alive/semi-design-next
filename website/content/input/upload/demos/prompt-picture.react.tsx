import { Fragment, type CSSProperties } from 'react';
import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, type FileItem, type PromptPositionType } from '@fibrae/semi-ui-react';

const action = 'https://api.semi.design/upload';
const marginStyle: Partial<Record<PromptPositionType, CSSProperties>> = {
    right: { marginInlineStart: 10 },
};
const promptStyle = (pos: PromptPositionType): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
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
        <>
            {positions.map((pos, index) => (
                <Fragment key={pos}>
                    {Boolean(index) && (
                        <div
                            style={{
                                marginBlockEnd: 12,
                                marginBlockStart: 12,
                                borderBlockEnd: '1px solid var(--semi-color-border)',
                            }}
                        />
                    )}
                    <Upload action={action} prompt={<div style={promptStyle(pos)}>请上传认证材料</div>} promptPosition={pos} listType="picture" defaultFileList={defaultFileList}>
                        <IconPlus aria-label="上传图片" size="extra-large" />
                    </Upload>
                </Fragment>
            ))}
        </>
    );
}
