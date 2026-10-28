<script setup lang="ts">
    import { Col, Form, FormInput, FormLabel, Row, TextArea, Toast } from '@fibrae/semi-ui-vue';

    const onSubmit = (values: Record<string, unknown>) => Toast.info({ content: JSON.stringify(values) });
</script>

<template>
    <Form @submit="onSubmit">
        <template #default="{ formState }">
            <Row>
                <Col :span="12">
                    <FormInput aria-label="username" field="username" placeholder="请尝试输入值" />
                    <FormInput aria-label="user[0]" field="user[0]" placeholder="请尝试输入值" />
                    <FormInput aria-label="siblings.1" field="siblings.1" placeholder="请尝试输入值" />
                    <FormInput aria-label="siblings['2']" field="siblings['2']" placeholder="请尝试输入值" />
                    <FormInput aria-label="parents[0].name" field="parents[0].name" placeholder="请尝试输入值" />
                    <FormInput aria-label="parents[1]['name']" field="parents[1]['name']" placeholder="请尝试输入值" />
                </Col>
                <Col :offset="1" :span="10" :style="{ marginTop: '12px' }">
                    <FormLabel text="FormState实时映射值：" />
                    <TextArea aria-label="FormState实时映射值" :modelValue="JSON.stringify(formState.values)" />
                </Col>
            </Row>
        </template>
    </Form>
</template>
