<script setup lang="ts">
    import { shallowRef, useTemplateRef, type Component } from 'vue';
    import { MCPConfigure, type MCPConfigureOption } from '@fibrae/semi-ai-vue';
    import { IconFigma, IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { Button, Form, FormInput, FormTextArea, Modal, type FormHandle } from '@fibrae/semi-ui-vue';

    interface McpFormValues {
        name: string;
        src: string;
        desc: string;
    }

    const containerStyle = {
        display: 'flex',
        height: '500px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
    } as const;

    // icon only takes an image URL, so the built-in options get their icons from the #icon slot
    const builtinIcons: Record<string, Component> = {
        'Semi mcp': IconSemiLogo,
        figma: IconFigma,
    };

    const srcRules = [
        { required: true, message: '请输入 MCP 图标 URL' },
        {
            validator: (_rule: unknown, value: string) => /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?::\d+)?(?:\/[^\s]*)?$/i.test(value),
            message: '请输入有效的 MCP 图标 URL',
        },
    ];

    let index = 1;

    const visible = shallowRef(true);
    const options = shallowRef<MCPConfigureOption[]>([
        {
            value: 'Semi mcp',
            label: 'Semi',
            configure: true,
            desc: '支持 Semi 的文档、源码搜索，辅助开发',
        },
        {
            value: 'figma',
            label: 'Figma',
            desc: 'Figma MCP Server 连接Figma与AI开发工具的功能。它通过标准化的模型上下文协MCP），将组件、变量等设计数据和上下文暴露给AI，从而实现从设计稿到代码的智能生成，显著提升开发效率。',
        },
    ]);
    const customOptions = shallowRef<MCPConfigureOption[]>([]);
    const modalVisible = shallowRef(false);
    const form = useTemplateRef<FormHandle<McpFormValues>>('form');

    const handleOk = () => {
        form.value?.formApi
            .validate()
            .then((values) => {
                customOptions.value = [
                    ...customOptions.value,
                    {
                        label: values.name,
                        icon: values.src,
                        value: `mcp-${index++}`,
                        desc: values.desc,
                    },
                ];
                modalVisible.value = false;
            })
            .catch((errors) => {
                console.log('errors', errors);
            });
    };

    const onConfigureClick = (_event: MouseEvent, option: MCPConfigureOption) => {
        console.log('configure click', option);
    };

    const onEditClick = (_event: MouseEvent, option: MCPConfigureOption) => {
        console.log('edit click', option);
    };
</script>

<template>
    <div :style="containerStyle">
        <div :style="{ flexGrow: 1, flexShrink: 1, padding: '20px' }">
            <Button :aria-pressed="visible" @click="visible = !visible">MCP 配置</Button>
        </div>
        <MCPConfigure v-model:customOptions="customOptions" v-model:options="options" v-model:visible="visible" :resizable="false" :style="{ width: '500px' }" @addClick="modalVisible = true" @configureClick="onConfigureClick" @editClick="onEditClick">
            <template #icon="{ item }">
                <img v-if="item.icon" alt="" :src="item.icon" :style="{ width: '100%', height: '100%' }" />
                <component :is="builtinIcons[item.value]" v-else />
            </template>
        </MCPConfigure>
        <Modal v-model:visible="modalVisible" closeOnEsc title="自定义 MCP" @ok="handleOk">
            <Form ref="form" layout="vertical" @valueChange="(values) => console.log(values)">
                <FormInput field="name" label="MCP 名称" :rules="[{ required: true, message: '请输入 MCP 名称' }]" :style="{ width: '100%' }" />
                <FormInput field="src" initValue="/assets/placeholder/avatar-a.svg" label="MCP 图标 URL" :rules="srcRules" :style="{ width: '100%' }" />
                <FormTextArea field="desc" label="MCP 介绍" :rules="[{ required: true, message: '请输入 MCP 介绍' }]" :style="{ width: '100%' }" />
            </Form>
        </Modal>
    </div>
</template>
