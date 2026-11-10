<script setup lang="ts">
    import { ref } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-vue';
    import { Button, ButtonGroup, DatePicker, type DatePickerValueType } from '@fibrae/semi-ui-vue';

    const formatToken = 'yyyy-MM-dd HH:mm:ss';
    const date = ref<DatePickerValueType>();

    const onChange = (value?: Date | Date[]) => {
        console.log(value);
    };
</script>

<template>
    <DatePicker v-model="date" type="dateTimeRange" @change="onChange">
        <template #trigger="triggerProps">
            <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
            <ButtonGroup theme="light">
                <Button iconPosition="right">
                    <template #icon>
                        <IconChevronDown />
                    </template>
                    {{ triggerProps.value.length ? `${dateFns.format(triggerProps.value[0], formatToken)} ~ ${dateFns.format(triggerProps.value[1], formatToken)}` : '请选择日期时间范围' }}
                </Button>
                <Button v-if="triggerProps.value.length" aria-label="清除" @click.stop="date = undefined">
                    <template #icon>
                        <IconClose />
                    </template>
                </Button>
            </ButtonGroup>
        </template>
    </DatePicker>
</template>
