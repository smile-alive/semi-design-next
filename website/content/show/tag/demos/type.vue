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
            D2C: figma to code in one click
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
            D2C: figma to code in one click
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
            D2C: figma to code in one click
            <template #suffixIcon>
                <IconSemiLogo />
            </template>
        </Tag>
    </Space>
</template>
