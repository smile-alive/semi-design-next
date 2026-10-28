<script setup lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Card, CardMeta, Popover } from '@fibrae/semi-ui-vue';

    const bodyStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
</script>

<template>
    <Card :style="{ maxWidth: '360px' }"> Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。 </Card>
    <br />
    <Card :bodyStyle="bodyStyle" :style="{ maxWidth: '360px' }">
        <CardMeta title="Semi Doc">
            <template #avatar>
                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
            </template>
        </CardMeta>
        <Popover position="top" showArrow>
            <template #content>
                <article :style="{ padding: '6px' }">这是一个 Card</article>
            </template>
            <IconInfoCircle aria-label="信息" :style="{ color: 'var(--semi-color-primary)' }" />
        </Popover>
    </Card>
</template>
