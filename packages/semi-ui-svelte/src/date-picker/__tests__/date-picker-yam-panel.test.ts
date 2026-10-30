import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, getPopup, getYMLists, getYMSelected } from './date-picker-dom-utils';
import YamFixture, { type YamFixtureStore } from './date-picker-yam-fixture.svelte';
import { changes, dp, getInput, settle, setup, useBaseDate } from './test-utils';

useBaseDate();

const selections = (store: YamFixtureStore) => store.log.filter((entry) => entry !== 'back').map((entry) => JSON.parse(entry));

async function renderYearAndMonth(init: Partial<Omit<YamFixtureStore, 'props'>> & { props?: Partial<YamFixtureStore['props']> } = {}) {
    const store = createStore<YamFixtureStore>({
        log: [],
        ...init,
        props: { currentYear: { left: 2021, right: 2022 }, currentMonth: { left: 6, right: 7 }, locale: en_US.DatePicker, type: 'month', ...init.props },
    });
    render(YamFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker month 类型的年月面板', () => {
    it('month 类型不带返回按钮，面板是年、月两列', async () => {
        await setup({ value: new Date(2021, 5), open: true, props: { type: 'month' } });
        expect(getYMLists()).toHaveLength(2);
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
    });

    it('startYear 与 endYear 限定年份列表', async () => {
        await setup({ open: true, props: { type: 'month', endYear: 2025, startYear: 2020 } });
        const years = within(getYMLists()[0])
            .getAllByRole('option')
            .map((option) => option.textContent?.replace('年', ''));
        expect(years).toEqual(['2020', '2021', '2022', '2023', '2024', '2025']);
    });

    it('面板渲染与年月选择：先选年再选月，输入框随之更新', async () => {
        const { store } = await setup({ value: new Date(2021, 5), open: true, props: { type: 'month' } });
        expect(getPopup()).toHaveClass(`${dp}-panel-yam`);
        expect(getYMLists()).toHaveLength(2);
        expect(getYMSelected()).toEqual(['2021年', '6月']);

        await click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(changes(store).at(-1)).toBe('change 2023-06-01 00:00:00 "2023-06"');
        await click(within(getYMLists()[1]).getByRole('option', { name: '9月' }));
        expect(changes(store).at(-1)).toBe('change 2023-09-01 00:00:00 "2023-09"');
        expect(getInput()).toHaveValue('2023-09');
    });

    it('monthRange 类型渲染两组年月列', async () => {
        await setup({ value: [new Date(2021, 2), new Date(2021, 8)], open: true, props: { type: 'monthRange' } });
        expect(getPopup()?.querySelector(`.${dp}-yearmonth-body`)).not.toBeNull();
        expect(getYMLists()).toHaveLength(4);
        expect(getYMSelected()).toEqual(['2021年', '3月', '2021年', '9月']);
    });
});

