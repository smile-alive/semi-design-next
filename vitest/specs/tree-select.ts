import { waitFor, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { checkPattern } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';
import { leaf, regions, withNode, withoutNode, type TreeSpecNode } from './shared/tree-data';

/** Framework-free TreeSelect props; `value` and `expandedKeys` are controlled when given, `defaultValue` seeds the uncontrolled state */
export interface TreeSelectSpecProps {
    treeData: TreeSpecNode[];
    value?: string | string[];
    defaultValue?: string | string[];
    expandedKeys?: string[];
    defaultExpandAll?: boolean;
    defaultOpen?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    showClear?: boolean;
    clickToHide?: boolean;
    filterTreeNode?: boolean;
    showFilteredOnly?: boolean;
    searchPosition?: 'dropdown' | 'trigger';
    loadData?: (node?: { key?: string }) => Promise<void>;
    direction?: 'ltr' | 'rtl';
    'aria-label'?: string;
    // The second and third arguments (node, event) differ in shape between frameworks, so the first is the only common one
    onChange?: (value: unknown, ...rest: unknown[]) => void;
    onSelect?: (selectedKey: string, selected: boolean, node: { key?: string }) => void;
    onExpand?: (expandedKeys: string[], info: { expanded: boolean; node: { key?: string } }) => void;
    onSearch?: (input: string, ...rest: unknown[]) => void;
}

const prefix = `${BASE_CLASS_PREFIX}-tree-select`;
const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;

const allLabels = ['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'Tokyo', 'Osaka', 'North America', 'Canada', 'Mexico'];

export function treeSelectSpec(mount: SpecMount<TreeSelectSpecProps>, options: SpecOptions = {}) {
    defineSpec('TreeSelect（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<TreeSelectSpecProps>;

        async function render(props: Partial<TreeSelectSpecProps> = {}) {
            handle = await mount({ treeData: regions, 'aria-label': 'Region', ...props });
            view = within(handle.container);
            return handle;
        }

        // the dropdown is rendered in a portal on the body
        const page = () => within(handle.container.ownerDocument.body);
        const textOf = (element: Element) => element.textContent?.trim();
        // the trigger, or the search input that takes the combobox role when the search sits on the trigger
        const combobox = () => view.getByRole('combobox');
        const tree = () => page().queryByRole('tree');
        const rows = () => page().queryAllByRole('treeitem');
        const labels = () => rows().map(textOf);
        const row = (label: string) => {
            const found = rows().find((item) => textOf(item) === label);
            if (!found) {
                throw new Error(`没有标签为 ${label} 的行，当前行：${labels().join('、')}`);
            }
            return found;
        };
        const expandIcon = (label: string) => row(label).querySelector(`.${optionCls}-expand-icon`)!;
        const activeLabel = (host: Element = combobox()) => {
            const id = host.getAttribute('aria-activedescendant');
            const active = id ? handle.container.ownerDocument.getElementById(id) : null;
            return active ? textOf(active) : null;
        };
        const checkedLabels = () =>
            rows()
                .filter((item) => item.getAttribute('aria-checked') === 'true')
                .map(textOf);
        const tags = () => [...handle.container.querySelectorAll(`.${prefix}-selection .${BASE_CLASS_PREFIX}-tag`)];
        const tagTexts = () => tags().map(textOf);
        const clearButton = () => handle.container.querySelector<HTMLElement>(`.${prefix}-clearbtn`);
        const dropdownSearch = () => page().getByRole('textbox');
        const isOpen = () => combobox().getAttribute('aria-expanded') === 'true';
        const focusCombobox = async () => {
            combobox().focus();
            expect(combobox()).toHaveFocus();
        };
        const opened = async () => {
            await waitFor(() => expect(tree()).not.toBeNull());
        };
        const closed = async () => {
            await waitFor(() => expect(tree()).toBeNull());
        };
        async function openWithKeyboard(key = '{ArrowDown}') {
            await focusCombobox();
            await userEvent.keyboard(key);
            await opened();
        }

        function lazyData() {
            let release: () => void = () => {};
            const data: TreeSpecNode[] = [{ label: 'Lazy', value: 'lazy', key: 'lazy', isLeaf: false }, leaf('Plain')];
            const loadData = vi.fn<NonNullable<TreeSelectSpecProps['loadData']>>(async ({ key = '' } = {}) => {
                await new Promise<void>((resolve) => {
                    release = resolve;
                });
                const children = [1, 2].map((n) => ({ ...leaf(`Child ${n}`, `${key}-${n}`), isLeaf: true }));
                await handle.update({ treeData: withNode(data, key, { children }) });
            });
            return { data, loadData, finish: () => release() };
        }

        test('触发器是 combobox：aria-haspopup 为 tree，可 Tab 聚焦；点击打开后 aria-expanded、aria-controls 指向弹层里的树', async () => {
            await render({ defaultExpandAll: true });
            expect(combobox()).toHaveAccessibleName('Region');
            expect(combobox()).toHaveAttribute('aria-haspopup', 'tree');
            expect(combobox()).toHaveAttribute('aria-expanded', 'false');
            expect(combobox()).toHaveAttribute('tabindex', '0');
            expect(tree()).toBeNull();
            await userEvent.tab();
            expect(combobox()).toHaveFocus();
            await userEvent.click(combobox());
            await opened();
            expect(combobox()).toHaveAttribute('aria-expanded', 'true');
            expect(combobox().getAttribute('aria-controls')).toBe(tree()!.id);
            expect(labels()).toEqual(allLabels);
        });

        test('遵循 APG combobox 模式：弹出 tree', async () => {
            await render({ defaultOpen: true, defaultExpandAll: true });
            await opened();
            await expect(checkPattern('combobox', handle.container, { press })).resolves.toBeUndefined();
        });

        test('defaultOpen 让下拉框一开始就打开', async () => {
            await render({ defaultOpen: true });
            await opened();
            expect(isOpen()).toBe(true);
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('disabled：触发器不是 Tab 停靠点，点击不打开', async () => {
            await render({ disabled: true });
            expect(combobox()).toHaveAttribute('tabindex', '-1');
            await userEvent.tab();
            expect(combobox()).not.toHaveFocus();
            await userEvent.click(combobox());
            expect(isOpen()).toBe(false);
            expect(tree()).toBeNull();
        });

        for (const key of ['{ArrowDown}', '{ArrowUp}', '{Enter}', ' ']) {
            test(`关闭时在触发器上按 ${JSON.stringify(key)} 打开下拉框，打开时没有当前行`, async () => {
                await render();
                await openWithKeyboard(key);
                expect(isOpen()).toBe(true);
                expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            });
        }

        test('Escape 关闭下拉框，焦点留在触发器上', async () => {
            await render();
            await openWithKeyboard();
            await userEvent.keyboard('{Escape}');
            await closed();
            expect(isOpen()).toBe(false);
            expect(combobox()).toHaveFocus();
        });

        test('关闭时 Home 与 End 打开并激活首、尾可见行；关闭时输入字符不打开', async () => {
            await render();
            await openWithKeyboard('{End}');
            expect(activeLabel()).toBe('North America');
            await userEvent.keyboard('{Escape}');
            await closed();
            await userEvent.keyboard('{Home}');
            await opened();
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{Escape}');
            await closed();
            await userEvent.keyboard('n');
            expect(isOpen()).toBe(false);
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
        });

        test('键盘：ArrowDown 激活第一行，Up、Down、Home、End 在可见行之间移动，不循环；焦点始终在触发器上', async () => {
            await render();
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowUp}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('North America');
            await userEvent.keyboard('{Home}');
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('North America');
            expect(combobox()).toHaveFocus();
            expect(row('North America')).toHaveClass(`${optionCls}-focused`);
            expect(row('Asia')).not.toHaveClass(`${optionCls}-focused`);
        });

        test('键盘：Right 展开激活行并停在它上面，再按进入第一个子行；Left 回到父行，再收起', async () => {
            const onExpand = vi.fn<NonNullable<TreeSelectSpecProps['onExpand']>>();
            await render({ onExpand });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            expect(onExpand).toHaveBeenLastCalledWith(['asia'], expect.objectContaining({ expanded: true }));
            expect(activeLabel()).toBe('Asia');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
            expect(activeLabel()).toBe('Asia');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
        });

        test('键盘：RTL 下 Left 展开，Right 收起', async () => {
            await render({ direction: 'rtl' });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowLeft}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
        });

        test('键盘：禁用的行可以到达，Enter 不选中', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ defaultExpandAll: true, treeData: withNode(regions, 'china', { disabled: true }), onChange });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('China');
            await userEvent.keyboard('{Enter}');
            expect(onChange).not.toHaveBeenCalled();
            expect(isOpen()).toBe(true);
        });

        test('键盘：在触发器上输入字符移动到标签以它开头的下一个可见行', async () => {
            await render();
            await openWithKeyboard();
            await userEvent.keyboard('n');
            expect(activeLabel()).toBe('North America');
            expect(isOpen()).toBe(true);
        });

        test('键盘：数字标签参与键入跳转', async () => {
            await render({
                treeData: [
                    { label: 'alpha', value: 'a', key: 'a' },
                    { label: '2024', value: 'y', key: 'y' },
                ],
            });
            await openWithKeyboard();
            await userEvent.keyboard('2');
            expect(activeLabel()).toBe('2024');
        });

        test('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动当前行也不选中', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ onChange });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}');
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                for (const key of ['ArrowDown', 'ArrowRight', 'End', 'Enter', 'n']) {
                    const event = new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true });
                    expect(combobox().dispatchEvent(event)).toBe(true);
                }
            }
            expect(activeLabel()).toBe('Asia');
            expect(labels()).toEqual(['Asia', 'North America']);
            expect(onChange).not.toHaveBeenCalled();
        });

        test('单选：键盘 Enter 选中当前行，onChange 与 onSelect 收到参数，下拉框关闭，焦点和选中文字留在触发器上', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            const onSelect = vi.fn<NonNullable<TreeSelectSpecProps['onSelect']>>();
            await render({ onChange, onSelect });
            await openWithKeyboard();
            await userEvent.keyboard('{End}{Enter}');
            expect(onChange.mock.lastCall?.[0]).toBe('North America');
            expect(onSelect).toHaveBeenLastCalledWith('north-america', true, expect.objectContaining({ key: 'north-america' }));
            await closed();
            expect(isOpen()).toBe(false);
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            expect(combobox()).toHaveFocus();
            expect(combobox()).toHaveTextContent('North America');
        });

        test('单选：点击行选中并关闭下拉框，焦点回到触发器', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ defaultExpandAll: true, onChange });
            await userEvent.click(combobox());
            await opened();
            await userEvent.click(row('Beijing'));
            expect(onChange.mock.lastCall?.[0]).toBe('Beijing');
            await closed();
            expect(combobox()).toHaveFocus();
            expect(combobox()).toHaveTextContent('Beijing');
        });

        test('单选：clickToHide 为 false 时点击行后下拉框保持打开', async () => {
            await render({ defaultExpandAll: true, defaultOpen: true, clickToHide: false });
            await opened();
            await userEvent.click(row('Beijing'));
            expect(isOpen()).toBe(true);
            expect(row('Beijing')).toHaveAttribute('aria-selected', 'true');
        });

        test('关闭后重新打开，键盘当前行复位：没有当前行', async () => {
            await render({ defaultExpandAll: true });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Beijing');
            await userEvent.keyboard('{Escape}');
            await closed();
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            await userEvent.keyboard('{ArrowDown}');
            await opened();
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Asia');
        });

        test('多选：Enter 与 Space 勾选当前行且下拉框保持打开，再按取消勾选', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ multiple: true, onChange });
            await openWithKeyboard();
            await userEvent.keyboard('{End}{Enter}');
            expect(onChange.mock.lastCall?.[0]).toEqual(['North America']);
            expect(row('North America')).toHaveAttribute('aria-checked', 'true');
            expect(isOpen()).toBe(true);
            await userEvent.keyboard(' ');
            expect(onChange.mock.lastCall?.[0]).toEqual([]);
            expect(row('North America')).toHaveAttribute('aria-checked', 'false');
            await userEvent.keyboard('{Home} ');
            expect(onChange.mock.lastCall?.[0]).toEqual(['Asia']);
        });

        test('指针：点击展开箭头的行成为当前行，之后方向键从它出发', async () => {
            await render({ defaultOpen: true });
            await opened();
            await userEvent.click(expandIcon('Asia'));
            expect(activeLabel()).toBe('Asia');
            expect(row('Asia')).toHaveClass(`${optionCls}-focused`);
            await focusCombobox();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('China');
        });

        test('指针：单选点击选中的行成为当前行（clickToHide 为 false）', async () => {
            await render({ defaultOpen: true, defaultExpandAll: true, clickToHide: false });
            await opened();
            await userEvent.click(row('Asia'));
            expect(activeLabel()).toBe('Asia');
            await focusCombobox();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('China');
        });

        test('指针：多选点击勾选的行成为当前行', async () => {
            await render({ defaultOpen: true, defaultExpandAll: true, multiple: true });
            await opened();
            await userEvent.click(row('Beijing'));
            expect(activeLabel()).toBe('Beijing');
            await focusCombobox();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Shanghai');
        });

        test('数据变化：当前行被删除后，没有当前行', async () => {
            await render({ defaultExpandAll: true });
            await openWithKeyboard();
            await userEvent.keyboard('{End}');
            expect(activeLabel()).toBe('Mexico');
            await handle.update({ treeData: withoutNode(regions, 'mexico') });
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeLabel()).toBe('Asia');
        });

        test('数据变化：当前行所在的父行被收起后，没有当前行（受控 expandedKeys）', async () => {
            await render({ expandedKeys: ['asia', 'japan'], defaultOpen: true });
            await opened();
            await focusCombobox();
            await userEvent.keyboard('{End}{ArrowUp}{ArrowUp}');
            expect(activeLabel()).toBe('Tokyo');
            await handle.update({ expandedKeys: ['asia'] });
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
            expect(combobox()).not.toHaveAttribute('aria-activedescendant');
        });

        test('受控 expandedKeys：点击箭头只报告新的 key，展开状态由 expandedKeys 决定', async () => {
            const onExpand = vi.fn<NonNullable<TreeSelectSpecProps['onExpand']>>();
            await render({ expandedKeys: ['north-america'], defaultOpen: true, onExpand });
            await opened();
            expect(labels()).toEqual(['Asia', 'North America', 'Canada', 'Mexico']);
            await userEvent.click(expandIcon('Asia'));
            expect(onExpand).toHaveBeenLastCalledWith(['north-america', 'asia'], expect.objectContaining({ expanded: true }));
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await handle.update({ expandedKeys: ['asia'] });
            expect(labels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        });

        test('defaultValue 在触发器上显示选中的标签，并在下拉框里选中对应的行、展开它的祖先', async () => {
            await render({ defaultValue: 'Shanghai', defaultOpen: true });
            await opened();
            expect(combobox()).toHaveTextContent('Shanghai');
            expect(row('Shanghai')).toHaveAttribute('aria-selected', 'true');
            expect(labels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'North America']);
        });

        test('受控 value：选择只报告新值，显示由 value 决定，value 更新后跟随', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ value: 'Beijing', defaultExpandAll: true, defaultOpen: true, onChange });
            await opened();
            await userEvent.click(row('Tokyo'));
            expect(onChange.mock.lastCall?.[0]).toBe('Tokyo');
            expect(combobox()).toHaveTextContent('Beijing');
            await handle.update({ value: 'Canada' });
            expect(combobox()).toHaveTextContent('Canada');
        });

        test('多选：已选项显示为标签，勾选行后 onChange 收到 value 数组', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ multiple: true, defaultValue: ['Tokyo'], defaultExpandAll: true, defaultOpen: true, onChange });
            await opened();
            expect(tagTexts()).toEqual(['Tokyo']);
            await userEvent.click(row('Canada'));
            expect(onChange.mock.lastCall?.[0]).toEqual(['Tokyo', 'Canada']);
            expect(tagTexts()).toEqual(['Tokyo', 'Canada']);
            expect(isOpen()).toBe(true);
        });

        test('多选：点击标签的关闭按钮删除该项，onChange 收到剩余的 value', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ multiple: true, defaultValue: ['Tokyo', 'Canada'], onChange });
            await userEvent.click(tags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)!);
            expect(onChange.mock.lastCall?.[0]).toEqual(['Canada']);
            expect(tagTexts()).toEqual(['Canada']);
        });

        test('多选受控：删除标签只报告新的 value，标签由 value 决定', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ multiple: true, value: ['Tokyo', 'Canada'], onChange });
            await userEvent.click(tags()[1].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)!);
            expect(onChange.mock.lastCall?.[0]).toEqual(['Tokyo']);
            expect(tagTexts()).toEqual(['Tokyo', 'Canada']);
            await handle.update({ value: ['Tokyo'] });
            expect(tagTexts()).toEqual(['Tokyo']);
        });

        test('showClear：有值时显示清除按钮，点击清空，按钮随之消失；没有值时不显示', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ showClear: true, onChange });
            expect(clearButton()).toBeNull();
            handle.unmount();
            await render({ showClear: true, defaultValue: 'Beijing', onChange });
            expect(combobox()).toHaveTextContent('Beijing');
            await userEvent.click(clearButton()!);
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange.mock.lastCall?.[0]).toBeFalsy();
            expect(combobox()).not.toHaveTextContent('Beijing');
            expect(clearButton()).toBeNull();
            expect(isOpen()).toBe(false);
        });

        test('showClear：多选清空全部标签', async () => {
            await render({ multiple: true, showClear: true, defaultValue: ['Tokyo', 'Canada'] });
            await userEvent.click(clearButton()!);
            expect(tagTexts()).toEqual([]);
        });

        test('搜索框在下拉框里：输入过滤行并调用 onSearch；Up 和 Down 移动当前行，输入框的 aria-activedescendant 指向它', async () => {
            const onSearch = vi.fn<NonNullable<TreeSelectSpecProps['onSearch']>>();
            await render({ filterTreeNode: true, showFilteredOnly: true, defaultOpen: true, onSearch });
            await opened();
            const input = dropdownSearch();
            expect(input).toHaveAttribute('aria-controls', tree()!.id);
            expect(input).toHaveAttribute('aria-autocomplete', 'list');
            await userEvent.type(input, 'Tokyo');
            expect(onSearch.mock.lastCall?.[0]).toBe('Tokyo');
            expect(labels()).toEqual(['Asia', 'Japan', 'Tokyo']);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel(input)).toBe('Japan');
            expect(input).toHaveFocus();
            await userEvent.clear(input);
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('搜索框在下拉框里：Left、Right、Home、End、Space 和字符编辑文本，不作用于树', async () => {
            await render({ filterTreeNode: true, defaultOpen: true });
            await opened();
            const input = dropdownSearch();
            await userEvent.click(input);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel(input)).toBe('North America');
            await userEvent.keyboard('{ArrowLeft}{ArrowRight}{Home}{End}');
            expect(activeLabel(input)).toBe('North America');
            expect(row('Asia')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('a b');
            expect(input).toHaveValue('a b');
        });

        test('搜索框在下拉框里：Enter 选中当前行', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ filterTreeNode: true, defaultOpen: true, onChange });
            await opened();
            await userEvent.click(dropdownSearch());
            await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
            expect(onChange.mock.lastCall?.[0]).toBe('North America');
            await closed();
        });

        test('搜索框在下拉框里：搜索无结果时方向键无处可去', async () => {
            await render({ filterTreeNode: true, showFilteredOnly: true, defaultOpen: true });
            await opened();
            const input = dropdownSearch();
            await userEvent.type(input, 'none');
            await userEvent.keyboard('{ArrowDown}');
            expect(input).not.toHaveAttribute('aria-activedescendant');
        });

        test('搜索框在下拉框里：Escape 关闭下拉框', async () => {
            await render({ filterTreeNode: true, defaultOpen: true });
            await opened();
            await userEvent.click(dropdownSearch());
            await userEvent.keyboard('{Escape}');
            await closed();
            expect(isOpen()).toBe(false);
        });

        test('搜索框在触发器上：输入框是 combobox 和唯一的 Tab 停靠点，输入过滤行；Up、Down、Enter 作用于树', async () => {
            const onChange = vi.fn<NonNullable<TreeSelectSpecProps['onChange']>>();
            await render({ filterTreeNode: true, searchPosition: 'trigger', multiple: true, onChange });
            const input = combobox();
            expect(input.tagName).toBe('INPUT');
            expect(input).toHaveAttribute('aria-autocomplete', 'list');
            expect(input).toHaveAttribute('aria-expanded', 'false');
            await userEvent.tab();
            expect(input).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            await opened();
            expect(input.getAttribute('aria-controls')).toBe(tree()!.id);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
            expect(activeLabel(input)).toBe('North America');
            expect(onChange.mock.lastCall?.[0]).toEqual(['North America']);
            expect(checkedLabels()).toEqual(['North America']);
        });

        test('搜索框在触发器上：Left、Right、Home、End、Space 和字符编辑文本，关闭时也不打开下拉框', async () => {
            await render({ filterTreeNode: true, searchPosition: 'trigger' });
            await focusCombobox();
            await userEvent.keyboard('{Home}{End}');
            expect(isOpen()).toBe(false);
            await userEvent.keyboard('a b');
            expect(combobox()).toHaveValue('a b');
        });

        test('搜索框在触发器上：输入过滤行，清空后恢复', async () => {
            const onSearch = vi.fn<NonNullable<TreeSelectSpecProps['onSearch']>>();
            await render({ filterTreeNode: true, showFilteredOnly: true, searchPosition: 'trigger', onSearch });
            await focusCombobox();
            await userEvent.keyboard('Tokyo');
            await opened();
            expect(onSearch.mock.lastCall?.[0]).toBe('Tokyo');
            expect(labels()).toEqual(['Asia', 'Japan', 'Tokyo']);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(activeLabel()).toBe('Japan');
            await userEvent.clear(combobox());
            expect(labels()).toEqual(['Asia', 'North America']);
        });

        test('loadData：打开的下拉框里 Right 展开未加载的行并调用 loadData，加载中 Right 不进入；加载完成后进入第一个子行', async () => {
            const { data, loadData, finish } = lazyData();
            await render({ treeData: data, loadData });
            await openWithKeyboard();
            await userEvent.keyboard('{ArrowDown}{ArrowRight}');
            expect(loadData).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ key: 'lazy' }));
            expect(row('Lazy')).toHaveAttribute('aria-busy', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Lazy');
            finish();
            await waitFor(() => expect(labels()).toEqual(['Lazy', 'Child 1', 'Child 2', 'Plain']));
            await waitFor(() => expect(row('Lazy')).not.toHaveAttribute('aria-busy'));
            await userEvent.keyboard('{ArrowRight}');
            expect(activeLabel()).toBe('Child 1');
        });
    });
}
