<script setup lang="ts">
    import { AutoComplete, DatePicker, Input, InputGroup, InputNumber, Select } from '@fibrae/semi-ui-vue';

    const addressData = ['Beijing Haidian'];
</script>

<template>
    <div>
        <InputGroup>
            <Input placeholder="Name" :style="{ width: '100px' }" />
            <InputNumber placeholder="Score" :style="{ width: '140px' }" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Select aria-label="Address type" defaultValue="home" :style="{ width: '100px' }">
                <Select.Option value="home">Home</Select.Option>
                <Select.Option value="work">Work</Select.Option>
            </Select>
            <AutoComplete :data="addressData" placeholder="Address: " :style="{ width: '180px' }" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Select aria-label="Account action" defaultValue="signup" :style="{ width: '100px' }">
                <Select.Option value="signup">Sign Up</Select.Option>
                <Select.Option value="signin">Sign In</Select.Option>
            </Select>
            <Input placeholder="Email" :style="{ width: '180px' }" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Input placeholder="Name" :style="{ width: '100px' }" />
            <DatePicker placeholder="Birthday" />
        </InputGroup>
    </div>
</template>
