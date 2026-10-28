<script setup lang="ts">
    import { IconAIFilledLevel1, IconAIFilledLevel3 } from '@fibrae/semi-icons-vue';
    import { Tag } from '@fibrae/semi-ui-vue';

    const grid = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridGap: '10px', width: 'fit-content' };
</script>

<template>
    <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '30px' }">
        <div :style="grid">
            <Tag colorful gradient shape="circle" type="solid">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful gradient shape="circle" type="light">
                <template #prefixIcon>
                    <IconAIFilledLevel3 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful gradient shape="circle" type="ghost">
                <template #prefixIcon>
                    <IconAIFilledLevel3 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful shape="circle" type="solid">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful shape="circle" type="light">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful shape="circle" type="ghost">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
        </div>
        <div :style="grid">
            <Tag colorful gradient type="solid">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful gradient type="light">
                <template #prefixIcon>
                    <IconAIFilledLevel3 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful gradient type="ghost">
                <template #prefixIcon>
                    <IconAIFilledLevel3 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful type="solid">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful type="light">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
            <Tag colorful type="ghost">
                <template #prefixIcon>
                    <IconAIFilledLevel1 size="small" />
                </template>
                AI
            </Tag>
        </div>
    </div>
</template>
