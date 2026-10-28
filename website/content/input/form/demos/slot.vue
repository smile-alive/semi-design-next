<script setup lang="ts">
    import { Form, FormInput, FormSlot } from '@fibrae/semi-ui-vue';

    const log = (value: unknown) => console.log(value);
</script>

<template>
    <Form :labelWidth="100" labelPosition="left" style="width: 600px" @change="log" @submit="log">
        <FormInput field="特效名称" style="width: 250px" />
        <FormSlot error="我是SlotA的ErrorMessage" :label="{ text: 'SlotA' }">
            <div style="display: flex; align-items: center; height: 32px; margin-top: 8px">我是Semi Form SlotA, 我是自定义的节点</div>
        </FormSlot>
        <FormSlot :label="{ text: 'SlotB', width: 160, align: 'right' }">
            <div style="display: flex; align-items: center; height: 100%">我是Semi Form SlotB, 我的Label Align、Width与众不同</div>
        </FormSlot>
    </Form>
</template>
