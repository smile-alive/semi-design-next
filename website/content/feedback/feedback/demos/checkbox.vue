<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Feedback } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const handleOk = () => {
        visible.value = false;
    };
    const checkboxGroupProps = { options: ['抖音', '火山', '豆包'] };
</script>

<template>
    <Button @click="visible = !visible">展示反馈: Popup, checkbox</Button>
    <Feedback v-model:visible="visible" :checkboxGroupProps="checkboxGroupProps" title="您最常使用以下哪些产品？" type="checkbox" @ok="handleOk" />
</template>
