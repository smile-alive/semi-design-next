<script setup lang="ts">
    import { ref, type Component } from 'vue';
    import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-vue';
    import { OverflowList, Slider, Tag } from '@fibrae/semi-ui-vue';

    interface Item {
        icon: Component;
        key: string;
    }

    const items: Item[] = [
        { icon: IconAlarm, key: 'alarm' },
        { icon: IconBookmark, key: 'bookmark' },
        { icon: IconCamera, key: 'camera' },
        { icon: IconDuration, key: 'duration' },
        { icon: IconEdit, key: 'edit' },
        { icon: IconFolder, key: 'folder' },
    ];
    const width = ref(100);

    const changeWidth = (value: number | number[]) => {
        if (typeof value === 'number') width.value = value;
    };
</script>

<template>
    <div>
        <Slider aria-label="Container width" :modelValue="width" :step="1" @update:modelValue="changeWidth" />
        <br />
        <br />
        <div :style="{ width: `${width}%` }">
            <OverflowList collapseFrom="start" :items="items">
                <template #item="{ item }">
                    <Tag color="blue" :style="{ marginInlineEnd: '8px', flex: '0 0 auto' }">
                        <component :is="item.icon" :style="{ marginInlineEnd: '4px' }" />
                        {{ item.key }}
                    </Tag>
                </template>
                <template #overflow="{ items: hidden }">
                    <Tag v-if="hidden.length" :style="{ marginInlineEnd: '8px', flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }"> +{{ hidden.length }} </Tag>
                </template>
            </OverflowList>
        </div>
    </div>
</template>
