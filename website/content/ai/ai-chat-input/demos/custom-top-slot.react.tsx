import React, { useState, useCallback, useRef } from 'react';
import { AIChatInput, type AIChatInputHandle, type AIChatInputAttachment as Attachment, type AIChatInputReference as Reference, type AIChatInputRenderTopSlotProps as RenderTopSlotProps } from '@fibrae/semi-ai-react';
import { IconClose, IconUpload, IconFile, IconFolder, IconBranch, IconTerminal, IconGlobeStroke, IconConnectionPoint2, IconTemplateStroked, IconSearch, IconGit, IconCode } from '@fibrae/semi-icons-react';

const { Configure } = AIChatInput;
const radioButtonProps = [
    // the icon is the only label, so it carries the name
    { label: <IconTemplateStroked aria-label="快速" />, value: 'fast' },
    { label: <IconSearch aria-label="深度思考" />, value: 'think' },
];
const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };

const customReferences: Reference[] = [
    {
        type: 'file',
        id: '1',
        name: 'horizontalScroller.tsx',
        path: 'packages/semi-ui-react/AIChatInput/horizontalScroller.tsx',
    },
    {
        type: 'folder',
        id: '2',
        name: 'AIChatInput',
        path: 'packages/semi-ui-react/AIChatInput',
    },
    {
        type: 'web',
        id: '3',
        name: 'web',
    },
    {
        type: 'change',
        id: '4',
        name: 'recentChange',
    },
    {
        type: 'branch',
        id: '5',
        name: 'Branch',
        detail: 'Diff with Main Branch',
        branch: 'feat/aichatinput',
        targetBranch: 'feat/targetBranch',
    },
    {
        type: 'terminal',
        id: '6',
        name: 'From 1-2',
        from: 1,
        to: 2,
    },
];

function isImageType({ name = '', fileInstance }: Attachment) {
    const PIC_PREFIX = 'image/';
    const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
    const suffix = name.split('.').pop() ?? '';
    let result = false;
    const type = fileInstance?.type ?? '';
    if (type.startsWith(PIC_PREFIX)) {
        result = true;
    } else if (PIC_SUFFIX_ARRAY.includes(suffix)) {
        result = true;
    }
    return result;
}

const refTypeToIconMap = new Map([
    ['file', <IconFile key="file" size="small" />],
    ['folder', <IconFolder key="folder" size="small" />],
    ['branch', <IconBranch key="branch" size="small" />],
    ['terminal', <IconTerminal key="terminal" size="small" />],
    ['web', <IconGlobeStroke key="globalStroke" size="small" />],
    ['change', <IconConnectionPoint2 key="connectionPoint2" size="small" />],
    ['git', <IconGit key="git" size="small" />],
    ['code', <IconCode key="code" size="small" />],
]);

export default function AIChatInputDemo() {
    const ref = useRef<AIChatInputHandle>(null);
    const [reference, setReference] = useState(customReferences);

    const renderLeftMenu = useCallback(
        () => (
            <>
                <Configure.RadioButton options={radioButtonProps} initValue="fast" field="mode" />
            </>
        ),
        []
    );

    const renderTopSlot = useCallback(({ attachments = [], references = [] }: RenderTopSlotProps) => {
        return (
            <div className="ai-chat-input-topSlot">
                {references.map(({ type, name, detail, id }, index) => {
                    const icon = type ? refTypeToIconMap.get(type) : undefined;
                    return (
                        <div className="item" key={id}>
                            <span className="item-icon">
                                {icon && React.cloneElement(icon, { className: 'item-left item-icon' })}
                                <button
                                    type="button"
                                    className="item-icon-delete"
                                    aria-label="删除"
                                    onClick={() => {
                                        const newReferences = [...references];
                                        newReferences.splice(index, 1);
                                        setReference(newReferences);
                                    }}
                                >
                                    <IconClose size="small" />
                                </button>
                            </span>
                            <span className="item-content">
                                {name}
                                {type === 'branch' && <span className="detail">{detail}</span>}
                            </span>
                        </div>
                    );
                })}
                {attachments.map((item) => {
                    const isImage = isImageType(item);
                    const { uid, name } = item;
                    return (
                        <div className="item" key={uid}>
                            <span className="item-icon">
                                {isImage ? <img className="item-image item-left" src={item.url} alt={item.name} /> : <IconUpload size="small" className="item-left item-icon" />}
                                <button
                                    type="button"
                                    className="item-icon-delete"
                                    aria-label="删除"
                                    onClick={() => {
                                        ref.current?.deleteUploadFile(item);
                                    }}
                                >
                                    <IconClose size="small" />
                                </button>
                            </span>
                            <span className="item-content">{name}</span>
                        </div>
                    );
                })}
            </div>
        );
    }, []);

    return <AIChatInput className="aiChatInput-customTopSlot" renderTopSlot={renderTopSlot} references={reference} showUploadFile={false} showReference={false} renderConfigureArea={renderLeftMenu} ref={ref} uploadProps={uploadProps} style={outerStyle} placeholder="自定义渲染顶部内容，可用于渲染上传内容、引用内容" />;
}
