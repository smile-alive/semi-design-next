import { Fragment, type CSSProperties } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type PromptPositionType } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';
const marginStyle: Partial<Record<PromptPositionType, CSSProperties>> = {
    left: { marginInlineEnd: 10 },
    right: { marginInlineStart: 10 },
};
const promptStyle = (pos: PromptPositionType): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    color: 'var(--semi-color-text-2)',
    height: 32,
    ...marginStyle[pos],
});
const positions: PromptPositionType[] = ['right', 'left', 'bottom'];

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
                    <Upload action={action} customRequest={mockUpload} prompt={<div style={promptStyle(pos)}>请上传资格认证材料</div>} promptPosition={pos}>
                        <Button icon={<IconUpload />} theme="light">
                            点击上传
                        </Button>
                    </Upload>
                </Fragment>
            ))}
        </>
    );
}
