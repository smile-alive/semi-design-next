<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Collapsible } from '@fibrae/semi-ui-vue';

    const isOpen = ref(false);
    const maskStyle = computed(() =>
        isOpen.value
            ? {}
            : {
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.2) 80%, transparent 100%)',
              }
    );
    const toggle = () => {
        isOpen.value = !isOpen.value;
    };
    const linkStyle = {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        padding: 0,
        border: 'none',
        background: 'none',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
        textAlign: 'center',
        bottom: '-10px',
        fontWeight: 700,
        cursor: 'pointer',
        color: 'var(--semi-color-link)',
    } as const;
</script>

<template>
    <Button aria-controls="collapsible-height" :aria-expanded="isOpen" @click="toggle">Toggle</Button>
    <div :style="{ position: 'relative' }">
        <Collapsible id="collapsible-height" :collapseHeight="60" :isOpen="isOpen" :style="maskStyle">
            <ul>
                <li>
                    <p>Semi Design 以内容优先进行设计。</p>
                </li>
                <li>
                    <p>更容易地自定义主题。</p>
                </li>
                <li>
                    <p>适用国际化场景。</p>
                </li>
                <li>
                    <p>效率场景加入人性化关怀。</p>
                </li>
            </ul>
        </Collapsible>
        <button v-if="!isOpen" aria-controls="collapsible-height" :aria-expanded="isOpen" :style="linkStyle" type="button" @click="toggle">+ Show More</button>
    </div>
</template>
