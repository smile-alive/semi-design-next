<script setup lang="ts">
    import { Form, FormTransfer } from '@fibrae/semi-ui-vue';

    const dataSource = Array.from({ length: 6 }, (_, index) => ({ label: `成员 ${index + 1}`, value: index + 1, key: index + 1 }));
    const rules = [{ required: true, type: 'array' as const, message: '请至少选择一名成员' }];
</script>

<template>
    <Form :initValues="{ members: [1, 3] }">
        <FormTransfer :dataSource="dataSource" field="members" label="项目成员" :rules="rules" :style="{ width: '480px', height: '320px' }" />
    </Form>
</template>
