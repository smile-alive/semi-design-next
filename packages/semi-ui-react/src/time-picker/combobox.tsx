import type React from 'react';
import { useImperativeHandle, useRef } from 'react';
import { pick as pickKeys } from 'es-toolkit';
import ComboboxFoundation, { type formatOption, type ColumnType, type TimeStamp } from '@fibrae/semi-foundation/time-picker/combox-foundation';
import { strings } from '@fibrae/semi-foundation/time-picker/constants';
import type { BaseProps } from '../_base/base-component';
import useLocale from '../locale/use-locale';
import ScrollList from '../scroll-list/index';
import ScrollItem, { type ScrollItemHandle } from '../scroll-list/scroll-item';
import type { TimePickerProps } from './time-picker';

export type ComboboxProps = Pick<TimePickerProps, 'format' | 'prefixCls' | 'disabledHours' | 'disabledMinutes' | 'disabledSeconds' | 'hideDisabledOptions' | 'use12Hours' | 'hourStep' | 'minuteStep' | 'secondStep' | 'scrollItemProps' | 'panelFooter' | 'panelHeader'> &
    BaseProps & {
        onChange?: (value: { timeStampValue: number }) => void;
        /** The half day the AM/PM and hour columns show while there is no value; defaults to AM */
        defaultIsAM?: boolean;
        timeStampValue?: TimeStamp;
        ref?: React.Ref<ComboboxHandle>;
    };

/** Called by DatePicker to re-centre the selected items, e.g. after the panel resizes */
export interface ComboboxHandle {
    reselect: () => void;
}

export type FormatOptionReturn = ReturnType<typeof formatOption>;
export interface AMPMOptionItem {
    value: string;
    text: string;
}

/** One time panel: a scroll column each for AM/PM, hours, minutes and seconds */
export default function Combobox({ ref, prefixCls, format = strings.DEFAULT_FORMAT, disabledHours, disabledMinutes, disabledSeconds, hideDisabledOptions, use12Hours, hourStep, minuteStep, secondStep, scrollItemProps, panelHeader, panelFooter, onChange, defaultIsAM, timeStampValue }: ComboboxProps) {
    const { locale } = useLocale('TimePicker');

    const ampmRef = useRef<ScrollItemHandle>(null);
    const hourRef = useRef<ScrollItemHandle>(null);
    const minuteRef = useRef<ScrollItemHandle>(null);
    const secondRef = useRef<ScrollItemHandle>(null);
    let ampmSelect: React.ReactNode = null;

    // the half day follows the value, so a value changed by typing, by props or by the time zone cannot leave it stale
    const { showHour, showMinute, showSecond, isAM, hour, minute, second } = ComboboxFoundation.getOptions({
        timeStampValue,
        format,
        use12Hours,
        defaultIsAM,
        hideDisabledOptions,
        hourStep,
        minuteStep,
        secondStep,
        disabledHours,
        disabledMinutes,
        disabledSeconds,
    });

    // the type allows only these keys; picking them keeps a JS caller from replacing the columns' own list and callbacks
    const itemProps = pickKeys(scrollItemProps ?? {}, ['cycled', 'mode', 'motion', 'transform']);

    const pick = (type: ColumnType) => (item: { value: string }) =>
        onChange?.({
            timeStampValue: Number(ComboboxFoundation.applyItem(timeStampValue, type, item.value, use12Hours, isAM)),
        });

    // DatePicker passes no prefixCls, and its time columns take their width from their own panel
    const listCls = (name: string) => (prefixCls ? `${prefixCls}-list-${name}` : undefined);

    useImperativeHandle(
        ref,
        () => ({
            reselect: () => {
                for (const item of [ampmRef, hourRef, minuteRef, secondRef]) {
                    item.current?.scrollToIndex();
                }
            },
        }),
        []
    );

    if (use12Hours) {
        const AMPMOptions: AMPMOptionItem[] = [
            { value: 'AM', text: locale.AM },
            { value: 'PM', text: locale.PM },
        ];
        ampmSelect = <ScrollItem<AMPMOptionItem> ref={ampmRef} type="ampm" className={listCls('ampm')} aria-label={locale.ampmList} list={AMPMOptions} mode="normal" selectedIndex={isAM ? 0 : 1} onSelect={pick('ampm')} {...itemProps} />;
    }

    let hourSelect: React.ReactNode = null;

    if (showHour) {
        hourSelect = <ScrollItem<FormatOptionReturn> ref={hourRef} type="hour" className={listCls('hour')} aria-label={locale.hourList} list={hour.list} mode="normal" selectedIndex={hour.selectedIndex} transform={(text: string) => text + locale.hour} onSelect={pick('hour')} {...itemProps} />;
    }

    let minuteSelect: React.ReactNode = null;

    if (showMinute) {
        minuteSelect = <ScrollItem<FormatOptionReturn> ref={minuteRef} type="minute" className={listCls('minute')} aria-label={locale.minuteList} list={minute.list} mode="normal" selectedIndex={minute.selectedIndex} transform={(min: string) => min + locale.minute} onSelect={pick('minute')} {...itemProps} />;
    }

    let secondSelect: React.ReactNode = null;

    if (showSecond) {
        secondSelect = <ScrollItem<FormatOptionReturn> ref={secondRef} type="second" className={listCls('second')} aria-label={locale.secondList} list={second.list} mode="normal" selectedIndex={second.selectedIndex} transform={(sec: string) => sec + locale.second} onSelect={pick('second')} {...itemProps} />;
    }

    return (
        <ScrollList footer={panelFooter} header={panelHeader} x-semi-footer-alias="panelFooter" x-semi-header-alias="panelHeader">
            {ampmSelect}
            {hourSelect}
            {minuteSelect}
            {secondSelect}
        </ScrollList>
    );
}
