import { fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '../../_utils/semi-global';
import { changes, clickDay, clickOutside, clickTrigger, dp, getContainer, getDay, getGrid, getInput, getInputs, getNavTitle, getRoot, getSelectedDays, getTrigger, opens, pressKey, settle, setup, typeText, useBaseDate } from './test-utils';

useBaseDate();

describe('Svelte DatePicker 受控 value（四种写法）', () => {
    it('不传：点选日期在本地生效，onChange 收到 (date, dateString)', async () => {
        const { store } = await setup({ open: true });
        await clickDay('2019-08-10');
        expect(getInput()).toHaveValue('2019-08-10');
        expect(getContainer()).toBeNull();
        await clickTrigger();
        expect(getSelectedDays()).toEqual(['2019-08-10']);
        await clickDay('2019-08-12');
        expect(getInput()).toHaveValue('2019-08-12');
        expect(changes(store)).toEqual(['change 2019-08-10 00:00:00 "2019-08-10"', 'change 2019-08-12 00:00:00 "2019-08-12"']);
    });

    it('bind:value：选择写回父级，父级改值同步到输入框，重置为 undefined 后清空', async () => {
        const { store } = await setup({ mode: 'bind', value: '2019-08-10', open: true });
        expect(getSelectedDays()).toEqual(['2019-08-10']);
        await clickDay('2019-08-12');
        expect(store.value).toBeInstanceOf(Date);
        expect(getInput()).toHaveValue('2019-08-12');
        store.value = new Date(2019, 7, 20);
        await settle();
        expect(getInput()).toHaveValue('2019-08-20');
        await clickTrigger();
        expect(getSelectedDays()).toEqual(['2019-08-20']);
        store.value = undefined;
        await settle();
        expect(getInput()).toHaveValue('');
        expect(getSelectedDays()).toEqual([]);
    });

    it('函数绑定：setter 拒绝时输入框与面板保持原值', async () => {
        const { store } = await setup({ mode: 'function', value: '2019-08-10', open: true, accept: false });
        await clickDay('2019-08-12');
        expect(store.log).toContain('set 2019-08-12 00:00:00');
        expect(changes(store)).toEqual(['change 2019-08-12 00:00:00 "2019-08-12"']);
        expect(getInput()).toHaveValue('2019-08-10');
        expect(store.value).toBe('2019-08-10');
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store } = await setup({ mode: 'function', value: '2019-08-10', open: true });
        await clickDay('2019-08-12');
        expect(store.value).toBeInstanceOf(Date);
        expect(getInput()).toHaveValue('2019-08-12');
    });

    it('单向传值：作初值，交互在本地覆盖，父级再推新值时以父级为准', async () => {
        const { store } = await setup({ value: '2019-08-10', open: true });
        expect(getInput()).toHaveValue('2019-08-10');
        await clickDay('2019-08-12');
        expect(getInput()).toHaveValue('2019-08-12');
        expect(store.value).toBe('2019-08-10');
        store.value = '2019-08-01';
        await settle();
        expect(getInput()).toHaveValue('2019-08-01');
    });

    it('value 为 null 是受控空值，时间戳是有效值', async () => {
        const { store } = await setup({ value: null });
        expect(getInput()).toHaveValue('');
        store.value = new Date(2021, 5, 1).getTime();
        await settle();
        expect(getInput()).toHaveValue('2021-06-01');
    });
});

