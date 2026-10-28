<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Feedback, type FeedbackValue } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const handleOk = () => {
        visible.value = false;
    };
    const onValueChange = (value: FeedbackValue) => {
        console.log('emoji value', value);
    };
</script>

<template>
    <Button @click="visible = !visible">展示反馈: Modal, emoji</Button>
    <Feedback v-model:visible="visible" mode="modal" title="Why did you choose this rating?" @ok="handleOk" @valueChange="onValueChange" />
</template>
