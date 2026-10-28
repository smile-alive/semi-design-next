<script setup lang="ts">
    import { Avatar, Button, Card, CardMeta, Space, TypographyText } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card :footerStyle="{ display: 'flex', justifyContent: 'flex-end' }" footerLine :style="{ maxWidth: '340px' }">
        <template #title>
            <CardMeta title="Semi Doc">
                <template #description>全面、易用、优质</template>
                <template #avatar>
                    <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                </template>
            </CardMeta>
        </template>
        <template #headerExtraContent>
            <TypographyText link>More</TypographyText>
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
        Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。
    </Card>
</template>
