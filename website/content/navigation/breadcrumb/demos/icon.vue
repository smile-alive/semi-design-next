<script setup lang="ts">
    import { IconArticle, IconHome } from '@fibrae/semi-icons-vue';
    import { Breadcrumb } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Breadcrumb>
        <Breadcrumb.Item>
            <template #icon>
                <IconHome size="small" />
            </template>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
            <template #icon>
                <IconArticle size="small" />
            </template>
            Breadcrumb
        </Breadcrumb.Item>
        <Breadcrumb.Item>With Icon</Breadcrumb.Item>
    </Breadcrumb>
</template>
