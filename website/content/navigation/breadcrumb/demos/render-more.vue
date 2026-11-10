<script setup lang="ts">
    import { IconMore } from '@fibrae/semi-icons-vue';
    import { Breadcrumb, Popover, type BreadcrumbItemInfo } from '@fibrae/semi-ui-vue';

    const separator = '-';
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
        <template #more="moreContext">
            <Popover showArrow :style="{ padding: '12px' }">
                <IconMore tabindex="-1" />
                <template #content>
                    <ol :style="{ display: 'flex', flexWrap: 'wrap', padding: 0, margin: 0, listStyle: 'none' }">
                        <template v-for="(item, idx) in moreContext.restItems" :key="idx">
                            <component :is="item" />
                            <li v-if="idx !== moreContext.restItems.length - 1" aria-hidden="true" :style="{ color: 'var(--semi-color-text-2)', marginInlineEnd: '6px' }">{{ separator }}</li>
                        </template>
                    </ol>
                </template>
            </Popover>
        </template>
    </Breadcrumb>
</template>
