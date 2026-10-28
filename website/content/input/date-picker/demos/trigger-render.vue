<script setup lang="ts">
    import { ref } from 'vue';
    import * as dateFns from 'date-fns';
    import { IconChevronDown, IconClose } from '@fibrae/semi-icons-vue';
    import { Button, ButtonGroup, DatePicker, type DatePickerValueType } from '@fibrae/semi-ui-vue';

    const formatToken = 'yyyy-MM-dd';
    const date = ref<DatePickerValueType | null | undefined>(new Date(2024, 4, 6, 10, 30, 0));
</script>

<template>
    <DatePicker v-model="date" :format="formatToken">
        <template #trigger="{ value, placeholder }">
            <!-- The clear button is a sibling of the trigger button: buttons cannot nest -->
            <ButtonGroup theme="light">
                <Button iconPosition="right">
                    <template #icon>
                        <IconChevronDown />
                    </template>
                    {{ value.length ? dateFns.format(value[0], formatToken) : placeholder }}
                </Button>
                <Button v-if="date" aria-label="清除" @click.stop="date = null">
                    <template #icon>
                        <IconClose />
                    </template>
                </Button>
            </ButtonGroup>
        </template>
    </DatePicker>
</template>
