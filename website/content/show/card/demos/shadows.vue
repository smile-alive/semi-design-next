<script setup lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-vue';
    import { Avatar, Card, CardMeta, Popover } from '@fibrae/semi-ui-vue';

    const bodyStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
</script>

<template>
    <div>
        <Card :bodyStyle="bodyStyle" shadows="hover" :style="{ maxWidth: '360px' }">
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
        <br />
        <Card :bodyStyle="bodyStyle" shadows="always" :style="{ maxWidth: '360px' }">
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
    </div>
</template>
