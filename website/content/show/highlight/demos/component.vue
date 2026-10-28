<script setup lang="ts">
    import { Highlight } from '@fibrae/semi-ui-vue';

    const sourceString = '从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中';
    const searchWords = ['设计系统', 'Semi Design'];
</script>

<template>
    <h2>
        <Highlight component="strong" :searchWords="searchWords" :sourceString="sourceString" />
    </h2>
</template>
