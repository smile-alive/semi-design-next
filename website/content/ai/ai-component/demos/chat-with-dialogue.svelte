<script lang="ts">
    import type { Component } from 'svelte';
    import { AIChatDialogue, AIChatInput, chatInputToMessage, type AIChatDialogueAnnotation as Annotation, type AIChatDialogueMessage as Message, type AIChatInputMessageContent as MessageContent, type AIChatInputReference as Reference, type AnnotationItemProps } from '@fibrae/semi-ai-svelte';
    import { IconBookOpenStroked, IconClose, IconGit, IconSearch, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-svelte';
    import { Button, Typography } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    type SideBarContent = { type?: undefined; value?: undefined } | { type: 'annotation'; value: AnnotationItemProps[] } | { type: 'resource'; value: { name: string } };

    function simpleIsEqual(a: unknown, b: unknown) {
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
            if (!Object.hasOwn(b, key)) {
                return false;
            }
            if (!simpleIsEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
                return false;
            }
        }
        return true;
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
                                    url: 'https://semi-design-next.pages.dev/zh-CN/svelte/start/getting-started',
                                    detail: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。作为一个全面、易用、优质的现代应用UI解决方案',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                                {
                                    title: 'Semi Design Next 主题',
                                    url: 'https://semi-design-next.pages.dev/zh-CN/svelte/start/getting-started',
                                    detail: 'Semi Design Next 用 --semi-* 变量定制主题，支持全局、组件级别的样式定制，将 Semi Design 适配为 Any Design',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                                {
                                    title: 'Semi 设计稿',
                                    url: 'https://semi-design-next.pages.dev/zh-CN/svelte/start/getting-started',
                                    detail: '一套组件，四个框架原生可用：React、Vue、Solid、Svelte 共用同一套 foundation 逻辑，各框架按自己的习惯使用，像素级还原设计稿。',
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
                    avatar: '/assets/ai/pm.png',
                },
            ],
            [
                'UI',
                {
                    name: '设计师',
                    avatar: '/assets/ai/ui.png',
                },
            ],
            [
                'FE',
                {
                    name: '前端开发',
                    avatar: '/assets/ai/fe.png',
                },
            ],
        ]),
    };

    const uploadProps = {
        action: '/upload',
        customRequest: mockUpload,
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
            label: '办公文档',
            value: 'office',
        },
        {
            label: 'Github Mcp',
            value: 'github',
        },
        {
            label: 'Design Mcp',
            value: 'design',
        },
    ];

    const mcpIcons: Record<string, Component> = {
        office: IconWord,
        github: IconGit,
        design: IconTemplateStroked,
    };

    const radioButtonProps = [
        { label: '快速', value: 'fast' },
        { label: '思考', value: 'think' },
    ];

    const defaultInput = '我是一名<input-slot placeholder="[职业]">程序员</input-slot>，帮我实现<input-slot placeholder="[需求描述]">Multi Agent 场景下的聊天应用</input-slot>需求';
    const inputOuterStyle = 'margin: 12px; min-height: 150px; max-height: 300px; flex-shrink: 0';
    const editingInputOuterStyle = 'margin: 12px 0px; max-height: 300px; flex-shrink: 0';

    let sideBarVisible = $state(false);
    let messages = $state.raw(defaultMessages);
    let generating = $state(false);
    let references = $state.raw<Reference[]>([]);
    let sideBarContent = $state.raw<SideBarContent>({});

    const onReferenceClick = (item: Partial<Reference>) => {
        references = [...references, { ...item, id: `reference-${Date.now()}` }];
    };

    const handleReferenceDelete = (item: Reference) => {
        references = references.filter((ref) => ref.id !== item.id);
    };

    const onMessageSend = (content: MessageContent) => {
        generating = true;
        messages = [...messages, { id: `message-${Date.now()}`, ...chatInputToMessage(content) }];
        references = [];
        setTimeout(() => {
            generating = false;
        }, 100);
        setTimeout(() => {
            messages = [
                ...messages,
                {
                    id: `message-${Date.now()}`,
                    role: 'assistant',
                    name: 'FE',
                    content: '这是一条 mock 回复信息',
                },
            ];
        }, 1000);
    };

    const onEditMessageSend = (content: MessageContent) => {
        const index = messages.findIndex((message) => message.editing);
        messages = [...messages.slice(0, index), { id: `message-${Date.now()}`, ...chatInputToMessage(content) }];
    };

    const handleEditingReferenceDelete = (item: Reference) => {
        messages = messages.map((message) => (message.editing ? { ...message, references: message.references?.filter((ref) => ref.id !== item.id) } : message));
    };

    const changeSideBarContent = (content: SideBarContent) => {
        sideBarVisible = simpleIsEqual(content, sideBarContent) ? !sideBarVisible : true;
        sideBarContent = content;
    };

    const onAnnotationClick = (annotations: Annotation[]) => {
        changeSideBarContent({ type: 'annotation', value: annotations });
    };

    const resourceOf = (item: unknown) => item as { name: string };
