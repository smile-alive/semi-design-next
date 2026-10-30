import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Button, Select } from '@fibrae/semi-ui-react';
import { clickOutside, expectThemeFocusRing, tab, tabTo } from '@test/utils/browser';
import type { optionRenderProps, SelectProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-select`;
const options = [
    { value: 'abc', label: '抖音' },
    { value: 'ulikecam', label: '轻颜相机' },
    { value: 'jianying', label: '剪映' },
    { value: 'xigua', label: '西瓜视频' },
];

const getOption = (text) => screen.getAllByRole('option').find((option) => option.textContent === text);
const getTagTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag-content`)).map((tag) => tag.textContent);

async function expectEverySelectionAccountedFor(selectedCount: number, restCount?: number) {
    await waitFor(() => {
        const texts = getTagTexts();
        const rest = texts.find((text) => /^\+\d+$/.test(text)) ?? '+0';
        expect(rest).toBe(restCount === undefined ? rest : `+${restCount}`);
        expect(texts.filter((text) => text !== rest).length + Number(rest.slice(1))).toBe(selectedCount);
    });
}

async function toggle(label) {
    if (!screen.queryByRole('listbox')) {
        await userEvent.click(document.querySelector(`.${prefixCls}-arrow`));
    }
    await userEvent.click(getOption(label));
}

function renderEllipsisSelect(props) {
    return render(<Select multiple ellipsisTrigger motion={false} optionList={options} showRestTagsPopover {...props} />);
}

describe('Select（浏览器）', () => {
    it('触发器移动但没有滚动或尺寸变化时，下拉层自动跟随', async () => {
        render(
            <div style={{ position: 'fixed', left: '100px', top: '100px' }} data-testid="box">
                <Select style={{ width: '120px' }} motion={false} optionList={options} />
            </div>
        );
        const trigger = document.querySelector(`.${prefixCls}`) as HTMLElement;
        await userEvent.click(trigger);
        const popup = (await screen.findByRole('listbox')).closest('[popover]') as HTMLElement;
        await waitFor(() => expect(Math.abs(popup.getBoundingClientRect().left - trigger.getBoundingClientRect().left)).toBeLessThanOrEqual(1));
        screen.getByTestId('box').style.left = '300px';
        // the move is reported on the next rendering update, and headless WebKit on Linux CI has gone ~2s without one
        await waitFor(() => expect(Math.abs(popup.getBoundingClientRect().left - 300)).toBeLessThanOrEqual(1), { timeout: 5000 });
    });

    it('修复 #1560：新增选项时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({ maxTagCount: 3, style: { width: 255 }, defaultValue: ['abc', 'ulikecam', 'xigua'] });
        await expectEverySelectionAccountedFor(3, 0);
        await toggle('剪映');
        await expectEverySelectionAccountedFor(4, 2);
    });

    it('修复 #1560：超出 maxTagCount 的标签变化时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({
            maxTagCount: 2,
            style: { width: 240 },
            defaultValue: ['xigua', 'ulikecam', 'jianying', 'abc'],
        });
        await expectEverySelectionAccountedFor(4, 2);
        await toggle('西瓜视频');
        await expectEverySelectionAccountedFor(3, 1);
        await toggle('西瓜视频');
        await expectEverySelectionAccountedFor(4, 2);
    });

    // Removing a visible tag must keep the +N tag, or the last selection is neither shown nor counted
    it('修复 #1560：移除可见选项时 ellipsisTrigger 重新计算剩余标签数', async () => {
        renderEllipsisSelect({ maxTagCount: 3, style: { width: 255 }, defaultValue: ['abc', 'ulikecam', 'xigua'] });
        await toggle('剪映');
        await expectEverySelectionAccountedFor(4, 2);
        await toggle('抖音');
        await expectEverySelectionAccountedFor(3);
    });
});

