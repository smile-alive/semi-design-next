<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Button, TagInput, type TagInputHandle } from '@fibrae/semi-ui-vue';

    const tagInput = useTemplateRef<TagInputHandle>('tagInput');
    const handleTagInputFocus = () => {
        tagInput.value?.focus();
    };
</script>

<template>
    <TagInput ref="tagInput" :defaultValue="['抖音', '火山']" />
    <Button style="margin-top: 10px" @click="handleTagInputFocus">点击按钮聚焦</Button>
</template>
