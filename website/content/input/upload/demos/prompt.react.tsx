import { Fragment, type CSSProperties } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type PromptPositionType } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const action = 'https://api.semi.design/upload';
    const getPrompt = (pos: PromptPositionType) => {
        let basicStyle = {
            display: 'flex',
            alignItems: 'center',
            color: 'var(--semi-color-text-2)',
            height: 32,
        };
        let marginStyle: Partial<Record<PromptPositionType, CSSProperties>> = {
            left: { marginRight: 10 },
            right: { marginLeft: 10 },
        };
        let style = { ...basicStyle, ...marginStyle[pos] };

        return <div style={style}>请上传资格认证材料</div>;
    };
    const button = (
        <Button icon={<IconUpload />} theme="light">
            点击上传
        </Button>
    );
    const positions: PromptPositionType[] = ['right', 'left', 'bottom'];
    return (
        <>
            {positions.map((pos, index) => (
                <Fragment key={pos}>
                    {Boolean(index) && (
                        <div
                            style={{
                                marginBottom: 12,
                                marginTop: 12,
                                borderBottom: '1px solid var(--semi-color-border)',
                            }}
                        />
                    )}
                    <Upload action={action} prompt={getPrompt(pos)} promptPosition={pos}>
                        {button}
                    </Upload>
                </Fragment>
            ))}
        </>
    );
}