const getOptionList = () => screen.queryByRole('listbox');
const getOptionTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-option`), (option) => option.textContent);
const getGroupTexts = () => Array.from(document.querySelectorAll(`.${prefixCls}-group`), (group) => group.textContent);
const getFocusedText = () => document.querySelector(`.${prefixCls}-option-focused .${prefixCls}-option-text`)?.textContent;
const byCy = (name) => document.querySelector(`[data-cy=${name}]`);

function FilterSingle(props) {
    return (
        <div>
            <h5>默认筛选</h5>
            <Select style={{ width: '250px', margin: 10 }} autoFocus filter showClear {...props}>
                <Select.Option value={1}>opt1</Select.Option>
                <Select.Option disabled value={2}>
                    disabled
                </Select.Option>
                <Select.Option value={3}>Lucy</Select.Option>
                <Select.Option value="4">bay</Select.Option>
                <Select.Option value="5">sert</Select.Option>
                <Select.Option value="6">wym</Select.Option>
                <Select.Option disabled value="7">
                    meno
                </Select.Option>
                <Select.Option value="8">opts</Select.Option>
            </Select>
        </div>
    );
}

const blurCases: [string, SelectProps<string, boolean>][] = [
    ['singleDefault', {}],
    ['singleFilter', { filter: true }],
    ['singleAutoFocus', { autoFocus: true }],
    ['singleClickToHide', { clickToHide: true }],
    ['singleShowClear', { showClear: true }],
    ['multipleDefault', { multiple: true }],
    ['multipleFilter', { multiple: true, filter: true }],
    ['multipleClickToHide', { multiple: true, clickToHide: true }],
    ['multipleShowClear', { multiple: true, showClear: true }],
];

function AllCaseOfBlur({ onBlur }) {
    return (
        <div>
            {blurCases.map(([name, props]) => (
                <div key={name}>
                    <h5>{name}</h5>
                    <Select style={{ width: 120 }} data-cy={name} defaultValue="abc" onBlur={() => onBlur(name)} {...props}>
                        <Select.Option value="abc">抖音</Select.Option>
                        <Select.Option value="ulikecam">轻颜相机</Select.Option>
                        <Select.Option disabled value="jianying">
                            剪映
                        </Select.Option>
                        <Select.Option value="xigua">西瓜视频</Select.Option>
                    </Select>
                </div>
            ))}
        </div>
    );
}

async function blurByOutsideClick(onBlur, name, pickOption) {
    await userEvent.click(byCy(name));
    if (pickOption) {
        await userEvent.click((await screen.findAllByRole('option'))[1]);
    }
    await clickOutside();
    await waitFor(() => expect(onBlur).toHaveBeenCalledWith(name));
    await waitFor(() => expect(getOptionList()).toBeNull());
}

describe('Select', () => {
    it('选项悬停，切换 active 项', async () => {
        render(<FilterSingle />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(getOptionList()).not.toBeNull());
        await userEvent.hover(document.querySelectorAll(`.${prefixCls}-option`)[5]);
        await waitFor(() => expect(getFocusedText()).toBe('wym'));
        // A pointer left on the list would re-focus whichever option scrolls under it on ArrowDown
        await userEvent.hover(screen.getByText('默认筛选'));
        expect(getFocusedText()).toBe('wym');
        await userEvent.keyboard('{ArrowDown}');
        expect(getFocusedText()).toBe('opts');
    });

    it('键盘 Enter 选择选项', async () => {
        render(<FilterSingle />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.keyboard('o{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-selection-text`)).toMatchTextContent(/^opt1$/));
    });

    it('点击外部时应隐藏', async () => {
        const onBlur = vi.fn<() => void>();
        render(<FilterSingle onBlur={onBlur} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(getOptionList()).not.toBeNull());
        await userEvent.click(screen.getByText('默认筛选'));
        await waitFor(() => expect(getOptionList()).toBeNull());
        expect(onBlur).toHaveBeenCalled();
    });

    it('emptyContent=null 时', async () => {
        render(<Select style={{ width: 180 }} defaultOpen emptyContent={null} optionList={null} />);
        const wrapper = await waitFor(() => {
            const node = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
            expect(node).not.toBeNull();
            return node;
        });
        expect(getComputedStyle(wrapper).height).toBe('0px');
    });

    it('autoClearSearchValue 为 false，远程搜索，optionList 异步更新', async () => {
        const optionList = [1, 2, 3, 4, 5, 6].map((n) => ({ label: `semi${n}`, value: `semi${n}` }));
        function Demo() {
            const [loading, setLoading] = useState(false);
            const [list, setList] = useState(optionList);
            const [value, setValue] = useState<string | string[]>('');
            const handleSearch = (inputValue) => {
                setLoading(true);
                if (inputValue) {
                    setTimeout(() => {
                        setLoading(false);
                        setList([{ label: 'Design', value: '123456' }]);
                    }, 300);
                } else {
                    setList(optionList);
                    setLoading(false);
                }
            };
            return <Select className="remote-select" style={{ width: 400 }} multiple value={value} autoClearSearchValue={false} filter loading={loading} optionList={list} remote onChange={setValue} onSearch={handleSearch} />;
        }
        render(<Demo />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click((await screen.findAllByRole('option'))[0]);
        expect(document.querySelector(`.remote-select .${BASE_CLASS_PREFIX}-input`)).toHaveFocus();
        await userEvent.keyboard('123');
        await waitFor(() => expect(getOptionTexts()).toEqual(['Design']));
    });

    it('未设置 key 的 optionGroup 过滤', async () => {
        render(
            <Select id="without-key" style={{ width: '180px' }} placeholder="without key" filter={(sugInput, option) => (option.label as string).toUpperCase().includes(sugInput.toUpperCase())} showClear>
                <Select.OptGroup label="Group1">
                    <Select.Option value="douyin">Douyin</Select.Option>
                    <Select.Option value="ulikecam">Ulikecam</Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="Group2">
                    <Select.Option value="jianying">Capcut</Select.Option>
                    <Select.Option value="xigua">Xigua</Select.Option>
                </Select.OptGroup>
            </Select>
        );
        await userEvent.click(document.getElementById('without-key'));
        expect(document.querySelector(`#without-key .${BASE_CLASS_PREFIX}-input`)).toHaveFocus();
        await userEvent.keyboard('dou');
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-option-keyword`)).toMatchTextContent(/^Dou$/));
        expect(getGroupTexts()).toEqual(['Group1']);

        await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
        await waitFor(() => expect(getGroupTexts()).toEqual(['Group1', 'Group2']));
        expect(getOptionTexts()).toEqual(['Douyin', 'Ulikecam', 'Capcut', 'Xigua']);
    });

    it('选择选项后鼠标点击触发 blur', async () => {
        const onBlur = vi.fn<(name: string) => void>();
        render(<AllCaseOfBlur onBlur={onBlur} />);
        await blurByOutsideClick(onBlur, 'singleDefault', true);
        expect(onBlur).toHaveBeenCalledWith('singleAutoFocus');
        for (const name of ['singleFilter', 'singleClickToHide', 'singleShowClear', 'multipleDefault', 'multipleFilter', 'multipleClickToHide']) {
            await blurByOutsideClick(onBlur, name, true);
        }
    });

    it('未选择选项时鼠标点击触发 blur', async () => {
        const onBlur = vi.fn<(name: string) => void>();
        render(<AllCaseOfBlur onBlur={onBlur} />);
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

    it('修复 PR-2139', async () => {
        // A value outside optionList must re-render when its other keys change
        function Demo() {
            type Item = { label: string; value: string; otherProps: string };
            const [value, setValue] = useState<Item | Item[]>([{ label: 'AA-Label', value: 'AA', otherProps: 'AA-OtherProps' }]);
            return (
                <>
                    <Select
                        style={{ width: 320 }}
                        multiple
                        value={value}
                        filter
                        renderSelectedItem={({ label, otherProps }: Record<string, string>) => ({
                            isRenderInTag: false,
                            content: (
                                <div className="render-content">
                                    {label}-{otherProps}
                                </div>
                            ),
                        })}
                        onChange={setValue}
                        onChangeWithObject
                    />
                    <Button onClick={() => setValue([{ label: 'AA-Label-2', value: 'AA', otherProps: 'AA-OtherProps-2' }])}>change</Button>
                </>
            );
        }
        render(<Demo />);
        const content = () => document.querySelector('.render-content');
        expect(content()).toMatchTextContent(/^AA-Label-AA-OtherProps$/);
        await userEvent.click(screen.getByRole('button', { name: 'change' }));
        await waitFor(() => expect(content()).toMatchTextContent(/^AA-Label-2-AA-OtherProps-2$/));
    });

    it('受控模式，reactNode 中的相同 label 文本', async () => {
        function Demo() {
            const [value, setValue] = useState<string | string[]>();
            return (
                <Select style={{ width: 180 }} data-cy="singleControl" value={value} onChange={setValue}>
                    <Select.OptGroup label="Asia">
                        <Select.Option key="a-1" data-cy="a-1" value="a-1" label={<div>China</div>} />
                        <Select.Option key="a-2" data-cy="a-2" value="a-2" label={<div>China</div>} />
                        <Select.Option value="a-3" label={<div>Korea</div>} />
                    </Select.OptGroup>
                    <Select.OptGroup label="Europe">
                        <Select.Option value="b-1" label={<div>Germany</div>} />
                        <Select.Option value="b-2" label={<div>France</div>} />
                    </Select.OptGroup>
                </Select>
            );
        }
        render(<Demo />);
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

    it('renderOptionItem，键盘上下键', async () => {
        const labels = ['Doubao-Pro-4k', 'Doubao-Pro-32K', 'Doubao-Pro-128K', 'Doubao-Lite-4K', 'Doubao-Lite-32K', 'Doubao-Lite-128K', 'GPT-4', 'GPT-4-32K'];
        const optionList = labels.map((label, index) => ({ value: label, label, 'data-cy': `option-${index + 1}` }));
        const renderOptionItem = ({ disabled, selected, label, value, focused, className, style, onMouseEnter, onClick, empty, emptyContent, ...rest }: optionRenderProps) => (
            <div className={['custom-option-render', focused && 'custom-option-render-focused', className].filter(Boolean).join(' ')} style={style} onClick={() => onClick(undefined)} onMouseEnter={() => onMouseEnter(undefined)} {...rest}>
                {label}
            </div>
        );
        render(<Select style={{ width: 450 }} data-cy="multiple" multiple filter maxHeight={180} optionList={optionList} renderOptionItem={renderOptionItem} />);
        await userEvent.click(byCy('multiple'));
        await waitFor(() => expect(byCy('option-1')).not.toBeNull());
        for (const index of [2, 3, 4, 5, 6, 7, 8, 1]) {
            await userEvent.keyboard('{ArrowDown}');
            expect(byCy(`option-${index}`)).toHaveClass('custom-option-render-focused');
        }
        await userEvent.keyboard('{ArrowUp}');
        expect(byCy('option-8')).toHaveClass('custom-option-render-focused');
    });

    describe('aria-activedescendant 跟随方向键指向已渲染且可见的选项', () => {
        const many = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `option ${i}` }));
        const expectActiveInView = async (name) => {
            const combobox = screen.getByRole('combobox');
            await waitFor(() => {
                const active = document.getElementById(combobox.getAttribute('aria-activedescendant'));
                expect(active).toMatchTextContent(name);
                const list = screen.getByRole('listbox').getBoundingClientRect();
                const row = active.getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(list.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(list.bottom + 1);
            });
        };

        it('虚拟列表中，超出已渲染行的选项', async () => {
            render(<Select style={{ width: 200 }} optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await screen.findAllByRole('option');
            for (let i = 0; i < 30; i++) {
                await userEvent.keyboard('{ArrowDown}');
            }
            await expectActiveInView(/^option 30$/);
        });

        it('分组列表中，分组标题位于选项之间', async () => {
            render(
                <Select style={{ width: 200 }}>
                    {Array.from({ length: 15 }, (_, g) => (
                        <Select.OptGroup key={g} label={`group ${g}`}>
                            {many.slice(g * 2, g * 2 + 2).map((o) => (
                                <Select.Option key={o.value} value={o.value}>
                                    {o.label}
                                </Select.Option>
                            ))}
                        </Select.OptGroup>
                    ))}
                </Select>
            );
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
        render(<Select style={{ width: 200 }} filter optionList={list} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        let activeAtEnter: string | undefined;
        const record = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const id = (e.target as HTMLElement).getAttribute('aria-activedescendant');
                activeAtEnter = id ? document.getElementById(id)?.textContent : undefined;
            }
        };
        document.addEventListener('keydown', record, true);
        try {
            await userEvent.keyboard('1{Enter}');
        } finally {
            document.removeEventListener('keydown', record, true);
        }
        expect(activeAtEnter).toMatch(/1/);
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-selection-text`)).toHaveTextContent(activeAtEnter));
    });

    it('虚拟列表本身不是 Tab 停留点', async () => {
        const many = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `option ${i}` }));
        render(<Select optionList={many} virtualize={{ itemSize: 36 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        expect(screen.getByRole('listbox').querySelector('[style*="overflow"]')).toHaveAttribute('tabindex', '-1');
    });

    describe('虚拟列表的滚动', () => {
        const many = Array.from({ length: 100 }, (_, i) => ({ value: i, label: `option ${i}` }));
        const optionNamed = (name: string) => screen.queryByRole('option', { name });

        it('用户滚动容器后，渲染的选项随之变化', async () => {
            render(<Select optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await screen.findAllByRole('option');
            expect(optionNamed('option 0')).not.toBeNull();

            screen.getByRole('listbox').querySelector<HTMLElement>('[style*="overflow"]').scrollTop = 36 * 50;
            await waitFor(() => expect(optionNamed('option 50')).not.toBeNull());
            expect(optionNamed('option 0')).toBeNull();
        });

        it('关闭时按 End 打开，把最后一项滚进可视区', async () => {
            render(<Select optionList={many} virtualize={{ itemSize: 36 }} />);
            screen.getByRole('combobox').focus();
            await userEvent.keyboard('{End}');
            await waitFor(() => expect(optionNamed('option 99')).not.toBeNull());
            const list = screen.getByRole('listbox').querySelector<HTMLElement>('[style*="overflow"]');
            await waitFor(() => {
                const row = optionNamed('option 99').getBoundingClientRect();
                const box = list.getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
            });
        });

        it('打开时滚到已选项', async () => {
            render(<Select defaultValue={50} optionList={many} virtualize={{ itemSize: 36 }} />);
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(optionNamed('option 50')).not.toBeNull());
            const list = screen.getByRole('listbox').querySelector<HTMLElement>('[style*="overflow"]');
            await waitFor(() => {
                const row = optionNamed('option 50').getBoundingClientRect();
                const box = list.getBoundingClientRect();
                expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
                expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
            });
        });
    });

    it('悬停或键盘聚焦时清空按钮替代箭头，Tab 可以到达它', async () => {
        render(<Select defaultValue="abc" optionList={options} showClear />);
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
        const button = screen.getByRole('button', { name: '清空已选值' });
        expect(button).toBeVisible();
        await tab();
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('button', { name: '清空已选值' })).toBeNull());
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('鼠标按下清空按钮会清空，焦点留在 combobox 上', async () => {
        render(<Select defaultValue="abc" optionList={options} showClear />);
        await userEvent.hover(screen.getByRole('combobox'));
        await userEvent.click(document.querySelector(`.${prefixCls}-clear`));
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-clear`)).toBeNull());
        expect(screen.getByRole('combobox')).toHaveFocus();
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it.each([
        ['不可搜索单选', {}],
        ['可搜索单选', { filter: true }],
        ['可搜索多选', { filter: true, multiple: true }],
    ])('%s：点击选项后焦点留在 combobox 上', async (_name, props) => {
        render(<Select motion={false} optionList={options} {...props} />);
        // the search input sits under the selection area, so click the root
        await userEvent.click(document.querySelector(`.${prefixCls}`));
        await userEvent.click(getOption('剪映'));
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
        render(
            <>
                <Button>before</Button>
                <Select style={{ width: 200 }} optionList={options} showClear {...spies} {...props} />
                <Button>after</Button>
            </>
        );
        return spies;
    };
    const getClear = () => screen.getByRole('button', { name: '清空已选值' });
    const before = () => screen.getByRole('button', { name: 'before' });
    const after = () => screen.getByRole('button', { name: 'after' });

    it('Tab 到清空按钮再回来不触发 onBlur', async () => {
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

    it('点击后清空按钮保持聚焦样式，且不再触发第二次 onFocus', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
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

    it('从 combobox 按 Shift+Tab 离开 Select 时只触发一次 onBlur，跳过其中的标签', async () => {
        const { onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        const root = document.querySelector(`.${prefixCls}`);
        while (root.contains(document.activeElement)) {
            expect(onBlur).not.toHaveBeenCalled();
            await tab({ shift: true });
        }
        expect(before()).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

it('从展开的 Select 按 Tab 会关闭列表并移到清空按钮，且不触发 onBlur', async () => {
    const onBlur = vi.fn<() => void>();
    render(<Select style={{ width: 200 }} defaultValue="abc" optionList={options} showClear onBlur={onBlur} />);
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await tab();
    expect(screen.getByRole('button', { name: '清空已选值' })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onBlur).not.toHaveBeenCalled();
});

it('打开时按 Tab 关闭列表并离开，onBlur 恰好一次', async () => {
    const onBlur = vi.fn<() => void>();
    render(
        <>
            <Select style={{ width: 200 }} optionList={options} onBlur={onBlur} />
            <Button>after</Button>
        </>
    );
    await tabTo(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}');
    expect(onBlur).not.toHaveBeenCalled();
    await tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onBlur).toHaveBeenCalledTimes(1);
});

it('Select 标签获得焦点时被移除，焦点交给 combobox', async () => {
    const onBlur = vi.fn<() => void>();
    render(
        <>
            <Select style={{ width: 300 }} defaultValue={['abc', 'xigua']} multiple optionList={options} onBlur={onBlur} />
            <Button>after</Button>
        </>
    );
    await tabTo(screen.getByRole('combobox'));
    await tab();
    expect(document.activeElement).toHaveClass(`${BASE_CLASS_PREFIX}-tag`);
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(getTagTexts()).toEqual(['西瓜视频']));
    expect(screen.getByRole('combobox')).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
});

describe('Select 分组', () => {
    const groups = ['G1', 'G2'].map((label) => (
        <Select.OptGroup key={label} label={label}>
            {Array.from({ length: 8 }, (_, i) => (
                <Select.Option key={i} value={`${label}-${i}`}>{`${label}-${i}`}</Select.Option>
            ))}
        </Select.OptGroup>
    ));

    it('第二个分组标题上方有分隔线，第一个没有', async () => {
        render(
            <Select style={{ width: 200 }} defaultOpen motion={false}>
                {groups}
            </Select>
        );
        const titles = await waitFor(() => {
            const nodes = Array.from(document.querySelectorAll(`.${prefixCls}-group`));
            expect(nodes).toHaveLength(2);
            return nodes;
        });
        expect(getComputedStyle(titles[0]).borderTopWidth).toBe('0px');
        expect(getComputedStyle(titles[1]).borderTopWidth).not.toBe('0px');
    });

    it('打开时把分组内的已选项滚动到列表中部', async () => {
        render(
            <Select style={{ width: 200 }} defaultValue="G2-6" maxHeight={120} motion={false}>
                {groups}
            </Select>
        );
        await userEvent.click(screen.getByRole('combobox'));
        const listbox = await screen.findByRole('listbox');
        await waitFor(() => expect(listbox.scrollTop).toBeGreaterThan(0));
        const selected = getOption('G2-6').getBoundingClientRect();
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
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(
            <Select style={{ width: 200 }} defaultValue="G2-6" maxHeight={120} motion={false}>
                {groups}
            </Select>,
            { container: mount }
        );
        try {
            await userEvent.click(shadow.querySelector('[role="combobox"]'));
            await waitFor(() => {
                const listbox = shadow.querySelector('[role="listbox"]');
                const selected = Array.from(shadow.querySelectorAll('[role="option"]')).find((option) => option.textContent === 'G2-6');
                const box = listbox.getBoundingClientRect();
                expect(selected.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top);
                expect(selected.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom);
            });
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('关闭时按 End 打开，把最后一个选项滚进列表可视区', async () => {
        render(
            <Select style={{ width: 200 }} maxHeight={120} motion={false}>
                {groups}
            </Select>
        );
        screen.getByRole('combobox').focus();
        await userEvent.keyboard('{End}');
        const listbox = await screen.findByRole('listbox');
        await waitFor(() => expect(listbox.scrollTop).toBeGreaterThan(0));
        const last = getOption('G2-7').getBoundingClientRect();
        const box = listbox.getBoundingClientRect();
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', getOption('G2-7').id);
        expect(last.top).toBeGreaterThanOrEqual(box.top);
        expect(last.bottom).toBeLessThanOrEqual(box.bottom);
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
        render(<Select style={{ width: 300 }} multiple motion={false} optionList={fruits} />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(getOption('apple'));
        expect(screen.getByRole('combobox')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(activeText()).toBe('banana');
        await userEvent.keyboard('{Enter}');
        expect(getTagTexts()).toEqual(['apple', 'banana']);
    });

    it('下拉内搜索框输入后点选，焦点留在搜索框，可以继续输入', async () => {
        render(<Select style={{ width: 300 }} multiple filter motion={false} optionList={fruits} searchPosition="dropdown" />);
        await userEvent.click(screen.getByRole('combobox'));
        const search = await screen.findByRole('textbox');
        await userEvent.click(search);
        await userEvent.keyboard('a');
        await userEvent.click(getOption('apple'));
        expect(search).toHaveFocus();
        await userEvent.keyboard('ch');
        expect(search).toHaveValue('ch');
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['cherry']));
    });

    it('虚拟列表滚到远处后输入关键字，高亮项滚进可视区，aria-activedescendant 指向已渲染的行', async () => {
        const many = Array.from({ length: 3000 }, (_, i) => ({ value: i, label: `option ${i}` }));
        render(<Select style={{ width: 200 }} filter motion={false} optionList={many} virtualize={{ itemSize: 36 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        await screen.findAllByRole('option');
        screen.getByRole('listbox').querySelector<HTMLElement>('[style*="overflow"]').scrollTop = 36 * 2000;
        await waitFor(() => expect(screen.queryByRole('option', { name: 'option 2000' })).not.toBeNull());
        await userEvent.keyboard('1');
        await waitFor(() => expect(activeText()).toBe('option 1'));
    });
});

describe('Select 加载更多', () => {
    const page = (start: number) => Array.from({ length: 20 }, (_, i) => ({ value: start + i, label: `option ${start + i}` }));

    function LoadMore({ fromSlot, ...props }: SelectProps & { fromSlot?: boolean }) {
        const [list, setList] = useState(() => page(0));
        const loadMore = () => setList((prev) => (prev.length < 40 ? [...prev, ...page(prev.length)] : prev));
        return <Select {...props} style={{ width: 200 }} innerBottomSlot={fromSlot ? <Button onClick={loadMore}>load more</Button> : undefined} maxHeight={120} motion={false} optionList={list} onListScroll={fromSlot ? undefined : loadMore} />;
    }

    it.each<[string, Parameters<typeof LoadMore>[0]]>([
        ['滚到底触发 onListScroll', {}],
        ['点击 innerBottomSlot 里的按钮，有已选值', { fromSlot: true, defaultValue: 1 }],
    ])('%s 追加选项后列表停在原位', async (_, props) => {
        render(<LoadMore {...props} />);
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
    const mountInShadow = () => {
        const host = document.createElement('div');
        document.body.append(host);
        onTestFinished(() => host.remove());
        const shadow = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadow.append(container);
        return { shadow, container };
    };

    it('受控值被清空、聚焦的清空按钮随之移除时，焦点回到 combobox', async () => {
        const { shadow, container } = mountInShadow();
        const view = render(<Select multiple value={['abc']} optionList={options} showClear />, { container });
        const combobox = shadow.querySelector<HTMLElement>('[role="combobox"]');
        combobox.focus();
        // past the closable tag
        await tab();
        await tab();
        expect(shadow.activeElement).toBe(shadow.querySelector(`.${prefixCls}-clear`));
        view.rerender(<Select multiple value={[]} optionList={options} showClear />);
        await waitFor(() => expect(shadow.querySelector(`.${prefixCls}-clear`)).toBeNull());
        expect(shadow.activeElement).toBe(combobox);
    });

    it('在面板最后一个可聚焦元素上按 Tab，焦点回到 combobox 并关闭面板', async () => {
        const { shadow, container } = mountInShadow();
        render(<Select motion={false} optionList={options} outerBottomSlot={<button type="button">bottom</button>} />, { container });
        const combobox = shadow.querySelector<HTMLElement>('[role="combobox"]');
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

describe('Select 前缀', () => {
    it('触发器窄于整行时前缀文字保持单行原宽，不按字换行', () => {
        const longOptions = [{ value: 'long', label: '一个名字很长很长的选项用来撑满整行' }];
        const { container } = render(
            <>
                <Select style={{ width: 500 }} defaultValue="long" optionList={longOptions} prefix="所在城市" />
                <Select style={{ width: 160 }} defaultValue="long" optionList={longOptions} prefix="所在城市" />
            </>
        );
        const [roomy, narrow] = [...container.querySelectorAll(`.${prefixCls}-prefix-text`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});
