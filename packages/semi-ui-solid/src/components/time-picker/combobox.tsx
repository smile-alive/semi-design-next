import { type JSX, type Ref, Show, createMemo, onCleanup, untrack } from 'solid-js';
import { pick } from 'es-toolkit';
import { applyItem, getOptions, type ColumnType, type TimeStamp } from '@fibrae/semi-foundation/components/time-picker/combobox-options';
import useLocale from '../locale/use-locale';
import ScrollList, { ScrollItem, type ScrollItemHandle, type ScrollItemProps } from '../scroll-list';

export interface ComboboxProps {
    format?: string;
    prefixCls?: string;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    hideDisabledOptions?: boolean;
    use12Hours?: boolean;
    hourStep?: number;
    minuteStep?: number;
    secondStep?: number;
    scrollItemProps?: Pick<ScrollItemProps, 'cycled' | 'mode' | 'motion' | 'transform'>;
    panelHeader?: JSX.Element;
    panelFooter?: JSX.Element;
    onChange?: (value: { timeStampValue: number }) => void;
    /** The half day the AM/PM and hour columns show while there is no value; defaults to AM */
    defaultIsAM?: boolean;
    timeStampValue?: TimeStamp;
    /** Receives the handle once, while the panel is created */
    ref?: Ref<ComboboxHandle>;
}

/** Called by DatePicker to re-centre the selected items, e.g. after the panel resizes */
export interface ComboboxHandle {
    reselect: () => void;
}

interface AMPMOptionItem {
    value: string;
    text: string;
}

export default function Combobox(props: ComboboxProps) {
    const locale = useLocale('TimePicker');

    const columns: Partial<Record<ColumnType, ScrollItemHandle>> = {};
    const ref = untrack(() => props.ref);

    // the half day follows the value, so a value changed by typing, by props or by the time zone cannot leave it stale
    // picked, not spread: reading the slot props would create their nodes
    const options = createMemo(() => getOptions(pick(props, ['timeStampValue', 'format', 'use12Hours', 'defaultIsAM', 'hideDisabledOptions', 'hourStep', 'minuteStep', 'secondStep', 'disabledHours', 'disabledMinutes', 'disabledSeconds'])));

    const ampmOptions = (): AMPMOptionItem[] => options().ampm.list.map(({ value }) => ({ value, text: locale().locale[value] }));

    // the type allows only these keys; picking them keeps a JS caller from replacing the columns' own list and callbacks
    const itemProps = () => pick(props.scrollItemProps ?? {}, ['cycled', 'mode', 'motion', 'transform']);

    // DatePicker passes no prefixCls, and its time columns take their width from their own panel
    const listCls = (name: ColumnType) => (props.prefixCls ? `${props.prefixCls}-list-${name}` : undefined);

    const withUnit = (unit: 'hour' | 'minute' | 'second') => (text: string) => text + locale().locale[unit];

    const select = (type: ColumnType) => (item: { value: string }) =>
        props.onChange?.({
            timeStampValue: Number(applyItem(props.timeStampValue as TimeStamp, type, item.value, Boolean(props.use12Hours), options().isAM)),
        });

    // accessors, not values: the column is created once and its props stay live
    const column = (type: ColumnType, data: () => { name: string; list: ScrollItemProps['list']; selectedIndex: number }, transform?: (text: string) => string) => {
        // runs in the Show that holds the column, so reselect never reaches a removed column
        onCleanup(() => delete columns[type]);
        return <ScrollItem ref={(handle) => (columns[type] = handle)} class={listCls(type)} aria-label={data().name} list={data().list} mode="normal" selectedIndex={data().selectedIndex} transform={transform} onSelect={select(type)} {...itemProps()} />;
    };

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({
            reselect: () => {
                for (const handle of Object.values(columns)) {
                    handle.scrollToIndex();
                }
            },
        });
    }

    return (
        <ScrollList footer={props.panelFooter} header={props.panelHeader} x-semi-footer-alias="panelFooter" x-semi-header-alias="panelHeader">
            <Show when={props.use12Hours}>{column('ampm', () => ({ name: locale().locale.ampmList, list: ampmOptions(), selectedIndex: options().ampm.selectedIndex }))}</Show>
            <Show when={options().showHour}>{column('hour', () => ({ name: locale().locale.hourList, ...options().hour }), withUnit('hour'))}</Show>
            <Show when={options().showMinute}>{column('minute', () => ({ name: locale().locale.minuteList, ...options().minute }), withUnit('minute'))}</Show>
            <Show when={options().showSecond}>{column('second', () => ({ name: locale().locale.secondList, ...options().second }), withUnit('second'))}</Show>
        </ScrollList>
    );
}
