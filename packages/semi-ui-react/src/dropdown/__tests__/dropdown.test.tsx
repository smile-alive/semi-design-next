import { StrictMode, createRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { act, render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { ConfigProvider, Dropdown, Tag } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import { sleep } from '@test/utils/react';
import type { DropDownMenuItem, DropdownHandle, DropdownProps } from '../index';

const defaultItems = [{ children: 'Menu Item 1' }, { children: 'Menu Item 2' }, { children: 'Menu Item 3' }];

function getSubMenu(items = defaultItems) {
    let dropdownItems = items.map((item, i) => <Dropdown.Item key={i} {...item} />);
    return <Dropdown.Menu>{dropdownItems}</Dropdown.Menu>;
}

function renderDD(props) {
    let bcProps = {
        // Tooltip-based layers (Popover, Dropdown) animate and delay; turn both off so tests need no waiting
        motion: false,
        mouseEnterDelay: 0,
        mouseLeaveDelay: 0,
        render: getSubMenu(),
        children: <Tag>semi dropdown</Tag>,
        ...props,
    };
    return render(<Dropdown {...bcProps} />);
}

let el_portal_inner = `.${BASE_CLASS_PREFIX}-dropdown-wrapper`;
let el_item = `.${BASE_CLASS_PREFIX}-dropdown-item`;
const getTag = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tag`);

describe('Dropdown', () => {
    it('Dropdown 自定义 className 与 style', () => {
        let props = {
            visible: true,
            trigger: 'custom',
            className: 'test',
            style: {
                color: 'red',
            },
        };
        renderDD(props);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-wrapper.test`)).not.toBeNull();
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown`)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Dropdown trigger hover 触发', async () => {
        // Tooltip re-checks `:hover` on the trigger after the popup is inserted, and jsdom never matches it;
        // report the hover state of the tag as a browser would
        let hovered = null;
        const realMatches = Element.prototype.matches;
        Element.prototype.matches = function (this: Element, selector: string) {
            if (selector === ':hover') {
                return this === hovered;
            }
            return realMatches.call(this, selector);
        } as typeof realMatches;
        try {
            renderDD({ trigger: 'hover' });
            const tag = getTag();
            expect(document.querySelector(el_portal_inner)).toBeNull();
            hovered = tag;
            fireEvent.mouseEnter(tag);
            expect(document.querySelector(el_portal_inner)).not.toBeNull();
            expect(document.querySelectorAll(el_item)).toHaveLength(3);
            await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-wrapper-show`)).not.toBeNull());
            hovered = null;
            fireEvent.mouseLeave(tag);
            await waitFor(() => expect(document.querySelector(el_portal_inner)).toBeNull());
            expect(document.querySelectorAll(el_item)).toHaveLength(0);
        } finally {
            Element.prototype.matches = realMatches;
        }
    });

    it('Dropdown trigger click 触发', async () => {
        let props = {
            trigger: 'click',
        };
        renderDD(props);
        expect(document.querySelector(el_portal_inner)).toBeNull();
        expect(document.querySelector(el_item)).toBeNull();
        await userEvent.click(getTag());
        expect(document.querySelector(el_portal_inner)).not.toBeNull();
        expect(document.querySelectorAll(el_item)).toHaveLength(3);
    });

    it('Dropdown contentClassName', () => {
        let props = {
            contentClassName: 'test',
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown.test`)).not.toBeNull();
    });

    it('Dropdown showTick', () => {
        let items = [{ children: 'Item 1' }, { active: true, children: 'Item 2' }, { children: 'Item 3' }];
        let props = {
            showTick: true,
            render: getSubMenu(items),
            visible: true,
            trigger: 'custom',
        };
        renderDD(props);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-withTick.${BASE_CLASS_PREFIX}-dropdown-item-active`)).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item active', () => {
        let items = [{ children: 'Item 1' }, { active: true, children: 'Item 2' }, { children: 'Item 3' }];
        let props = {
            render: getSubMenu(items),
            visible: true,
            trigger: 'custom',
        };
        renderDD(props);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-active`)).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item type', () => {
        let types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'];
        let items = types.map((type) => {
            return { type, children: `${type}Item` };
        });
        let props = {
            render: getSubMenu(items),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        items.forEach((item) => {
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-dropdown-item-${item.type}`)).toHaveTextContent(new RegExp(`^${item.children}$`));
        });
    });

    it('Dropdown.Item className 与 style', () => {
        let items = [
            { type: 'primary', children: 'primaryItem', className: 'primary-test', style: { color: 'red' } },
            { type: 'secondary', children: 'secondaryItem' },
        ];
        let props = {
            render: getSubMenu(items),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        expect(document.querySelector('li.primary-test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Dropdown.Item disabled', () => {
        let items = [
            { disabled: true, children: 'Item 1' },
            { disabled: false, children: 'Item 2' },
        ];
        let props = {
            render: getSubMenu(items),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        const disabledItems = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-dropdown-item-disabled`);
        expect(disabledItems).toHaveLength(1);
        expect(disabledItems[0]).toHaveTextContent(/^Item 1$/);
    });

    it('Dropdown.Item onClick', async () => {
        let spyItemCLick = vi.fn<(e: ReactMouseEvent) => void>((e) => e.persist());
        let items = [{ children: 'A' }, { children: 'B', onClick: spyItemCLick, className: 'test' }];
        let props = {
            render: getSubMenu(items),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        let targetItem = document.querySelector('li.test');
        await userEvent.click(targetItem);
        expect(spyItemCLick).toHaveBeenCalledTimes(1);
        const [event] = spyItemCLick.mock.calls[0];
        expect(event.type).toBe('click');
        expect(event.button).toBe(0);
        expect(event.target).toBe(targetItem);
    });

    it('Dropdown.Item onMouseEnter/onMouseLeave', () => {
        let spyItemMouseEnter = vi.fn<(e: ReactMouseEvent) => void>((e) => e.persist());
        let spyItemMouseLeave = vi.fn<(e: ReactMouseEvent) => void>((e) => e.persist());
        let items = [{ children: 'A' }, { children: 'B', onMouseEnter: spyItemMouseEnter, onMouseLeave: spyItemMouseLeave, className: 'test' }];
        let props = {
            render: getSubMenu(items),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
        let targetItem = document.querySelector('li.test');
        fireEvent.mouseEnter(targetItem);
        expect(spyItemMouseEnter).toHaveBeenCalledTimes(1);
        expect(spyItemMouseEnter.mock.calls[0][0].type).toBe('mouseenter');
        expect(spyItemMouseEnter.mock.calls[0][0].target).toBe(targetItem);
        fireEvent.mouseLeave(targetItem);
        expect(spyItemMouseLeave).toHaveBeenCalledTimes(1);
        expect(spyItemMouseLeave.mock.calls[0][0].type).toBe('mouseleave');
        expect(spyItemMouseLeave.mock.calls[0][0].target).toBe(targetItem);
    });

    it('Dropdown.Title className 与 style', () => {
        let props = {
            render: (
                <Dropdown.Menu>
                    <Dropdown.Title className="test" style={{ margin: 5 }}>
                        分组1
                    </Dropdown.Title>
                    <Dropdown.Item>primary</Dropdown.Item>
                    <Dropdown.Item type="secondary">secondary</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Title>分组2</Dropdown.Title>
                    <Dropdown.Item type="danger">danger</Dropdown.Item>
                </Dropdown.Menu>
            ),
            trigger: 'custom',
            visible: true,
        };
        renderDD(props);
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
        const { rerender } = render(<Dropdown menu={menu} trigger="custom" visible />);
        expect(document.querySelector('.semi-dropdown-menu').children).toHaveLength(menu.length);
        const menu2: DropDownMenuItem[] = [
            // iconType is not a declared title prop; it must be ignored at runtime
            { node: 'title', name: '分组1', iconType: 'menu' } as unknown as DropDownMenuItem,
            { node: 'item', name: 'secondary', type: 'secondary' },
            { node: 'divider' },
            { node: 'title', name: '分组2' },
            // an unknown node kind must be skipped at runtime
            { node: 'invalid node', name: '分组2' } as unknown as DropDownMenuItem,
        ];
        rerender(<Dropdown menu={menu2} trigger="custom" visible />);
        expect(document.querySelector('.semi-dropdown-menu').children).toHaveLength(menu2.length - 1);
    });
});

const portalInner = () => document.querySelector(el_portal_inner);
const item = (name) => screen.getByText(name, { selector: '[role^="menuitem"]' });

describe('Dropdown 行为', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('菜单渲染标题、选项与分隔线', () => {
        const menu: DropDownMenuItem[] = [
            { node: 'title', name: 'Group' },
            { node: 'item', name: 'A', active: true },
            { node: 'item', name: 'B', disabled: true },
            { node: 'divider', className: 'custom-divider', style: { margin: 3 } },
            { node: 'item', name: 'C', type: 'danger', icon: <span data-testid="icon" /> },
        ];
        render(
            <Dropdown menu={menu} motion={false} trigger="custom" visible>
                <button>menu trigger</button>
            </Dropdown>
        );
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
        const { rerender } = render(
            <Dropdown
                menu={[{ node: 'item', name: 'from menu' }]}
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>from render</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>precedence trigger</button>
            </Dropdown>
        );
        expect(item('from render')).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'from menu' })).toBeNull();
        rerender(
            <Dropdown menu={[{ node: 'item', name: 'from menu' }]} motion={false} render="plain text" trigger="custom" visible>
                <button>precedence trigger</button>
            </Dropdown>
        );
        expect(document.querySelector('.semi-dropdown-content')).toHaveTextContent(/^plain text$/);
        rerender(
            <Dropdown motion={false} render={['first', <span key="second">second</span>]} trigger="custom" visible>
                <button>precedence trigger</button>
            </Dropdown>
        );
        expect(document.querySelector('.semi-dropdown-content')).toHaveTextContent(/^firstsecond$/);
    });

    it('只调用可用选项的 onClick', async () => {
        const onA = vi.fn<(e: ReactMouseEvent) => void>();
        const onB = vi.fn<() => void>();
        render(
            <Dropdown
                menu={[
                    { node: 'item', name: 'A', onClick: onA },
                    { node: 'item', name: 'B', onClick: onB, disabled: true },
                ]}
                motion={false}
                trigger="custom"
                visible
            >
                <button>click trigger</button>
            </Dropdown>
        );
        await userEvent.click(item('B'));
        expect(onB).not.toHaveBeenCalled();
        await userEvent.click(item('A'));
        expect(onA).toHaveBeenCalledTimes(1);
        expect(onA.mock.calls[0][0].target).toBe(item('A'));
    });

    it('clickToHide 在点击选项后关闭弹层', async () => {
        const onVisibleChange = vi.fn<() => void>();
        const onClick = vi.fn<() => void>();
        const { rerender } = render(
            <Dropdown
                clickToHide
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onClick}>hide item</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
                onVisibleChange={onVisibleChange}
            >
                <button>hide trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);

        rerender(
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onClick}>hide item</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
                onVisibleChange={onVisibleChange}
            >
                <button>hide trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(portalInner()).not.toBeNull();
    });

    it('showTick 标记标题并给每个选项加勾选，仅在激活时可见', () => {
        render(
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
                <button>tick trigger</button>
            </Dropdown>
        );
        expect(document.querySelector('.semi-dropdown-title')).toHaveClass('semi-dropdown-title-withTick');
        expect(item('on')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('off')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('on').querySelector('.semi-icon-tick')).not.toBeNull();
        expect(item('on').querySelector<HTMLElement>('.semi-icon-tick').style.color).toBe('');
        expect(item('off').querySelector<HTMLElement>('.semi-icon-tick').style.color).toBe('transparent');
    });

    it('showTick 的勾选不计入选项名称', () => {
        render(
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
                <button>tick name trigger</button>
            </Dropdown>
        );
        expect(screen.getByRole('menuitemcheckbox', { name: 'on' })).toBe(item('on'));
        expect(screen.getByRole('menuitemcheckbox', { name: 'off' })).toBe(item('off'));
    });

    it('showTick 将勾选暴露为带 aria-checked 的 menuitemcheckbox，否则选项保持 menuitem', () => {
        render(
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
                    <button>checkbox trigger</button>
                </Dropdown>
                <Dropdown.Menu>
                    <Dropdown.Item active>plain</Dropdown.Item>
                </Dropdown.Menu>
            </>
        );
        expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
        expect(item('plain')).toHaveAttribute('role', 'menuitem');
        expect(item('plain')).not.toHaveAttribute('aria-checked');
    });

    const renderModes = (props: Partial<DropdownProps>) =>
        render(
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
                <button>mode trigger</button>
            </Dropdown>
        );

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
        renderModes({
            selectionMode: 'single',
            showTick: true,
            menu: [{ node: 'item', name: 'ticked', active: true }],
        });
        expect(item('ticked')).toHaveAttribute('role', 'menuitemradio');
        expect(item('ticked')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('ticked').querySelector<HTMLElement>('.semi-icon-tick').style.color).toBe('');
    });

    it('selectionMode 只作用于本层选项，子菜单不继承', () => {
        const Nested = ({ outer, inner }: Record<'outer' | 'inner', DropdownProps['selectionMode']>) => (
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
                            selectionMode={inner}
                            trigger="custom"
                            visible
                        >
                            <Dropdown.Item active>parent</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                selectionMode={outer}
                trigger="custom"
                visible
            >
                <button>nested mode trigger</button>
            </Dropdown>
        );
        const view = render(<Nested inner={undefined} outer="single" />);
        expect(item('parent')).toHaveAttribute('role', 'menuitemradio');
        expect(item('parent')).toHaveAttribute('aria-checked', 'true');
        expect(item('child')).toHaveAttribute('role', 'menuitem');
        expect(item('child')).not.toHaveAttribute('aria-checked');
        view.rerender(<Nested inner="multiple" outer={undefined} />);
        expect(item('child')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('child')).toHaveAttribute('aria-checked', 'false');
        expect(item('parent')).toHaveAttribute('role', 'menuitem');
    });

    it('选项自身的 showTick 只在 Dropdown 之外生效', () => {
        render(
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
                    <button>own tick trigger</button>
                </Dropdown>
                <Dropdown.Menu>
                    <Dropdown.Item active showTick>
                        outside
                    </Dropdown.Item>
                </Dropdown.Menu>
            </>
        );
        // the Dropdown's showTick (false by default) wins over the item's
        expect(item('inside')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside').querySelector('.semi-icon-tick')).not.toBeNull();
    });

    it('通用触发器无论开合都不带 aria-haspopup 与 aria-expanded', async () => {
        render(
            <>
                <Dropdown motion={false} render={getSubMenu()} trigger="click">
                    <Tag>tag trigger</Tag>
                </Dropdown>
                <Dropdown motion={false} render={getSubMenu()} trigger="click">
                    <span role="menuitem" tabIndex={0}>
                        role trigger
                    </span>
                </Dropdown>
            </>
        );
        // ARIA allows them only on interactive roles; a Tag renders a plain div
        const tag = screen.getByText('tag trigger').closest('.semi-tag');
        expect(tag).not.toHaveAttribute('aria-expanded');
        expect(tag).not.toHaveAttribute('aria-haspopup');
        await userEvent.click(tag);
        await waitFor(() => expect(tag).toHaveClass('semi-dropdown-showing'));
        expect(tag).not.toHaveAttribute('aria-expanded');
        expect(screen.getByRole('menuitem', { name: 'role trigger' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('触发器带 aria-haspopup、aria-expanded 与显示类名', async () => {
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="click">
                <button className="own">aria trigger</button>
            </Dropdown>
        );
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
        const onVisibleChange = vi.fn<() => void>();
        const dropdown = (visible: boolean) => (
            <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible={visible} onVisibleChange={onVisibleChange}>
                <button>controlled trigger</button>
            </Dropdown>
        );
        const { rerender } = render(dropdown(true));
        const button = screen.getByRole('button', { name: 'controlled trigger' });
        expect(portalInner()).not.toBeNull();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        rerender(dropdown(false));
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).not.toHaveClass('semi-dropdown-showing');
        rerender(dropdown(true));
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveClass('semi-dropdown-showing');
        await act(() => sleep(10));
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('trigger="contextMenu" 右键打开 role=menu，左键不打开', async () => {
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="contextMenu">
                <div>area</div>
            </Dropdown>
        );
        const area = screen.getByText('area');
        await userEvent.click(area);
        expect(screen.queryByRole('menu')).toBeNull();
        await userEvent.pointer({ keys: '[MouseRight]', target: area });
        expect(await screen.findByRole('menu')).toBeInTheDocument();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('trigger="contextMenu" 受控 visible 时，Tab 与点击外部只上报关闭而不自行关闭，父级回写后不再重复上报', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const dropdown = (visible: boolean) => (
            <Dropdown motion={false} render={getSubMenu()} trigger="contextMenu" visible={visible} onVisibleChange={onVisibleChange}>
                <button>area</button>
            </Dropdown>
        );
        const { rerender } = render(dropdown(true));
        const button = screen.getByRole('button', { name: 'area' });
        await screen.findByRole('menu');
        button.focus();
        await userEvent.tab();
        await userEvent.click(document.body);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(onVisibleChange.mock.calls).toEqual([[false], [false]]);

        rerender(dropdown(false));
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(onVisibleChange).toHaveBeenCalledTimes(2);
    });

    it('受控 visible 为 false 时点击触发器只上报打开请求，菜单与 aria-expanded 等父级回写', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="click" visible={false} onVisibleChange={onVisibleChange}>
                <button>declined</button>
            </Dropdown>
        );
        const button = screen.getByRole('button', { name: 'declined' });
        await userEvent.click(button);
        await act(() => sleep(50));
        expect(screen.queryByRole('menu')).toBeNull();
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('受控 visible 时键盘打开请求被父级采纳后，焦点进入第一个菜单项，早于 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const focusedAtAfterOpen: (Element | null)[] = [];
        function Controlled() {
            const [visible, setVisible] = useState(false);
            return (
                <Dropdown
                    afterOpen={() => focusedAtAfterOpen.push(document.activeElement)}
                    menu={[
                        { node: 'item', name: 'First' },
                        { node: 'item', name: 'Second' },
                    ]}
                    motion={false}
                    trigger="click"
                    visible={visible}
                    onVisibleChange={(next) => {
                        onVisibleChange(next);
                        setVisible(next);
                    }}
                >
                    <button>applied</button>
                </Dropdown>
            );
        }
        render(<Controlled />);
        screen.getByRole('button', { name: 'applied' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('First')).toHaveFocus());
        expect(screen.getByRole('button', { name: 'applied' })).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(focusedAtAfterOpen).toEqual([item('First')]));
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('方向键在选项间移动焦点，Enter 触发点击', async () => {
        const onC = vi.fn<() => void>();
        render(
            <Dropdown
                menu={[
                    { node: 'item', name: 'Apple' },
                    { node: 'item', name: 'Banana', disabled: true },
                    { node: 'item', name: 'Cherry', onClick: onC },
                ]}
                motion={false}
                trigger="click"
            >
                <button>keyboard trigger</button>
            </Dropdown>
        );
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
        render(
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
                <button>arrow trigger</button>
            </Dropdown>
        );
        const button = screen.getByRole('button', { name: 'arrow trigger' });
        fireEvent.keyDown(button, { key: 'ArrowDown' });
        expect(item('First')).toHaveFocus();
        fireEvent.keyDown(button, { key: 'ArrowUp' });
        expect(item('Middle')).toHaveFocus();
    });

    it('触发器保留自己的 onKeyDown', () => {
        const onKeyDown = vi.fn<() => void>();
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible>
                <button onKeyDown={onKeyDown}>own keydown trigger</button>
            </Dropdown>
        );
        fireEvent.keyDown(screen.getByRole('button', { name: 'own keydown trigger' }), { key: 'x' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('Escape 关闭弹层、调用 onEscKeyDown，并把焦点还给触发器', async () => {
        const onEscKeyDown = vi.fn<() => void>();
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="click" onEscKeyDown={onEscKeyDown}>
                <button>esc trigger</button>
            </Dropdown>
        );
        const button = screen.getByRole('button', { name: 'esc trigger' });
        await userEvent.click(button);
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(onEscKeyDown).toHaveBeenCalledTimes(1);
        expect(button).toHaveFocus();
    });

    it('closeOnEsc 为 false 时按 Escape 不关闭弹层', async () => {
        render(
            <Dropdown closeOnEsc={false} motion={false} render={getSubMenu()} trigger="click">
                <button>no esc trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'no esc trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(portalInner()).not.toBeNull();
    });

    it('弹层容器不是 tooltip 角色，trigger="custom" 时 Escape 把焦点还给触发器', async () => {
        render(
            <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible>
                <button>custom esc trigger</button>
            </Dropdown>
        );
        // a menu is interactive content, which a tooltip must not hold
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(screen.getByRole('menu').closest('[role="tooltip"]')).toBeNull();
        item('Menu Item 2').focus();
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('button', { name: 'custom esc trigger' })).toHaveFocus();
    });

    it('使用方传入的 role 仍落在弹层上，ArrowLeft 照样关闭子菜单并聚焦父级选项', async () => {
        render(
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
                            <Dropdown.Item>role parent</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                <button>role trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'role trigger' }));
        await waitFor(() => expect(item('role parent')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('role inner')).toHaveFocus());
        expect(screen.getByRole('log')).toContainElement(item('role inner'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(document.querySelectorAll(el_portal_inner)).toHaveLength(1));
        expect(item('role parent')).toHaveFocus();
    });

    it('嵌套 Dropdown 的选项在左键 mousedown 时触发 onClick', () => {
        const onInner = vi.fn<() => void>();
        render(
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
                            <Dropdown.Item>outer</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>nested trigger</button>
            </Dropdown>
        );
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
        const onOuterDown = vi.fn<() => void>();
        const onInnerDown = vi.fn<() => void>();
        const onInnerClick = vi.fn<() => void>();
        render(
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
                            <Dropdown.Item onMouseDown={onOuterDown}>outer</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>mousedown trigger</button>
            </Dropdown>
        );
        fireEvent.mouseDown(item('outer'), { button: 0 });
        expect(onOuterDown).toHaveBeenCalledTimes(1);
        fireEvent.mouseDown(item('inner'), { button: 0 });
        expect(onInnerDown).toHaveBeenCalledTimes(1);
        expect(onInnerClick).toHaveBeenCalledTimes(1);
    });

    it('stopPropagation 阻止弹层点击冒泡到 document', async () => {
        const outer = vi.fn<() => void>();
        document.addEventListener('click', outer);
        try {
            const { rerender } = render(
                <Dropdown motion={false} render={getSubMenu()} stopPropagation trigger="custom" visible>
                    <span>stop trigger</span>
                </Dropdown>
            );
            await userEvent.click(item('Menu Item 1'));
            expect(outer).not.toHaveBeenCalled();
            rerender(
                <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible>
                    <span>stop trigger</span>
                </Dropdown>
            );
            await userEvent.click(item('Menu Item 1'));
            expect(outer).toHaveBeenCalledTimes(1);
        } finally {
            document.removeEventListener('click', outer);
        }
    });

    // Dropdown has no DOM of its own: unknown props go to Tooltip, which does not forward them anywhere
    it('data-* 落在 Menu 与 Item 上，不落在 Dropdown 本身', () => {
        render(
            <Dropdown
                data-testid="dropdown-attr"
                motion={false}
                render={
                    <Dropdown.Menu data-testid="menu-attr">
                        <Dropdown.Item data-testid="item-attr">attr item</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>attr trigger</button>
            </Dropdown>
        );
        expect(screen.queryByTestId('dropdown-attr')).toBeNull();
        expect(screen.getByTestId('menu-attr')).toBe(screen.getByRole('menu'));
        expect(screen.getByTestId('item-attr')).toBe(item('attr item'));
    });

    it('Item 的 ref 与 forwardRef 拿到 li 元素', () => {
        const ref = createRef<HTMLLIElement>();
        const forwardRef = vi.fn<() => void>();
        render(
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item ref={ref} forwardRef={forwardRef}>
                            ref item
                        </Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>ref trigger</button>
            </Dropdown>
        );
        expect(ref.current).toBe(item('ref item'));
        expect(forwardRef).toHaveBeenLastCalledWith(item('ref item'));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Dropdown: { trigger: 'click', contentClassName: 'global-content', motion: false },
        };
        render(
            <Dropdown render={getSubMenu()}>
                <button>global trigger</button>
            </Dropdown>
        );
        expect(portalInner()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'global trigger' }));
        await waitFor(() => expect(document.querySelector('.semi-dropdown.global-content')).not.toBeNull());
    });

    it('触发嵌套 Dropdown 的 Dropdown.Item 带 aria-haspopup 与 aria-expanded', () => {
        render(
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible>
                            <Dropdown.Item>nested owner</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>owner trigger</button>
            </Dropdown>
        );
        expect(item('nested owner')).toHaveAttribute('aria-haspopup', 'menu');
        expect(item('nested owner')).not.toHaveAttribute('aria-describedby');
        expect(item('nested owner')).toHaveAttribute('aria-expanded', 'true');
        expect(item('nested owner')).toHaveAttribute('tabindex', '-1');
    });

    it('Menu、Title 与 Divider 把未知属性和 ref 转发到各自元素', () => {
        const menuRef = createRef<HTMLUListElement>();
        const titleRef = createRef<HTMLLIElement>();
        const dividerRef = createRef<HTMLLIElement>();
        render(
            <Dropdown.Menu ref={menuRef}>
                <Dropdown.Title ref={titleRef} id="title-id" data-testid="title-attr">
                    title
                </Dropdown.Title>
                <Dropdown.Divider ref={dividerRef} data-testid="divider-attr" />
                <Dropdown.Item>plain</Dropdown.Item>
            </Dropdown.Menu>
        );
        expect(menuRef.current).toBe(screen.getByRole('menu'));
        expect(titleRef.current).toBe(screen.getByTestId('title-attr'));
        expect(titleRef.current).toHaveAttribute('id', 'title-id');
        expect(titleRef.current).toHaveClass('semi-dropdown-title');
        expect(titleRef.current.tagName).toBe('LI');
        expect(dividerRef.current).toBe(screen.getByRole('separator'));
        expect(dividerRef.current).toHaveAttribute('data-testid', 'divider-attr');
        expect(dividerRef.current).toHaveClass('semi-dropdown-divider');
    });

    it('传给 Dropdown 的 ref 是句柄，不影响点击打开', async () => {
        const ref = createRef<DropdownHandle>();
        render(
            <Dropdown ref={ref} motion={false} render={getSubMenu()} trigger="click">
                <button>ref handle trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'ref handle trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        expect(Object.keys(ref.current).sort()).toEqual(['focusTrigger', 'rePosition']);
    });

    it('ref.focusTrigger 聚焦触发器，ref.rePosition 作用于已打开的弹层', async () => {
        const ref = createRef<DropdownHandle>();
        render(
            <Dropdown ref={ref} motion={false} render={getSubMenu()} trigger="click">
                <button>ref trigger</button>
            </Dropdown>
        );
        act(() => ref.current.focusTrigger());
        expect(screen.getByRole('button', { name: 'ref trigger' })).toHaveFocus();
        await userEvent.click(screen.getByRole('button', { name: 'ref trigger' }));
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(() => act(() => ref.current.rePosition())).not.toThrow();
    });

    it('丢弃 data-* 等未声明属性，不让任何 DOM 节点接收，也不产生 React 警告', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const { container } = renderDD({ visible: true, trigger: 'custom', 'data-extra': 'x', foo: 'bar' });
            await waitFor(() => expect(portalInner()).not.toBeNull());
            expect(document.querySelector('[data-extra]')).toBeNull();
            expect(document.querySelector('[foo]')).toBeNull();
            expect(container.querySelector('[data-extra]')).toBeNull();
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('Home 与 End 聚焦第一个和最后一个可用选项', async () => {
        render(
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
                <button>home end trigger</button>
            </Dropdown>
        );
        await userEvent.click(screen.getByRole('button', { name: 'home end trigger' }));
        await waitFor(() => expect(item('First')).toHaveFocus());
        await userEvent.keyboard('{End}');
        expect(item('Last')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(item('First')).toHaveFocus();
    });

    it('仅在菜单打开时，触发器上的 Up 与 Down 阻止默认行为', async () => {
        const { rerender } = render(
            <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible={false}>
                <button>prevent trigger</button>
            </Dropdown>
        );
        const button = screen.getByRole('button', { name: 'prevent trigger' });
        // fireEvent returns false when a handler called preventDefault
        expect(fireEvent.keyDown(button, { key: 'ArrowDown' })).toBe(true);
        rerender(
            <Dropdown motion={false} render={getSubMenu()} trigger="custom" visible>
                <button>prevent trigger</button>
            </Dropdown>
        );
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        expect(fireEvent.keyDown(button, { key: 'ArrowDown' })).toBe(false);
        expect(item('Menu Item 1')).toHaveFocus();
        expect(fireEvent.keyDown(button, { key: 'ArrowUp' })).toBe(false);
        expect(item('Menu Item 3')).toHaveFocus();
    });

    it('Enter 与 Space 各调用一次子菜单选项的 onClick', () => {
        const onInner = vi.fn<(e: ReactMouseEvent) => void>();
        const onOuter = vi.fn<() => void>();
        render(
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
                            <Dropdown.Item>parent item</Dropdown.Item>
                        </Dropdown>
                    </Dropdown.Menu>
                }
                trigger="custom"
                visible
            >
                <button>deep trigger</button>
            </Dropdown>
        );
        act(() => item('deep item').focus());
        fireEvent.keyDown(item('deep item'), { key: 'Enter' });
        expect(onInner).toHaveBeenCalledTimes(1);
        expect(onInner.mock.calls[0][0].type).toBe('click');
        expect(fireEvent.keyDown(item('deep item'), { key: ' ' })).toBe(false);
        expect(onInner).toHaveBeenCalledTimes(2);
        expect(onOuter).not.toHaveBeenCalled();
        act(() => item('outer item').focus());
        fireEvent.keyDown(item('outer item'), { key: 'Enter' });
        expect(onOuter).toHaveBeenCalledTimes(1);
    });

    it('在自身 onKeyDown 中阻止默认行为的选项不会被激活', () => {
        const onClick = vi.fn<() => void>();
        render(
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
                <button>own key trigger</button>
            </Dropdown>
        );
        fireEvent.keyDown(item('own key item'), { key: 'Enter' });
        expect(onClick).not.toHaveBeenCalled();
    });

    describe('子菜单键盘操作', () => {
        function Nested({ onInner = () => {}, direction }: { onInner?: () => void; direction?: 'ltr' | 'rtl' }) {
            const dropdown = (
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
                                        <Dropdown.Item onClick={onInner}>Inner one</Dropdown.Item>
                                        <Dropdown.Item disabled>Inner disabled</Dropdown.Item>
                                        <Dropdown.Item>Inner two</Dropdown.Item>
                                    </Dropdown.Menu>
                                }
                                trigger="click"
                            >
                                <Dropdown.Item>Parent</Dropdown.Item>
                            </Dropdown>
                            <Dropdown.Item>Omega</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                    trigger="click"
                >
                    <button>nested menu</button>
                </Dropdown>
            );
            return direction ? <ConfigProvider direction={direction}>{dropdown}</ConfigProvider> : dropdown;
        }

        const portals = () => document.querySelectorAll(el_portal_inner);

        async function openOuterAndFocusParent() {
            await userEvent.click(screen.getByRole('button', { name: 'nested menu' }));
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Parent')).toHaveFocus();
        }

        it('Right 打开子菜单并聚焦第一项，Left 关闭子菜单并聚焦父级选项', async () => {
            const onInner = vi.fn<() => void>();
            render(<Nested onInner={onInner} />);
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
            render(<Nested />);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
        });

        it('子菜单触发器自行处理 Enter（Tag）时只激活一次，子菜单保持打开', async () => {
            const onClick = vi.fn<() => void>();
            render(
                <Dropdown
                    motion={false}
                    render={
                        <Dropdown.Menu>
                            <Dropdown menu={[{ node: 'item', name: 'Tag child' }]} motion={false} trigger="click">
                                <Tag onClick={onClick}>tag parent</Tag>
                            </Dropdown>
                        </Dropdown.Menu>
                    }
                    trigger="custom"
                    visible
                >
                    <button>outer</button>
                </Dropdown>
            );
            screen.getByText('tag parent').closest<HTMLElement>('.semi-tag').focus();
            await userEvent.keyboard('{Enter}');
            expect(onClick).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(item('Tag child')).toHaveFocus());
        });

        it('父级选项上的 Up 与 Down 留在父菜单内', async () => {
            render(<Nested />);
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
            render(<Nested />);
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
            render(<Nested direction="rtl" />);
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

    it('StrictMode 下正常工作', async () => {
        const onClick = vi.fn<() => void>();
        function Controlled() {
            const [visible, setVisible] = useState(false);
            return (
                <Dropdown
                    motion={false}
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={onClick}>strict item</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                    trigger="custom"
                    visible={visible}
                >
                    <button onClick={() => setVisible((v) => !v)}>strict trigger</button>
                </Dropdown>
            );
        }
        render(
            <StrictMode>
                <Controlled />
            </StrictMode>
        );
        await userEvent.click(screen.getByRole('button', { name: 'strict trigger' }));
        await userEvent.click(item('strict item'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole('button', { name: 'strict trigger' }));
        await waitFor(() => expect(portalInner()).toBeNull());
    });

    it('打开中卸载时异步补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <Dropdown afterClose={afterClose} menu={[{ node: 'item', name: 'item' }]} motion={false} trigger="custom" visible>
                <button>trigger</button>
            </Dropdown>
        );
        await screen.findByRole('menu');
        unmount();
        expect(afterClose).not.toHaveBeenCalled();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('文本触发器：Enter 打开 click 菜单', async () => {
        render(
            <Dropdown menu={[{ node: 'item', name: 'Apple' }]} motion={false} trigger="click">
                text trigger
            </Dropdown>
        );
        const trigger = screen.getByText('text trigger');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        expect(await screen.findByRole('menu')).toBeInTheDocument();
    });

    it('文本触发器：ArrowDown 把焦点移入已打开的菜单', async () => {
        render(
            <Dropdown menu={[{ node: 'item', name: 'Apple' }]} motion={false} trigger="focus">
                text trigger
            </Dropdown>
        );
        screen.getByText('text trigger').focus();
        await screen.findByRole('menu');
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Apple')).toHaveFocus();
    });

    it('trigger="contextMenu" 右键打开后焦点移到第一个可用项', async () => {
        render(
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
        );
        await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByText('area') });
        await screen.findByRole('menu');
        await waitFor(() => expect(item('On')).toHaveFocus());
    });

    it('menu 项的类型不含 children', () => {
        // @ts-expect-error the label comes from name; children would be overwritten
        const items: DropDownMenuItem[] = [{ node: 'item', name: 'x', children: 'y' }];
        expect(items).toHaveLength(1);
    });

    it('Dropdown.Item 不识别内部 hover 属性', () => {
        render(
            <Dropdown.Menu>
                {/* @ts-expect-error hover is not a public prop */}
                <Dropdown.Item hover>A</Dropdown.Item>
            </Dropdown.Menu>
        );
        expect(item('A')).not.toHaveClass('semi-dropdown-item-hover');
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
    ])('spacing 为 %s 时按默认间距 4 打开', async (_, spacing) => {
        // null is not in the type; an untyped caller may still pass it
        renderDD({ spacing: spacing as unknown as number, trigger: 'custom', visible: true });
        const popup = await waitFor(() => document.querySelector<HTMLElement>(el_portal_inner));
        // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing
        expect(popup.style.top).toBe('4px');
    });

    it('content 与 disableArrowKeyDown 不能撤销菜单外壳', async () => {
        const onExtraFocus = vi.fn<() => void>();
        renderDD({
            children: <button>shell trigger</button>,
            content: 'replaced',
            disableArrowKeyDown: false,
            // Tooltip's own Down handling would first focus the first tabbable, this button
            render: (
                <div>
                    <button onFocus={onExtraFocus}>extra</button>
                    {getSubMenu()}
                </div>
            ),
            trigger: 'custom',
            visible: true,
        });
        expect(await screen.findByRole('menuitem', { name: 'Menu Item 1' })).toBeInTheDocument();
        expect(screen.queryByText('replaced')).toBeNull();
        fireEvent.keyDown(screen.getByRole('button', { name: 'shell trigger' }), { key: 'ArrowDown' });
        expect(item('Menu Item 1')).toHaveFocus();
        expect(onExtraFocus).not.toHaveBeenCalled();
    });

    it('禁用的 Dropdown.Item 作为子菜单父项时点击不打开子菜单，也不在菜单里插入包裹', async () => {
        renderDD({
            trigger: 'custom',
            visible: true,
            render: (
                <Dropdown.Menu>
                    <Dropdown motion={false} render={getSubMenu([{ children: 'Deep' }])} trigger="click">
                        <Dropdown.Item disabled>Parent</Dropdown.Item>
                    </Dropdown>
                </Dropdown.Menu>
            ),
        });
        const parent = await screen.findByRole('menuitem', { name: 'Parent' });
        expect(parent.parentElement).toHaveAttribute('role', 'menu');
        fireEvent.click(parent);
        await sleep(50);
        expect(screen.queryByRole('menuitem', { name: 'Deep' })).toBeNull();
    });

    it('文本输入框作触发器时能输入空格', async () => {
        render(
            <Dropdown menu={[{ node: 'item', name: 'Alpha' }]} motion={false} trigger="click">
                <input aria-label="search" />
            </Dropdown>
        );
        const input = screen.getByRole('textbox', { name: 'search' });
        // focused without a click, which would open the menu and move focus into it
        act(() => input.focus());
        await userEvent.keyboard('a b');
        expect(input).toHaveValue('a b');
    });
});
