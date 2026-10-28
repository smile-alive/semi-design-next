<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Form, FormInput, FormSwitch, Switch } from '@fibrae/semi-ui-vue';

    const show = ref(true);
</script>

<template>
    <Form :style="{ width: '450px' }">
        <FormSwitch field="alwaysShow" label="始终显示的字段" />
        <Switch v-model="show" aria-labelledby="form-keep-state-toggle" :style="{ marginBottom: '12px' }" />
        <span id="form-keep-state-toggle" :style="{ marginLeft: '8px', color: 'var(--semi-color-text-2)' }"> 显示条件字段 </span>
        <FormInput v-if="show" field="conditionalField" keepState label="条件字段（keepState）" />
        <FormInput v-if="show" field="noKeepState" label="条件字段（无 keepState）" />
        <Button htmlType="submit">提交</Button>
    </Form>
</template>
