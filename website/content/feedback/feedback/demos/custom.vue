<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Feedback, TextArea } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const value = ref('');
    const handleOk = () => {
        visible.value = false;
    };
    const okButtonProps = computed(() => ({ disabled: !value.value }));
</script>

<template>
    <Button @click="visible = !visible">展示反馈: Popup, custom</Button>
    <Feedback v-model:visible="visible" :okButtonProps="okButtonProps" title="您对本产品的建议是？" type="custom" @ok="handleOk">
        <span>这是一段自定义的内容</span>
        <TextArea v-model="value" />
    </Feedback>
</template>
