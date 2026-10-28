import { type JSX, For, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import Dropdown, { type DropDownMenuItem, type DropDownMenuItemItem, type DropdownHandle, type DropdownItemProps, type DropdownProps } from '..';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import Avatar from '../../avatar';
import ConfigProvider from '../../config-provider';

type ItemProps = Omit<DropdownItemProps, 'children'> & { children?: JSX.Element };
type ClickHandler = (e: MouseEvent) => void;
type Callback = () => void;

const defaultItems: ItemProps[] = [{ children: 'Menu Item 1' }, { children: 'Menu Item 2' }, { children: 'Menu Item 3' }];

const subMenu = (items = defaultItems) => (
    <Dropdown.Menu>
        <For each={items}>{(item) => <Dropdown.Item {...item} />}</For>
    </Dropdown.Menu>
);

// the menu is built lazily: JSX created in the test body, outside the Dropdown, would not see its context
const renderDD = (props: Partial<DropdownProps>, content: () => JSX.Element = () => subMenu()) =>
    render(() => (
        // Tooltip-based layers animate and delay; turn both off so tests need no waiting
        <Dropdown motion={false} mouseEnterDelay={0} mouseLeaveDelay={0} render={content()} {...props}>
            {props.children ?? 'semi dropdown'}
        </Dropdown>
    ));

const portalSelector = `.${BASE_CLASS_PREFIX}-dropdown-wrapper`;
const itemSelector = `.${BASE_CLASS_PREFIX}-dropdown-item`;
const portalInner = () => document.querySelector(portalSelector);
const portals = () => document.querySelectorAll(portalSelector);
const item = (name: string) => screen.getByText(name, { selector: '[role^="menuitem"]' });

describe('Dropdown', () => {
    it('Dropdown 自定义 class 与 style', () => {
        renderDD({ visible: true, trigger: 'custom', class: 'test', style: { color: 'red' } });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-wrapper.test`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Dropdown trigger hover 触发', async () => {
        // Tooltip re-checks `:hover` on the trigger after the popup is inserted, and jsdom never matches it;
        // report the hover state of the trigger as a browser would
        let hovered: Element | null = null;
        vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
            // closest() starts at the element itself, so it stands in for the mocked matches()
            return selector === ':hover' ? this === hovered : this.closest(selector) === this;
        });
        renderDD({ trigger: 'hover' });
        const trigger = screen.getByText('semi dropdown');
        expect(portalInner()).toBeNull();
        hovered = trigger;
        fireEvent.mouseEnter(trigger);
        expect(portalInner()).not.toBeNull();
        expect(document.querySelectorAll(itemSelector)).toHaveLength(3);
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-wrapper-show`)).not.toBeNull());
        hovered = null;
        fireEvent.mouseLeave(trigger);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(document.querySelectorAll(itemSelector)).toHaveLength(0);
    });

    it('Dropdown trigger click 触发', async () => {
        renderDD({ trigger: 'click' });
        expect(portalInner()).toBeNull();
        expect(document.querySelector(itemSelector)).toBeNull();
        await userEvent.click(screen.getByText('semi dropdown'));
        expect(portalInner()).not.toBeNull();
        expect(document.querySelectorAll(itemSelector)).toHaveLength(3);
    });

    it('Dropdown contentClassName', () => {
        renderDD({ contentClassName: 'test', trigger: 'custom', visible: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown.test`)).not.toBeNull();
    });

    it('Dropdown showTick', () => {
        renderDD({ showTick: true, visible: true, trigger: 'custom' }, () => subMenu([{ children: 'Item 1' }, { active: true, children: 'Item 2' }, { children: 'Item 3' }]));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-withTick.${BASE_CLASS_PREFIX}-dropdown-item-active`)).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item active', () => {
        renderDD({ visible: true, trigger: 'custom' }, () => subMenu([{ children: 'Item 1' }, { active: true, children: 'Item 2' }, { children: 'Item 3' }]));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-active`)).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item type', () => {
        const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;
        renderDD({ trigger: 'custom', visible: true }, () => subMenu(types.map((type) => ({ type, children: `${type}Item` }))));
        for (const type of types) {
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-${type}`)).toHaveTextContent(new RegExp(`^${type}Item$`));
        }
    });

    it('Dropdown.Item class 与 style', () => {
        renderDD({ trigger: 'custom', visible: true }, () =>
            subMenu([
                { type: 'primary', children: 'primaryItem', class: 'primary-test', style: { color: 'red' } },
                { type: 'secondary', children: 'secondaryItem' },
            ])
        );
        expect(document.querySelector('li.primary-test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Dropdown.Item disabled', () => {
        renderDD({ trigger: 'custom', visible: true }, () =>
            subMenu([
                { disabled: true, children: 'Item 1' },
                { disabled: false, children: 'Item 2' },
            ])
        );
        const disabledItems = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-dropdown-item-disabled`);
        expect(disabledItems).toHaveLength(1);
        expect(disabledItems[0]).toHaveTextContent(/^Item 1$/);
    });

    it('Dropdown.Item onClick', async () => {
        const onClick = vi.fn<ClickHandler>();
        renderDD({ trigger: 'custom', visible: true }, () => subMenu([{ children: 'A' }, { children: 'B', onClick, class: 'test' }]));
        const target = document.querySelector('li.test') as HTMLElement;
        await userEvent.click(target);
        expect(onClick).toHaveBeenCalledTimes(1);
        const [event] = onClick.mock.calls[0];
        expect(event.type).toBe('click');
        expect(event.button).toBe(0);
        expect(event.target).toBe(target);
    });

    it('Dropdown.Item onMouseEnter/onMouseLeave', () => {
        const onMouseEnter = vi.fn<ClickHandler>();
        const onMouseLeave = vi.fn<ClickHandler>();
        renderDD({ trigger: 'custom', visible: true }, () => subMenu([{ children: 'A' }, { children: 'B', onMouseEnter, onMouseLeave, class: 'test' }]));
        const target = document.querySelector('li.test') as HTMLElement;
        fireEvent.mouseEnter(target);
        expect(onMouseEnter).toHaveBeenCalledTimes(1);
        expect(onMouseEnter.mock.calls[0][0].type).toBe('mouseenter');
        expect(onMouseEnter.mock.calls[0][0].target).toBe(target);
        fireEvent.mouseLeave(target);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
        expect(onMouseLeave.mock.calls[0][0].type).toBe('mouseleave');
        expect(onMouseLeave.mock.calls[0][0].target).toBe(target);
    });

    it('Dropdown.Title class 与 style', () => {
        renderDD({ trigger: 'custom', visible: true }, () => (
            <Dropdown.Menu>
                <Dropdown.Title class="test" style={{ margin: '5px' }}>
                    分组1
                </Dropdown.Title>
                <Dropdown.Item>primary</Dropdown.Item>
                <Dropdown.Item type="secondary">secondary</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Title>分组2</Dropdown.Title>
                <Dropdown.Item type="danger">danger</Dropdown.Item>
            </Dropdown.Menu>
        ));
        const title = document.querySelector('li.test');
        expect(title).toHaveTextContent(/^分组1$/);
        expect(title).toHaveStyle({ margin: '5px' });
    });

    it('Dropdown 数组菜单', () => {
        const menu: DropDownMenuItem[] = [
            { node: 'title', name: '分组1' },
            { node: 'item', name: 'primary1', type: 'primary', onClick: () => {} },
            { node: 'item', name: 'secondary', type: 'secondary' },
            { node: 'divider' },
            { node: 'title', name: '分组2' },
            { node: 'item', name: 'tertiary', type: 'tertiary' },
            { node: 'item', name: 'warning', type: 'warning', active: true },
            { node: 'item', name: 'danger', type: 'danger' },
        ];
        const [items, setItems] = createSignal(menu);
        render(() => <Dropdown menu={items()} trigger="custom" visible />);
        expect(document.querySelector('.semi-dropdown-menu')?.children).toHaveLength(menu.length);
        const menu2: DropDownMenuItem[] = [
            { node: 'title', name: '分组1' },
            { node: 'item', name: 'secondary', type: 'secondary' },
            { node: 'divider' },
            { node: 'title', name: '分组2' },
            // an unknown node kind must be skipped at runtime
            { node: 'invalid node', name: '分组2' } as unknown as DropDownMenuItem,
        ];
        setItems(menu2);
        expect(document.querySelector('.semi-dropdown-menu')?.children).toHaveLength(menu2.length - 1);
    });
});

describe('Dropdown 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('菜单渲染标题、选项与分隔线', () => {
        const menu: DropDownMenuItem[] = [
            { node: 'title', name: 'Group' },
            { node: 'item', name: 'A', active: true },
            { node: 'item', name: 'B', disabled: true },
            { node: 'divider', class: 'custom-divider', style: { margin: '3px' } },
            { node: 'item', name: 'C', type: 'danger', icon: <span data-testid="icon" /> },
        ];
        render(() => (
            <Dropdown menu={menu} motion={false} trigger="custom" visible>
                {(t) => <button {...t()}>menu trigger</button>}
            </Dropdown>
        ));
        const list = screen.getByRole('menu');
        expect(list).toHaveClass('semi-dropdown-menu');
        expect(list).toHaveAttribute('aria-orientation', 'vertical');
        expect(document.querySelector('.semi-dropdown-title')).toHaveTextContent(/^Group$/);
        expect(document.querySelector('.semi-dropdown-title')).not.toHaveClass('semi-dropdown-title-withTick');
        expect(document.querySelectorAll('.semi-dropdown-divider')).toHaveLength(1);
        expect(screen.getByRole('separator')).toHaveClass('semi-dropdown-divider', 'custom-divider');
        expect(screen.getByRole('separator')).toHaveStyle({ margin: '3px' });
        expect([...list.children].map((child) => child.tagName)).toEqual(['LI', 'LI', 'LI', 'LI', 'LI']);
        expect(document.querySelector('.semi-dropdown-title')).toHaveAttribute('role', 'presentation');
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(item('A')).toHaveClass('semi-dropdown-item-active');
        expect(item('A')).toHaveAttribute('aria-disabled', 'false');
        expect(item('A')).toHaveAttribute('tabindex', '-1');
        expect(item('B')).toHaveClass('semi-dropdown-item-disabled');
        expect(item('B')).toHaveAttribute('aria-disabled', 'true');
        expect(item('C')).toHaveClass('semi-dropdown-item-danger');
        expect(item('C').querySelector('.semi-dropdown-item-icon')).toContainElement(screen.getByTestId('icon'));
        expect(document.querySelector('.semi-dropdown-content')).toHaveAttribute('x-semi-prop', 'render');
    });

    it('render 优先于 menu，字符串与数组也照常渲染', () => {
        const [mode, setMode] = createSignal<'element' | 'text' | 'array'>('element');
        const content = () => {
            if (mode() === 'element') {
                return (
                    <Dropdown.Menu>
                        <Dropdown.Item>from render</Dropdown.Item>
                    </Dropdown.Menu>
                );
            }
            return mode() === 'text' ? 'plain text' : ['first', <span>second</span>];
        };
        render(() => (
            <Dropdown menu={mode() === 'array' ? undefined : [{ node: 'item', name: 'from menu' }]} motion={false} render={content()} trigger="custom" visible>
                {(t) => <button {...t()}>precedence trigger</button>}
            </Dropdown>
        ));
        expect(item('from render')).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'from menu' })).toBeNull();
        setMode('text');
        expect(document.querySelector('.semi-dropdown-content')).toHaveTextContent(/^plain text$/);
        setMode('array');
        expect(document.querySelector('.semi-dropdown-content')).toHaveTextContent(/^firstsecond$/);
    });

    it('只调用可用选项的 onClick', async () => {
        const onA = vi.fn<ClickHandler>();
        const onB = vi.fn<ClickHandler>();
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'A', onClick: onA },
                    { node: 'item', name: 'B', onClick: onB, disabled: true },
                ]}
                motion={false}
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>click trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(item('B'));
        expect(onB).not.toHaveBeenCalled();
        await userEvent.click(item('A'));
        expect(onA).toHaveBeenCalledTimes(1);
        expect(onA.mock.calls[0][0].target).toBe(item('A'));
    });

    it('clickToHide 在点击选项后关闭弹层', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onClick = vi.fn<Callback>();
        const [clickToHide, setClickToHide] = createSignal(true);
        render(() => (
            <Dropdown
                clickToHide={clickToHide()}
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onClick}>hide item</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
                onVisibleChange={onVisibleChange}
            >
                {(t) => <button {...t()}>hide trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);

        setClickToHide(false);
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(portalInner()).not.toBeNull();
    });

    it('showTick 标记标题并给每个选项加勾选，仅在激活时可见', () => {
        render(() => (
            <Dropdown
                menu={[
                    { node: 'title', name: 'Tick group' },
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ]}
                motion={false}
                showTick
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>tick trigger</button>}
            </Dropdown>
        ));
        expect(document.querySelector('.semi-dropdown-title')).toHaveClass('semi-dropdown-title-withTick');
        expect(item('on')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('off')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('on').querySelector('.semi-icon-tick')).not.toBeNull();
        expect(item('on').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('');
        expect(item('off').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('transparent');
    });

    it('showTick 的勾选不计入选项名称', () => {
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ]}
                motion={false}
                showTick
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>tick name trigger</button>}
            </Dropdown>
        ));
        expect(screen.getByRole('menuitemcheckbox', { name: 'on' })).toBe(item('on'));
        expect(screen.getByRole('menuitemcheckbox', { name: 'off' })).toBe(item('off'));
    });

    it('showTick 将勾选暴露为带 aria-checked 的 menuitemcheckbox，否则选项保持 menuitem', () => {
        render(() => (
            <>
                <Dropdown
                    menu={[
                        { node: 'item', name: 'on', active: true },
                        { node: 'item', name: 'off' },
                    ]}
                    motion={false}
                    showTick
                    trigger="custom"
                    visible
                >
                    {(t) => <button {...t()}>checkbox trigger</button>}
                </Dropdown>
                <Dropdown.Menu>
                    <Dropdown.Item active>plain</Dropdown.Item>
                </Dropdown.Menu>
            </>
        ));
        expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
        expect(item('plain')).toHaveAttribute('role', 'menuitem');
        expect(item('plain')).not.toHaveAttribute('aria-checked');
    });

    const renderModes = (props: Partial<DropdownProps>) =>
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ]}
                motion={false}
                trigger="custom"
                visible
                {...props}
            >
                {(t) => <button {...t()}>mode trigger</button>}
            </Dropdown>
        ));

    it('selectionMode="single" 的选项是带 aria-checked 的 menuitemradio', () => {
        renderModes({ selectionMode: 'single' });
        expect(item('on')).toHaveAttribute('role', 'menuitemradio');
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('role', 'menuitemradio');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
    });

    it('selectionMode="multiple" 的选项是带 aria-checked 的 menuitemcheckbox', () => {
        renderModes({ selectionMode: 'multiple' });
        expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
    });

    it('未设 selectionMode 且无 showTick 时选项是不带 aria-checked 的 menuitem', () => {
        renderModes({});
        expect(item('on')).toHaveAttribute('role', 'menuitem');
        expect(item('on')).not.toHaveAttribute('aria-checked');
    });

    it('对勾只由 showTick 决定，selectionMode 不改可见 UI', () => {
        renderModes({ selectionMode: 'single' });
        expect(item('on')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('on').querySelector('.semi-icon-tick')).toBeNull();
        renderModes({ selectionMode: 'single', showTick: true, menu: [{ node: 'item', name: 'ticked', active: true }] });
        expect(item('ticked')).toHaveAttribute('role', 'menuitemradio');
        expect(item('ticked')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('ticked').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('');
    });

    it('selectionMode 只作用于本层选项，子菜单不继承', () => {
        const [outer, setOuter] = createSignal<DropdownProps['selectionMode']>('single');
        const [inner, setInner] = createSignal<DropdownProps['selectionMode']>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            motion={false}
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item>child</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                            selectionMode={inner()}
                            trigger="custom"
                            visible
                        >
                            {(t) => (
                                <Dropdown.Item active {...t()}>
                                    parent
                                </Dropdown.Item>
                            )}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                selectionMode={outer()}
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>nested mode trigger</button>}
            </Dropdown>
        ));
        expect(item('parent')).toHaveAttribute('role', 'menuitemradio');
        expect(item('parent')).toHaveAttribute('aria-checked', 'true');
        expect(item('child')).toHaveAttribute('role', 'menuitem');
        expect(item('child')).not.toHaveAttribute('aria-checked');
        setInner('multiple');
        setOuter(undefined);
        expect(item('child')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('child')).toHaveAttribute('aria-checked', 'false');
        expect(item('parent')).toHaveAttribute('role', 'menuitem');
    });

    it('选项自身的 showTick 只在 Dropdown 之外生效', () => {
        render(() => (
            <>
                <Dropdown
                    motion={false}
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item showTick>inside</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                    trigger="custom"
                    visible
                >
                    {(t) => <button {...t()}>own tick trigger</button>}
                </Dropdown>
                <Dropdown.Menu>
                    <Dropdown.Item active showTick>
                        outside
                    </Dropdown.Item>
                </Dropdown.Menu>
            </>
        ));
        // the Dropdown's showTick (false by default) wins over the item's
        expect(item('inside')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside').querySelector('.semi-icon-tick')).not.toBeNull();
    });

    it('通用触发器无论开合都不带 aria-haspopup 与 aria-expanded', async () => {
        render(() => (
            <>
                <Dropdown motion={false} render={subMenu()} trigger="click">
                    {(t) => <div {...t({ class: 'generic' })}>generic trigger</div>}
                </Dropdown>
                <Dropdown motion={false} render={subMenu()} trigger="click">
                    {(t) => <span {...t({ role: 'menuitem' })}>role trigger</span>}
                </Dropdown>
            </>
        ));
        // ARIA allows them only on interactive roles
        const generic = screen.getByText('generic trigger');
        expect(generic).not.toHaveAttribute('aria-expanded');
        expect(generic).not.toHaveAttribute('aria-haspopup');
        await userEvent.click(generic);
        await waitFor(() => expect(generic).toHaveClass('semi-dropdown-showing'));
        expect(generic).not.toHaveAttribute('aria-expanded');
        expect(screen.getByRole('menuitem', { name: 'role trigger' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('触发器带 aria-haspopup、aria-expanded 与显示类名', async () => {
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="click">
                {(t) => <button {...t({ class: 'own' })}>aria trigger</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'aria trigger' });
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveClass('own');
        expect(button).not.toHaveClass('semi-dropdown-showing');
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        expect(button).toHaveClass('own', 'semi-dropdown-showing');
    });

    it('跟随受控的 visible，使用方自行开合不调用 onVisibleChange', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="custom" visible={visible()} onVisibleChange={onVisibleChange}>
                {(t) => <button {...t()}>controlled trigger</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'controlled trigger' });
        expect(portalInner()).not.toBeNull();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        setVisible(false);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).not.toHaveClass('semi-dropdown-showing');
        setVisible(true);
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveClass('semi-dropdown-showing');
        await sleep(10);
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('trigger="contextMenu" 右键打开 role=menu，左键不打开', async () => {
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="contextMenu">
                <div>area</div>
            </Dropdown>
        ));
        const area = screen.getByText('area');
        await userEvent.click(area);
        expect(screen.queryByRole('menu')).toBeNull();
        await userEvent.pointer({ keys: '[MouseRight]', target: area });
        expect(await screen.findByRole('menu')).toBeInTheDocument();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('trigger="contextMenu" 受控 visible 时，Tab 与点击外部只上报关闭而不自行关闭，父级回写后不再重复上报', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const [visible, setVisible] = createSignal(true);
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="contextMenu" visible={visible()} onVisibleChange={onVisibleChange}>
                {(t) => <button {...t()}>area</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'area' });
        await screen.findByRole('menu');
        button.focus();
        await userEvent.tab();
        await userEvent.click(document.body);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(onVisibleChange.mock.calls).toEqual([[false], [false]]);

        setVisible(false);
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控 visible 为 false 时点击触发器只上报打开请求，菜单与 aria-expanded 等父级回写', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="click" visible={false} onVisibleChange={onVisibleChange}>
                {(t) => <button {...t()}>declined</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'declined' });
        await userEvent.click(button);
        await sleep(50);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('受控 visible 时键盘打开请求被父级采纳后，焦点进入第一个菜单项，早于 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const focusedAtAfterOpen: (Element | null)[] = [];
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <Dropdown
                afterOpen={() => focusedAtAfterOpen.push(document.activeElement)}
                menu={[
                    { node: 'item', name: 'First' },
                    { node: 'item', name: 'Second' },
                ]}
                motion={false}
                trigger="click"
                visible={visible()}
                onVisibleChange={(next) => {
                    onVisibleChange(next);
                    setVisible(next);
                }}
            >
                {(t) => <button {...t()}>applied</button>}
            </Dropdown>
        ));
        screen.getByRole('button', { name: 'applied' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('First')).toHaveFocus());
        expect(screen.getByRole('button', { name: 'applied' })).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(focusedAtAfterOpen).toEqual([item('First')]));
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('方向键在选项间移动焦点，Enter 触发点击', async () => {
        const onC = vi.fn<Callback>();
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'Apple' },
                    { node: 'item', name: 'Banana', disabled: true },
                    { node: 'item', name: 'Cherry', onClick: onC },
                ]}
                motion={false}
                trigger="click"
            >
                {(t) => <button {...t()}>keyboard trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'keyboard trigger' }));
        await waitFor(() => expect(item('Apple')).toHaveFocus());
        expect(item('Apple')).toHaveAttribute('tabindex', '0');
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Apple')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('ap');
        expect(item('Apple')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(item('Cherry')).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(onC).toHaveBeenCalledTimes(1);
    });

    it('触发器上的 ArrowDown 与 ArrowUp 聚焦第一个和最后一个可用选项', () => {
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'First' },
                    { node: 'item', name: 'Middle' },
                    { node: 'item', name: 'Last disabled', disabled: true },
                ]}
                motion={false}
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>arrow trigger</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'arrow trigger' });
        fireEvent.keyDown(button, { key: 'ArrowDown' });
        expect(item('First')).toHaveFocus();
        fireEvent.keyDown(button, { key: 'ArrowUp' });
        expect(item('Middle')).toHaveFocus();
    });

    it('触发器保留自己的 onKeyDown', () => {
        const onKeyDown = vi.fn<Callback>();
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="custom" visible>
                {(t) => <button {...t({ onKeyDown })}>own keydown trigger</button>}
            </Dropdown>
        ));
        fireEvent.keyDown(screen.getByRole('button', { name: 'own keydown trigger' }), { key: 'x' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('Escape 关闭弹层、调用 onEscKeyDown，并把焦点还给触发器', async () => {
        const onEscKeyDown = vi.fn<Callback>();
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="click" onEscKeyDown={onEscKeyDown}>
                {(t) => <button {...t()}>esc trigger</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'esc trigger' });
        await userEvent.click(button);
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(onEscKeyDown).toHaveBeenCalledTimes(1);
        expect(button).toHaveFocus();
    });

    it('closeOnEsc 为 false 时按 Escape 不关闭弹层', async () => {
        render(() => (
            <Dropdown closeOnEsc={false} motion={false} render={subMenu()} trigger="click">
                {(t) => <button {...t()}>no esc trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'no esc trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(portalInner()).not.toBeNull();
    });

    it('弹层容器不是 tooltip 角色，trigger="custom" 时 Escape 把焦点还给触发器', async () => {
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="custom" visible>
                {(t) => <button {...t()}>custom esc trigger</button>}
            </Dropdown>
        ));
        // a menu is interactive content, which a tooltip must not hold
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(screen.getByRole('menu').closest('[role="tooltip"]')).toBeNull();
        item('Menu Item 2').focus();
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('button', { name: 'custom esc trigger' })).toHaveFocus();
    });

    it('使用方传入的 role 仍落在弹层上，ArrowLeft 照样关闭子菜单并聚焦父级选项', async () => {
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            role="log"
                            motion={false}
                            position="rightTop"
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item>role inner</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                            trigger="click"
                        >
                            {(t) => <Dropdown.Item {...t()}>role parent</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                {(t) => <button {...t()}>role trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'role trigger' }));
        await waitFor(() => expect(item('role parent')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('role inner')).toHaveFocus());
        expect(screen.getByRole('log')).toContainElement(item('role inner'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(portals()).toHaveLength(1));
        expect(item('role parent')).toHaveFocus();
    });

    it('嵌套 Dropdown 的选项在左键 mousedown 时触发 onClick', () => {
        const onInner = vi.fn<Callback>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            motion={false}
                            position="rightTop"
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={onInner}>inner</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                            trigger="custom"
                            visible
                        >
                            {(t) => <Dropdown.Item {...t()}>outer</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>nested trigger</button>}
            </Dropdown>
        ));
        expect(item('outer')).toHaveClass('semi-dropdown-showing');
        // the click that follows a pointer press (detail 1) does not call onClick a second time
        fireEvent.click(item('inner'), { detail: 1 });
        expect(onInner).not.toHaveBeenCalled();
        fireEvent.mouseDown(item('inner'), { button: 2 });
        expect(onInner).not.toHaveBeenCalled();
        fireEvent.mouseDown(item('inner'), { button: 0 });
        expect(onInner).toHaveBeenCalledTimes(1);
    });

    it('顶层与嵌套 Dropdown 的选项都调用使用方的 onMouseDown', () => {
        const onOuterDown = vi.fn<Callback>();
        const onInnerDown = vi.fn<Callback>();
        const onInnerClick = vi.fn<Callback>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown
                            motion={false}
                            position="rightTop"
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={onInnerClick} onMouseDown={onInnerDown}>
                                        inner
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            }
                            trigger="custom"
                            visible
                        >
                            {(t) => (
                                <Dropdown.Item onMouseDown={onOuterDown} {...t()}>
                                    outer
                                </Dropdown.Item>
                            )}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>mousedown trigger</button>}
            </Dropdown>
        ));
        fireEvent.mouseDown(item('outer'), { button: 0 });
        expect(onOuterDown).toHaveBeenCalledTimes(1);
        fireEvent.mouseDown(item('inner'), { button: 0 });
        expect(onInnerDown).toHaveBeenCalledTimes(1);
        expect(onInnerClick).toHaveBeenCalledTimes(1);
    });

    it('stopPropagation 阻止弹层点击到达逻辑父元素的 JSX 处理函数', async () => {
        const outer = vi.fn<Callback>();
        const [stop, setStop] = createSignal(true);
        render(() => (
            <div role="presentation" onClick={outer}>
                <Dropdown motion={false} render={subMenu()} stopPropagation={stop()} trigger="custom" visible>
                    <span>stop trigger</span>
                </Dropdown>
            </div>
        ));
        await userEvent.click(item('Menu Item 1'));
        expect(outer).not.toHaveBeenCalled();
        setStop(false);
        await userEvent.click(item('Menu Item 1'));
        expect(outer).toHaveBeenCalledTimes(1);
    });

    // Dropdown has no DOM of its own: unknown props go to Tooltip, which does not forward them anywhere
    it('data-* 落在 Menu 与 Item 上，不落在 Dropdown 本身', () => {
        render(() => (
            <Dropdown
                {...({ 'data-testid': 'dropdown-attr' } as Partial<DropdownProps>)}
                motion={false}
                render={
                    <Dropdown.Menu data-testid="menu-attr">
                        <Dropdown.Item data-testid="item-attr">attr item</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>attr trigger</button>}
            </Dropdown>
        ));
        expect(screen.queryByTestId('dropdown-attr')).toBeNull();
        expect(screen.getByTestId('menu-attr')).toBe(screen.getByRole('menu'));
        expect(screen.getByTestId('item-attr')).toBe(item('attr item'));
    });

    it('Item 的 ref 与 forwardRef 拿到 li 元素', () => {
        let ref: HTMLLIElement | undefined;
        const forwardRef = vi.fn<(element: HTMLLIElement) => void>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item ref={(node) => (ref = node)} forwardRef={forwardRef}>
                            ref item
                        </Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>ref trigger</button>}
            </Dropdown>
        ));
        expect(ref).toBe(item('ref item'));
        expect(forwardRef).toHaveBeenLastCalledWith(item('ref item'));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Dropdown: { trigger: 'click', contentClassName: 'global-content', motion: false },
        } as OverrideDefaultProps;
        render(() => <Dropdown render={subMenu()}>{(t) => <button {...t()}>global trigger</button>}</Dropdown>);
        expect(portalInner()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'global trigger' }));
        await waitFor(() => expect(document.querySelector('.semi-dropdown.global-content')).not.toBeNull());
    });

    it('触发嵌套 Dropdown 的 Dropdown.Item 带 aria-haspopup 与 aria-expanded', () => {
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown motion={false} render={subMenu()} trigger="custom" visible>
                            {(t) => <Dropdown.Item {...t()}>nested owner</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>owner trigger</button>}
            </Dropdown>
        ));
        expect(item('nested owner')).toHaveAttribute('aria-haspopup', 'menu');
        expect(item('nested owner')).not.toHaveAttribute('aria-describedby');
        expect(item('nested owner')).toHaveAttribute('aria-expanded', 'true');
        expect(item('nested owner')).toHaveAttribute('tabindex', '-1');
    });

    it('Menu、Title 与 Divider 把未知属性和 ref 转发到各自元素', () => {
        let menuRef: HTMLUListElement | undefined;
        let titleRef: HTMLLIElement | undefined;
        let dividerRef: HTMLLIElement | undefined;
        render(() => (
            <Dropdown.Menu ref={(node) => (menuRef = node)}>
                <Dropdown.Title ref={(node) => (titleRef = node)} id="title-id" data-testid="title-attr">
                    title
                </Dropdown.Title>
                <Dropdown.Divider ref={(node) => (dividerRef = node)} data-testid="divider-attr" />
                <Dropdown.Item>plain</Dropdown.Item>
            </Dropdown.Menu>
        ));
        expect(menuRef).toBe(screen.getByRole('menu'));
        expect(titleRef).toBe(screen.getByTestId('title-attr'));
        expect(titleRef).toHaveAttribute('id', 'title-id');
        expect(titleRef).toHaveClass('semi-dropdown-title');
        expect(titleRef?.tagName).toBe('LI');
        expect(dividerRef).toBe(screen.getByRole('separator'));
        expect(dividerRef).toHaveAttribute('data-testid', 'divider-attr');
        expect(dividerRef).toHaveClass('semi-dropdown-divider');
    });

    it('传给 Dropdown 的 ref 是句柄，不影响点击打开', async () => {
        let handle: DropdownHandle | undefined;
        render(() => (
            <Dropdown ref={(value) => (handle = value)} motion={false} render={subMenu()} trigger="click">
                {(t) => <button {...t()}>ref handle trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'ref handle trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        expect(Object.keys(handle ?? {}).toSorted()).toEqual(['focusTrigger', 'rePosition']);
    });

    it('ref.focusTrigger 聚焦触发器，ref.rePosition 作用于已打开的弹层', async () => {
        let handle: DropdownHandle | undefined;
        render(() => (
            <Dropdown ref={(value) => (handle = value)} motion={false} render={subMenu()} trigger="click">
                {(t) => <button {...t()}>ref trigger</button>}
            </Dropdown>
        ));
        handle?.focusTrigger();
        expect(screen.getByRole('button', { name: 'ref trigger' })).toHaveFocus();
        await userEvent.click(screen.getByRole('button', { name: 'ref trigger' }));
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(() => handle?.rePosition()).not.toThrow();
    });

    it('丢弃 data-* 等未声明属性，不让任何 DOM 节点接收', async () => {
        const { container } = renderDD({ visible: true, trigger: 'custom', ...({ 'data-extra': 'x', foo: 'bar' } as Partial<DropdownProps>) });
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(document.querySelector('[data-extra]')).toBeNull();
        expect(document.querySelector('[foo]')).toBeNull();
        expect(container.querySelector('[data-extra]')).toBeNull();
    });

    it('Home 与 End 聚焦第一个和最后一个可用选项', async () => {
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'Head disabled', disabled: true },
                    { node: 'item', name: 'First' },
                    { node: 'item', name: 'Middle' },
                    { node: 'item', name: 'Last' },
                ]}
                motion={false}
                trigger="click"
            >
                {(t) => <button {...t()}>home end trigger</button>}
            </Dropdown>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'home end trigger' }));
        await waitFor(() => expect(item('First')).toHaveFocus());
        await userEvent.keyboard('{End}');
        expect(item('Last')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(item('First')).toHaveFocus();
    });

    it('仅在菜单打开时，触发器上的 Up 与 Down 阻止默认行为', async () => {
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <Dropdown motion={false} render={subMenu()} trigger="custom" visible={visible()}>
                {(t) => <button {...t()}>prevent trigger</button>}
            </Dropdown>
        ));
        const button = screen.getByRole('button', { name: 'prevent trigger' });
        // fireEvent returns false when a handler called preventDefault
        expect(fireEvent.keyDown(button, { key: 'ArrowDown' })).toBe(true);
        setVisible(true);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        expect(fireEvent.keyDown(button, { key: 'ArrowDown' })).toBe(false);
        expect(item('Menu Item 1')).toHaveFocus();
        expect(fireEvent.keyDown(button, { key: 'ArrowUp' })).toBe(false);
        expect(item('Menu Item 3')).toHaveFocus();
    });

    it('Enter 与 Space 各调用一次子菜单选项的 onClick', () => {
        const onInner = vi.fn<ClickHandler>();
        const onOuter = vi.fn<Callback>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onOuter}>outer item</Dropdown.Item>
                        <Dropdown
                            motion={false}
                            render={
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={onInner}>deep item</Dropdown.Item>
                                </Dropdown.Menu>
                            }
                            trigger="custom"
                            visible
                        >
                            {(t) => <Dropdown.Item {...t()}>parent item</Dropdown.Item>}
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>deep trigger</button>}
            </Dropdown>
        ));
        item('deep item').focus();
        fireEvent.keyDown(item('deep item'), { key: 'Enter' });
        expect(onInner).toHaveBeenCalledTimes(1);
        expect(onInner.mock.calls[0][0].type).toBe('click');
        expect(fireEvent.keyDown(item('deep item'), { key: ' ' })).toBe(false);
        expect(onInner).toHaveBeenCalledTimes(2);
        expect(onOuter).not.toHaveBeenCalled();
        item('outer item').focus();
        fireEvent.keyDown(item('outer item'), { key: 'Enter' });
        expect(onOuter).toHaveBeenCalledTimes(1);
    });

    it('在自身 onKeyDown 中阻止默认行为的选项不会被激活', () => {
        const onClick = vi.fn<Callback>();
        render(() => (
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onClick} onKeyDown={(e) => e.preventDefault()}>
                            own key item
                        </Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                {(t) => <button {...t()}>own key trigger</button>}
            </Dropdown>
        ));
        fireEvent.keyDown(item('own key item'), { key: 'Enter' });
        expect(onClick).not.toHaveBeenCalled();
    });

    describe('子菜单键盘操作', () => {
        function Nested(props: { onInner?: Callback; direction?: 'ltr' | 'rtl' }) {
            return (
                <ConfigProvider direction={props.direction}>
                    <Dropdown
                        motion={false}
                        render={
                            <Dropdown.Menu>
                                <Dropdown.Item>Alpha</Dropdown.Item>
                                <Dropdown
                                    motion={false}
                                    position="rightTop"
                                    render={
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => props.onInner?.()}>Inner one</Dropdown.Item>
                                            <Dropdown.Item disabled>Inner disabled</Dropdown.Item>
                                            <Dropdown.Item>Inner two</Dropdown.Item>
                                        </Dropdown.Menu>
                                    }
                                    trigger="click"
                                >
                                    {(t) => <Dropdown.Item {...t()}>Parent</Dropdown.Item>}
                                </Dropdown>
                                <Dropdown.Item>Omega</Dropdown.Item>
                            </Dropdown.Menu>
                        }
                        trigger="click"
                    >
                        {(t) => <button {...t()}>nested menu</button>}
                    </Dropdown>
                </ConfigProvider>
            );
        }

        async function openOuterAndFocusParent() {
            await userEvent.click(screen.getByRole('button', { name: 'nested menu' }));
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Parent')).toHaveFocus();
        }

        it('Right 打开子菜单并聚焦第一项，Left 关闭子菜单并聚焦父级选项', async () => {
            const onInner = vi.fn<Callback>();
            render(() => <Nested onInner={onInner} />);
            await openOuterAndFocusParent();
            expect(item('Parent')).toHaveAttribute('aria-haspopup', 'menu');
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Inner two')).toHaveFocus();
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Inner one')).toHaveFocus();
            await userEvent.keyboard('{Enter}');
            expect(onInner).toHaveBeenCalledTimes(1);
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(portals()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
        });

        it('在父级选项上按 Enter 打开子菜单并聚焦第一项', async () => {
            render(() => <Nested />);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
        });

        it('子菜单触发器自行处理 Enter 时只激活一次，子菜单保持打开', async () => {
            const onClick = vi.fn<Callback>();
            render(() => (
                <Dropdown
                    motion={false}
                    render={
                        <Dropdown.Menu>
                            <Dropdown menu={[{ node: 'item', name: 'Tag child' }]} motion={false} trigger="click">
                                {/* a clickable Avatar clicks itself on Enter and claims the key */}
                                {(t) => (
                                    <Avatar onClick={onClick} {...t()}>
                                        TP
                                    </Avatar>
                                )}
                            </Dropdown>
                        </Dropdown.Menu>
                    }
                    trigger="custom"
                    visible
                >
                    {(t) => <button {...t()}>outer</button>}
                </Dropdown>
            ));
            screen.getByRole('button', { name: 'TP' }).focus();
            await userEvent.keyboard('{Enter}');
            expect(onClick).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(item('Tag child')).toHaveFocus());
        });

        it('父级选项上的 Up 与 Down 留在父菜单内', async () => {
            render(() => <Nested />);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(item('Parent')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Omega')).toHaveFocus();
            await userEvent.keyboard('{ArrowUp}');
            expect(item('Parent')).toHaveFocus();
        });

        it('Escape 先关闭子菜单，再关闭包含父级选项的菜单', async () => {
            render(() => <Nested />);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(portals()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(portals()).toHaveLength(0));
            expect(screen.getByRole('button', { name: 'nested menu' })).toHaveFocus();
        });

        it('RTL 下 Left 打开子菜单，Right 关闭', async () => {
            render(() => <Nested direction="rtl" />);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{ArrowRight}');
            expect(portals()).toHaveLength(1);
            expect(item('Parent')).toHaveFocus();
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
            await userEvent.keyboard('{ArrowLeft}');
            expect(item('Inner one')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(portals()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
        });
    });

    it('打开中卸载时同步补调一次 afterClose', async () => {
        const afterClose = vi.fn<Callback>();
        const { unmount } = render(() => (
            <Dropdown afterClose={afterClose} menu={[{ node: 'item', name: 'item' }]} motion={false} trigger="custom" visible>
                {(t) => <button {...t()}>trigger</button>}
            </Dropdown>
        ));
        await screen.findByRole('menu');
        unmount();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('文本触发器：Enter 打开 click 菜单', async () => {
        render(() => (
            <Dropdown menu={[{ node: 'item', name: 'Apple' }]} motion={false} trigger="click">
                text trigger
            </Dropdown>
        ));
        const trigger = screen.getByText('text trigger');
        expect(trigger).toHaveAttribute('tabindex', '0');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        expect(await screen.findByRole('menu')).toBeInTheDocument();
    });

    it('文本触发器：ArrowDown 把焦点移入已打开的菜单', async () => {
        render(() => (
            <Dropdown menu={[{ node: 'item', name: 'Apple' }]} motion={false} trigger="focus">
                text trigger
            </Dropdown>
        ));
        screen.getByText('text trigger').focus();
        await screen.findByRole('menu');
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Apple')).toHaveFocus();
    });

    it('非函数 children 中有可聚焦元素时包裹的 span 退出 Tab 顺序并告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        onTestFinished(() => warn.mockRestore());
        render(() => (
            <Dropdown menu={[{ node: 'item', name: 'Apple' }]} motion={false} trigger="click">
                <button type="button">inner button</button>
            </Dropdown>
        ));
        expect(screen.getByRole('button', { name: 'inner button' }).parentElement).toHaveAttribute('tabindex', '-1');
        expect(warn.mock.calls.some(([message]) => String(message).includes('[Semi Dropdown]'))).toBe(true);
    });

    it('trigger="contextMenu" 右键打开后焦点移到第一个可用项', async () => {
        render(() => (
            <Dropdown
                menu={[
                    { node: 'item', name: 'Off', disabled: true },
                    { node: 'item', name: 'On' },
                ]}
                motion={false}
                trigger="contextMenu"
            >
                <div>area</div>
            </Dropdown>
        ));
        await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByText('area') });
        await screen.findByRole('menu');
        await waitFor(() => expect(item('On')).toHaveFocus());
    });

    it('menu 项的类型不含 children', () => {
        // the label comes from name; children would be overwritten
        expectTypeOf<DropDownMenuItemItem>().not.toHaveProperty('children');
    });

    it('默认不显示箭头，传入 showArrow 时显示', () => {
        renderDD({ trigger: 'custom', visible: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-icon-arrow`)).toBeNull();
        renderDD({ trigger: 'custom', visible: true, showArrow: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-icon-arrow`)).not.toBeNull();
    });

    it('Dropdown.Item 不识别内部 hover 属性', () => {
        render(() => (
            <Dropdown.Menu>
                {/* hover is not a public prop */}
                <Dropdown.Item {...({ hover: true } as unknown as DropdownItemProps)}>A</Dropdown.Item>
            </Dropdown.Menu>
        ));
        expect(item('A')).not.toHaveClass('semi-dropdown-item-hover');
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
    ])('spacing 为 %s 时按默认间距 4 打开', async (_, spacing) => {
        // null is not in the type; an untyped caller may still pass it
        renderDD({ spacing: spacing as unknown as number, trigger: 'custom', visible: true });
        const popup = await waitFor(() => document.querySelector<HTMLElement>(portalSelector) as HTMLElement);
        // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing
        expect(popup.style.top).toBe('4px');
    });

    it('content 与 disableArrowKeyDown 不能撤销菜单外壳', async () => {
        const onExtraFocus = vi.fn<Callback>();
        renderDD(
            // neither is a declared prop; ones passed anyway must not replace the menu or its key handling
            { children: (t) => <button {...t()}>shell trigger</button>, ...({ content: 'replaced', disableArrowKeyDown: false } as Partial<DropdownProps>), trigger: 'custom', visible: true },
            // Tooltip's own Down handling would first focus the first tabbable, this button
            () => (
                <div>
                    <button type="button" onFocus={onExtraFocus}>
                        extra
                    </button>
                    {subMenu()}
                </div>
            )
        );
        expect(await screen.findByRole('menuitem', { name: 'Menu Item 1' })).toBeInTheDocument();
        expect(screen.queryByText('replaced')).toBeNull();
        fireEvent.keyDown(screen.getByRole('button', { name: 'shell trigger' }), { key: 'ArrowDown' });
        expect(item('Menu Item 1')).toHaveFocus();
        expect(onExtraFocus).not.toHaveBeenCalled();
    });

    it('禁用的 Dropdown.Item 作为子菜单父项时点击不打开子菜单，也不在菜单里插入包裹', async () => {
        renderDD({ trigger: 'custom', visible: true }, () => (
            <Dropdown.Menu>
                <Dropdown motion={false} render={subMenu([{ children: 'Deep' }])} trigger="click">
                    {(t) => (
                        <Dropdown.Item disabled {...t()}>
                            Parent
                        </Dropdown.Item>
                    )}
                </Dropdown>
            </Dropdown.Menu>
        ));
        const parent = await screen.findByRole('menuitem', { name: 'Parent' });
        expect(parent.parentElement).toHaveAttribute('role', 'menu');
        fireEvent.click(parent);
        await sleep(50);
        expect(screen.queryByRole('menuitem', { name: 'Deep' })).toBeNull();
    });

    it('文本输入框作触发器时能输入空格', async () => {
        render(() => (
            <Dropdown menu={[{ node: 'item', name: 'Alpha' }]} motion={false} trigger="click">
                {(t) => <input aria-label="search" {...t()} />}
            </Dropdown>
        ));
        const input = screen.getByRole('textbox', { name: 'search' });
        // focused without a click, which would open the menu and move focus into it
        input.focus();
        await userEvent.keyboard('a b');
        expect(input).toHaveValue('a b');
    });
});
