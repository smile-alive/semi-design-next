<script setup lang="ts">
    import { Button, Form, FormInput, FormRadio, FormRadioGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Form :style="{ width: '450px' }">
        <template #default="{ formState }">
            <FormInput field="name" label="用户名称:" />
            <FormRadioGroup field="isAnchor" label="是否已注册主播">
                <FormRadio value="yes">yes</FormRadio>
                <FormRadio value="no">no</FormRadio>
            </FormRadioGroup>
            <FormInput v-if="formState.values?.isAnchor === 'yes'" field="liveRoom" label="直播间名称" />
            <Button htmlType="submit">提交</Button>
        </template>
    </Form>
</template>
