import { useState, useCallback } from 'react';
import {
    AIChatDialogue,
    AIChatInput,
    chatInputToMessage,
    type AIChatDialogueMessage as Message,
    type AIChatDialogueAnnotation as Annotation,
    type AIChatInputMessageContent as MessageContent,
    type AIChatInputReference as Reference,
    type AnnotationItemProps,
    type DialogueContentItemRendererMap,
} from '@fibrae/semi-ai-react';
import { IconFeishuLogo, IconBookOpenStroked, IconGit, IconFigma, IconWord, IconClose, IconTemplateStroked, IconSearch } from '@fibrae/semi-icons-react';
import { Typography, Button } from '@fibrae/semi-ui-react';

const { Configure } = AIChatInput;

type SideBarContent = { type?: undefined; value?: undefined } | { type: 'annotation'; value: AnnotationItemProps[] } | { type: 'resource'; value: { name: string } };

const simpleIsEqual = (a: unknown, b: unknown) => {
    if (a === b) {
        return true;
    }
    if (Number.isNaN(a) && Number.isNaN(b)) {
        return true;
    }
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return false;
    }
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);
    if (isArrayA !== isArrayB) {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
            return false;
        }
        if (!simpleIsEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
            return false;
        }
    }
    return true;
};

const inputOuterStyle = { margin: '12px', minHeight: 150, maxHeight: 300, flexShrink: 0 };
const editingInputOuterStyle = { margin: '12px 0px', maxHeight: 300, flexShrink: 0 };
const dialogueOuterStyle = { flex: 1, overflow: 'auto' };