describe('Svelte DatePicker 受控 open（四种写法）', () => {
    it('不传：点击触发器打开，点击外部关闭，onOpenChange 与 onBlur 各报一次', async () => {
        const { store } = await setup();
        expect(getContainer()).toBeNull();
        await clickTrigger();
        expect(getContainer()).not.toBeNull();
        expect(getInput()).toHaveAttribute('aria-expanded', 'true');
        await clickOutside();
        expect(getContainer()).toBeNull();
        expect(opens(store)).toEqual(['open true', 'open false']);
        expect(store.log).toContain('blur mousedown');
    });

    it('bind:open：打开与关闭都写回父级', async () => {
        const { store } = await setup({ target: 'open', mode: 'bind' });
        await clickTrigger();
        expect(store.open).toBe(true);
        expect(getContainer()).not.toBeNull();
        await clickOutside();
        expect(store.open).toBe(false);
        expect(getContainer()).toBeNull();
        store.open = true;
        await settle();
        expect(getContainer()).not.toBeNull();
    });

    it('函数绑定：setter 拒绝打开时面板不出现', async () => {
        const { store } = await setup({ target: 'open', mode: 'function', open: false, accept: false });
        await clickTrigger();
        expect(store.log).toContain('set open true');
        expect(getContainer()).toBeNull();
    });

    it('单向传值：open 为 true 时首帧打开，点击外部在本地关闭', async () => {
        const { store } = await setup({ open: true });
        expect(getContainer()).not.toBeNull();
        await clickOutside();
        expect(getContainer()).toBeNull();
        expect(store.open).toBe(true);
    });
});

