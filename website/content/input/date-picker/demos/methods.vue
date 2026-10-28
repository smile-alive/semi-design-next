<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Button, DatePicker, Space, type DatePickerHandle } from '@fibrae/semi-ui-vue';

    const picker = useTemplateRef<DatePickerHandle>('picker');

    const handleClickOutside = () => {
        console.log('click outside');
    };
</script>

<template>
    <Space align="start" vertical>
        <Space>
            <Button @click="picker?.open()">open</Button>
            <Button @click="picker?.close()">close</Button>
            <Button @click="picker?.focus()">focus</Button>
            <Button @click="picker?.blur()">blur</Button>
        </Space>
        <div>
            <DatePicker ref="picker" type="dateTime" @clickOutSide="handleClickOutside" />
        </div>
    </Space>
</template>
