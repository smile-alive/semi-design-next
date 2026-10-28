<script setup lang="ts">
    import { ref } from 'vue';
    import { Banner, Button, FormDatePicker, FormRadio, FormRadioGroup, FormSelect, Form, SideSheet, TypographyText } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const createTime = new Date();
    const border = { borderBottom: '1px solid var(--semi-color-border)' };
</script>

<template>
    <Button @click="visible = true">More Information</Button>
    <SideSheet v-model:visible="visible" :bodyStyle="border" :closable="false" :headerStyle="border" title="创建资源包">
        <template #footer>
            <div style="display: flex; justify-content: flex-end">
                <Button style="margin-right: 8px">重置</Button>
                <Button theme="solid">提交</Button>
            </div>
        </template>
        <Form>
            <FormDatePicker field="date" :initValue="createTime" :label="{ text: '创建时间', required: true }" style="width: 272px" type="dateTime" />
            <FormRadioGroup direction="horizontal" field="type" initValue="all" label="目标操作系统">
                <FormRadio value="all">全平台</FormRadio>
                <FormRadio value="ios">iOS</FormRadio>
                <FormRadio value="android">Android</FormRadio>
                <FormRadio value="web">Web</FormRadio>
            </FormRadioGroup>
            <FormRadioGroup direction="horizontal" field="origin" initValue="scm" label="资源包来源">
                <FormRadio value="scm">从SCM上传</FormRadio>
                <FormRadio value="manual">手动上传</FormRadio>
            </FormRadioGroup>
            <Banner bordered :fullMode="false" type="warning">
                <template #icon />
                <template #description>
                    <TypographyText strong>当前部署环境：线上部署</TypographyText>
                    <br />
                    <TypographyText>请选择正确的SCM构建产物，防止出现不符合预期的发布操作。</TypographyText>
                </template>
            </Banner>
            <br />
            <FormSelect field="users" :initValue="['1', '2', '3', '4']" :label="{ text: '创建用户', required: true }" multiple style="width: 560px">
                <FormSelect.Option value="1">曲晨一</FormSelect.Option>
                <FormSelect.Option value="2">夏可曼</FormSelect.Option>
                <FormSelect.Option value="3">曲晨三</FormSelect.Option>
                <FormSelect.Option value="4">蔡妍</FormSelect.Option>
            </FormSelect>
        </Form>
    </SideSheet>
</template>
