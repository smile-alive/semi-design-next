<script setup lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Card, Popover } from '@fibrae/semi-ui-vue';

    const bodyStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
</script>

<template>
    <Card :style="{ maxWidth: '360px' }"> Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。 </Card>
    <br />
    <Card :bodyStyle="bodyStyle" :style="{ maxWidth: '360px' }">
        <Card.Meta title="Semi Doc">
            <template #avatar>
                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
            </template>
        </Card.Meta>
        <Popover position="top" showArrow>
            <template #content>
                <article :style="{ padding: '6px' }">这是一个 Card</article>
            </template>
            <IconInfoCircle aria-label="信息" :style="{ color: 'var(--semi-color-primary)' }" />
        </Popover>
    </Card>
</template>
