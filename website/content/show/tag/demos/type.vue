<script setup lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { Space, Tag, type TagType } from '@fibrae/semi-ui-vue';

    const types: [TagType, string][] = [
        ['light', 'Light'],
        ['ghost', 'Ghost'],
        ['solid', 'Solid'],
    ];
</script>

<template>
    <Space wrap>
        <template v-for="[type, label] in types" :key="type">
            <Tag color="light-blue" shape="circle" size="large" :type="type">
                <template #prefixIcon>
                    <IconGithubLogo />
                </template>
                Semi Design {{ label }} Tag
            </Tag>
            <Tag color="cyan" shape="circle" size="large" :type="type">
                D2C: figma to code in one click
                <template #suffixIcon>
                    <IconSemiLogo />
                </template>
            </Tag>
        </template>
    </Space>
</template>
