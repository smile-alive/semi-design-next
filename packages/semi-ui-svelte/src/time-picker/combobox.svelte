<script lang="ts">
    import ComboboxFoundation, { type ColumnType, type TimeStamp } from '@fibrae/semi-foundation/time-picker/combox-foundation';
    import { strings } from '@fibrae/semi-foundation/time-picker/constants';
    import useLocale from '../locale/use-locale.svelte.js';
    import { ScrollItem, type ScrollItemHandle, type ScrollItemSelectData, ScrollList } from '../scroll-list/index.js';
    import type { ComboboxProps } from './interface.js';

    let { timeStampValue, format = strings.DEFAULT_FORMAT, prefixCls, use12Hours = false, defaultIsAM = true, hideDisabledOptions = false, hourStep, minuteStep, secondStep, disabledHours, disabledMinutes, disabledSeconds, scrollItemProps, panelHeader, panelFooter, onChange }: ComboboxProps = $props();

    const locale = useLocale('TimePicker');

    let ampm = $state<ScrollItemHandle>();
    let hour = $state<ScrollItemHandle>();
    let minute = $state<ScrollItemHandle>();
    let second = $state<ScrollItemHandle>();

    const options = $derived(ComboboxFoundation.getOptions({ timeStampValue, format, use12Hours, defaultIsAM, hideDisabledOptions, hourStep, minuteStep, secondStep, disabledHours, disabledMinutes, disabledSeconds }));

    const ampmOptions = $derived([
        { value: 'AM', text: locale().locale.AM },
        { value: 'PM', text: locale().locale.PM },
    ]);

    // the caller's mode wins over the panel's normal mode, as in the other frameworks
    const mode = $derived(scrollItemProps?.mode ?? 'normal');

    const columnClass = (type: ColumnType) => {
        return prefixCls ? `${prefixCls}-list-${type}` : undefined;
    };

    const withUnit = (unit: 'hour' | 'minute' | 'second') => {
        return (value: string | number) => `${value}${locale().locale[unit]}`;
    };

    const pick = (type: ColumnType, item: ScrollItemSelectData) => {
        onChange?.({ timeStampValue: Number(ComboboxFoundation.applyItem(timeStampValue as TimeStamp, type, String(item.value), use12Hours, options.isAM)) });
    };

    // The selected index follows the value only: a selection is reported through onSelect, and a value its owner
    // rejects must not leave the column on the clicked item
    const keepIndex = () => {};

    export function reselect() {
        for (const item of [ampm, hour, minute, second]) {
            item?.scrollToIndex();
        }
    }
</script>

<ScrollList footer={panelFooter} header={panelHeader}>
    {#if use12Hours}
        <ScrollItem bind:this={ampm} {...scrollItemProps} aria-label={locale().locale.ampmList} bind:selectedIndex={() => (options.isAM ? 0 : 1), keepIndex} class={columnClass('ampm')} list={ampmOptions} {mode} onSelect={(item) => pick('ampm', item)} type="ampm" />
    {/if}
    {#if options.showHour}
        <ScrollItem bind:this={hour} transform={withUnit('hour')} {...scrollItemProps} aria-label={locale().locale.hourList} bind:selectedIndex={() => options.hour.selectedIndex, keepIndex} class={columnClass('hour')} list={options.hour.list} {mode} onSelect={(item) => pick('hour', item)} type="hour" />
    {/if}
    {#if options.showMinute}
        <ScrollItem bind:this={minute} transform={withUnit('minute')} {...scrollItemProps} aria-label={locale().locale.minuteList} bind:selectedIndex={() => options.minute.selectedIndex, keepIndex} class={columnClass('minute')} list={options.minute.list} {mode} onSelect={(item) => pick('minute', item)} type="minute" />
    {/if}
    {#if options.showSecond}
        <ScrollItem bind:this={second} transform={withUnit('second')} {...scrollItemProps} aria-label={locale().locale.secondList} bind:selectedIndex={() => options.second.selectedIndex, keepIndex} class={columnClass('second')} list={options.second.list} {mode} onSelect={(item) => pick('second', item)} type="second" />
    {/if}
</ScrollList>
