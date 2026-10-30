import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { ArrayElement } from '../utils/type';
import getYearAndMonth from './_utils/get-year-and-month';
import getYears from './_utils/get-years';
import { strings } from './constants';
import type { PresetPosition } from './foundation';
import type { PanelType } from './months-grid-foundation';

type Type = ArrayElement<typeof strings.TYPE_SET>;

export interface YearAndMonth {
    currentYear: { left: number; right: number };
    currentMonth: { left: number; right: number };
}

export interface YearAndMonthFoundationProps {
    /** 0 stands for the current year, or the year after it for the right panel */
    currentYear: { left: number; right: number };
    /** 0 stands for the current month, or the month after next for the right panel */
    currentMonth: { left: number; right: number };
    onSelect?: (obj: YearAndMonth) => void;
    onBackToMain?: () => void;
    locale?: any;
    monthCycled?: boolean;
    yearCycled?: boolean;
    noBackBtn?: boolean;
    disabledDate?: (date: Date) => boolean;
    density?: string;
    presetPosition?: PresetPosition;
    renderQuickControls?: any;
    renderDateInput?: any;
    type?: Type;
    yearAndMonthOpts?: any;
    startYear?: number;
    endYear?: number;
}

export interface YearAndMonthAdapter extends DefaultAdapter<YearAndMonthFoundationProps, Record<string, never>> {
    notifySelect: (yearAndMonth: YearAndMonth) => void;
    notifyBackToMain: () => void;
}

export interface MonthScrollItem {
    [k: string]: any;
    month: number;
    value: string;
    disabled: boolean;
}

export interface YearScrollItem {
    [k: string]: any;
    year: number;
    value: number;
    disabled: boolean;
}

const MONTHS = Array.from({ length: 12 }, (_v, idx) => idx + 1);

export default class YearAndMonthFoundation extends BaseFoundation<YearAndMonthAdapter, YearAndMonthFoundationProps, Record<string, never>> {
    #autoSelectMonth(item: YearScrollItem, panelType: PanelType, year: { left: number; right: number }, currentMonth: { left: number; right: number }) {
        const { disabledDate } = this._adapter.getProps();

        const oppositeType = panelType === strings.PANEL_TYPE_LEFT ? 'right' : 'left';

        const isValid = (month: number) => !disabledDate(new Date(item.year, month - 1));
        const isCurrentMonthDisabled = !isValid(currentMonth[panelType]);
        const isOppositeMonthDisabled = disabledDate(new Date(year[oppositeType], currentMonth[oppositeType] - 1));

        if (!isCurrentMonthDisabled && !isOppositeMonthDisabled) {
            return;
        }
        let finalYear = year;
        let finalMonth = { ...currentMonth };
        if (isCurrentMonthDisabled) {
            const currentIndex = MONTHS.indexOf(currentMonth[panelType]);
            const validMonth = MONTHS.slice(currentIndex).find(isValid) ?? MONTHS.slice(0, currentIndex).find(isValid);
            if (validMonth && !isOppositeMonthDisabled) {
                finalMonth[panelType] = validMonth;
            } else if (validMonth && isOppositeMonthDisabled) {
                finalYear = { left: item.year, right: item.year };
                finalMonth = { left: validMonth, right: validMonth };
            }
        } else if (!isCurrentMonthDisabled && isOppositeMonthDisabled) {
            finalYear = { left: item.year, right: item.year };
            finalMonth = { left: currentMonth[panelType], right: currentMonth[panelType] };
        }
        this._adapter.notifySelect({ currentYear: finalYear, currentMonth: finalMonth });
    }

    /** The shown year and month of both panels; the props win on every render */
    static getYearAndMonth(props: Pick<YearAndMonthFoundationProps, 'currentYear' | 'currentMonth'>): YearAndMonth {
        const { year, month } = getYearAndMonth(props.currentYear, props.currentMonth);
        return { currentYear: year, currentMonth: month };
    }

    /**
     * The year column of a panel: a year is disabled when all its months are, or it is before the left year.
     * Picking gives the first day at 00:00 of a year or a month, so `disabledDate` is called with those dates.
     */
    static getYearList(props: YearAndMonthFoundationProps, panelType: PanelType): YearScrollItem[] {
        const { disabledDate, startYear, endYear, type } = props;
        const { currentYear } = YearAndMonthFoundation.getYearAndMonth(props);
        const leftYear = currentYear[strings.PANEL_TYPE_LEFT];
        return getYears(startYear, endYear).map((year) => ({
            year,
            value: year,
            disabled: type === 'year' ? disabledDate(new Date(year, 0)) : MONTHS.every((month) => disabledDate(new Date(year, month - 1))) || Boolean(panelType === strings.PANEL_TYPE_RIGHT && leftYear && leftYear > year),
        }));
    }

    /** The month column of a panel; in the right panel of the same year no month may come before the left one */
    static getMonthList(props: YearAndMonthFoundationProps, panelType: PanelType): MonthScrollItem[] {
        const { disabledDate, locale } = props;
        const { currentYear, currentMonth } = YearAndMonthFoundation.getYearAndMonth(props);
        const left = strings.PANEL_TYPE_LEFT;
        const right = strings.PANEL_TYPE_RIGHT;
        return MONTHS.map((month) => ({
            month,
            disabled: disabledDate(new Date(currentYear[panelType], month - 1)) || Boolean(panelType === right && currentMonth[left] && currentYear[left] === currentYear[right] && currentMonth[left] > month),
            value: locale.fullMonths[month],
        }));
    }

    selectYear = (item: YearScrollItem, panelType?: PanelType) => {
        const { currentYear, currentMonth } = YearAndMonthFoundation.getYearAndMonth(this.getProps());
        const { type } = this.getProps();
        const left = strings.PANEL_TYPE_LEFT;
        const right = strings.PANEL_TYPE_RIGHT;

        const year = { ...currentYear };
        year[panelType] = item.value;

        if (type === 'monthRange') {
            const isSameYearIllegalDate = year[left] === year[right] && currentMonth[left] > currentMonth[right];
            if ((panelType === left && item.value > year[right]) || (panelType === left && isSameYearIllegalDate)) {
                year[right] = item.value + 1;
            } else if (panelType === right && isSameYearIllegalDate) {
                year[left] = item.value - 1;
            }
        }

        this._adapter.notifySelect({ currentMonth, currentYear: year });
        if (type !== 'year') {
            this.#autoSelectMonth(item, panelType, year, currentMonth);
        }
    };

    selectMonth = (item: MonthScrollItem, panelType?: PanelType) => {
        const { currentMonth, currentYear } = YearAndMonthFoundation.getYearAndMonth(this.getProps());
        const { type } = this.getProps();
        const left = strings.PANEL_TYPE_LEFT;
        const right = strings.PANEL_TYPE_RIGHT;

        const month = { ...currentMonth };
        month[panelType] = item.month;

        if (type === 'monthRange' && panelType === left && currentYear[left] === currentYear[right] && item.month > month[right]) {
            month[right] = item.month;
        }

        this._adapter.notifySelect({ currentYear, currentMonth: month });
    };

    backToMain = () => {
        this._adapter.notifyBackToMain();
    };
}
