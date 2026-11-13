import { screen, waitFor, within, type BoundFunctions, type queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vite-plus/test';
import { checkPattern, type CheckOptions } from '@test/utils/apg';
import { defineSpec, type SpecHandle, type SpecMount, type SpecOptions } from './shared/define-spec';
import { press } from './shared/press';

export interface DropdownSpecItem {
    name: string;
    disabled?: boolean;
    active?: boolean;
    /** Renders the item as the trigger of a click submenu opening to the right */
    submenu?: DropdownSpecItem[];
}

/** Framework-free Dropdown props; each fixture renders `items` in a menu opened by a button named "trigger", followed by a button named "after" */
export interface DropdownSpecProps {
    items: DropdownSpecItem[];
    trigger?: 'click' | 'focus' | 'contextMenu' | 'custom';
    /** `undefined` is uncontrolled */
    visible?: boolean;
    selectionMode?: 'single' | 'multiple';
    showTick?: boolean;
    closeOnEsc?: boolean;
    clickToHide?: boolean;
    direction?: 'ltr' | 'rtl';
    onVisibleChange?: (visible: boolean) => void;
    onEscKeyDown?: () => void;
    /** Called with the item name each time an item is activated */
    onItemClick?: (name: string) => void;
}

const fruits: DropdownSpecItem[] = [{ name: 'Apple' }, { name: 'Banana', disabled: true }, { name: 'Cherry' }];

const nested: DropdownSpecItem[] = [{ name: 'Alpha' }, { name: 'Parent', submenu: [{ name: 'Inner one' }, { name: 'Inner disabled', disabled: true }, { name: 'Inner two' }] }, { name: 'Omega' }];

export function dropdownSpec(mount: SpecMount<DropdownSpecProps>, options: SpecOptions = {}) {
    defineSpec('Dropdown（共享 spec）', options, (test) => {
        let view: BoundFunctions<typeof queries>;
        let handle: SpecHandle<DropdownSpecProps>;

        async function render(props: Partial<DropdownSpecProps> = {}) {
            handle = await mount({ items: fruits, trigger: 'click', ...props });
            view = within(handle.container);
            return handle;
        }

        const trigger = () => view.getByRole('button', { name: 'trigger' });
        const menus = () => screen.queryAllByRole('menu');
        const item = (name: string) => screen.getByText(name, { selector: '[role^="menuitem"]' });
        const focusedName = () => document.activeElement?.textContent?.trim();

        async function open() {
            await userEvent.click(trigger());
            await waitFor(() => expect(menus()).toHaveLength(1));
        }

        async function openNestedAtParent() {
            await render({ items: nested });
            await open();
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Parent')).toHaveFocus();
        }

        test('点击触发器打开 menu，菜单项是 menuitem，禁用项带 aria-disabled；点击外部关闭', async () => {
            await render();
            expect(menus()).toHaveLength(0);
            await open();
            expect(screen.getByRole('menu')).toHaveAttribute('aria-orientation', 'vertical');
            expect(screen.getAllByRole('menuitem').map((element) => element.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry']);
            expect(item('Banana')).toHaveAttribute('aria-disabled', 'true');
            expect(item('Apple')).toHaveAttribute('aria-disabled', 'false');
            await userEvent.click(document.body);
            await waitFor(() => expect(menus()).toHaveLength(0));
        });

        test('触发器带 aria-haspopup="menu"，aria-expanded 随开合变化', async () => {
            await render();
            expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            await open();
            await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'true'));
            await userEvent.click(document.body);
            await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
        });

        test('非受控：开合各调用一次 onVisibleChange', async () => {
            const onVisibleChange = vi.fn<NonNullable<DropdownSpecProps['onVisibleChange']>>();
            await render({ onVisibleChange });
            await open();
            expect(onVisibleChange.mock.calls).toEqual([[true]]);
            await userEvent.click(document.body);
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
        });

        test('受控 visible：按 visible 开合，使用方自己改值不调用 onVisibleChange', async () => {
            const onVisibleChange = vi.fn<NonNullable<DropdownSpecProps['onVisibleChange']>>();
            await render({ trigger: 'custom', visible: true, onVisibleChange });
            expect(screen.getByRole('menu')).toBeInTheDocument();
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            await handle.update({ visible: false });
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            await handle.update({ visible: true });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
            expect(onVisibleChange).not.toHaveBeenCalled();
        });

        test('受控 visible 为 false 时点击触发器只上报打开请求，使用方采纳后菜单打开并聚焦第一个可用项', async () => {
            const onVisibleChange = vi.fn<NonNullable<DropdownSpecProps['onVisibleChange']>>();
            await render({ visible: false, onVisibleChange });
            await userEvent.click(trigger());
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledTimes(1));
            expect(onVisibleChange).toHaveBeenCalledWith(true);
            expect(menus()).toHaveLength(0);
            expect(trigger()).toHaveAttribute('aria-expanded', 'false');
            await handle.update({ visible: true });
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        });

        test('受控 visible 为 true 时点击外部只上报关闭请求，菜单保持打开直到使用方关闭', async () => {
            const onVisibleChange = vi.fn<NonNullable<DropdownSpecProps['onVisibleChange']>>();
            await render({ visible: true, onVisibleChange });
            await waitFor(() => expect(menus()).toHaveLength(1));
            await userEvent.click(document.body);
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(false));
            expect(menus()).toHaveLength(1);
            await handle.update({ visible: false });
            await waitFor(() => expect(menus()).toHaveLength(0));
        });

        test('受控 visible 时触发器上的 ArrowDown 只上报打开请求，使用方采纳后焦点进入第一个可用项', async () => {
            const onVisibleChange = vi.fn<NonNullable<DropdownSpecProps['onVisibleChange']>>();
            await render({ visible: false, onVisibleChange });
            trigger().focus();
            await userEvent.keyboard('{ArrowDown}');
            await waitFor(() => expect(onVisibleChange).toHaveBeenCalledWith(true));
            expect(menus()).toHaveLength(0);
            await handle.update({ visible: true });
            await waitFor(() => expect(item('Apple')).toHaveFocus());
        });

        test('trigger="contextMenu"：右键打开菜单，左键不打开，焦点进入第一个可用项', async () => {
            await render({ trigger: 'contextMenu', items: [{ name: 'Off', disabled: true }, { name: 'On' }] });
            await userEvent.click(trigger());
            expect(menus()).toHaveLength(0);
            await userEvent.pointer({ keys: '[MouseRight]', target: trigger() });
            await waitFor(() => expect(menus()).toHaveLength(1));
            await waitFor(() => expect(item('On')).toHaveFocus());
        });

        test('trigger="focus"：聚焦触发器打开菜单，ArrowDown 把焦点移入菜单', async () => {
            await render({ trigger: 'focus' });
            trigger().focus();
            await waitFor(() => expect(menus()).toHaveLength(1));
            await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'true'));
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Apple')).toHaveFocus();
        });

        test('点击打开后焦点进入第一个可用项，它是唯一的 Tab 停靠点', async () => {
            await render({ items: [{ name: 'Head disabled', disabled: true }, { name: 'First' }, { name: 'Second' }] });
            await open();
            await waitFor(() => expect(item('First')).toHaveFocus());
            expect(item('First')).toHaveAttribute('tabindex', '0');
            expect(item('Second')).toHaveAttribute('tabindex', '-1');
        });

        test('触发器上的 ArrowDown 与 ArrowUp 在菜单关闭时分别打开并聚焦第一个和最后一个可用项', async () => {
            await render({ items: [{ name: 'First' }, { name: 'Middle' }, { name: 'Last disabled', disabled: true }] });
            trigger().focus();
            await userEvent.keyboard('{ArrowDown}');
            await waitFor(() => expect(item('First')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(trigger()).toHaveFocus();
            await userEvent.keyboard('{ArrowUp}');
            await waitFor(() => expect(item('Middle')).toHaveFocus());
        });

        test('Enter 与 Space 在触发器上打开菜单', async () => {
            await render();
            trigger().focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(menus()).toHaveLength(1));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menus()).toHaveLength(0));
            await userEvent.keyboard(' ');
            await waitFor(() => expect(menus()).toHaveLength(1));
        });

        test('方向键在可用项间循环并跳过禁用项', async () => {
            await render();
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Cherry')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Apple')).toHaveFocus();
            await userEvent.keyboard('{ArrowUp}');
            expect(item('Cherry')).toHaveFocus();
        });

        test('Home 与 End 聚焦第一个和最后一个可用项', async () => {
            await render({ items: [{ name: 'Head disabled', disabled: true }, { name: 'First' }, { name: 'Middle' }, { name: 'Last' }, { name: 'Tail disabled', disabled: true }] });
            await open();
            await waitFor(() => expect(item('First')).toHaveFocus());
            await userEvent.keyboard('{End}');
            expect(item('Last')).toHaveFocus();
            await userEvent.keyboard('{Home}');
            expect(item('First')).toHaveFocus();
        });

        test('typeahead：输入字母聚焦标签前缀匹配的可用项，禁用项不匹配', async () => {
            await render({ items: [{ name: 'Apple' }, { name: 'Banana', disabled: true }, { name: 'Cherry' }, { name: 'Avocado' }] });
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('av');
            expect(item('Avocado')).toHaveFocus();
        });

        test('typeahead：没有匹配时焦点不动，字母匹配只考虑可用项', async () => {
            await render({ items: [{ name: 'Apple' }, { name: 'Banana', disabled: true }, { name: 'Cherry' }] });
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('b');
            expect(item('Apple')).toHaveFocus();
        });

        test('Enter 与 Space 各激活一次焦点所在的项，禁用项不激活', async () => {
            const onItemClick = vi.fn<NonNullable<DropdownSpecProps['onItemClick']>>();
            await render({ onItemClick });
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('{Enter}');
            expect(onItemClick.mock.calls).toEqual([['Apple']]);
            await userEvent.keyboard(' ');
            expect(onItemClick.mock.calls).toEqual([['Apple'], ['Apple']]);
            await userEvent.click(item('Banana'));
            expect(onItemClick).toHaveBeenCalledTimes(2);
        });

        test('点击菜单项调用 onItemClick；clickToHide 为 true 时菜单随后关闭，默认保持打开', async () => {
            const onItemClick = vi.fn<NonNullable<DropdownSpecProps['onItemClick']>>();
            await render({ onItemClick });
            await open();
            await userEvent.click(item('Cherry'));
            expect(onItemClick.mock.calls).toEqual([['Cherry']]);
            expect(menus()).toHaveLength(1);
            await userEvent.click(document.body);
            await waitFor(() => expect(menus()).toHaveLength(0));

            await handle.update({ clickToHide: true });
            await open();
            await userEvent.click(item('Cherry'));
            expect(onItemClick).toHaveBeenCalledTimes(2);
            await waitFor(() => expect(menus()).toHaveLength(0));
        });

        test('Escape 关闭菜单、调用 onEscKeyDown，并把焦点还给触发器', async () => {
            const onEscKeyDown = vi.fn<NonNullable<DropdownSpecProps['onEscKeyDown']>>();
            await render({ onEscKeyDown });
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(onEscKeyDown).toHaveBeenCalledTimes(1);
            expect(trigger()).toHaveFocus();
        });

        test('closeOnEsc 为 false 时 Escape 不关闭菜单', async () => {
            await render({ closeOnEsc: false });
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            expect(menus()).toHaveLength(1);
        });

        test('trigger="custom" 时菜单内按 Escape 把焦点还给触发器', async () => {
            await render({ trigger: 'custom', visible: true });
            await waitFor(() => expect(menus()).toHaveLength(1));
            item('Cherry').focus();
            await userEvent.keyboard('{Escape}');
            expect(trigger()).toHaveFocus();
        });

        test('Tab 关闭菜单，焦点从触发器继续移到下一个可聚焦元素，而不是回到触发器', async () => {
            await render();
            await open();
            await waitFor(() => expect(item('Apple')).toHaveFocus());
            await userEvent.tab();
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(view.getByRole('button', { name: 'after' })).toHaveFocus();
        });

        test('selectionMode="single" 的项是带 aria-checked 的 menuitemradio，active 项为选中', async () => {
            await render({ trigger: 'custom', visible: true, selectionMode: 'single', items: [{ name: 'on', active: true }, { name: 'off' }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(screen.getAllByRole('menuitemradio').map((element) => element.textContent?.trim())).toEqual(['on', 'off']);
            expect(item('on')).toHaveAttribute('aria-checked', 'true');
            expect(item('off')).toHaveAttribute('aria-checked', 'false');
        });

        test('selectionMode="multiple" 的项是带 aria-checked 的 menuitemcheckbox', async () => {
            await render({ trigger: 'custom', visible: true, selectionMode: 'multiple', items: [{ name: 'on', active: true }, { name: 'also on', active: true }, { name: 'off' }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(screen.getAllByRole('menuitemcheckbox').map((element) => element.getAttribute('aria-checked'))).toEqual(['true', 'true', 'false']);
        });

        test('showTick 且未设 selectionMode 时项是带 aria-checked 的 menuitemcheckbox', async () => {
            await render({ trigger: 'custom', visible: true, showTick: true, items: [{ name: 'on', active: true }, { name: 'off' }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox');
            expect(item('on')).toHaveAttribute('aria-checked', 'true');
            expect(item('off')).toHaveAttribute('aria-checked', 'false');
        });

        test('selectionMode 优先于 showTick：showTick 与 single 同时设置时项仍是 menuitemradio', async () => {
            await render({ trigger: 'custom', visible: true, showTick: true, selectionMode: 'single', items: [{ name: 'on', active: true }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('on')).toHaveAttribute('role', 'menuitemradio');
        });

        test('未设 selectionMode 与 showTick 时项是不带 aria-checked 的 menuitem', async () => {
            await render({ trigger: 'custom', visible: true, items: [{ name: 'on', active: true }, { name: 'off' }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('on')).toHaveAttribute('role', 'menuitem');
            expect(item('on')).not.toHaveAttribute('aria-checked');
        });

        test('props 更新 selectionMode 后项的角色随之变化', async () => {
            await render({ trigger: 'custom', visible: true, items: [{ name: 'on', active: true }] });
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('on')).toHaveAttribute('role', 'menuitem');
            await handle.update({ selectionMode: 'multiple' });
            expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox');
            expect(item('on')).toHaveAttribute('aria-checked', 'true');
        });

        test('子菜单：父项带 aria-haspopup="menu" 与 aria-expanded，点击父项打开子菜单', async () => {
            await render({ items: nested });
            await open();
            expect(item('Parent')).toHaveAttribute('aria-haspopup', 'menu');
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
            expect(item('Alpha')).not.toHaveAttribute('aria-haspopup');
            await userEvent.click(item('Parent'));
            await waitFor(() => expect(menus()).toHaveLength(2));
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'true');
            expect(item('Inner one')).toBeInTheDocument();
        });

        test('子菜单：ArrowRight 打开子菜单并聚焦第一个可用项，在子菜单内循环，ArrowLeft 关闭子菜单并聚焦父项', async () => {
            await openNestedAtParent();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Inner two')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Inner one')).toHaveFocus();
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
        });

        test('子菜单：在父项上按 Enter 打开子菜单并聚焦第一个可用项，子菜单项按 Enter 激活一次', async () => {
            const onItemClick = vi.fn<NonNullable<DropdownSpecProps['onItemClick']>>();
            await render({ items: nested, onItemClick });
            await open();
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}{Enter}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{Enter}');
            expect(onItemClick.mock.calls).toEqual([['Inner one']]);
        });

        test('子菜单：父项上的 ArrowUp 与 ArrowDown 留在父菜单内', async () => {
            await openNestedAtParent();
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Omega')).toHaveFocus();
            await userEvent.keyboard('{ArrowUp}');
            expect(item('Parent')).toHaveFocus();
            expect(menus()).toHaveLength(1);
        });

        test('子菜单：Escape 先关闭子菜单并聚焦父项，再按一次关闭全部菜单并聚焦触发器', async () => {
            await openNestedAtParent();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(trigger()).toHaveFocus();
        });

        test('子菜单：Tab 关闭全部菜单，焦点从最外层触发器继续移动', async () => {
            await openNestedAtParent();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.tab();
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(view.getByRole('button', { name: 'after' })).toHaveFocus();
        });

        test('子菜单：关闭 closeOnEsc 后 ArrowLeft 仍关闭子菜单', async () => {
            await render({ items: nested, closeOnEsc: false });
            await open();
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
        });

        test('RTL：ArrowLeft 打开子菜单，ArrowRight 关闭，反向的方向键不起作用', async () => {
            await render({ items: nested, direction: 'rtl' });
            await open();
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Parent')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            expect(menus()).toHaveLength(1);
            expect(item('Parent')).toHaveFocus();
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{ArrowLeft}');
            expect(item('Inner one')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(menus()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
        });

        test('触发器上的 Tab 关闭已打开的菜单', async () => {
            await render();
            await open();
            trigger().focus();
            await userEvent.tab();
            await waitFor(() => expect(menus()).toHaveLength(0));
            expect(focusedName()).toBe('after');
        });

        const apg = (title: string, props: Partial<DropdownSpecProps>, menuIndex = 0, options: Partial<CheckOptions> = {}) =>
            test(`APG menu 模式：${title}`, async () => {
                await render(props);
                await open();
                if (menuIndex > 0) {
                    await userEvent.keyboard(`{ArrowDown}{${props.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'}}`);
                }
                await waitFor(() => expect(menus()).toHaveLength(menuIndex + 1));
                await expect(checkPattern('menu', menus()[menuIndex], { press, ...options })).resolves.toBeUndefined();
            });
        apg('顶层菜单', {});
        apg('含禁用项', { items: [{ name: 'Apple' }, { name: 'Banana', disabled: true }, { name: 'Cherry' }, { name: 'Date', disabled: true }] });
        apg('selectionMode 为 single 的 menuitemradio', { selectionMode: 'single', items: [{ name: 'on', active: true }, { name: 'off' }] });
        apg('selectionMode 为 multiple 的 menuitemcheckbox', { selectionMode: 'multiple', items: [{ name: 'on', active: true }, { name: 'off' }] });
        apg('子菜单', { items: nested }, 1);
        apg('RTL 下的子菜单', { items: nested, direction: 'rtl' }, 1, { direction: 'rtl' });
        apg('RTL 下的顶层菜单', { direction: 'rtl' }, 0, { direction: 'rtl' });
    });
}
