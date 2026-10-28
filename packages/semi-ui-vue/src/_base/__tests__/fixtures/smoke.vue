<script setup lang="ts">
    import { onMounted, onUnmounted, ref, useId, useTemplateRef } from 'vue';
    import '@fibrae/semi-foundation/base/tokens.scss';
    import '@fibrae/semi-foundation/button/button.scss';
    import useResizeObserver from '../../use-resize-observer';

    const id = useId();
    const count = ref(0);
    const wide = ref(false);
    const width = ref(0);
    const button = useTemplateRef('button');
    const media = window.matchMedia('(min-width: 800px)');
    const updateMedia = (event: { matches: boolean }) => {
        wide.value = event.matches;
    };
    onMounted(() => {
        wide.value = media.matches;
        media.addEventListener('change', updateMedia);
    });
    onUnmounted(() => media.removeEventListener('change', updateMedia));
    useResizeObserver(button, (entries) => {
        width.value = entries[0].contentRect.width;
    });
</script>

<template>
    <div data-testid="vue-smoke">
        <button :id="id" ref="button" class="semi-button semi-button-primary semi-button-solid" type="button" @click="count++">次数 {{ count }}</button>
        <output aria-label="布局信息" :for="id">{{ wide ? '宽屏' : '窄屏' }}，宽度 {{ width }}</output>
        <Teleport to="body">
            <p :data-smoke-portal="id">传送内容</p>
        </Teleport>
    </div>
</template>
