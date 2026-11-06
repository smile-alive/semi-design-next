<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Form, FormInput, FormSwitch, Switch } from '@fibrae/semi-ui-vue';

    const show = ref(true);
</script>

<template>
    <Form :style="{ width: '450px' }">
        <FormSwitch field="alwaysShow" label="始终显示的字段" />
        <Switch v-model="show" aria-labelledby="form-keep-state-toggle" :style="{ marginBlockEnd: '12px' }" />
        <span id="form-keep-state-toggle" :style="{ marginInlineStart: '8px', color: 'var(--semi-color-text-2)' }"> 显示条件字段 </span>
        <template v-if="show">
            <FormInput field="kept" label="条件字段（默认保留状态）" :rules="[{ required: true, message: '必填' }]" />
            <FormInput field="reset" initValue="初始值" :keepState="false" label='条件字段（:keepState="false"）' />
        </template>
        <Button htmlType="submit">提交</Button>
    </Form>
</template>
