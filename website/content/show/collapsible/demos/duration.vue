<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Collapsible, InputNumber } from '@fibrae/semi-ui-vue';

    const isOpen = ref(false);
    const duration = ref(250);
    const toggle = () => {
        isOpen.value = !isOpen.value;
    };
    const setDuration = (value: number | string) => {
        duration.value = Number(value);
    };
</script>

<template>
    <div>
        <span id="collapsible-duration-label">设置动画时间：</span>
        <InputNumber aria-labelledby="collapsible-duration-label" :defaultValue="250" :min="0" :step="10" :style="{ width: '120px' }" @change="setDuration" />
        <br />
        <Button aria-controls="collapsible-duration" :aria-expanded="isOpen" @click="toggle">Toggle</Button>
        <Collapsible id="collapsible-duration" :duration="duration" :isOpen="isOpen">
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
