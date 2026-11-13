import { within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern, type CheckOptions } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';
import { leaf, regions, withNode, withoutNode, type TreeSpecNode } from './shared/tree-data';

/** Framework-free Tree props; `value` and `expandedKeys` are controlled when given, `defaultXxx` seeds the uncontrolled state */
export interface TreeSpecProps {
    treeData: TreeSpecNode[];
    value?: string | string[];
    defaultValue?: string | string[];
    expandedKeys?: string[];
    defaultExpandedKeys?: string[];
    defaultExpandAll?: boolean;
    multiple?: boolean;
    checkRelation?: 'related' | 'unRelated';
    disabled?: boolean;
    disableStrictly?: boolean;
    filterTreeNode?: boolean;
    showFilteredOnly?: boolean;
    loadData?: (node?: { key?: string }) => Promise<void>;
    direction?: 'ltr' | 'rtl';
    /** Each label renders as a button that reports its key to `onLabelButtonPress` and keeps the click from reaching the row */
    labelButtons?: boolean;
    onLabelButtonPress?: (key?: string) => void;
    'aria-label'?: string;
    // The value types differ in what they accept (numbers, node objects), so the spec only reads what it passes in
    onChange?: (value: unknown) => void;
    onSelect?: (selectedKey: string, selected: boolean, node: { key?: string }) => void;
    onExpand?: (expandedKeys: string[], info: { expanded: boolean; node: { key?: string } }) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-tree`;
const optionCls = `${prefix}-option`;

const allLabels = ['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'Tokyo', 'Osaka', 'North America', 'Canada', 'Mexico'];

export function treeSpec(mount: SpecMount<TreeSpecProps>, options: SpecOptions = {}) {
    defineSpec('Tree（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<TreeSpecProps>;

        async function render(props: Partial<TreeSpecProps> = {}) {
            handle = await mount({ treeData: regions, 'aria-label': 'Regions', ...props });
            view = within(handle.container);
            return handle;
        }

        const textOf = (element: Element) => element.textContent?.trim();
        const tree = () => view.getByRole('tree');
        const rows = () => view.queryAllByRole('treeitem');
        const labels = () => rows().map(textOf);
        const row = (label: string) => {
            const found = rows().find((item) => textOf(item) === label);
            if (!found) {
                throw new Error(`没有标签为 ${label} 的行，当前行：${labels().join('、')}`);
            }
            return found;
        };
        const activeLabel = () => {
            const id = tree().getAttribute('aria-activedescendant');
            const active = id ? handle.container.ownerDocument.getElementById(id) : null;
            return active ? textOf(active) : null;
        };
        const selectedLabels = () =>
            rows()
                .filter((item) => item.getAttribute('aria-selected') === 'true')
                .map(textOf);
        const checkedLabels = () =>
            rows()
                .filter((item) => item.getAttribute('aria-checked') === 'true')
                .map(textOf);
        const expandIcon = (label: string) => row(label).querySelector(`.${optionCls}-expand-icon`)!;
        // a click on a row already leaves the focus on the tree, so this does not Tab away from it
        const focusTree = async () => {
            tree().focus();
            expect(tree()).toHaveFocus();
        };
        const search = (text: string) => userEvent.type(view.getByRole('textbox'), text);

        // loadData resolves when the test says so; the data it loaded is applied through the handle first, like the docs' demo
        function lazyTree() {
            let release: () => void = () => {};
            const loadData = vi.fn<NonNullable<TreeSpecProps['loadData']>>(async ({ key = '' } = {}) => {
                await new Promise<void>((resolve) => {
                    release = resolve;
                });
                const children = [1, 2].map((n) => ({ ...leaf(`Child ${n}`, `${key}-${n}`), isLeaf: true }));
                await handle.update({ treeData: withNode(lazyData, key, { children }) });
            });
            return { loadData, finish: () => release() };
        }
        const lazyData: TreeSpecNode[] = [{ label: 'Lazy', value: 'lazy', key: 'lazy', isLeaf: false }, leaf('Plain')];

        test('渲染 tree 与 treeitem：aria-label 落在 tree 上，行带层级、同级位置、展开和选中状态', async () => {
            await render({ defaultExpandAll: true });
            expect(view.getByRole('tree', { name: 'Regions' })).toBeInTheDocument();
            expect(labels()).toEqual(allLabels);
            expect(row('China')).toHaveAttribute('aria-level', '2');
            expect(row('China')).toHaveAttribute('aria-expanded', 'true');
            expect(row('China')).toHaveAttribute('aria-setsize', '2');
            expect(row('China')).toHaveAttribute('aria-posinset', '1');
            expect(row('Osaka')).toHaveAttribute('aria-level', '3');
            expect(row('Osaka')).toHaveAttribute('aria-posinset', '2');
            expect(row('Osaka')).not.toHaveAttribute('aria-expanded');
            expect(row('Osaka')).toHaveAttribute('aria-selected', 'false');
            expect(row('Osaka')).toHaveAttribute('aria-disabled', 'false');
        });

        test('树是唯一的 Tab 停靠点，行不可 Tab 聚焦', async () => {
            await render({ defaultExpandAll: true });
            expect(tree()).toHaveAttribute('tabindex', '0');
            expect(rows().filter((item) => item.hasAttribute('tabindex'))).toHaveLength(0);
            await userEvent.tab();
            expect(tree()).toHaveFocus();
            await userEvent.tab();
            expect(tree()).not.toHaveFocus();
            expect(rows()).not.toContain(document.activeElement);
        });

        test('展开：点击箭头调用 onExpand，参数是新的展开 key 与操作信息；再次点击收起', async () => {
            const onExpand = vi.fn<NonNullable<TreeSpecProps['onExpand']>>();
            await render({ onExpand });
            expect(labels()).toEqual(['Asia', 'North America']);
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(expandIcon('Asia'));
            expect(onExpand).toHaveBeenLastCalledWith(['asia'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'asia' }) }));
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
            await userEvent.click(expandIcon('Asia'));
            expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false }));
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('defaultExpandedKeys 指定初始展开的行，defaultExpandAll 展开全部', async () => {
            await render({ defaultExpandedKeys: ['north-america'] });
            expect(labels()).toEqual(['Asia', 'North America', 'Canada', 'Mexico']);
            handle.unmount();
            await render({ defaultExpandAll: true });
            expect(labels()).toEqual(allLabels);
        });

        test('受控 expandedKeys：点击只报告新的 key，展开状态由 expandedKeys 决定', async () => {
            const onExpand = vi.fn<NonNullable<TreeSpecProps['onExpand']>>();
            await render({ expandedKeys: ['north-america'], onExpand });
            expect(labels()).toEqual(['Asia', 'North America', 'Canada', 'Mexico']);
            await userEvent.click(expandIcon('Asia'));
            expect(onExpand).toHaveBeenLastCalledWith(['north-america', 'asia'], expect.objectContaining({ expanded: true }));
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await handle.update({ expandedKeys: ['asia'] });
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
        });

        test('单选非受控：点击选中，onChange 收到 value，onSelect 收到 key、选中态和节点；选中另一行后前一行取消', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<TreeSpecProps['onSelect']>>();
            await render({ defaultExpandAll: true, onChange, onSelect });
            await userEvent.click(row('Beijing'));
            expect(onChange).toHaveBeenCalledExactlyOnceWith('Beijing');
            expect(onSelect).toHaveBeenCalledExactlyOnceWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
            expect(selectedLabels()).toEqual(['Beijing']);
            await userEvent.click(row('Tokyo'));
            expect(onChange).toHaveBeenLastCalledWith('Tokyo');
            expect(selectedLabels()).toEqual(['Tokyo']);
        });

        test('defaultValue 选中对应的行，并展开它的祖先', async () => {
            await render({ defaultValue: 'Shanghai' });
            expect(labels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
            expect(selectedLabels()).toEqual(['Shanghai']);
        });

        test('单选受控：点击只报告 value，选中项由 value 决定，value 更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ defaultExpandAll: true, value: 'Beijing', onChange });
            expect(selectedLabels()).toEqual(['Beijing']);
            await userEvent.click(row('Tokyo'));
            expect(onChange).toHaveBeenCalledExactlyOnceWith('Tokyo');
            expect(selectedLabels()).toEqual(['Beijing']);
            await handle.update({ value: 'Canada' });
            expect(selectedLabels()).toEqual(['Canada']);
        });

        test('多选：行上报告 aria-checked 而不是 aria-selected；勾选后 onChange 收到 value 数组，祖先为半选', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ multiple: true, defaultExpandAll: true, onChange });
            expect(row('Asia')).not.toHaveAttribute('aria-selected');
            expect(row('Asia')).toHaveAttribute('aria-checked', 'false');
            await userEvent.click(row('Beijing'));
            expect(onChange).toHaveBeenLastCalledWith(['Beijing']);
            expect(row('Beijing')).toHaveAttribute('aria-checked', 'true');
            expect(row('China')).toHaveAttribute('aria-checked', 'mixed');
            expect(row('Asia')).toHaveAttribute('aria-checked', 'mixed');
            await userEvent.click(row('Beijing'));
            expect(onChange).toHaveBeenLastCalledWith([]);
            expect(row('China')).toHaveAttribute('aria-checked', 'false');
        });

        test("多选 checkRelation 为 'related'：勾选父行勾选全部后代；子行全部勾选后父行也勾选", async () => {
            await render({ multiple: true, defaultExpandAll: true });
            await userEvent.click(row('China'));
            expect(checkedLabels()).toEqual(['China', 'Beijing', 'Shanghai']);
            await userEvent.click(row('Tokyo'));
            await userEvent.click(row('Osaka'));
            expect(checkedLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'Tokyo', 'Osaka']);
            expect(row('Asia')).toHaveAttribute('aria-checked', 'true');
        });

        test("多选 checkRelation 为 'unRelated'：勾选父行不影响后代，也没有半选", async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ multiple: true, checkRelation: 'unRelated', defaultExpandAll: true, onChange });
            await userEvent.click(row('China'));
            expect(onChange).toHaveBeenLastCalledWith(['China']);
            expect(checkedLabels()).toEqual(['China']);
            await userEvent.click(row('Beijing'));
            expect(row('China')).toHaveAttribute('aria-checked', 'true');
            expect(row('Asia')).toHaveAttribute('aria-checked', 'false');
        });

        test('多选受控：点击只报告 value 数组，勾选状态由 value 决定', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ multiple: true, defaultExpandAll: true, value: ['Beijing'], onChange });
            await userEvent.click(row('Tokyo'));
            expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Tokyo']);
            expect(checkedLabels()).toEqual(['Beijing']);
            await handle.update({ value: ['Osaka'] });
            expect(checkedLabels()).toEqual(['Osaka']);
        });

        test('disabled 节点：点击不选中也不调用 onChange 与 onSelect，仍可展开', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<TreeSpecProps['onSelect']>>();
            await render({ treeData: withNode(regions, 'asia', { disabled: true }), onChange, onSelect });
            expect(row('Asia')).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(row('Asia'));
            expect(onChange).not.toHaveBeenCalled();
            expect(onSelect).not.toHaveBeenCalled();
            expect(selectedLabels()).toEqual([]);
            await userEvent.click(expandIcon('Asia'));
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
        });

        test('disabled 整棵树：点击与键盘都不选中', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ disabled: true, defaultExpandAll: true, onChange });
            await userEvent.click(row('Beijing'));
            await focusTree();
            await userEvent.keyboard('{Enter}');
            expect(onChange).not.toHaveBeenCalled();
            expect(selectedLabels()).toEqual([]);
        });

        test('多选 disableStrictly：禁用的行不能勾选，也不被父行的勾选带上', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ multiple: true, disableStrictly: true, defaultExpandAll: true, treeData: withNode(regions, 'beijing', { disabled: true }), onChange });
            expect(row('Beijing')).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(row('Beijing'));
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(row('China'));
            expect(checkedLabels()).toEqual(['Shanghai']);
            expect(row('Beijing')).toHaveAttribute('aria-checked', 'false');
        });

        test('filterTreeNode：搜索只显示命中行和它的祖先，aria-setsize 与 aria-posinset 只统计显示的同级行；清空后恢复', async () => {
            await render({ filterTreeNode: true, showFilteredOnly: true });
            await search('Tokyo');
            expect(labels()).toEqual(['Asia', 'Japan', 'Tokyo']);
            for (const label of labels()) {
                expect(row(label)).toHaveAttribute('aria-setsize', '1');
                expect(row(label)).toHaveAttribute('aria-posinset', '1');
            }
            await userEvent.clear(view.getByRole('textbox'));
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('搜索结果中，键盘只在显示的行之间移动', async () => {
            await render({ filterTreeNode: true, showFilteredOnly: true });
            await search('o');
            const shown = labels();
            expect(shown).toEqual(expect.arrayContaining(['Tokyo', 'Osaka']));
            await focusTree();
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe(shown.at(-1));
            await userEvent.keyboard('{Home}{ArrowDown}');
            expect(activeLabel()).toBe(shown[1]);
        });

        test('aria-activedescendant：不聚焦时指向已选行，没有选中行时指向第一行，Tab 聚焦树后不变', async () => {
            await render({ defaultValue: 'Shanghai' });
            expect(activeLabel()).toBe('Shanghai');
            handle.unmount();
            await render();
            expect(activeLabel()).toBe('Asia');
            await focusTree();
            expect(activeLabel()).toBe('Asia');
        });

        test('键盘：Up、Down、Home 和 End 在可见行之间移动，不循环', async () => {
            await render();
            await focusTree();
            await userEvent.keyboard('{ArrowUp}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('North America');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('North America');
            await userEvent.keyboard('{Home}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('North America');
            expect(tree()).toHaveFocus();
        });

        test('键盘：当前行带焦点样式，且只有当前行有', async () => {
            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            const focused = rows().filter((item) => item.classList.contains(`${optionCls}-focused`));
            expect(focused.map(textOf)).toEqual(['Beijing']);
        });

        test('键盘：Right 展开收起的分支并留在它上面，再按 Right 进入第一个子行；Left 先回到父行，再收起', async () => {
            const onExpand = vi.fn<NonNullable<TreeSpecProps['onExpand']>>();
            await render({ onExpand });
            await focusTree();
            await userEvent.keyboard('{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            expect(activeLabel()).toBe('Asia');
            expect(onExpand).toHaveBeenLastCalledWith(['asia'], expect.objectContaining({ expanded: true }));
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeLabel()).toBe('Asia');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowLeft}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false }));
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('键盘：叶子行按 Right 无动作，按 Left 回到父行；顶层展开的行按 Left 收起，收起后再按无动作', async () => {
            const onExpand = vi.fn<NonNullable<TreeSpecProps['onExpand']>>();
            await render({ defaultExpandAll: true, onExpand });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Beijing');
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{Home}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            expect(activeLabel()).toBe('Asia');
            expect(onExpand).toHaveBeenCalledTimes(1);
        });

        test('键盘：RTL 下 Left 展开并进入，Right 回到父行并收起', async () => {
            await render({ direction: 'rtl' });
            await focusTree();
            await userEvent.keyboard('{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowLeft}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
        });

        test('键盘：禁用的行可以到达；禁用的分支仍可展开和收起，Enter 与 Space 不选中', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ defaultExpandAll: true, treeData: withNode(regions, 'china', { disabled: true }), onChange });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.keyboard('{ArrowLeft}');
            expect(row('China')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowRight}');
            expect(row('China')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Shanghai');
        });

        test('键盘：输入字符移动到标签以它开头的下一个可见行', async () => {
            await render();
            await focusTree();
            await userEvent.keyboard('n');
            expect(activeLabel()).toBe('North America');
        });

        // typed characters within one pause form a search string, so each sequence gets a fresh tree
        test('键盘：重复输入同一个字符在以它开头的行之间循环，没有匹配时不动', async () => {
            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('c');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('c');
            expect(activeLabel()).toBe('Canada');
            await userEvent.keyboard('z');
            expect(activeLabel()).toBe('Canada');
        });

        test('键盘：数字标签参与键入跳转', async () => {
            await render({
                treeData: [
                    { label: 'alpha', value: 'a', key: 'a' },
                    { label: '2024', value: 'y', key: 'y' },
                ],
            });
            await focusTree();
            await userEvent.keyboard('2');
            expect(activeLabel()).toBe('2024');
        });

        test('键盘：Enter 选中当前行，onChange 与 onSelect 的参数与点击一致', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<TreeSpecProps['onSelect']>>();
            await render({ onChange, onSelect });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('North America');
            expect(onSelect).toHaveBeenLastCalledWith('north-america', true, expect.objectContaining({ key: 'north-america' }));
            expect(row('North America')).toHaveAttribute('aria-selected', 'true');
            expect(activeLabel()).toBe('North America');
        });

        test('键盘：多选树里 Space 与 Enter 勾选当前行，再按取消勾选', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ multiple: true, onChange });
            await focusTree();
            await userEvent.keyboard('{End} ');
            expect(onChange).toHaveBeenLastCalledWith(['North America']);
            expect(row('North America')).toHaveAttribute('aria-checked', 'true');
            await userEvent.keyboard('{Enter}');
            expect(onChange).toHaveBeenLastCalledWith([]);
            expect(row('North America')).toHaveAttribute('aria-checked', 'false');
        });

        test('键盘：从已选行出发，方向键接着往下走', async () => {
            await render({ defaultValue: 'Shanghai' });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Japan');
            await userEvent.keyboard('{ArrowUp}{ArrowUp}');
            expect(activeLabel()).toBe('Beijing');
        });

        test('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动当前行也不选中', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            await render({ onChange });
            await focusTree();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                for (const key of ['ArrowDown', 'ArrowRight', 'End', 'Enter', 'n']) {
                    const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                    expect(tree().dispatchEvent(event)).toBe(true);
                }
            }
            expect(activeLabel()).toBe('Asia');
            expect(labels()).toEqual(['Asia', 'North America']);
            expect(onChange).not.toHaveBeenCalled();
        });

        test('行内可 Tab 聚焦的控件自己处理按键：树不抢 Enter、Space 和方向键', async () => {
            const onChange = vi.fn<NonNullable<TreeSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<TreeSpecProps['onSelect']>>();
            const onLabelButtonPress = vi.fn<NonNullable<TreeSpecProps['onLabelButtonPress']>>();
            await render({ labelButtons: true, onChange, onSelect, onLabelButtonPress });
            const button = view.getByRole('button', { name: 'North America' });
            button.focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onLabelButtonPress).toHaveBeenCalledTimes(2);
            expect(onLabelButtonPress).toHaveBeenLastCalledWith('north-america');
            await userEvent.keyboard('{ArrowDown}{ArrowRight}{End}');
            expect(onSelect).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();
            expect(labels()).toEqual(['Asia', 'North America']);
            expect(row('North America')).toHaveAttribute('aria-expanded', 'false');
        });

        test('指针：点击行后，方向键从被点击的行继续', async () => {
            await render({ defaultExpandAll: true });
            await userEvent.click(row('Japan'));
            expect(activeLabel()).toBe('Japan');
            await focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Tokyo');
        });

        test('指针：多选树里点击勾选的行成为当前行', async () => {
            await render({ multiple: true, defaultExpandAll: true });
            await userEvent.click(row('Beijing'));
            expect(activeLabel()).toBe('Beijing');
            await focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Shanghai');
        });

        test('指针：点击展开箭头的行成为当前行，展开后方向键进入它的子行', async () => {
            await render({ defaultExpandedKeys: ['asia'] });
            await userEvent.click(expandIcon('Japan'));
            expect(activeLabel()).toBe('Japan');
            await focusTree();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Tokyo');
        });

        test('指针：右键和双击的行成为当前行', async () => {
            await render({ defaultExpandAll: true });
            await userEvent.pointer({ keys: '[MouseRight]', target: row('Shanghai') });
            expect(activeLabel()).toBe('Shanghai');
            await focusTree();
            await userEvent.keyboard('{ArrowUp}');
            expect(activeLabel()).toBe('Beijing');
            await userEvent.dblClick(row('Japan'));
            expect(activeLabel()).toBe('Japan');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Tokyo');
        });

        test('指针与键盘混用：键盘移动后点击另一行，当前行改为被点击的行', async () => {
            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('Mexico');
            await userEvent.click(row('Osaka'));
            expect(activeLabel()).toBe('Osaka');
            await userEvent.keyboard('{ArrowUp}');
            expect(activeLabel()).toBe('Tokyo');
        });

        test('数据变化：当前行被删除后，当前行回落到已选行；没有已选行时回落到第一行', async () => {
            await render({ defaultExpandAll: true, defaultValue: 'Canada' });
            await focusTree();
            await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await handle.update({ treeData: withoutNode(regions, 'beijing') });
            expect(activeLabel()).toBe('Canada');
            handle.unmount();

            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('Mexico');
            await handle.update({ treeData: withoutNode(regions, 'mexico') });
            expect(activeLabel()).toBe('Asia');
        });

        test('数据变化：treeData 整体替换后，当前行不在新数据里则回落到第一行；仍在则保留', async () => {
            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('Mexico');
            await handle.update({ treeData: [...regions].reverse() });
            expect(activeLabel()).toBe('Mexico');
            await handle.update({ treeData: [leaf('Europe'), leaf('Africa')] });
            expect(labels()).toEqual(['Europe', 'Africa']);
            expect(activeLabel()).toBe('Europe');
        });

        test('数据变化：当前行所在的父行被收起后，当前行回落到第一行（受控 expandedKeys）', async () => {
            await render({ expandedKeys: ['asia', 'japan'] });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Tokyo');
            await handle.update({ expandedKeys: ['asia'] });
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
            expect(activeLabel()).toBe('Asia');
        });

        test('数据变化：当前行所在的父行被键盘收起后，当前行是被收起的父行', async () => {
            await render({ defaultExpandAll: true });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowLeft}');
            expect(activeLabel()).toBe('China');
            expect(row('China')).toHaveAttribute('aria-expanded', 'false');
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'Tokyo', 'Osaka', 'North America', 'Canada', 'Mexico']);
        });

        test('loadData：Right 展开未加载的行并调用 loadData，加载中行为 aria-busy，Right 不进入；加载完成后 Right 进入第一个子行', async () => {
            const { loadData, finish } = lazyTree();
            const onExpand = vi.fn<NonNullable<TreeSpecProps['onExpand']>>();
            await render({ treeData: lazyData, loadData, onExpand });
            await focusTree();
            expect(row('Lazy')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowRight}');
            expect(loadData).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ key: 'lazy' }));
            expect(onExpand).toHaveBeenLastCalledWith(['lazy'], expect.objectContaining({ expanded: true }));
            expect(row('Lazy')).toHaveAttribute('aria-busy', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Lazy');
            expect(loadData).toHaveBeenCalledTimes(1);

            finish();
            await vi.waitFor(() => expect(labels()).toEqual(['Lazy', 'Child 1', 'Child 2', 'Plain']));
            expect(row('Lazy')).not.toHaveAttribute('aria-busy');
            expect(row('Lazy')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Child 1');
            expect(row('Child 1')).not.toHaveAttribute('aria-expanded');
        });

        test('loadData：点击展开箭头同样加载，已加载的行再次展开不重复加载', async () => {
            const { loadData, finish } = lazyTree();
            await render({ treeData: lazyData, loadData });
            await userEvent.click(expandIcon('Lazy'));
            expect(loadData).toHaveBeenCalledTimes(1);
            finish();
            await vi.waitFor(() => expect(labels()).toEqual(['Lazy', 'Child 1', 'Child 2', 'Plain']));
            await userEvent.click(expandIcon('Lazy'));
            expect(labels()).toEqual(['Lazy', 'Plain']);
            await userEvent.click(expandIcon('Lazy'));
            expect(labels()).toEqual(['Lazy', 'Child 1', 'Child 2', 'Plain']);
            expect(loadData).toHaveBeenCalledTimes(1);
        });

        const apg = (title: string, props: Partial<TreeSpecProps>, options: Partial<CheckOptions> = {}) =>
            test(`APG tree view 模式：${title}`, async () => {
                await render(props);
                await expect(checkPattern('tree', handle.container, { press, ...options })).resolves.toBeUndefined();
            });
        apg('LTR', {});
        apg('RTL', { direction: 'rtl' }, { direction: 'rtl' });
        apg('多选', { multiple: true });
        apg('含禁用行', { treeData: withNode(regions, 'china', { disabled: true }), defaultExpandedKeys: ['asia'] });
    });
}
