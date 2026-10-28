<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Button, Form, FormCheckboxGroup, FormInput, Space, Toast, type FormApi } from '@fibrae/semi-ui-vue';

    const allFields = ['a', 'b', 'c', 'd', 'b.name'];
    const options = allFields.map((item) => ({ label: item, value: item }));

    const validate = (val?: string) => {
        if (!val) {
            return "can't be empty";
        } else if (val.length <= 5) {
            return '我是传入的节点';
        }
        return undefined;
    };

    const formApi = shallowRef<FormApi>();

    const validatePartial = (type?: 'all') => {
        const scope = type === 'all' ? allFields : (formApi.value?.getValue('validateScope') ?? []);
        formApi.value
            ?.validate(scope)
            .then((values) => {
                console.log(values);
                Toast.success('pass');
            })
            .catch((error) => {
                Toast.error('error');
                console.log(error);
            });
    };

    const resetPartial = () => {
        formApi.value?.reset(formApi.value.getValue('resetScope'));
    };
</script>

<template>
    <Form autoScrollToError layout="horizontal" @getFormApi="(api) => (formApi = api)">
        <template #default="{ values }">
            <div>
                <FormInput field="a[1]" trigger="blur" :validator="validate" />
                <FormInput field="a[0]" trigger="blur" :validator="validate" />
                <FormInput field="b.name[0]" trigger="blur" :validator="validate" />
                <FormInput field="b.name[1]" trigger="blur" :validator="validate" />
                <FormInput field="b.type" trigger="blur" :validator="validate" />
                <FormInput field="c" trigger="blur" :validator="validate" />
                <FormInput field="d" trigger="blur" :validator="validate" />
            </div>
            <div>
                <FormCheckboxGroup direction="horizontal" field="validateScope" :initValue="['a', 'b']" label="当前希望校验的Field" :options="options" />
                <FormCheckboxGroup direction="horizontal" field="resetScope" label="当前需要Reset的Field" :options="options" />
                <Space>
                    <Button htmlType="reset">reset</Button>
                    <Button @click="validatePartial('all')">all validate</Button>
                    <Button @click="validatePartial()">partial validate {{ JSON.stringify(values.validateScope) }}</Button>
                    <Button @click="resetPartial">partial reset</Button>
                </Space>
            </div>
        </template>
    </Form>
</template>
