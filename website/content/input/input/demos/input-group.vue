<script setup lang="ts">
    import { AutoComplete, DatePicker, Input, InputGroup, InputNumber, Select, SelectOption } from '@fibrae/semi-ui-vue';

    const addressData = ['Beijing Haidian'];
    const nameStyle = { width: '100px' };
    const scoreStyle = { width: '140px' };
    const selectStyle = { width: '100px' };
    const wideStyle = { width: '180px' };
</script>

<template>
    <div>
        <InputGroup>
            <Input placeholder="Name" :style="nameStyle" />
            <InputNumber placeholder="Score" :style="scoreStyle" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Select aria-label="Address type" defaultValue="home" :style="selectStyle">
                <SelectOption value="home">Home</SelectOption>
                <SelectOption value="work">Work</SelectOption>
            </Select>
            <AutoComplete :data="addressData" placeholder="Address: " :style="wideStyle" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Select aria-label="Account action" defaultValue="signup" :style="selectStyle">
                <SelectOption value="signup">Sign Up</SelectOption>
                <SelectOption value="signin">Sign In</SelectOption>
            </Select>
            <Input placeholder="Email" :style="wideStyle" />
        </InputGroup>
        <br />
        <br />
        <br />
        <InputGroup size="small">
            <Input placeholder="Name" :style="nameStyle" />
            <DatePicker placeholder="Birthday" />
        </InputGroup>
    </div>
</template>
