/** @jsxImportSource vue */
import { defineComponent, ref, type VNodeChild } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { type Mock, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Select, { SelectOptGroup, SelectOption, type SelectOptionProps } from '..';
import Button from '../../button';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-select`;
const options = [
    { value: 'abc', label: '抖音' },
    { value: 'ulikecam', label: '轻颜相机' },
    { value: 'jianying', label: '剪映' },
    { value: 'xigua', label: '西瓜视频' },
];
const clearName = en_US.Select.clear;

const mount = (node: () => VNodeChild) => render(() => <ConfigProvider locale={en_US}>{node}</ConfigProvider>);
const getOption = (text: string) => screen.getAllByRole('option').find((option) => option.textContent === text);
const getOptionList = () => screen.queryByRole('listbox');
const getOptionTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-option`), (option) => option.textContent);
const getGroupTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-group`), (group) => group.textContent);
const getFocusedText = () => document.querySelector(`.${prefixCls}-option-focused .${prefixCls}-option-text`)?.textContent;
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((tag) => tag.textContent);
// An autofocus Select opens by itself, and its listbox shares the combobox name: the click locator is generated from
// the element, so it must be generated after the list exists or the listbox appearing mid-click makes it ambiguous
async function clickAutofocusedSelect() {
    await waitFor(() => expect(getOptionList()).not.toBeNull());
    await userEvent.click(screen.getByRole('combobox'));
}
const byCy = (name: string) => document.querySelector(`[data-cy=${name}]`) as HTMLElement;

async function expectEverySelectionAccountedFor(selectedCount: number, restCount?: number) {
    await waitFor(() => {
        const texts = getTagTexts();
        const rest = texts.find((text) => /^\+\d+$/.test(text ?? '')) ?? '+0';
        expect(rest).toBe(restCount === undefined ? rest : `+${restCount}`);
        expect(texts.filter((text) => text !== rest).length + Number(rest.slice(1))).toBe(selectedCount);
    });
}

async function toggle(label: string) {
    if (!getOptionList()) {
        await userEvent.click(document.querySelector(`.${prefixCls}-arrow`) as HTMLElement);
    }
    await userEvent.click(getOption(label) as HTMLElement);
}

const renderEllipsisSelect = (props: Record<string, unknown>) => mount(() => <Select multiple ellipsisTrigger motion={false} optionList={options} showRestTagsPopover {...props} />);

describe('Select（浏览器）', () => {
    it('触发器移动但没有滚动或尺寸变化时，下拉层自动跟随', async () => {
        mount(() => (
            <div data-testid="box" style={{ position: 'fixed', left: '100px', top: '100px' }}>
                <Select motion={false} optionList={options} style={{ width: '120px' }} />
            </div>
        ));
        const trigger = document.querySelector(`.${prefixCls}`) as HTMLElement;
        await userEvent.click(trigger);
        const popup = (await screen.findByRole('listbox')).closest('[popover]') as HTMLElement;
        await waitFor(() => expect(Math.abs(popup.getBoundingClientRect().left - trigger.getBoundingClientRect().left)).toBeLessThanOrEqual(1));
        screen.getByTestId('box').style.left = '300px';
        await waitFor(() => expect(Math.abs(popup.getBoundingClientRect().left - 300)).toBeLessThanOrEqual(1));
    });

    it('新增选项时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({ maxTagCount: 3, style: { width: '255px' }, defaultValue: ['abc', 'ulikecam', 'xigua'] });
        await expectEverySelectionAccountedFor(3, 0);
        await toggle('剪映');
        await expectEverySelectionAccountedFor(4, 2);
    });

    it('超出 maxTagCount 的标签变化时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({
            maxTagCount: 2,
            style: { width: '240px' },
            defaultValue: ['xigua', 'ulikecam', 'jianying', 'abc'],
        });
        await expectEverySelectionAccountedFor(4, 2);
        await toggle('西瓜视频');
        await expectEverySelectionAccountedFor(3, 1);
        await toggle('西瓜视频');
        await expectEverySelectionAccountedFor(4, 2);
    });

    it('移除可见选项时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({ maxTagCount: 3, style: { width: '255px' }, defaultValue: ['abc', 'ulikecam', 'xigua'] });
        await toggle('剪映');
        await expectEverySelectionAccountedFor(4, 2);
        await toggle('抖音');
        await expectEverySelectionAccountedFor(3);
    });
});

const filterOptions = [
    { value: 1, label: 'opt1' },
    { value: 2, label: 'disabled', disabled: true },
    { value: 3, label: 'Lucy' },
    { value: '4', label: 'bay' },
    { value: '5', label: 'sert' },
    { value: '6', label: 'wym' },
    { value: '7', label: 'meno', disabled: true },
    { value: '8', label: 'opts' },
];
const renderFilterSingle = (props: Record<string, unknown> = {}) =>
    mount(() => (
        <div>
            <h5>Default filter</h5>
            <Select style={{ width: '250px', margin: '10px' }} autofocus filter showClear {...props}>
                {() =>
                    filterOptions.map(({ label, ...option }) => (
                        <SelectOption key={option.value} {...option}>
                            {() => label}
                        </SelectOption>
                    ))
                }
            </Select>
        </div>
    ));

const blurCases: [string, Record<string, unknown>][] = [
    ['singleDefault', {}],
    ['singleFilter', { filter: true }],
    ['singleAutoFocus', { autofocus: true }],
    ['singleClickToHide', { clickToHide: true }],
    ['singleShowClear', { showClear: true }],
    ['multipleDefault', { multiple: true }],
    ['multipleFilter', { multiple: true, filter: true }],
    ['multipleClickToHide', { multiple: true, clickToHide: true }],
    ['multipleShowClear', { multiple: true, showClear: true }],
];
// Testing Library's render moves the mounted nodes out of the Vue Test Utils wrapper (`replaceWith`), which drops the
// focus autofocus just placed: Chromium reports that as a blur, Firefox and WebKit silently move focus to the body.
// Refocusing and clearing the spy keeps the outside-click assertions about the autofocused Select meaningful everywhere.
const renderAllCaseOfBlur = (onBlur: Mock<(name: string) => void>) => {
    mount(() => (
        <div>
            {blurCases.map(([name, props]) => (
                <div key={name}>
                    <h5>{name}</h5>
                    <Select style={{ width: '120px' }} data-cy={name} defaultValue="abc" onBlur={() => onBlur(name)} {...props}>
                        {() => (
                            <>
                                <SelectOption value="abc">{() => '抖音'}</SelectOption>
                                <SelectOption value="ulikecam">{() => '轻颜相机'}</SelectOption>
                                <SelectOption value="jianying" disabled>
                                    {() => '剪映'}
                                </SelectOption>
                                <SelectOption value="xigua">{() => '西瓜视频'}</SelectOption>
                            </>
                        )}
                    </Select>
                </div>
            ))}
        </div>
    ));
    byCy('singleAutoFocus').focus();
    onBlur.mockClear();
};

async function blurByOutsideClick(onBlur: (name: string) => void, name: string, pickOption: boolean) {
    await userEvent.click(byCy(name));
    if (pickOption) {
        await userEvent.click((await screen.findAllByRole('option'))[1] as HTMLElement);
    }
    await clickOutside();
    await waitFor(() => expect(onBlur).toHaveBeenCalledWith(name));
    await waitFor(() => expect(getOptionList()).toBeNull());
}

describe('Select', () => {
    it('选项悬停，切换 active 项', async () => {
        renderFilterSingle();
        await clickAutofocusedSelect();
        await waitFor(() => expect(getOptionList()).not.toBeNull());
        await userEvent.hover(document.querySelectorAll(`.${prefixCls}-option`)[5] as HTMLElement);
        await waitFor(() => expect(getFocusedText()).toBe('wym'));
        // A real pointer left on the list would re-focus whichever option scrolls under it once ArrowDown scrolls the
        // list, so move it away
        await userEvent.hover(screen.getByText('Default filter'));
        expect(getFocusedText()).toBe('wym');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getFocusedText()).toBe('opts'));
    });

    it('键盘 Enter 选择选项', async () => {
        renderFilterSingle();
        await clickAutofocusedSelect();
        await userEvent.keyboard('o{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-selection-text`)).toMatchTextContent(/^opt1$/));
    });

    it('打开后按 Space 选中高亮项并关闭', async () => {
        const onChange = vi.fn<(value: unknown) => void>();
        mount(() => <Select optionList={options} onChange={onChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getFocusedText()).toBe('轻颜相机'));
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith('ulikecam'));
        await waitFor(() => expect(getOptionList()).toBeNull());
    });

    it('点击外部时隐藏', async () => {
        const onBlur = vi.fn<() => void>();
        renderFilterSingle({ onBlur });
        await clickAutofocusedSelect();
        await waitFor(() => expect(getOptionList()).not.toBeNull());
        await userEvent.click(screen.getByText('Default filter'));
        await waitFor(() => expect(getOptionList()).toBeNull());
        expect(onBlur).toHaveBeenCalled();
    });

    it('空的 #emptyContent 时', async () => {
        mount(() => (
            <Select style={{ width: '180px' }} defaultOpen>
                {{ emptyContent: () => [] }}
            </Select>
        ));
        const wrapper = await waitFor(() => {
            const node = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });
        expect(getComputedStyle(wrapper).height).toBe('0px');
    });

    it('autoClearSearchValue 为 false，远程搜索，optionList 异步更新', async () => {
        const optionList = [1, 2, 3, 4, 5, 6].map((n) => ({ label: `semi${n}`, value: `semi${n}` }));
        const Demo = defineComponent(() => {
            const loading = ref(false);
            const list = ref(optionList);
            const value = ref<string[]>([]);
            const handleSearch = (inputValue: string) => {
                loading.value = true;
                if (inputValue) {
                    setTimeout(() => {
                        loading.value = false;
                        list.value = [{ label: 'Design', value: '123456' }];
                    }, 300);
                } else {
                    list.value = optionList;
                    loading.value = false;
                }
            };
            return () => <Select class="remote-select" style={{ width: '400px' }} multiple modelValue={value.value} autoClearSearchValue={false} filter loading={loading.value} optionList={list.value} remote onUpdate:modelValue={(next: unknown) => (value.value = next as string[])} onSearch={handleSearch} />;
        });
        mount(() => <Demo />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click((await screen.findAllByRole('option'))[0] as HTMLElement);
        expect(document.querySelector(`.remote-select .${BASE_CLASS_PREFIX}-input`)).toHaveFocus();
        await userEvent.keyboard('123');
        await waitFor(() => expect(getOptionTexts()).toEqual(['Design']));
    });

    it('未设置 key 的分组过滤', async () => {
        mount(() => (
            <Select id="without-key" style={{ width: '180px' }} placeholder="without key" filter={(input: string, option: SelectOptionProps) => String(option.label).toUpperCase().includes(input.toUpperCase())} showClear>
                {() => (
                    <>
                        <SelectOptGroup label="Group1">
                            {() => (
                                <>
                                    <SelectOption value="douyin">{() => 'Douyin'}</SelectOption>
                                    <SelectOption value="ulikecam">{() => 'Ulikecam'}</SelectOption>
                                </>
                            )}
                        </SelectOptGroup>
                        <SelectOptGroup label="Group2">
                            {() => (
                                <>
                                    <SelectOption value="jianying">{() => 'Capcut'}</SelectOption>
                                    <SelectOption value="xigua">{() => 'Xigua'}</SelectOption>
                                </>
                            )}
                        </SelectOptGroup>
                    </>
                )}
            </Select>
        ));
        await userEvent.click(document.getElementById('without-key') as HTMLElement);
        expect(document.querySelector(`#without-key .${BASE_CLASS_PREFIX}-input`)).toHaveFocus();
        await userEvent.keyboard('dou');
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-option-keyword`)).toMatchTextContent(/^Dou$/));
        expect(getGroupTexts()).toEqual(['Group1']);

        await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
        await waitFor(() => expect(getGroupTexts()).toEqual(['Group1', 'Group2']));
        expect(getOptionTexts()).toEqual(['Douyin', 'Ulikecam', 'Capcut', 'Xigua']);
    });

    it('选择选项后鼠标点击外部发出 blur', async () => {
        const onBlur = vi.fn<(name: string) => void>();
        renderAllCaseOfBlur(onBlur);
        await blurByOutsideClick(onBlur, 'singleDefault', true);
        expect(onBlur).toHaveBeenCalledWith('singleAutoFocus');
        for (const name of ['singleFilter', 'singleClickToHide', 'singleShowClear', 'multipleDefault', 'multipleFilter', 'multipleClickToHide']) {
            await blurByOutsideClick(onBlur, name, true);
        }
    });

    it('未选择选项时鼠标点击外部发出 blur', async () => {
        const onBlur = vi.fn<(name: string) => void>();
        renderAllCaseOfBlur(onBlur);
        await blurByOutsideClick(onBlur, 'singleDefault', false);
        expect(onBlur).toHaveBeenCalledWith('singleAutoFocus');
        for (const name of ['singleFilter', 'singleClickToHide', 'singleShowClear']) {
            await blurByOutsideClick(onBlur, name, false);
        }
        await blurByOutsideClick(onBlur, 'multipleDefault', true);
        for (const name of ['multipleFilter', 'multipleClickToHide']) {
            await blurByOutsideClick(onBlur, name, false);
        }
    });

    it('受控多选 changeWithObject，列表外的值其余字段变化时重新渲染', async () => {
        interface Item {
            label: string;
            value: string;
            otherProps: string;
        }
        const value = ref<Item[]>([{ label: 'AA-Label', value: 'AA', otherProps: 'AA-OtherProps' }]);
        mount(() => (
            <>
                <Select style={{ width: '320px' }} multiple modelValue={value.value} filter changeWithObject onUpdate:modelValue={(next: unknown) => (value.value = next as Item[])}>
                    {{
                        tag: ({ option }: { option: SelectOptionProps }) => <div class="render-content">{`${String(option.label)}-${String(option.otherProps)}`}</div>,
                    }}
                </Select>
                <Button onClick={() => (value.value = [{ label: 'AA-Label-2', value: 'AA', otherProps: 'AA-OtherProps-2' }])}>{() => 'change'}</Button>
            </>
        ));
        const content = () => document.querySelector('.render-content');
        expect(content()).toMatchTextContent(/^AA-Label-AA-OtherProps$/);
        await userEvent.click(screen.getByRole('button', { name: 'change' }));
        await waitFor(() => expect(content()).toMatchTextContent(/^AA-Label-2-AA-OtherProps-2$/));
    });

    it('受控单选，选项默认插槽为相同文本的节点', async () => {
        const value = ref<string>();
        const option = (cy: string | undefined, optionValue: string, text: string) => (
            <SelectOption key={optionValue} data-cy={cy} value={optionValue}>
                {() => <div>{text}</div>}
            </SelectOption>
        );
        mount(() => (
            <Select style={{ width: '180px' }} data-cy="singleControl" modelValue={value.value} onUpdate:modelValue={(next: unknown) => (value.value = next as string)}>
                {() => (
                    <>
                        <SelectOptGroup label="Asia">{() => [option('a-1', 'a-1', 'China'), option('a-2', 'a-2', 'China'), option(undefined, 'a-3', 'Korea')]}</SelectOptGroup>
                        <SelectOptGroup label="Europe">{() => [option(undefined, 'b-1', 'Germany'), option(undefined, 'b-2', 'France')]}</SelectOptGroup>
                    </>
                )}
            </Select>
        ));
        const selectedCls = `${prefixCls}-option-selected`;
        const reopen = async () => {
            await clickOutside();
            await waitFor(() => expect(getOptionList()).toBeNull());
            await userEvent.click(byCy('singleControl'));
        };

        await userEvent.click(byCy('singleControl'));
        await waitFor(() => expect(byCy('a-1')).not.toBeNull());
        await userEvent.click(byCy('a-1'));
        await waitFor(() => expect(byCy('singleControl')).toHaveTextContent('China'));

        await reopen();
        await waitFor(() => expect(byCy('a-1')).toHaveClass(selectedCls));
        await userEvent.click(byCy('a-2'));
        await waitFor(() => expect(byCy('singleControl')).toHaveTextContent('China'));

        await reopen();
        await waitFor(() => expect(byCy('a-2')).toHaveClass(selectedCls));
    });

    it('#optionItem，键盘上下键', async () => {
        const labels = ['Doubao-Pro-4k', 'Doubao-Pro-32K', 'Doubao-Pro-128K', 'Doubao-Lite-4K', 'Doubao-Lite-32K', 'Doubao-Lite-128K', 'GPT-4', 'GPT-4-32K'];
        const optionList = labels.map((label, index) => ({ value: label, label, 'data-cy': `option-${index + 1}` }));
        mount(() => (
            <Select style={{ width: '450px' }} data-cy="multiple" multiple filter maxHeight={180} optionList={optionList}>
                {{
                    optionItem: (scope: Record<string, unknown>) => {
                        const { focused, label, class: className, selected, disabled, inputValue, value, ...rest } = scope;
                        return (
                            <div {...rest} class={['custom-option-render', { 'custom-option-render-focused': focused }, className]}>
                                {String(label)}
                            </div>
                        );
                    },
                }}
            </Select>
        ));
        await userEvent.click(byCy('multiple'));
        await waitFor(() => expect(byCy('option-1')).not.toBeNull());
        for (const index of [2, 3, 4, 5, 6, 7, 8, 1]) {
            await userEvent.keyboard('{ArrowDown}');
            await waitFor(() => expect(byCy(`option-${index}`)).toHaveClass('custom-option-render-focused'));
        }
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(byCy('option-8')).toHaveClass('custom-option-render-focused'));
    });

    describe('aria-activedescendant 跟随方向键指向已渲染且可见的选项', () => {
        const many = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `option ${i}` }));
        const expectActiveInView = async (name: RegExp) => {
            const combobox = screen.getByRole('combobox');
            await waitFor(() => {
                const active = document.getElementById(combobox.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
                expect(active).toMatchTextContent(name);
                const list = screen.getByRole('listbox').getBoundingClientRect();
                const row = active.getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(list.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(list.bottom + 1);
            });
        };

        it('虚拟列表中，超出已渲染行的选项', async () => {
            mount(() => <Select style={{ width: '200px' }} optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await screen.findAllByRole('option');
            for (let i = 0; i < 30; i++) {
                await userEvent.keyboard('{ArrowDown}');
            }
            await expectActiveInView(/^option 30$/);
        });

        it('分组列表中，分组标题位于选项之间', async () => {
            mount(() => (
                <Select style={{ width: '200px' }}>
                    {() =>
                        Array.from({ length: 15 }, (_, g) => (
                            <SelectOptGroup key={g} label={`group ${g}`}>
                                {() =>
                                    many.slice(g * 2, g * 2 + 2).map((o) => (
                                        <SelectOption key={o.value} value={o.value}>
                                            {() => o.label}
                                        </SelectOption>
                                    ))
                                }
                            </SelectOptGroup>
                        ))
                    }
                </Select>
            ));
            await userEvent.click(screen.getByRole('combobox'));
            await screen.findAllByRole('option');
            for (let i = 0; i < 25; i++) {
                await userEvent.keyboard('{ArrowDown}');
            }
            await expectActiveInView(/^option 25$/);
        });
    });

    it('大列表输入后立即按 Enter，选中项就是 activedescendant 指向的项，且匹配关键字', async () => {
        const list = Array.from({ length: 5000 }, (_, i) => ({ value: i, label: `Option ${i}` }));
        mount(() => <Select style={{ width: '200px' }} filter optionList={list} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        let activeAtEnter: string | undefined;
        const record = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const id = (event.target as HTMLElement).getAttribute('aria-activedescendant');
                activeAtEnter = id ? (document.getElementById(id)?.textContent ?? undefined) : undefined;
            }
        };
        document.addEventListener('keydown', record, true);
        try {
            await userEvent.keyboard('1{Enter}');
        } finally {
            document.removeEventListener('keydown', record, true);
        }
        expect(activeAtEnter).toMatch(/1/);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-selection-text`)).toHaveTextContent(activeAtEnter as string));
    });

    it('虚拟列表本身不是 Tab 停留点', async () => {
        const many = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `option ${i}` }));
        mount(() => <Select optionList={many} virtualize={{ itemSize: 36 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        expect(screen.getByRole('listbox').querySelector('[style*="overflow"]')).toHaveAttribute('tabindex', '-1');
    });

    describe('虚拟列表的滚动', () => {
        const many = Array.from({ length: 100 }, (_, i) => ({ value: i, label: `option ${i}` }));
        const optionNamed = (name: string) => screen.queryByRole('option', { name });
        const scroller = () => screen.getByRole('listbox').querySelector<HTMLElement>('[style*="overflow"]') as HTMLElement;

        it('用户滚动容器后，渲染的选项随之变化', async () => {
            mount(() => <Select optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await screen.findAllByRole('option');
            expect(optionNamed('option 0')).not.toBeNull();

            scroller().scrollTop = 36 * 50;
            await waitFor(() => expect(optionNamed('option 50')).not.toBeNull());
            expect(optionNamed('option 0')).toBeNull();
        });

        it('关闭时按 End 打开，把最后一项滚进可视区', async () => {
            mount(() => <Select optionList={many} virtualize={{ itemSize: 36 }} />);
            screen.getByRole('combobox').focus();
            await userEvent.keyboard('{End}');
            await waitFor(() => expect(optionNamed('option 99')).not.toBeNull());
            await waitFor(() => {
                const row = (optionNamed('option 99') as HTMLElement).getBoundingClientRect();
                const box = scroller().getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
            });
        });

        it('打开时滚到已选项', async () => {
            mount(() => <Select defaultValue={50} optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(optionNamed('option 50')).not.toBeNull());
            await waitFor(() => {
                const row = (optionNamed('option 50') as HTMLElement).getBoundingClientRect();
                const box = scroller().getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
            });
        });
    });

    it('悬停或键盘聚焦时清空按钮替代箭头，Tab 可以到达它', async () => {
        mount(() => <Select defaultValue="abc" optionList={options} showClear />);
        const clear = () => document.querySelector(`.${prefixCls}-clear`);
        const arrow = () => document.querySelector(`.${prefixCls}-arrow`);
        expect(clear()).not.toBeVisible();
        expect(arrow()).toBeVisible();

        await userEvent.hover(screen.getByRole('combobox'));
        expect(clear()).toBeVisible();
        expect(arrow()).not.toBeVisible();
        await userEvent.unhover(screen.getByRole('combobox'));
        expect(clear()).not.toBeVisible();

        await tabTo(screen.getByRole('combobox'));
        const button = screen.getByRole('button', { name: clearName });
        expect(button).toBeVisible();
        await tab();
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: clearName })).toBeNull());
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(getOptionList()).toBeNull();
    });

    it('鼠标按下清空按钮会清空，焦点留在 combobox 上', async () => {
        mount(() => <Select defaultValue="abc" optionList={options} showClear />);
        await userEvent.hover(screen.getByRole('combobox'));
        await userEvent.click(document.querySelector(`.${prefixCls}-clear`) as HTMLElement);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-clear`)).toBeNull());
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(getOptionList()).toBeNull();
    });

    it.each([
        ['不可搜索单选', {}],
        ['可搜索单选', { filter: true }],
        ['可搜索多选', { filter: true, multiple: true }],
    ])('%s：点击选项后焦点留在 combobox 上', async (_name, props) => {
        mount(() => <Select optionList={options} motion={false} {...props} />);
        await userEvent.click(document.querySelector(`.${prefixCls}`) as HTMLElement);
        await userEvent.click(getOption('剪映') as HTMLElement);
        await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-focus`);
    });
});

