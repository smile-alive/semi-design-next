import { Fragment, type CSSProperties } from 'react';
import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, type FileItem, type PromptPositionType } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const action = 'https://api.semi.design/upload';
    const getPrompt = (pos: PromptPositionType) => {
        let basicStyle = {
            display: 'flex',
            alignItems: 'center',
            color: 'var(--semi-color-text-2)',
            height: '100%',
        };
        let marginStyle: Partial<Record<PromptPositionType, CSSProperties>> = {
            right: { marginLeft: 10 },
        };
        let style = { ...basicStyle, ...marginStyle[pos] };

        return <div style={style}>请上传认证材料</div>;
    };
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
                    <Upload action={action} prompt={getPrompt(pos)} promptPosition={pos} listType="picture" defaultFileList={defaultFileList}>
                        <IconPlus aria-label="上传图片" size="extra-large" />
                    </Upload>
                </Fragment>
            ))}
        </>
    );
}
