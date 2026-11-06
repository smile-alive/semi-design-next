<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Feedback } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const handleOk = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = !visible">展示反馈: Popup, radio</Button>
    <Feedback v-model:visible="visible" :radioGroupProps="{ options: ['访客', '开发者', '维护者'] }" title="您的身份是" type="radio" @ok="handleOk" />
</template>
