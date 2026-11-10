<script setup lang="ts">
    import { Avatar, Button, Card, Space, Typography } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card :footerStyle="{ display: 'flex', justifyContent: 'flex-end' }" footerLine :style="{ maxWidth: '340px' }">
        <template #title>
            <Card.Meta title="Semi Doc">
                <template #description>全面、易用、优质</template>
                <template #avatar>
                    <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                </template>
            </Card.Meta>
        </template>
        <template #headerExtraContent>
            <Typography.Text link>More</Typography.Text>
        </template>
        <template #cover>
            <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
        </template>
        <template #footer>
            <Space>
                <Button theme="borderless" type="primary">精选案例</Button>
                <Button theme="solid" type="primary">开始使用</Button>
            </Space>
        </template>
        Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。
    </Card>
</template>
