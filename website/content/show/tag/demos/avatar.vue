<script setup lang="ts">
    import { Space, Tag } from '@fibrae/semi-ui-vue';

    const src = '/assets/placeholder/avatar-a.svg';
</script>

<template>
    <Space align="start" vertical>
        <Tag :avatarSrc="src">焦锐志</Tag>
        <Tag :avatarSrc="src" size="large">焦锐志</Tag>
        <Tag :avatarSrc="src" closable size="large">焦锐志</Tag>
        <Tag :avatarSrc="src" avatarShape="circle">焦锐志</Tag>
        <Tag :avatarSrc="src" avatarShape="circle" size="large">焦锐志</Tag>
        <Tag :avatarSrc="src" avatarShape="circle" closable size="large">焦锐志</Tag>
    </Space>
</template>