describe('Svelte DatePicker YearAndMonth 组件', () => {
    it('选择年份：onSelect 带新年份，月份不变', async () => {
        const store = await renderYearAndMonth();
        await click(within(getYMLists()[0]).getByRole('option', { name: '2023' }));
        expect(selections(store)).toEqual([{ currentYear: { left: 2023, right: 2022 }, currentMonth: { left: 6, right: 7 } }]);
    });

    it('选择月份：onSelect 带新月份，年份不变', async () => {
        const store = await renderYearAndMonth();
        await click(within(getYMLists()[1]).getByRole('option', { name: 'March' }));
        expect(selections(store)).toEqual([{ currentYear: { left: 2021, right: 2022 }, currentMonth: { left: 3, right: 7 } }]);
    });

    it('monthRange 选择左侧年份大于右侧时，右侧年份顺延', async () => {
        const store = await renderYearAndMonth({ props: { type: 'monthRange' } });
        await click(within(getYMLists()[0]).getByRole('option', { name: '2025' }));
        expect(selections(store)).toContainEqual({ currentYear: { left: 2025, right: 2026 }, currentMonth: { left: 6, right: 7 } });
    });

    it('monthRange 右侧同年时，选择会让右侧早于左侧的年份时改动左侧', async () => {
        const store = await renderYearAndMonth({ props: { type: 'monthRange', currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 9, right: 3 } } });
        await click(within(getYMLists()[2]).getByRole('option', { name: '2021' }));
        expect(selections(store)).toContainEqual({ currentYear: { left: 2020, right: 2021 }, currentMonth: { left: 9, right: 3 } });
    });

    it('monthRange 选择月份让左侧晚于右侧时，两侧月份对齐', async () => {
        const store = await renderYearAndMonth({ props: { type: 'monthRange', currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 3, right: 5 } } });
        await click(within(getYMLists()[1]).getByRole('option', { name: 'October' }));
        expect(selections(store)).toContainEqual({ currentYear: { left: 2021, right: 2021 }, currentMonth: { left: 10, right: 10 } });
    });

    it('键盘：聚焦返回按钮按 Enter 触发 onBackToMain', async () => {
        const store = await renderYearAndMonth();
        screen.getByRole('button', { name: 'Select Date' }).focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(store.log).toEqual(['back']);
    });

    it('点击返回按钮触发 onBackToMain', async () => {
        const store = await renderYearAndMonth();
        await click(screen.getByRole('button', { name: 'Select Date' }));
        expect(store.log).toEqual(['back']);
    });

    it('noBackBtn 时没有返回按钮', async () => {
        await renderYearAndMonth({ props: { noBackBtn: true } });
        expect(document.querySelector(`.${dp}-yearmonth-header`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('年、月文案来自语言包', async () => {
        await renderYearAndMonth({ props: { locale: zh_CN.DatePicker } });
        expect(getYMSelected()).toEqual(['2021年', '6月']);
        expect(within(getYMLists()[1]).getByRole('option', { name: '7月' })).toBeInTheDocument();
    });

    it('ja_JP 下显示语言包的年后缀和月份名', async () => {
        await renderYearAndMonth({ props: { locale: ja_JP.DatePicker } });
        expect(getYMSelected()).toEqual(['2021年', ja_JP.DatePicker.fullMonths[6]]);
        expect(within(getYMLists()[0]).getByRole('option', { name: '2022' })).toBeInTheDocument();
    });

    it('compact 密度下返回按钮用小尺寸', async () => {
        await renderYearAndMonth({ props: { density: 'compact' } });
        expect(screen.getByRole('button', { name: 'Select Date' })).toHaveClass(`${BASE_CLASS_PREFIX}-button-size-small`);
    });

    it('presetPosition 为 left：快捷区与日期输入在年月列之前', async () => {
        await renderYearAndMonth({ props: { presetPosition: 'left' }, quickControls: true, dateInput: true });
        const quick = screen.getByTestId('quick');
        expect(screen.getByTestId('date-input')).toBeInTheDocument();
        expect(quick.compareDocumentPosition(getYMLists()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('presetPosition 为 right：快捷区在年月列之后', async () => {
        await renderYearAndMonth({ props: { presetPosition: 'right' }, quickControls: true });
        const quick = screen.getByTestId('quick');
        expect(quick.compareDocumentPosition(getYMLists()[1]) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('disabledDate 禁用的月份不可选，选年时自动选到可用月份', async () => {
        const store = await renderYearAndMonth({ props: { type: 'monthRange', currentMonth: { left: 1, right: 7 }, disabledDate: (date) => date.getMonth() === 0 } });
        expect(within(getYMLists()[1]).getByRole('option', { name: 'January' })).toHaveAttribute('aria-disabled', 'true');
        await click(within(getYMLists()[0]).getByRole('option', { name: '2021' }));
        expect(selections(store).at(-1)).toEqual({ currentYear: { left: 2021, right: 2022 }, currentMonth: { left: 2, right: 7 } });
    });

    it('currentYear 与 currentMonth 变化时选中项跟着变', async () => {
        const store = await renderYearAndMonth();
        expect(getYMSelected()).toEqual(['2021', 'June']);
        store.props.currentMonth = { left: 3, right: 9 };
        store.props.currentYear = { left: 2023, right: 2024 };
        await settle();
        expect(getYMSelected()).toEqual(['2023', 'March']);
    });

    it('disabledDate 全部放行时，monthRange 右侧面板仍禁用早于左侧年份的年份', async () => {
        await renderYearAndMonth({ props: { type: 'monthRange', disabledDate: () => false } });
        const rightYears = getYMLists()[2];
        expect(within(rightYears).getByRole('option', { name: '2020' })).toHaveAttribute('aria-disabled', 'true');
        expect(within(rightYears).getByRole('option', { name: '2021' })).toHaveAttribute('aria-disabled', 'false');
        expect(getYMLists()[3].querySelectorAll('li[aria-disabled="true"]')).toHaveLength(0);
    });
});
