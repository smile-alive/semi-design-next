<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { Form, FormInput, type FormHandle, type InputValidateStatus as ValidateStatus } from '@fibrae/semi-ui-vue';

    const helpText = ref('');
    const validateStatus = ref<ValidateStatus>('default');
    const form = useTemplateRef<FormHandle>('form');

    const validator = (val?: string) => {
        if (!val) {
            validateStatus.value = 'error';
            return '密码不能为空';
        } else if (val.length <= 3) {
            validateStatus.value = 'warning';
            helpText.value = '密码强度：弱'; // 展示 helpText
            return ''; // 校验通过
        }
        helpText.value = '';
        validateStatus.value = 'success';
        return '';
    };

    const onSubmit = () => console.log('submit success');
    const onSubmitFail = (errors: unknown) => console.log(errors);

    const random = () => {
        const pw = (Math.random() * 100000).toString().slice(0, 5);
        form.value?.formApi.setValue('Password', pw);
        form.value?.formApi.setError('Password', '');
        helpText.value = '';
        validateStatus.value = 'success';
    };
</script>

<template>
    <Form ref="form" showValidateIcon @submit="onSubmit" @submitFail="onSubmitFail">
        <FormInput field="Password" :validateStatus="validateStatus" :validator="validator">
            <template v-if="helpText" #helpText>
                <span :style="{ color: 'var(--semi-color-warning)' }">{{ helpText }}</span>
            </template>
            <template #extraText>
                <button
                    :style="{
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        font: 'inherit',
                        color: 'var(--semi-color-link)',
                        fontSize: '14px',
                        userSelect: 'none',
                        cursor: 'pointer',
                    }"
                    type="button"
                    @click="random"
                >
                    没有想到合适的密码？点击随机生成一个
                </button>
            </template>
        </FormInput>
    </Form>
</template>