</script>

{#snippet configureArea()}
    <AIChatInput.Configure.Select field="model" initValue="GPT-4o" optionList={modelOptions} />
    <AIChatInput.Configure.Button field="onlineSearch">
        {#snippet icon()}
            <IconBookOpenStroked />
        {/snippet}
        联网搜索
    </AIChatInput.Configure.Button>
    <AIChatInput.Configure.Mcp options={mcpOptions}>
        {#snippet optionIcon(iconArgs)}
            {@const Icon = mcpIcons[iconArgs.item.value]}
            <Icon />
        {/snippet}
    </AIChatInput.Configure.Mcp>
    <AIChatInput.Configure.RadioButton field="thinkType" initValue="think" options={radioButtonProps}>
        {#snippet label(labelArgs)}
            {#if labelArgs.option.value === 'fast'}
                <IconTemplateStroked aria-label={String(labelArgs.option.label)} />
            {:else}
                <IconSearch aria-label={String(labelArgs.option.label)} />
            {/if}
        {/snippet}
    </AIChatInput.Configure.RadioButton>
{/snippet}

<div style="display: flex; column-gap: 10px">
    <div style="display: flex; flex-direction: column; height: calc(100vh - 32px); overflow: hidden; flex-grow: 1">
        <AIChatDialogue align="leftRight" bind:chats={messages} mode="bubble" {onAnnotationClick} {onReferenceClick} {roleConfig} showReference style="flex: 1; overflow: auto">
            {#snippet messageEdit(content)}
                <AIChatInput
                    {configureArea}
                    defaultContent={content.inputContents?.[0].text}
                    generating={false}
                    onMessageSend={onEditMessageSend}
                    onReferenceDelete={handleEditingReferenceDelete}
                    references={content.references}
                    style={editingInputOuterStyle}
                    uploadProps={{ ...uploadProps, defaultFileList: content.attachments }}
                />
            {/snippet}
            {#snippet contentItem(dialogueItem)}
                {#if dialogueItem.type === 'resource'}
                    <button
                        style="display: flex; gap: 8px; width: 100%; background-color: var(--semi-color-fill-0); border: none; padding: 12px 16px; justify-content: center; align-items: center; border-radius: 12px; color: inherit; font: inherit; cursor: pointer"
                        type="button"
                        onclick={() => changeSideBarContent({ type: 'resource', value: resourceOf(dialogueItem.item) })}
                    >
                        <IconWord style="color: var(--semi-color-primary)" />
                        {resourceOf(dialogueItem.item).name}
                    </button>
                {:else}
                    {@render dialogueItem.defaultItem()}
                {/if}
            {/snippet}
        </AIChatDialogue>
        <AIChatInput {configureArea} defaultContent={defaultInput} {generating} {onMessageSend} onReferenceDelete={handleReferenceDelete} onStopGenerate={() => (generating = false)} placeholder="输入内容或者上传内容" {references} style={inputOuterStyle} {uploadProps} />
    </div>
    {#if sideBarVisible}
        <div style="width: 300px; height: calc(100vh - 32px); border-radius: 12px; border: 1px solid var(--semi-color-border); flex-shrink: 0">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; color: var(--semi-color-text)">
                {#if sideBarContent.type === 'annotation'}
                    <div style="font-size: 16px; line-height: 22px; font-weight: 600">参考资料</div>
                {/if}
                {#if sideBarContent.type === 'resource'}
                    <div style="font-size: 16px; line-height: 22px; font-weight: 600">产物列表</div>
                {/if}
                <Button aria-label="关闭" style="padding: 0px; width: 24px; height: 24px" theme="borderless" type="tertiary" onclick={() => (sideBarVisible = !sideBarVisible)}>
                    {#snippet icon()}
                        <IconClose />
                    {/snippet}
                </Button>
            </div>
            {#if sideBarContent.type === 'annotation'}
                <div style="display: flex; flex-direction: column; row-gap: 12px; padding: 12px">
                    {#each sideBarContent.value as item, index (index)}
                        <div style="display: flex; flex-direction: column; row-gap: 8px">
                            <span style="display: flex; align-items: center; column-gap: 4px">
                                <img alt="" src={item.logo} style="width: 20px; height: 20px; border-radius: 50%" />
                                <span style="font-size: 14px; line-height: 20px; font-weight: 600; color: var(--semi-color-text-0)">
                                    {item.title}
                                </span>
                            </span>
                            <Typography.Paragraph ellipsis={{ rows: 3 }} style="font-size: 12px; line-height: 16px; color: var(--semi-color-text-1)">
                                {item.detail}
                            </Typography.Paragraph>
                        </div>
                    {/each}
                </div>
            {:else if sideBarContent.type === 'resource'}
                <div style="display: flex; flex-direction: column; row-gap: 12px; padding: 12px">
                    <div style="display: flex; gap: 12px; align-items: center">
                        <IconWord size="extra-large" style="color: var(--semi-color-primary)" />
                        {sideBarContent.value.name}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
