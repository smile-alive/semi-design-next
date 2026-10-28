<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Button, Form, FormInput, FormSelect, Row } from '@fibrae/semi-ui-vue';

    const form = useTemplateRef('form');

    const handleSelectChange = (value: unknown) => {
        const text = value === 'male' ? 'Hi male' : 'Hi female!';
        form.value?.formApi.setValue('Note', text);
    };
</script>

<template>
    <Form ref="form" :style="{ width: '250px' }" @valueChange="(values) => console.log(values)">
        <span>Note will change after Sex select</span>
        <FormInput field="Note" :style="{ width: '250px' }" />
        <FormSelect field="Sex" :style="{ width: '250px' }" @change="handleSelectChange">
            <FormSelect.Option value="female">female</FormSelect.Option>
            <FormSelect.Option value="male">male</FormSelect.Option>
        </FormSelect>
        <Row>
            <Button class="btn-margin-right" htmlType="submit" type="primary">Submit</Button>
            <Button htmlType="reset">reset</Button>
        </Row>
    </Form>
</template>
