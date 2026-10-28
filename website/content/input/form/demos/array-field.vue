<script setup lang="ts">
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-vue';
    import { ArrayField, Button, Form, FormInput, FormSelect, TextArea } from '@fibrae/semi-ui-vue';

    const data = [
        { name: 'Semi D2C', role: 'Engineer' },
        { name: 'Semi C2D', role: 'Designer' },
    ];
    const roleOptions = [
        { label: 'Engineer', value: 'Engineer' },
        { label: 'Designer', value: 'Designer' },
    ];
</script>

<template>
    <Form allowEmpty labelPosition="left" labelWidth="100px" :style="{ width: '800px' }">
        <template #default="{ formState }">
            <ArrayField field="rules" :initValue="data">
                <template #default="{ arrayFields, onAdd, onAddWithInitValue }">
                    <Button theme="light" @click="onAdd">
                        <template #icon>
                            <IconPlusCircle />
                        </template>
                        Add new line
                    </Button>
                    <Button :style="{ marginLeft: '8px' }" @click="onAddWithInitValue({ name: 'Semi DSM', role: 'Designer' })">
                        <template #icon>
                            <IconPlusCircle />
                        </template>
                        Add new line with init value
                    </Button>
                    <div v-for="item in arrayFields" :key="item.key" :style="{ width: '1000px', display: 'flex' }">
                        <FormInput :field="`${item.field}[name]`" :label="`${item.field}.name`" :style="{ width: '200px', marginRight: '16px' }" />
                        <FormSelect :field="`${item.field}[role]`" :label="`${item.field}.role`" :optionList="roleOptions" :style="{ width: '120px' }" />
                        <Button aria-label="Delete" :style="{ margin: '12px' }" theme="borderless" type="danger" @click="item.onRemove">
                            <template #icon>
                                <IconMinusCircle />
                            </template>
                        </Button>
                    </div>
                </template>
            </ArrayField>
            <TextArea aria-label="Form state" :modelValue="JSON.stringify(formState)" :style="{ marginTop: '10px' }" />
        </template>
    </Form>
</template>
