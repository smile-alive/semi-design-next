import { flushSync } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Fixture, { type FixtureStore } from './time-picker-fixture.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-timepicker`;
const scrollListCls = `${BASE_CLASS_PREFIX}-scrolllist`;

// lets the foundation's timers and the effects they schedule run
async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

type SetupInit = Partial<Omit<FixtureStore, 'props'>> & { props?: FixtureStore['props'] };

// A value without a mode is passed one-way, the initial value other frameworks take as defaultValue
async function setup({ props, ...init }: SetupInit = {}) {
    const mode = init.value === undefined ? 'uncontrolled' : 'one-way';
    const store = createStore<FixtureStore>({ target: 'value', mode, accept: true, log: [], ...init, props: { motion: false, scrollItemProps: { cycled: false }, ...props } });
    const result = render(Fixture, { props: { store } });
    await settle();
    return { store, ...result };
}

const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const getInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`) as HTMLInputElement;
const getPanels = () => Array.from(document.querySelectorAll<HTMLElement>(`.${scrollListCls}`));
const getList = (type: string, panel: ParentNode = document) => panel.querySelector<HTMLElement>(`.${prefixCls}-panel-list-${type}`) as HTMLElement;
const getItems = (type: string, panel?: ParentNode) => Array.from(getList(type, panel).querySelectorAll('li'));
const getSelectedText = (type: string, panel?: ParentNode) => getList(type, panel).querySelector(`.${scrollListCls}-item-sel`)?.textContent?.trim();
const changes = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('change'));
const opens = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('open'));
const invalid = () => document.querySelector(`.${prefixCls}-input-invalid`);

async function clickItem(type: string, index: number, panel?: ParentNode) {
    await fireEvent.click(getItems(type, panel)[index]);
    await settle();
}

async function clickOutside() {
    await fireEvent.mouseDown(document.body);
    await settle();
}

async function focusInput() {
    getInput().focus();
    await settle();
}

async function blurInput() {
    getInput().blur();
    await settle();
}

async function typeText(value: string) {
    await fireEvent.input(getInput(), { target: { value } });
    await settle();
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte TimePicker 受控 value（四种写法）', () => {
    it('不传：面板选择与键入都在本地生效，onChange 收到 (value, str)', async () => {
        const { store } = await setup({ open: true, props: { format: 'HH:mm:ss' } });
        await clickItem('minute', 30);
        expect(getInput()).toHaveValue('00:30:00');
        await typeText('10:18:18');
        expect(getInput()).toHaveValue('10:18:18');
        expect(getSelectedText('minute')).toBe('18分');
        expect(changes(store)).toEqual(['change 00:30:00 "00:30:00"', 'change 10:18:18 "10:18:18"']);
    });

    it('bind:value：键入写回父级，父级改值同步到输入框与面板，重置为 undefined 后清空', async () => {
        const { store } = await setup({ mode: 'bind', value: '10:24:18', open: true });
        await typeText('10:18:18');
        expect(store.value).toBeInstanceOf(Date);
        expect(getSelectedText('minute')).toBe('18分');
        store.value = '12:00:00';
        await settle();
        expect(getInput()).toHaveValue('12:00:00');
        expect(getSelectedText('hour')).toBe('12时');
        store.value = undefined;
        await settle();
        expect(getInput()).toHaveValue('');
    });

    it('函数绑定：setter 拒绝时面板不动，失焦后输入框恢复原值', async () => {
        const { store } = await setup({ mode: 'function', value: '10:24:18', open: true, accept: false });
        await clickItem('hour', 11);
        expect(store.log).toEqual(['set 11:24:18', 'change 11:24:18 "11:24:18"']);
        expect(getSelectedText('hour')).toBe('10时');
        expect(getInput()).toHaveValue('10:24:18');

        await focusInput();
        await typeText('10:18:18');
        expect(getInput()).toHaveValue('10:18:18');
        expect(getSelectedText('minute')).toBe('24分');
        await blurInput();
        expect(getInput()).toHaveValue('10:24:18');
        expect(store.value).toBe('10:24:18');
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store } = await setup({ mode: 'function', value: '10:24:18', open: true });
        await clickItem('hour', 11);
        expect(store.value).toBeInstanceOf(Date);
        expect(getInput()).toHaveValue('11:24:18');
        expect(getSelectedText('hour')).toBe('11时');
    });

    it('单向传值：作初值，交互在本地覆盖，父级再推新值时以父级为准', async () => {
        const { store } = await setup({ mode: 'one-way', value: '10:24:18', open: true });
        expect(getInput()).toHaveValue('10:24:18');
        await clickItem('hour', 11);
        expect(getInput()).toHaveValue('11:24:18');
        expect(store.value).toBe('10:24:18');
        store.value = '09:00:00';
        await settle();
        expect(getInput()).toHaveValue('09:00:00');
        expect(getSelectedText('hour')).toBe('09时');
    });

    it('value 为 null 是受控空值，时间戳 0 是有效值', async () => {
        const { store } = await setup({ mode: 'one-way', value: null });
        expect(getInput()).toHaveValue('');
        store.value = new Date(2021, 5, 1, 0, 0, 0).getTime();
        await settle();
        expect(getInput()).toHaveValue('00:00:00');
    });

    it('同一时间值的新 Date 不覆盖正在键入的文本', async () => {
        const { store } = await setup({ mode: 'one-way', value: new Date(2021, 5, 1, 10, 0, 0) });
        await typeText('10:00:0');
        store.value = new Date(2021, 5, 1, 10, 0, 0);
        await settle();
        expect(getInput()).toHaveValue('10:00:0');
    });
});

describe('Svelte TimePicker 受控 open（四种写法）', () => {
    it('不传：聚焦打开，点击外部关闭并通知 onBlur', async () => {
        const { store } = await setup({ value: '10:23:15' });
        expect(getPanels()).toHaveLength(0);
        await focusInput();
        expect(getPanels()).toHaveLength(1);
        expect(getInput()).toHaveAttribute('aria-expanded', 'true');
        await clickOutside();
        expect(getPanels()).toHaveLength(0);
        expect(store.log).toEqual(['open true', 'focus focusin', 'open false', 'blur mousedown']);
    });

    it('bind:open：父级打开显示面板，点击外部写回 false', async () => {
        const { store } = await setup({ target: 'open', mode: 'bind', open: false });
        expect(getPanels()).toHaveLength(0);
        store.open = true;
        await settle();
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        expect(store.open).toBe(false);
        expect(getPanels()).toHaveLength(0);
    });

    it('函数绑定：setter 拒绝关闭时面板保持打开', async () => {
        const { store } = await setup({ target: 'open', mode: 'function', open: true, accept: false });
        await clickOutside();
        expect(opens(store)).toEqual(['open false']);
        expect(store.log).toContain('set open false');
        expect(getPanels()).toHaveLength(1);
    });

    it('单向传值 open 作初值：首帧打开，外部点击后在本地关闭，聚焦再打开只请求一次', async () => {
        const { store } = await setup({ target: 'value', mode: 'uncontrolled', open: true });
        expect(getPanels()).toHaveLength(1);
        await focusInput();
        expect(opens(store)).toEqual([]);
        await clickOutside();
        expect(getPanels()).toHaveLength(0);
        expect(store.open).toBe(true);
        await blurInput();
        await focusInput();
        expect(getPanels()).toHaveLength(1);
        expect(opens(store)).toEqual(['open false', 'open true']);
    });

    it('disabled 时不打开；打开后变为 disabled 关闭面板并上报 open false', async () => {
        const { store } = await setup({ open: true });
        expect(getPanels()).toHaveLength(1);
        store.props.disabled = true;
        await settle();
        expect(getPanels()).toHaveLength(0);
        expect(opens(store)).toEqual(['open false']);
        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-disabled`)).not.toBeNull();
    });

    it('Esc 关闭面板，aria-expanded 回到 false', async () => {
        const { store } = await setup();
        await focusInput();
        expect(getPanels()).toHaveLength(1);
        await fireEvent.keyDown(getInput(), { key: 'Escape' });
        await settle();
        expect(getPanels()).toHaveLength(0);
        expect(getInput()).toHaveAttribute('aria-expanded', 'false');
        expect(opens(store)).toEqual(['open true', 'open false']);
        expect(store.log.filter((entry) => entry.startsWith('blur'))).toEqual([]);
    });

    it('在面板内嵌套 Popover 的弹层内按下鼠标不关闭面板', async () => {
        await setup({ open: true, nested: true });
        await fireEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        await settle();
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        await settle();
        expect(getPanels()).toHaveLength(1);
        await fireEvent.mouseDown(getPanels()[0]);
        await settle();
        expect(getPanels()).toHaveLength(1);
        await clickOutside();
        expect(getPanels()).toHaveLength(0);
    });
});

