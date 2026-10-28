<script setup lang="ts">
    import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-vue';
    import { Space, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Space>
        <Tag color="light-blue" shape="circle" size="large">
            <template #prefixIcon>
                <IconGithubLogo />
            </template>
            Semi Design
        </Tag>
        <Tag color="cyan" shape="circle" size="large">
            D2C: figma to code in one click
            <template #suffixIcon>
                <IconSemiLogo />
            </template>
        </Tag>
    </Space>
</template>
