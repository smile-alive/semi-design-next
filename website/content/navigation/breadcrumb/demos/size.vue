<script setup lang="ts">
    import { IconHome } from '@fibrae/semi-icons-vue';
    import { Breadcrumb } from '@fibrae/semi-ui-vue';
</script>

<template>
    <!-- Several breadcrumbs on one page are told apart by aria-label -->
    <div>
        <Breadcrumb aria-label="紧凑面包屑" compact>
            <Breadcrumb.Item>
                <template #icon>
                    <IconHome size="small" />
                </template>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>Loose</Breadcrumb.Item>
        </Breadcrumb>
        <br />
        <Breadcrumb aria-label="宽松面包屑" :compact="false">
            <Breadcrumb.Item>
                <template #icon>
                    <IconHome size="small" />
                </template>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>Loose</Breadcrumb.Item>
        </Breadcrumb>
    </div>
</template>
