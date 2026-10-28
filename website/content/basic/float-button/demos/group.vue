<script setup lang="ts">
    import { IconAIStrokedLevel3, IconHelpCircleStroked, IconSearchStroked } from '@fibrae/semi-icons-vue';
    import { FloatButtonGroup } from '@fibrae/semi-ui-vue';

    const icons = [IconAIStrokedLevel3, IconSearchStroked, IconHelpCircleStroked];

    const items = [
        { content: '编辑', value: 'editor' },
        { content: '搜索', value: 'search', disabled: true },
        { content: '帮助', value: 'help', href: 'https://semi.design', target: '_blank' },
    ];

    const onClick = (value?: string) => {
        console.log('点击了 ', value);
    };
</script>

<template>
    <span>页面右下方最后一行</span>
    <FloatButtonGroup :items="items" style="inset-inline-end: 24px; bottom: 50px" @click="onClick">
        <template #icon="{ index }">
            <component :is="icons[index]" />
        </template>
    </FloatButtonGroup>
</template>
