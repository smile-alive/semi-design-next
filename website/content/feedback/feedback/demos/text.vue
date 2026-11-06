<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Feedback } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const handleOk = () => {
        visible.value = false;
    };
</script>

<template>
    <Button @click="visible = !visible">展示反馈: Popup, text</Button>
    <Feedback v-model:visible="visible" :textAreaProps="{ maxCount: 200 }" title="您对本产品的建议是？" type="text" @ok="handleOk" />
</template>
