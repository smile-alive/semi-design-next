<script setup lang="ts">
    import { IconArrowRight } from '@fibrae/semi-icons-vue';
    import { Breadcrumb, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <!-- Several breadcrumbs on one page are told apart by aria-label -->
    <div>
        <Breadcrumb aria-label="文字分隔符" separator=">">
            <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
            <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>Default</Breadcrumb.Item>
        </Breadcrumb>
        <br />
        <Breadcrumb aria-label="图标分隔符">
            <template #separator>
                <IconArrowRight size="small" />
            </template>
            <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
            <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>Default</Breadcrumb.Item>
        </Breadcrumb>
        <br />
        <Tag>v&gt;=1.16.0</Tag>
        <br />
        <Breadcrumb aria-label="单项分隔符">
            <Breadcrumb.Item separator=":">Semi-ui</Breadcrumb.Item>
            <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>Default</Breadcrumb.Item>
        </Breadcrumb>
    </div>
</template>
