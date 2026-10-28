import React, { useState, useCallback, useRef, useMemo, useEffect, useImperativeHandle, type ReactNode, type Ref } from 'react';
import { computePosition, shift } from '@floating-ui/dom';
import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import { Mention, type MentionNodeAttrs, type MentionOptions } from '@tiptap/extension-mention';
import { ReactNodeViewRenderer, NodeViewWrapper, posToDOMRect, ReactRenderer, type ReactNodeViewProps } from '@tiptap/react';
import { AIChatInput, type AIChatInputHandle, type AIChatInputAttachment as Attachment, type AIChatInputContent as Content, type AIChatInputReference as Reference, type AIChatInputRenderTopSlotProps as RenderTopSlotProps } from '@fibrae/semi-ai-react';
import { IconFile, IconFolder, IconBranch, IconCode, IconGit, IconGlobeStroke, IconChevronRight, IconClose, IconUpload, IconTerminal, IconConnectionPoint2 } from '@fibrae/semi-icons-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };

interface PanelItem {
    icon: ReactNode;
    key: string;
    type: string;
    name: string;
    path?: string;
}

const TestAction: Record<string, PanelItem[]> = {
    'Files & Folders': [
        {
            icon: <IconFile />,
            key: '1-1',
            type: 'file',
            name: 'TagInput.scss',
            path: 'package/semi-founctaion/TagInput.scss',
        },
        {
            icon: <IconFolder />,
            key: '1-2',
            type: 'folder',
            name: 'package',
            path: '/package',
        },
        {
            icon: <IconFolder />,
            key: '1-3',
            type: 'folder',
            name: 'semi-ui',
            path: '/package/semi-ui',
        },
    ],
    Git: [
        {
            icon: <IconBranch />,
            key: '2-1',
            type: 'branch',
            name: 'fix/tag',
        },
        {
            icon: <IconCode />,
            key: '2-2',
            type: 'code',
            name: 'v2.86.0',
            path: '/package',
        },
        {
            icon: <IconGit />,
            key: '2-3',
            type: 'git',
            name: 'chore: publish',
        },
    ],
};

const FirstLevel = Object.keys(TestAction);

function ReferSlotComponent({ node }: ReactNodeViewProps) {
    const value = node.attrs.value ? node.attrs.value : '';

    return (
        <NodeViewWrapper className="ai-chat-input-refer-slot-wrapper">
            <span className="ai-chat-input-refer-slot">{value}</span>
        </NodeViewWrapper>
    );
}

const ReferSlot = Node.create({
    name: 'referSlot',
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false,
    addAttributes() {
        return {
            value: {
                default: '输入内容',
                parseHTML: (element) => element.getAttribute('data-value'),
                renderHTML: (attributes) => ({
                    'data-value': attributes.value,
                }),
            },
            info: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-info'),
                renderHTML: (attributes) => ({
                    'data-info': attributes.info,
                }),
            },
            type: {
                default: 'text',
                parseHTML: (element) => element.getAttribute('data-type'),
                renderHTML: (attributes) => ({
                    'data-type': attributes.type,
                }),
            },
            uniqueKey: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-unique-key'),
                renderHTML: (attributes) => ({
                    'data-unique-key': attributes.uniqueKey,
                }),
            },
            // Sizes the caret around the custom node; every custom node needs it
            isCustomSlot: AIChatInput.getCustomSlotAttribute(),
        };
    },
    parseHTML() {
        return [
            {
                tag: 'refer-slot',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['refer-slot', mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
        return ReactNodeViewRenderer(ReferSlotComponent);
    },
});

interface ReferSlotAttrs {
    value: string;
    info: string;
    type?: string;
    uniqueKey: string;
}

const updatePosition = (editor: Editor, element: HTMLElement) => {
    const virtualElement = {
        getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
    };
    void computePosition(virtualElement, element, {
        placement: 'bottom-start',
        strategy: 'absolute',
        middleware: [shift()],
    }).then(({ x, y, strategy }) => {
        element.style.width = 'max-content';
        element.style.position = strategy;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    });
};

type MentionSuggestion = MentionOptions['suggestion'];
type MentionStartProps = Parameters<NonNullable<ReturnType<NonNullable<MentionSuggestion['render']>>['onStart']>>[0];

// Content the panel returns through command, not limited to Mention's own attributes
interface MentionCommandProps extends Partial<MentionNodeAttrs> {
    item?: PanelItem;
    allowHotKeySend?: boolean;
}

interface MentionListHandle {
    onKeyDown: (props: { event: KeyboardEvent; exitCb?: () => void }) => boolean;
}

interface MentionListProps extends Omit<MentionStartProps, 'command'> {
    ref?: Ref<MentionListHandle>;
    command: (props: MentionCommandProps) => void;
}

const suggestion: MentionSuggestion = {
    items: () => FirstLevel,
    command: ({ editor, range, props }) => {
        const { item, allowHotKeySend } = props as MentionCommandProps;
        if (typeof allowHotKeySend === 'boolean') {
            // AIChatInput registers its state under the extension name, which tiptap's Storage type does not know
            (editor.storage as Record<string, { allowHotKeySend: boolean }>).SemiAIChatInput.allowHotKeySend = allowHotKeySend;
        }
        if (item) {
            editor
                .chain()
                .focus()
                .insertContentAt(range, {
                    type: 'referSlot',
                    attrs: {
                        type: item.type,
                        value: item.name || '',
                        info: JSON.stringify({ path: item.path }),
                        uniqueKey: item.key,
                    },
                })
                .run();
        }
    },
    render: () => {
        let component: ReactRenderer<MentionListHandle, MentionListProps>;
        return {
            onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });
                if (!props.clientRect) return;
                component.element.style.position = 'absolute';
                document.body.appendChild(component.element);
                updatePosition(props.editor, component.element);
            },
            onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                updatePosition(props.editor, component.element);
            },
            onKeyDown(props) {
                function onExit() {
                    component.destroy();
                }
                return component.ref?.onKeyDown({ ...props, exitCb: onExit }) ?? false;
            },
            onExit() {
                component.element.remove();
                component.destroy();
            },
        };
    },
};

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

