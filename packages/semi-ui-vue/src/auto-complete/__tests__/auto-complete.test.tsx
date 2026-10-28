/** @jsxImportSource vue */
import { createApp, defineComponent, h, KeepAlive, ref, type Component } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import AutoComplete, { type AutoCompleteDataItem, type AutoCompleteHandle, type AutoCompleteTriggerSlotProps } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Tag from '../../tag';
import InGroup from './fixtures/in-group.vue';
import ItemSlot from './fixtures/item-slot.vue';
import ModelTrim from './fixtures/model-trim.vue';
import Model from './fixtures/model.vue';
import TriggerSlot from './fixtures/trigger-slot.vue';

const optionCls = `${BASE_CLASS_PREFIX}-autocomplete-option`;

type Slots = Record<string, (scope: Record<string, unknown>) => unknown>;
type Selected = string | number | AutoCompleteDataItem;
// The popup content mounts after the popover opens, a few ticks after the AutoComplete
const settle = () => new Promise((resolve) => setTimeout(resolve));
// The popup has an animation; turned off so the tests need no waiting
const commonProps = { motion: false };

const renderWith = async (component: Component, props: Record<string, unknown> = {}, slots: Slots = {}) => {
    let handle: AutoCompleteHandle | undefined;
    const capture = (value: unknown) => {
        handle = (value ?? undefined) as AutoCompleteHandle | undefined;
    };
    const Host = (attrs: Record<string, unknown>) => <ConfigProvider locale={en_US}>{() => h(component, { ...attrs, ref: capture }, slots as never)}</ConfigProvider>;
    const view = render(Host, { props });
    await settle();
    return {
        ...view,
        handle: () => handle as AutoCompleteHandle,
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
};
const renderAc = (props: Record<string, unknown> = {}, slots: Slots = {}) => renderWith(AutoComplete, { ...commonProps, ...props }, slots);

const getInput = () => screen.getByRole<HTMLInputElement>('combobox');
const getRoot = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-autocomplete`) as HTMLElement;
const getList = () => document.querySelector<HTMLElement>(`.${optionCls}-list`);
const getOptions = () => Array.from(document.querySelectorAll<HTMLElement>(`.${optionCls}`));
const getOptionTexts = () => getOptions().map((option) => option.textContent);
const getFocusedOption = () => document.querySelector<HTMLElement>(`.${optionCls}-focused`);
const getPopupWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
const getClearBtn = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement;
const type = async (value: string, input: HTMLInputElement = getInput()) => {
    await fireEvent.update(input, value);
    await settle();
};
const keyDown = async (key: string, target: Element = getInput()) => {
    await fireEvent.keyDown(target, { key });
    await settle();
};
const click = async (element: Element | null) => {
    await userEvent.click(element as Element);
    await settle();
};
const mouseDown = async (element: Element) => {
    await fireEvent.mouseDown(element);
    await settle();
};
const clickClear = () => mouseDown(getClearBtn());
const expectClosed = () => waitFor(() => expect(getList()).toBeNull());

// option offsetTop is read from inline marginTop by vitest/setup.ts, which lets updateScrollTop compute a real value
const layoutData = (values: string[]) => values.map((value, i) => ({ value, label: value, style: { marginTop: `${i * 40}px` } }));

const stringData = ['semi', 'ies', 'design', 'platform'];
const objectData = [
    { email: 'semi@abc.com', value: 'abc' },
    { email: 'semi@bytedance.com', value: 'bytedance' },
    { email: 'semi@vigo.com', value: 'vigo' },
];

describe('AutoComplete', () => {
    it('【class & style】自定义 class 与 style 落在根 div', async () => {
        const { container } = await renderAc({ class: 'test', style: { color: 'red' } });
        const root = container.querySelector('div.test');
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-autocomplete`);
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【placeholder】设置 placeholder', async () => {
        await renderAc({ placeholder: 'semi' });
        expect(getInput()).toHaveAttribute('placeholder', 'semi');
    });

    it('【size】不同尺寸', async () => {
        const { container, rerender } = await renderAc({ size: 'small' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-small`)).not.toBeNull();
        await rerender({ size: 'large' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-large`)).not.toBeNull();
    });

    it('【disabled】disabled 为 true 时组件禁用', async () => {
        const { container } = await renderAc({ disabled: true });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-disabled`)).not.toBeNull();
        expect(getInput()).toBeDisabled();
    });

    it('【prefix & suffix】#prefix 与 #suffix 插槽', async () => {
        await renderAc(
            {},
            {
                prefix: () => <div class="prefix">prefix content</div>,
                suffix: () => <div class="suffix">suffix content</div>,
            }
        );
        expect(screen.getByText('prefix content')).toHaveClass('prefix');
        expect(screen.getByText('suffix content')).toHaveClass('suffix');
    });

    it('【dropdownClassName & dropdownStyle】自定义 dropdownClassName 与 dropdownStyle', async () => {
        await renderAc({ dropdownClassName: 'ddc', dropdownStyle: { color: 'red' }, defaultOpen: true });
        const list = document.querySelector(`.${optionCls}-list.ddc`);
        expect(list).not.toBeNull();
        expect(list).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('【position】不同位置', async () => {
        await renderAc({ position: 'top', data: stringData, defaultOpen: true });
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'top');
    });

    it('【defaultValue】defaultValue 不在 data 候选中', async () => {
        await renderAc({ defaultValue: 'semi', data: [] });
        expect(getInput()).toHaveValue('semi');
    });

    it('【defaultValue】defaultValue 可匹配 data', async () => {
        await renderAc({ defaultValue: 'semi', data: stringData });
        expect(getInput()).toHaveValue('semi');
    });

    it('【search】输入变化时发出 search', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        await renderAc({ onSearch });
        await type('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi');
    });

    it('defaultOpen 为 true 且 data 非空时显示候选列表', async () => {
        await renderAc({ defaultOpen: true, data: stringData });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        const candidate = (getList() as HTMLElement).children;
        expect(candidate).toHaveLength(4);
        expect(candidate[0]).toHaveTextContent(/^semi$/);
        expect(candidate[1]).toHaveTextContent(/^ies$/);
    });

    it('【data】data 变化时更新候选项', async () => {
        const { rerender } = await renderAc({ defaultOpen: true, data: ['semi'] });
        expect(getOptionTexts()).toEqual(['semi']);
        await rerender({ data: ['ies', 'design'] });
        expect(getOptionTexts()).toEqual(['ies', 'design']);
    });

    it('无效数据项不占位：高亮项与 Enter 选中项一致', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            defaultOpen: true,
            defaultValue: 'b',
            data: [{ label: 'x' }, 'a', 'b', 'c'] as unknown as string[],
            onSelect,
        });
        expect(getOptionTexts()).toEqual(['a', 'b', 'c']);
        expect(getFocusedOption()).toHaveTextContent('b');
        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledWith('b');
    });

    it('【loading】loading 为 true 时隐藏候选项并显示加载中', async () => {
        await renderAc({ loading: true, defaultOpen: true, data: stringData });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('【select】点击候选项时发出 select', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({ defaultOpen: true, data: stringData, onSelect });
        await click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('semi');
    });

    it('【select】selectWithObject 为 true 时载荷为数据项', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({ defaultOpen: true, data: objectData, onSelect, selectWithObject: true });
        await click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(objectData[0]));
    });

    it('点击 AutoComplete 后显示候选列表', async () => {
        await renderAc({ data: stringData });
        expect(getList()).toBeNull();
        await click(getInput());
        expect(getList()).not.toBeNull();
        expect(getOptionTexts()).toEqual(stringData);
    });

    it('renderSelectedItem', async () => {
        await renderAc({
            data: objectData,
            defaultOpen: true,
            renderSelectedItem: (option: { email: string }) => option.email,
        });
        await click(getOptions()[0]);
        expect(getInput()).toHaveValue(objectData[0].email);
    });

    it('受控模式下 renderSelectedItem 的结果经 change 上报，输入框仍显示 modelValue', async () => {
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({
            data: [
                { name: '夏可漫', label: '夏可漫', value: 'xiakeman@example.com', abbr: 'XK' },
                { name: '申悦', label: '申悦', value: 'shenyue@example.com', abbr: 'SY' },
            ],
            defaultOpen: true,
            renderSelectedItem: (option: { abbr: string }) => option.abbr,
            onChange,
            modelValue: '',
        });
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('XK');
        expect(getInput()).toHaveValue('');
    });

    it('【modelValue】受控模式', async () => {
        const { rerender } = await renderAc({ data: [], modelValue: 'semi' });
        expect(getInput()).toHaveValue('semi');
        await rerender({ data: [], modelValue: 'ies' });
        expect(getInput()).toHaveValue('ies');
    });

    it('【autofocus】挂载后聚焦输入框并发出一次 focus', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        // Testing Library re-inserts the mounted nodes, which drops the focus autofocus gave on mount
        const container = document.body.appendChild(document.createElement('div'));
        const app = createApp(() => <AutoComplete aria-label="auto" autofocus onFocus={onFocus} />);
        app.mount(container);
        onTestFinished(() => {
            app.unmount();
            container.remove();
        });
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveFocus();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('【emptyContent】data 为空时显示 #emptyContent', async () => {
        await renderAc({ defaultOpen: true, data: [] }, { emptyContent: () => <div class="custom-empty-content">emptycontent</div> });
        expect(screen.getByText('emptycontent')).toHaveClass('custom-empty-content');
    });

    it('【emptyContent】data 非空时不显示 #emptyContent', async () => {
        await renderAc({ defaultOpen: true, data: [1, 2, 3] }, { emptyContent: () => <div class="custom-empty-content">emptycontent</div> });
        expect(screen.queryByText('emptycontent')).toBeNull();
        expect(getOptionTexts()).toEqual(['1', '2', '3']);
    });

    it('【change】在输入与选中时发出，update:modelValue 先于 change', async () => {
        const order: string[] = [];
        const onChange = vi.fn<(value: string | number) => void>(() => order.push('change'));
        await renderAc({
            defaultOpen: true,
            onChange,
            'onUpdate:modelValue': () => order.push('update:modelValue'),
            data: ['hello', 'bytedance', 'semi'],
            showClear: true,
        });
        await type('abc');
        expect(onChange).toHaveBeenLastCalledWith('abc');
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenLastCalledWith('hello');
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(order).toEqual(['update:modelValue', 'change', 'update:modelValue', 'change']);
    });

    it('maxHeight 为数字时按 px 处理', async () => {
        await renderAc({ maxHeight: 400, data: ['a', 'b', 'c'], defaultOpen: true });
        expect(getList()).toHaveStyle({ maxHeight: '400px' });
    });

    // `--semi-tooltip-trigger-width` carries the trigger's live border-box width in the browser; jsdom has no layout,
    // so only the CSS wiring is checked here and the browser project covers the resulting width
    it('下拉最小宽度跟随触发器宽度', async () => {
        await renderAc({ defaultOpen: true, style: { width: '50%' } });
        expect(getPopupWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('【blur】焦点离开输入框时发出 blur', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        await renderAc({ onBlur });
        await fireEvent.focusIn(getInput());
        expect(onBlur).not.toHaveBeenCalled();
        await fireEvent.focusOut(getInput());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0].type).toBe('focusout');
    });

    it('【focus】输入框获得焦点时发出 focus', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        await renderAc({ onFocus });
        await fireEvent.focusIn(getInput());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0].type).toBe('focusin');
    });

    it('【键盘导航】ArrowDown 移到下一项', async () => {
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true });
        expect(getFocusedOption()).toHaveTextContent('semi');
        await keyDown('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('ies');
    });

    it('【键盘导航】ArrowUp 从首项循环到末项', async () => {
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true });
        await keyDown('ArrowUp');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('platform');
    });

    it('【键盘导航】Escape 关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange });
        expect(getList()).not.toBeNull();
        await keyDown('Escape');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【键盘导航】Enter 选中高亮项', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true, onSelect });
        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('semi');
        await expectClosed();
    });

    it('【showClear】showClear 为 true 且有值时显示清除按钮', async () => {
        await renderAc({ showClear: true, defaultValue: 'semi' });
        expect(getClearBtn()).not.toBeNull();
    });

    it('【trigger】#trigger 替换输入框', async () => {
        const { container } = await renderAc({ data: stringData }, { trigger: () => <div class="custom-trigger">Click to select</div> });
        expect(container.querySelector('.custom-trigger')).not.toBeNull();
        expect(container.querySelector('input')).toBeNull();
    });

    it('【validateStatus】error', async () => {
        const { container } = await renderAc({ validateStatus: 'error' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-error`)).not.toBeNull();
    });

    it('【validateStatus】warning', async () => {
        const { container } = await renderAc({ validateStatus: 'warning' });
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-warning`)).not.toBeNull();
    });

    it('【defaultActiveFirstOption】默认高亮第一项', async () => {
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true });
        expect(getOptions()[0]).toHaveClass(`${optionCls}-focused`);
        expect(document.querySelectorAll(`.${optionCls}-focused`)).toHaveLength(1);
    });

    it('【motion】motion 为 false 时没有动画类', async () => {
        await renderAc({ defaultOpen: true, data: stringData });
        expect(getOptionTexts()).toEqual(stringData);
        expect(getPopupWrapper().className).not.toMatch(/animation/);
    });

    it('【insetLabel】#insetLabel 渲染为 Input 的 inset label', async () => {
        const { container } = await renderAc({ insetLabelId: 'inset-label-id' }, { insetLabel: () => <span class="inset-label">Label</span> });
        expect(screen.getByText('Label')).toHaveClass('inset-label');
        const label = container.querySelector('#inset-label-id');
        expect(label).toContainElement(screen.getByText('Label'));
        expect(label).toHaveClass(`${BASE_CLASS_PREFIX}-input-inset-label`);
    });

    it('【clearIcon】#clearIcon 替换清除图标', async () => {
        await renderAc({ showClear: true, defaultValue: 'test' }, { clearIcon: () => <span class="custom-clear-icon">X</span> });
        expect(getClearBtn().querySelector('.custom-clear-icon')).not.toBeNull();
    });

    it('【clear】点击清除按钮发出一次无载荷的 clear', async () => {
        const onClear = vi.fn<() => void>();
        await renderAc({ onClear, showClear: true, defaultValue: 'test' });
        await clickClear();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onClear.mock.calls[0]).toEqual([]);
    });

    it.each(['{Enter}', ' '])('Tab 可到达有名称的清除按钮，%s 清空并回到输入框', async (key) => {
        const onClear = vi.fn<() => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({ data: ['semi', 'design'], showClear: true, defaultValue: 'semi', onClear, onChange });
        await click(getInput());
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: en_US.Input.clear });
        expect(clear).toHaveFocus();
        await userEvent.keyboard(key);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(getInput()).toHaveValue('');
        expect(getInput()).toHaveFocus();
    });

    it('【item】#item 渲染候选项内容', async () => {
        await renderAc({ data: stringData, defaultOpen: true }, { item: ({ item }) => <div class="custom-option-item">{String(item)}</div> });
        const items = document.querySelectorAll('.custom-option-item');
        expect(Array.from(items).map((item) => item.textContent)).toEqual(stringData);
    });

    it('【stopPropagation】为 false 时选项上的点击冒泡到 document', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('click', onClick);
        onTestFinished(() => document.removeEventListener('click', onClick));
        await renderAc({ stopPropagation: false, defaultOpen: true, data: stringData });
        await click(getOptions()[0]);
        expect(onClick).toHaveBeenCalled();
    });

    it('【dropdownMatchSelectWidth】为 false 时弹层没有 min-width', async () => {
        await renderAc({
            dropdownMatchSelectWidth: false,
            defaultOpen: true,
            data: stringData,
            style: { width: '200px' },
        });
        expect(getPopupWrapper().style.minWidth).toBe('');
    });

    it('【aria】aria 属性落在 input 上', async () => {
        await renderAc({
            'aria-label': 'autocomplete input',
            'aria-labelledby': 'label-id',
            'aria-describedby': 'desc-id',
            'aria-invalid': true,
            'aria-errormessage': 'error-msg',
            'aria-required': true,
        });
        const input = getInput();
        expect(input).toHaveAttribute('aria-label', 'autocomplete input');
        expect(input).toHaveAttribute('aria-labelledby', 'label-id');
        expect(input).toHaveAttribute('aria-describedby', 'desc-id');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage', 'error-msg');
        expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('【keydown】处理按键之后发出 keydown', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderAc({ data: stringData, defaultOpen: true, onKeydown });
        await keyDown('ArrowDown');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('【id】id 落在 combobox input 上，根 div 没有 id', async () => {
        const { container } = await renderAc({ id: 'my-autocomplete' });
        expect(getInput()).toHaveAttribute('id', 'my-autocomplete');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete`)).not.toHaveAttribute('id');
    });

    it('【item】对象数据的节点内容走 #item', async () => {
        await renderAc({ data: [{ label: 'Custom Label', value: 'custom' }], defaultOpen: true }, { item: ({ item }) => <span class="custom-label">{(item as AutoCompleteDataItem).label}</span> });
        expect(screen.getByText('Custom Label')).toHaveClass('custom-label');
    });

    it('【Enter】选中高亮项写入输入框', async () => {
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true });
        await keyDown('Enter');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
    });

    it('【Tab】关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange });
        await keyDown('Tab');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【禁用项】点击禁用项不发出 select', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            data: [
                { value: 'disabled', label: 'Disabled', disabled: true },
                { value: 'enabled', label: 'Enabled' },
            ],
            defaultOpen: true,
            onSelect,
        });
        const [disabledOption] = getOptions();
        expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
        await click(disabledOption);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('【emptyContent】未提供 #emptyContent 时空 data 的列表为空', async () => {
        await renderAc({ data: [], defaultOpen: true });
        expect(document.querySelector(`.${optionCls}-empty`)).toBeNull();
        expect(getList()?.children).toHaveLength(0);
        expect(getList()).toHaveTextContent('');
    });

    it('【showTick】匹配 value 的候选项高亮，没有勾选图标', async () => {
        await renderAc({ data: stringData, defaultOpen: true, defaultValue: 'semi' });
        expect(getFocusedOption()).toHaveTextContent('semi');
        expect(document.querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('输入后高亮项仍为匹配的候选项', async () => {
        await renderAc({ data: stringData, defaultOpen: true });
        await type('semi');
        expect(getInput()).toHaveValue('semi');
        expect(getFocusedOption()).toHaveTextContent('semi');
    });

    it('【点击外部】点击外部时关闭列表', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ defaultOpen: true, data: stringData, onDropdownVisibleChange });
        await mouseDown(getOptions()[0]);
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getList()).not.toBeNull();
        await mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('【点击外部】在列表内已打开的嵌套 Popover 里按下鼠标不关闭列表，在外部按下才关闭', async () => {
        await renderAc(
            { defaultOpen: true, data: ['semi'] },
            {
                item: () => (
                    <Popover ariaLabel="Nested" motion={false} trigger="custom" visible>
                        {{
                            default: () => <span>nested trigger</span>,
                            content: () => <button type="button">inside nested</button>,
                        }}
                    </Popover>
                ),
            }
        );
        await mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getList()).not.toBeNull();
        await mouseDown(document.body);
        await expectClosed();
    });

    it('【滚动】ArrowDown 把高亮项滚到列表中间', async () => {
        await renderAc({ data: layoutData(stringData), defaultOpen: true, defaultActiveFirstOption: true });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent('ies');
        expect((getList() as HTMLElement).scrollTop).toBe(40);
    });

    it('【ArrowUp】高亮上移', async () => {
        await renderAc({ defaultOpen: true, data: stringData, defaultActiveFirstOption: true });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent('design');
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent('ies');
    });

    it('【trigger】点击自定义触发器打开列表', async () => {
        const { container } = await renderAc({ data: stringData }, { trigger: () => <div class="custom-trigger">Select</div> });
        await click(container.querySelector('.custom-trigger'));
        expect(getOptionTexts()).toEqual(stringData);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('#trigger 内按钮聚焦时 %j 只交给按钮，不打开列表', async (key) => {
        const onPress = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderAc(
            { data: stringData },
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <button type="button" aria-label="reset" onClick={onPress} />
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: 'reset' }).focus();
        await userEvent.keyboard(key);
        await settle();
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getList()).toBeNull();
    });

    it('#trigger 内 role="button" 的元素上按 Enter 只交给它，不打开列表；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        await renderAc(
            { data: stringData },
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <Tag aria-label="reset" onClick={onPress}>
                            {() => 'semi'}
                        </Tag>
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: 'reset' }).focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getList()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'reset' }));
        await settle();
        expect(getList()).not.toBeNull();
    });

    it('【stopPropagation】默认阻止选项上的点击冒泡到 document', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        document.addEventListener('click', onClick);
        onTestFinished(() => document.removeEventListener('click', onClick));
        await renderAc({ data: stringData, defaultOpen: true });
        await click(getOptions()[0]);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('【renderSelectedItem】不匹配 data 的 defaultValue 以 { label, value } 渲染', async () => {
        await renderAc({
            data: stringData,
            renderSelectedItem: (option: AutoCompleteDataItem) => `Selected: ${option.value}`,
            defaultValue: 'semi',
        });
        expect(getInput()).toHaveValue('Selected: semi');
    });

    it('【mouseenter】悬停候选项使其高亮', async () => {
        await renderAc({ data: stringData, defaultOpen: true });
        expect(getFocusedOption()).toBeNull();
        await fireEvent.mouseEnter(getOptions()[0]);
        expect(getFocusedOption()).toBe(getOptions()[0]);
    });

    it('【loading】显示 Spin', async () => {
        await renderAc({ data: stringData, defaultOpen: true, loading: true });
        const loading = document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper`) as HTMLElement;
        expect(loading.querySelector(`.${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
    });

    it('【滚动】连续 ArrowDown 滚到对应位置', async () => {
        await renderAc({ data: layoutData(stringData), defaultOpen: true, defaultActiveFirstOption: true });
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent('design');
        expect((getList() as HTMLElement).scrollTop).toBe(80);
    });

    it('【select】selectWithObject 时载荷带上数据项的其他字段', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            data: [{ label: 'Option 1', value: 'opt1', customProp: 'custom' }],
            defaultOpen: true,
            onSelect,
            selectWithObject: true,
        });
        await click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'opt1', label: 'Option 1', customProp: 'custom' }));
    });

    it('【禁用项】点击后不发出 select，列表保持打开', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            data: [{ label: 'Disabled Option', value: 'disabled', disabled: true }],
            defaultOpen: true,
            onSelect,
        });
        await click(getOptions()[0]);
        expect(onSelect).not.toHaveBeenCalled();
        expect(getList()).not.toBeNull();
    });

    it('【dropdownVisibleChange】点击输入框切换列表并上报', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ data: stringData, onDropdownVisibleChange });
        await click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('再次点击输入框关闭列表', async () => {
        await renderAc({ data: stringData });
        await click(getInput());
        expect(getList()).not.toBeNull();
        await click(getInput());
        await expectClosed();
    });

    it('data 换成对象数组后显示新的候选项', async () => {
        const { rerender } = await renderAc({ data: stringData, defaultOpen: true });
        await rerender({ data: [{ label: 'new', value: 'new' }] });
        expect(getOptionTexts()).toEqual(['new']);
    });

    it('#trigger 的 value 随选中变化', async () => {
        await renderAc(
            { data: stringData },
            {
                trigger: ({ value }) => <div class="custom-trigger">{(value as AutoCompleteDataItem[]).length ? (value as AutoCompleteDataItem[]).map((item) => item.label).join(',') : 'empty'}</div>,
            }
        );
        expect(screen.getByText('empty')).toBeInTheDocument();
        await click(screen.getByText('empty'));
        await click(getOptions()[1]);
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(/^ies$/);
    });

    it('数据项的 showTick 不渲染勾选图标', async () => {
        await renderAc({
            data: [{ label: 'Option 1', value: 'opt1', showTick: true }],
            defaultOpen: true,
            defaultValue: 'opt1',
        });
        expect(getOptions()[0].querySelector(`.${optionCls}-icon`)).toBeNull();
    });

    it('点击根 div 打开列表', async () => {
        await renderAc({ data: stringData });
        await click(getRoot());
        expect(getList()).not.toBeNull();
    });

    it('数据项的 class 与 style 落到候选项', async () => {
        await renderAc({
            data: [{ label: 'Styled Option', value: 'styled', class: 'custom-class', style: { color: 'red' } }],
            defaultOpen: true,
        });
        const option = getOptions()[0];
        expect(option).toHaveClass('custom-class');
        expect(option).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('卸载后 document 上的 mousedown 不再触达', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = await renderAc({ data: stringData, onDropdownVisibleChange });
        await fireEvent.click(getInput());
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
        view.unmount();
        await fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
    });

    it('【stopPropagation】阻止选项上的 mousedown 冒泡到 document', async () => {
        const onMouseDown = vi.fn<(event: MouseEvent) => void>();
        await renderAc({ data: stringData, defaultOpen: true });
        document.addEventListener('mousedown', onMouseDown);
        onTestFinished(() => document.removeEventListener('mousedown', onMouseDown));
        await mouseDown(getOptions()[0]);
        expect(onMouseDown).not.toHaveBeenCalled();
    });

    it('【combobox】input 暴露 expanded、controls、autocomplete 与 activedescendant', async () => {
        await renderAc({ data: stringData });
        const input = getInput();
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        const root = getRoot();
        expect(root).not.toHaveAttribute('aria-expanded');
        expect(root).not.toHaveAttribute('aria-controls');

        await click(input);
        expect(input).toHaveAttribute('aria-expanded', 'true');
        // the listbox is the popup, not a dialog around it
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(root).not.toHaveAttribute('aria-describedby');
        expect(getList()).toHaveAttribute('id', input.getAttribute('aria-controls'));
        expect(getList()).toHaveAttribute('role', 'listbox');
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await keyDown('ArrowDown');
        const focused = getFocusedOption() as HTMLElement;
        expect(focused).toHaveAttribute('role', 'option');
        expect(focused.id).not.toBe('');
        expect(input).toHaveAttribute('aria-activedescendant', focused.id);
        expect(new Set(getOptions().map((o) => o.id)).size).toBe(getOptions().length);
    });

    it('【renderSelectedItem】点选后输入框显示其结果', async () => {
        await renderAc({
            data: stringData,
            renderSelectedItem: (item: AutoCompleteDataItem) => `Selected: ${item.value}`,
            defaultValue: 'semi',
            defaultOpen: true,
        });
        await click(getOptions()[2]);
        expect(getInput()).toHaveValue('Selected: design');
    });

    it('【滚动】ArrowUp 从首项循环到末项时滚到底部', async () => {
        await renderAc({ data: layoutData(stringData), defaultOpen: true, defaultActiveFirstOption: true });
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect((getList() as HTMLElement).scrollTop).toBe(120);
    });

    it('【滚动】从匹配 defaultValue 的项开始滚动', async () => {
        await renderAc({ data: layoutData(stringData), defaultOpen: true, defaultValue: 'semi' });
        expect((getList() as HTMLElement).scrollTop).toBe(0);
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent('platform');
        expect((getList() as HTMLElement).scrollTop).toBe(120);
    });

    it('【点击外部】触发器内的 mousedown 不关闭列表', async () => {
        await renderAc({ data: stringData, defaultOpen: true });
        await mouseDown(getInput());
        expect(getList()).not.toBeNull();
        await mouseDown(document.body);
        await expectClosed();
    });

    it('#item 的行可悬停高亮并点击选中', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc(
            {
                data: [
                    { label: 'Custom 1', value: 'c1' },
                    { label: 'Custom 2', value: 'c2' },
                ],
                defaultOpen: true,
                onSelect,
            },
            { item: ({ item }) => <div class="custom-option-item">{(item as AutoCompleteDataItem).label}</div> }
        );
        const items = document.querySelectorAll<HTMLElement>('.custom-option-item');
        expect(items).toHaveLength(2);
        await fireEvent.mouseEnter(getOptions()[1]);
        expect(getFocusedOption()).toContainElement(items[1]);
        await click(items[1]);
        expect(onSelect).toHaveBeenCalledWith('c2');
    });

    it('打开后点击外部关闭', async () => {
        await renderAc({ data: stringData });
        await click(getInput());
        expect(getList()).not.toBeNull();
        await mouseDown(document.body);
        await expectClosed();
    });

    // Typing '1.62' focuses its index in the old results (1); when the new results (just '1.62') arrive the focus
    // index has to be recomputed, otherwise nothing is highlighted and Enter picks a missing option
    it('Fix2951 (#2952)：defaultActiveFirstOption 高亮输入后加载的数据的第一项', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const { rerender } = await renderAc({ defaultActiveFirstOption: true, onSelect, data: [] });
        // like a remote search: loading while typing, then the results arrive
        const search = async (value: string, results: string[]) => {
            await type(value);
            await rerender({ data: [], loading: true });
            await rerender({ data: results, loading: false });
        };
        await search('1.6', ['1.60', '1.62', '1.63', '1.64']);
        expect(getOptionTexts()).toEqual(['1.60', '1.62', '1.63', '1.64']);
        expect(getFocusedOption()).toBe(getOptions()[0]);

        await search('1.62', ['1.62']);
        expect(getOptionTexts()).toEqual(['1.62']);
        expect(getFocusedOption()).toBe(getOptions()[0]);

        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledWith('1.62');
    });
});

