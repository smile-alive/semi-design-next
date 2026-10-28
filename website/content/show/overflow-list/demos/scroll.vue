<script setup lang="ts">
    import { ref, type Component } from 'vue';
    import { IconAlarm, IconBookmark, IconCamera, IconDuration, IconEdit, IconFolder } from '@fibrae/semi-icons-vue';
    import { OverflowList, Slider, Tag } from '@fibrae/semi-ui-vue';

    interface Item {
        key: string;
    }

    const icons: Record<string, Component> = {
        alarm: IconAlarm,
        bookmark: IconBookmark,
        camera: IconCamera,
        duration: IconDuration,
        edit: IconEdit,
        folder: IconFolder,
    };
    const items: Item[] = Object.keys(icons).map((key) => ({ key }));
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
            <OverflowList :items="items" renderMode="scroll">
                <template #item="{ item }">
                    <Tag color="blue" :style="{ marginRight: '8px', flex: '0 0 auto' }">
                        <component :is="icons[item.key]" :style="{ marginRight: '4px' }" />
                        <span>{{ item.key }}</span>
                    </Tag>
                </template>
                <template #overflow="{ items: hidden }">
                    <Tag
                        :style="{
                            marginRight: '8px',
                            marginLeft: '8px',
                            flex: '0 0 auto',
                            fontVariantNumeric: 'tabular-nums',
                        }"
                    >
                        +{{ hidden.length }}
                    </Tag>
                </template>
            </OverflowList>
        </div>
    </div>
</template>
