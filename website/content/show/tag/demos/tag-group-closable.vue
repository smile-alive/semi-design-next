<script setup lang="ts">
    import { ref } from 'vue';
    import { TagGroup, type TagCloseEvent, type TagGroupItem } from '@fibrae/semi-ui-vue';

    const tagList = ref<TagGroupItem[]>([
        { tagKey: '1', color: 'light-blue', children: '抖音', closable: true },
        { tagKey: '3', color: 'cyan', children: '剪映', closable: true },
        { tagKey: '2', color: 'violet', children: '醒图', closable: true },
        { tagKey: '4', color: 'teal', children: '轻颜相机', closable: true },
        { tagKey: '5', color: 'white', children: '飞书', closable: true },
    ]);

    const closeTag = (_event: TagCloseEvent, tagKey: string | number | undefined) => {
        tagList.value = tagList.value.filter((tag) => tag.tagKey !== tagKey);
    };
</script>

<template>
    <div
        :style="{
            backgroundColor: 'var(--semi-color-fill-0)',
            height: '35px',
            width: '300px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            marginBottom: '30px',
        }"
    >
        <TagGroup :maxTagCount="3" showPopover size="large" :style="{ display: 'flex', alignItems: 'center', width: '350px' }" :tagList="tagList" @tagClose="closeTag" />
    </div>
</template>
