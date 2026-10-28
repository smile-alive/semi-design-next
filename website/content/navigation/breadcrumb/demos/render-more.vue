<script setup lang="ts">
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Breadcrumb, Popover, type BreadcrumbItemInfo } from '@fibrae/semi-ui-vue';

    const separator = '-'; // 拼接 restItems 用的分隔符
    const onClick = (item: BreadcrumbItemInfo, e: MouseEvent) => console.log(item, e);
</script>

<template>
    <Breadcrumb @click="onClick">
        <Breadcrumb.Item>首页</Breadcrumb.Item>
        <Breadcrumb.Item>当层级很多的时候</Breadcrumb.Item>
        <Breadcrumb.Item>又一层</Breadcrumb.Item>
        <Breadcrumb.Item>再一层</Breadcrumb.Item>
        <Breadcrumb.Item>上上一层</Breadcrumb.Item>
        <Breadcrumb.Item>上一层</Breadcrumb.Item>
        <Breadcrumb.Item>详情页</Breadcrumb.Item>
        <template #more="{ restItems }">
            <Popover showArrow :style="{ padding: '12px' }">
                <IconMore tabindex="-1" />
                <template #content>
                    <template v-for="(item, idx) in restItems" :key="idx">
                        <component :is="item" />
                        <span v-if="idx !== restItems.length - 1" :style="{ color: 'var(--semi-color-text-2)', marginRight: '6px' }">{{ separator }}</span>
                    </template>
                </template>
            </Popover>
        </template>
    </Breadcrumb>
</template>
