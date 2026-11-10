import { type JSX, type Ref, Show, createMemo, mergeProps, onCleanup, untrack } from 'solid-js';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
import type { PanelType } from '@fibrae/semi-foundation/components/date-picker/months-grid-foundation';
import YearAndMonthFoundation, { type MonthScrollItem, type YearAndMonthAdapter, type YearAndMonthFoundationProps, type YearScrollItem } from '@fibrae/semi-foundation/components/date-picker/year-and-month-foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import type { Locale } from '@fibrae/semi-foundation/locale/index';
import { IconChevronLeft } from '@fibrae/semi-icons-solid';
import useFoundation from '../../base/use-foundation';
import IconButton from '../icon-button';
import ScrollList, { ScrollItem, type ScrollItemHandle, type ScrollItemProps } from '../scroll-list';

const prefixCls = cssClasses.PREFIX;

/** Spread after the panel's own props, so the ones it fills in are left out to keep them from being overridden */
export type YearAndMonthOpts = Partial<Omit<ScrollItemProps, 'list' | 'onSelect' | 'selectedIndex' | 'ref'>>;

export interface YearAndMonthProps extends Omit<YearAndMonthFoundationProps, 'locale'> {
    yearAndMonthOpts?: YearAndMonthOpts;
    locale: Locale['DatePicker'];
    renderQuickControls?: () => JSX.Element;
    renderDateInput?: () => JSX.Element;
    onBackToMain?: () => void;
    /** Receives the handle once, while the panel is created */
    ref?: Ref<YearAndMonthHandle>;
}

export interface YearAndMonthHandle {
    reselect: () => void;
}

type Foundation = YearAndMonthFoundation;
type Adapter = YearAndMonthAdapter;

const defaultProps = {
    monthCycled: false,
    yearCycled: false,
    noBackBtn: false,
    type: 'month',
} satisfies Partial<YearAndMonthProps>;

export default function YearAndMonth(rawProps: YearAndMonthProps) {
    const props = mergeProps(defaultProps, rawProps);

    const columns = new Set<ScrollItemHandle>();

    const { foundation } = useFoundation<Foundation, Adapter, YearAndMonthFoundationProps, Record<string, never>>(
        YearAndMonthFoundation,
        props,
        () => ({}),
        () => ({
            notifySelect: (yearAndMonth) => props.onSelect?.(yearAndMonth),
        })
    );

    const ref = untrack(() => props.ref);

    const current = () => YearAndMonthFoundation.getYearAndMonth(props);

    const iconSize = () => (props.density === 'compact' ? 'default' : 'large');

    const buttonSize = () => (props.density === 'compact' ? 'small' : 'default');

    const register = (handle: ScrollItemHandle) => {
        columns.add(handle);
        onCleanup(() => columns.delete(handle));
    };

    const renderPanel = (panelType: PanelType) => {
        // memoized: ScrollItem reads `list` once per option, and each year runs disabledDate for all twelve months
        const yearList = createMemo(() => YearAndMonthFoundation.getYearList(props, panelType));
        const monthList = createMemo(() => YearAndMonthFoundation.getMonthList(props, panelType));
        return (
            <ScrollList>
                <ScrollItem
                    ref={register}
                    aria-label={props.locale.year}
                    cycled={props.yearCycled}
                    list={yearList()}
                    mode="normal"
                    selectedIndex={yearList().findIndex((item) => item.value === current().currentYear[panelType])}
                    transform={(val: number) => formatLocale(props.locale.yearText, { year: val })}
                    onSelect={(item) => foundation.selectYear(item as YearScrollItem, panelType)}
                    {...props.yearAndMonthOpts}
                />
                <Show when={props.type !== 'year'}>
                    <ScrollItem
                        ref={register}
                        aria-label={props.locale.month}
                        cycled={props.monthCycled}
                        list={monthList()}
                        mode="normal"
                        selectedIndex={monthList().findIndex((item) => item.month === current().currentMonth[panelType])}
                        onSelect={(item) => foundation.selectMonth(item as MonthScrollItem, panelType)}
                        {...props.yearAndMonthOpts}
                    />
                </Show>
            </ScrollList>
        );
    };

    const content = () => (
        <Show when={props.type === 'monthRange'} fallback={renderPanel(strings.PANEL_TYPE_LEFT)}>
            <div class={`${prefixCls}-yearmonth-body`}>
                {renderPanel(strings.PANEL_TYPE_LEFT)}
                {renderPanel(strings.PANEL_TYPE_RIGHT)}
            </div>
        </Show>
    );

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({
            reselect: () => {
                for (const column of columns) {
                    column.scrollToIndex();
                }
            },
        });
    }

    return (
        <>
            <Show when={!props.noBackBtn}>
                <div class={`${prefixCls}-yearmonth-header`}>
                    <IconButton noHorizontalPadding={false} size={buttonSize()} icon={<IconChevronLeft size={iconSize()} />} onClick={() => props.onBackToMain?.()}>
                        <span>{props.locale.selectDate}</span>
                    </IconButton>
                </div>
            </Show>
            <Show
                when={props.presetPosition}
                fallback={
                    <>
                        {props.renderDateInput?.()}
                        {content()}
                    </>
                }
            >
                <div style={{ display: 'flex' }}>
                    <Show when={props.presetPosition === 'left' && props.type !== 'monthRange'}>{props.renderQuickControls?.()}</Show>
                    <div>
                        {props.renderDateInput?.()}
                        {content()}
                    </div>
                    <Show when={props.presetPosition === 'right' && props.type !== 'monthRange'}>{props.renderQuickControls?.()}</Show>
                </div>
            </Show>
        </>
    );
}
