import { screen, within } from '@testing-library/svelte';
import { format } from 'date-fns';
import { describe, expect, it, vi } from 'vite-plus/test';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import { click, getFooterButtons, getYMLists, ymd } from './date-picker-dom-utils';
import { changes, dp, getContainer, getDay, getInput, getInputs, getSelectedDays, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

const baseDate = new Date(2019, 8, 8, 8, 8, 8, 8);
const fullFormat = 'yyyy-MM-dd HH:mm:ss';

async function focusInput(input: HTMLInputElement) {
    input.focus();
    await settle();
}

describe('Svelte DatePicker 预设', () => {
    it('date：点击预设报一次 onChange，输入框显示预设日期并关闭面板', async () => {
        const { store } = await setup({ open: true, props: { type: 'date', presets: [{ text: 'Today', start: new Date() }] } });
        await click(screen.getByRole('button', { name: 'Today' }));
        expect(changes(store)).toHaveLength(1);
        expect(getInput()).toHaveValue(ymd(new Date()));
        expect(getContainer()).toBeNull();
    });

    it('函数形式的预设值在点击时取值', async () => {
        const start = vi.fn<() => Date>(() => new Date(2021, 5, 1));
        const { store } = await setup({ open: true, props: { type: 'date', presets: [{ text: 'Lazy', start }] } });
        await click(screen.getByRole('button', { name: 'Lazy' }));
        expect(start).toHaveBeenCalled();
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00 "2021-06-01"']);
        expect(getInput()).toHaveValue('2021-06-01');
    });

    it('受控值被父级拒绝时，点预设只通知，不改输入框', async () => {
        const { store } = await setup({
            mode: 'function',
            accept: false,
            value: baseDate,
            open: true,
            props: { type: 'date', presets: [{ text: 'Preset', start: new Date(2021, 5, 15) }] },
        });
        await click(screen.getByRole('button', { name: 'Preset' }));
        expect(changes(store)).toEqual(['change 2021-06-15 00:00:00 "2021-06-15"']);
        expect(getInput()).toHaveValue(ymd(baseDate));
    });
});

describe('Svelte DatePicker 清除', () => {
    it('受控范围：清除按钮报 onClear 与空的 onChange，父级不接受时输入框保留', async () => {
        const { store } = await setup({
            mode: 'function',
            accept: false,
            value: [new Date(2021, 5, 1), new Date(2021, 5, 15)],
            props: { type: 'dateRange' },
        });
        await click(screen.getByRole('button', { name: zh_CN.DatePicker.clearRange }));
        expect(store.log.filter((entry) => entry === 'clear')).toHaveLength(1);
        expect(changes(store)).toEqual(['change  []']);
        const [startInput, endInput] = getInputs();
        expect(startInput).toHaveValue('2021-06-01');
        expect(endInput).toHaveValue('2021-06-15');
    });
});

describe('Svelte DatePicker needConfirm', () => {
    it('范围的确定按钮提交两端，面板关闭，输入框显示新值', async () => {
        const { store } = await setup({
            value: [new Date(2021, 5, 1, 10, 0), new Date(2021, 5, 15, 18, 0)],
            open: true,
            props: { type: 'dateTimeRange', needConfirm: true },
        });
        const [startInput, endInput] = getInputs();
        await focusInput(startInput);
        await click(getDay('2021-06-03'));
        await focusInput(endInput);
        await click(getDay('2021-06-10'));
        expect(getFooterButtons()[1]).toBeEnabled();
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual([]);

        await click(getFooterButtons()[1]);
        expect(store.log.filter((entry) => entry.startsWith('confirm'))).toEqual(['confirm 2021-06-03 10:00:00|2021-06-10 18:00:00']);
        expect(getContainer()).toBeNull();
        expect(startInput).toHaveValue('2021-06-03 10:00:00');
        expect(endInput).toHaveValue('2021-06-10 18:00:00');
    });

    it('取消按钮报 onCancel，输入框保留原值并关闭面板', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', needConfirm: true } });
        await click(getDay(ymd(new Date(2019, 8, 10))));
        await click(getFooterButtons()[0]);
        expect(store.log.filter((entry) => entry.startsWith('cancel'))).toEqual(['cancel 2019-09-08 08:08:08']);
        expect(getInput()).toHaveValue(format(baseDate, strings.FORMAT_DATE_TIME));
        expect(getContainer()).toBeNull();
    });

    it('父级推来新的 value 时，输入框与面板的待选值一起更新', async () => {
        const { store } = await setup({ value: baseDate, open: true, props: { type: 'dateTime', needConfirm: true } });
        store.value = new Date(2021, 5, 15, 10, 30);
        await settle();
        expect(getInput()).toHaveValue('2021-06-15 10:30:00');
        expect(getSelectedDays()).toEqual(['2021-06-15']);
    });
});