describe('AutoComplete 行为基线', () => {
    it('非受控：输入会更新 input，选择会写入选项值', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({ data: stringData, onSearch, onChange });
        await type('de');
        expect(getInput()).toHaveValue('de');
        expect(onSearch).toHaveBeenLastCalledWith('de');
        expect(getOptionTexts()).toEqual(stringData);
        await click(getOptions()[2]);
        expect(getInput()).toHaveValue('design');
        expect(onChange.mock.calls.map(([v]) => v)).toEqual(['de', 'design']);
        await expectClosed();
    });

    it('单向绑定：父级更新前 input 显示 modelValue', async () => {
        const onChange = vi.fn<(value: string | number) => void>();
        const onSelect = vi.fn<(value: Selected) => void>();
        const { rerender } = await renderAc({ data: stringData, modelValue: 'semi', onChange, onSelect });
        await type('semiX');
        expect(getInput()).toHaveValue('semi');
        expect(onChange).toHaveBeenLastCalledWith('semiX');
        await click(getOptions()[1]);
        expect(onSelect).toHaveBeenLastCalledWith('ies');
        expect(onChange).toHaveBeenLastCalledWith('ies');
        expect(getInput()).toHaveValue('semi');
        await expectClosed();
        await rerender({ modelValue: 'ies' });
        expect(getInput()).toHaveValue('ies');
    });

    it('selectWithObject 时载荷为整个数据项，renderSelectedItem 填充 input', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc(
            {
                data: objectData,
                onSelect,
                selectWithObject: true,
                renderSelectedItem: (item: { email: string }) => item.email,
                defaultOpen: true,
            },
            { item: ({ item }) => (item as { email: string }).email }
        );
        expect(getOptionTexts()).toEqual(objectData.map((item) => item.email));
        await click(getOptions()[1]);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'bytedance', email: 'semi@bytedance.com' }));
        expect(getInput()).toHaveValue('semi@bytedance.com');
    });

    it('方向键循环并跳过禁用项，Enter 选中高亮项', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({ data: [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }], onSelect });
        await keyDown('ArrowDown');
        expect(getList()).not.toBeNull();
        expect(getFocusedOption()).toBeNull();
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBe(getOptions()[0]);
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toBe(getOptions()[2]);
        await keyDown('Enter');
        expect(onSelect).toHaveBeenCalledWith('c');
        expect(getInput()).toHaveValue('c');
    });

    it('AutoComplete 之外的按键不打开列表', async () => {
        await renderAc({ data: stringData });
        await keyDown('ArrowDown', document.body);
        expect(getList()).toBeNull();
    });

    it('Escape 关闭已打开的列表，并上报 dropdownVisibleChange(false)', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ data: stringData, onDropdownVisibleChange });
        await keyDown('ArrowDown');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await keyDown('Escape');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await expectClosed();
    });

    it('清除按钮清空 input，并上报空搜索', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({ data: stringData, defaultValue: 'semi', showClear: true, onSearch, onChange });
        await clickClear();
        expect(getInput()).toHaveValue('');
        expect(onSearch).toHaveBeenLastCalledWith('');
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('loading 用加载指示器替换选项；data 为空时显示 #emptyContent', async () => {
        const { rerender } = await renderAc({ data: stringData, defaultOpen: true, loading: true }, { emptyContent: () => 'nothing' });
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-autocomplete-loading-wrapper .${BASE_CLASS_PREFIX}-spin`)).not.toBeNull();
        await rerender({ data: [], loading: false });
        expect(getList()).toHaveTextContent('nothing');
    });

    it('data-* 落在根 div 上，aria 属性落在 input 上，根 div 的 tabindex 为 -1', async () => {
        await renderAc({ 'data-testid': 'ac', 'aria-label': 'search', tabindex: 5 });
        expect(getRoot()).toHaveAttribute('data-testid', 'ac');
        expect(getInput()).toHaveAttribute('aria-label', 'search');
        expect(getRoot()).toHaveAttribute('tabindex', '-1');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { size: 'small' } };
        onTestFinished(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });
        await renderAc();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
    });

    it('每次输入只上报一次 change，点击外部时关闭', async () => {
        const onChange = vi.fn<(value: string | number) => void>();
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ data: stringData, onChange, onDropdownVisibleChange });
        await userEvent.type(getInput(), 'ab');
        await settle();
        expect(onChange.mock.calls.map(([v]) => v)).toEqual(['a', 'ab']);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        await mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        await expectClosed();
        await mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
        await keyDown('ArrowDown');
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        expect(getList()).not.toBeNull();
    });
});

describe('AutoComplete 组件实例', () => {
    it('nativeElement 是根 div，卸载后为 null', async () => {
        const view = await renderAc();
        const handle = view.handle();
        expect(handle.nativeElement).toBe(getRoot());
        view.unmount();
        expect(handle.nativeElement).toBeNull();
    });

    it('选项与 listbox 自身（内边距与滚动条）上的 mousedown 都阻止默认行为', async () => {
        await renderAc({ data: stringData, defaultOpen: true });
        const mouseDownPrevented = (target: Element) => {
            const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            return event.defaultPrevented;
        };
        expect(mouseDownPrevented(getOptions()[0])).toBe(true);
        expect(mouseDownPrevented(screen.getByRole('listbox'))).toBe(true);
    });

    it('有 #trigger 时 nativeElement 是包住触发器的 div', async () => {
        const view = await renderAc({}, { trigger: () => <span>trigger</span> });
        const root = screen.getByText('trigger').parentElement;
        expect(view.handle().nativeElement).toBe(root);
        expect(root).toHaveAttribute('tabindex', '-1');
    });

    it('#trigger 的 componentProps 是组件 props，不含插槽', async () => {
        const trigger = vi.fn<(scope: Record<string, unknown>) => string>(() => 'trigger');
        await renderAc({ data: ['semi'] }, { trigger });
        const scope = trigger.mock.calls.at(-1)?.[0] as unknown as AutoCompleteTriggerSlotProps;
        const { componentProps } = scope;
        expect(componentProps.data).toEqual(['semi']);
        expect(componentProps).not.toHaveProperty('ref');
        expect(componentProps).not.toHaveProperty('trigger');
    });

    it('未声明的属性落到根 div 上，name 落在 input 上', async () => {
        await renderAc({ name: 'city-name', title: 'tip', data: stringData });
        expect(getRoot()).toHaveAttribute('title', 'tip');
        expect(getRoot()).not.toHaveAttribute('name');
        expect(getInput()).toHaveAttribute('name', 'city-name');
    });

    it('全局默认值填充组件没有默认值的键', async () => {
        semiGlobal.config.overrideDefaultProps = { AutoComplete: { placeholder: 'global' } };
        onTestFinished(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });
        await renderAc();
        expect(getInput()).toHaveAttribute('placeholder', 'global');
    });

    it('打开时点击外部关闭一次，卸载后 document 上的 mousedown 不再触达', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = await renderAc({ data: stringData, defaultOpen: true, onDropdownVisibleChange });
        await mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        await keyDown('ArrowDown');
        view.unmount();
        await fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true]]);
    });
});

describe('AutoComplete 审计修复', () => {
    it('data 不变时换 #item，候选项内容随之更新', async () => {
        const data = ['semi', 'design'];
        const Host = defineComponent({
            props: { mark: { type: String, required: true } },
            setup: (props) => () => (
                <AutoComplete {...commonProps} aria-label="ac" data={data} defaultOpen>
                    {{
                        item: ({ item }: { item: string }) => <i>{`${props.mark}-${item}`}</i>,
                    }}
                </AutoComplete>
            ),
        });
        const view = render(Host, { props: { mark: 'A' } });
        await settle();
        expect(getOptionTexts()).toEqual(['A-semi', 'A-design']);
        await view.rerender({ mark: 'B' });
        await settle();
        expect(getOptionTexts()).toEqual(['B-semi', 'B-design']);
    });

    // option.vue reads the row content once to tell plain text from markup and renders it once more
    it('键入时 #item 在一次渲染中对每个可见项调用两次', async () => {
        const item = vi.fn<(scope: Record<string, unknown>) => string>((scope) => String(scope.item));
        await renderAc({ data: ['semi', 'design', 'ies'], defaultOpen: true }, { item });
        const callsBefore = item.mock.calls.length;
        await type('s');
        expect(item.mock.calls.length - callsBefore).toBeLessThanOrEqual(3 * 2);
    });

    it('鼠标悬停禁用项后按 Enter 不选中', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
            ],
            defaultOpen: true,
            onSelect,
            onChange,
        });
        await fireEvent.mouseEnter(getOptions()[0]);
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');
    });

    it('首项禁用且 defaultActiveFirstOption 时按 Enter 不选中', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
            ],
            defaultOpen: true,
            defaultActiveFirstOption: true,
            onSelect,
        });
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('selectWithObject 时点击与 Enter 选中得到相同且不含内部字段的对象', async () => {
        const data = [{ value: 'a', label: 'A', class: 'x', extra: 1 }, 'plain'];
        const clickSelect = vi.fn<(value: Selected) => void>();
        const first = await renderAc({ data, defaultOpen: true, selectWithObject: true, onSelect: clickSelect });
        await click(getOptions()[0]);
        first.unmount();

        const enterSelect = vi.fn<(value: Selected) => void>();
        await renderAc({
            data,
            defaultOpen: true,
            defaultActiveFirstOption: true,
            selectWithObject: true,
            onSelect: enterSelect,
        });
        await keyDown('Enter');
        expect(clickSelect.mock.calls[0][0]).toEqual({ value: 'a', label: 'A', class: 'x', extra: 1 });
        expect(enterSelect.mock.calls[0][0]).toEqual(clickSelect.mock.calls[0][0]);
    });

    it('selectWithObject 时字符串项的载荷为 { value, label }', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        await renderAc({ data: ['plain'], defaultOpen: true, selectWithObject: true, onSelect });
        await click(getOptions()[0]);
        expect(onSelect.mock.calls[0][0]).toEqual({ value: 'plain', label: 'plain' });
    });

    it('列表关闭时按 Tab 与 Escape 不上报 dropdownVisibleChange', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ data: stringData, onDropdownVisibleChange });
        await keyDown('Tab');
        await keyDown('Escape');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('方向键在首尾禁用项时仍循环，全部禁用时不越界', async () => {
        const first = await renderAc({
            data: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D', disabled: true },
            ],
            defaultOpen: true,
        });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        first.unmount();

        await renderAc({ data: [{ value: 'a', label: 'A', disabled: true }], defaultOpen: true });
        await keyDown('ArrowUp');
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBeNull();
    });

    it('selectWithObject 时不在 data 中的 defaultValue 照常显示，renderSelectedItem 收到 { label, value }', async () => {
        const renderSelectedItem = vi.fn<(option: AutoCompleteDataItem) => string>((option) => String(option.value));
        await renderAc({ data: ['semi'], defaultValue: 'other', selectWithObject: true, renderSelectedItem });
        expect(getInput()).toHaveValue('other');
        expect(renderSelectedItem).toHaveBeenLastCalledWith({ label: 'other', value: 'other' });
    });

    it('数据项里的同名字段不覆盖候选项的内部属性', async () => {
        await renderAc({ data: [{ value: 'a', focused: true }, { value: 'b' }], defaultOpen: true });
        expect(getOptions()).toHaveLength(2);
        expect(getFocusedOption()).toBeNull();
    });

    it('使用 #trigger 不打印警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await renderAc({}, { trigger: () => <span>trigger</span> });
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('AutoComplete Vue 写法', () => {
    it('v-model 双向：输入与选中都更新父级，update:modelValue 先于 change；父级改值后输入框随之更新', async () => {
        const onOrder = vi.fn<(name: string) => void>();
        render(Model, { props: { onOrder } });
        await settle();
        await type('se');
        expect(screen.getByTestId('model')).toHaveTextContent('se');
        expect(onOrder.mock.calls.map(([name]) => name)).toEqual(['update:modelValue', 'change']);
        await click(getOptionByText('design'));
        expect(screen.getByTestId('model')).toHaveTextContent('design');
        expect(getInput()).toHaveValue('design');
        await click(screen.getByRole('button', { name: 'set' }));
        expect(getInput()).toHaveValue('platform');
    });

    it('v-model.trim 能输入词间空格，且修饰符不落到 DOM', async () => {
        render(ModelTrim);
        await settle();
        await userEvent.type(getInput(), 'a b');
        expect(getInput()).toHaveValue('a b');
        expect(screen.getByTestId('trim-value')).toHaveTextContent('"a b"');
        expect(document.querySelector('[modelmodifiers]')).toBeNull();
    });

    it('单向绑定：选中候选项后输入框不自翻转，父级以同一个值重渲染仍显示 modelValue', async () => {
        const onChange = vi.fn<(value: string | number) => void>();
        const { rerender } = await renderAc({ data: stringData, modelValue: 'semi', onChange, defaultOpen: true });
        await click(getOptions()[2]);
        expect(onChange).toHaveBeenLastCalledWith('design');
        expect(getInput()).toHaveValue('semi');
        await rerender({ modelValue: 'semi', data: stringData });
        expect(getInput()).toHaveValue('semi');
    });

    it('modelValue 从有值改为 undefined 后清空并按非受控工作', async () => {
        const { rerender } = await renderAc({ data: stringData, modelValue: 'semi' });
        expect(getInput()).toHaveValue('semi');
        await rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('');
        await type('free');
        expect(getInput()).toHaveValue('free');
    });

    it('<label for> 命名 combobox；不传 id 时 input 仍有 id，listbox 不指向输入框（accname 会取输入内容）', async () => {
        const first = render(() => (
            <>
                <label for="city">City</label>
                <AutoComplete {...commonProps} id="city" data={stringData} />
            </>
        ));
        await settle();
        expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
        first.unmount();

        await renderAc({ data: stringData, defaultOpen: true });
        expect(getInput().id).not.toBe('');
        expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-label');
    });

    describe('combobox 与 listbox 用同一个名称来源', () => {
        it('使用方 aria-label 时两者都用该值', async () => {
            await renderAc({ data: stringData, defaultOpen: true, 'aria-label': 'Cities' }, { insetLabel: () => 'City' });
            expect(getInput()).toHaveAccessibleName('Cities');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Cities');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 #insetLabel，两者指向同一个标签', async () => {
            const label = document.body.appendChild(document.createElement('span'));
            label.id = 'outer';
            label.textContent = 'Outer';
            onTestFinished(() => label.remove());
            await renderAc({ data: stringData, defaultOpen: true, 'aria-labelledby': 'outer' }, { insetLabel: () => 'City' });
            expect(getInput()).toHaveAccessibleName('Outer');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('Outer');
        });

        it('只有 #insetLabel 时 combobox 与 listbox 都以 insetLabel 命名，没有 insetLabelId 时也能引用', async () => {
            const first = await renderAc({ data: stringData, defaultOpen: true }, { insetLabel: () => 'City' });
            expect(getInput()).toHaveAccessibleName('City');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('City');
            first.unmount();

            await renderAc({ data: stringData, defaultOpen: true, insetLabelId: 'city-label' }, { insetLabel: () => 'City' });
            expect(getInput()).toHaveAttribute('aria-labelledby', 'city-label');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'city-label');
        });

        it('#prefix 插槽内容为空时 insetLabel 照常渲染并命名两者；#insetLabel 内容为空时不作名称来源', async () => {
            const first = await renderAc({ data: stringData, defaultOpen: true }, { prefix: () => [], insetLabel: () => 'City' });
            expect(getInput()).toHaveAccessibleName('City');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('City');
            first.unmount();

            await renderAc({ data: stringData, defaultOpen: true }, { insetLabel: () => [] });
            expect(getInput()).not.toHaveAttribute('aria-labelledby');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('没有名称来源时两者都不加名称；#trigger 时 listbox 不指向 input', async () => {
            const first = await renderAc({ data: stringData, defaultOpen: true });
            expect(getInput()).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-label');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
            first.unmount();

            await renderAc({ data: stringData, defaultOpen: true }, { trigger: () => <span>trigger</span> });
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });
    });

    it('全局默认值：semiGlobal 的普通值与函数值生效，实例级 provide 生效，传入值优先', async () => {
        semiGlobal.config.overrideDefaultProps = {
            AutoComplete: {
                size: 'small',
                placeholder: 'global',
                maxHeight: 120,
                renderSelectedItem: (option) => `#${String(option.value)}`,
            },
        };
        onTestFinished(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });
        const first = await renderAc({ data: stringData, defaultOpen: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-small`)).not.toBeNull();
        expect(getInput()).toHaveAttribute('placeholder', 'global');
        expect(getList()).toHaveStyle({ maxHeight: '120px' });
        await click(getOptions()[1]);
        expect(getInput()).toHaveValue('#ies');
        first.unmount();

        await renderAc({ data: stringData, placeholder: 'own', size: 'large' });
        expect(getInput()).toHaveAttribute('placeholder', 'own');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-large`)).not.toBeNull();
    });

    it('app.provide(semiGlobalKey) 的实例级配置生效', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { AutoComplete: { placeholder: 'scoped' } };
        render(AutoComplete, {
            props: { 'aria-label': 'ac' },
            global: { provide: { [semiGlobalKey]: semi } },
        });
        await settle();
        expect(getInput()).toHaveAttribute('placeholder', 'scoped');
    });

    it('attrs 落点：class、style、data-*、title 与监听器在根 div，id、name、aria 在 input，使用方 @click 被调用', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        await renderAc({
            class: 'own',
            style: { color: 'red' },
            'data-k': 'v',
            title: 'tip',
            id: 'ac-id',
            name: 'ac-name',
            'aria-describedby': 'desc',
            onClick,
            onMouseenter,
            data: stringData,
        });
        const root = getRoot();
        expect(root).toHaveClass('own');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('data-k', 'v');
        expect(root).toHaveAttribute('title', 'tip');
        expect(root).not.toHaveAttribute('aria-describedby');
        const input = getInput();
        expect(input).toHaveAttribute('id', 'ac-id');
        expect(input).toHaveAttribute('name', 'ac-name');
        expect(input).toHaveAttribute('aria-describedby', 'desc');
        await fireEvent.mouseEnter(root);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        await click(input);
        expect(onClick).toHaveBeenCalledTimes(1);
        // the AutoComplete's own click handler still runs
        expect(getList()).not.toBeNull();
    });

    it('有 #trigger 时 id 落在根 div，aria 经 controlAttrs 交给触发器，name 丢弃', async () => {
        render(TriggerSlot, {
            props: { id: 'tid', 'aria-label': 'Pick', 'aria-describedby': 'desc' },
            attrs: { name: 'tname' },
        });
        await settle();
        const custom = document.querySelector('.custom-input') as HTMLInputElement;
        expect(custom.parentElement?.parentElement).toHaveAttribute('id', 'tid');
        expect(custom).toHaveAttribute('aria-label', 'Pick');
        expect(custom).toHaveAttribute('aria-describedby', 'desc');
        expect(custom).not.toHaveAttribute('name');
        expect(document.querySelector('[name]')).toBeNull();
        expect(document.querySelector('[aria-label="Pick"]')).toBe(custom);
    });

    // the props a template compiles `<AutoComplete selectWithObject>`, `:selectWithObject="true"`,
    // `:select-with-object="true"` and `select-with-object` into
    it.each<[string, Record<string, unknown>]>([
        ['简写', { selectWithObject: '' }],
        ['绑定', { selectWithObject: true }],
        ['kebab 绑定', { 'select-with-object': true }],
        ['kebab 简写', { 'select-with-object': '' }],
    ])('selectWithObject 的%s写法是布尔属性，@select 照常收到数据项', async (_form, flag) => {
        const onSelect = vi.fn<(value: Selected) => void>();
        // rendered directly: Vue Test Utils drops an on* mounting prop that is not a function
        render(() => <AutoComplete {...commonProps} data={[{ value: 'a', label: 'A' }]} defaultOpen onSelect={onSelect} {...flag} />);
        await settle();
        await click(getOptions()[0]);
        expect(onSelect.mock.calls).toEqual([[{ value: 'a', label: 'A' }]]);
    });

    it('kebab-case 键与布尔简写的 props 按预期解析', async () => {
        // the props a template compiles kebab-case attributes and boolean shorthands into
        const props = {
            data: [{ value: 'a', label: 'A' }],
            'default-active-first-option': '',
            'default-open': '',
            'default-value': 'a',
            'dropdown-match-select-width': false,
            'show-clear': '',
        };
        const view = await renderAc(props);
        const input = getInput();
        expect(input).toHaveValue('a');
        expect(input.closest(`.${BASE_CLASS_PREFIX}-input-wrapper-clearable`)).not.toBeNull();
        expect(getOptions()[0]).toHaveClass(`${optionCls}-focused`);
        expect(getPopupWrapper().style.minWidth).toBe('');
        // a disabled AutoComplete does not open on defaultOpen, so disabled is checked on its own
        await view.rerender({ ...commonProps, ...props, disabled: '' });
        expect(input).toBeDisabled();
    });

    it('#item 收到原始数据项与已渲染下标；插槽无内容时回落 label；缺 label 时显示 value', async () => {
        const data = [{ value: 'a', label: 'A', email: 'a@x' }, 'plain', { value: 'b', label: 'B' }, { value: 'c' }];
        render(ItemSlot, { props: { data, skip: 'B' } });
        await settle();
        const items = Array.from(document.querySelectorAll<HTMLElement>('.custom-item'));
        expect(items.map((item) => [item.textContent, item.dataset.source])).toEqual([
            ['0:a@x', '0'],
            ['1:plain', 'string'],
            ['3:c', '3'],
        ]);
        expect(getOptionTexts()).toEqual(['0:a@x', '1:plain', 'B', '3:c']);
    });

    it('数据项缺 label 时显示 value', async () => {
        await renderAc({ data: [{ value: 'a' }, { value: 'b' }], defaultOpen: true });
        expect(getOptionTexts()).toEqual(['a', 'b']);
    });

    it('#trigger 参数：value、inputValue、onChange、onClear、onFocus、onBlur、placeholder、disabled、componentProps', async () => {
        const onSearch = vi.fn<(value: string) => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        const onClear = vi.fn<() => void>();
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(TriggerSlot, { props: { onSearch, onChange, onClear, onFocus, onBlur } });
        await settle();
        const customInput = document.querySelector('.custom-input') as HTMLInputElement;
        customInput.focus();
        await settle();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        expect(screen.getByTestId('placeholder')).toHaveTextContent('pick');
        expect(screen.getByTestId('disabled')).toHaveTextContent('undefined');
        expect(screen.getByTestId('props')).toHaveTextContent('true');
        await type('se', document.querySelector('.custom-input') as HTMLInputElement);
        expect(onSearch).toHaveBeenLastCalledWith('se');
        expect(onChange).toHaveBeenLastCalledWith('se');
        expect(screen.getByTestId('input')).toHaveTextContent('se');
        expect(getList()).not.toBeNull();
        await click(getOptionByText('design'));
        expect(screen.getByTestId('selected')).toHaveTextContent('design');
        await click(screen.getByRole('button', { name: 'clear' }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('#prefix 与 #insetLabel 同时提供时只显示 prefix；空 #clearIcon 用默认图标', async () => {
        await renderAc(
            { showClear: true, defaultValue: 'x' },
            {
                prefix: () => <span>P</span>,
                insetLabel: () => <span>L</span>,
                clearIcon: () => [],
            }
        );
        expect(screen.getByText('P')).toBeInTheDocument();
        expect(screen.queryByText('L')).toBeNull();
        expect(getClearBtn().querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`)).not.toBeNull();
    });

    it('鼠标点选后焦点留在输入框，不发出 blur', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        await renderAc({ data: stringData, onBlur });
        await click(getInput());
        expect(getInput()).toHaveFocus();
        await click(getOptions()[1]);
        expect(getInput()).toHaveValue('ies');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('键盘选中后焦点留在输入框', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        await renderAc({ data: stringData, onBlur });
        await click(getInput());
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await settle();
        expect(getInput()).toHaveValue('semi');
        expect(getInput()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('键盘高亮项（aria-activedescendant 指向的项）aria-selected 为 true，没有 selected 类', async () => {
        await renderAc({ data: stringData, defaultOpen: true, defaultActiveFirstOption: true });
        const [first, second] = getOptions();
        expect(getInput()).toHaveAttribute('aria-activedescendant', first.id);
        expect(first).toHaveAttribute('aria-selected', 'true');
        expect(first).not.toHaveClass(`${optionCls}-selected`);
        expect(second).toHaveAttribute('aria-selected', 'false');
        await keyDown('ArrowDown');
        expect(first).toHaveAttribute('aria-selected', 'false');
        expect(second).toHaveAttribute('aria-selected', 'true');
    });

    it('原地修改 data 后候选项更新；内容相同的新数组不重算高亮', async () => {
        const data = ref<(string | { value: string; label: string })[]>(['semi', { value: 'b', label: 'B' }]);
        const Host = defineComponent({
            setup: () => () => <AutoComplete {...commonProps} aria-label="ac" data={data.value} defaultOpen />,
        });
        render(Host);
        await settle();
        data.value.push('design');
        await settle();
        expect(getOptionTexts()).toEqual(['semi', 'B', 'design']);
        (data.value[1] as { label: string }).label = 'Bee';
        await settle();
        expect(getOptionTexts()).toEqual(['semi', 'Bee', 'design']);

        // hovering highlights a row; an equal new array must not re-run the data change that resets the highlight
        await fireEvent.mouseEnter(getOptions()[2]);
        data.value = ['semi', { value: 'b', label: 'Bee' }, 'design'];
        await settle();
        expect(getFocusedOption()).toBe(getOptions()[2]);
    });

    it('maxHeight 字符串原样使用；dropdownStyle 与 maxHeight 合并且后者优先', async () => {
        await renderAc({ data: stringData, defaultOpen: true, maxHeight: '50vh', dropdownStyle: { color: 'red' } });
        expect(getList()?.style.maxHeight).toBe('50vh');
        expect(getList()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        document.body.innerHTML = '';
        await renderAc({ data: stringData, defaultOpen: true, maxHeight: 100, dropdownStyle: { maxHeight: '10px' } });
        expect(getList()?.style.maxHeight).toBe('10px');
    });

    it('KeepAlive 切走再切回后列表关闭，aria-expanded 为 false，只上报一次 false 且不发 blur', async () => {
        const shown = ref(true);
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const Other = defineComponent({ render: () => <div>other</div> });
        render(() => (
            <KeepAlive>
                {{
                    default: () => (shown.value ? <AutoComplete {...commonProps} aria-label="ac" data={stringData} defaultOpen onBlur={onBlur} onDropdownVisibleChange={onDropdownVisibleChange} /> : <Other />),
                }}
            </KeepAlive>
        ));
        await settle();
        expect(getList()).not.toBeNull();
        shown.value = false;
        await settle();
        await expectClosed();
        shown.value = true;
        await settle();
        expect(getInput()).toHaveAttribute('aria-expanded', 'false');
        expect(getList()).toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('change 只收到组件载荷；focus、blur 在焦点进出组件时各发一次；keydown 在组件处理之后发出', async () => {
        const onChange = vi.fn<(value: string | number) => void>();
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        const handledAtKeydown: boolean[] = [];
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>((event) => handledAtKeydown.push(event.defaultPrevented));
        await renderAc({
            data: stringData,
            defaultValue: 'semi',
            showClear: true,
            defaultOpen: true,
            onChange,
            onFocus,
            onBlur,
            onKeydown,
        });
        await type('x');
        expect(onChange.mock.calls).toEqual([['x']]);
        // the declared change event masks the input's native change bubbling to the root
        await fireEvent.change(getInput());
        expect(onChange.mock.calls).toEqual([['x']]);
        await click(getInput());
        await userEvent.tab();
        expect(getClearBtn()).toHaveFocus();
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await keyDown('ArrowDown');
        // the foundation had already claimed the arrow key when the event reached the listener
        expect(handledAtKeydown.at(-1)).toBe(true);
    });

    it('#trigger 内按钮的按键照常发出 keydown，但不打开面板', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderAc(
            { data: stringData, onKeydown },
            {
                trigger: () => (
                    <div>
                        <button type="button" aria-label="reset" />
                    </div>
                ),
            }
        );
        await keyDown('Enter', screen.getByRole('button', { name: 'reset' }));
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(getList()).toBeNull();
    });

    it('InputGroup 下发的 size 与 disabled 生效', async () => {
        render(InGroup);
        await settle();
        expect(getInput()).toBeDisabled();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-large`)).not.toBeNull();
    });
});

describe('AutoComplete 加载、禁用与键盘细节', () => {
    it('defaultActiveFirstOption 且没有选项时，combobox 不指向不存在的选项', async () => {
        await renderAc({ data: [], defaultActiveFirstOption: true, defaultOpen: true });
        expect(getInput()).not.toHaveAttribute('aria-activedescendant');
    });

    it('加载中方向键与 Enter 不作用于隐藏的旧列表', async () => {
        const onSelect = vi.fn<(value: Selected) => void>();
        const onChange = vi.fn<(value: string | number) => void>();
        await renderAc({ data: stringData, loading: true, defaultOpen: true, onSelect, onChange });
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(onSelect).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('');
    });

    it('禁用时 defaultOpen 不打开面板，也不发出 dropdownVisibleChange', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderAc({ data: stringData, disabled: true, defaultOpen: true, onDropdownVisibleChange });
        expect(getList()).toBeNull();
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
    });

    it('受控 modelValue 变回 undefined 时清空输入框，不用空对象调用 renderSelectedItem', async () => {
        const renderSelectedItem = vi.fn<(option: { value?: string }) => string>((option) => `${option.value}`);
        const view = await renderAc({ data: objectData, renderSelectedItem, modelValue: 'abc' });
        expect(getInput()).toHaveValue('abc');
        renderSelectedItem.mockClear();
        await view.rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('');
        expect(renderSelectedItem).not.toHaveBeenCalled();
    });

    it.each([true, false])('面板打开时受控 modelValue 变回 undefined，高亮按 defaultActiveFirstOption=%s 重设', async (defaultActiveFirstOption) => {
        const view = await renderAc({ data: objectData, defaultOpen: true, defaultActiveFirstOption, modelValue: 'vigo' });
        expect(getInput()).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[2].id);
        await view.rerender({ modelValue: undefined });
        expect(getInput().getAttribute('aria-activedescendant')).toBe(defaultActiveFirstOption ? screen.getAllByRole('option')[0].id : null);
    });

    it('面板里有可聚焦元素时，方向键仍只移动高亮，焦点留在输入框', async () => {
        await renderAc({ data: stringData, defaultOpen: true }, { item: ({ item }) => <button type="button">{String(item)}</button> });
        getInput().focus();
        await keyDown('ArrowDown');
        expect(getInput()).toHaveFocus();
        expect(getFocusedOption()).toHaveTextContent('semi');
        await keyDown('ArrowUp');
        expect(getInput()).toHaveFocus();
    });

    it('焦点在默认触发器的清除按钮上时，ArrowDown 不打开面板但照常发出 keydown', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderAc({ data: stringData, defaultValue: 'semi', showClear: true, onKeydown });
        await click(getInput());
        await keyDown('Escape');
        await userEvent.tab();
        expect(getClearBtn()).toHaveFocus();
        await keyDown('ArrowDown', getClearBtn());
        expect(getList()).toBeNull();
        expect(onKeydown).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'ArrowDown' }));
    });

    it('RTL 下默认弹出位置翻转为 bottomRight', async () => {
        render(() => <ConfigProvider direction="rtl">{() => <AutoComplete {...commonProps} data={stringData} defaultOpen />}</ConfigProvider>);
        await settle();
        expect(getPopupWrapper()).toHaveAttribute('x-placement', 'bottomRight');
    });
});

function getOptionByText(text: string) {
    return getOptions().find((option) => option.textContent === text) as HTMLElement;
}
