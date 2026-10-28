<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-vue';
    import { IconBriefStroked, IconCodeStroked, IconSearchStroked } from '@fibrae/semi-icons-vue';

    // A type alias, not an interface: only an alias is assignable to the step action's index signature
    type PlanStep = {
        type?: string;
        summary?: string;
        description?: string;
    };

    interface PlanItem {
        summary: string;
        steps?: PlanStep[];
    }

    const defaultMessages: Message[] = [
        {
            role: 'assistant',
            id: '1',
            createdAt: 1715676751919,
            content: '普通文本',
        },
        {
            id: '2',
            role: 'user',
            content: [
                {
                    type: 'message',
                    content: [
                        {
                            type: 'input_text',
                            text: '帮我生成类似的图片',
                        },
                        {
                            type: 'input_image',
                            image_url: '/assets/root-web-sites/edit-bag.jpeg',
                            file_id: 'demo-file-id',
                        },
                        {
                            type: 'input_text',
                            text: '以下是文件展示',
                        },
                        {
                            type: 'input_file',
                            file_url: 'https://www.semi.pdf',
                            filename: 'semi.pdf',
                            size: '100KB',
                        },
                        {
                            type: 'input_file',
                            file_url: 'https://www.semi.json',
                            filename: 'semi.json',
                            size: '100KB',
                        },
                        {
                            type: 'input_file',
                            file_url: 'https://www.semi.docx',
                            filename: 'semi.docx',
                            size: '100KB',
                        },
                    ],
                },
            ],
            status: 'completed',
        },
        {
            id: '3',
            role: 'assistant',
            content: [
                {
                    type: 'reasoning',
                    status: 'completed',
                    summary: [
                        {
                            type: 'summary_text',
                            text: '\n我需要思考并回答用户关于什么是 Semi 组件库的问题...',
                        },
                    ],
                },
                {
                    type: 'message',
                    content: [
                        {
                            type: 'output_text',
                            text: 'Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统。',
                        },
                    ],
                    status: 'completed',
                },
                {
                    id: 'fc_12345xyz',
                    call_id: 'call_12345xyz',
                    type: 'function_call',
                    name: 'get_weather',
                    status: 'completed',
                    arguments: "{'location':'Paris, France'}",
                },
                {
                    type: 'message',
                    content: [
                        {
                            type: 'output_text',
                            text: '恭喜你，你已经掌握了 semi design 的所有知识！',
                            annotations: [
                                {
                                    title: 'semi.design',
                                    url: 'https://semi.design/',
                                    detail: 'semi design page',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                                {
                                    title: 'semi.design',
                                    url: 'https://semi.design/',
                                    detail: 'semi design page',
                                    logo: '/assets/placeholder/logo.svg',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'plan',
                    content: [
                        {
                            summary: '创建一份全面的北京旅游攻略，包含景点、住宿、交通、美食和实用旅行建议',
                            steps: [
                                {
                                    summary: '搜索北京旅游景点介绍及门票信息',
                                    description: '正在搜索: 北京旅游景点介绍及门票信息',
                                    type: 'search',
                                },
                                {
                                    summary: '读取指定文件的指定行内容',
                                    description: '正在创建文档:  北京旅游攻略',
                                    type: 'docs',
                                },
                                {
                                    summary: '创建包含北京旅游攻略的文件',
                                    description: '正在创建代码文件: beijing_travel_guide.html',
                                    type: 'code',
                                },
                            ],
                        },
                        {
                            summary: '总结北京旅游攻略的创建成果并呈现给用户',
                            steps: [],
                        },
                    ],
                },
            ],
            status: 'completed',
        },
    ];

    const roleConfig = {
        user: {
            name: 'User',
            avatar: '/assets/docs-icon.png',
        },
        assistant: {
            name: 'Assistant',
            avatar: '/assets/placeholder/logo.svg',
        },
        system: {
            name: 'System',
            avatar: '/assets/placeholder/logo.svg',
        },
    };

    const messages = shallowRef(defaultMessages);

    // plan is a user-defined content type; its icons come from the #actionIcon slot, so the steps carry data only
    const toSteps = (item: unknown) =>
        (item as { content: PlanItem[] }).content.map((plan) => ({
            summary: plan.summary,
            actions: plan.steps ?? [],
            status: 'completed',
        }));
</script>

<template>
    <AIChatDialogue v-model:chats="messages" :roleConfig="roleConfig">
        <template #contentItem="{ item, type }">
            <AIChatDialogue.Step v-if="type === 'plan'" :steps="toSteps(item)">
                <template #actionIcon="{ item: action }">
                    <IconSearchStroked v-if="action.type === 'search'" />
                    <IconBriefStroked v-else-if="action.type === 'docs'" />
                    <IconCodeStroked v-else-if="action.type === 'code'" />
                </template>
            </AIChatDialogue.Step>
        </template>
    </AIChatDialogue>
</template>
