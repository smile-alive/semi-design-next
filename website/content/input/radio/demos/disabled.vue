<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Radio } from '@fibrae/semi-ui-vue';

    const disabled = ref(true);
</script>

<template>
    <div>
        <Radio aria-label="单选示例" :defaultChecked="false" :disabled="disabled" name="demo-radio-disabled"> Disabled </Radio>
        <br />
        <Radio aria-label="单选示例" defaultChecked :disabled="disabled" name="demo-radio-defaultChecked-disabled"> Disabled </Radio>
        <div :style="{ marginTop: '20px' }">
            <Button type="primary" @click="disabled = !disabled">Toggle disabled</Button>
        </div>
    </div>
</template>
