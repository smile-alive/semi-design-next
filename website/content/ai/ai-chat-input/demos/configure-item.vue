<script setup lang="ts">
    import { AIChatInput, getConfigureItem, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-vue';
    import { Cascader } from '@fibrae/semi-ui-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const cascaderModalOptions = [
        {
            label: 'GPT',
            value: 'GPT',
            children: [
                { label: 'GPT-4o', value: 'GPT-4o' },
                { value: 'GPT-5', label: 'GPT-5' },
            ],
        },
        {
            label: 'Claude',
            value: 'Claude',
            children: [{ label: 'Claude 3.5 Sonnet', value: 'Claude 3.5 Sonnet' }],
        },
    ];

    const CustomCascader = getConfigureItem(Cascader, {
        className: 'aiChatInput-cascader-configure',
    });

    const onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        console.log('onConfigureChange', value, changedValue);
    };
</script>

<template>
    <AIChatInput placeholder="用于查看左下方配置项的用例" style="margin: 12px" :uploadProps="uploadProps" @configureChange="onConfigureChange">
        <template #configureArea>
            <CustomCascader field="model" :initValue="['GPT', 'GPT-4o']" :treeData="cascaderModalOptions" />
        </template>
    </AIChatInput>
</template>
