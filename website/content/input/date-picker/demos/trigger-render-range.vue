<script setup lang="ts">
    import { ref } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-vue';
    import { Button, ButtonGroup, DatePicker, type DatePickerValueType } from '@fibrae/semi-ui-vue';

    const formatToken = 'yyyy-MM-dd HH:mm:ss';
    const date = ref<DatePickerValueType>();

    const onChange = (value: Date | Date[] | undefined) => {
        console.log(value);
    };
</script>

<template>
    <DatePicker v-model="date" type="dateTimeRange" @change="onChange">
        <template #trigger="{ value }">
            <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
            <ButtonGroup theme="light">
                <Button iconPosition="right">
                    <template #icon>
                        <IconChevronDown />
                    </template>
                    {{ value.length ? `${dateFns.format(value[0], formatToken)} ~ ${dateFns.format(value[1], formatToken)}` : '请选择日期时间范围' }}
                </Button>
                <Button v-if="value.length" aria-label="清除" @click.stop="date = undefined">
                    <template #icon>
                        <IconClose />
                    </template>
                </Button>
            </ButtonGroup>
        </template>
    </DatePicker>
</template>