describe('Svelte DatePicker 选择的回调参数', () => {
    it('多选：点选日期后 onChange 收到累加后的数组', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1)], open: true, props: { type: 'date', multiple: true } });
        await click(getDay('2021-06-15'));
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00|2021-06-15 00:00:00 ["2021-06-01","2021-06-15"]']);
    });

    it('多选达到 max：不再新增，取消已选后又可新增', async () => {
        const { store } = await setup({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], open: true, props: { type: 'date', max: 2, multiple: true } });
        await click(getDay('2021-06-20'));
        expect(changes(store)).toEqual([]);
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-15']);

        await click(getDay('2021-06-15'));
        expect(changes(store)).toEqual(['change 2021-06-01 00:00:00 ["2021-06-01"]']);
        await click(getDay('2021-06-20'));
        expect(getSelectedDays()).toEqual(['2021-06-01', '2021-06-20']);
    });

    it('multiple 只对 date 生效：dateTime 忽略 multiple，按单选交出值', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateTime', multiple: true, defaultPickerValue: new Date(2021, 5, 1, 10, 0, 0) } });
        await click(getDay('2021-06-15'));
        expect(changes(store).at(-1)).toBe('change 2021-06-15 10:00:00 "2021-06-15 10:00:00"');
    });

    it('dateRange 只选一端：不通知也不关闭，输入框和高亮反映起点', async () => {
        const { store } = await setup({ open: true, props: { type: 'dateRange', defaultPickerValue: '2021-06-01' } });
        await click(getDay('2021-06-01'));
        expect(changes(store)).toEqual([]);
        expect(getContainer()).not.toBeNull();
        expect(getDay('2021-06-01')).toHaveClass(`${dp}-day-selected-start`);
        expect(getInputs()[0]).toHaveValue('2021-06-01');
    });

    it('monthRange：先后选终点月与起点月，每次都报 onChange，输入框显示 起 ~ 止', async () => {
        const { store } = await setup({ value: [new Date(2021, 2), new Date(2021, 8)], open: true, props: { type: 'monthRange' } });
        const [, leftMonths, , rightMonths] = getYMLists();
        await click(within(rightMonths).getByRole('option', { name: '10月' }));
        expect(changes(store).at(-1)).toBe('change 2021-03-01 00:00:00|2021-10-01 00:00:00 ["2021-03","2021-10"]');
        await click(within(leftMonths).getByRole('option', { name: '2月' }));
        expect(changes(store).at(-1)).toBe('change 2021-02-01 00:00:00|2021-10-01 00:00:00 ["2021-02","2021-10"]');
        expect(getInput()).toHaveValue('2021-02 ~ 2021-10');
    });
});

describe('Svelte DatePicker timeZone 与 locale', () => {
    it('回调参数按 timeZone 换算', async () => {
        const { store } = await setup({ value: baseDate, props: { type: 'date', timeZone: 'Asia/Tokyo' } });
        await typeText('2021-06-10');
        const expected = zonedTimeToUtc(new Date(2021, 5, 10), 'Asia/Tokyo');
        expect(changes(store)).toEqual([`change ${format(expected, fullFormat)} "${format(expected, 'yyyy-MM-dd')}"`]);
    });

    it('与系统时区相同的 timeZone 原样显示', async () => {
        await setup({ value: baseDate, props: { type: 'dateTime', timeZone: 'Asia/Shanghai' } });
        // the tests run in Asia/Shanghai
        expect(getInput()).toHaveValue('2019-09-08 08:08:08');
    });

    it('切换 timeZone 时按上一个时区换算', async () => {
        const { store } = await setup({ value: baseDate, props: { type: 'dateTime', timeZone: 'Asia/Shanghai' } });
        store.props.timeZone = 'Asia/Tokyo';
        await settle();
        expect(getInput()).toHaveValue('2019-09-08 09:08:08');
    });
});
