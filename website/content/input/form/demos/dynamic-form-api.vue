<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Button, Form, FormInput, FormSelect, TextArea, type FormApi } from '@fibrae/semi-ui-vue';

    interface Effect {
        name: string;
        type: string;
        key: number;
    }

    interface FormValues {
        effects: Effect[];
    }

    const initValues: FormValues = {
        effects: [
            { name: '脸部贴纸', type: '2D', key: 1 },
            { name: '背景贴纸', type: '3D', key: 2 },
        ],
    };

    const formApi = shallowRef<FormApi<FormValues>>();
    let nextKey = 3;

    const onGetFormApi = (api: FormApi<FormValues>) => {
        formApi.value = api;
    };

    const add = () => {
        const effects = formApi.value?.getValue('effects') ?? [];
        formApi.value?.setValue('effects', [...effects, { name: '', type: '', key: nextKey++ }]);
    };

    const remove = (key: number) => {
        const effects = (formApi.value?.getValue('effects') ?? []).filter((effect) => key !== effect.key);
        formApi.value?.setValue('effects', effects.length ? effects : undefined);
    };
</script>

<template>
    <Form :initValues="initValues" labelPosition="left" labelWidth="180px" :style="{ width: '500px' }" @getFormApi="onGetFormApi">
        <template #default="{ values }">
            <Button @click="add">添加</Button>
            <div v-for="(effect, i) in values.effects" :key="effect.key" :style="{ width: '1000px', display: 'flex' }">
                <FormInput :aria-label="`特效 ${i + 1} 名称`" :field="`effects[${i}].name`" :style="{ width: '200px', marginRight: '12px' }" />
                <FormSelect :field="`effects[${i}].type`" :style="{ width: '90px' }">
                    <FormSelect.Option value="2D">2D</FormSelect.Option>
                    <FormSelect.Option value="3D">3D</FormSelect.Option>
                </FormSelect>
                <Button :style="{ margin: '12px' }" type="danger" @click="remove(effect.key)">删除</Button>
            </div>
            <TextArea aria-label="表单值" :modelValue="JSON.stringify(values)" :style="{ marginTop: '10px' }" />
        </template>
    </Form>
</template>