export default function AIComponentDemo() {
    const [sideBarVisible, setSideBarVisible] = useState(false);
    const [messages, setMessages] = useState(defaultMessages);
    const [generating, setGenerating] = useState(false);
    const [references, setReferences] = useState<Reference[]>([]);
    const [sideBarContent, setSideBarContent] = useState<SideBarContent>({});

    const renderLeftMenu = useCallback(
        () => (
            <>
                <Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
                <Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                    联网搜索
                </Configure.Button>
                <Configure.Mcp options={mcpOptions} />
                <Configure.RadioButton options={radioButtonProps} field="thinkType" initValue="think" />
            </>
        ),
        []
    );

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessages(chats);
    }, []);

    const onReferenceClick = useCallback((item: Partial<Reference>) => {
        setReferences((references) => [...references, { ...item, id: `reference-${Date.now()}` }]);
    }, []);

    const handleReferenceDelete = useCallback(
        (item: Reference) => {
            const newReference = references.filter((ref) => ref.id !== item.id);
            setReferences(newReference);
        },
        [references]
    );

    const onMessageSend = useCallback((props: MessageContent) => {
        setGenerating(true);
        setMessages((messages) => [
            ...messages,
            {
                id: `message-${Date.now()}`,
                ...chatInputToMessage(props),
            },
        ]);
        setReferences([]);
        setTimeout(() => {
            setGenerating(false);
        }, 100);
        setTimeout(() => {
            setMessages((messages) => {
                return [
                    ...messages,
                    {
                        id: `message-${Date.now()}`,
                        role: 'assistant',
                        name: 'FE',
                        content: '这是一条 mock 回复信息',
                    },
                ];
            });
        }, 1000);
    }, []);

    const onEditMessageSend = useCallback(
        (props: MessageContent) => {
            const index = messages.findIndex((message) => message.editing);
            const newMessages = [
                ...messages.slice(0, index),
                {
                    id: `message-${Date.now()}`,
                    ...chatInputToMessage(props),
                },
            ];
            setMessages(newMessages);
        },
        [messages]
    );

    const handleEditingReferenceDelete = useCallback(
        (item: Reference) => {
            const newMessages = messages.map((message) => (message.editing ? { ...message, references: message.references?.filter((ref) => ref.id !== item.id) } : message));
            setMessages(newMessages);
        },
        [messages]
    );

    const messageEditRender = useCallback(
        (props: MessageContent) => {
            return (
                <AIChatInput
                    style={editingInputOuterStyle}
                    generating={false}
                    references={props.references}
                    uploadProps={{ ...uploadProps, defaultFileList: props.attachments }}
                    defaultContent={props.inputContents?.[0].text}
                    renderConfigureArea={renderLeftMenu}
                    onMessageSend={onEditMessageSend}
                    onReferenceDelete={handleEditingReferenceDelete}
                />
            );
        },
        [renderLeftMenu, onEditMessageSend, handleEditingReferenceDelete]
    );

    const changeSideBarContent = useCallback((content: SideBarContent) => {
        setSideBarContent((oldContent) => {
            if (!simpleIsEqual(content, oldContent)) {
                setSideBarVisible(true);
            } else {
                setSideBarVisible((v) => !v);
            }
            return content;
        });
    }, []);

    const onAnnotationClick = useCallback(
        (annotations: Annotation[]) => {
            changeSideBarContent({
                type: 'annotation',
                value: annotations,
            });
        },
        [changeSideBarContent]
    );

    const toggleSideBar = useCallback(() => {
        setSideBarVisible((v) => !v);
    }, []);

    const renderSideBarTitle = useCallback(
        ({ type }: SideBarContent) => {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center ',
                        justifyContent: 'space-between',
                        padding: 12,
                        color: 'var(--semi-color-text)',
                    }}
                >
                    {type === 'annotation' && <div style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600 }}>参考资料</div>}
                    {type === 'resource' && <div style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600 }}>产物列表</div>}
                    <Button onClick={toggleSideBar} theme="borderless" type="tertiary" aria-label="关闭" icon={<IconClose />} style={{ padding: '0px', width: 24, height: 24 }} />
                </div>
            );
        },
        [toggleSideBar]
    );

    const renderSideBarBody = useCallback((content: SideBarContent) => {
        if (content.type === 'annotation') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: '12px', padding: '12px' }}>
                    {content.value.map((item, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', rowGap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center ', columnGap: 4 }}>
                                <img style={{ width: 20, height: 20, borderRadius: '50%' }} src={item.logo} alt="" />
                                <span
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        fontWeight: 600,
                                        color: 'var(--semi-color-text-0)',
                                    }}
                                >
                                    {item.title}
                                </span>
                            </span>
                            <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ fontSize: '12px', lineHeight: '16px', color: 'var(--semi-color-text-1)' }}>
                                {item.detail}
                            </Typography.Paragraph>
                        </div>
                    ))}
                </div>
            );
        } else if (content.type === 'resource') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <IconWord style={{ color: 'var(--semi-color-primary)' }} size="extra-large" /> {content.value.name}
                    </div>
                </div>
            );
        }
        return <div />;
    }, []);

    const customRender: DialogueContentItemRendererMap = {
        resource: (item) => {
            return (
                <button
                    type="button"
                    style={{
                        display: 'flex',
                        gap: 8,
                        width: '100%',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        border: 'none',
                        padding: '12px 16px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '12px',
                        color: 'inherit',
                        font: 'inherit',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        changeSideBarContent({
                            type: 'resource',
                            value: item,
                        });
                    }}
                >
                    <IconWord style={{ color: 'var(--semi-color-primary)' }} />
                    {item.name}
                </button>
            );
        },
    };

    return (
        <div style={{ display: 'flex', columnGap: 10 }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 32px)',
                    overflow: 'hidden',
                    flexGrow: 1,
                }}
            >
                <AIChatDialogue
                    style={dialogueOuterStyle}
                    roleConfig={roleConfig}
                    showReference
                    align="leftRight"
                    mode="bubble"
                    chats={messages}
                    onChatsChange={onChatsChange}
                    onReferenceClick={onReferenceClick}
                    messageEditRender={messageEditRender}
                    onAnnotationClick={onAnnotationClick}
                    renderDialogueContentItem={customRender}
                />
                <AIChatInput
                    style={inputOuterStyle}
                    placeholder="输入内容或者上传内容"
                    defaultContent='我是一名<input-slot placeholder="[职业]">程序员</input-slot>，帮我实现<input-slot placeholder="[需求描述]">Multi Agent 场景下的聊天应用</input-slot>需求'
                    generating={generating}
                    references={references}
                    uploadProps={uploadProps}
                    renderConfigureArea={renderLeftMenu}
                    onMessageSend={onMessageSend}
                    onStopGenerate={() => setGenerating(false)}
                    onReferenceDelete={handleReferenceDelete}
                />
            </div>
            {sideBarVisible && (
                <div
                    style={{
                        width: 300,
                        height: 'calc(100vh - 32px)',
                        borderRadius: '12px',
                        border: '1px solid var(--semi-color-border)',
                        flexShrink: 0,
                    }}
                >
                    {renderSideBarTitle(sideBarContent)}
                    {renderSideBarBody(sideBarContent)}
                </div>
            )}
        </div>
    );
}

