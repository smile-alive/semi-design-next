<script setup lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { Space, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Space wrap>
        <Tag color="light-blue" shape="circle" size="large" type="light">
            <template #prefixIcon>
                <IconGithubLogo />
            </template>
            Semi Design Light Tag
        </Tag>
        <Tag color="cyan" shape="circle" size="large" type="light">
            Semi: one component library for four frameworks
            <template #suffixIcon>
                <IconSemiLogo />
            </template>
        </Tag>
        <Tag color="light-blue" shape="circle" size="large" type="ghost">
            <template #prefixIcon>
                <IconGithubLogo />
            </template>
            Semi Design Ghost Tag
        </Tag>
        <Tag color="cyan" shape="circle" size="large" type="ghost">
            Semi: one component library for four frameworks
            <template #suffixIcon>
                <IconSemiLogo />
            </template>
        </Tag>
        <Tag color="light-blue" shape="circle" size="large" type="solid">
            <template #prefixIcon>
                <IconGithubLogo />
            </template>
            Semi Design Solid Tag
        </Tag>
        <Tag color="cyan" shape="circle" size="large" type="solid">
            Semi: one component library for four frameworks
            <template #suffixIcon>
                <IconSemiLogo />
            </template>
        </Tag>
    </Space>
</template>