function MentionList({ ref, command, query, editor }: MentionListProps) {
    const [level, setLevel] = useState(1);
    const [options, setOptions] = useState<(string | PanelItem)[]>(FirstLevel);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filterInput, setFilterInput] = useState({ options, query });

    const filterOptions = query
        ? options.filter((item) => {
              const name = typeof item === 'string' ? item : item.name;
              return name.toLowerCase().includes(query.toLowerCase());
          })
        : options;

    if (filterInput.options !== options || filterInput.query !== query) {
        setFilterInput({ options, query });
        setSelectedIndex(0);
    }

    useEffect(() => {
        // While the panel is open, Enter belongs to it, not to AIChatInput's send
        command({ allowHotKeySend: false });
        return () => command({ allowHotKeySend: true });
    }, [command]);

    const selectItem = (item: string | PanelItem) => {
        if (typeof item === 'string') {
            setLevel(2);
            setOptions(TestAction[item]);
        } else {
            command({ item });
        }
    };

    const onItemClick = (item: string | PanelItem) => {
        selectItem(item);
        // Clicking an option blurs the editor, so return focus after entering the second level
        if (level === 1) {
            editor.commands.focus();
        }
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event, exitCb }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + filterOptions.length - 1) % filterOptions.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % filterOptions.length);
                return true;
            }
            if (event.key === 'Enter') {
                const item = filterOptions[selectedIndex];
                if (item) {
                    selectItem(item);
                }
                return true;
            }
            if (event.key === 'Escape') {
                if (level === 1) {
                    exitCb?.();
                } else {
                    setLevel(1);
                    setOptions(FirstLevel);
                }
                return true;
            }
            return false;
        },
    }));

    return (
        <div role="menu" className="ai-chat-input-custom-extension-dropdown-menu" style={{ width: level === 1 ? 200 : 300 }}>
            {filterOptions.length ? (
                filterOptions.map((item, index) => (
                    <div
                        key={index}
                        role="menuitem"
                        tabIndex={-1}
                        className={index === selectedIndex ? 'is-selected optionItem' : 'optionItem '}
                        onClick={() => onItemClick(item)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onItemClick(item);
                            }
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        {typeof item === 'string' ? (
                            <span>{item}</span>
                        ) : (
                            <div className="level2Item">
                                {item.icon}
                                <span className="name">{item.name}</span>
                                <span className="path">{item.path}</span>
                            </div>
                        )}
                        {level === 1 && <IconChevronRight className="option-item-arrow" />}
                    </div>
                ))
            ) : (
                <div className="item">No result</div>
            )}
        </div>
    );
}

function isImageType(item: Attachment) {
    const PIC_PREFIX = 'image/';
    const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
    const { name = '', fileInstance } = item;
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
    const extensions = useMemo(() => {
        return [
            ReferSlot,
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
                suggestion,
            }),
        ];
    }, []);
    const renderTopSlot = useCallback(({ attachments = [], references = [], content = [] }: RenderTopSlotProps) => {
        const showContent = content.filter((item) => item.type !== 'text');
        return (
            <div className="ai-chat-input-topSlot">
                {showContent.map((item, index) => {
                    const { type, value, name, key, detail } = item;
                    const icon = refTypeToIconMap.get(type);
                    return (
                        <div className="item" key={key ? key : index}>
                            <span className="item-icon">
                                {icon && React.cloneElement(icon, { className: 'item-left item-icon' })}
                                <button
                                    type="button"
                                    className="item-icon-delete"
                                    aria-label="删除"
                                    onClick={() => {
                                        if (ref.current && ref.current.deleteContent) {
                                            ref.current.deleteContent(item);
                                        }
                                    }}
                                >
                                    <IconClose size="small" />
                                </button>
                            </span>
                            <span className="item-content">
                                {name ? name : value}
                                {type === 'branch' && <span className="detail">{detail}</span>}
                            </span>
                        </div>
                    );
                })}
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
                                        if (ref.current && ref.current.deleteUploadFile) {
                                            ref.current.deleteUploadFile(item);
                                        }
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
    const onContentChange = useCallback((content: Content[]) => {
        console.log('onContentChange', content);
    }, []);
    const transformer = useMemo(() => {
        return new Map([
            [
                'referSlot',
                ({ attrs }: { attrs: ReferSlotAttrs }) => {
                    const { value, info, type = 'text', uniqueKey } = attrs;
                    return {
                        type: type,
                        value: value,
                        uniqueKey: uniqueKey,
                        ...JSON.parse(info),
                    };
                },
            ],
        ]);
    }, []);
    return (
        <>
            <AIChatInput
                className="aiChatInput-customTopSlot"
                renderTopSlot={renderTopSlot}
                extensions={extensions}
                references={reference}
                showUploadFile={false}
                showReference={false}
                onContentChange={onContentChange}
                ref={ref}
                transformer={transformer}
                uploadProps={uploadProps}
                style={outerStyle}
                placeholder="使用 @ 触发"
            />
        </>
    );
}