const defaultMessages: Message[] = [
    {
        id: '1',
        role: 'user',
        content: '我想开发一个 Multi Agent 场景下的聊天应用，你能帮我设计一下吗？',
        status: 'completed',
    },
    {
        id: '2',
        role: 'assistant',
        name: 'PM',
        content: [
            {
                type: 'message',
                content: [
                    {
                        type: 'input_text',
                        text: '收到。为保证方案可落地，我先明确目标与范围：\n\n- 目标：支持多 Agent 协同回复，用户可选择 Agent 或由系统自动分配\n- MVP 功能：\n  1) 基础对话（文本/图片/文件）\n  2) Agent 身份标识与头像\n  3) 正在输入与流式输出\n  4) 引用来源与工具结果展示\n- 约束：先做单会话，不做云端持久化；优先移动端适配\n\n接下来我会整理 PRD 要点并同步给设计与前端。',
                        annotations: [
                            {
                                title: 'Semi Design',
                                url: 'https://semi.design/zh-CN/start/getting-started',
                                detail: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户',
                                logo: '/assets/placeholder/logo.svg',
                            },
                            {
                                title: 'Semi DSM',
                                url: 'https://semi.design/zh-CN/start/getting-started',
                                detail: 'Semi DSM 支持全局、组件级别的样式定制，并在 Figma 和线上代码之间保持同步。使用 DSM，将 Semi Design 适配为 Any Design',
                                logo: '/assets/placeholder/logo.svg',
                            },
                            {
                                title: 'Semi D2C',
                                url: 'https://semi.design/zh-CN/start/getting-started',
                                detail: 'Semi D2C 提供开箱即用的设计稿转代码：支持一键识别 Figma 页面中图层布局 + 设计系统组件，像素级还原设计稿，转译为 React JSX 和 CSS 代码。此外还提供了丰富的扩展能力，基于自定义插件系统快速打造团队专属的设计研发协作工具。',
                                logo: '/assets/placeholder/logo.svg',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: '3',
        role: 'assistant',
        name: 'PM',
        content: [
            {
                type: 'message',
                content: [
                    {
                        type: 'input_text',
                        text: '生成的PRD如下，设计师会先根据此摘要出信息架构与关键页面',
                    },
                    {
                        type: 'resource',
                        name: 'PRD.doc',
                        size: '100KB',
                    },
                ],
            },
        ],
    },
    {
        id: '4',
        role: 'assistant',
        name: 'UI',
        content: [
            {
                id: 'rs_02175871288540800000000000000000000ffffac1598778c9aa5',
                type: 'reasoning',
                summary: [
                    {
                        type: 'summary_text',
                        text: '\n根据产品经理给的 PRD 绘制关键页面，我需要....',
                    },
                ],
                status: 'completed',
            },
            {
                type: 'function_call',
                name: 'paint_key_pages',
                arguments: '{"file":"PRD"}',
                status: 'completed',
            },
            {
                type: 'message',
                content: [
                    {
                        type: 'output_text',
                        text: `设计初稿如下：\n\n- 信息架构：对话页（历史列表 | 消息流 | 工具卡片区）\n- 视觉：左侧展示 Agent 头像与名称标签，色块区分角色\n- 交互：\n  - 输入区支持 @Agent 快速切换与建议提示\n  - 流式输出时展示打字气泡与进度占位\n  - 工具结果以卡片/步骤条形式插入，可展开详情与复制\n\n我先出低保真线框，稍后补高保真与动效说明。`,
                    },
                ],
                status: 'completed',
            },
        ],
        status: 'completed',
    },
    {
        id: '5',
        role: 'assistant',
        name: 'FE',
        content: `技术方案建议：\n\n- 技术栈：React + Semi UI，后端采用 WebSocket 或 SSE 支持流式响应\n- 数据模型：消息包含 id、role、name、content、status、references 等字段\n- 组件拆分：AIChatInput + AIChatDialogue；内容采用 Markdown 渲染，支持图片与文件点击\n- 性能：虚拟列表与滚动置底；长文本分块渲染；图片懒加载\n- 可观测性：埋点消息延迟、出错率、工具调用耗时\n\n若确认，我可先搭建页面骨架并接入 mock 数据进行联调。`,
    },
];

const roleConfig = {
    user: {
        name: 'User',
        avatar: '/assets/ai/img/user.png',
    },
    assistant: new Map([
        [
            'PM',
            {
                name: '产品经理',
                avatar: '/assets/ai/PM.png',
            },
        ],
        [
            'UI',
            {
                name: '设计师',
                avatar: '/assets/ai/UI.png',
            },
        ],
        [
            'FE',
            {
                name: '前端开发',
                avatar: '/assets/ai/FE.png',
            },
        ],
    ]),
};

const uploadProps = {
    action: 'https://api.semi.design/upload',
};

const modelOptions = [
    {
        value: 'GPT-5',
        label: 'GPT-5',
        type: 'gpt',
    },
    {
        value: 'GPT-4o',
        label: 'GPT-4o',
        type: 'gpt',
    },
    {
        value: 'Claude 3.5 Sonnet',
        label: 'Claude 3.5 Sonnet',
        type: 'claude',
    },
];

const mcpOptions = [
    {
        icon: <IconFeishuLogo />,
        label: '飞书文档',
        value: 'feishu',
    },
    {
        icon: <IconGit />,
        label: 'Github Mcp',
        value: 'github',
    },
    {
        icon: <IconFigma />,
        label: 'IconFigma Mcp',
        value: 'IconFigma',
    },
];

const radioButtonProps = [
    { label: <IconTemplateStroked aria-label="快速" />, value: 'fast' },
    { label: <IconSearch aria-label="思考" />, value: 'think' },
];