describe('Svelte TimePicker 面板', () => {
    it('format 决定列：HH:mm 无秒列，mm:ss 无小时列，HH 只有小时列', async () => {
        const first = await setup({ open: true, value: '10:23', props: { format: 'HH:mm' } });
        expect(getInput()).toHaveValue('10:23');
        expect(getList('second')).toBeNull();
        expect(getRoot()).not.toBeNull();
        first.unmount();

        const second = await setup({ open: true, value: '23:15', props: { format: 'mm:ss' } });
        expect(getList('hour')).toBeNull();
        expect(getSelectedText('minute')).toBe('23分');
        expect(getSelectedText('second')).toBe('15秒');
        second.unmount();

        await setup({ open: true, value: '10', props: { format: 'HH' } });
        expect(getSelectedText('hour')).toBe('10时');
        expect(getList('minute')).toBeNull();
    });

    it('format 变化时重新格式化显示值和面板列', async () => {
        const { store } = await setup({ open: true, value: '10:23:15' });
        expect(getList('second')).not.toBeNull();
        store.props.format = 'HH:mm';
        await settle();
        expect(getInput()).toHaveValue('10:23');
        expect(getList('second')).toBeNull();
    });

    it('hourStep、minuteStep 和 secondStep', async () => {
        await setup({ open: true, props: { hourStep: 2, minuteStep: 15, secondStep: 30 } });
        expect(getItems('hour')).toHaveLength(12);
        expect(getItems('minute').map((li) => li.textContent?.trim())).toEqual(['00分', '15', '30', '45']);
        expect(getItems('second').map((li) => li.textContent?.trim())).toEqual(['00秒', '30']);
    });

    it('disabledHours、disabledMinutes、disabledSeconds 标记禁用项，点禁用项不触发变化', async () => {
        const { store } = await setup({ open: true, props: { disabledHours: () => [0, 1, 2], disabledMinutes: () => [0, 15, 30, 45], disabledSeconds: () => [0, 30] } });
        const disabledIndexes = (type: string) =>
            getItems(type)
                .map((li, index) => (li.getAttribute('aria-disabled') === 'true' ? index : null))
                .filter((index) => index !== null);
        expect(disabledIndexes('hour')).toEqual([0, 1, 2]);
        expect(disabledIndexes('minute')).toEqual([0, 15, 30, 45]);
        expect(disabledIndexes('second')).toEqual([0, 30]);
        await clickItem('hour', 1);
        expect(changes(store)).toEqual([]);
        await clickItem('hour', 3);
        expect(changes(store)).toHaveLength(1);
    });

    it('hideDisabledOptions 隐藏被禁用的小时', async () => {
        await setup({ open: true, props: { disabledHours: () => [0, 1, 2, 3, 4, 5], hideDisabledOptions: true } });
        expect(getItems('hour')).toHaveLength(18);
        expect(getItems('hour')[0]).toHaveTextContent(/^06/);
    });

    it('列表命名，输入框是 combobox 且 aria-controls 指向面板，对话框按类型命名', async () => {
        await setup({ config: { locale: en_US }, open: true, props: { use12Hours: true, format: 'a hh:mm:ss' } });
        for (const name of ['ampmList', 'hourList', 'minuteList', 'secondList'] as const) {
            expect(screen.getByRole('listbox', { name: en_US.TimePicker[name] })).toBeInTheDocument();
        }
        const input = screen.getByRole('combobox');
        expect(input).toBe(getInput());
        expect(input).toHaveAttribute('aria-haspopup', 'dialog');
        const panel = document.getElementById(input.getAttribute('aria-controls') as string);
        expect(panel).toContainElement(screen.getAllByRole('listbox')[0]);
        expect(screen.getByRole('dialog', { name: en_US.TimePicker.panel.time })).toContainElement(panel);
        expect(document.querySelector(`.${prefixCls}-header`)).toHaveAttribute('tabindex', '-1');
    });

    it('panelHeader、panelFooter 带 index；范围模式没给头部时回落语言包的开始与结束', async () => {
        const single = await setup({ open: true, header: true, footer: true });
        expect(getPanels()[0].querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^header 0$/);
        expect(getPanels()[0].querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^footer 0$/);
        single.unmount();

        await setup({ config: { locale: en_US }, open: true, props: { type: 'timeRange' } });
        const [start, end] = getPanels();
        expect(start.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(en_US.TimePicker.begin);
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(en_US.TimePicker.end);
        expect(start.querySelector(`.${scrollListCls}-footer`)).toBeNull();
    });

    it('panel 在范围模式下作为两个面板的头部和底部，单选模式忽略', async () => {
        const range = await setup({ open: true, header: true, footer: true, panel: true, props: { type: 'timeRange' } });
        const [start, end] = getPanels();
        expect(start.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^panel 0$/);
        expect(start.querySelector(`.${scrollListCls}-footer`)).toHaveTextContent(/^panel 0$/);
        expect(end.querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^panel 1$/);
        range.unmount();

        await setup({ open: true, header: true, panel: true });
        expect(getPanels()[0].querySelector(`.${scrollListCls}-header`)).toHaveTextContent(/^header 0$/);
        expect(getPanels()[0].querySelector(`.${scrollListCls}-footer`)).toBeNull();
    });

    it('position 与 ConfigProvider 的 rtl 默认位置', async () => {
        const first = await setup({ open: true, props: { position: 'top' } });
        expect(document.querySelector('[x-placement]')).toHaveAttribute('x-placement', 'top');
        first.unmount();
        await setup({ open: true, config: { direction: 'rtl' } });
        expect(document.querySelector('[x-placement]')).toHaveAttribute('x-placement', 'bottomRight');
    });
});

describe('Svelte TimePicker 范围选择', () => {
    it('两个面板，选择第二个面板上报两个日期', async () => {
        const { store } = await setup({ open: true, value: ['10:00:00', '14:00:00'], props: { type: 'timeRange' } });
        expect(getPanels()).toHaveLength(2);
        expect(getInput()).toHaveValue('10:00:00 ~ 14:00:00');
        await clickItem('minute', 30, getPanels()[1]);
        expect(changes(store)).toEqual(['change 10:00:00|14:30:00 ["10:00:00","14:30:00"]']);
        expect(getInput()).toHaveValue('10:00:00 ~ 14:30:00');
    });

    it('只选一侧：空的一侧为 undefined，输入框带分隔符且不标记无效', async () => {
        const { store } = await setup({ open: true, props: { type: 'timeRange' } });
        await clickItem('hour', 7, getPanels()[1]);
        expect(changes(store)).toEqual(['change undefined|07:00:00 ["","07:00:00"]']);
        expect(getInput()).toHaveValue(' ~ 07:00:00');
        expect(invalid()).toBeNull();
    });

    it('rangeSeparator 属性', async () => {
        await setup({ value: ['10:00:00', '12:00:00'], props: { type: 'timeRange', rangeSeparator: ' - ' } });
        expect(getInput()).toHaveValue('10:00:00 - 12:00:00');
    });

    it('键入超过两段时标为无效，不触发 change', async () => {
        const { store } = await setup({ props: { type: 'timeRange' } });
        await typeText('10:00:00 ~ 11:00:00 ~ 12:00:00');
        expect(invalid()).not.toBeNull();
        expect(changes(store)).toEqual([]);
    });
});

describe('Svelte TimePicker 12 小时制', () => {
    const props = { use12Hours: true, format: 'a hh:mm:ss' };

    it('AM/PM 选择与小时选择', async () => {
        const { store } = await setup({ open: true, value: '上午 10:23:15', props });
        expect(getItems('ampm').map((li) => li.textContent?.trim())).toEqual(['上午', '下午']);
        await clickItem('ampm', 1);
        expect(changes(store)).toEqual(['change 22:23:15 "下午 10:23:15"']);
        expect(getInput()).toHaveValue('下午 10:23:15');
        await clickItem('hour', 0);
        expect(changes(store).at(-1)).toBe('change 12:23:15 "下午 12:23:15"');
    });

    it('上午选 12 点是 0 点', async () => {
        const { store } = await setup({ open: true, value: '上午 10:23:15', props });
        await clickItem('hour', 0);
        expect(changes(store)).toEqual(['change 00:23:15 "上午 12:23:15"']);
    });

    it('disabledHours 按当前半天映射到 12 小时制', async () => {
        await setup({ open: true, value: '下午 02:23:15', props: { ...props, disabledHours: () => [0, 13] } });
        const disabled = getItems('hour')
            .filter((li) => li.getAttribute('aria-disabled') === 'true')
            .map((li) => li.textContent?.trim().slice(0, 2));
        expect(disabled).toEqual(['01']);
    });

    it('timeRange 无值时右面板默认下午', async () => {
        const { store } = await setup({ open: true, props: { ...props, type: 'timeRange' } });
        const [left, right] = getPanels();
        expect(getSelectedText('ampm', left)).toBe('上午');
        expect(getSelectedText('ampm', right)).toBe('下午');
        await clickItem('hour', 3, right);
        expect(changes(store).at(-1)).toMatch(/^change undefined\|15:00:00 /);
    });
});

describe('Svelte TimePicker 输入框', () => {
    it('不像时间格式的文本不触发 change，补全后才触发', async () => {
        const { store } = await setup();
        await typeText('10:2');
        expect(changes(store)).toEqual([]);
        await typeText('10:23:15');
        expect(changes(store)).toEqual(['change 10:23:15 "10:23:15"']);
    });

    it('键入禁用时间标记无效且不触发 change，失焦后恢复上一个有效时间', async () => {
        const { store } = await setup({ value: '10:23:15', props: { disabledHours: () => [11] } });
        await focusInput();
        await typeText('11:00:00');
        expect(invalid()).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
        expect(changes(store)).toEqual([]);
        await blurInput();
        expect(getInput()).toHaveValue('10:23:15');
        expect(invalid()).toBeNull();
    });

    it('受控时清空输入后失焦，输入框恢复受控值；非受控时保持为空', async () => {
        const controlled = await setup({ mode: 'function', value: '10:23:15', accept: false });
        await focusInput();
        await typeText('');
        await blurInput();
        expect(getInput()).toHaveValue('10:23:15');
        controlled.unmount();

        await setup({ value: '10:23:15' });
        await focusInput();
        await typeText('');
        await blurInput();
        expect(getInput()).toHaveValue('');
    });

    it('点击清除按钮清空，单选上报 undefined', async () => {
        const { store } = await setup({ value: '10:23:15' });
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(changes(store)).toEqual(['change undefined ""']);
        expect(getInput()).toHaveValue('');
    });

    it('范围清空上报 []', async () => {
        const { store } = await setup({ value: ['10:00:00', '12:00:00'], props: { type: 'timeRange' } });
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(changes(store)).toEqual(['change  [""]']);
        expect(getInput()).toHaveValue('');
    });

    it('inputReadOnly 只锁定打字，仍可清除', async () => {
        const { store } = await setup({ value: '10:23:15', props: { inputReadOnly: true } });
        expect(getInput()).toHaveAttribute('readonly');
        expect(document.querySelector(`.${prefixCls}-input-readonly`)).not.toBeNull();
        await fireEvent.mouseDown(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement);
        await settle();
        expect(changes(store)).toHaveLength(1);
    });

    it('placeholder、size、borderless、validateStatus 与 prefix', async () => {
        await setup({ prefix: true, props: { placeholder: '请选择', size: 'small', borderless: true, validateStatus: 'warning' } });
        expect(screen.getByPlaceholderText('请选择')).toBe(getInput());
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-borderless`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
        expect(screen.getByText('前缀')).toHaveClass('custom-prefix');
    });

    it('class 与 style 落在根元素，aria、id、name、data-* 落在输入框', async () => {
        await setup({ props: { class: 'custom-timepicker', style: 'width: 200px', id: 'start', name: 'start-name', 'aria-label': 'start time', 'data-testid': 'tp' } as FixtureStore['props'] });
        expect(getRoot()).toHaveClass('custom-timepicker');
        expect(getRoot()).toHaveStyle({ width: '200px' });
        expect(getInput()).not.toHaveClass('custom-timepicker');
        expect(getInput()).toHaveAttribute('aria-label', 'start time');
        expect(getInput()).toHaveAttribute('id', 'start');
        expect(getInput()).toHaveAttribute('name', 'start-name');
        expect(getInput()).toHaveAttribute('data-testid', 'tp');
        expect(getRoot()).not.toHaveAttribute('data-testid');
    });

    it('onKeyDown 到达输入框', async () => {
        const keys: string[] = [];
        await setup({ props: { onKeyDown: (event: KeyboardEvent) => keys.push(event.key) } });
        await fireEvent.keyDown(getInput(), { key: 'Enter' });
        expect(keys).toEqual(['Enter']);
    });

    it('timeZone 变化时按新时区显示同一时刻', async () => {
        const { store } = await setup({ value: '10:23:15', props: { timeZone: 'Asia/Shanghai' } });
        expect(getInput()).toHaveValue('10:23:15');
        store.props.timeZone = 'America/New_York';
        await settle();
        expect(getInput()).toHaveValue('22:23:15');
    });

    it('ConfigProvider 的 timeZone 作用于未传 timeZone 的选择器', async () => {
        const { store } = await setup({ config: { timeZone: 0 }, open: true });
        await clickItem('hour', 7);
        expect(getInput().value.startsWith('07:')).toBe(true);
        expect(changes(store)[0]).toMatch(/^change 15:00:00 /);
    });

    it('在 LocaleProvider 内使用其语言包', async () => {
        await setup({ localeProvider: en_US, open: true, value: '10:23:15' });
        expect(getSelectedText('hour')).toBe(`10${en_US.TimePicker.hour}`);
        expect(getInput()).toHaveAttribute('placeholder', en_US.TimePicker.placeholder.time);
    });

    it('读取全局默认值，组件传入的属性优先', async () => {
        semiGlobal.config.overrideDefaultProps = { TimePicker: { format: 'HH:mm', size: 'small' } };
        const first = await setup({ value: '10:23' });
        expect(getInput()).toHaveValue('10:23');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        first.unmount();
        await setup({ value: '10:23:15', props: { format: 'HH:mm:ss' } });
        expect(getInput()).toHaveValue('10:23:15');
    });

    it('focus 与 blur 方法移动输入框焦点', async () => {
        const { store, component } = await setup();
        component.api()?.focus();
        await settle();
        expect(getInput()).toHaveFocus();
        expect(getPanels()).toHaveLength(1);
        component.api()?.blur();
        expect(getInput()).not.toHaveFocus();
        expect(store.log).toContain('focus focusin');
    });
});

describe('Svelte TimePicker 自定义触发器', () => {
    it('trigger 替换输入框，点击打开面板，参数带 componentProps', async () => {
        await setup({ trigger: 'button', value: '10:23:15', props: { type: 'time' } });
        const trigger = screen.getByRole('button', { name: '10:23:15' });
        expect(trigger).toHaveClass('custom-trigger');
        expect(trigger).toHaveAttribute('data-type', 'time');
        expect(trigger).toHaveAttribute('data-value', '10:23:15');
        expect(getInput()).toBeNull();
        expect(trigger.parentElement).not.toHaveAttribute('role');
        await fireEvent.click(trigger);
        await settle();
        expect(getPanels()).toHaveLength(1);
    });

    it('面板打开时点击触发器不再请求打开', async () => {
        const { store } = await setup({ trigger: 'button', value: '10:23:15', open: true });
        await fireEvent.click(screen.getByRole('button', { name: '10:23:15' }));
        await settle();
        expect(opens(store)).toEqual([]);
        await clickOutside();
        expect(opens(store)).toEqual(['open false']);
    });

    it('只有不可聚焦内容时外层是按钮与 Tab 停靠点，Enter 打开面板', async () => {
        await setup({ trigger: 'text' });
        const wrapper = screen.getByRole('button', { name: '请选择时间' });
        expect(wrapper).toHaveAttribute('tabindex', '0');
        expect(wrapper).toHaveAttribute('aria-haspopup', 'dialog');
        expect(wrapper).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.keyDown(wrapper, { key: 'Enter' });
        await settle();
        expect(getPanels()).toHaveLength(1);
        expect(wrapper).toHaveAttribute('aria-expanded', 'true');
        expect(document.getElementById(wrapper.getAttribute('aria-controls') as string)).toContainElement(getPanels()[0]);
    });

    it('disabled 时点击不打开，也不通知 onOpenChange', async () => {
        const { store } = await setup({ trigger: 'text', props: { disabled: true } });
        const wrapper = screen.getByRole('button', { name: '请选择时间' });
        expect(wrapper).toHaveAttribute('tabindex', '-1');
        expect(wrapper).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.click(wrapper);
        await settle();
        expect(getPanels()).toHaveLength(0);
        expect(opens(store)).toEqual([]);
    });

    it('带 aria-label 时根元素为 group，未声明属性落在根元素', async () => {
        await setup({ trigger: 'text', props: { 'aria-label': '时间', 'data-testid': 'tp' } as FixtureStore['props'] });
        expect(getRoot()).toHaveAttribute('role', 'group');
        expect(getRoot()).toHaveAttribute('data-testid', 'tp');
        expect(within(getRoot()).getByRole('button')).toBeInTheDocument();
    });
});