describe('Svelte DatePicker 单选', () => {
    it('键入合法日期更新值，非法文本只改输入框，Enter 保留合法值', async () => {
        const { store } = await setup({ open: true });
        await typeText('2019-08-15');
        expect(changes(store)).toEqual(['change 2019-08-15 00:00:00 "2019-08-15"']);
        expect(getSelectedDays()).toEqual(['2019-08-15']);
        await typeText('2019-13');
        expect(getInput()).toHaveValue('2019-13');
        expect(changes(store)).toHaveLength(1);
        await typeText('2019-08-16');
        await pressKey(getInput(), 'Enter');
        expect(getInput()).toHaveValue('2019-08-16');
        expect(changes(store).at(-1)).toBe('change 2019-08-16 00:00:00 "2019-08-16"');
    });

    it('清除按钮清空值，onChange 收到 undefined，onClear 被调用', async () => {
        const { store } = await setup({ value: '2019-08-10' });
        const clear = getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement;
        await fireEvent.mouseDown(clear, { button: 0 });
        await settle();
        expect(getInput()).toHaveValue('');
        expect(changes(store)).toEqual(['change undefined undefined']);
        expect(store.log).toContain('clear');
    });

    it('disabledDate 禁用的日期点击不触发 change', async () => {
        const { store } = await setup({ open: true, props: { disabledDate: (date) => date.getDate() === 10 } });
        expect(getDay('2019-08-10')).toHaveAttribute('aria-disabled', 'true');
        await clickDay('2019-08-10');
        expect(changes(store)).toEqual([]);
        expect(getInput()).toHaveValue('');
    });

    it('上一月、下一月按钮切换面板，panelChange 报新面板', async () => {
        const { store } = await setup({ open: true });
        expect(getNavTitle()).toBe('2019年 8月');
        await fireEvent.click(document.querySelector(`[aria-label="${zh_CN.DatePicker.nextMonth}"]`) as HTMLElement);
        await settle();
        expect(getNavTitle()).toBe('2019年 9月');
        await fireEvent.click(document.querySelector(`[aria-label="${zh_CN.DatePicker.prevYear}"]`) as HTMLElement);
        await settle();
        expect(getNavTitle()).toBe('2018年 9月');
        expect(store.log.filter((entry) => entry.startsWith('panel'))).toHaveLength(2);
    });

    it('presets 点击后提交预设值并报 onPresetClick', async () => {
        const { store } = await setup({ open: true, props: { presets: [{ text: '国庆', start: new Date(2019, 9, 1), end: new Date(2019, 9, 1) }, () => ({ text: '函数项', start: new Date(2019, 7, 2) })] } });
        const buttons = document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
        expect(Array.from(buttons).map((button) => button.textContent?.trim())).toEqual(['国庆', '函数项']);
        await fireEvent.click(buttons[0]);
        await settle();
        expect(getInput()).toHaveValue('2019-10-01');
        expect(store.log).toContain('preset 国庆');
    });

    it('multiple 与 max：最多选中 max 个日期', async () => {
        const { store } = await setup({ open: true, props: { multiple: true, max: 2 } });
        await clickDay('2019-08-01');
        await clickDay('2019-08-02');
        await clickDay('2019-08-03');
        expect(getSelectedDays()).toEqual(['2019-08-01', '2019-08-02']);
        expect(getInput()).toHaveValue('2019-08-01,2019-08-02');
        expect(changes(store)).toHaveLength(2);
        expect(getGrid()).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('format 不含时间标记时 dateTime 降级为 date，没有时间切换按钮', async () => {
        await setup({ open: true, props: { type: 'dateTime', format: 'yyyy/MM/dd' } });
        await clickDay('2019-08-10');
        expect(getInput()).toHaveValue('2019/08/10');
        expect(document.querySelector(`.${dp}-switch`)).toBeNull();
    });
});

describe('Svelte DatePicker 键盘', () => {
    it('日期网格按 APG 用 aria-activedescendant 移动，Enter 选中', async () => {
        const { store } = await setup({ value: '2019-08-10', open: true });
        const grid = getGrid();
        expect(grid).toHaveAttribute('tabindex', '0');
        expect(document.getElementById(grid.getAttribute('aria-activedescendant') as string)).toBe(getDay('2019-08-10'));
        await pressKey(grid, 'ArrowRight');
        expect(document.getElementById(grid.getAttribute('aria-activedescendant') as string)).toBe(getDay('2019-08-11'));
        await pressKey(grid, 'ArrowDown');
        expect(document.getElementById(grid.getAttribute('aria-activedescendant') as string)).toBe(getDay('2019-08-18'));
        await pressKey(grid, 'Enter');
        expect(changes(store)).toEqual(['change 2019-08-18 00:00:00 "2019-08-18"']);
    });

    it('方向键越过月末时切换到下一月', async () => {
        await setup({ value: '2019-08-31', open: true });
        await pressKey(getGrid(), 'ArrowRight');
        expect(getNavTitle()).toBe('2019年 9月');
        expect(document.getElementById(getGrid().getAttribute('aria-activedescendant') as string)).toBe(getDay('2019-09-01'));
    });

    it('关闭时在输入框按 ArrowDown 打开面板', async () => {
        const { store } = await setup();
        await pressKey(getInput(), 'ArrowDown');
        expect(getContainer()).not.toBeNull();
        expect(opens(store)).toEqual(['open true']);
    });
});

describe('Svelte DatePicker 范围', () => {
    it('dateRange：先后点选两端提交并关闭，第二个输入框获焦', async () => {
        const { store } = await setup({ props: { type: 'dateRange' } });
        const [start, end] = getInputs();
        await clickTrigger();
        expect(start).toHaveFocus();
        await clickDay('2019-08-05');
        expect(changes(store)).toEqual([]);
        expect(end).toHaveFocus();
        expect(getRoot().querySelector(`.${dp}-range-input-wrapper-end`)).toHaveClass(`${dp}-range-input-wrapper-active`);
        await clickDay('2019-08-09');
        expect(changes(store)).toEqual(['change 2019-08-05 00:00:00|2019-08-09 00:00:00 ["2019-08-05","2019-08-09"]']);
        expect(start).toHaveValue('2019-08-05');
        expect(end).toHaveValue('2019-08-09');
        expect(getContainer()).toBeNull();
    });

    it('dateRange 的根元素是 group，两个输入框是 combobox', async () => {
        await setup({ value: [new Date(2019, 7, 5), new Date(2019, 7, 9)], props: { type: 'dateRange', 'aria-label': '出行日期' } });
        expect(getRoot()).toHaveAttribute('role', 'group');
        expect(getRoot()).toHaveAttribute('aria-label', '出行日期');
        expect(getInputs().map((input) => input.getAttribute('role'))).toEqual(['combobox', 'combobox']);
        expect(document.querySelector(`.${dp}-range-input-clearbtn`)).toHaveAttribute('aria-label', zh_CN.DatePicker.clearRange);
    });

    it('范围清除按钮清空两端，onChange 收到 []', async () => {
        const { store } = await setup({ value: [new Date(2019, 7, 5), new Date(2019, 7, 9)], props: { type: 'dateRange' } });
        await fireEvent.mouseDown(document.querySelector(`.${dp}-range-input-clearbtn`) as HTMLElement, { button: 0 });
        await settle();
        expect(getInputs().map((input) => input.value)).toEqual(['', '']);
        expect(changes(store)).toEqual(['change  []']);
    });
});

describe('Svelte DatePicker dateTime 与 needConfirm', () => {
    it('选中日期只改待选值，取消恢复原值，确认提交并报 onConfirm', async () => {
        const { store } = await setup({ value: new Date(2019, 7, 10, 8, 0, 0), open: true, props: { type: 'dateTime', needConfirm: true } });
        const footerButtons = () => Array.from(document.querySelectorAll<HTMLElement>(`.${dp}-footer button`));
        await clickDay('2019-08-12');
        expect(getSelectedDays()).toEqual(['2019-08-12']);
        expect(getContainer()).not.toBeNull();
        await fireEvent.click(footerButtons()[0]);
        await settle();
        expect(getInput()).toHaveValue('2019-08-10 08:00:00');
        expect(store.log).toContain('cancel 2019-08-10 08:00:00');

        await fireEvent.click(getTrigger());
        await settle();
        await clickDay('2019-08-12');
        await fireEvent.click(footerButtons()[1]);
        await settle();
        expect(store.log).toContain('confirm 2019-08-12 08:00:00');
        expect(getInput()).toHaveValue('2019-08-12 08:00:00');
    });

    it('bind:value 只在确认时写回父级，取消不写回', async () => {
        const { store } = await setup({ mode: 'bind', value: new Date(2019, 7, 10, 8, 0, 0), open: true, props: { type: 'dateTime', needConfirm: true } });
        const footerButtons = () => Array.from(document.querySelectorAll<HTMLElement>(`.${dp}-footer button`));
        await clickDay('2019-08-12');
        expect(changes(store)).toHaveLength(1);
        expect(store.value).toEqual(new Date(2019, 7, 10, 8, 0, 0));
        await fireEvent.click(footerButtons()[1]);
        await settle();
        expect(store.value).toEqual(new Date(2019, 7, 12, 8, 0, 0));
        expect(getInput()).toHaveValue('2019-08-12 08:00:00');
    });

    it('切换到时间面板显示时间列', async () => {
        await setup({ value: new Date(2019, 7, 10, 8, 30, 0), open: true, props: { type: 'dateTime' } });
        await fireEvent.click(document.querySelector(`[aria-label="${zh_CN.DatePicker.switchToTime}"]`) as HTMLElement);
        await settle();
        expect(document.querySelector(`.${dp}-tpk`)).not.toBeNull();
        expect(document.querySelectorAll(`.${dp}-tpk .${BASE_CLASS_PREFIX}-scrolllist-item`)).toHaveLength(3);
    });
});

describe('Svelte DatePicker 年月', () => {
    it('month 类型显示年、月两列，选择月份提交当月 1 日', async () => {
        const { store } = await setup({ open: true, props: { type: 'month' } });
        const lists = document.querySelectorAll(`.${dp}-yam .${BASE_CLASS_PREFIX}-scrolllist-item, .${BASE_CLASS_PREFIX}-scrolllist-item`);
        expect(lists.length).toBeGreaterThanOrEqual(2);
        const months = Array.from(lists[1].querySelectorAll('li'));
        await fireEvent.click(months[2]);
        await settle();
        expect(changes(store).at(-1)).toMatch(/^change 2019-03-01 00:00:00 "2019-03"$/);
        expect(getInput()).toHaveValue('2019-03');
    });

    it('点击面板标题打开年月选择器', async () => {
        await setup({ open: true });
        await fireEvent.click(document.querySelector(`.${dp}-navigation-month button`) as HTMLElement);
        await settle();
        expect(document.querySelector(`.${dp}-yam`)).not.toBeNull();
    });
});

describe('Svelte DatePicker insetInput', () => {
    it('面板内显示日期输入框，键入后提交值', async () => {
        const { store } = await setup({ open: true, props: { insetInput: true } });
        const insetInputs = document.querySelectorAll<HTMLInputElement>(`.${dp}-inset-input-wrapper input`);
        expect(insetInputs).toHaveLength(1);
        expect(getInput()).toHaveAttribute('readonly');
        await typeText('2019-08-21', insetInputs[0]);
        expect(changes(store)).toEqual(['change 2019-08-21 00:00:00 "2019-08-21"']);
        expect(getSelectedDays()).toEqual(['2019-08-21']);
    });

    it('dateTimeRange 的 insetInput 有四个输入框', async () => {
        await setup({ open: true, props: { type: 'dateTimeRange', insetInput: true } });
        expect(document.querySelectorAll(`.${dp}-inset-input-wrapper input`)).toHaveLength(4);
    });
});

describe('Svelte DatePicker snippet 与透传', () => {
    it('date、fullDate、topSlot、bottomSlot snippet', async () => {
        await setup({ open: true, date: true, slots: true });
        expect(getDay('2019-08-10').querySelector('.custom-date')).toHaveTextContent('d10');
        expect(document.querySelector('[x-semi-prop="topSlot"] .custom-top')).not.toBeNull();
        expect(document.querySelector('[x-semi-prop="bottomSlot"] .custom-bottom')).not.toBeNull();
    });

    it('fullDate 替换整个日期格', async () => {
        await setup({ value: '2019-08-10', open: true, fullDate: true });
        expect(getDay('2019-08-10').querySelector('.custom-full')).toHaveClass('custom-selected');
    });

    it('trigger snippet 的按钮是焦点目标，点击打开面板，选择后显示新值', async () => {
        const { store } = await setup({ trigger: 'button', props: { type: 'date' } });
        const button = getRoot().querySelector('.custom-trigger') as HTMLElement;
        expect(button).toHaveAttribute('data-type', 'date');
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
        await fireEvent.click(button);
        await settle();
        expect(getContainer()).not.toBeNull();
        await clickDay('2019-08-10');
        expect(button).toHaveTextContent('2019-08-10');
        expect(changes(store)).toHaveLength(1);
    });

    it('trigger snippet 没有焦点目标时外层是 button', async () => {
        await setup({ trigger: 'text' });
        expect(getTrigger()).toHaveAttribute('role', 'button');
        expect(getTrigger()).toHaveAttribute('tabindex', '0');
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'dialog');
        await pressKey(getTrigger(), 'Enter');
        expect(getContainer()).not.toBeNull();
    });

    it('class、data-* 落在根元素，aria-labelledby 落在输入框', async () => {
        await setup({ props: { class: 'my-picker', 'data-testid': 'dp', 'aria-labelledby': 'label-id' } });
        expect(getRoot()).toHaveClass('my-picker');
        expect(getRoot()).toHaveAttribute('data-testid', 'dp');
        expect(getRoot()).not.toHaveAttribute('aria-labelledby');
        expect(getInput()).toHaveAttribute('aria-labelledby', 'label-id');
        expect(getInput()).not.toHaveAttribute('aria-label');
    });

    it('输入框的可访问名称与 placeholder 来自语言包', async () => {
        await setup();
        expect(getInput()).toHaveAttribute('aria-label', zh_CN.DatePicker.chooseDate);
        expect(getInput()).toHaveAttribute('placeholder', zh_CN.DatePicker.placeholder.date as string);
        expect(getInput()).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('semiGlobal.config.overrideDefaultProps 提供默认值', async () => {
        semiGlobal.config = { overrideDefaultProps: { DatePicker: { placeholder: '全局占位', size: 'large' } } };
        await setup();
        expect(getInput()).toHaveAttribute('placeholder', '全局占位');
        expect(getInput()).toHaveClass(`${BASE_CLASS_PREFIX}-input-large`);
    });

    it('disabled 时输入框禁用，点击不打开', async () => {
        const { store } = await setup({ props: { disabled: true } });
        expect(getInput()).toBeDisabled();
        await clickTrigger();
        expect(getContainer()).toBeNull();
        expect(opens(store)).toEqual([]);
    });
});

describe('Svelte DatePicker 对外方法', () => {
    it('open、close、focus 经 bind:this 调用', async () => {
        const { component } = await setup();
        const picker = (component as unknown as { api: () => { open: () => void; close: () => void; focus: () => void } }).api();
        picker.open();
        await settle();
        expect(getContainer()).not.toBeNull();
        picker.close();
        await settle();
        expect(getContainer()).toBeNull();
        picker.focus();
        await settle();
        expect(getInput()).toHaveFocus();
    });
});
