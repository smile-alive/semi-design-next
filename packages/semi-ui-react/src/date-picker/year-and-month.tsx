import type React from 'react';
import { useImperativeHandle, useRef } from 'react';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import YearAndMonthFoundation, { type YearAndMonthAdapter, type YearAndMonthFoundationProps } from '@fibrae/semi-foundation/date-picker/year-and-month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconChevronLeft } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../_base/base-component';
import useFoundation from '../_base/use-foundation';
import IconButton from '../icon-button';
import ScrollList from '../scroll-list/index';
import ScrollItem, { type ScrollItemHandle, type ScrollItemProps } from '../scroll-list/scroll-item';

const prefixCls = `${BASE_CLASS_PREFIX}-datepicker`;

/** Spread after the panel's own props, so the ones it fills in are left out to keep them from being overridden */
export type YearAndMonthOpts = Partial<Omit<ScrollItemProps<any>, 'list' | 'onSelect' | 'selectedIndex' | 'type'>>;

export interface YearAndMonthProps extends YearAndMonthFoundationProps, BaseProps {
    yearAndMonthOpts?: YearAndMonthOpts;
    locale?: Locale['DatePicker'];
    ref?: React.Ref<YearAndMonthHandle>;
}

/** Called by MonthsGrid to re-centre the year and month columns, e.g. after the panel resizes */
export interface YearAndMonthHandle {
    reselect: () => void;
}

function noDisabledDate() {
    return false;
}

/** The year and month scroll columns, for the month, monthRange and year types and the year switch of a date panel */
export default function YearAndMonth({ ref, ...rawProps }: YearAndMonthProps) {
    const yearRef = useRef<ScrollItemHandle>(null);
    const monthRef = useRef<ScrollItemHandle>(null);

    const { disabledDate = noDisabledDate, monthCycled = false, yearCycled = false, noBackBtn = false, onSelect = noop, type = 'month' } = rawProps;

    const props = { ...rawProps, disabledDate, monthCycled, yearCycled, noBackBtn, onSelect, type };
    const { locale, density, presetPosition, renderQuickControls, renderDateInput, yearAndMonthOpts } = props;

    const [foundation] = useFoundation<YearAndMonthFoundation, YearAndMonthAdapter, YearAndMonthProps, Record<string, never>>(
        YearAndMonthFoundation,
        props,
        () => ({}),
        (base) => ({
            notifySelect: (yearAndMonth) => base.getProps().onSelect(yearAndMonth),
            notifyBackToMain: () => base.getProps().onBackToMain(),
        })
    );

    const { currentYear, currentMonth } = YearAndMonthFoundation.getYearAndMonth(props);
    const iconSize = density === 'compact' ? 'default' : 'large';
    const buttonSize = density === 'compact' ? 'small' : 'default';

    const renderPanel = (panelType: PanelType) => {
        const yearList = YearAndMonthFoundation.getYearList(props, panelType);
        const monthList = YearAndMonthFoundation.getMonthList(props, panelType);
        return (
            <ScrollList>
                <ScrollItem
                    ref={yearRef}
                    type="year"
                    aria-label={locale.year}
                    cycled={yearCycled}
                    list={yearList}
                    mode="normal"
                    selectedIndex={yearList.findIndex((item) => item.value === currentYear[panelType])}
                    transform={(val: number) => locale.yearText.replace('${year}', String(val))}
                    onSelect={(item) => foundation.selectYear(item, panelType)}
                    {...yearAndMonthOpts}
                />
                {type !== 'year' && (
                    <ScrollItem ref={monthRef} type="month" aria-label={locale.month} cycled={monthCycled} list={monthList} mode="normal" selectedIndex={monthList.findIndex((item) => item.month === currentMonth[panelType])} onSelect={(item) => foundation.selectMonth(item, panelType)} {...yearAndMonthOpts} />
                )}
            </ScrollList>
        );
    };

    const content =
        type === 'monthRange' ? (
            <div className={`${prefixCls}-yearmonth-body`}>
                {renderPanel(strings.PANEL_TYPE_LEFT)}
                {renderPanel(strings.PANEL_TYPE_RIGHT)}
            </div>
        ) : (
            renderPanel(strings.PANEL_TYPE_LEFT)
        );

    useImperativeHandle(
        ref,
        () => ({
            reselect: () => {
                yearRef.current?.scrollToIndex();
                monthRef.current?.scrollToIndex();
            },
        }),
        []
    );

    return (
        <>
            {!noBackBtn && (
                <div className={`${prefixCls}-yearmonth-header`}>
                    <IconButton noHorizontalPadding={false} size={buttonSize} icon={<IconChevronLeft size={iconSize} />} onClick={foundation.backToMain}>
                        <span>{locale.selectDate}</span>
                    </IconButton>
                </div>
            )}
            {presetPosition ? (
                <div style={{ display: 'flex' }}>
                    {presetPosition === 'left' && type !== 'monthRange' && renderQuickControls}
                    <div>
                        {renderDateInput}
                        {content}
                    </div>
                    {presetPosition === 'right' && type !== 'monthRange' && renderQuickControls}
                </div>
            ) : (
                <>
                    {renderDateInput}
                    {content}
                </>
            )}
        </>
    );
}
