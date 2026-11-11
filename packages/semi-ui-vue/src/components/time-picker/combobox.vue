<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { applyItem, getOptions, type ColumnType } from '@fibrae/semi-foundation/components/time-picker/combobox-options';
    import { strings } from '@fibrae/semi-foundation/components/time-picker/constants';
    import useLocale from '../locale/use-locale';
    import ScrollItem from '../scroll-list/scroll-item.vue';
    import ScrollList from '../scroll-list/scroll-list.vue';
    import type { ComboboxEmits, ComboboxHandle, ComboboxProps, ComboboxSlots } from './interface';

    defineOptions({ name: 'Combobox', inheritAttrs: false });

    const props = withDefaults(defineProps<ComboboxProps>(), {
        timeStampValue: undefined,
        format: strings.DEFAULT_FORMAT,
        prefixCls: undefined,
        use12Hours: false,
        defaultIsAM: true,
        hideDisabledOptions: false,
        hourStep: undefined,
        minuteStep: undefined,
        secondStep: undefined,
        disabledHours: undefined,
        disabledMinutes: undefined,
        disabledSeconds: undefined,
        scrollItemProps: undefined,
    });

    const emit = defineEmits<ComboboxEmits>();
    defineSlots<ComboboxSlots>();

    const locale = useLocale('TimePicker');

    const ampm = useTemplateRef('ampm');
    const hour = useTemplateRef('hour');
    const minute = useTemplateRef('minute');
    const second = useTemplateRef('second');

    const options = computed(() => getOptions(props));
    const ampmOptions = computed(() => options.value.ampm.list.map(({ value }) => ({ value, text: locale.value.locale[value] })));

    const columnClass = (type: ColumnType) => (props.prefixCls ? `${props.prefixCls}-list-${type}` : undefined);

    const withUnit = (unit: 'hour' | 'minute' | 'second') => (value: string) => value + locale.value.locale[unit];

    const pick = (type: ColumnType, item: { value: string }) =>
        emit('change', {
            timeStampValue: Number(applyItem(props.timeStampValue!, type, item.value, props.use12Hours, options.value.isAM)),
        });

    defineExpose<ComboboxHandle>({
        reselect: () => {
            for (const item of [ampm.value, hour.value, minute.value, second.value]) {
                item?.scrollToIndex();
            }
        },
    });
</script>

<template>
    <ScrollList>
        <template #header>
            <slot name="panelHeader" />
        </template>
        <template #footer>
            <slot name="panelFooter" />
        </template>
        <ScrollItem v-if="props.use12Hours" ref="ampm" :aria-label="locale.locale.ampmList" :class="columnClass('ampm')" :list="ampmOptions" mode="normal" :selectedIndex="options.ampm.selectedIndex" v-bind="props.scrollItemProps" @select="pick('ampm', $event)" />
        <ScrollItem v-if="options.showHour" ref="hour" :aria-label="locale.locale.hourList" :class="columnClass('hour')" :list="options.hour.list" mode="normal" :selectedIndex="options.hour.selectedIndex" :transform="withUnit('hour')" v-bind="props.scrollItemProps" @select="pick('hour', $event)" />
        <ScrollItem v-if="options.showMinute" ref="minute" :aria-label="locale.locale.minuteList" :class="columnClass('minute')" :list="options.minute.list" mode="normal" :selectedIndex="options.minute.selectedIndex" :transform="withUnit('minute')" v-bind="props.scrollItemProps" @select="pick('minute', $event)" />
        <ScrollItem v-if="options.showSecond" ref="second" :aria-label="locale.locale.secondList" :class="columnClass('second')" :list="options.second.list" mode="normal" :selectedIndex="options.second.selectedIndex" :transform="withUnit('second')" v-bind="props.scrollItemProps" @select="pick('second', $event)" />
    </ScrollList>
</template>
