<script setup lang="ts">
    import { Anchor } from '@fibrae/semi-ui-vue';

    const sections = ['section-a', 'section-b', 'section-c'];
    const getContainer = () => document.getElementById('scroll-box');
</script>

<template>
    <div :style="{ display: 'flex', gap: '24px' }">
        <Anchor :getContainer="getContainer" :scrollIntoViewOptions="{ block: 'center' }" scrollMotion :style="{ width: '160px' }">
            <Anchor.Link v-for="(id, index) in sections" :key="id" :href="`#${id}`" :title="`章节 ${index + 1}`" />
        </Anchor>
        <!-- Focusable so the keyboard can scroll this container -->
        <section id="scroll-box" aria-label="章节" :style="{ height: '240px', width: '320px', overflow: 'auto', border: '1px solid #ddd' }" tabindex="0">
            <div v-for="(id, index) in sections" :id="id" :key="id" :style="{ height: '200px', padding: '8px' }">点击链接后，章节 {{ index + 1 }} 会滚动到容器中间</div>
        </section>
    </div>
</template>
