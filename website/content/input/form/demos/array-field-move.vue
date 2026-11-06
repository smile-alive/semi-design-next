<script setup lang="ts">
    import { IconArrowDown, IconArrowUp, IconDelete } from '@fibrae/semi-icons-vue';
    import { ArrayField, Button, Form, FormInput, IconButton } from '@fibrae/semi-ui-vue';

    const initValue = [{ name: '需求评审' }, { name: '开发' }, { name: '上线' }];
</script>

<template>
    <Form :style="{ width: '480px' }">
        <template #default="form">
            <ArrayField field="steps" :initValue="initValue">
                <template #default="arrayField">
                    <div v-for="(item, index) in arrayField.arrayFields" :key="item.key" :style="{ display: 'flex', alignItems: 'flex-end', gap: '4px' }">
                        <FormInput :field="`${item.field}.name`" :label="`第 ${index + 1} 步`" :style="{ width: '280px' }" />
                        <IconButton :aria-label="`上移第 ${index + 1} 步`" :disabled="index === 0" theme="borderless" @click="arrayField.onMove(index, index - 1)">
                            <template #icon>
                                <IconArrowUp />
                            </template>
                        </IconButton>
                        <IconButton :aria-label="`下移第 ${index + 1} 步`" :disabled="index === arrayField.arrayFields.length - 1" theme="borderless" @click="arrayField.onMove(index, index + 1)">
                            <template #icon>
                                <IconArrowDown />
                            </template>
                        </IconButton>
                        <IconButton :aria-label="`删除第 ${index + 1} 步`" theme="borderless" type="danger" @click="item.onRemove">
                            <template #icon>
                                <IconDelete />
                            </template>
                        </IconButton>
                    </div>
                    <Button theme="light" @click="arrayField.onAdd">添加一步</Button>
                </template>
            </ArrayField>
            <pre><code>{{ JSON.stringify(form.formState.values) }}</code></pre>
        </template>
    </Form>
</template>
