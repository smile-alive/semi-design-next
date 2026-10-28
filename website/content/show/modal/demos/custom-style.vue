<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const close = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = true">自定义对话框样式</Button>
    <Modal v-model:visible="visible" :bodyStyle="{ overflow: 'auto', height: '200px' }" centered title="自定义样式" @ok="close">
        <p :style="{ lineHeight: 1.8 }">Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。</p>
        <p :style="{ lineHeight: 1.8 }">区别于其他的设计系统而言，Semi Design 以用户中心、内容优先、设计人性化为设计理念，具有以下优势：</p>
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
                <p>效率场景加入人性化关怀</p>
            </li>
        </ul>
    </Modal>
</template>