describe.each([
    ['single', { defaultValue: 'abc' }],
    ['multiple searchable', { defaultValue: ['abc'], multiple: true, filter: true }],
])('焦点在 %s Select 与其清空按钮之间移动时保持在内部', (_, props) => {
    const renderWithSpies = () => {
        const spies = { onFocus: vi.fn<() => void>(), onBlur: vi.fn<() => void>() };
        // Firefox keeps focus in place on Shift+Tab from the first focusable element, so the Select needs one before it
        mount(() => (
            <>
                <Button>{() => 'before'}</Button>
                <Select style={{ width: '200px' }} optionList={options} showClear {...spies} {...props} />
                <Button>{() => 'after'}</Button>
            </>
        ));
        return spies;
    };
    const getClear = () => screen.getByRole('button', { name: clearName });
    const before = () => screen.getByRole('button', { name: 'before' });
    const after = () => screen.getByRole('button', { name: 'after' });

    it('Tab 到清空按钮再回来不发 blur', async () => {
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tab();
        expect(getClear()).toHaveFocus();
        await tab({ shift: true });
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();

        await tab();
        await tab();
        expect(after()).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('点击后清空按钮保持聚焦样式，且不再发第二次 focus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getOptionList()).toBeNull());
        await tabTo(getClear());
        expect(document.querySelector(`.${prefixCls}`)).toHaveClass(`${prefixCls}-focus`);
        await tab({ shift: true });
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();

        await tab();
        await tab();
        expect(after()).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(document.querySelector(`.${prefixCls}`)).not.toHaveClass(`${prefixCls}-focus`);
    });

    it('从 combobox 按 Shift+Tab 离开 Select 时只发一次 blur，跳过其中的标签', async () => {
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        const root = document.querySelector(`.${prefixCls}`) as HTMLElement;
        while (root.contains(document.activeElement)) {
            expect(onBlur).not.toHaveBeenCalled();
            await tab({ shift: true });
        }
        expect(before()).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

it('从展开的 Select 按 Tab 会关闭列表并移到清空按钮，且不发 blur', async () => {
    const onBlur = vi.fn<() => void>();
    mount(() => <Select style={{ width: '200px' }} defaultValue="abc" optionList={options} showClear onBlur={onBlur} />);
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await tab();
    expect(screen.getByRole('button', { name: clearName })).toHaveFocus();
    await waitFor(() => expect(getOptionList()).toBeNull());
    expect(onBlur).not.toHaveBeenCalled();
});

it('Select 标签获得焦点时被移除，焦点交给 combobox', async () => {
    const onBlur = vi.fn<() => void>();
    mount(() => (
        <>
            <Select style={{ width: '300px' }} defaultValue={['abc', 'xigua']} multiple optionList={options} onBlur={onBlur} />
            <Button>{() => 'after'}</Button>
        </>
    ));
    await tabTo(screen.getByRole('combobox'));
    await tab();
    expect(document.activeElement).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(getTagTexts()).toEqual(['西瓜视频']));
    expect(screen.getByRole('combobox')).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
});

describe('Select 分组', () => {
    const groups = () =>
        ['G1', 'G2'].map((label) => (
            <SelectOptGroup key={label} label={label}>
                {() =>
                    Array.from({ length: 8 }, (_, i) => (
                        <SelectOption key={i} value={`${label}-${i}`}>
                            {() => `${label}-${i}`}
                        </SelectOption>
                    ))
                }
            </SelectOptGroup>
        ));

    it('第二个分组标题上方有分隔线，第一个没有', async () => {
        mount(() => (
            <Select style={{ width: '200px' }} defaultOpen motion={false}>
                {groups}
            </Select>
        ));
        const titles = await waitFor(() => {
            const nodes = Array.from(document.querySelectorAll(`.${prefixCls}-group`));
            expect(nodes).toHaveLength(2);
            return nodes;
        });
        expect(getComputedStyle(titles[0] as Element).borderTopWidth).toBe('0px');
        expect(getComputedStyle(titles[1] as Element).borderTopWidth).not.toBe('0px');
    });

    it('打开时把分组内的已选项滚动到列表中部', async () => {
        mount(() => (
            <Select style={{ width: '200px' }} defaultValue="G2-6" maxHeight={120} motion={false}>
                {groups}
            </Select>
        ));
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        await waitFor(() => expect(listbox.scrollTop).toBeGreaterThan(0));
        const selected = (getOption('G2-6') as HTMLElement).getBoundingClientRect();
        const box = listbox.getBoundingClientRect();
        expect(selected.top).toBeGreaterThanOrEqual(box.top);
        expect(selected.bottom).toBeLessThanOrEqual(box.bottom);
    });

    it('ShadowRoot 内打开时把分组内的已选项滚进列表可视区', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        // the list scrolls only under the component styles, which the document holds
        shadow.append(...Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'), (node) => node.cloneNode(true)));
        const container = document.createElement('div');
        shadow.append(container);
        const view = render(
            () => (
                <Select style={{ width: '200px' }} defaultValue="G2-6" maxHeight={120} motion={false}>
                    {groups}
                </Select>
            ),
            { container }
        );
        try {
            await userEvent.click(shadow.querySelector('[role="combobox"]') as HTMLElement);
            await waitFor(() => {
                const box = (shadow.querySelector('[role="listbox"]') as HTMLElement).getBoundingClientRect();
                const selected = (Array.from(shadow.querySelectorAll('[role="option"]')).find((option) => option.textContent === 'G2-6') as HTMLElement).getBoundingClientRect();
                expect(selected.top).toBeGreaterThanOrEqual(box.top);
                expect(selected.bottom).toBeLessThanOrEqual(box.bottom);
            });
        } finally {
            view.unmount();
            host.remove();
        }
    });
});

describe('Select 鼠标与键盘混用', () => {
    const fruits = [
        { value: 'a', label: 'apple' },
        { value: 'b', label: 'banana' },
        { value: 'c', label: 'cherry' },
    ];
    const activeText = () => document.getElementById(screen.getByRole('combobox').getAttribute('aria-activedescendant') ?? '')?.textContent;

    it('多选点选一个选项后焦点留在 combobox，方向键与 Enter 继续作用于列表', async () => {
        mount(() => <Select multiple motion={false} optionList={fruits} style={{ width: '300px' }} />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click((await waitFor(() => getOption('apple'))) as HTMLElement);
        expect(screen.getByRole('combobox')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeText()).toBe('banana'));
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(getTagTexts()).toEqual(['apple', 'banana']));
    });

    it('下拉内搜索框输入后点选，焦点留在搜索框，可以继续输入', async () => {
        mount(() => <Select multiple filter searchPosition="dropdown" motion={false} optionList={fruits} style={{ width: '300px' }} />);
        await userEvent.click(screen.getByRole('combobox'));
        const search = await screen.findByRole('textbox');
        await userEvent.click(search);
        await userEvent.keyboard('a');
        await userEvent.click((await waitFor(() => getOption('apple'))) as HTMLElement);
        expect(search).toHaveFocus();
        await userEvent.keyboard('ch');
        await waitFor(() => expect(search).toHaveValue('ch'));
        await waitFor(() => expect(getOptionTexts()).toEqual(['cherry']));
    });
});

it('受控单选选中后在离场动画内重新打开，change 已发出且只发一次', async () => {
    const value = ref('ulikecam');
    const onChange = vi.fn<(value: unknown) => void>();
    mount(() => <Select style={{ width: '180px' }} optionList={options} modelValue={value.value} onUpdate:modelValue={(next: unknown) => (value.value = next as string)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click((await waitFor(() => getOption('抖音'))) as HTMLElement);
    screen.getByRole('combobox').click();
    await waitFor(() => expect(onChange.mock.calls).toEqual([['abc']]));
    expect(getOptionList()).not.toBeNull();
    await clickOutside();
    await waitFor(() => expect(getOptionList()).toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(onChange.mock.calls).toEqual([['abc']]);
});

describe('Select 加载更多', () => {
    const page = (start: number) => Array.from({ length: 20 }, (_, i) => ({ value: start + i, label: `option ${start + i}` }));

    const LoadMore = defineComponent({
        props: { fromSlot: Boolean, defaultValue: { type: Number, default: undefined } },
        setup(props) {
            const list = ref(page(0));
            const loadMore = () => {
                if (list.value.length < 40) list.value = [...list.value, ...page(list.value.length)];
            };
            return () => (
                <Select style={{ width: '200px' }} maxHeight={120} motion={false} optionList={list.value} defaultValue={props.defaultValue} onListScroll={props.fromSlot ? undefined : loadMore}>
                    {props.fromSlot ? { innerBottomSlot: () => <Button onClick={loadMore}>{() => 'load more'}</Button> } : {}}
                </Select>
            );
        },
    });

    it.each([
        ['滚到底发出 listScroll', {}],
        ['点击 #innerBottomSlot 里的按钮，有已选值', { fromSlot: true, defaultValue: 1 }],
    ])('%s 追加选项后列表停在原位', async (_, props: { fromSlot?: boolean; defaultValue?: number }) => {
        mount(() => <LoadMore {...props} />);
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        listbox.scrollTop = listbox.scrollHeight;
        const bottom = listbox.scrollTop;
        expect(bottom).toBeGreaterThan(0);
        if (props.fromSlot) {
            await userEvent.click(screen.getByRole('button', { name: 'load more' }));
        }
        await waitFor(() => expect(getOption('option 39')).toBeDefined());
        expect(listbox.scrollTop).toBe(bottom);
    });
});

describe('Select 在 ShadowRoot 内的焦点', () => {
    const mountInShadow = (props: Record<string, unknown>, slots?: Record<string, () => VNodeChild>) => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        return { shadow, view: render(Select, { props, slots, container }) };
    };

    it('受控值被清空、聚焦的清空按钮随之移除时，焦点回到 combobox', async () => {
        const { shadow, view } = mountInShadow({ multiple: true, modelValue: ['abc'], optionList: options, showClear: true });
        const combobox = shadow.querySelector('[role="combobox"]') as HTMLElement;
        combobox.focus();
        // past the closable tag
        await tab();
        await tab();
        expect(shadow.activeElement).toBe(shadow.querySelector(`.${prefixCls}-clear`));
        await view.rerender({ modelValue: [] });
        await waitFor(() => expect(shadow.querySelector(`.${prefixCls}-clear`)).toBeNull());
        expect(shadow.activeElement).toBe(combobox);
    });

    it('在面板最后一个可聚焦元素上按 Tab，焦点回到 combobox 并关闭面板', async () => {
        const { shadow } = mountInShadow({ motion: false, optionList: options }, { outerBottomSlot: () => <button type="button">bottom</button> });
        const combobox = shadow.querySelector('[role="combobox"]') as HTMLElement;
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(shadow.querySelector('[role="listbox"]')).not.toBeNull());
        await tab();
        expect(shadow.activeElement).toHaveTextContent('bottom');
        await tab();
        expect(shadow.activeElement).toBe(combobox);
        await waitFor(() => expect(shadow.querySelector('[role="listbox"]')).toBeNull());
    });
});

describe('Select 前缀（浏览器）', () => {
    it('触发器窄于整行时前缀文字保持单行原宽，不按字换行', () => {
        const props = { defaultValue: 'long', optionList: [{ value: 'long', label: '一个名字很长很长的选项用来撑满整行' }] };
        const slots = { prefix: () => '所在城市' };
        const { container } = render({
            render: () => (
                <>
                    <Select {...props} style={{ width: '500px' }}>
                        {slots}
                    </Select>
                    <Select {...props} style={{ width: '160px' }}>
                        {slots}
                    </Select>
                </>
            ),
        });
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefixCls}-prefix-text`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});
