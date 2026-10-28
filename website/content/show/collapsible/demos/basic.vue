<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Collapsible } from '@fibrae/semi-ui-vue';

    const isOpen = ref(false);
    const toggle = () => {
        isOpen.value = !isOpen.value;
    };
</script>

<template>
    <div>
        <Button aria-controls="collapsible-basic" :aria-expanded="isOpen" @click="toggle">Toggle</Button>
        <Collapsible id="collapsible-basic" :isOpen="isOpen">
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
    </div>
</template>
