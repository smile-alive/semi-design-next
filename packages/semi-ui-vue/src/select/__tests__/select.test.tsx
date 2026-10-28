/** @jsxImportSource vue */
import { createApp, defineComponent, h, KeepAlive, reactive, ref, type Component, type StyleValue } from 'vue';
import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockResizeObserver, render } from '@test/utils/vue';
import Select, { SelectOptGroup, SelectOption, type SelectHandle, type SelectOptionProps } from '..';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Tag from '../../tag';
import Basic from './fixtures/basic.vue';
import Groups from './fixtures/groups.vue';
import Mixed from './fixtures/mixed.vue';
import Shorthand from './fixtures/shorthand.vue';
import TemplateOptions from './fixtures/template-options.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-select`;

const defaultList = [
    { value: 'abc', label: 'Abc' },
    { value: 'hotsoon', label: 'Hotsoon' },
    { value: 'pipixia', label: 'Pipixia' },
    { value: 'toutiao', label: 'TopBuzz' },
];

type SlotScope = {
    id?: string;
    class?: string;
    style?: StyleValue;
    selected?: boolean;
    onClick?: (event: MouseEvent) => void;
    onMouseenter?: (event: MouseEvent) => void;
    onClear?: (event: MouseEvent) => void;
    onClose?: (event: MouseEvent) => void;
    [key: string]: unknown;
};
type Slots = Record<string, (scope: SlotScope) => unknown>;
const settle = () => new Promise((resolve) => setTimeout(resolve));
const renderFixture = async (fixture: Component, props: Record<string, unknown> = {}, slots: Slots = {}) => {
    let handle: SelectHandle | undefined;
    const capture = (value: unknown) => {
        if (value) handle = (value as { select: SelectHandle }).select;
    };
    const Host = (attrs: Record<string, unknown>) => <ConfigProvider locale={en_US}>{() => h(fixture, { ...attrs, ref: capture }, slots as never)}</ConfigProvider>;
    const view = render(Host, { props });
    await settle();
    return {
        ...view,
        handle: () => handle as SelectHandle,
        unmount: () => view.unmount(),
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
};
const renderSelect = (props: Record<string, unknown> = {}, slots: Slots = {}) => renderFixture(Basic, props, slots);
// Testing Library re-inserts the mounted nodes, which drops the focus autofocus gave on mount
const mountInPlace = async (props: Record<string, unknown>) => {
    const container = document.body.appendChild(document.createElement('div'));
    const app = createApp(() => <ConfigProvider locale={en_US}>{() => <Basic {...props} />}</ConfigProvider>);
    app.mount(container);
    onTestFinished(() => {
        app.unmount();
        container.remove();
    });
    await settle();
};
const act = async (run: () => unknown) => {
    run();
    await settle();
};

const getTrigger = () => screen.getByRole('combobox');
const getOptionList = () => screen.queryByRole('listbox');
const getOptions = () => screen.queryAllByRole('option');
const getOptionTexts = () => getOptions().map((option) => option.textContent);
const getSelectionText = () => document.querySelector(`.${prefixCls}-selection-text`);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((tag) => tag.textContent);
const getTriggerInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls} input`) as HTMLInputElement;
const getClearIcon = () => document.querySelector(`.${BASE_CLASS_PREFIX}-icon-clear`);
const getPopover = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
const getOptionByText = (text: string) => getOptions().find((option) => option.textContent === text);
const getFocusedOption = () => document.querySelector(`.${prefixCls}-option-focused`);
const getRoot = () => document.querySelector(`.${prefixCls}`) as HTMLElement;
const search = async (value: string, input = getTriggerInput()) => {
    await fireEvent.update(input, value);
    await settle();
};
const keyDown = async (key: string, init: KeyboardEventInit = {}, target: Element = getTrigger()) => {
    await fireEvent.keyDown(target, { key, ...init });
    await settle();
};
const click = async (element: Element | null) => {
    await userEvent.click(element as Element);
    await settle();
};
const expectClosed = () => waitFor(() => expect(getOptionList()).toBeNull());

describe('Select', async () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        vi.unstubAllGlobals();
    });

    it('自定义 class 与 style', async () => {
        await renderSelect({ class: 'test', style: { color: 'red' } });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 placeholder', async () => {
        await renderSelect({ placeholder: 'semi' });
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^semi$/);
    });

    it('带 validateStatus', async () => {
        const { rerender } = await renderSelect({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-error`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-warning`);
        await rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-error`);
        await rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-warning`);
    });

    it('不同尺寸', async () => {
        const { rerender } = await renderSelect({});
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-large`);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-small`);
        await rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-large`);
        await rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
    });

    it('自定义 dropdownClassName 与 dropdownStyle', async () => {
        await renderSelect({ dropdownClassName: 'ddc', dropdownStyle: { color: 'red' }, defaultOpen: true });
        const dropdown = document.querySelector('.ddc');
        expect(dropdown).not.toBeNull();
        expect(dropdown).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(dropdown).toContainElement(getOptionList());
    });

    it('不同位置', async () => {
        await renderSelect({ position: 'top', defaultOpen: true });
        expect(getPopover()).toHaveAttribute('x-placement', 'top');
    });

    it('defaultValue（不在 optionList 中）', async () => {
        const { unmount } = await renderSelect({ defaultValue: 'semi' });
        expect(getSelectionText()).toHaveTextContent(/^semi$/);
        unmount();
        await renderSelect({ multiple: true, defaultValue: ['semi', 'ies'] });
        expect(getTagTexts()).toEqual(['semi', 'ies']);
    });

    it('defaultValue（可在 optionList 中匹配）', async () => {
        const { unmount } = await renderSelect({ defaultValue: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmount();
        await renderSelect({ defaultValue: ['abc', 'hotsoon'], multiple: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('showClear', async () => {
        const { unmount } = await renderSelect({ defaultValue: 'semi', showClear: true });
        expect(getClearIcon()).not.toBeNull();
        unmount();

        const { unmount: unmountEmpty } = await renderSelect({ showClear: true });
        await userEvent.hover(getTrigger());
        expect(getClearIcon()).toBeNull();
        unmountEmpty();

        await renderSelect({ showClear: false, defaultValue: 'semi' });
        await userEvent.hover(getTrigger());
        expect(getClearIcon()).toBeNull();
    });

    it('showArrow = false', async () => {
        await renderSelect({ defaultValue: 'semi', showArrow: false });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).toBeNull();
        expect(getTrigger()).toHaveClass(`${prefixCls}-no-arrow`);
    });

    it('#prefix、#suffix 与 #insetLabel 插槽', async () => {
        const { unmount } = await renderSelect(
            {},
            {
                prefix: () => <div class="prefix">prefix content</div>,
                suffix: () => <div class="suffix">suffix content</div>,
            }
        );
        expect(screen.getByText('prefix content')).toHaveClass('prefix');
        expect(screen.getByText('prefix content').parentElement).toHaveClass(`${prefixCls}-prefix`);
        expect(screen.getByText('suffix content')).toHaveClass('suffix');
        expect(screen.getByText('suffix content').parentElement).toHaveClass(`${prefixCls}-suffix`);
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-prefix`, `${prefixCls}-with-suffix`);
        unmount();

        await renderSelect({}, { insetLabel: () => 'semi' });
        expect(screen.getByText('semi')).toHaveClass(`${prefixCls}-inset-label`, `${prefixCls}-prefix-text`);
    });

    it('defaultOpen', async () => {
        await renderSelect({ defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('dropdownMatchSelectWidth = true', async () => {
        await renderSelect({ defaultOpen: true, style: { width: '90px' }, defaultValue: 'abc' });
        expect(getPopover().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth，width 为字符串', async () => {
        await renderSelect({ defaultOpen: true, style: 'width: 90px', defaultValue: 'abc' });
        expect(getPopover().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth = false', async () => {
        await renderSelect({
            defaultOpen: true,
            style: { width: '90px' },
            defaultValue: 'abc',
            dropdownMatchSelectWidth: false,
        });
        expect(getPopover().style.minWidth).toBe('');
    });

    it('通过 optionList 传入选项', async () => {
        await renderSelect({ defaultOpen: true, optionList: defaultList, list: [] });
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('通过默认插槽传入选项', async () => {
        const list = [...defaultList, { value: 'semi', label: 'SemiDesign' }];
        await renderSelect({ defaultOpen: true, list });
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz', 'SemiDesign']);
    });

    it('multiple 为 true 时可以选择多个选项', async () => {
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], defaultOpen: true });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await userEvent.click(getOptions()[3]);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'TopBuzz']);
        expect(getOptionList()).not.toBeNull();
    });

    it('multiple 配合 maxTagCount', async () => {
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 2, defaultOpen: true });
        await userEvent.click(getOptions()[3]);
        const tagGroup = document.querySelector(`.${BASE_CLASS_PREFIX}-tag-group`) as HTMLElement;
        expect(tagGroup.children).toHaveLength(3);
        expect(tagGroup.children[2]).toHaveTextContent(/^\+1$/);
    });

    it('multiple 配合 max，超过上限时发出 exceed', async () => {
        const onExceed = vi.fn<(option: SelectOptionProps) => void>();
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], max: 2, onExceed, defaultOpen: true });
        await userEvent.click(getOptions()[3]);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'toutiao', label: 'TopBuzz' }));
    });

    it('#innerTopSlot', async () => {
        await renderSelect({ defaultOpen: true }, { innerTopSlot: () => <div class="inner-slot">inner</div> });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-top-slot`);
        expect(getOptionList()?.firstElementChild).toBe(slot.parentElement);
    });

    it('#outerTopSlot', async () => {
        await renderSelect({ defaultOpen: true }, { outerTopSlot: () => <div class="outer-slot">outer</div> });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-top-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('#innerBottomSlot', async () => {
        await renderSelect({ defaultOpen: true }, { innerBottomSlot: () => <div class="inner-slot">inner</div> });
        const slot = screen.getByText('inner');
        expect(slot).toHaveClass('inner-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-inner-bottom-slot`);
        expect(getOptionList()?.lastElementChild).toBe(slot.parentElement);
    });

    it('#outerBottomSlot', async () => {
        await renderSelect({ defaultOpen: true }, { outerBottomSlot: () => <div class="outer-slot">outer</div> });
        const slot = screen.getByText('outer');
        expect(slot).toHaveClass('outer-slot');
        expect(slot.parentElement).toHaveClass(`${prefixCls}-option-list-outer-bottom-slot`);
        expect(getOptionList()).not.toContainElement(slot);
    });

    it('选项的 class、style、disabled 与 show-tick', async () => {
        await renderSelect(
            { defaultOpen: true },
            {
                default: () => (
                    <>
                        <SelectOption class="optCls" style={{ color: 'red' }} label="Abc" value="abc">
                            {() => 'Abc'}
                        </SelectOption>
                        <SelectOption label="Vigo" value="vigo" disabled class="disabled-opt">
                            {() => 'Vigo'}
                        </SelectOption>
                        <SelectOption label="NoTick" value="noTick" show-tick={false}>
                            {() => 'NoTick'}
                        </SelectOption>
                    </>
                ),
            }
        );
        const [first, disabled, noTick] = getOptions();
        expect(first).toHaveClass('optCls');
        expect(first).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(first.querySelector(`.${prefixCls}-option-icon`)).not.toBeNull();
        expect(disabled).toHaveClass('disabled-opt', `${prefixCls}-option-disabled`);
        expect(disabled).toHaveAttribute('aria-disabled', 'true');
        expect(noTick).toHaveTextContent(/^NoTick$/);
        expect(noTick.querySelector(`.${prefixCls}-option-icon`)).toBeNull();
    });

    it('loading', async () => {
        await renderSelect({ defaultOpen: true, loading: true });
        expect(getOptionList()?.querySelector(`.${prefixCls}-loading-wrapper`)).not.toBeNull();
        expect(getOptions()).toHaveLength(0);
    });

    it('spacing', async () => {
        await renderSelect({ spacing: 20, defaultOpen: true });
        // jsdom puts the trigger's box at 0, so a bottomLeft popup's top is the spacing
        expect(getPopover().style.top).toBe('20px');
    });

    it('点击选择器时打开选项列表', async () => {
        await renderSelect({});
        expect(getOptionList()).toBeNull();
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('disabled 为 true 时禁用组件', async () => {
        await renderSelect({ disabled: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-disabled`);
        await userEvent.click(getTrigger());
        expect(getOptionList()).toBeNull();
    });

    it('dropdownVisibleChange 与 clickToHide', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderSelect({ onDropdownVisibleChange, clickToHide: true });
        await userEvent.click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(true);
        await userEvent.click(getTrigger());
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenCalledTimes(2);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('filter = true', async () => {
        await renderSelect({ filter: true });
        await userEvent.click(getTrigger());
        await search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('搜索结果延后渲染，aria-activedescendant 指向已渲染的选项', async () => {
        await renderSelect({ filter: true });
        await click(getTrigger());
        await search('abc');
        await waitFor(() => expect(getOptionTexts()).toEqual(['Abc']));
        const activeId = getTrigger().getAttribute('aria-activedescendant') as string;
        expect(activeId).toBeTruthy();
        expect(document.getElementById(activeId)).toBe(getOptionByText('Abc'));
        await search('zzz');
        await waitFor(() => expect(getOptions()).toHaveLength(0));
        expect(screen.getByText(en_US.Select.emptyText)).toBeInTheDocument();
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('filter = true，label 包含正则特殊字符时首次按 key 定位', async () => {
        await renderSelect({ filter: true, optionList: [{ label: 'label++', value: '' }] });
        await click(getTrigger());
        await search('+');
        expect(getOptionTexts()).toEqual(['label++']);
    });

    it('filter = 自定义函数', async () => {
        const customFilter = (_input: string, option: SelectOptionProps) => option.label === 'Hotsoon';
        await renderSelect({ filter: customFilter });
        await click(getTrigger());
        await search('tik');
        expect(getOptionTexts()).toEqual(['Hotsoon']);
    });

    it('search 事件', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        await renderSelect({ onSearch, filter: true });
        await click(getTrigger());
        await search('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi', expect.anything());
    });

    it('#emptyContent 插槽', async () => {
        await renderSelect({ filter: true }, { emptyContent: () => 'no data' });
        await click(getTrigger());
        await search('semi');
        expect(document.querySelector(`.${prefixCls}-option-empty`)).toHaveTextContent(/^no data$/);
        expect(getOptions()).toHaveLength(0);
    });

    it('选项的 value 与 label', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ optionList: [{ label: 'semi', value: 'bytedance' }], defaultOpen: true, onChange });
        expect(getOptionTexts()).toEqual(['semi']);
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('bytedance');
        expect(getSelectionText()).toHaveTextContent(/^semi$/);
    });

    it('选项的 value 为数字', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ optionList: [{ label: 'semi', value: 0 }], defaultOpen: true, onChange });
        expect(getOptionTexts()).toEqual(['semi']);
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('#selectedItem，单选', async () => {
        const selectedItem = vi.fn<(scope: Record<string, unknown>) => string>(({ option }) => `${(option as SelectOptionProps).value}-${(option as SelectOptionProps).label}`);
        await renderSelect({ defaultValue: 'abc' }, { selectedItem });
        expect(getSelectionText()).toHaveTextContent(/^abc-Abc$/);
        expect(selectedItem).toHaveBeenCalledWith(expect.objectContaining({ option: expect.objectContaining({ value: 'abc', label: 'Abc' }) }));
    });

    it('#selectedItem，单选且 value 为 0，不在选项中', async () => {
        const selectedItem = vi.fn<(scope: Record<string, unknown>) => string>(({ option }) => `${(option as SelectOptionProps).label}1`);
        await renderSelect({ modelValue: 0 }, { selectedItem });
        expect(getSelectionText()).toHaveTextContent(/^01$/);
        expect(selectedItem).toHaveBeenCalledWith(expect.objectContaining({ option: expect.objectContaining({ value: 0, label: 0 }) }));
    });

    it('#selectedItem，多选时渲染在标签里', async () => {
        await renderSelect(
            {
                optionList: [
                    { value: 'abc', label: 'Abc', extra: 'a1' },
                    { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
                    { value: 'pipixia', label: 'Pipixia', extra: 'c3' },
                    { value: 'toutiao', label: 'TopBuzz', extra: 'd4' },
                ],
                defaultValue: ['abc', 'hotsoon'],
                multiple: true,
            },
            {
                selectedItem: ({ option }) => `${(option as SelectOptionProps).value}-${(option as SelectOptionProps).extra}`,
            }
        );
        expect(getTagTexts()).toEqual(['abc-a1', 'hotsoon-b2']);
    });

    it('#tag，多选时替换整个标签', async () => {
        await renderSelect(
            {
                optionList: [
                    { value: 'abc', label: 'Abc', extra: 'a1' },
                    { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
                    { value: 'pipixia', label: 'Pipixia', extra: 'c3' },
                    { value: 'toutiao', label: 'TopBuzz', extra: 'd4' },
                ],
                defaultValue: ['abc', 'hotsoon'],
                multiple: true,
            },
            {
                tag: ({ option, index }) => <div class={`item-${index as number}`}>{`${(option as SelectOptionProps).value}-${(option as SelectOptionProps).extra}`}</div>,
            }
        );
        const items = (document.querySelector(`.${prefixCls}-content-wrapper`) as HTMLElement).children;
        expect(items[0]).toHaveClass('item-0');
        expect(items[0]).toHaveTextContent(/^abc-a1$/);
        expect(items[1]).toHaveClass('item-1');
        expect(items[1]).toHaveTextContent(/^hotsoon-b2$/);
        expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('defaultActiveFirstOption', async () => {
        await renderSelect({ defaultActiveFirstOption: true, defaultOpen: true });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
    });

    it('select 事件', async () => {
        const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({ defaultOpen: true, onSelect });
        await click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('abc', { value: 'abc', label: 'Abc' });
    });

    it('deselect 事件', async () => {
        const onDeselect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({ multiple: true, defaultOpen: true, defaultValue: ['abc', 'hotsoon'], onDeselect });
        await click(getOptions()[1]);
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(onDeselect).toHaveBeenCalledWith('hotsoon', { value: 'hotsoon', label: 'Hotsoon' });
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('change 事件（单选）', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, onChange });
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('change 事件（多选）', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, multiple: true, onChange });
        await click(getOptions()[0]);
        await click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(1, ['abc']);
        expect(onChange).toHaveBeenNthCalledWith(2, ['abc', 'hotsoon']);
    });

    it('change 配合 changeWithObject（单选）', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, changeWithObject: true, onChange });
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ value: 'abc', label: 'Abc' });
    });

    it('单根 SFC 简写 changeWithObject 并从外层透传 class 与 onChange', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { container } = render(Shorthand, { attrs: { class: 'outer', onChange } });
        expect(container.querySelector(`.${prefixCls}.outer`)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('combobox', { name: '水果' }));
        await click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'b', label: 'Banana' });
    });

    it('change 配合 changeWithObject（多选）', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, changeWithObject: true, multiple: true, onChange });
        await click(getOptions()[0]);
        await click(getOptions()[1]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(1, [{ value: 'abc', label: 'Abc' }]);
        expect(onChange).toHaveBeenNthCalledWith(2, [
            { value: 'abc', label: 'Abc' },
            { value: 'hotsoon', label: 'Hotsoon' },
        ]);
    });

    it('modelValue 受控', async () => {
        const { rerender, unmount } = await renderSelect({ modelValue: 'abc' });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await rerender({ modelValue: 'hotsoon' });
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
        await rerender({ modelValue: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
        unmount();

        const onChange = vi.fn<(value: unknown) => void>();
        const { unmount: unmountSingle } = await renderSelect({
            modelValue: 'abc',
            optionList: defaultList,
            defaultOpen: true,
            onChange,
        });
        await click(getOptions()[1]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('hotsoon'));
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        unmountSingle();

        const onMultipleChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            modelValue: '',
            optionList: defaultList,
            defaultOpen: true,
            multiple: true,
            filter: true,
            onChange: onMultipleChange,
            showClear: true,
            onClear: vi.fn<() => void>(),
        });
        await click(getOptions()[1]);
        expect(onMultipleChange).toHaveBeenCalledWith(['hotsoon']);
    });

    it('focus 与 blur 事件', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        const onFocus = vi.fn<(event: Event) => void>();
        const { handle } = await renderSelect({ onBlur, onFocus });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);

        await act(() => handle().close());
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        expect(getTrigger()).toHaveFocus();
    });

    it('autofocus，filter = false', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        const onFocus = vi.fn<(event: Event) => void>();
        await mountInPlace({ onBlur, onFocus, autofocus: true });
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).toHaveFocus();
    });

    it('autofocus，filter = true', async () => {
        await renderSelect({ autofocus: true, filter: true });
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
        expect(getTriggerInput()).toHaveFocus();
    });

    it('autofocus 时的 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await mountInPlace({ autofocus: true, onBlur });
        expect(getTrigger()).toHaveFocus();
        await click(document.body);
        expect(getTrigger()).not.toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('virtualize', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        await renderSelect({ virtualize: { itemSize: 36 }, defaultOpen: true, optionList, onChange });
        expect(getOptions().length).toBeLessThan(optionList.length);
        await click(screen.getByText('option-0'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('SelectOptGroup', async () => {
        await renderFixture(Groups, { defaultOpen: true });
        const groups = document.querySelectorAll(`.${prefixCls}-group`);
        expect(Array.from(groups).map((group) => group.textContent)).toEqual(['Group1', 'Group2']);
        expect(getOptionTexts()).toEqual(['a-1', 'a-2', 'b-1', 'b-2', 'c-1']);
    });

    it('空选项', async () => {
        const props = { defaultOpen: true, optionList: [], list: [] };
        const { unmount } = await renderSelect(props, { emptyContent: () => 'empty' });
        const empty = document.querySelectorAll(`.${prefixCls}-option.${prefixCls}-option-empty`);
        expect(empty).toHaveLength(1);
        expect(empty[0]).toHaveTextContent(/^empty$/);
        unmount();
        await renderSelect(props, { emptyContent: () => [] });
        expect(document.querySelector(`.${prefixCls}-option`)).toBeNull();
    });

    it('#optionItem 的 onClick 与 onMouseenter', async () => {
        const onMouseEnter = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        await renderSelect(
            {
                defaultOpen: true,
                optionList: [
                    { value: 'abc', label: '抖音' },
                    { value: 'jianying', label: '剪映' },
                ],
            },
            {
                optionItem: ({ label, style }) => (
                    <div class="custom-option" style={style} onClick={onClick} onMouseenter={onMouseEnter}>
                        <div class="option-right">{label as string}</div>
                    </div>
                ),
            }
        );
        const options = document.querySelectorAll('.custom-option');
        expect(options).toHaveLength(2);
        await fireEvent.click(options[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        await fireEvent.mouseEnter(options[1]);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('#trigger 插槽', async () => {
        await renderSelect({}, { trigger: () => <div class="custom-trigger">trigger</div> });
        const trigger = screen.getByText('trigger');
        expect(trigger).toHaveClass('custom-trigger');
        await click(trigger);
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('键盘按键', async () => {
        const { unmount } = await renderSelect({ defaultOpen: true, optionList: defaultList });
        await keyDown('ArrowDown');
        expect(getOptions()[1]).toHaveClass(`${prefixCls}-option-focused`);
        await keyDown('ArrowUp');
        await keyDown('ArrowUp');
        expect(getOptions()[defaultList.length - 1]).toHaveClass(`${prefixCls}-option-focused`);
        await keyDown('Escape');
        await expectClosed();
        await click(getTrigger());
        await keyDown('ArrowDown');
        await keyDown('Enter');
        expect(getSelectionText()).toHaveTextContent(defaultList[0].label);
        unmount();

        await renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon', disabled: true },
                { value: 'pipixia', label: 'Pipixia' },
            ],
            defaultValue: ['hotsoon', 'abc'],
            multiple: true,
        });
        await keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Hotsoon']);
    });

    it('allowCreate', async () => {
        await renderSelect({ multiple: true, allowCreate: true, filter: true, optionList: [], list: [] });
        await click(getTrigger());
        await search('1');
        await click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['1']);
        await keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual([]);
    });

    it('根元素上的原生 mouseenter 与 mouseleave', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        await renderSelect({ onMouseenter, onMouseleave });
        await userEvent.hover(getTrigger());
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        await userEvent.unhover(getTrigger());
        expect(onMouseleave).toHaveBeenCalledTimes(1);
    });

    it('handle 方法', async () => {
        const { handle, unmount } = await renderSelect({ filter: true, multiple: true, optionList: defaultList });
        await act(() => handle().open());
        expect(getOptionList()).not.toBeNull();

        await act(() => handle().close());
        await expectClosed();

        await act(() => handle().selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);

        await act(() => handle().deselectAll());
        expect(getTagTexts()).toEqual([]);

        await act(() => handle().focus());
        expect(document.activeElement?.tagName).toEqual('INPUT');
        unmount();

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onChange = vi.fn<(value: unknown) => void>();
        const single = await renderSelect({ filter: true, optionList: defaultList, onChange });
        await act(() => single.handle().selectAll());
        expect(warn).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectionText()).toHaveTextContent(/^$/);
        warn.mockRestore();
    });

    it('非受控时选择后 optionList 更新', async () => {
        const newList = [
            { value: 'pipixia', label: 'Pipixia' },
            { value: 'toutiao', label: 'TopBuzz' },
        ];
        const props = {
            defaultActiveFirstOption: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            defaultOpen: true,
            multiple: true,
            filter: true,
        };
        const { rerender, unmount } = await renderSelect(props);
        await click(getOptions()[0]);
        await click(getOptions()[1]);
        await rerender({ ...props, optionList: newList });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        unmount();

        const singleProps = {
            defaultActiveFirstOption: true,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            defaultOpen: true,
        };
        const { rerender: rerenderSingle } = await renderSelect(singleProps);
        await click(getOptions()[0]);
        await rerenderSingle({ ...singleProps, optionList: newList });
        expect(getSelectionText()).toHaveTextContent(/^abc$/);
    });

    it('受控多选时点击标签关闭', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const onDeselect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            multiple: true,
            modelValue: ['abc', 'hotsoon'],
            onChange,
            onDeselect,
        });
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
        expect(onChange).toHaveBeenCalledWith(['hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('autoClearSearchValue', async () => {
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        await renderSelect({ multiple: true, optionList, defaultOpen: true, filter: true });
        await click(getTrigger());
        await search('option');
        await click(getOptions()[0]);
        expect(getTriggerInput()).toHaveValue('');
    });

    it('autoClearSearchValue = false', async () => {
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        await renderSelect({
            multiple: true,
            optionList,
            defaultOpen: true,
            autoClearSearchValue: false,
            filter: true,
        });
        await click(getTrigger());
        await search('option');
        await click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['option-0']);
        expect(getTriggerInput()).toHaveValue('option');
    });

    it('searchPosition 为 dropdown', async () => {
        await renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`);
        expect(input).not.toBeNull();
        expect(getTrigger()).not.toContainElement(input);
        expect(getTrigger().querySelector('input')).toBeNull();
        await search('abc', input as HTMLInputElement);
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('searchPosition 为 dropdown 时 inputProps 的 onKeydown 与 Select 的方向键导航都生效', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderSelect({ filter: true, searchPosition: 'dropdown', defaultOpen: true, inputProps: { onKeydown } });
        const input = document.querySelector<HTMLInputElement>(`.${prefixCls}-dropdown-search-wrapper input`);
        const before = getFocusedOption()?.textContent;
        await act(() => input?.focus());
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onKeydown.mock.calls[0][0].key).toBe('ArrowDown');
        expect(getFocusedOption()?.textContent).not.toBe(before);
    });

    it('create 事件', async () => {
        const onCreate = vi.fn<(option: SelectOptionProps) => void>();
        await renderSelect({ allowCreate: true, filter: true, onCreate, defaultOpen: true });
        await search('newOption');
        const [createOption] = getOptions();
        expect(createOption).toHaveTextContent('newOption');
        expect(createOption.querySelector(`.${prefixCls}-create-tips`)).not.toBeNull();
        await click(createOption);
        expect(onCreate).toHaveBeenCalledTimes(1);
        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ value: 'newOption', label: 'newOption' }));
    });

    it('modelValue 为 null/undefined 的边界情况', async () => {
        const { rerender } = await renderSelect({ modelValue: null });
        expect(getSelectionText()).toHaveTextContent(/^$/);
        await rerender({ modelValue: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    it('多选的 modelValue 包含 null/undefined 项', async () => {
        await renderSelect({ multiple: true, modelValue: ['abc', null, undefined, 'hotsoon'] });
        const tags = getTagTexts();
        expect(tags.length).toBeGreaterThanOrEqual(2);
        expect(tags).toEqual(expect.arrayContaining(['Abc', 'Hotsoon']));
    });

    it('ARIA 属性 - aria-labelledby', async () => {
        await renderSelect({ 'aria-labelledby': 'label-id' });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('ARIA 属性 - aria-describedby', async () => {
        await renderSelect({ 'aria-describedby': 'description-id' });
        expect(getTrigger()).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('ARIA 属性 - aria-required', async () => {
        await renderSelect({ 'aria-required': true });
        expect(getTrigger()).toHaveAttribute('aria-required', 'true');
    });

    it('ARIA 属性 - aria-invalid', async () => {
        await renderSelect({ 'aria-invalid': true });
        expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
    });

    it('borderless', async () => {
        await renderSelect({ borderless: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-borderless`);
    });

    it('clear 事件', async () => {
        const onClear = vi.fn<() => void>();
        await renderSelect({ defaultValue: 'abc', showClear: true, onClear });
        await userEvent.hover(getTrigger());
        await click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(getOptionList()).toBeNull();
    });

    it('远程模式', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        await renderSelect({ filter: true, remote: true, onSearch });
        await click(getTrigger());
        await search('test');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('test', expect.anything());
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('listScroll 事件', async () => {
        const onListScroll = vi.fn<(event: Event) => void>();
        await renderSelect({ defaultOpen: true, onListScroll });
        await fireEvent.scroll(getOptionList() as HTMLElement);
        expect(onListScroll).toHaveBeenCalledTimes(1);
    });

    it('未声明的 open 属性不打开下拉', async () => {
        await renderSelect({ open: true });
        expect(getOptionList()).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('#createItem 插槽', async () => {
        await renderSelect({ allowCreate: true, filter: true, defaultOpen: true }, { createItem: ({ inputValue }) => <div class="custom-create">{`Create: ${inputValue as string}`}</div> });
        await search('newItem');
        expect(document.querySelector('.custom-create')).toHaveTextContent(/^Create: newItem$/);
    });

    it('filter 时的 focus 与 blur', async () => {
        const onFocus = vi.fn<(event: Event) => void>();
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ filter: true, onFocus, onBlur });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTriggerInput()).toHaveFocus();
        await click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('外部点击关闭 defaultOpen 的面板时不把焦点移到触发器', async () => {
        const onFocus = vi.fn<(event: Event) => void>();
        const onBlur = vi.fn<(event: Event) => void>();
        render(() => (
            <div>
                <Basic defaultOpen onBlur={onBlur} onFocus={onFocus} />
                <button type="button">outside</button>
            </div>
        ));
        await settle();
        await click(screen.getByRole('button', { name: 'outside' }));
        await expectClosed();
        expect(onFocus).not.toHaveBeenCalled();
        expect(onBlur).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
    });

    it('禁用的选项不能被选中', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'abc', label: 'Abc', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
            onChange,
        });
        await click(getOptions()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('含禁用选项时的键盘导航', async () => {
        await renderSelect({
            defaultOpen: true,
            defaultActiveFirstOption: false,
            optionList: [
                { value: 'abc', label: 'Abc' },
                { value: 'disabled1', label: 'Disabled1', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon' },
            ],
        });
        expect(getFocusedOption()).toBeNull();
        await keyDown('ArrowDown');
        expect(getOptions()[0]).toHaveClass(`${prefixCls}-option-focused`);
        await keyDown('ArrowDown');
        expect(getOptions()[2]).toHaveClass(`${prefixCls}-option-focused`);
    });

    it('handle 的 clearInput', async () => {
        const { handle } = await renderSelect({ filter: true, defaultOpen: true });
        await search('test');
        expect(getTriggerInput()).toHaveValue('test');
        await act(() => handle().clearInput());
        expect(getTriggerInput()).toHaveValue('');
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('多选配合 changeWithObject 并更新 modelValue', async () => {
        const props = {
            multiple: true,
            changeWithObject: true,
            optionList: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
            ],
            modelValue: [{ value: 'abc', label: 'Abc', extra: 'a1' }],
        };
        const { rerender } = await renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc']);
        await rerender({
            ...props,
            modelValue: [
                { value: 'abc', label: 'Abc', extra: 'a1' },
                { value: 'hotsoon', label: 'Hotsoon', extra: 'b2' },
            ],
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('没有聚焦选项时按 Enter', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, defaultActiveFirstOption: false, onChange });
        await keyDown('Enter');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('filter 单选时按 Escape', async () => {
        await renderSelect({ filter: true, defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        await keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('多选全部为禁用项时按 Backspace', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc'],
            optionList: [{ value: 'abc', label: 'Abc', disabled: true }],
            defaultOpen: true,
        });
        await keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('virtualize 下选中项滚动', async () => {
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        await renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 50, optionList });
        await click(getTrigger());
        // only a window of rows is rendered; scrolling to the selected row needs layout, which jsdom does not have
        expect(getOptionList()).not.toBeNull();
        expect(getOptions().length).toBeGreaterThan(0);
        expect(getOptions().length).toBeLessThan(optionList.length);
        expect(getSelectionText()).toHaveTextContent(/^option-50$/);
    });

    it('dropdownMatchSelectWidth 配合百分比宽度', async () => {
        await renderSelect({ defaultOpen: true, style: { width: '50%' }, dropdownMatchSelectWidth: true });
        expect(getOptionList()).not.toBeNull();
        expect(getPopover().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('选项属于分组时按分组标题过滤', async () => {
        await renderFixture(Groups, { filter: true, defaultOpen: true });
        await search('Group1');
        expect(getOptionTexts()).toEqual(['a-1', 'a-2']);
    });

    it('allowCreate 时匹配已有选项', async () => {
        await renderSelect({
            allowCreate: true,
            filter: true,
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'abc' }],
        });
        await search('abc');
        expect(getOptionTexts()).toEqual(['abc']);
        expect(document.querySelector(`.${prefixCls}-create-tips`)).toBeNull();
    });

    it('loading 时忽略键盘', async () => {
        const { rerender } = await renderSelect({ loading: true, defaultOpen: true });
        await keyDown('ArrowDown');
        expect(document.querySelector(`.${prefixCls}-loading-wrapper`)).not.toBeNull();
        await keyDown('Escape');
        expect(getOptionList()).not.toBeNull();
        await rerender({ loading: false });
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getOptions()[0].id);
    });

    it('面板关闭后的 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ onBlur });
        await click(getTrigger());
        await keyDown('Escape');
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('selectAll 配合 changeWithObject', async () => {
        const onChange = vi.fn<(value: SelectOptionProps[]) => void>();
        const { handle } = await renderSelect({
            multiple: true,
            changeWithObject: true,
            optionList: defaultList,
            onChange,
        });
        await act(() => handle().selectAll());
        expect(onChange).toHaveBeenCalledTimes(1);
        const [value] = onChange.mock.calls[0];
        expect(value).toHaveLength(4);
        expect(value.map((item) => item.value)).toEqual(['abc', 'hotsoon', 'pipixia', 'toutiao']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('#arrowIcon 与 #clearIcon 插槽', async () => {
        await renderSelect(
            { showClear: true, defaultValue: 'abc' },
            {
                arrowIcon: () => <span class="custom-arrow">v</span>,
                clearIcon: () => <span class="custom-clear">x</span>,
            }
        );
        expect(document.querySelector('.custom-arrow')).not.toBeNull();
        expect(screen.getByRole('button', { name: en_US.Select.clear })).toContainElement(document.querySelector('.custom-clear'));
    });

    it('#insetLabel 配合 insetLabelId', async () => {
        await renderSelect({ insetLabelId: 'test-label-id' }, { insetLabel: () => 'Label' });
        const label = document.getElementById('test-label-id');
        expect(label).not.toBeNull();
        expect(label).toHaveTextContent('Label');
    });

    it('autoClearSearchValue 为 false 时多选受控', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            multiple: true,
            filter: true,
            autoClearSearchValue: false,
            modelValue: [],
            onChange,
            defaultOpen: true,
        });
        await search('abc');
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith(['abc']);
        expect(getTriggerInput()).toHaveValue('abc');
    });

    it('filter 时 optionList 更新', async () => {
        const props = { filter: true, defaultOpen: true, optionList: defaultList };
        const { rerender } = await renderSelect(props);
        await search('abc');
        await rerender({
            ...props,
            optionList: [
                { value: 'new1', label: 'New1' },
                { value: 'new2', label: 'New2' },
            ],
        });
        expect(getOptionList()).not.toBeNull();
        expect(getOptionTexts()).not.toContain('Abc');
    });

    it('非受控时删除标签', async () => {
        const onDeselect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], onDeselect });
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Hotsoon']);
    });

    it('clickToHide 下在聚焦的触发器上按 Enter，只打开一次下拉', async () => {
        await renderSelect({ clickToHide: true });
        getTrigger().focus();
        // the keypress that follows the keydown must not toggle the dropdown shut again
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(getOptionList()).not.toBeNull();
    });

    it('clickToHide 为 false 时的行为', async () => {
        await renderSelect({ clickToHide: false, filter: true });
        await click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        await click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(getTriggerInput()).toHaveFocus();
    });

    it('下拉中的 Tab 键导航', async () => {
        await renderSelect(
            { defaultOpen: true },
            {
                innerBottomSlot: () => (
                    <button class="slot-button" type="button">
                        Click me
                    </button>
                ),
            }
        );
        await keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Click me' })).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('handle 的 deselectAll', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await act(() => handle().deselectAll());
        expect(getTagTexts()).toEqual([]);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('选项带额外属性', async () => {
        await renderSelect({
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'Abc', extra: 'extra1', customProp: 'custom' }],
        });
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('选项列表变化后按 defaultActiveFirstOption 重置高亮', async () => {
        const props = { defaultOpen: true, defaultActiveFirstOption: true, optionList: defaultList };
        const { rerender } = await renderSelect(props);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
        await rerender({
            ...props,
            optionList: [
                { value: 'new1', label: 'New1' },
                { value: 'new2', label: 'New2' },
            ],
        });
        expect(getOptionTexts()).toEqual(['New1', 'New2']);
        expect(getFocusedOption()).toHaveTextContent(/^New1$/);
    });

    it('handle 的 deselectAll 清空单选', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({ defaultValue: 'abc', optionList: defaultList, onChange });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await act(() => handle().deselectAll());
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('filter 时点击清除', async () => {
        const onClear = vi.fn<() => void>();
        await renderSelect({ filter: true, showClear: true, defaultValue: 'abc', onClear });
        await click(getTrigger());
        await search('test');
        await userEvent.hover(getTrigger());
        await click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTriggerInput()).toHaveValue('');
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    it('allowCreate 时选择新建项', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ allowCreate: true, filter: true, defaultOpen: true, onChange });
        await search('newItem');
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith('newItem');
        expect(getSelectionText()).toHaveTextContent(/^newItem$/);
    });

    it('多选含多个禁用项时按 Backspace', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: [
                { value: 'abc', label: 'Abc', disabled: true },
                { value: 'hotsoon', label: 'Hotsoon', disabled: true },
                { value: 'pipixia', label: 'Pipixia' },
            ],
            defaultOpen: true,
        });
        await keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('在禁用选项上按 Enter', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            defaultOpen: true,
            defaultActiveFirstOption: true,
            optionList: [{ value: 'abc', label: 'Abc', disabled: true }],
            onChange,
        });
        // the default highlight skips a disabled option; hovering still lands on it
        await fireEvent.mouseEnter(getOptionByText('Abc') as Element);
        await keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('多个分组时标题在各自分组内', async () => {
        await renderFixture(Groups, {
            defaultOpen: true,
            groups: [
                { label: 'Group1', options: ['a-1'] },
                { label: 'Group2', options: ['b-1'] },
            ],
        });
        const groups = Array.from(document.querySelectorAll(`.${prefixCls}-group`));
        expect(groups.map((group) => group.textContent)).toEqual(['Group1', 'Group2']);
        const groupNodes = Array.from((getOptionList() as HTMLElement).children);
        expect(groupNodes.map((group) => Array.from(group.children).map((node) => node.textContent))).toEqual([
            ['Group1', 'a-1'],
            ['Group2', 'b-1'],
        ]);
    });

    it('value 相同、label 不同时只发一次 change', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ optionList: [{ value: 'abc', label: 'Label1' }], onChange, defaultOpen: true });
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('#suffix 为元素', async () => {
        await renderSelect({}, { suffix: () => <span class="custom-suffix">suffix</span> });
        expect(document.querySelector(`.${prefixCls}-suffix`)).not.toBeNull();
        expect(screen.getByText('suffix')).toHaveClass('custom-suffix');
        expect(getTrigger()).toHaveClass(`${prefixCls}-with-suffix`);
    });

    it('#prefix 为文本', async () => {
        await renderSelect({}, { prefix: () => 'Prefix:' });
        expect(document.querySelector(`.${prefixCls}-prefix-text`)).toHaveTextContent(/^Prefix:$/);
    });

    it('多选 modelValue 既不在选项中也不在已选中', async () => {
        await renderSelect({ multiple: true, modelValue: ['notExist1', 'notExist2'], optionList: defaultList });
        expect(getTagTexts()).toEqual(['notExist1', 'notExist2']);
    });

    it('#optionItem 参数', async () => {
        await renderSelect(
            { defaultOpen: true, optionList: defaultList },
            {
                optionItem: ({ label, value, class: cls, style, onMouseenter, onClick }) => <div class={['custom-option', cls]} style={style} onClick={onClick} onMouseenter={onMouseenter}>{`${label} - ${value}`}</div>,
            }
        );
        const options = Array.from(document.querySelectorAll('.custom-option'));
        expect(options.map((option) => option.textContent)).toEqual(['Abc - abc', 'Hotsoon - hotsoon', 'Pipixia - pipixia', 'TopBuzz - toutiao']);
        expect(options[0]).toHaveClass(`${prefixCls}-option-custom`);
    });

    it('#optionItem 的 onClick 选中选项', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect(
            { defaultOpen: true, optionList: defaultList, onChange },
            {
                optionItem: ({ label, onClick, onMouseenter, style, class: cls }) => (
                    <div class={['custom-option', cls]} style={style} onClick={onClick} onMouseenter={onMouseenter}>
                        {label as string}
                    </div>
                ),
            }
        );
        await click(document.querySelector('.custom-option'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('abc');
    });

    it('指针移入选项时高亮', async () => {
        await renderSelect({ defaultOpen: true, optionList: defaultList });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        await userEvent.hover(getOptions()[2]);
        await settle();
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        expect(getTrigger().getAttribute('aria-activedescendant')).toBe(getOptions()[2].id);
    });

    it('showRestTagsPopover 时移入 +N 展示其余标签', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
        });
        expect(screen.queryByText('Pipixia')).toBeNull();
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('TopBuzz')).toBeInTheDocument();
    });

    it('指针移入插槽时取消选项高亮', async () => {
        await renderSelect({ defaultOpen: true }, { innerBottomSlot: () => <div class="custom-slot">Slot Content</div> });
        expect(getFocusedOption()).not.toBeNull();
        await userEvent.hover(screen.getByText('Slot Content'));
        await settle();
        expect(getFocusedOption()).toBeNull();
    });

    it('Escape 关闭时发出 dropdownVisibleChange', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        await keyDown('Escape');
        await expectClosed();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('移入 +N 前只渲染 maxTagCount 个标签', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect(screen.queryByText('Pipixia')).toBeNull();
    });

    it('远程 filter 且结果为空', async () => {
        await renderSelect({ filter: true, remote: true, optionList: [], list: [], defaultOpen: true });
        await search('test');
        expect(getOptionList()).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('多选时清除并发出 clear', async () => {
        const onClear = vi.fn<() => void>();
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], showClear: true, onClear, onChange });
        await userEvent.hover(getTrigger());
        await click(getClearIcon());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
        expect(getTagTexts()).toEqual([]);
    });

    it('分组上的未声明属性不影响选项', async () => {
        await renderFixture(Groups, {
            defaultOpen: true,
            groups: [{ label: 'DisabledGroup', attrs: { disabled: true }, options: ['a-1'] }],
        });
        expect(document.querySelectorAll(`.${prefixCls}-group`)).toHaveLength(1);
        expect(getOptionTexts()).toEqual(['a-1']);
    });

    it('label 为空的选项', async () => {
        await renderSelect({ defaultOpen: true, optionList: [{ value: 'abc', label: '' }] });
        expect(getOptions()).toHaveLength(1);
    });

    it('label 为 undefined 或空串时回落到插槽文本，再回落到 value', async () => {
        await renderSelect(
            { defaultOpen: true },
            {
                default: () => (
                    <>
                        <SelectOption value="a" label={undefined}>
                            {() => 'Apple'}
                        </SelectOption>
                        <SelectOption value="b" label="">
                            {() => 'Banana'}
                        </SelectOption>
                        <SelectOption value="c" label="" />
                    </>
                ),
            }
        );
        expect(getOptionTexts()).toEqual(['Apple', 'Banana', 'c']);
        await click(getOptions()[0]);
        expect(getSelectionText()).toHaveTextContent(/^Apple$/);
    });

    it('ArrowUp 导航', async () => {
        await renderSelect({ defaultOpen: true, optionList: defaultList });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
    });

    it('PageDown 与 PageUp 不处理', async () => {
        await renderSelect({ defaultOpen: true, optionList: defaultList });
        await keyDown('PageDown');
        await keyDown('PageUp');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        expect(getOptionList()).not.toBeNull();
    });

    describe('select-only 键盘（APG）', () => {
        // fireEvent of Vue Testing Library resolves to nothing, so the event is built here to read defaultPrevented
        const press = async (key: string, init: KeyboardEventInit = {}, target: Element = getTrigger()) => {
            const event = createEvent.keyDown(target, { key, ...init });
            await fireEvent(target, event);
            await settle();
            return event.defaultPrevented;
        };

        it.each([
            [' ', {}],
            ['ArrowDown', { altKey: true }],
            ['Enter', {}],
            ['ArrowDown', {}],
            ['ArrowUp', {}],
        ])('不可搜索时 %j（%o）打开面板', async (key, init) => {
            const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
            await renderSelect({ optionList: defaultList, onDropdownVisibleChange });
            expect(await press(key, init)).toBe(true);
            expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
            expect(getOptionList()).not.toBeNull();
        });

        it('Home 与 End 打开面板并移到首尾可用项', async () => {
            await renderSelect({
                optionList: [{ value: 'x', label: 'X', disabled: true }, ...defaultList, { value: 'y', label: 'Y', disabled: true }],
            });
            await press('End');
            expect(getOptionList()).not.toBeNull();
            expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
            await press('Home');
            expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        });

        it('按字符移到以它开头的可用选项，关闭时先打开', async () => {
            await renderSelect({
                optionList: [...defaultList, { value: 'tiktok', label: 'TikTok', disabled: true }, { value: 'tt', label: 'Tt' }],
            });
            expect(await press('p')).toBe(true);
            expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
            vi.setSystemTime(Date.now() + 1000);
            await press('t');
            expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
            await press('t');
            expect(getFocusedOption()).toHaveTextContent(/^Tt$/);
        });

        it('可搜索时字符、空格与 Home 留给输入框', async () => {
            const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
            await renderSelect({ optionList: defaultList, filter: true, multiple: true, onDropdownVisibleChange });
            expect(await press(' ', {}, getTriggerInput())).toBe(false);
            expect(await press('p', {}, getTriggerInput())).toBe(false);
            expect(await press('Home', {}, getTriggerInput())).toBe(false);
            expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        });
    });

    it('有已选值时打开，高亮第一个已选的可见项，直接 Enter 不改值', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { unmount } = await renderSelect({ optionList: defaultList, defaultValue: 'pipixia', onChange });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Pipixia$/);
        await keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectionText()).toHaveTextContent(/^Pipixia$/);
        unmount();

        await renderSelect({ optionList: defaultList, multiple: true, defaultValue: ['toutiao', 'hotsoon'] });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^Hotsoon$/);
    });

    it('打开时 Space 与 Enter 一样作用于高亮项：多选切换并保持打开，typeahead 中计入匹配字符串', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            multiple: true,
            optionList: [...defaultList, { value: 'top', label: 'Top Hits' }],
            onChange,
        });
        await keyDown(' ');
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        await keyDown(' ');
        expect(onChange).toHaveBeenLastCalledWith(['abc']);
        expect(getOptionList()).not.toBeNull();
        // the clock is frozen, so the search string never times out: Space joins it
        for (const key of ['t', 'o', 'p', ' ', 'h']) {
            await keyDown(key);
        }
        expect(getFocusedOption()).toHaveTextContent(/^Top Hits$/);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('多选不可搜索时，已选 Tag 上的 Enter 与 Space 不打开下拉、不改值', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ multiple: true, optionList: defaultList, defaultValue: ['hotsoon', 'abc'], onChange });
        const getTag = () => document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`) as HTMLElement;
        getTag().focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        await settle();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getOptionList()).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.keyboard('{Backspace}');
        await settle();
        expect(onChange).toHaveBeenCalledWith(['abc']);
        expect(getTagTexts()).toEqual(['Abc']);
        await click(getTag());
        expect(getOptionList()).not.toBeNull();
    });

    it('virtualize 时用 End 打开，滚到高亮项', async () => {
        // jsdom has no layout: the virtualizer clamps the offset to scrollHeight (0 there) and scrolls with
        // Element.scrollTo, which jsdom lacks
        Object.defineProperties(HTMLElement.prototype, {
            scrollHeight: { configurable: true, get: () => 36 * 100 },
            scrollTo: {
                configurable: true,
                value(this: HTMLElement, { top = 0 }: ScrollToOptions) {
                    this.scrollTop = top;
                    this.dispatchEvent(new Event('scroll'));
                },
            },
        });
        onTestFinished(() => {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
        });
        const optionList = Array.from({ length: 100 }, (_, i) => ({ label: `option-${i}`, value: i }));
        await renderSelect({ virtualize: { itemSize: 36 }, defaultValue: 0, optionList });
        await keyDown('End');
        await waitFor(() => expect(getFocusedOption()).toHaveTextContent(/^option-99$/));
        expect(getTrigger()).toHaveAttribute('aria-activedescendant', getFocusedOption()?.id);
    });

    it('选项列表变化后高亮第一个已选的可见项，没有时才按 defaultActiveFirstOption', async () => {
        const props = { defaultOpen: true, optionList: defaultList, modelValue: 'toutiao' };
        const { rerender } = await renderSelect(props);
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        await rerender({ ...props, optionList: [{ value: 'new', label: 'New' }, ...defaultList] });
        expect(getFocusedOption()).toHaveTextContent(/^TopBuzz$/);
        await rerender({ ...props, optionList: [{ value: 'new', label: 'New' }] });
        expect(getFocusedOption()).toHaveTextContent(/^New$/);
    });

    it('filter 时数字分组名参与匹配', async () => {
        await renderSelect(
            { filter: true, defaultOpen: true },
            {
                default: () => (
                    <>
                        <SelectOptGroup key="g1" label={2024}>
                            {() => [<SelectOption value="x">{() => 'Xray'}</SelectOption>]}
                        </SelectOptGroup>
                        <SelectOptGroup key="g2" label="2025">
                            {() => [<SelectOption value="y">{() => 'Yankee'}</SelectOption>]}
                        </SelectOptGroup>
                    </>
                ),
            }
        );
        await search('202');
        expect(getOptionTexts()).toEqual(['Xray', 'Yankee']);
    });

    it('#trigger 插槽的 value', async () => {
        await renderSelect(
            { defaultValue: 'abc' },
            {
                trigger: ({ value }) => <div class="custom-trigger">{`Custom: ${(value as SelectOptionProps[]).map((item) => item.label).join(',')}`}</div>,
            }
        );
        expect(document.querySelector('.custom-trigger')).toHaveTextContent(/^Custom: Abc$/);
    });

    it.each(['{Enter}', ' ', '{ArrowDown}'])('#trigger 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderSelect(
            {},
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <button type="button" aria-label="Clear" onClick={onPress} />
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: 'Clear' }).focus();
        await userEvent.keyboard(key);
        await settle();
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getOptionList()).toBeNull();
    });

    it('#trigger 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        await renderSelect(
            {},
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <Tag aria-label="Clear" onClick={onPress}>
                            {() => 'Abc'}
                        </Tag>
                    </div>
                ),
            }
        );
        screen.getByRole('button', { name: 'Clear' }).focus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getOptionList()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        await settle();
        expect(getOptionList()).not.toBeNull();
    });

    it('#trigger 插槽的 onRemove 与 onClear', async () => {
        await renderSelect(
            { multiple: true, defaultValue: ['abc', 'hotsoon'] },
            {
                trigger: ({ value, onRemove, onClear }) => (
                    <div class="custom-trigger">
                        {(value as SelectOptionProps[]).map((item, i) => (
                            <span key={i} class="custom-tag" onClick={() => (onRemove as (o: unknown) => void)(item)}>
                                {item.label as string}
                            </span>
                        ))}
                        <button type="button" class="clear-btn" onClick={onClear}>
                            Clear
                        </button>
                    </div>
                ),
            }
        );
        expect(document.querySelector('.custom-trigger')).not.toBeNull();
        expect(document.querySelectorAll('.custom-tag')).toHaveLength(2);
        await click(screen.getByText('Abc'));
        expect(Array.from(document.querySelectorAll('.custom-tag')).map((tag) => tag.textContent)).toEqual(['Hotsoon']);
        await userEvent.keyboard('{Escape}');
        await expectClosed();
        await click(screen.getByRole('button', { name: 'Clear' }));
        expect(document.querySelectorAll('.custom-tag')).toHaveLength(0);
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('#trigger 插槽无参调用 onClear 与 onSearch', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        await renderSelect(
            { multiple: true, filter: true, defaultValue: ['abc'], onChange, onSearch },
            {
                trigger: ({ value, onClear, onSearch: searchFn }) => (
                    <div class="custom-trigger">
                        <span class="custom-value">{(value as SelectOptionProps[]).map((item) => item.label).join(',')}</span>
                        <button type="button" onClick={() => (onClear as () => void)()}>
                            Clear
                        </button>
                        <button type="button" onClick={() => (searchFn as (v: string) => void)('ab')}>
                            Search
                        </button>
                    </div>
                ),
            }
        );
        await click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenCalledWith('ab', undefined);
        await click(screen.getByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(document.querySelector('.custom-value')).toHaveTextContent(/^$/);
    });

    it('modelValue 为 undefined 时显示 placeholder', async () => {
        await renderSelect({ modelValue: undefined, optionList: defaultList, placeholder: 'please select' });
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
        expect(getSelectionText()).toHaveTextContent(/^please select$/);
    });

    it('modelValue 为 undefined 按非受控处理：取 defaultValue，选择即更新', async () => {
        await renderSelect({ modelValue: undefined, defaultValue: 'abc', optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await click(getSelectionText());
        await click(screen.getByRole('option', { name: 'Hotsoon' }));
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('受控 modelValue 从有值变为 undefined', async () => {
        const props = { modelValue: 'abc', optionList: defaultList };
        const { rerender } = await renderSelect(props);
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
        await rerender({ ...props, modelValue: undefined });
        expect(getSelectionText()).toHaveTextContent(/^$/);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('label 相同、value 不同的选项按 value 各自选中', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const optionList = [
            { value: 'a', label: 'Same' },
            { value: 'b', label: 'Same' },
        ];
        await renderSelect({ multiple: true, optionList, onChange, defaultOpen: true });
        const [first, second] = getOptions();
        await click(first);
        expect(first).toHaveAttribute('aria-selected', 'true');
        expect(second).toHaveAttribute('aria-selected', 'false');
        await click(second);
        expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
        expect(getTagTexts()).toEqual(['Same', 'Same']);
    });

    it('filter 为不区分大小写的自定义函数', async () => {
        const customFilter = (inputValue: string, option: SelectOptionProps) => String(option.label).toLowerCase().includes(inputValue.toLowerCase());
        await renderSelect({ filter: customFilter, defaultOpen: true });
        await search('ABC');
        expect(getOptionTexts()).toEqual(['Abc']);
    });

    it('blur 事件', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await mountInPlace({ onBlur, autofocus: true });
        await act(() => getTrigger().blur());
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('#emptyContent 为元素', async () => {
        await renderSelect({ defaultOpen: true, optionList: [], list: [] }, { emptyContent: () => <div class="custom-empty">No Data</div> });
        expect(document.querySelector('.custom-empty')).toHaveTextContent(/^No Data$/);
    });

    it('defaultValue 为数字', async () => {
        await renderSelect({
            defaultValue: 1,
            optionList: [
                { value: 1, label: 'One' },
                { value: 2, label: 'Two' },
            ],
        });
        expect(getSelectionText()).toHaveTextContent(/^One$/);
    });

    it('多选配合数字 value', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: [1, 2],
            optionList: [
                { value: 1, label: 'One' },
                { value: 2, label: 'Two' },
            ],
        });
        expect(getTagTexts()).toEqual(['One', 'Two']);
    });

    it('handle 的 close', async () => {
        const { handle } = await renderSelect({ defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        await act(() => handle().close());
        await expectClosed();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('handle 的 open', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { handle } = await renderSelect({ onDropdownVisibleChange });
        expect(getOptionList()).toBeNull();
        await act(() => handle().open());
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
    });

    it('handle 的 focus', async () => {
        const { handle } = await renderSelect({});
        await act(() => handle().focus());
        expect(getTrigger()).toHaveFocus();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        expect(getOptionList()).toBeNull();
    });

    it('触发器失焦后去掉聚焦样式', async () => {
        await mountInPlace({ autofocus: true });
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        await act(() => getTrigger().blur());
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('handle 的 selectAll', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({ multiple: true, optionList: defaultList, onChange });
        expect(getTagTexts()).toEqual([]);
        await act(() => handle().selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        expect(onChange).toHaveBeenCalledWith(['abc', 'hotsoon', 'pipixia', 'toutiao']);
    });

    it('handle 的 search', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        const { handle } = await renderSelect({ filter: true, defaultOpen: true, onSearch });
        await act(() => handle().search('abc'));
        expect(getTriggerInput()).toHaveValue('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        expect(onSearch).toHaveBeenCalledWith('abc', undefined);
    });

    it('搜索词含特殊字符时按字面匹配', async () => {
        await renderSelect({ filter: true, defaultOpen: true });
        await search('(test)');
        expect(getOptions()).toHaveLength(0);
        expect(document.querySelector(`.${prefixCls}-option-empty`)).not.toBeNull();
    });

    it('stopPropagation', async () => {
        // The dropdown is teleported, so in the DOM its clicks bubble to the document, not to the Select's parents
        const onDocumentClick = vi.fn<() => void>();
        document.addEventListener('click', onDocumentClick);
        onTestFinished(() => document.removeEventListener('click', onDocumentClick));
        const { unmount } = await renderSelect({ defaultOpen: true, stopPropagation: true });
        await click(getOptions()[0]);
        expect(onDocumentClick).not.toHaveBeenCalled();
        unmount();

        await renderSelect({ defaultOpen: true, stopPropagation: false });
        await click(getOptions()[0]);
        expect(onDocumentClick).toHaveBeenCalledTimes(1);
    });

    it('preventScroll', async () => {
        await mountInPlace({ preventScroll: true, autofocus: true });
        // scrolling cannot be observed in jsdom; the trigger still receives focus
        expect(getTrigger()).toHaveFocus();
    });

    it('#tag 插槽替换标签', async () => {
        await renderSelect(
            { multiple: true, defaultValue: ['abc'] },
            {
                tag: ({ option }) => <span class="custom-selected">{(option as SelectOptionProps).label as string}</span>,
            }
        );
        expect(document.querySelector('.custom-selected')).toHaveTextContent(/^Abc$/);
        expect(document.querySelector('.custom-selected')?.closest(`.${BASE_CLASS_PREFIX}-tag`)).toBeNull();
    });

    it('选项上的 data 属性落到选项行', async () => {
        await renderSelect({
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'Abc', 'data-testid': 'option-abc' }],
        });
        expect(getOptions()).toHaveLength(1);
        expect(screen.getByTestId('option-abc')).toBe(getOptions()[0]);
    });

    it('position 为 bottom', async () => {
        await renderSelect({ position: 'bottom', defaultOpen: true });
        expect(getOptionList()).not.toBeNull();
        expect(getPopover()).toHaveAttribute('x-placement', 'bottom');
    });

    it('label 相同、value 不同的受控更新不发 change', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const props = { optionList: [{ value: 'abc1', label: 'Same' }], defaultValue: 'abc1', onChange };
        const { rerender } = await renderSelect(props);
        await rerender({ ...props, optionList: [{ value: 'abc2', label: 'Same' }], modelValue: 'abc2' });
        expect(getSelectionText()).toHaveTextContent(/^Same$/);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('allowCreate 新建后成为已选选项', async () => {
        await renderSelect({ allowCreate: true, filter: true, multiple: true, defaultOpen: true });
        await search('created');
        await click(getOptions()[0]);
        expect(getTagTexts()).toEqual(['created']);
        expect(getOptionByText('created')).toHaveClass(`${prefixCls}-option-selected`);
    });

    it('方向键首尾循环', async () => {
        await renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
            ],
        });
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^A$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^A$/);
    });

    it('下拉中的 Tab', async () => {
        await renderSelect(
            { defaultOpen: true },
            {
                innerBottomSlot: () => (
                    <button class="slot-btn" type="button">
                        Button
                    </button>
                ),
            }
        );
        await keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        await keyDown('Tab', {}, button);
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('optionList 项的 key 原样交回', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            defaultOpen: true,
            changeWithObject: true,
            onChange,
            optionList: [{ value: 'abc', label: 'Abc', key: 'custom-key' }],
        });
        expect(getOptionTexts()).toEqual(['Abc']);
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledWith({ value: 'abc', label: 'Abc', key: 'custom-key' });
    });

    it('搜索词为空时 clearInput 不发 search', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        const { handle } = await renderSelect({ filter: true, onSearch });
        await act(() => handle().clearInput());
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('搜索词不为空时 clearInput', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        const { handle } = await renderSelect({ filter: true, defaultOpen: true, onSearch });
        await search('test');
        expect(getTriggerInput()).toHaveValue('test');
        await act(() => handle().clearInput());
        expect(getTriggerInput()).toHaveValue('');
        expect(onSearch).toHaveBeenLastCalledWith('', undefined);
    });

    it('多选的搜索框随内容变宽', async () => {
        await renderSelect({ multiple: true, filter: true, defaultOpen: true });
        await search('test');
        expect(getTriggerInput()).toHaveValue('test');
        expect(getTriggerInput().parentElement).toHaveStyle({ width: '64px' });
    });

    it('聚焦时按 Escape 关闭后保持聚焦', async () => {
        await mountInPlace({ defaultOpen: true, autofocus: true });
        expect(getTrigger()).toHaveFocus();
        await keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
    });

    it('maxTagCount 之外的标签计入 +N', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            style: { width: '200px' },
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('不带 showRestTagsPopover 时 +N 不展开', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            maxTagCount: 2,
            showRestTagsPopover: false,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        await userEvent.hover(screen.getByText('+1'));
        await settle();
        expect(screen.queryByText('Pipixia')).toBeNull();
    });

    it('ellipsisTrigger 不带 maxTagCount 时显示全部标签', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: true,
            style: { width: '150px' },
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('ellipsisTrigger 溢出时收起', async () => {
        // jsdom has no layout; report a 100px wide tag area in which no 120px tag fits. The sizes are reported after
        // observe() returns, as a browser does: a report inside it would run within the observing effect
        const resize = mockResizeObserver();
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: true,
            maxTagCount: 2,
            style: { width: '100px' },
        });
        const report = (element: Element) => {
            const width = element.classList.contains(`${BASE_CLASS_PREFIX}-overflow-list`) ? 100 : 120;
            return { target: { clientWidth: width }, contentRect: { width } };
        };
        for (let round = 0; round < 3; round++) {
            await resize.fireLive(report);
            await settle();
        }
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('ellipsisTrigger 的 +N 标签', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            ellipsisTrigger: true,
            maxTagCount: 1,
            style: { width: '80px' },
        });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
        expect(screen.getByText('+3').closest(`.${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${prefixCls}-content-wrapper-collapse-tag`);
    });

    it('点击外部发出 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ onBlur });
        await click(getTrigger());
        await click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('点击触发器发出 focus', async () => {
        const onFocus = vi.fn<(event: Event) => void>();
        await renderSelect({ onFocus });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
    });

    it('搜索词清空后恢复全部选项', async () => {
        await renderSelect({ filter: true, defaultOpen: true });
        await search('a');
        await search('');
        expect(getOptions()).toHaveLength(defaultList.length);
    });

    it('多选配合 changeWithObject 取消选中', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            multiple: true,
            changeWithObject: true,
            defaultValue: [{ value: 'abc', label: 'Abc' }],
            onChange,
            defaultOpen: true,
        });
        await click(getOptions()[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('受控多选为空数组', async () => {
        await renderSelect({ multiple: true, modelValue: [], optionList: defaultList, placeholder: 'please select' });
        expect(getTagTexts()).toEqual([]);
        expect(document.querySelector(`.${prefixCls}-selection-placeholder`)).toHaveTextContent(/^please select$/);
    });

    it('defaultValue 配合 changeWithObject', async () => {
        await renderSelect({
            changeWithObject: true,
            defaultValue: { value: 'abc', label: 'Abc' },
            optionList: defaultList,
        });
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('多选 defaultValue 配合 changeWithObject', async () => {
        await renderSelect({
            multiple: true,
            changeWithObject: true,
            defaultValue: [{ value: 'abc', label: 'Abc' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('#innerBottomSlot 内元素的 mouseenter', async () => {
        const onSlotMouseEnter = vi.fn<() => void>();
        await renderSelect(
            { defaultOpen: true },
            {
                innerBottomSlot: () => (
                    <div class="inner-slot" onMouseenter={onSlotMouseEnter}>
                        Slot
                    </div>
                ),
            }
        );
        await userEvent.hover(screen.getByText('Slot'));
        await settle();
        expect(onSlotMouseEnter).toHaveBeenCalledTimes(1);
        expect(getFocusedOption()).toBeNull();
    });

    it('面板关闭后清空搜索词', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        await renderSelect({ defaultOpen: true, filter: true, onSearch });
        await search('abc');
        await keyDown('Escape');
        await expectClosed();
        await settle();
        expect(onSearch).toHaveBeenLastCalledWith('', expect.anything());
    });

    it('下拉打开时在触发器上按 Shift + Tab', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect(
            { defaultOpen: true, onBlur },
            {
                innerBottomSlot: () => (
                    <button class="slot-btn" type="button">
                        Button
                    </button>
                ),
            }
        );
        await act(() => getTrigger().focus());
        await userEvent.tab({ shift: true });
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('全部为禁用选项时方向键不聚焦任何选项', async () => {
        await renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B', disabled: true },
            ],
        });
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toBeNull();
    });

    it('有搜索词时 Backspace 不删除标签', async () => {
        await renderSelect({ multiple: true, filter: true, defaultValue: ['abc', 'hotsoon'], defaultOpen: true });
        await search('test');
        await keyDown('Backspace');
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('选项含特殊字符时 filter', async () => {
        await renderSelect({
            filter: true,
            defaultOpen: true,
            optionList: [
                { value: 'test(1)', label: 'Test (1)' },
                { value: 'test[2]', label: 'Test [2]' },
            ],
        });
        await search('(1)');
        expect(getOptionTexts()).toEqual(['Test (1)']);
    });

    it('受控时 allowCreate', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ allowCreate: true, filter: true, modelValue: 'abc', onChange, defaultOpen: true });
        await search('newValue');
        await click(getOptions()[0]);
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('newValue'));
    });

    it('autoClearSearchValue 为 false 时受控 modelValue 变化保留搜索词', async () => {
        const props = { filter: true, autoClearSearchValue: false, modelValue: 'abc', defaultOpen: true };
        const { rerender } = await renderSelect(props);
        await search('test');
        await rerender({ ...props, modelValue: 'hotsoon' });
        expect(getTriggerInput()).toHaveValue('test');
    });

    it('changeWithObject 且受控值不在选项中', async () => {
        await renderSelect({
            changeWithObject: true,
            modelValue: { value: 'notExist', label: 'Not Exist' },
            optionList: defaultList,
        });
        expect(getSelectionText()).toHaveTextContent(/^Not Exist$/);
    });

    it('选项列表变化后保留不在选项中的已选值', async () => {
        const props = { multiple: true, defaultValue: ['abc', 'notExist'], optionList: defaultList };
        const { rerender } = await renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
        await rerender({ ...props, optionList: [{ value: 'new1', label: 'New1' }] });
        expect(getTagTexts()).toEqual(['Abc', 'notExist']);
    });

    it('多选受控对象值配合 changeWithObject', async () => {
        await renderSelect({
            multiple: true,
            changeWithObject: true,
            modelValue: [
                { value: 'abc', label: 'Abc' },
                { value: 'notExist', label: 'Not Exist' },
            ],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Not Exist']);
    });

    it('#tag 插槽的 onClose 删除该项', async () => {
        await renderSelect(
            { multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 3, showRestTagsPopover: true },
            {
                tag: ({ option, onClose }) => (
                    <span class="custom-tag-content" onClick={onClose}>
                        {(option as SelectOptionProps).label as string}
                    </span>
                ),
            }
        );
        const getItems = () => Array.from(document.querySelectorAll('.custom-tag-content')).map((n) => n.textContent);
        expect(getItems()).toEqual(['Abc', 'Hotsoon']);
        await click(screen.getByText('Abc'));
        expect(getItems()).toEqual(['Hotsoon']);
    });

    it('禁用时点击触发器', async () => {
        const onFocus = vi.fn<(event: Event) => void>();
        await renderSelect({ disabled: true, onFocus });
        await click(getTrigger());
        expect(getOptionList()).toBeNull();
        expect(onFocus).not.toHaveBeenCalled();
    });

    it('filter 与 clickToHide 时再次点击触发器关闭', async () => {
        await renderSelect({ filter: true, clickToHide: true });
        await click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        await click(getTrigger());
        await expectClosed();
    });

    it('清除按钮是有名称的原生按钮，按 Enter 与 Space 不会打开下拉', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onClear = vi.fn<() => void>();
            const { unmount } = await renderSelect({ showClear: true, defaultValue: 'abc', onClear });
            await userEvent.tab();
            expect(getTrigger()).toHaveFocus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: en_US.Select.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            await settle();
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(getSelectionText()).toHaveTextContent(/^$/);
            expect(screen.queryByRole('button', { name: en_US.Select.clear })).toBeNull();
            expect(getTrigger()).toHaveFocus();
            expect(getOptionList()).toBeNull();
            unmount();
        }
    });

    it('焦点在清除按钮上时 ArrowDown 不打开下拉', async () => {
        await renderSelect({ showClear: true, defaultValue: 'abc' });
        await userEvent.tab();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: en_US.Select.clear })).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        expect(getOptionList()).toBeNull();
    });

    it('没有值、禁用或未设置 showClear 时不渲染清除按钮', async () => {
        const { unmount } = await renderSelect({ showClear: true });
        expect(screen.queryByRole('button', { name: en_US.Select.clear })).toBeNull();
        unmount();
        const disabled = await renderSelect({ showClear: true, defaultValue: 'abc', disabled: true });
        expect(screen.queryByRole('button', { name: en_US.Select.clear })).toBeNull();
        disabled.unmount();
        await renderSelect({ defaultValue: 'abc' });
        expect(screen.queryByRole('button', { name: en_US.Select.clear })).toBeNull();
    });

    it('点击可搜索的触发器聚焦搜索框', async () => {
        await renderSelect({ filter: true });
        await click(getTrigger());
        expect(getTriggerInput()).toHaveFocus();
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-wrapper-focus`)).not.toBeNull();
    });

    it('多选配合 max 与 exceed', async () => {
        const onExceed = vi.fn<(option: SelectOptionProps) => void>();
        await renderSelect({ multiple: true, max: 1, defaultValue: ['abc'], onExceed, defaultOpen: true });
        await click(getOptions()[1]);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('受控且 filter 时单选', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ filter: true, modelValue: 'abc', onChange });
        await click(getTrigger());
        await click(getOptions()[1]);
        await expectClosed();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('hotsoon');
    });

    it('select 事件交回 optionList 项的 key', async () => {
        const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({
            onSelect,
            defaultOpen: true,
            optionList: [{ value: 'abc', label: 'Abc', key: 'custom-key' }],
        });
        await click(getOptions()[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('abc', { value: 'abc', label: 'Abc', key: 'custom-key' });
    });

    it('没有值时选中文本为空', async () => {
        await renderSelect({ optionList: defaultList });
        expect(getSelectionText()).toHaveTextContent(/^$/);
    });

    describe('combobox 语义', () => {
        it('combobox 由 aria-label 或 aria-labelledby 命名，否则回退到语言包', async () => {
            const optionList = [{ value: 'a', label: 'A' }];
            const first = await renderSelect({ defaultValue: 'a', optionList });
            expect(screen.getByRole('combobox', { name: en_US.Select.label })).toHaveTextContent('A');
            first.unmount();
            const second = await renderSelect({ 'aria-label': 'City', optionList });
            expect(screen.getByRole('combobox', { name: 'City' })).toBeInTheDocument();
            second.unmount();
            render(() => (
                <>
                    <span id="city-label">Home city</span>
                    <Basic aria-labelledby="city-label" optionList={optionList} />
                </>
            ));
            await settle();
            expect(screen.getByRole('combobox', { name: 'Home city' })).not.toHaveAttribute('aria-label');
        });

        it('关闭状态的 combobox 按 ArrowDown 与 ArrowUp 打开', async () => {
            await renderSelect({ optionList: defaultList });
            const combobox = screen.getByRole('combobox');
            await act(() => combobox.focus());
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{Escape}');
            await settle();
            expect(combobox).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowUp}');
            await settle();
            expect(combobox).toHaveAttribute('aria-expanded', 'true');
        });

        it('仅在打开时 aria-activedescendant 指向已渲染的选项', async () => {
            await renderSelect({ defaultActiveFirstOption: true, optionList: defaultList });
            const combobox = screen.getByRole('combobox');
            expect(combobox).not.toHaveAttribute('aria-activedescendant');
            await click(combobox);
            const options = await screen.findAllByRole('option');
            expect(combobox).toHaveAttribute('aria-activedescendant', options[0].id);
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            expect(combobox).toHaveAttribute('aria-activedescendant', options[1].id);
            await userEvent.keyboard('{Escape}');
            await settle();
            expect(combobox).not.toHaveAttribute('aria-activedescendant');
        });

        it('创建选项与自定义选项都有 id，触发器可以指向它们', async () => {
            const { unmount } = await renderSelect({
                allowCreate: true,
                defaultOpen: true,
                filter: true,
                optionList: [{ value: 'a', label: 'A' }],
            });
            const input = screen.getByRole('combobox');
            await userEvent.type(input, 'new{ArrowDown}');
            await settle();
            const created = screen.getByRole('option', { name: /new/ });
            expect(created.id).not.toBe('');
            expect(input).toHaveAttribute('aria-activedescendant', created.id);
            unmount();

            await renderSelect(
                { defaultOpen: true, optionList: [{ value: 'a', label: 'A' }] },
                {
                    optionItem: ({ id, label, onClick, onMouseenter, selected, style }) => (
                        <div id={id} style={style} aria-selected={selected} role="option" onClick={onClick} onMouseenter={onMouseenter}>
                            {label as string}
                        </div>
                    ),
                }
            );
            await act(() => screen.getByRole('combobox').focus());
            await userEvent.keyboard('{ArrowDown}');
            await settle();
            const custom = screen.getByRole('option', { name: 'A' });
            expect(custom.id).not.toBe('');
            expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', custom.id);
        });

        it('触发器中的搜索输入框作为 combobox（ARIA 1.2）', async () => {
            const { unmount } = await renderSelect({
                defaultValue: 'a',
                filter: true,
                optionList: [{ value: 'a', label: 'A' }],
            });
            expect(screen.getByRole('combobox', { name: en_US.Select.label })).toHaveTextContent('A');
            await click(screen.getByRole('combobox'));
            const input = screen.getByRole('combobox', { name: en_US.Select.label });
            expect(input.tagName).toBe('INPUT');
            expect(input).toHaveFocus();
            expect(input).toHaveAttribute('aria-autocomplete', 'list');
            expect(input).toHaveAttribute('aria-expanded', 'true');
            expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
            expect(input).toHaveAccessibleDescription('A');
            await userEvent.type(input, 'x');
            await settle();
            expect(input).not.toHaveAccessibleDescription();
            expect(getRoot()).toHaveAttribute('tabindex', '-1');
            expect(getRoot()).not.toHaveAttribute('role');
            expect(getRoot()).not.toHaveAttribute('aria-expanded');
            expect(getRoot()).not.toHaveAttribute('aria-describedby');
            expect(screen.queryByRole('dialog')).toBeNull();
            unmount();

            await renderSelect({ multiple: true, filter: true, optionList: [{ value: 'a', label: 'A' }] });
            expect(screen.getByRole('combobox').tagName).toBe('INPUT');
            expect(getRoot()).toHaveAttribute('tabindex', '-1');
        });

        it('搜索输入框位于下拉中时，触发器仍是可访问的 combobox', async () => {
            await renderSelect({
                multiple: true,
                filter: true,
                optionList: [{ value: 'a', label: 'A' }],
                searchPosition: 'dropdown',
            });
            const combobox = screen.getByRole('combobox');
            expect(combobox).toBe(getRoot());
            expect(combobox).toHaveAttribute('tabindex', '0');
            await click(combobox);
            const searchBox = await screen.findByRole('textbox', { name: en_US.Select.label });
            expect(searchBox).toHaveAttribute('aria-autocomplete', 'list');
            expect(searchBox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
        });
    });

    describe('combobox 与 listbox 用同一个名称来源', () => {
        const optionList = [{ value: 'a', label: 'A' }];

        it('使用方 aria-label 时两者都用该值', async () => {
            await renderSelect({ defaultOpen: true, optionList, 'aria-label': 'Fruit' }, { insetLabel: () => 'Inset' });
            expect(getTrigger()).toHaveAccessibleName('Fruit');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Fruit');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });

        it('没有任何名称来源时 listbox 名称等于 combobox 的语言包回落名', async () => {
            await renderSelect({ defaultOpen: true, optionList });
            expect(getTrigger()).toHaveAccessibleName(en_US.Select.label);
            expect(screen.getByRole('listbox')).toHaveAccessibleName(en_US.Select.label);
        });

        it('只有 #insetLabel 时 combobox 与 listbox 都以 insetLabel 命名，没有 insetLabelId 时也能引用', async () => {
            const { unmount } = await renderSelect({ defaultOpen: true, optionList }, { insetLabel: () => 'Fruit' });
            expect(getTrigger()).toHaveAccessibleName('Fruit');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('Fruit');
            unmount();
            await renderSelect({ defaultOpen: true, optionList, insetLabelId: 'fruit-label' }, { insetLabel: () => 'Fruit' });
            expect(getTrigger()).toHaveAttribute('aria-labelledby', 'fruit-label');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'fruit-label');
            expect(document.getElementById('fruit-label')).toHaveTextContent('Fruit');
        });

        it('有 #prefix 时 insetLabel 不渲染，也不作名称来源', async () => {
            await renderSelect({ defaultOpen: true, optionList }, { prefix: () => 'Pre', insetLabel: () => 'Fruit' });
            expect(getTrigger()).toHaveAccessibleName(en_US.Select.label);
            expect(screen.getByRole('listbox')).toHaveAccessibleName(en_US.Select.label);
        });

        it('下拉搜索框与 combobox 同名', async () => {
            await renderSelect({ defaultOpen: true, optionList, filter: true, searchPosition: 'dropdown' }, { insetLabel: () => 'Fruit' });
            expect(screen.getByRole('textbox')).toHaveAccessibleName('Fruit');
        });

        it('使用方 aria-labelledby 优先于 #insetLabel，两者指向同一个标签', async () => {
            const label = document.body.appendChild(document.createElement('span'));
            label.id = 'external-label';
            label.textContent = 'External';
            onTestFinished(() => label.remove());
            await renderSelect({ defaultOpen: true, optionList, 'aria-labelledby': 'external-label' }, { insetLabel: () => 'Fruit' });
            expect(getTrigger()).toHaveAccessibleName('External');
            expect(screen.getByRole('listbox')).toHaveAccessibleName('External');
        });

        it('搜索框是 combobox 时也不指向输入框（accname 会取输入内容）', async () => {
            await renderSelect({ defaultOpen: true, multiple: true, filter: true, optionList, 'aria-label': 'Fruit' });
            const input = screen.getByRole('combobox');
            expect(input.tagName).toBe('INPUT');
            expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Fruit');
            expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-labelledby');
        });
    });

    it('filter 时分组内按选项 label 匹配', async () => {
        await renderFixture(Groups, {
            filter: true,
            defaultOpen: true,
            groups: [{ label: 'Fruits', options: ['Apple', 'Banana'] }],
        });
        await search('Apple');
        expect(getOptionTexts()).toEqual(['Apple']);
    });

    it('+N 的 Popover 使用 restTagsPopoverProps', async () => {
        await renderSelect({
            multiple: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            maxTagCount: 2,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'top' },
        });
        await userEvent.hover(screen.getByText('+2'));
        await waitFor(() => expect(screen.getByText('Pipixia')).toBeInTheDocument());
        expect(screen.getByText('Pipixia').closest(`.${BASE_CLASS_PREFIX}-popover-wrapper`)).toHaveAttribute('x-placement', 'top');
    });

    it('maxTagCount 为 0 时不收起', async () => {
        await renderSelect({ multiple: true, defaultValue: ['abc', 'hotsoon'], maxTagCount: 0 });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('#optionItem 的 onMouseenter 更新高亮', async () => {
        let mouseEnterCalled = false;
        await renderSelect(
            { defaultOpen: true, optionList: defaultList },
            {
                optionItem: ({ label, onClick, onMouseenter, style, class: cls, focused }) => (
                    <div
                        class={['custom-option', cls, { focused }]}
                        style={style}
                        onClick={onClick}
                        onMouseenter={(event: MouseEvent) => {
                            mouseEnterCalled = true;
                            (onMouseenter as (e: MouseEvent) => void)(event);
                        }}
                    >
                        {label as string}
                    </div>
                ),
            }
        );
        await userEvent.hover(screen.getByText('Pipixia'));
        await settle();
        expect(mouseEnterCalled).toBe(true);
        expect(screen.getByText('Pipixia')).toHaveClass('focused');
        expect(screen.getByText('Abc')).not.toHaveClass('focused');
    });

    it('#optionItem 随键盘高亮', async () => {
        await renderSelect(
            { defaultOpen: true, optionList: defaultList },
            {
                optionItem: ({ label, onClick, onMouseenter, style, class: cls, focused }) => (
                    <div class={['custom-option', cls, { focused }]} style={style} onClick={onClick} onMouseenter={onMouseenter}>
                        {label as string}
                    </div>
                ),
            }
        );
        await keyDown('ArrowDown');
        expect(screen.getByText('Hotsoon')).toHaveClass('focused');
    });

    it('打开时已选项带选中样式', async () => {
        await renderSelect({ defaultOpen: true, defaultValue: 'hotsoon', optionList: defaultList });
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveTextContent(/^Hotsoon$/);
        expect(document.querySelector(`.${prefixCls}-option-selected`)).toHaveAttribute('aria-selected', 'true');
    });

    it('Escape 关闭后焦点在触发器', async () => {
        await renderSelect({ defaultOpen: true });
        await keyDown('Escape');
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
    });

    it('面板打开时搜索框失焦', async () => {
        await renderSelect({ filter: true, defaultOpen: true });
        await fireEvent.blur(getTriggerInput());
        expect(getTriggerInput()).not.toBeNull();
        expect(getOptionList()).not.toBeNull();
    });

    it('焦点在下拉内时触发器失焦不发 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect(
            { defaultOpen: true, onBlur },
            {
                innerBottomSlot: () => (
                    <button class="slot-btn" type="button">
                        Button
                    </button>
                ),
            }
        );
        await keyDown('Tab');
        expect(screen.getByRole('button', { name: 'Button' })).toHaveFocus();
        await fireEvent.blur(getTrigger());
        expect(onBlur).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('下拉中第一个可聚焦元素上按 Shift + Tab 回到触发器', async () => {
        await renderSelect(
            { defaultOpen: true },
            {
                innerBottomSlot: () => (
                    <button class="slot-btn" type="button">
                        Button
                    </button>
                ),
            }
        );
        await keyDown('Tab');
        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveFocus();
        await keyDown('Tab', { shiftKey: true }, button);
        expect(getTrigger()).toHaveFocus();
        expect(getOptionList()).not.toBeNull();
    });

    it('搜索词清空后不再有新建项', async () => {
        await renderSelect({ allowCreate: true, filter: true, defaultOpen: true });
        await search('new');
        expect(getOptions()).toHaveLength(1);
        await search('');
        expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
    });

    it('下拉中按 Space 与 Enter 一样选中高亮项并关闭', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, onChange });
        expect(getFocusedOption()).toHaveTextContent(/^Abc$/);
        await keyDown(' ');
        expect(onChange).toHaveBeenCalledWith('abc');
        await expectClosed();
        expect(getSelectionText()).toHaveTextContent(/^Abc$/);
    });

    it('默认插槽中 v-if 留下的注释节点被忽略', async () => {
        await renderFixture(Mixed, { defaultOpen: true });
        expect(getOptionTexts()).toEqual(['A', 'B']);
    });

    it('多选模式下 modelValue 不是数组时给出开发期警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await renderSelect({ multiple: true, modelValue: 'abc' });
        expect(warn).toHaveBeenCalledWith('Warning: [Semi Select] defaultValue/value should be array type in multiple mode');
        warn.mockRestore();
    });

    it('默认插槽含非选项元素时不崩溃', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await renderFixture(Mixed, { defaultOpen: true, invalid: true });
        expect(getOptionList()).not.toBeNull();
        expect(screen.getByText('A')).toBeInTheDocument();
        warn.mockRestore();
    });

    it('分组内多个带 key 的选项', async () => {
        await renderFixture(Groups, { defaultOpen: true, groups: [{ label: 'Group1', options: ['a-1', 'a-2'] }] });
        expect(getOptionTexts()).toEqual(['a-1', 'a-2']);
    });

    it('卸载时清理', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        const { unmount } = await renderSelect({ defaultOpen: true, onBlur });
        expect(getOptionList()).not.toBeNull();
        unmount();
        expect(getOptionList()).toBeNull();
        await fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('showRestTagsPopover 时宽度变化不影响 +N', async () => {
        const props = {
            multiple: true,
            maxTagCount: 2,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: '200px' },
        };
        const { rerender } = await renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
        await rerender({ ...props, style: { width: '100px' } });
        expect(getTrigger()).toHaveStyle({ width: '100px' });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it.each(['innerTopSlot', 'outerTopSlot', 'outerBottomSlot'])('指针移入 #%s 时取消选项高亮', async (name) => {
        await renderSelect({ defaultOpen: true }, { [name]: () => <div class="test-slot">Slot</div> });
        expect(document.querySelector('.test-slot')).not.toBeNull();
        expect(getFocusedOption()).not.toBeNull();
        const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/-slot$/, '-slot');
        await userEvent.hover(document.querySelector(`.${prefixCls}-option-list-${kebab}`) as Element);
        await settle();
        expect(getFocusedOption()).toBeNull();
    });

    it('maxTagCount 为 1 时的 +N', async () => {
        await renderSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            optionList: defaultList,
            style: { width: '150px' },
        });
        expect(getTagTexts()).toEqual(['Abc', '+3']);
    });

    it('ellipsisTrigger 收起超过 maxTagCount 的标签', async () => {
        await renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: '200px' },
        });
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+1']);
    });

    it('选中项变化时 ellipsisTrigger 的 OverflowList 保持挂载', async () => {
        await renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
            style: { width: '200px' },
        });
        const collapse = () => document.querySelector(`.${prefixCls}-content-wrapper-collapse`) as HTMLElement;
        const overflowList = collapse().firstElementChild;
        expect(overflowList).not.toBeNull();
        await click(getTrigger());
        await click(getOptionByText('TopBuzz') as HTMLElement);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        expect(collapse().firstElementChild).toBe(overflowList);
    });

    it('defaultValue 只在挂载时读取', async () => {
        const props = {
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao'],
            optionList: defaultList,
            style: { width: '100px' },
        };
        const { rerender } = await renderSelect(props);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
        await rerender({ ...props, defaultValue: ['abc', 'hotsoon', 'pipixia', 'toutiao', 'xigua'] });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('ellipsisTrigger 时选中超过 maxTagCount 的项后出现 +N', async () => {
        await renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await click(getTrigger());
        await click(getOptionByText('Pipixia') as HTMLElement);
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toHaveTextContent(/^\+1$/);
    });

    it('ellipsisTrigger 时未超过 maxTagCount 没有 +N', async () => {
        await renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 3,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(document.querySelector(`.${prefixCls}-content-wrapper-collapse-tag`)).toBeNull();
    });

    it('已选项全部禁用时 Backspace 不删除', async () => {
        await renderSelect({
            multiple: true,
            filter: true,
            defaultValue: ['disabled1', 'disabled2'],
            optionList: [
                { value: 'disabled1', label: 'Disabled 1', disabled: true },
                { value: 'disabled2', label: 'Disabled 2', disabled: true },
                { value: 'normal', label: 'Normal' },
            ],
        });
        await click(getTrigger());
        await keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1', 'Disabled 2']);
    });

    it('禁用与未禁用的已选项混合时 Backspace 删除未禁用的', async () => {
        await renderSelect({
            multiple: true,
            filter: true,
            defaultValue: ['disabled1', 'normal'],
            optionList: [
                { value: 'disabled1', label: 'Disabled 1', disabled: true },
                { value: 'normal', label: 'Normal' },
            ],
        });
        await click(getTrigger());
        await keyDown('Backspace', {}, getTriggerInput());
        expect(getTagTexts()).toEqual(['Disabled 1']);
    });

    it('打开再关闭不发 change', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ multiple: true, defaultValue: ['abc'], optionList: defaultList, onChange });
        await click(getTrigger());
        await keyDown('Escape');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
        expect(getTagTexts()).toEqual(['Abc']);
    });

    it('关闭时在聚焦的触发器上按 Enter 打开', async () => {
        await renderSelect({ optionList: defaultList });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await keyDown('Enter');
        expect(getOptionList()).not.toBeNull();
    });

    it('高亮项超出范围时按 Enter', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const props = { defaultOpen: true, defaultActiveFirstOption: false, optionList: defaultList, onChange };
        const { rerender } = await renderSelect(props);
        await userEvent.hover(getOptions()[3]);
        await rerender({ ...props, optionList: defaultList.slice(0, 1) });
        expect(getOptionTexts()).toEqual(['Abc']);
        await keyDown('Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(getOptionList()).not.toBeNull();
    });

    it('输入关键字后高亮回到第一个匹配项，Enter 选中它', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, onChange });
        await userEvent.hover(getOptions()[3]);
        await search('p');
        expect(getOptionTexts()).toEqual(['Pipixia', 'TopBuzz']);
        expect(getFocusedOption()).toHaveTextContent('Pipixia');
        await keyDown('Enter', {}, getTriggerInput());
        expect(onChange).toHaveBeenCalledWith('pipixia');
    });

    it('defaultActiveFirstOption 为 false 时，输入关键字后不保留旧的高亮项', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({
            defaultOpen: true,
            filter: true,
            defaultActiveFirstOption: false,
            optionList: defaultList,
            onChange,
        });
        await userEvent.hover(getOptions()[0]);
        await search('p');
        expect(getFocusedOption()).toBeNull();
        await keyDown('Enter', {}, getTriggerInput());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('选择已选中的项不发 change', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultValue: 'abc', optionList: defaultList, onChange });
        await click(getTrigger());
        await click(getOptionByText('Abc') as HTMLElement);
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('面板关闭时按 Tab 离开发出 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ optionList: defaultList, onBlur });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await userEvent.tab();
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getOptionList()).toBeNull();
    });

    it('点击关闭面板后按 Tab 离开才发 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ optionList: defaultList, onBlur, clickToHide: true });
        await click(getTrigger());
        await click(getTrigger());
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.tab();
        await settle();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('焦点在搜索框时 Shift + Tab 离开', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, onBlur }, { innerBottomSlot: () => <button type="button">Button</button> });
        await act(() => getTriggerInput().focus());
        await userEvent.tab({ shift: true });
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('打开且没有高亮项时按 Enter 关闭', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ defaultOpen: true, optionList: defaultList, onChange }, { innerTopSlot: () => <div>Slot</div> });
        await userEvent.hover(screen.getByText('Slot'));
        await settle();
        expect(getFocusedOption()).toBeNull();
        await keyDown('Enter');
        await expectClosed();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('打开的列表中按 Tab 关闭列表，焦点仍在组件内时不发 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ defaultOpen: true, filter: true, optionList: defaultList, onBlur });
        await keyDown('Tab', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`) as Element);
        await expectClosed();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('下拉容器上按其他键', async () => {
        await renderSelect({ defaultOpen: true, filter: true, optionList: defaultList });
        await keyDown(' ', {}, document.querySelector(`.${prefixCls}-option-list-wrapper`) as Element);
        expect(getOptionList()).not.toBeNull();
    });

    it('showRestTagsPopover 的 +N 计数', async () => {
        await renderSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', '+2']);
    });

    it('ellipsisTrigger 时连续选中更新 +N', async () => {
        await renderSelect({
            multiple: true,
            ellipsisTrigger: true,
            maxTagCount: 2,
            defaultValue: ['abc', 'hotsoon'],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        await click(getTrigger());
        await click(getOptionByText('Pipixia') as HTMLElement);
        await click(getOptionByText('TopBuzz') as HTMLElement);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', '+2']);
    });

    it('defaultValue 为 null 或 undefined 时，单选配合 #selectedItem 显示 placeholder', async () => {
        const selectedItem = vi.fn<(scope: Record<string, unknown>) => unknown>(({ option }) => <div class="custom-selected">{String((option as SelectOptionProps).label)}</div>);
        const { unmount } = await renderSelect({ defaultValue: null, placeholder: 'Please select' }, { selectedItem });
        expect(getSelectionText()).toHaveTextContent(/^Please select$/);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
        expect(document.querySelector('.custom-selected')).toBeNull();
        unmount();

        await renderSelect({ defaultValue: undefined, placeholder: 'Please select' }, { selectedItem });
        expect(getSelectionText()).toHaveTextContent(/^Please select$/);
        expect(document.querySelector('.custom-selected')).toBeNull();
    });

    it('virtualize 配合 allowCreate 时，行样式传给 #createItem', async () => {
        const createItem = vi.fn<(scope: SlotScope) => unknown>(({ inputValue, style }) => <div class="custom-create" style={[{ padding: '6px 12px' }, style]}>{`Create ${inputValue as string}`}</div>);
        await renderSelect(
            {
                allowCreate: true,
                filter: true,
                defaultOpen: true,
                virtualize: { height: 270, width: '100%', itemSize: 36 },
                optionList: [{ value: 500333, label: '500333 live room' }],
            },
            { createItem }
        );
        await search('500');
        expect(createItem.mock.lastCall?.[0].style).toEqual(expect.objectContaining({ position: 'absolute', top: '36px' }));
        expect(document.querySelector('.custom-create')).toHaveTextContent(/^Create 500$/);
        expect(document.querySelector('.custom-create')).toHaveStyle({
            position: 'absolute',
            top: '36px',
            height: '36px',
        });
        expect(getOptionByText('500333 live room')).toHaveStyle({ top: '0px' });
    });

    it.each([false, true])('从插槽通过 handle 关闭后再点击外部，去掉聚焦样式（multiple 为 %s）', async (multiple) => {
        const close = vi.fn<() => void>();
        const view = await renderSelect(
            { multiple },
            {
                outerBottomSlot: () => (
                    <button type="button" onClick={() => close()}>
                        close
                    </button>
                ),
            }
        );
        close.mockImplementation(() => view.handle().close());
        await click(getTrigger());
        await click(screen.getByRole('button', { name: 'close' }));
        await expectClosed();
        expect(getTrigger()).toHaveClass(`${prefixCls}-focus`);
        await click(document.body);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
        expect(getTrigger()).not.toHaveFocus();
    });

    it('标题来自 #label 插槽的分组在过滤时保持 key 唯一', async () => {
        const warn = vi.spyOn(console, 'warn');
        await renderFixture(Groups, {
            filter: true,
            groups: ['a', 'b', 'c'].map((label) => ({
                label,
                labelSlot: true,
                options: label === 'c' ? ['c-1'] : [`${label}-1`, `${label}-2`],
            })),
        });
        await click(getTrigger());
        const groupTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-group`)).map((g) => g.textContent);
        expect(groupTexts()).toEqual(['a', 'b', 'c']);
        await userEvent.type(getTriggerInput(), 'b');
        await settle();
        expect(groupTexts()).toEqual(['b']);
        expect(getOptionTexts()).toEqual(['b-1', 'b-2']);
        await userEvent.clear(getTriggerInput());
        await settle();
        expect(groupTexts()).toEqual(['a', 'b', 'c']);
        expect(getOptionTexts()).toEqual(['a-1', 'a-2', 'b-1', 'b-2', 'c-1']);
        const duplicateKeyWarnings = warn.mock.calls.filter(([message]) => String(message).includes('Duplicate keys'));
        warn.mockRestore();
        expect(duplicateKeyWarnings).toEqual([]);
    });

    it('生成的 id 是合法的 CSS id 选择器', async () => {
        await renderSelect();
        await click(getTrigger());
        const trigger = getTrigger();
        expect(document.querySelector(`#${trigger.id}`)).toBe(trigger);
        expect(document.querySelector(`#${trigger.getAttribute('aria-controls') as string}`)).toBe(getOptionList());
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Select: { size: 'small', placeholder: 'global' } };
        await renderSelect();
        expect(getTrigger()).toHaveClass(`${prefixCls}-small`);
        expect(getSelectionText()).toHaveTextContent(/^global$/);
    });

    it('全局默认值里的 id 与 insetLabelId 不影响 Select', async () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets them anyway
        semiGlobal.config.overrideDefaultProps = {
            Select: { id: 'from-global', insetLabelId: 'label-from-global' },
        } as object;
        const { unmount } = await renderSelect({}, { insetLabel: () => 'Label' });
        expect(document.getElementById('from-global')).toBeNull();
        expect(document.getElementById('label-from-global')).toBeNull();
        unmount();
        await renderSelect({ id: 'own', insetLabelId: 'own-label' }, { insetLabel: () => 'Label' });
        expect(getTrigger()).toHaveAttribute('id', 'own');
        expect(document.getElementById('own-label')).toHaveTextContent('Label');
    });

    it('全局默认值的类型不含 id 类属性', () => {
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().not.toHaveProperty('insetLabelId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Tooltip']>>().not.toHaveProperty('wrapperId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Radio']>>().not.toHaveProperty('addonId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().toHaveProperty('size');
    });

    it('data-* 落在根元素，id 为触发器及其选项命名', async () => {
        await renderSelect({ 'data-testid': 'sel', id: 'my-select' });
        const trigger = getTrigger();
        expect(screen.getByTestId('sel')).toBe(trigger);
        expect(trigger.id).toBe('my-select');
        await click(trigger);
        expect(getOptions()[0].id).toBe('my-select-option-0');
    });

    it('combobox 控制 listbox，并指向聚焦的选项', async () => {
        await renderSelect();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'listbox');
        await click(getTrigger());
        const trigger = getTrigger();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(document.getElementById(trigger.getAttribute('aria-controls') as string)).toBe(getOptionList());
        expect(trigger.getAttribute('aria-activedescendant')).toBe(getOptions()[0].id);
        expect(getOptionList()).toHaveAttribute('role', 'listbox');
    });

    it('handle.rePosition 让下拉层跟随移动后的触发器', async () => {
        const { handle } = await renderSelect();
        await act(() => handle().open());
        const popup = screen.getByRole('listbox').closest<HTMLElement>('[popover]');
        expect(popup?.style.left).toBe('0px');
        // the trigger moved without scrolling or resizing
        const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 50, 80, 20));
        onTestFinished(() => rect.mockRestore());
        await act(() => handle().rePosition());
        expect(popup?.style.left).toBe('100px');
    });

    it('每个 handle 方法都可调用', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        const { handle } = await renderSelect({ filter: true, multiple: true, onSearch });
        await act(() => handle().open());
        expect(getOptionList()).not.toBeNull();
        const event = new Event('input');
        await act(() => handle().search('hot', event));
        expect(getTriggerInput()).toHaveValue('hot');
        expect(onSearch).toHaveBeenLastCalledWith('hot', event);
        expect(getOptionTexts()).toEqual(['Hotsoon']);
        await act(() => handle().clearInput());
        expect(getTriggerInput()).toHaveValue('');
        await act(() => handle().rePosition());
        await act(() => handle().selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
        await act(() => handle().deselectAll());
        expect(getTagTexts()).toEqual([]);
        await act(() => handle().close());
        await expectClosed();
        await act(() => handle().focus());
        expect(getTriggerInput()).toHaveFocus();
    });

    it('清空非受控单选时，先发 change(undefined)，再发 clear', async () => {
        const calls: unknown[][] = [];
        await renderSelect({
            defaultValue: 'abc',
            showClear: true,
            onChange: (value: unknown) => calls.push(['change', value]),
            onClear: () => calls.push(['clear']),
        });
        await userEvent.hover(getTrigger());
        await click(getClearIcon());
        expect(calls).toEqual([['change', undefined], ['clear']]);
        expect(getSelectionText()).toHaveClass(`${prefixCls}-selection-placeholder`);
    });

    it('通过 #trigger 的 onRemove 删除非受控单选的值时发出变化', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const onDeselect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect(
            { defaultValue: 'abc', onChange, onDeselect },
            {
                trigger: ({ value, onRemove }) => (
                    <div class="custom-trigger">
                        {(value as SelectOptionProps[]).map((item) => (
                            <button key={item.value} type="button" onClick={() => (onRemove as (option: SelectOptionProps) => void)(item)}>
                                {String(item.label)}
                            </button>
                        ))}
                    </div>
                ),
            }
        );
        await click(screen.getByRole('button', { name: 'Abc' }));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ value: 'abc', label: 'Abc' }));
        expect(onChange).toHaveBeenCalledWith(undefined);
        expect(screen.queryByRole('button', { name: 'Abc' })).toBeNull();
    });

    it('打开的可过滤单选上按 Escape，焦点回到触发器且不发 blur', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ filter: true, onBlur });
        await click(getTrigger());
        expect(getTriggerInput()).toHaveFocus();
        await keyDown('Escape', {}, getTriggerInput());
        await expectClosed();
        expect(getTrigger()).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('从打开的 Select 按 Tab 离开时，只发一次 blur 并关闭', async () => {
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ onBlur });
        await click(getTrigger());
        await userEvent.tab();
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('选择非受控单选的选项时，先发 select 再发 change', async () => {
        const calls: unknown[][] = [];
        await renderSelect({
            onSelect: (value: unknown) => calls.push(['select', value]),
            onChange: (value: unknown) => calls.push(['change', value]),
        });
        await click(getTrigger());
        await click(getOptionByText('Hotsoon') as HTMLElement);
        expect(calls).toEqual([
            ['select', 'hotsoon'],
            ['change', 'hotsoon'],
        ]);
        await expectClosed();
        expect(getSelectionText()).toHaveTextContent(/^Hotsoon$/);
    });

    it('打开、选择与 blur 各只发一次', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const onChange = vi.fn<(value: unknown) => void>();
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ onDropdownVisibleChange, onChange, onBlur });
        await click(getTrigger());
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
        await click(getOptionByText('Hotsoon') as HTMLElement);
        expect(onChange.mock.calls).toEqual([['hotsoon']]);
        await expectClosed();
        await click(getTrigger());
        await click(document.body);
        await expectClosed();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    });

    it('defaultOpen 的 Select 点击外部时关闭，只发一次 false', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        expect(getOptionList()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await expectClosed();
        expect(onDropdownVisibleChange.mock.calls.filter(([visible]) => !visible)).toHaveLength(1);
    });

    it('通过 handle 连续打开两次，关闭后不残留外部点击监听', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { handle } = await renderSelect({ onDropdownVisibleChange });
        await act(() => handle().open());
        await act(() => handle().open());
        await fireEvent.mouseDown(document.body);
        await expectClosed();
        await fireEvent.mouseDown(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        expect(onDropdownVisibleChange.mock.calls.filter(([visible]) => !visible)).toHaveLength(1);
    });

    it('defaultOpen 配合 autofocus 与 filter 时只打开一次', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderSelect({ defaultOpen: true, autofocus: true, filter: true, onDropdownVisibleChange });
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('过滤不改动 optionList 中的条目', async () => {
        const optionList = defaultList.map((option) => ({ ...option }));
        await renderSelect({ optionList, filter: true, defaultOpen: true });
        await search('abc');
        expect(getOptionTexts()).toEqual(['Abc']);
        expect(optionList).toEqual(defaultList);
    });

    it('传给 filter 的 option 对象不会被后续搜索改写', async () => {
        const seen: SelectOptionProps[] = [];
        const filter = (input: string, option: SelectOptionProps) => {
            seen.push(option);
            return String(option.label).toLowerCase().includes(input);
        };
        await renderSelect({ optionList: defaultList, filter, defaultOpen: true });
        await search('abc');
        const visibility = seen.map((option) => option._show);
        await search('zzz');
        expect(getOptions()).toHaveLength(0);
        expect(seen.slice(0, visibility.length).map((option) => option._show)).toEqual(visibility);
    });

    it('Tab 进入多选可搜索 Select 的搜索框后，方向键与 Enter 可用', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ multiple: true, filter: true, optionList: defaultList, onChange });
        await userEvent.tab();
        expect(getTriggerInput()).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        expect(getOptionList()).not.toBeNull();
        await userEvent.keyboard('{ArrowDown}');
        await settle();
        const focusedText = getFocusedOption()?.textContent;
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual([focusedText]);
    });

    it('changeWithObject 单选 modelValue 为 null 时显示占位而不抛错', async () => {
        await renderSelect({
            changeWithObject: true,
            modelValue: null,
            placeholder: 'pick',
            optionList: defaultList,
        });
        expect(getSelectionText()).toHaveTextContent('pick');
    });

    it('changeWithObject 多选 modelValue 含 null 项时只渲染有效项', async () => {
        const { unmount } = await renderSelect({
            multiple: true,
            changeWithObject: true,
            modelValue: [null, { value: 'hotsoon', label: 'Hotsoon' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Hotsoon']);
        unmount();
        await renderSelect({
            multiple: true,
            changeWithObject: true,
            modelValue: [null, { value: 'ghost', label: 'Ghost' }],
            optionList: defaultList,
        });
        expect(getTagTexts()).toEqual(['Ghost']);
    });

    it('Tab 进入触发器发一次 focus，之后点击打开不再重复，Tab 离开发 blur', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        const onBlur = vi.fn<(event: Event) => void>();
        await renderSelect({ onFocus, onBlur, optionList: defaultList });
        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        await click(getTrigger());
        expect(getOptionList()).not.toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await expectClosed();
        await userEvent.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('Tab 进入多选可搜索的搜索框发一次 focus', async () => {
        const onFocus = vi.fn<(event: FocusEvent) => void>();
        await renderSelect({ multiple: true, filter: true, onFocus, optionList: defaultList });
        await userEvent.tab();
        expect(getTriggerInput()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('受控时 selectAll 在父组件不更新 modelValue 时不改变标签', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({ multiple: true, modelValue: [], optionList: defaultList, onChange });
        await act(() => handle().selectAll());
        expect(onChange).toHaveBeenCalledWith(['abc', 'hotsoon', 'pipixia', 'toutiao']);
        expect(getTagTexts()).toEqual([]);
    });

    it('selectAll 配合 changeWithObject 时回传的对象不含内部字段', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({
            multiple: true,
            changeWithObject: true,
            optionList: defaultList,
            onChange,
        });
        await act(() => handle().selectAll());
        const [value] = onChange.mock.calls[0] as [Record<string, unknown>[]];
        expect(value.map((item) => Object.keys(item).filter((key) => key.startsWith('_')))).toEqual([[], [], [], []]);
    });

    it('selectAll 跳过禁用项与被搜索隐藏的项，保留范围外的已选项', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const optionList = [...defaultList, { value: 'hot2', label: 'Hot2', disabled: true }];
        const { handle } = await renderSelect({
            multiple: true,
            filter: true,
            defaultValue: ['abc'],
            optionList,
            onChange,
        });
        await act(() => handle().open());
        await act(() => handle().search('hot'));
        await act(() => handle().selectAll());
        expect(onChange).toHaveBeenLastCalledWith(['abc', 'hotsoon']);
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
    });

    it('selectAll 超过 max 时发出 exceed 且不超选', async () => {
        const onExceed = vi.fn<(option: SelectOptionProps) => void>();
        const { handle } = await renderSelect({ multiple: true, max: 2, optionList: defaultList, onExceed });
        await act(() => handle().selectAll());
        expect(getTagTexts()).toEqual(['Abc', 'Hotsoon']);
        expect(onExceed).toHaveBeenCalledTimes(1);
        expect(onExceed).toHaveBeenCalledWith(expect.objectContaining({ value: 'pipixia' }));
    });

    it('h() 传入的分组含 null、false、undefined 与嵌套数组时正常解析且 key 不重复', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await renderSelect(
            { defaultOpen: true },
            {
                default: () => (
                    <>
                        <SelectOptGroup key="g1" label="G1">
                            {() => [
                                false,
                                null,
                                <SelectOption value="a">{() => 'A'}</SelectOption>,
                                [
                                    <SelectOption key="n1" value="n">
                                        {() => 'N'}
                                    </SelectOption>,
                                ],
                            ]}
                        </SelectOptGroup>
                        <SelectOptGroup key="g2" label="G2">
                            {() => [false, <SelectOption value="b">{() => 'B'}</SelectOption>]}
                        </SelectOptGroup>
                        <SelectOptGroup key="g3" label="G3">
                            {() => [null]}
                        </SelectOptGroup>
                        <SelectOptGroup key="g4" label="G4">
                            {() => [<SelectOption value="c">{() => 'C'}</SelectOption>, undefined]}
                        </SelectOptGroup>
                    </>
                ),
            }
        );
        expect(getOptionTexts()).toEqual(['A', 'N', 'B', 'C']);
        const duplicateKeyWarnings = warn.mock.calls.filter(([message]) => String(message).includes('Duplicate keys'));
        warn.mockRestore();
        expect(duplicateKeyWarnings).toEqual([]);
    });

    it('点击标签关闭时 deselect 收到选项的完整字段', async () => {
        const onDeselect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({
            multiple: true,
            defaultValue: ['abc'],
            optionList: [{ value: 'abc', label: 'Abc', extra: 'x' }],
            onDeselect,
        });
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onDeselect).toHaveBeenCalledWith('abc', expect.objectContaining({ extra: 'x' }));
    });

    it('filter 时 optionList 条目缺 label 不抛错', async () => {
        await renderSelect({
            defaultOpen: true,
            filter: true,
            optionList: [{ value: 'only-value' }, { value: 'b', label: 'Bee' }],
        });
        await search('only');
        expect(getOptions()).toHaveLength(1);
        await search('bee');
        expect(getOptionTexts()).toEqual(['Bee']);
    });

    it('首尾选项禁用时方向键仍然循环', async () => {
        await renderSelect({
            defaultOpen: true,
            optionList: [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D', disabled: true },
            ],
        });
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
        await keyDown('ArrowDown');
        expect(getFocusedOption()).toHaveTextContent(/^B$/);
        await keyDown('ArrowUp');
        expect(getFocusedOption()).toHaveTextContent(/^C$/);
    });

    it('选项内容来自 ref，改 ref 后已选文案随之更新（受控与非受控）', async () => {
        const word = ref('items/page');
        const options = () =>
            [1, 2].map((n) => (
                <SelectOption key={n} value={n}>
                    {() => <span>{`${n} ${word.value}`}</span>}
                </SelectOption>
            ));
        const controlled = await renderSelect({ modelValue: 1 }, { default: options });
        expect(getSelectionText()).toHaveTextContent('1 items/page');
        word.value = 'per page';
        await settle();
        expect(getSelectionText()).toHaveTextContent('1 per page');
        controlled.unmount();

        word.value = 'items/page';
        await renderSelect({ defaultValue: 2 }, { default: options });
        word.value = 'per page';
        await settle();
        expect(getSelectionText()).toHaveTextContent('2 per page');
    });

    it('多选只有搜索词时点击清除不发 change', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        await renderSelect({ multiple: true, filter: true, showClear: true, optionList: defaultList, onChange });
        await click(getTrigger());
        await search('ab');
        await fireEvent.click(document.querySelector(`.${prefixCls}-clear`) as Element);
        await settle();
        expect(getTriggerInput()).toHaveValue('');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('多选无选中项时 deselectAll 不发 change，有选中项时发出', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        const { handle } = await renderSelect({ multiple: true, optionList: defaultList, onChange });
        await act(() => handle().deselectAll());
        expect(onChange).not.toHaveBeenCalled();
        await act(() => handle().selectAll());
        await act(() => handle().deselectAll());
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('defaultOpen 只发一次打开', async () => {
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        await renderSelect({ defaultOpen: true, onDropdownVisibleChange });
        expect(getOptionList()).not.toBeNull();
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('搜索中 optionList 变化后仍按关键字过滤', async () => {
        const { rerender } = await renderSelect({ filter: true, defaultOpen: true, optionList: defaultList });
        await search('new1');
        expect(getOptions()).toHaveLength(0);
        const optionList = [
            { value: 'new1', label: 'New1' },
            { value: 'new2', label: 'New2' },
        ];
        await rerender({ filter: true, defaultOpen: true, optionList });
        expect(getOptionTexts()).toEqual(['New1']);
    });

    it('受控值在搜索中变化时列表仍按关键字过滤', async () => {
        const props = { filter: true, defaultOpen: true, optionList: defaultList };
        const { rerender } = await renderSelect({ ...props, modelValue: 'abc' });
        await search('hot');
        await rerender({ ...props, modelValue: 'pipixia' });
        expect(getOptionTexts()).toEqual(['Hotsoon']);
    });

    it('已关闭时调用 handle.close 不发可见性变化，也不留下旧的关闭回调', async () => {
        const onSearch = vi.fn<(value: string, event?: Event) => void>();
        const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
        const { handle } = await renderSelect({
            filter: true,
            optionList: defaultList,
            onSearch,
            onDropdownVisibleChange,
        });
        await act(() => handle().close());
        await act(() => handle().close());
        await act(() => handle().close());
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        await click(getTrigger());
        await search('ab');
        await keyDown('Escape', {}, getTriggerInput());
        await expectClosed();
        await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith('', expect.objectContaining({ key: 'Escape' })));
        expect(onSearch.mock.calls.filter(([value]) => value === '')).toHaveLength(1);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('size 为 small 时 +N 标签与其余标签同尺寸', async () => {
        await renderSelect({
            multiple: true,
            size: 'small',
            maxTagCount: 1,
            defaultValue: ['abc', 'hotsoon', 'pipixia'],
            optionList: defaultList,
        });
        const restTag = screen.getByText('+2').closest(`.${BASE_CLASS_PREFIX}-tag`);
        expect(restTag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        expect(restTag).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
    });

    it('OptGroup 以 group 角色暴露，名称为分组标题', async () => {
        await renderFixture(Groups, {
            defaultOpen: true,
            groups: [
                { label: 'G1', options: ['A', 'B'] },
                { label: 'G2', options: ['C'] },
            ],
        });
        expect(screen.getAllByRole('group')).toHaveLength(2);
        const g1 = screen.getByRole('group', { name: 'G1' });
        const g2 = screen.getByRole('group', { name: 'G2' });
        expect(
            within(g1)
                .getAllByRole('option')
                .map((option) => option.textContent)
        ).toEqual(['A', 'B']);
        expect(
            within(g2)
                .getAllByRole('option')
                .map((option) => option.textContent)
        ).toEqual(['C']);
        expect(getOptionList()).toContainElement(g1);
    });

    it('changeWithObject 时 select 事件收到原始 value', async () => {
        const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
        await renderSelect({
            defaultOpen: true,
            optionList: [{ value: 'a', label: 'A' }],
            changeWithObject: true,
            onSelect,
        });
        await click(screen.getByRole('option', { name: 'A' }));
        expect(onSelect).toHaveBeenCalledWith('a', expect.objectContaining({ value: 'a', label: 'A' }));
    });

    describe('Vue 写法', () => {
        it('模板中的布尔简写与显式 false', async () => {
            await renderFixture(TemplateOptions, { defaultOpen: true });
            const on = getOptionByText('On') as HTMLElement;
            expect(on).toHaveAttribute('aria-disabled', 'true');
            expect(on.querySelector(`.${prefixCls}-option-icon`)).not.toBeNull();
            const off = getOptionByText('Off') as HTMLElement;
            expect(off).not.toHaveAttribute('aria-disabled', 'true');
            expect(off.querySelector(`.${prefixCls}-option-icon`)).toBeNull();
        });

        it('kebab-case 与空串布尔值规范化为选项字段', async () => {
            await renderSelect(
                { defaultOpen: true },
                {
                    default: () => [h(SelectOption as Component, { value: 'on', disabled: '', 'show-tick': '' }, () => 'On'), h(SelectOption as Component, { value: 'off', disabled: false, 'show-tick': false }, () => 'Off')],
                }
            );
            const on = getOptionByText('On') as HTMLElement;
            expect(on).toHaveAttribute('aria-disabled', 'true');
            expect(on.querySelector(`.${prefixCls}-option-icon`)).not.toBeNull();
            const off = getOptionByText('Off') as HTMLElement;
            expect(off).not.toHaveAttribute('aria-disabled', 'true');
            expect(off.querySelector(`.${prefixCls}-option-icon`)).toBeNull();
        });

        it('v-for 两层 template 与 v-if 的选项随增删同步', async () => {
            const items = reactive(['x', 'y']);
            const { rerender } = await renderFixture(TemplateOptions, {
                defaultOpen: true,
                multiple: true,
                defaultValue: ['x', 'y'],
                items,
            });
            expect(getOptionTexts()).toEqual(['On', 'Off', 'x', 'y', 'Alpha']);
            expect(getTagTexts()).toEqual(['x', 'y']);
            items.push('w');
            await settle();
            expect(getOptionTexts()).toEqual(['On', 'Off', 'x', 'y', 'w', 'Alpha']);
            await rerender({
                defaultOpen: true,
                multiple: true,
                defaultValue: ['x', 'y'],
                items: ['x', 'y', 'z'],
                extra: true,
            });
            expect(getOptionTexts()).toEqual(['On', 'Off', 'x', 'y', 'z', 'Extra', 'Alpha']);
            await rerender({ defaultOpen: true, multiple: true, defaultValue: ['x', 'y'], items: ['y'], extra: false });
            expect(getOptionTexts()).toEqual(['On', 'Off', 'y', 'Alpha']);
            expect(getTagTexts()).toEqual(['x', 'y']);
        });

        it('h() 写法下增删子项后重新收集：插槽内读 ref、数组子项、闭包捕获', async () => {
            const items = ref(['a', 'b']);
            const options = (values: string[]) => values.map((value) => <SelectOption value={value}>{() => value}</SelectOption>);
            const Host = (kind: 'ref' | 'array' | 'closure') =>
                defineComponent({
                    render: () => {
                        const select = (slots: unknown) => h(Select as Component, { defaultOpen: true, motion: false }, slots as never);
                        if (kind === 'array') return select(options(items.value));
                        if (kind === 'closure') {
                            const captured = [...items.value];
                            return select({ default: () => options(captured) });
                        }
                        return select({ default: () => options(items.value) });
                    },
                });
            for (const kind of ['ref', 'array', 'closure'] as const) {
                items.value = ['a', 'b'];
                const view = render(Host(kind));
                await settle();
                expect(getOptionTexts()).toEqual(['a', 'b']);
                items.value = ['a', 'b', 'c'];
                await settle();
                expect(getOptionTexts()).toEqual(['a', 'b', 'c']);
                items.value = ['b'];
                await settle();
                expect(getOptionTexts()).toEqual(['b']);
                view.unmount();
            }
        });

        it('open() 与 close() 只改内部状态，不重读 h() 写的默认插槽', async () => {
            let slotCalls = 0;
            let parentRenders = 0;
            let handle: SelectHandle | null = null;
            const capture = (value: unknown) => {
                handle = value as SelectHandle | null;
            };
            const slots = {
                default: () => {
                    slotCalls += 1;
                    return defaultList.map((option) => h(SelectOption, option));
                },
            };
            render({
                render: () => {
                    parentRenders += 1;
                    return h(Select as Component, { ref: capture, motion: false }, slots);
                },
            });
            await settle();
            slotCalls = 0;
            await act(() => handle?.open());
            expect(getOptionTexts()).toEqual(['Abc', 'Hotsoon', 'Pipixia', 'TopBuzz']);
            await act(() => handle?.close());
            expect(getOptionList()).toBeNull();
            expect(parentRenders).toBe(1);
            expect(slotCalls).toBe(0);
        });

        it('默认插槽里的元素与裸文本被忽略', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await renderFixture(Mixed, { defaultOpen: true, invalid: true });
            expect(getOptionTexts()).toEqual(['A', 'B']);
            warn.mockRestore();
        });

        it('选项默认插槽为节点时，行、单选触发器与多选标签都渲染该节点，载荷不含 _slot', async () => {
            const onChange = vi.fn<(value: unknown) => void>();
            const { unmount } = await renderFixture(TemplateOptions, {
                defaultOpen: true,
                changeWithObject: true,
                onChange,
            });
            const row = getOptions().find((option) => option.querySelector('b')) as HTMLElement;
            expect(row.querySelector('b')).toHaveTextContent(/^Alpha$/);
            await click(row);
            expect(getSelectionText()?.querySelector('b')).toHaveTextContent(/^Alpha$/);
            expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'markup' }));
            expect(onChange.mock.calls[0][0]).not.toHaveProperty('_slot');
            unmount();

            await renderFixture(TemplateOptions, { multiple: true, defaultValue: ['markup'] });
            expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content b`)).toHaveTextContent(/^Alpha$/);
        });

        it('optionList 非空时优先于默认插槽，为空数组时用默认插槽', async () => {
            const slot = { default: () => [<SelectOption value="slot">{() => 'From slot'}</SelectOption>] };
            const { unmount } = await renderSelect({ defaultOpen: true, optionList: [{ value: 'list', label: 'From list' }] }, slot);
            expect(getOptionTexts()).toEqual(['From list']);
            unmount();
            await renderSelect({ defaultOpen: true, optionList: [] }, slot);
            expect(getOptionTexts()).toEqual(['From slot']);
        });

        it.each([
            ['简写', { changeWithObject: '' }],
            ['绑定', { changeWithObject: true }],
            ['kebab-case 绑定', { 'change-with-object': true }],
            ['kebab-case 简写', { 'change-with-object': '' }],
        ])('changeWithObject 的%s写法都生效，change 监听照常', async (_name, attrs) => {
            // The props a template compiles each spelling into, passed straight to the Select
            const onChange = vi.fn<(value: unknown) => void>();
            const props = { defaultOpen: true, motion: false, optionList: defaultList, onChange, ...attrs };
            render(() => <ConfigProvider locale={en_US}>{() => h(Select as Component, props)}</ConfigProvider>);
            await settle();
            await click(getOptionByText('Abc') as HTMLElement);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'abc', label: 'Abc' }));
        });

        it('attrs 落点：class、style、data-* 与监听器在根元素，aria-label 跟随 combobox，style 不进弹层', async () => {
            const onMouseenter = vi.fn<(event: MouseEvent) => void>();
            const attrs = {
                class: 'outer',
                style: { color: 'red' },
                'data-testid': 'sel',
                'aria-label': 'Fruit',
                onMouseenter,
            };
            const { unmount } = await renderSelect({ ...attrs, defaultOpen: true });
            expect(getRoot()).toHaveClass('outer');
            expect(getRoot()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(screen.getByTestId('sel')).toBe(getTrigger());
            expect(getTrigger()).toHaveAccessibleName('Fruit');
            await userEvent.hover(getRoot());
            expect(onMouseenter).toHaveBeenCalled();
            expect(getPopover().getAttribute('style') ?? '').not.toContain('red');
            unmount();

            await renderSelect({ ...attrs, filter: true });
            expect(getRoot()).toHaveAttribute('aria-label', 'Fruit');
            await click(getRoot());
            expect(getTriggerInput()).toHaveAttribute('aria-label', 'Fruit');
            expect(getRoot()).not.toHaveAttribute('aria-label');
            expect(screen.getByTestId('sel')).toBe(getRoot());
        });

        it('在搜索框输入时 change 只收到组件载荷，不收到原生事件', async () => {
            const onChange = vi.fn<(value: unknown) => void>();
            await renderSelect({ filter: true, onChange });
            await click(getTrigger());
            await userEvent.type(getTriggerInput(), 'ab');
            await settle();
            expect(onChange).not.toHaveBeenCalled();
            await click(getOptionByText('Abc') as HTMLElement);
            expect(onChange.mock.calls).toEqual([['abc']]);
        });

        it('#trigger 插槽参数只有约定的字段，componentProps 是组件 props', async () => {
            const trigger = vi.fn<(scope: Record<string, unknown>) => unknown>(() => <div>custom</div>);
            await renderSelect({ placeholder: 'Pick', filter: true, defaultValue: 'abc' }, { trigger, prefix: () => 'P' });
            const scope = trigger.mock.lastCall?.[0] as Record<string, unknown>;
            expect(Object.keys(scope).sort()).toEqual(['componentProps', 'disabled', 'inputValue', 'onClear', 'onRemove', 'onSearch', 'placeholder', 'value'].sort());
            expect(scope).toEqual(expect.objectContaining({ placeholder: 'Pick', disabled: false, inputValue: '' }));
            expect(scope.componentProps).toEqual(expect.objectContaining({ placeholder: 'Pick', filter: true }));
            expect(scope.componentProps).not.toHaveProperty('prefix');
        });

        it('#selectedItem 与 #tag 同时给出时 #tag 优先', async () => {
            await renderSelect(
                { multiple: true, defaultValue: ['abc'] },
                {
                    selectedItem: () => 'from selectedItem',
                    tag: ({ option }) => <span class="custom-tag">{`tag ${String((option as SelectOptionProps).label)}`}</span>,
                }
            );
            expect(document.querySelector('.custom-tag')).toHaveTextContent(/^tag Abc$/);
            expect(screen.queryByText('from selectedItem')).toBeNull();
        });

        it('空的 #arrowIcon 隐藏箭头', async () => {
            await renderSelect({}, { arrowIcon: () => [] });
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).toBeNull();
            expect(document.querySelector(`.${prefixCls}-arrow`)?.children).toHaveLength(0);
        });

        it('KeepAlive 内失活时关闭弹层且不发 blur', async () => {
            const shown = ref(true);
            const onBlur = vi.fn<(event: Event) => void>();
            const Other = defineComponent({ render: () => <div>other</div> });
            render(() => (
                <ConfigProvider locale={en_US}>
                    {() => (
                        <KeepAlive>
                            {{
                                default: () => (shown.value ? <Basic defaultOpen onBlur={onBlur} /> : <Other />),
                            }}
                        </KeepAlive>
                    )}
                </ConfigProvider>
            ));
            await settle();
            expect(getOptionList()).not.toBeNull();
            shown.value = false;
            await settle();
            await expectClosed();
            shown.value = true;
            await settle();
            expect(getRoot()).toHaveAttribute('aria-expanded', 'false');
            expect(getOptionList()).toBeNull();
            expect(onBlur).not.toHaveBeenCalled();
        });

        it('Select.Option 与 Select.OptGroup 即具名导出', () => {
            expect(Select.Option).toBe(SelectOption);
            expect(Select.OptGroup).toBe(SelectOptGroup);
        });

        it('全局 filter 为函数时生效', async () => {
            semiGlobal.config.overrideDefaultProps = {
                Select: { filter: (_input: string, option: SelectOptionProps) => option.value === 'hotsoon' },
            };
            await renderSelect({ defaultOpen: true });
            await search('a');
            expect(getOptionTexts()).toEqual(['Hotsoon']);
        });

        it('组件先处理按键再发 keydown，监听器里 preventDefault 不影响组件', async () => {
            const calls: string[] = [];
            await renderSelect({
                onDropdownVisibleChange: () => calls.push('visible'),
                onKeydown: (event: KeyboardEvent) => {
                    calls.push('keydown');
                    event.preventDefault();
                },
            });
            await keyDown('ArrowDown');
            expect(calls).toEqual(['visible', 'keydown']);
            expect(getOptionList()).not.toBeNull();
        });

        it('h() 传入的子项挂载时最多告警一次，模板子项不告警', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { unmount } = await renderFixture(TemplateOptions, { defaultOpen: true });
            expect(warn).not.toHaveBeenCalled();
            unmount();
            await renderSelect(
                { defaultOpen: true },
                {
                    default: () => (
                        <>
                            <SelectOption value="a">{() => 'A'}</SelectOption>
                            <SelectOption value="b">{() => 'B'}</SelectOption>
                        </>
                    ),
                }
            );
            expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
            warn.mockRestore();
        });
    });

    describe('回调参数与禁用、键盘细节', () => {
        it('onCreate 与 select 事件收到的创建项不带内部字段', async () => {
            const onCreate = vi.fn<(option: SelectOptionProps) => void>();
            const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
            await renderSelect({ allowCreate: true, filter: true, defaultOpen: true, optionList: defaultList, onCreate, onSelect });
            await search('new');
            await click(getOptions()[0]);
            expect(onCreate.mock.calls[0][0]).toEqual({ value: 'new', label: 'new' });
            expect(onSelect.mock.calls[0][1]).toEqual({ value: 'new', label: 'new' });
        });

        it('鼠标点选与 Enter 交给 select 事件的选项对象相同', async () => {
            const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
            const optionList = [
                { value: 'a', label: 'A', class: 'row' },
                { value: 'b', label: 'B', class: 'row' },
            ];
            await renderSelect({ multiple: true, defaultOpen: true, optionList, onSelect });
            await click(getOptionByText('A') as Element);
            await keyDown('ArrowDown');
            await keyDown('Enter');
            expect(onSelect.mock.calls.map(([, option]) => option)).toEqual(optionList);
        });

        it('optionItem 插槽的点击交给 select 事件完整的选项对象', async () => {
            const onSelect = vi.fn<(value: unknown, option: SelectOptionProps) => void>();
            await renderSelect(
                { defaultOpen: true, optionList: [{ value: 'a', label: 'A', class: 'row' }], onSelect },
                {
                    optionItem: (scope) => (
                        <div id={scope.id} role="option" onClick={scope.onClick}>
                            A
                        </div>
                    ),
                }
            );
            await click(getOptions()[0]);
            expect(onSelect.mock.calls[0][1]).toEqual({ value: 'a', label: 'A', class: 'row' });
        });

        it('没有选中值时默认高亮第一个可用选项，跳过禁用项', async () => {
            const optionList = [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B' },
            ];
            const { rerender } = await renderSelect({ optionList });
            await click(getTrigger());
            expect(getFocusedOption()).toHaveTextContent('B');
            await rerender({ optionList: [{ value: 'c', label: 'C', disabled: true }, ...optionList] });
            expect(getFocusedOption()).toHaveTextContent('B');
        });

        it('禁用时 defaultOpen 与 autofocus 不打开下拉，也不发出 dropdownVisibleChange', async () => {
            const onDropdownVisibleChange = vi.fn<(visible: boolean) => void>();
            await renderSelect({ disabled: true, defaultOpen: true, onDropdownVisibleChange });
            await renderSelect({ disabled: true, autofocus: true, filter: true, onDropdownVisibleChange });
            expect(getOptionList()).toBeNull();
            expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        });

        it('焦点在面板插槽内的可聚焦元素上时，Esc 关闭下拉并把焦点交回触发器', async () => {
            await renderSelect({ optionList: defaultList }, { innerBottomSlot: () => <button type="button">slot</button> });
            await click(getTrigger());
            const slotButton = screen.getByRole('button', { name: 'slot' });
            slotButton.focus();
            const escape = createEvent.keyDown(slotButton, { key: 'Escape' });
            await fireEvent(slotButton, escape);
            expect(escape.defaultPrevented).toBe(true);
            await expectClosed();
            expect(getTrigger()).toHaveFocus();
        });

        it('根元素上使用方的 click 监听照常调用，下拉仍能打开', async () => {
            const onClick = vi.fn<(event: MouseEvent) => void>();
            await renderSelect({ onClick });
            await click(getTrigger());
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(getOptionList()).not.toBeNull();
        });

        it('加载中 combobox 不输出 aria-activedescendant', async () => {
            await renderSelect({ filter: true, multiple: true, defaultOpen: true, loading: true, optionList: defaultList });
            expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
        });

        it('virtualize 时滚动虚拟列表发出 listScroll', async () => {
            const onListScroll = vi.fn<(event: Event) => void>();
            const optionList = Array.from({ length: 300 }, (_, i) => ({ value: i, label: `option-${i}` }));
            await renderSelect({ defaultOpen: true, optionList, virtualize: { itemSize: 36, height: 270 }, onListScroll });
            const scroller = getOptionList()?.firstElementChild as HTMLElement;
            scroller.scrollTop = 360;
            await fireEvent.scroll(scroller);
            expect(onListScroll).toHaveBeenCalledTimes(1);
            expect(onListScroll.mock.calls[0][0].target).toBe(scroller);
        });

        it('size 为 default 时多选标签与其他组件一样为 large', async () => {
            await renderSelect({ multiple: true, size: 'default', defaultValue: ['abc'], optionList: defaultList });
            expect(document.querySelector(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`);
        });

        it('optionList 过滤时留下的选项保持同一个节点', async () => {
            await renderSelect({
                filter: true,
                defaultOpen: true,
                optionList: [
                    { value: 'a', label: 'a1' },
                    { value: 'b', label: 'b1' },
                ],
            });
            const before = getOptionByText('b1');
            await search('b');
            expect(getOptionTexts()).toEqual(['b1']);
            expect(getOptionByText('b1')).toBe(before);
        });

        it('inputProps 带 ref 时搜索框照常获得焦点，使用方的 ref 也拿到 Input', async () => {
            const inputRef = ref<unknown>(null);
            await renderSelect({ filter: true, optionList: defaultList, inputProps: { ref: inputRef } });
            await click(getTrigger());
            expect(getTriggerInput()).toHaveFocus();
            expect(inputRef.value).not.toBeNull();
        });

        it('下拉打开时在触发器内的 +N 浮层里按下鼠标，不关闭下拉也不发出 blur', async () => {
            const onBlur = vi.fn<(event: Event) => void>();
            await renderSelect({ multiple: true, maxTagCount: 1, showRestTagsPopover: true, defaultValue: ['abc', 'hotsoon'], optionList: defaultList, onBlur });
            await click(getTrigger());
            await userEvent.hover(screen.getByText('+1'));
            const restTag = await waitFor(() => {
                const tag = screen.getAllByText('Hotsoon').find((node) => !getRoot().contains(node) && !getOptionList()?.contains(node));
                expect(tag).toBeDefined();
                return tag as Element;
            });
            await fireEvent.mouseDown(restTag);
            await settle();
            expect(getOptionList()).not.toBeNull();
            expect(onBlur).not.toHaveBeenCalled();
        });

        it('在面板内已打开的嵌套 Popover 里按下鼠标不关闭下拉，在外部按下才关闭', async () => {
            await renderSelect(
                { defaultOpen: true },
                {
                    innerBottomSlot: () => (
                        <Popover ariaLabel="Nested" motion={false} trigger="custom" visible>
                            {{
                                default: () => <button type="button">nested trigger</button>,
                                content: () => <button type="button">inside nested</button>,
                            }}
                        </Popover>
                    ),
                }
            );
            await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
            await settle();
            expect(getOptionList()).not.toBeNull();
            await fireEvent.mouseDown(document.body);
            await waitFor(() => expect(getOptionList()).toBeNull());
        });

        it('SelectOptGroup 里不是 SelectOption 的子节点被忽略并告警', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            await renderSelect(
                { defaultOpen: true },
                {
                    default: () => [<SelectOptGroup label="G">{() => ['text', <span>node</span>, <SelectOption value="a">{() => 'A'}</SelectOption>]}</SelectOptGroup>],
                }
            );
            expect(getOptionTexts()).toEqual(['A']);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('Select.OptGroup'));
        });
    });
});
