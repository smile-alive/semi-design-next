<script setup lang="ts">
    import { ref, shallowRef, type Component } from 'vue';
    import { AIChatDialogue, AIChatInput, chatInputToMessage, type AIChatDialogueAnnotation as Annotation, type AIChatDialogueMessage as Message, type AIChatInputMessageContent as MessageContent, type AIChatInputReference as Reference, type AnnotationItemProps } from '@fibrae/semi-ai-vue';
    import { IconBookOpenStroked, IconClose, IconGit, IconSearch, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-vue';
    import { Button, Typography } from '@fibrae/semi-ui-vue';
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
                                    url: 'https://semi-design-next.pages.dev/zh-CN/vue/start/getting-started',
                                    detail: 'Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。作为一个全面、易用、优质的现代应用UI解决方案',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                                {
                                    title: 'Semi Design Next 主题',
                                    url: 'https://semi-design-next.pages.dev/zh-CN/vue/start/getting-started',
                                    detail: 'Semi Design Next 用 --semi-* 变量定制主题，支持全局、组件级别的样式定制，将 Semi Design 适配为 Any Design',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                                {
                                    title: 'Semi 设计稿',
                                    url: 'https://semi-design-next.pages.dev/zh-CN/vue/start/getting-started',
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

    const inputOuterStyle = { margin: '12px', minHeight: '150px', maxHeight: '300px', flexShrink: 0 };
    const editingInputOuterStyle = { margin: '12px 0px', maxHeight: '300px', flexShrink: 0 };
    const dialogueOuterStyle = { flex: 1, overflow: 'auto' };

    const sideBarVisible = ref(false);
    const messages = shallowRef(defaultMessages);
    const generating = ref(false);
    const references = shallowRef<Reference[]>([]);
    const sideBarContent = shallowRef<SideBarContent>({});

    const onReferenceClick = (item: Partial<Reference>) => {
        references.value = [...references.value, { ...item, id: `reference-${Date.now()}` }];
    };

    const handleReferenceDelete = (item: Reference) => {
        references.value = references.value.filter((ref) => ref.id !== item.id);
    };

    const onMessageSend = (content: MessageContent) => {
        generating.value = true;
        messages.value = [...messages.value, { id: `message-${Date.now()}`, ...chatInputToMessage(content) }];
        references.value = [];
        setTimeout(() => {
            generating.value = false;
        }, 100);
        setTimeout(() => {
            messages.value = [
                ...messages.value,
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
        const index = messages.value.findIndex((message) => message.editing);
        messages.value = [...messages.value.slice(0, index), { id: `message-${Date.now()}`, ...chatInputToMessage(content) }];
    };

    const handleEditingReferenceDelete = (item: Reference) => {
        messages.value = messages.value.map((message) => (message.editing ? { ...message, references: message.references?.filter((ref) => ref.id !== item.id) } : message));
    };

    const changeSideBarContent = (content: SideBarContent) => {
        sideBarVisible.value = simpleIsEqual(content, sideBarContent.value) ? !sideBarVisible.value : true;
        sideBarContent.value = content;
    };

    const onAnnotationClick = (annotations: Annotation[]) => {
        changeSideBarContent({ type: 'annotation', value: annotations });
    };

    const resourceOf = (item: unknown) => item as { name: string };
</script>

<template>
    <div :style="{ display: 'flex', columnGap: '10px' }">
        <div
            :style="{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 32px)',
                overflow: 'hidden',
                flexGrow: 1,
            }"
        >
            <AIChatDialogue v-model:chats="messages" align="leftRight" mode="bubble" :roleConfig="roleConfig" showReference :style="dialogueOuterStyle" @annotationClick="onAnnotationClick" @referenceClick="onReferenceClick">
                <template #messageEdit="content">
                    <AIChatInput
                        :defaultContent="content.inputContents?.[0].text"
                        :generating="false"
                        :references="content.references"
                        :style="editingInputOuterStyle"
                        :uploadProps="{ ...uploadProps, defaultFileList: content.attachments }"
                        @messageSend="onEditMessageSend"
                        @referenceDelete="handleEditingReferenceDelete"
                    >
                        <template #configureArea>
                            <AIChatInput.Configure.Select field="model" initValue="GPT-4o" :optionList="modelOptions" />
                            <AIChatInput.Configure.Button field="onlineSearch">
                                <template #icon>
                                    <IconBookOpenStroked />
                                </template>
                                联网搜索
                            </AIChatInput.Configure.Button>
                            <AIChatInput.Configure.Mcp :options="mcpOptions">
                                <template #optionIcon="iconArgs">
                                    <component :is="mcpIcons[iconArgs.item.value]" />
                                </template>
                            </AIChatInput.Configure.Mcp>
                            <AIChatInput.Configure.RadioButton field="thinkType" initValue="think" :options="radioButtonProps">
                                <template #label="labelArgs">
                                    <IconTemplateStroked v-if="labelArgs.option.value === 'fast'" :aria-label="labelArgs.option.label" />
                                    <IconSearch v-else :aria-label="labelArgs.option.label" />
                                </template>
                            </AIChatInput.Configure.RadioButton>
                        </template>
                    </AIChatInput>
                </template>
                <template #contentItem="dialogueItem">
                    <button
                        v-if="dialogueItem.type === 'resource'"
                        :style="{
                            display: 'flex',
                            gap: '8px',
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
                        }"
                        type="button"
                        @click="changeSideBarContent({ type: 'resource', value: resourceOf(dialogueItem.item) })"
                    >
                        <IconWord :style="{ color: 'var(--semi-color-primary)' }" />
                        {{ resourceOf(dialogueItem.item).name }}
                    </button>
                </template>
            </AIChatDialogue>
            <AIChatInput
                defaultContent='我是一名<input-slot placeholder="[职业]">程序员</input-slot>，帮我实现<input-slot placeholder="[需求描述]">Multi Agent 场景下的聊天应用</input-slot>需求'
                :generating="generating"
                placeholder="输入内容或者上传内容"
                :references="references"
                :style="inputOuterStyle"
                :uploadProps="uploadProps"
                @messageSend="onMessageSend"
                @referenceDelete="handleReferenceDelete"
                @stopGenerate="generating = false"
            >
                <template #configureArea>
                    <AIChatInput.Configure.Select field="model" initValue="GPT-4o" :optionList="modelOptions" />
                    <AIChatInput.Configure.Button field="onlineSearch">
                        <template #icon>
                            <IconBookOpenStroked />
                        </template>
                        联网搜索
                    </AIChatInput.Configure.Button>
                    <AIChatInput.Configure.Mcp :options="mcpOptions">
                        <template #optionIcon="iconArgs">
                            <component :is="mcpIcons[iconArgs.item.value]" />
                        </template>
                    </AIChatInput.Configure.Mcp>
                    <AIChatInput.Configure.RadioButton field="thinkType" initValue="think" :options="radioButtonProps">
                        <template #label="labelArgs">
                            <IconTemplateStroked v-if="labelArgs.option.value === 'fast'" :aria-label="labelArgs.option.label" />
                            <IconSearch v-else :aria-label="labelArgs.option.label" />
                        </template>
                    </AIChatInput.Configure.RadioButton>
                </template>
            </AIChatInput>
        </div>
        <div
            v-if="sideBarVisible"
            :style="{
                width: '300px',
                height: 'calc(100vh - 32px)',
                borderRadius: '12px',
                border: '1px solid var(--semi-color-border)',
                flexShrink: 0,
            }"
        >
            <div
                :style="{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    color: 'var(--semi-color-text)',
                }"
            >
                <div v-if="sideBarContent.type === 'annotation'" :style="{ fontSize: '16px', lineHeight: '22px', fontWeight: 600 }">参考资料</div>
                <div v-if="sideBarContent.type === 'resource'" :style="{ fontSize: '16px', lineHeight: '22px', fontWeight: 600 }">产物列表</div>
                <Button aria-label="关闭" :style="{ padding: '0px', width: '24px', height: '24px' }" theme="borderless" type="tertiary" @click="sideBarVisible = !sideBarVisible">
                    <template #icon>
                        <IconClose />
                    </template>
                </Button>
            </div>
            <div v-if="sideBarContent.type === 'annotation'" :style="{ display: 'flex', flexDirection: 'column', rowGap: '12px', padding: '12px' }">
                <div v-for="(item, index) in sideBarContent.value" :key="index" :style="{ display: 'flex', flexDirection: 'column', rowGap: '8px' }">
                    <span :style="{ display: 'flex', alignItems: 'center', columnGap: '4px' }">
                        <img alt="" :src="item.logo" :style="{ width: '20px', height: '20px', borderRadius: '50%' }" />
                        <span
                            :style="{
                                fontSize: '14px',
                                lineHeight: '20px',
                                fontWeight: 600,
                                color: 'var(--semi-color-text-0)',
                            }"
                        >
                            {{ item.title }}
                        </span>
                    </span>
                    <Typography.Paragraph :ellipsis="{ rows: 3 }" :style="{ fontSize: '12px', lineHeight: '16px', color: 'var(--semi-color-text-1)' }">
                        {{ item.detail }}
                    </Typography.Paragraph>
                </div>
            </div>
            <div v-else-if="sideBarContent.type === 'resource'" :style="{ display: 'flex', flexDirection: 'column', rowGap: '12px', padding: '12px' }">
                <div :style="{ display: 'flex', gap: '12px', alignItems: 'center' }">
                    <IconWord size="extra-large" :style="{ color: 'var(--semi-color-primary)' }" />
                    {{ sideBarContent.value.name }}
                </div>
            </div>
        </div>
    </div>
</template>
