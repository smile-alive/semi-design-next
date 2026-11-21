<script lang="ts">
    import { applyItem, getOptions, type ColumnType } from '@fibrae/semi-foundation/components/time-picker/combobox-options';
    import { strings } from '@fibrae/semi-foundation/components/time-picker/constants';
    import useLocale from '../locale/use-locale.svelte.js';
    import { ScrollItem, type ScrollItemHandle, type ScrollItemSelectData, ScrollList } from '../scroll-list/index.js';
    import type { ComboboxProps } from './interface.js';

    let {
        classNames,
        styles,
        timeStampValue,
        format = strings.DEFAULT_FORMAT,
        prefixCls,
        use12Hours = false,
        defaultIsAM = true,
        hideDisabledOptions = false,
        hourStep,
        minuteStep,
        secondStep,
        disabledHours,
        disabledMinutes,
        disabledSeconds,
        scrollItemProps,
        panelHeader,
        panelFooter,
        onChange,
    }: ComboboxProps = $props();

    const locale = useLocale('TimePicker');

    let ampm = $state<ScrollItemHandle>();
    let hour = $state<ScrollItemHandle>();
    let minute = $state<ScrollItemHandle>();
    let second = $state<ScrollItemHandle>();

    const options = $derived(getOptions({ timeStampValue, format, use12Hours, defaultIsAM, hideDisabledOptions, hourStep, minuteStep, secondStep, disabledHours, disabledMinutes, disabledSeconds }));
    const ampmOptions = $derived(options.ampm.list.map(({ value }) => ({ value, text: locale().locale[value] })));
    const mode = $derived(scrollItemProps?.mode ?? 'normal');

    // always objects, so the columns do not read ScrollItem's global default
    const itemClassNames = $derived({ option: classNames?.item });
    const itemStyles = $derived({ option: styles?.item });

    const columnClass = (type: ColumnType) => {
        return prefixCls ? `${prefixCls}-list-${type}` : undefined;
    };

    const withUnit = (unit: 'hour' | 'minute' | 'second') => {
        return (value: string | number) => `${value}${locale().locale[unit]}`;
    };

    const pick = (type: ColumnType, item: ScrollItemSelectData) => {
        onChange?.({ timeStampValue: Number(applyItem(timeStampValue!, type, String(item.value), use12Hours, options.isAM)) });
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

<ScrollList classNames={{ header: classNames?.header, body: classNames?.content, footer: classNames?.footer }} footer={panelFooter} header={panelHeader} styles={{ header: styles?.header, body: styles?.content, footer: styles?.footer }}>
    {#if use12Hours}
        <ScrollItem bind:this={ampm} {...scrollItemProps} aria-label={locale().locale.ampmList} bind:selectedIndex={() => options.ampm.selectedIndex, keepIndex} class={columnClass('ampm')} classNames={itemClassNames} list={ampmOptions} {mode} onSelect={(item) => pick('ampm', item)} styles={itemStyles} />
    {/if}
    {#if options.showHour}
        <ScrollItem
            bind:this={hour}
            transform={withUnit('hour')}
            {...scrollItemProps}
            aria-label={locale().locale.hourList}
            bind:selectedIndex={() => options.hour.selectedIndex, keepIndex}
            class={columnClass('hour')}
            classNames={itemClassNames}
            list={options.hour.list}
            {mode}
            onSelect={(item) => pick('hour', item)}
            styles={itemStyles}
        />
    {/if}
    {#if options.showMinute}
        <ScrollItem
            bind:this={minute}
            transform={withUnit('minute')}
            {...scrollItemProps}
            aria-label={locale().locale.minuteList}
            bind:selectedIndex={() => options.minute.selectedIndex, keepIndex}
            class={columnClass('minute')}
            classNames={itemClassNames}
            list={options.minute.list}
            {mode}
            onSelect={(item) => pick('minute', item)}
            styles={itemStyles}
        />
    {/if}
    {#if options.showSecond}
        <ScrollItem
            bind:this={second}
            transform={withUnit('second')}
            {...scrollItemProps}
            aria-label={locale().locale.secondList}
            bind:selectedIndex={() => options.second.selectedIndex, keepIndex}
            class={columnClass('second')}
            classNames={itemClassNames}
            list={options.second.list}
            {mode}
            onSelect={(item) => pick('second', item)}
            styles={itemStyles}
        />
    {/if}
</ScrollList>
