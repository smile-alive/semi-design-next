<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Col, Form, FormInput, FormSelect, Modal, Row, type FormApi } from '@fibrae/semi-ui-vue';

    const message = '该项为必填项';
    const rules = [{ required: true, message }];

    const visible = ref(false);
    let formApi: FormApi | undefined;

    const handleOk = () => {
        formApi
            ?.validate()
            .then((values) => {
                console.log(values);
            })
            .catch((errors) => {
                console.log(errors);
            });
    };
</script>

<template>
    <Button @click="visible = true">打开弹窗</Button>
    <Modal v-model:visible="visible" :style="{ width: '600px' }" title="新建" @ok="handleOk">
        <Form @getFormApi="(api) => (formApi = api)">
            <Row>
                <Col :span="5">
                    <FormSelect field="region" label="国家/地区" placeholder="请选择" :rules="rules" :style="{ width: '100%' }">
                        <FormSelect.Option value="China">中国</FormSelect.Option>
                        <FormSelect.Option value="US">美国</FormSelect.Option>
                        <FormSelect.Option value="Europe">欧洲</FormSelect.Option>
                        <FormSelect.Option value="Japan">日本</FormSelect.Option>
                    </FormSelect>
                </Col>
                <Col :offset="2" :span="15">
                    <FormInput field="owner" label="业务执行人" :rules="rules" trigger="blur" />
                </Col>
            </Row>
            <Row>
                <Col :span="5">
                    <FormSelect field="area" label="投放区域" placeholder="请选择" :rules="rules" :style="{ width: '100%' }">
                        <FormSelect.Option value="China">中国</FormSelect.Option>
                        <FormSelect.Option value="US">美国</FormSelect.Option>
                        <FormSelect.Option value="Europe">欧洲</FormSelect.Option>
                        <FormSelect.Option value="Japan">日本</FormSelect.Option>
                    </FormSelect>
                </Col>
                <Col :offset="2" :span="15">
                    <FormInput field="department" label="业务执行部门" :rules="rules" trigger="blur" />
                </Col>
            </Row>
        </Form>
    </Modal>
</template>
