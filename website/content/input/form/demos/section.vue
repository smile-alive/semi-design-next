<script setup lang="ts">
    import { Button, Form, FormCheckbox, FormDatePicker, FormInput, FormInputNumber, FormRadio, FormRadioGroup, FormSection, FormSelect, FormSwitch, Space } from '@fibrae/semi-ui-vue';

    const today = new Date(2024, 4, 6, 10, 30, 0);
    // initValue is not a declared Boolean prop, so a bare attribute would pass an empty string
    const autoSubmit = true;
</script>

<template>
    <Form style="width: 560px">
        <FormSection>
            <template #text>基本信息</template>
            <FormInput field="name" initValue="TCS任务平台使用" label="考试名称" style="width: 560px" />
        </FormSection>
        <FormSection>
            <template #text>合格标准</template>
            <div style="display: flex">
                <FormInputNumber field="pass" :initValue="60" :label="{ text: '及格正确率', required: true }" style="width: 80px" />
                <FormInputNumber field="number" :initValue="10" :label="{ text: '合格人数', required: true }" style="width: 80px" />
            </div>
        </FormSection>
        <FormSection>
            <template #text>考试时间</template>
            <FormDatePicker field="date" :initValue="today" :label="{ text: '开始时间', required: true }" style="width: 272px" type="dateTime" />
            <div style="display: flex">
                <FormInput field="time" initValue="60" label="考试时长" style="width: 176px">
                    <template #addonAfter>分钟</template>
                </FormInput>
                <FormCheckbox field="auto" :initValue="autoSubmit" noLabel style="padding-top: 30px; margin-inline-start: 12px"> 到时间自动交卷 </FormCheckbox>
            </div>
            <FormRadioGroup direction="vertical" field="type" initValue="always" label="有效时间">
                <FormRadio value="always">永久有效</FormRadio>
                <FormRadio value="user">自定义有效期</FormRadio>
            </FormRadioGroup>
            <FormRadioGroup direction="vertical" field="answerTime" initValue="always" label="答案放出时间" :rules="[{ required: true }]">
                <FormRadio value="always">自动放出</FormRadio>
                <FormRadio value="user">
                    <div style="display: inline-block">
                        自定义放出时间
                        <FormDatePicker field="customTime" noLabel style="width: 464px; display: inline-block" type="dateTimeRange" />
                    </div>
                </FormRadio>
            </FormRadioGroup>
        </FormSection>
        <FormSection>
            <template #text>考试人员</template>
            <div style="display: flex">
                <FormSwitch field="open" :label="{ text: '对外开放', required: true }">
                    <template #checkedText>开</template>
                    <template #uncheckedText>关</template>
                </FormSwitch>
            </div>
            <FormSelect field="users" :initValue="['1', '2', '3', '4']" :label="{ text: '考生', required: true }" multiple style="width: 560px">
                <FormSelect.Option value="1">曲晨一</FormSelect.Option>
                <FormSelect.Option value="2">夏可曼</FormSelect.Option>
                <FormSelect.Option value="3">曲晨三</FormSelect.Option>
                <FormSelect.Option value="4">蔡妍</FormSelect.Option>
            </FormSelect>
        </FormSection>
        <Space>
            <Button style="width: 120px; margin-top: 12px; margin-inline-end: 4px" theme="solid" type="primary"> 创建考试 </Button>
            <Button style="margin-top: 12px">预览</Button>
        </Space>
    </Form>
</template>
