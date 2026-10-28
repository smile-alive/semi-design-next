<script setup lang="ts">
    import { Col, Form, FormDatePicker, FormInput, FormSelect, Row, type RuleItem } from '@fibrae/semi-ui-vue';

    const nickNameRules: RuleItem[] = [
        { required: true, message: 'required error' },
        { type: 'string', message: 'type error' },
        { validator: (_rule, value) => value === 'semi', message: 'should be semi' },
    ];
</script>

<template>
    <Form labelPosition="top" :style="{ padding: '10px' }">
        <Row>
            <Col :span="8">
                <FormInput field="nickName1" label="用户名" :rules="nickNameRules" :style="{ width: '250px' }" trigger="blur" />
            </Col>
            <Col :span="8">
                <FormDatePicker field="date1" label="有效日期" :style="{ width: '250px' }" />
            </Col>
            <Col :span="8">
                <FormSelect field="business1" label="业务线" :style="{ width: '250px' }">
                    <FormSelect.Option value="abc">Semi</FormSelect.Option>
                    <FormSelect.Option value="ulikeCam">轻颜相机</FormSelect.Option>
                    <FormSelect.Option value="toutiao">今日头条</FormSelect.Option>
                </FormSelect>
            </Col>
        </Row>
        <Row>
            <Col :span="6">
                <FormInput field="nickName2" label="用户名" :rules="nickNameRules" :style="{ width: '200px' }" trigger="blur" />
            </Col>
            <Col :span="6">
                <FormDatePicker field="date2" label="有效日期" :style="{ width: '200px' }" />
            </Col>
            <Col :span="6">
                <FormSelect field="business2" label="业务线" :style="{ width: '200px' }">
                    <FormSelect.Option value="abc">Semi</FormSelect.Option>
                    <FormSelect.Option value="ulikeCam">轻颜相机</FormSelect.Option>
                    <FormSelect.Option value="toutiao">今日头条</FormSelect.Option>
                </FormSelect>
            </Col>
            <Col :span="6">
                <FormSelect field="role" label="角色" :style="{ width: '200px' }">
                    <FormSelect.Option value="operate">运营</FormSelect.Option>
                    <FormSelect.Option value="rd">开发</FormSelect.Option>
                    <FormSelect.Option value="pm">产品</FormSelect.Option>
                    <FormSelect.Option value="ued">设计</FormSelect.Option>
                </FormSelect>
            </Col>
        </Row>
    </Form>
</template>
