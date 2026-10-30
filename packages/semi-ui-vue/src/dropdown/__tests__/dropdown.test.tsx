/** @jsxImportSource vue */
import { createCommentVNode, defineComponent, ref, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Dropdown, { DropdownDivider, DropdownItem, DropdownMenu, DropdownTitle, type DropDownMenuItem, type DropdownHandle, type DropdownProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tag from '../../tag';
import AllHover from './fixtures/all-hover.vue';
import Handle from './fixtures/handle.vue';
import Model from './fixtures/model.vue';
import NestedOpen from './fixtures/nested-open.vue';
import Nested from './fixtures/nested.vue';
import RoleNested from './fixtures/role-nested.vue';
import TickNested from './fixtures/tick-nested.vue';

type ItemEntry = [label: string, props?: Record<string, unknown>];

const defaultLabels = ['Menu Item 1', 'Menu Item 2', 'Menu Item 3'];
const menuOf =
    (entries: ItemEntry[] = defaultLabels.map((label) => [label])) =>
    (): VNode => <DropdownMenu>{() => entries.map(([label, props]) => <DropdownItem {...props}>{() => label}</DropdownItem>)}</DropdownMenu>;

function renderDD(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
    return render(Dropdown, {
        props: { motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0, ...props },
        slots: { default: () => <Tag>{() => 'semi dropdown'}</Tag>, content: menuOf(), ...slots },
    });
}

function renderButton(name: string, props: Record<string, unknown> = {}, content: () => unknown = menuOf()) {
    return render(Dropdown, {
        props: { motion: false, ...props },
        slots: { default: () => <button type="button">{name}</button>, content },
    });
}

const wrapperSelector = '.semi-dropdown-wrapper';
const portalInner = () => document.querySelector(wrapperSelector);
const portals = () => document.querySelectorAll(wrapperSelector);
const item = (name: string) => screen.getByText(name, { selector: '[role^="menuitem"]' });
const getTag = () => document.querySelector<HTMLElement>('.semi-tag') as HTMLElement;
const keyDown = (target: Element, key: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
afterEach(() => {
    semiGlobal.config = {};
});

describe('Dropdown', () => {
    it('Dropdown 自定义 class 与 style', async () => {
        renderDD({ visible: true, trigger: 'custom', class: 'test', style: { color: 'red' } });
        await screen.findByRole('menu');
        expect(document.querySelector('.semi-dropdown-wrapper.test')).not.toBeNull();
        expect(document.querySelector('.semi-dropdown')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Dropdown trigger hover 触发', async () => {
        renderDD({ trigger: 'hover' });
        const tag = getTag();
        expect(portalInner()).toBeNull();
        await userEvent.hover(tag);
        await waitFor(() => expect(document.querySelectorAll('.semi-dropdown-item')).toHaveLength(3));
        await waitFor(() => expect(document.querySelector('.semi-dropdown-wrapper-show')).not.toBeNull());
        await userEvent.unhover(tag);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(document.querySelectorAll('.semi-dropdown-item')).toHaveLength(0);
    });

    it('Dropdown trigger click 触发', async () => {
        renderDD({ trigger: 'click' });
        expect(portalInner()).toBeNull();
        expect(document.querySelector('.semi-dropdown-item')).toBeNull();
        await userEvent.click(getTag());
        await waitFor(() => expect(document.querySelectorAll('.semi-dropdown-item')).toHaveLength(3));
    });

    it('Dropdown contentClassName', async () => {
        renderDD({ contentClassName: 'test', trigger: 'custom', visible: true });
        await screen.findByRole('menu');
        expect(document.querySelector('.semi-dropdown.test')).not.toBeNull();
    });

    it('Dropdown showTick', async () => {
        renderDD({ showTick: true, visible: true, trigger: 'custom' }, { content: menuOf([['Item 1'], ['Item 2', { active: true }], ['Item 3']]) });
        await screen.findByRole('menu');
        expect(document.querySelector('.semi-dropdown-item-withTick.semi-dropdown-item-active')).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item active', async () => {
        renderDD({ visible: true, trigger: 'custom' }, { content: menuOf([['Item 1'], ['Item 2', { active: true }], ['Item 3']]) });
        await screen.findByRole('menu');
        expect(document.querySelector('.semi-dropdown-item-active')).toHaveTextContent(/^Item 2$/);
    });

    it('Dropdown.Item type', async () => {
        const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'];
        renderDD({ trigger: 'custom', visible: true }, { content: menuOf(types.map((type) => [`${type}Item`, { type }])) });
        await screen.findByRole('menu');
        for (const type of types) {
            expect(document.querySelector(`.semi-dropdown-item-${type}`)).toHaveTextContent(new RegExp(`^${type}Item$`));
        }
    });

    it('Dropdown.Item class 与 style', async () => {
        renderDD(
            { trigger: 'custom', visible: true },
            {
                content: menuOf([
                    ['primaryItem', { type: 'primary', class: 'primary-test', style: { color: 'red' } }],
                    ['secondaryItem', { type: 'secondary' }],
                ]),
            }
        );
        await screen.findByRole('menu');
        expect(document.querySelector('li.primary-test')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(document.querySelector('li.primary-test')).toHaveClass('semi-dropdown-item', 'semi-dropdown-item-primary');
    });

    it('Dropdown.Item disabled：禁用项不调用 mouseenter、mouseleave、contextmenu 与 click，仍调用 mousedown', async () => {
        const listeners = {
            onClick: vi.fn<(event: MouseEvent) => void>(),
            onMouseenter: vi.fn<(event: MouseEvent) => void>(),
            onMouseleave: vi.fn<(event: MouseEvent) => void>(),
            onContextmenu: vi.fn<(event: MouseEvent) => void>(),
            onMousedown: vi.fn<(event: MouseEvent) => void>(),
        };
        renderDD(
            { trigger: 'custom', visible: true },
            {
                content: menuOf([
                    ['Item 1', { disabled: true, ...listeners }],
                    ['Item 2', { disabled: false }],
                ]),
            }
        );
        await screen.findByRole('menu');
        const disabledItems = document.querySelectorAll('.semi-dropdown-item-disabled');
        expect(disabledItems).toHaveLength(1);
        expect(disabledItems[0]).toHaveTextContent(/^Item 1$/);
        const disabled = item('Item 1');
        await fireEvent.mouseEnter(disabled);
        await fireEvent.mouseLeave(disabled);
        await fireEvent.contextMenu(disabled);
        await fireEvent.mouseDown(disabled);
        await fireEvent.click(disabled);
        expect(listeners.onMouseenter).not.toHaveBeenCalled();
        expect(listeners.onMouseleave).not.toHaveBeenCalled();
        expect(listeners.onContextmenu).not.toHaveBeenCalled();
        expect(listeners.onClick).not.toHaveBeenCalled();
        expect(listeners.onMousedown).toHaveBeenCalledTimes(1);
    });

    it('Dropdown.Item disabled：带修饰符的 click 监听（onClickOnce、onClickCapture）也不调用', async () => {
        const onClickOnce = vi.fn<(event: MouseEvent) => void>();
        const onClickCapture = vi.fn<(event: MouseEvent) => void>();
        renderDD({ trigger: 'custom', visible: true }, { content: menuOf([['Item 1', { disabled: true, onClickOnce, onClickCapture }]]) });
        await screen.findByRole('menu');
        await fireEvent.click(item('Item 1'));
        expect(onClickOnce).not.toHaveBeenCalled();
        expect(onClickCapture).not.toHaveBeenCalled();
    });

    it('Dropdown.Item @click', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderDD({ trigger: 'custom', visible: true }, { content: menuOf([['A'], ['B', { onClick, class: 'test' }]]) });
        await screen.findByRole('menu');
        const target = document.querySelector('li.test') as HTMLElement;
        await userEvent.click(target);
        expect(onClick).toHaveBeenCalledTimes(1);
        const [event] = onClick.mock.calls[0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event.type).toBe('click');
        expect(event.button).toBe(0);
        expect(event.target).toBe(target);
    });

    it('Dropdown.Item @mouseenter 与 @mouseleave', async () => {
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const onMouseleave = vi.fn<(event: MouseEvent) => void>();
        renderDD({ trigger: 'custom', visible: true }, { content: menuOf([['A'], ['B', { onMouseenter, onMouseleave, class: 'test' }]]) });
        await screen.findByRole('menu');
        const target = document.querySelector('li.test') as HTMLElement;
        await fireEvent.mouseEnter(target);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
        expect(onMouseenter.mock.calls[0][0].type).toBe('mouseenter');
        expect(onMouseenter.mock.calls[0][0].target).toBe(target);
        await fireEvent.mouseLeave(target);
        expect(onMouseleave).toHaveBeenCalledTimes(1);
        expect(onMouseleave.mock.calls[0][0].type).toBe('mouseleave');
        expect(onMouseleave.mock.calls[0][0].target).toBe(target);
    });

    it('Dropdown.Title class 与 style', async () => {
        renderDD(
            { trigger: 'custom', visible: true },
            {
                content: () => (
                    <DropdownMenu>
                        {() => (
                            <>
                                <DropdownTitle class="test" style={{ margin: '5px' }}>
                                    {() => '分组1'}
                                </DropdownTitle>
                                <DropdownItem>{() => 'primary'}</DropdownItem>
                                <DropdownItem type="secondary">{() => 'secondary'}</DropdownItem>
                                <DropdownDivider />
                                <DropdownTitle>{() => '分组2'}</DropdownTitle>
                                <DropdownItem type="danger">{() => 'danger'}</DropdownItem>
                            </>
                        )}
                    </DropdownMenu>
                ),
            }
        );
        await screen.findByRole('menu');
        const title = document.querySelector('li.test');
        expect(title).toHaveTextContent(/^分组1$/);
        expect(title).toHaveStyle({ margin: '5px' });
    });

    it('Dropdown 数组菜单：未知 node 跳过，未声明字段不报错', async () => {
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
        const view = render(Dropdown, { props: { menu, trigger: 'custom', visible: true, motion: false } });
        await screen.findByRole('menu');
        expect(screen.getByRole('menu').children).toHaveLength(menu.length);
        const menu2 = [
            // iconType is not a declared title field; it is ignored at runtime
            { node: 'title', name: '分组1', iconType: 'menu' },
            { node: 'item', name: 'secondary', type: 'secondary' },
            { node: 'divider' },
            { node: 'title', name: '分组2' },
            { node: 'invalid node', name: '分组2' },
        ] as unknown as DropDownMenuItem[];
        await view.rerender({ menu: menu2 });
        expect(screen.getByRole('menu').children).toHaveLength(menu2.length - 1);
    });

    it('Dropdown 数组菜单：替换为其他项时重新挂载，同一项保留元素', async () => {
        const view = render(Dropdown, {
            props: { menu: [{ node: 'item', name: 'first' }], trigger: 'custom', visible: true, motion: false },
        });
        await screen.findByRole('menu');
        const first = item('first');
        await view.rerender({ menu: [{ node: 'item', name: 'first', active: true }] });
        expect(item('first')).toBe(first);
        await view.rerender({ menu: [{ node: 'item', name: 'second' }] });
        expect(item('second')).not.toBe(first);
    });
});

describe('Dropdown 行为', () => {
    it('菜单渲染标题、选项与分隔线，#menuIcon 给数据项渲染图标', async () => {
        const menu: DropDownMenuItem[] = [
            { node: 'title', name: 'Group' },
            { node: 'item', name: 'A', active: true },
            { node: 'item', name: 'B', disabled: true },
            { node: 'divider', class: 'custom-divider', style: { margin: '3px' } },
            { node: 'item', name: 'C', type: 'danger' },
        ];
        const menuIcon = vi.fn<(props: { item: DropDownMenuItem; index: number }) => VNode[]>(({ item: entry }) => ('name' in entry && entry.name === 'C' ? [<span data-testid="icon" />] : []));
        render(Dropdown, {
            props: { menu, motion: false, trigger: 'custom', visible: true },
            slots: { default: () => <button>menu trigger</button>, menuIcon },
        });
        const list = await screen.findByRole('menu');
        expect(list).toHaveClass('semi-dropdown-menu');
        expect(list).toHaveAttribute('aria-orientation', 'vertical');
        const title = document.querySelector('.semi-dropdown-title');
        expect(title).toHaveTextContent(/^Group$/);
        expect(title).not.toHaveClass('semi-dropdown-title-withTick');
        expect(title).toHaveAttribute('role', 'presentation');
        expect(screen.getByRole('separator')).toHaveClass('semi-dropdown-divider', 'custom-divider');
        expect(screen.getByRole('separator')).toHaveStyle({ margin: '3px' });
        expect([...list.children].map((child) => child.tagName)).toEqual(['LI', 'LI', 'LI', 'LI', 'LI']);
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(item('A')).toHaveClass('semi-dropdown-item-active');
        expect(item('A')).toHaveAttribute('aria-disabled', 'false');
        expect(item('A')).toHaveAttribute('tabindex', '-1');
        expect(item('B')).toHaveClass('semi-dropdown-item-disabled');
        expect(item('B')).toHaveAttribute('aria-disabled', 'true');
        expect(item('C')).toHaveClass('semi-dropdown-item-danger');
        expect(item('C').querySelector('.semi-dropdown-item-icon')).toContainElement(screen.getByTestId('icon'));
        expect(item('A').querySelector('.semi-dropdown-item-icon')).toBeNull();
        expect(menuIcon).toHaveBeenCalledWith(expect.objectContaining({ item: menu[4], index: 4 }));
        expect(document.querySelector('.semi-dropdown-content')).toHaveAttribute('x-semi-prop', 'content');
    });

    it.each([
        ['菜单', () => <DropdownMenu>{() => <DropdownItem>{() => 'from content'}</DropdownItem>}</DropdownMenu>, 'from content'],
        ['文本', () => 'plain text', 'plain text'],
        ['多节点', () => ['first', <span>second</span>], 'firstsecond'],
        ['空插槽', () => [], ''],
    ])('#content 优先于 menu：%s', async (_, content, text) => {
        const menu: DropDownMenuItem[] = [{ node: 'item', name: 'from menu' }];
        render(Dropdown, {
            props: { menu, motion: false, trigger: 'custom', visible: true },
            slots: { default: () => <button>precedence trigger</button>, content },
        });
        await waitFor(() => expect(document.querySelector('.semi-dropdown-content')).not.toBeNull());
        expect(document.querySelector('.semi-dropdown-content')?.textContent).toBe(text);
        expect(screen.queryByText('from menu')).toBeNull();
    });

    it('只调用可用选项的 onClick', async () => {
        const onA = vi.fn<(event: MouseEvent) => void>();
        const onB = vi.fn<(event: MouseEvent) => void>();
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'A', onClick: onA },
                    { node: 'item', name: 'B', onClick: onB, disabled: true },
                ],
                motion: false,
                trigger: 'custom',
                visible: true,
            },
            slots: { default: () => <button>click trigger</button> },
        });
        await screen.findByRole('menu');
        await userEvent.click(item('B'));
        expect(onB).not.toHaveBeenCalled();
        await userEvent.click(item('A'));
        expect(onA).toHaveBeenCalledTimes(1);
        expect(onA.mock.calls[0][0].target).toBe(item('A'));
    });

    it('clickToHide 在点击选项后关闭弹层', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = renderButton('hide trigger', { clickToHide: true, trigger: 'click' }, menuOf([['hide item', { onClick }]]));
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(view.emitted<[boolean]>('visibleChange').at(-1)).toEqual([true]));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(view.emitted<[boolean]>('visibleChange').at(-1)).toEqual([false]);
        await view.rerender({ clickToHide: false });
        await userEvent.click(screen.getByRole('button', { name: 'hide trigger' }));
        await waitFor(() => expect(view.emitted<[boolean]>('visibleChange').at(-1)).toEqual([true]));
        await userEvent.click(item('hide item'));
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(portalInner()).not.toBeNull();
    });

    it('showTick 标记标题并给每个选项加勾选，仅在激活时可见', async () => {
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'title', name: 'Tick group' },
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ],
                motion: false,
                showTick: true,
                trigger: 'custom',
                visible: true,
            },
            slots: { default: () => <button>tick trigger</button> },
        });
        await screen.findByRole('menu');
        expect(document.querySelector('.semi-dropdown-title')).toHaveClass('semi-dropdown-title-withTick');
        expect(item('on')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('off')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('on').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('');
        expect(item('off').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('transparent');
    });

    it('showTick 的勾选不计入选项名称', async () => {
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ],
                motion: false,
                showTick: true,
                trigger: 'custom',
                visible: true,
            },
            slots: { default: () => <button>tick name trigger</button> },
        });
        await screen.findByRole('menu');
        expect(screen.getByRole('menuitemcheckbox', { name: 'on' })).toBe(item('on'));
        expect(screen.getByRole('menuitemcheckbox', { name: 'off' })).toBe(item('off'));
    });

    it('showTick 将勾选暴露为带 aria-checked 的 menuitemcheckbox，否则选项保持 menuitem', async () => {
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ],
                motion: false,
                showTick: true,
                trigger: 'custom',
                visible: true,
            },
            slots: { default: () => <button>checkbox trigger</button> },
        });
        render(DropdownMenu, { slots: { default: () => <DropdownItem active>{() => 'plain'}</DropdownItem> } });
        await waitFor(() => expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox'));
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
        expect(item('plain')).toHaveAttribute('role', 'menuitem');
        expect(item('plain')).not.toHaveAttribute('aria-checked');
    });

    const renderModes = (props: Record<string, unknown>) =>
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'on', active: true },
                    { node: 'item', name: 'off' },
                ],
                motion: false,
                trigger: 'custom',
                visible: true,
                ...props,
            },
            slots: { default: () => <button>mode trigger</button> },
        });

    it('selectionMode="single" 的选项是带 aria-checked 的 menuitemradio', async () => {
        renderModes({ selectionMode: 'single' });
        await waitFor(() => expect(item('on')).toHaveAttribute('role', 'menuitemradio'));
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('role', 'menuitemradio');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
    });

    it('selectionMode="multiple" 的选项是带 aria-checked 的 menuitemcheckbox', async () => {
        renderModes({ selectionMode: 'multiple' });
        await waitFor(() => expect(item('on')).toHaveAttribute('role', 'menuitemcheckbox'));
        expect(item('on')).toHaveAttribute('aria-checked', 'true');
        expect(item('off')).toHaveAttribute('aria-checked', 'false');
    });

    it('未设 selectionMode 且无 showTick 时选项是不带 aria-checked 的 menuitem', async () => {
        renderModes({});
        await waitFor(() => expect(item('on')).toHaveAttribute('role', 'menuitem'));
        expect(item('on')).not.toHaveAttribute('aria-checked');
    });

    it('对勾只由 showTick 决定，selectionMode 不改可见 UI', async () => {
        renderModes({ selectionMode: 'single' });
        await waitFor(() => expect(item('on')).toBeInTheDocument());
        expect(item('on')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('on').querySelector('.semi-icon-tick')).toBeNull();
        renderModes({
            selectionMode: 'single',
            showTick: true,
            menu: [{ node: 'item', name: 'ticked', active: true }],
        });
        await waitFor(() => expect(item('ticked')).toHaveAttribute('role', 'menuitemradio'));
        expect(item('ticked')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('ticked').querySelector<HTMLElement>('.semi-icon-tick')?.style.color).toBe('');
    });

    it('选项自身的 showTick 只在 Dropdown 之外生效', async () => {
        renderButton('own tick trigger', { trigger: 'custom', visible: true }, menuOf([['inside', { showTick: true }]]));
        render(DropdownMenu, {
            slots: {
                default: () => (
                    <DropdownItem active showTick>
                        {() => 'outside'}
                    </DropdownItem>
                ),
            },
        });
        await screen.findAllByRole('menu');
        await waitFor(() => expect(item('inside')).toBeInTheDocument());
        expect(item('inside')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside')).toHaveClass('semi-dropdown-item-withTick');
        expect(item('outside').querySelector('.semi-icon-tick')).not.toBeNull();
    });

    it('通用触发器无论开合都不带 aria-haspopup 与 aria-expanded', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: { default: () => <Tag>{() => 'tag trigger'}</Tag>, content: menuOf() },
        });
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: {
                default: () => (
                    <span role="menuitem" tabindex={0}>
                        role trigger
                    </span>
                ),
                content: menuOf(),
            },
        });
        // ARIA allows them only on interactive roles; a Tag renders a plain div
        const tag = screen.getByText('tag trigger').closest('.semi-tag') as HTMLElement;
        expect(tag).not.toHaveAttribute('aria-expanded');
        expect(tag).not.toHaveAttribute('aria-haspopup');
        await userEvent.click(tag);
        await waitFor(() => expect(tag).toHaveClass('semi-dropdown-showing'));
        expect(tag).not.toHaveAttribute('aria-expanded');
        expect(screen.getByText('role trigger')).toHaveAttribute('aria-expanded', 'false');
    });

    it('触发器带 aria-haspopup、aria-expanded 与显示类名', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: { default: () => <button class="own">aria trigger</button>, content: menuOf() },
        });
        const button = screen.getByRole('button', { name: 'aria trigger' });
        expect(button).toHaveAttribute('aria-haspopup', 'menu');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveClass('own');
        expect(button).not.toHaveClass('semi-dropdown-showing');
        await userEvent.click(button);
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        expect(button).toHaveClass('own', 'semi-dropdown-showing');
    });

    it('跟随受控的 visible，父级自行开合不发出 visibleChange', async () => {
        const view = renderButton('controlled trigger', { trigger: 'custom', visible: true });
        const button = screen.getByRole('button', { name: 'controlled trigger' });
        await screen.findByRole('menu');
        expect(button).toHaveAttribute('aria-expanded', 'true');
        await view.rerender({ visible: false });
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).not.toHaveClass('semi-dropdown-showing');
        await view.rerender({ visible: true });
        await screen.findByRole('menu');
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveClass('semi-dropdown-showing');
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(view.emitted('visibleChange')).toBeUndefined();
        expect(view.emitted('update:visible')).toBeUndefined();
    });

    it('受控 visible 时键盘打开请求被父级采纳后，焦点进入第一个菜单项，早于 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const focusedAtAfterOpen: (Element | null)[] = [];
        render(
            defineComponent(() => {
                const visible = ref(false);
                const onUpdate = (next: boolean) => {
                    visible.value = next;
                };
                return () => (
                    <Dropdown motion={false} trigger="click" visible={visible.value} onAfterOpen={() => focusedAtAfterOpen.push(document.activeElement)} onUpdate:visible={onUpdate} onVisibleChange={onVisibleChange}>
                        {{ default: () => <button type="button">applied</button>, content: menuOf([['First'], ['Second']]) }}
                    </Dropdown>
                );
            })
        );
        const button = screen.getByRole('button', { name: 'applied' });
        button.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(item('First')).toHaveFocus());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(focusedAtAfterOpen).toEqual([item('First')]));
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
    });

    it('trigger="contextMenu" 右键打开 role=menu，左键不打开', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'contextMenu' },
            slots: { default: () => <div>area</div>, content: menuOf() },
        });
        const area = screen.getByText('area');
        await userEvent.click(area);
        expect(screen.queryByRole('menu')).toBeNull();
        await userEvent.pointer({ keys: '[MouseRight]', target: area });
        expect(await screen.findByRole('menu')).toBeInTheDocument();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('trigger="contextMenu" 右键打开后焦点移到第一个可用项', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'contextMenu' },
            slots: {
                default: () => <div>area</div>,
                content: menuOf([['Off', { disabled: true }], ['On']]),
            },
        });
        await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByText('area') });
        await screen.findByRole('menu');
        await waitFor(() => expect(item('On')).toHaveFocus());
    });

    it('trigger="contextMenu" 受控 visible 时，Tab 与点击外部只上报关闭而不自行关闭，父级回写后不再上报', async () => {
        const view = renderButton('area', { trigger: 'contextMenu', visible: true });
        await screen.findByRole('menu');
        screen.getByRole('button', { name: 'area' }).focus();
        await userEvent.tab();
        await userEvent.click(document.body);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'area' })).toHaveAttribute('aria-expanded', 'true');
        expect(view.emitted('visibleChange')).toEqual([[false], [false]]);
        await view.rerender({ visible: false });
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(screen.getByRole('button', { name: 'area' })).toHaveAttribute('aria-expanded', 'false');
        expect(view.emitted('visibleChange')).toEqual([[false], [false]]);
    });

    it('方向键在选项间移动焦点，Enter 触发点击', async () => {
        const onC = vi.fn<(event: MouseEvent) => void>();
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'Apple' },
                    { node: 'item', name: 'Banana', disabled: true },
                    { node: 'item', name: 'Cherry', onClick: onC },
                ],
                motion: false,
                trigger: 'click',
            },
            slots: { default: () => <button>keyboard trigger</button> },
        });
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

    it('触发器上的 ArrowDown 与 ArrowUp 聚焦第一个和最后一个可用选项', async () => {
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'First' },
                    { node: 'item', name: 'Middle' },
                    { node: 'item', name: 'Last disabled', disabled: true },
                ],
                motion: false,
                trigger: 'custom',
                visible: true,
            },
            slots: { default: () => <button>arrow trigger</button> },
        });
        await screen.findByRole('menu');
        const button = screen.getByRole('button', { name: 'arrow trigger' });
        await fireEvent.keyDown(button, { key: 'ArrowDown' });
        expect(item('First')).toHaveFocus();
        await fireEvent.keyDown(button, { key: 'ArrowUp' });
        expect(item('Middle')).toHaveFocus();
    });

    it('触发器保留自己的 @keydown', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        render(Dropdown, {
            props: { motion: false, trigger: 'custom', visible: true },
            slots: { default: () => <button onKeydown={onKeydown}>own keydown trigger</button>, content: menuOf() },
        });
        await fireEvent.keyDown(screen.getByRole('button', { name: 'own keydown trigger' }), { key: 'x' });
        expect(onKeydown).toHaveBeenCalledTimes(1);
    });

    it('Escape 关闭弹层、发出 escKeyDown，并把焦点还给触发器', async () => {
        const view = renderButton('esc trigger', { trigger: 'click' });
        const button = screen.getByRole('button', { name: 'esc trigger' });
        await userEvent.click(button);
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(portalInner()).toBeNull());
        const escapes = view.emitted<[KeyboardEvent]>('escKeyDown');
        expect(escapes).toHaveLength(1);
        expect(escapes[0][0]).toBeInstanceOf(KeyboardEvent);
        expect(escapes[0][0].key).toBe('Escape');
        expect(button).toHaveFocus();
    });

    it('closeOnEsc 为 false 时按 Escape 不关闭弹层', async () => {
        renderButton('no esc trigger', { closeOnEsc: false, trigger: 'click' });
        await userEvent.click(screen.getByRole('button', { name: 'no esc trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(portalInner()).not.toBeNull();
    });

    it('弹层容器不是 tooltip 角色，trigger="custom" 时 Escape 把焦点还给触发器', async () => {
        renderButton('custom esc trigger', { trigger: 'custom', visible: true });
        await screen.findByRole('menu');
        // a menu is interactive content, which a tooltip must not hold
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(screen.getByRole('menu').closest('[role="tooltip"]')).toBeNull();
        item('Menu Item 2').focus();
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('button', { name: 'custom esc trigger' })).toHaveFocus();
    });

    it('使用方传入的 role 仍落在弹层上，ArrowLeft 照样关闭子菜单并聚焦父级选项', async () => {
        render(RoleNested);
        await userEvent.click(screen.getByRole('button', { name: 'role trigger' }));
        await waitFor(() => expect(item('role parent')).toHaveFocus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(item('role inner')).toHaveFocus());
        expect(screen.getByRole('log')).toContainElement(item('role inner'));
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(portals()).toHaveLength(1));
        expect(item('role parent')).toHaveFocus();
    });

    it('嵌套 Dropdown 的选项在左键 mousedown 时发出 click', async () => {
        const view = render(NestedOpen);
        await waitFor(() => expect(item('inner item')).toBeInTheDocument());
        expect(item('parent item')).toHaveClass('semi-dropdown-showing');
        // the click that follows a pointer press (detail 1) does not click a second time
        await fireEvent.click(item('inner item'), { detail: 1 });
        expect(view.emitted('innerClick')).toBeUndefined();
        await fireEvent.mouseDown(item('inner item'), { button: 2 });
        expect(view.emitted('innerClick')).toBeUndefined();
        await fireEvent.mouseDown(item('inner item'), { button: 0 });
        expect(view.emitted('innerClick')).toHaveLength(1);
        await fireEvent.click(item('inner item'), { detail: 0 });
        expect(view.emitted('innerClick')).toHaveLength(2);
    });

    it('顶层与嵌套 Dropdown 的选项都调用使用方的 @mousedown', async () => {
        const view = render(NestedOpen);
        await waitFor(() => expect(item('inner item')).toBeInTheDocument());
        await fireEvent.mouseDown(item('parent item'), { button: 0 });
        expect(view.emitted('parentMousedown')).toHaveLength(1);
        await fireEvent.mouseDown(item('inner item'), { button: 0 });
        expect(view.emitted('innerMousedown')).toHaveLength(1);
        expect(view.emitted('innerClick')).toHaveLength(1);
    });

    it('stopPropagation 阻止弹层点击冒泡到 document', async () => {
        const outer = vi.fn<() => void>();
        document.addEventListener('click', outer);
        try {
            const view = render(Dropdown, {
                props: { motion: false, stopPropagation: true, trigger: 'custom', visible: true },
                slots: { default: () => <span>stop trigger</span>, content: menuOf() },
            });
            await screen.findByRole('menu');
            await userEvent.click(item('Menu Item 1'));
            expect(outer).not.toHaveBeenCalled();
            await view.rerender({ stopPropagation: undefined });
            await userEvent.click(item('Menu Item 1'));
            expect(outer).toHaveBeenCalledTimes(1);
        } finally {
            document.removeEventListener('click', outer);
        }
    });

    it('data-* 落在 Menu 与 Item 上，不落在 Dropdown 本身', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'custom', visible: true },
            attrs: { 'data-testid': 'dropdown-attr' },
            slots: {
                default: () => <button>attr trigger</button>,
                content: () => <DropdownMenu data-testid="menu-attr">{() => <DropdownItem data-testid="item-attr">{() => 'attr item'}</DropdownItem>}</DropdownMenu>,
            },
        });
        await screen.findByRole('menu');
        expect(screen.queryByTestId('dropdown-attr')).toBeNull();
        expect(screen.getByTestId('menu-attr')).toBe(screen.getByRole('menu'));
        expect(screen.getByTestId('item-attr')).toBe(item('attr item'));
    });

    it('Item 模板 ref 的 $el 是 li 元素', async () => {
        const ref = vi.fn<(instance: unknown) => void>();
        renderButton('ref trigger', { trigger: 'custom', visible: true }, () => <DropdownMenu>{() => <DropdownItem ref={ref}>{() => 'ref item'}</DropdownItem>}</DropdownMenu>);
        await screen.findByRole('menu');
        expect((ref.mock.lastCall?.[0] as { $el: Element } | undefined)?.$el).toBe(item('ref item'));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config = {
            overrideDefaultProps: {
                Dropdown: { trigger: 'click', contentClassName: 'global-content', motion: false },
            },
        };
        render(Dropdown, { slots: { default: () => <button>global trigger</button>, content: menuOf() } });
        expect(portalInner()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'global trigger' }));
        await waitFor(() => expect(document.querySelector('.semi-dropdown.global-content')).not.toBeNull());
    });

    it('全局默认值里的 wrapperId 不影响 Dropdown', async () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config = { overrideDefaultProps: { Dropdown: { wrapperId: 'popup-global' } } as object };
        render(Dropdown, {
            props: { trigger: 'custom', visible: true, motion: false },
            slots: { default: () => <button>trigger</button>, content: menuOf() },
        });
        await screen.findByRole('menu');
        expect(document.getElementById('popup-global')).toBeNull();
    });

    it('触发嵌套 Dropdown 的 Dropdown.Item 带 aria-haspopup 与 aria-expanded', async () => {
        render(NestedOpen);
        await waitFor(() => expect(item('inner item')).toBeInTheDocument());
        expect(item('parent item')).toHaveAttribute('aria-haspopup', 'menu');
        expect(item('parent item')).not.toHaveAttribute('aria-describedby');
        expect(item('parent item')).toHaveAttribute('aria-expanded', 'true');
        expect(item('parent item')).toHaveAttribute('tabindex', '-1');
    });

    it('Menu、Title 与 Divider 把未知属性落到各自元素，模板 ref 的 $el 是该元素', () => {
        const refs = {
            title: vi.fn<(instance: unknown) => void>(),
            divider: vi.fn<(instance: unknown) => void>(),
        };
        render(DropdownMenu, {
            attrs: { 'data-testid': 'menu-attr' },
            slots: {
                default: () => (
                    <>
                        <DropdownTitle ref={refs.title} id="title-id" data-testid="title-attr">
                            {() => 'title'}
                        </DropdownTitle>
                        <DropdownDivider ref={refs.divider} data-testid="divider-attr" />
                        <DropdownItem>{() => 'plain'}</DropdownItem>
                    </>
                ),
            },
        });
        const el = (spy: (typeof refs)['title']) => (spy.mock.lastCall?.[0] as { $el: Element } | undefined)?.$el;
        const title = screen.getByTestId('title-attr');
        expect(title).toHaveAttribute('id', 'title-id');
        expect(title).toHaveClass('semi-dropdown-title');
        expect(title.tagName).toBe('LI');
        expect(el(refs.title)).toBe(title);
        expect(el(refs.divider)).toBe(screen.getByRole('separator'));
        expect(screen.getByRole('separator')).toHaveAttribute('data-testid', 'divider-attr');
        expect(screen.getByRole('separator')).toHaveClass('semi-dropdown-divider');
        expect(screen.getByTestId('menu-attr')).toBe(screen.getByRole('menu'));
        expect(screen.getByRole('menu')).toHaveClass('semi-dropdown-menu');
    });

    it('Dropdown 的 ref 是句柄，不影响点击打开', async () => {
        const view = render(Handle);
        await userEvent.click(screen.getByRole('button', { name: 'ref trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        const [[handle]] = view.emitted<[DropdownHandle]>('ready');
        expect(Object.keys(handle).sort()).toEqual(['focusTrigger', 'rePosition']);
    });

    it('ref.focusTrigger 聚焦触发器，ref.rePosition 作用于已打开的弹层', async () => {
        const view = render(Handle);
        const [[handle]] = view.emitted<[DropdownHandle]>('ready');
        handle.focusTrigger();
        expect(screen.getByRole('button', { name: 'ref trigger' })).toHaveFocus();
        await userEvent.click(screen.getByRole('button', { name: 'ref trigger' }));
        await waitFor(() => expect(portalInner()).not.toBeNull());
        expect(() => handle.rePosition()).not.toThrow();
    });

    it('丢弃 data-*、id 等未声明属性，不让任何 DOM 节点接收，也不产生 Vue 警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderDD({ visible: true, trigger: 'custom', 'data-extra': 'x', foo: 'bar', id: 'dropdown-id' });
        await screen.findByRole('menu');
        expect(document.querySelector('[data-extra]')).toBeNull();
        expect(document.querySelector('[foo]')).toBeNull();
        expect(document.getElementById('dropdown-id')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
    });

    it('Home 与 End 聚焦第一个和最后一个可用选项', async () => {
        render(Dropdown, {
            props: {
                menu: [
                    { node: 'item', name: 'Head disabled', disabled: true },
                    { node: 'item', name: 'First' },
                    { node: 'item', name: 'Middle' },
                    { node: 'item', name: 'Last' },
                ],
                motion: false,
                trigger: 'click',
            },
            slots: { default: () => <button>home end trigger</button> },
        });
        await userEvent.click(screen.getByRole('button', { name: 'home end trigger' }));
        await waitFor(() => expect(item('First')).toHaveFocus());
        await userEvent.keyboard('{End}');
        expect(item('Last')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        expect(item('First')).toHaveFocus();
    });

    it('仅在菜单打开时，触发器上的 Up 与 Down 阻止默认行为', async () => {
        const view = renderButton('prevent trigger', { trigger: 'custom', visible: false });
        const button = screen.getByRole('button', { name: 'prevent trigger' });
        expect(keyDown(button, 'ArrowDown')).toBe(true);
        await view.rerender({ visible: true });
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        expect(keyDown(button, 'ArrowDown')).toBe(false);
        expect(item('Menu Item 1')).toHaveFocus();
        expect(keyDown(button, 'ArrowUp')).toBe(false);
        expect(item('Menu Item 3')).toHaveFocus();
    });

    it('Enter 与 Space 各点击一次子菜单选项', async () => {
        const view = render(NestedOpen);
        await waitFor(() => expect(item('inner item')).toBeInTheDocument());
        item('inner item').focus();
        await fireEvent.keyDown(item('inner item'), { key: 'Enter' });
        const clicks = () => view.emitted<[MouseEvent]>('innerClick') ?? [];
        expect(clicks()).toHaveLength(1);
        expect(clicks()[0][0].type).toBe('click');
        // Space is prevented so that the page does not scroll
        expect(keyDown(item('inner item'), ' ')).toBe(false);
        expect(clicks()).toHaveLength(2);
        expect(view.emitted('outerClick')).toBeUndefined();
        item('outer item').focus();
        await fireEvent.keyDown(item('outer item'), { key: 'Enter' });
        expect(view.emitted('outerClick')).toHaveLength(1);
    });

    it('在自身 @keydown 中阻止默认行为的选项不会被激活', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderButton('own key trigger', { trigger: 'custom', visible: true }, () => (
            <DropdownMenu>
                {() => (
                    <DropdownItem onClick={onClick} onKeydown={(event: KeyboardEvent) => event.preventDefault()}>
                        {() => 'own key item'}
                    </DropdownItem>
                )}
            </DropdownMenu>
        ));
        await screen.findByRole('menu');
        await fireEvent.keyDown(item('own key item'), { key: 'Enter' });
        expect(onClick).not.toHaveBeenCalled();
    });

    describe('子菜单键盘操作', () => {
        const openOuterAndFocusParent = async () => {
            await userEvent.click(screen.getByRole('button', { name: 'nested menu' }));
            await waitFor(() => expect(item('Alpha')).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            expect(item('Parent')).toHaveFocus();
        };

        it('Right 打开子菜单并聚焦第一项，Left 关闭子菜单并聚焦父级选项', async () => {
            const view = render(Nested);
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
            expect(view.emitted('inner')).toHaveLength(1);
            await userEvent.keyboard('{ArrowLeft}');
            await waitFor(() => expect(portals()).toHaveLength(1));
            expect(item('Parent')).toHaveFocus();
            expect(item('Parent')).toHaveAttribute('aria-expanded', 'false');
        });

        it('在父级选项上按 Enter 打开子菜单并聚焦第一项', async () => {
            render(Nested);
            await openOuterAndFocusParent();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(item('Inner one')).toHaveFocus());
        });

        it('子菜单触发器自行处理 Enter（Tag）时只激活一次，子菜单保持打开', async () => {
            const onClick = vi.fn<() => void>();
            render(Dropdown, {
                props: { motion: false, trigger: 'custom', visible: true },
                slots: {
                    default: () => <button type="button">outer</button>,
                    content: () => (
                        <DropdownMenu>
                            {() => (
                                <Dropdown menu={[{ node: 'item', name: 'Tag child' }]} motion={false} trigger="click">
                                    {() => <Tag onClick={onClick}>{() => 'tag parent'}</Tag>}
                                </Dropdown>
                            )}
                        </DropdownMenu>
                    ),
                },
            });
            const tag = (await screen.findByText('tag parent')).closest<HTMLElement>('.semi-tag') as HTMLElement;
            tag.focus();
            await userEvent.keyboard('{Enter}');
            expect(onClick).toHaveBeenCalledTimes(1);
            await waitFor(() => expect(item('Tag child')).toHaveFocus());
        });

        it('父级选项上的 Up 与 Down 留在父菜单内', async () => {
            render(Nested);
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
            render(Nested);
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

        it('焦点打开的悬停菜单在键盘进入悬停子菜单后保持打开', async () => {
            render(AllHover);
            const button = screen.getByRole('button', { name: 'all hover' });
            button.focus();
            await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
            await fireEvent.keyDown(button, { key: 'ArrowDown' });
            expect(item('Branch')).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(item('Leaf')).toHaveFocus());
            await new Promise((resolve) => setTimeout(resolve, 300));
            expect(item('Leaf')).toHaveFocus();
            expect(button).toHaveAttribute('aria-expanded', 'true');
            expect(portals()).toHaveLength(2);
        });

        it('RTL 下 Left 打开子菜单，Right 关闭', async () => {
            render(Nested, { props: { direction: 'rtl' } });
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

    it('打开中卸载时同步通知一次 afterClose', async () => {
        const onAfterClose = vi.fn<() => void>();
        const view = render(Dropdown, {
            props: {
                menu: [{ node: 'item', name: 'item' }],
                motion: false,
                trigger: 'custom',
                visible: true,
                onAfterClose,
            },
            slots: { default: () => <button>trigger</button> },
        });
        await screen.findByRole('menu');
        view.unmount();
        expect(onAfterClose).toHaveBeenCalledTimes(1);
        expect(onAfterClose).toHaveBeenCalledWith();
    });
});

describe('Dropdown Vue 受控与插槽', () => {
    it('v-model:visible + click：打开后首项获焦，开合各只发出一次 visibleChange', async () => {
        const view = render(Model);
        const button = screen.getByRole('button', { name: 'model trigger' });
        await userEvent.click(button);
        await waitFor(() => expect(item('First')).toHaveFocus());
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(view.emitted('visibleChange')).toEqual([[true]]);
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(view.emitted('visibleChange')).toEqual([[true], [false]]);
    });

    it('v-model:visible + click：触发器上的 ArrowUp 打开后聚焦末项', async () => {
        render(Model);
        const button = screen.getByRole('button', { name: 'model trigger' });
        button.focus();
        await userEvent.keyboard('{ArrowUp}');
        await waitFor(() => expect(item('Last')).toHaveFocus());
    });

    it('keepDOM 加 v-model:visible：第二次打开同样聚焦首项', async () => {
        render(Model, { props: { keepDOM: true } });
        const button = screen.getByRole('button', { name: 'model trigger' });
        await userEvent.click(button);
        await waitFor(() => expect(item('First')).toHaveFocus());
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
        expect(item('First')).toBeInTheDocument();
        await userEvent.click(button);
        await waitFor(() => expect(item('First')).toHaveFocus());
    });

    it('单向 visible=false：连续点击只请求打开，父级同值重渲染不变，改为 true 才打开', async () => {
        const view = renderButton('one way trigger', { trigger: 'click', visible: false });
        const button = screen.getByRole('button', { name: 'one way trigger' });
        await userEvent.click(button);
        await userEvent.click(button);
        expect(view.emitted('update:visible')).toEqual([[true], [true]]);
        expect(portalInner()).toBeNull();
        expect(button).toHaveAttribute('aria-expanded', 'false');
        await view.rerender({ visible: false });
        expect(portalInner()).toBeNull();
        await view.rerender({ visible: true });
        await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
        await screen.findByRole('menu');
    });

    it('单向 visible=true：点击外部只请求关闭，父级关闭后触发器上的 ArrowDown 重新请求打开', async () => {
        const view = renderButton('one way open', { trigger: 'click', visible: true });
        const button = screen.getByRole('button', { name: 'one way open' });
        await screen.findByRole('menu');
        await fireEvent.mouseDown(document.body);
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(view.emitted<[boolean]>('update:visible').at(-1)).toEqual([false]);
        await view.rerender({ visible: false });
        await waitFor(() => expect(portalInner()).toBeNull());
        expect(button).toHaveAttribute('aria-expanded', 'false');
        button.focus();
        await fireEvent.keyDown(button, { key: 'ArrowDown' });
        expect(view.emitted<[boolean]>('update:visible').at(-1)).toEqual([true]);
    });

    it('单向 visible=true 加 contextMenu：每次 Tab 都上报关闭，弹层保留', async () => {
        const view = renderButton('context one way', { trigger: 'contextMenu', visible: true });
        await screen.findByRole('menu');
        const button = screen.getByRole('button', { name: 'context one way' });
        await fireEvent.keyDown(button, { key: 'Tab' });
        await fireEvent.keyDown(button, { key: 'Tab' });
        expect(view.emitted('visibleChange')).toEqual([[false], [false]]);
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('显式 visible=undefined 为非受控', async () => {
        renderButton('undefined trigger', { trigger: 'click', visible: undefined });
        await userEvent.click(screen.getByRole('button', { name: 'undefined trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
    });

    it('全局默认值生效，显式 prop 优先', async () => {
        semiGlobal.config = {
            overrideDefaultProps: {
                Dropdown: {
                    trigger: 'click',
                    motion: false,
                    contentClassName: 'global-content',
                    role: 'group',
                    spacing: 12,
                    keepDOM: true,
                },
            },
        };
        render(Dropdown, { slots: { default: () => <button>global a</button>, content: menuOf([['A']]) } });
        await userEvent.click(screen.getByRole('button', { name: 'global a' }));
        await screen.findByRole('menu');
        const popup = portalInner() as HTMLElement;
        expect(popup).toHaveAttribute('role', 'group');
        // jsdom puts the trigger's box at 0, so a bottom popup's top is the spacing
        expect(popup.style.top).toBe('12px');
        expect(document.querySelector('.semi-dropdown.global-content')).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(screen.getByRole('button', { name: 'global a' })).toHaveAttribute('aria-expanded', 'false'));
        expect(item('A')).toBeInTheDocument();
        document.body.innerHTML = '';
        render(Dropdown, {
            props: { role: 'presentation', spacing: 3, contentClassName: 'own' },
            slots: { default: () => <button>global b</button>, content: menuOf([['B']]) },
        });
        await userEvent.click(screen.getByRole('button', { name: 'global b' }));
        await waitFor(() => expect(item('B')).toBeInTheDocument());
        const own = [...portals()].at(-1) as HTMLElement;
        expect(own).toHaveAttribute('role', 'presentation');
        expect(own.style.top).toBe('3px');
        expect(own.querySelector('.semi-dropdown')).toHaveClass('own');
    });

    it('未传 spacing 时顶层为 4、嵌套为 2', async () => {
        render(NestedOpen);
        await waitFor(() => expect(item('inner item')).toBeInTheDocument());
        const [outer, inner] = [...portals()] as HTMLElement[];
        expect(outer.style.top).toBe('4px');
        expect(inner.style.left).toBe('2px');
    });

    it('props 运行时：Boolean 类型都有 default 键，没有 Function 类型 prop', () => {
        for (const component of [Dropdown, DropdownItem]) {
            const declared = (component as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
            const options = Object.entries(declared);
            expect(options.filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))).toEqual([]);
            expect(options.filter(([, option]) => [option.type].flat().includes(Function))).toEqual([]);
        }
    });

    it('Props 类型不含 showArrow、arrowPointAtCenter 与 disableArrowKeyDown', () => {
        expectTypeOf<DropdownProps>().not.toHaveProperty('showArrow');
        expectTypeOf<DropdownProps>().not.toHaveProperty('arrowPointAtCenter');
        expectTypeOf<DropdownProps>().not.toHaveProperty('disableArrowKeyDown');
    });

    it('触发节点注入：子节点的 @keydown 先执行并可阻止二次点击，aria-haspopup 按可承载性替换或移除', async () => {
        const onClick = vi.fn<() => void>();
        // a trigger that clicks itself on Enter and prevents the default, as Tag and Avatar do
        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                (event.currentTarget as HTMLElement).click();
                event.preventDefault();
            }
        };
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: {
                default: () => (
                    <div role="button" tabindex={0} aria-haspopup="true" onClick={onClick} onKeydown={onKeydown}>
                        self click
                    </div>
                ),
                content: menuOf(),
            },
        });
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: { default: () => <span aria-haspopup="true">generic own</span>, content: menuOf() },
        });
        const own = screen.getByRole('button', { name: 'self click' });
        expect(own).toHaveAttribute('aria-haspopup', 'menu');
        expect(screen.getByText('generic own')).not.toHaveAttribute('aria-haspopup');
        own.focus();
        await fireEvent.keyDown(own, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(own).toHaveAttribute('aria-expanded', 'true'));
    });

    it('文本与多节点触发器包在 span 里，不带 aria-haspopup，仍响应键盘', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'click', wrapperClassName: 'own-wrapper' },
            slots: { default: () => 'text trigger', content: menuOf([['Text first'], ['Text last']]) },
        });
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: {
                default: () => (
                    <>
                        <span>part one</span>
                        <span>part two</span>
                    </>
                ),
                content: menuOf([['Multi item']]),
            },
        });
        const text = screen.getByText('text trigger');
        expect(text.tagName).toBe('SPAN');
        expect(text).toHaveClass('semi-tooltip-trigger-wrapper', 'own-wrapper');
        expect(text).toHaveAttribute('tabindex', '0');
        expect(text).not.toHaveAttribute('aria-haspopup');
        const multi = screen.getByText('part one').parentElement as HTMLElement;
        expect(multi).toHaveClass('semi-tooltip-trigger-wrapper');
        expect(multi).toHaveStyle({ display: 'inline-block' });
        expect(multi).toContainElement(screen.getByText('part two'));
        expect(multi).not.toHaveAttribute('aria-haspopup');
        text.focus();
        await fireEvent.keyDown(text, { key: 'Enter' });
        await waitFor(() => expect(item('Text first')).toHaveFocus());
        expect(text).toHaveClass('semi-dropdown-showing');
        text.focus();
        await fireEvent.keyDown(text, { key: 'ArrowUp' });
        expect(item('Text last')).toHaveFocus();
        multi.focus();
        await fireEvent.keyDown(multi, { key: ' ' });
        await waitFor(() => expect(item('Multi item')).toHaveFocus());
        expect(multi).toHaveClass('semi-dropdown-showing');
    });

    it('context 层级：父项读外层菜单，点击走顶层项路径；showTick 按所在菜单生效', async () => {
        const view = render(TickNested);
        await waitFor(() => expect(item('tick child')).toBeInTheDocument());
        const parent = item('tick parent');
        expect(parent).toHaveClass('semi-dropdown-item-withTick');
        expect(parent).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('tick child')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('tick child')).toHaveAttribute('role', 'menuitem');
        await fireEvent.mouseDown(parent, { button: 0 });
        expect(view.emitted('parentClick')).toBeUndefined();
        await fireEvent.click(parent, { detail: 1 });
        expect(view.emitted('parentClick')).toHaveLength(1);
    });

    it('context 层级：内层 showTick 只作用于子菜单项，不影响父项', async () => {
        render(TickNested, { props: { outerTick: false, innerTick: true } });
        await waitFor(() => expect(item('tick child')).toBeInTheDocument());
        expect(item('tick parent')).toHaveAttribute('role', 'menuitem');
        expect(item('tick parent')).not.toHaveClass('semi-dropdown-item-withTick');
        expect(item('tick child')).toHaveAttribute('role', 'menuitemcheckbox');
        expect(item('tick child')).toHaveClass('semi-dropdown-item-withTick');
    });

    it('context 层级：selectionMode 只作用于本层选项，子菜单不继承', async () => {
        const view = render(TickNested, { props: { outerTick: false, outerMode: 'single' } });
        await waitFor(() => expect(item('tick child')).toBeInTheDocument());
        expect(item('tick parent')).toHaveAttribute('role', 'menuitemradio');
        expect(item('tick parent')).toHaveAttribute('aria-checked', 'true');
        expect(item('tick child')).toHaveAttribute('role', 'menuitem');
        expect(item('tick child')).not.toHaveAttribute('aria-checked');
        await view.rerender({ outerTick: false, outerMode: undefined, innerMode: 'multiple' });
        await waitFor(() => expect(item('tick child')).toHaveAttribute('role', 'menuitemcheckbox'));
        expect(item('tick child')).toHaveAttribute('aria-checked', 'false');
        expect(item('tick parent')).toHaveAttribute('role', 'menuitem');
    });

    it('Dropdown 未设置的 mouseEnterDelay 回落到 Tooltip 默认值 50ms', async () => {
        render(Dropdown, {
            props: { motion: false },
            slots: { default: () => <button type="button">delay trigger</button>, content: menuOf() },
        });
        // only the delay timers are faked, so the next test gets real timers back
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        onTestFinished(() => {
            vi.useRealTimers();
        });
        await fireEvent.mouseEnter(screen.getByRole('button', { name: 'delay trigger' }));
        await vi.advanceTimersByTimeAsync(49);
        expect(portalInner()).toBeNull();
        await vi.advanceTimersByTimeAsync(1);
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('Item：@click 为数组时都被调用，空的或 v-if 隐藏的 #icon 不渲染图标容器', async () => {
        const first = vi.fn<(event: MouseEvent) => void>();
        const second = vi.fn<(event: MouseEvent) => void>();
        renderButton('array trigger', { trigger: 'custom', visible: true }, () => (
            <DropdownMenu>
                {() => (
                    <>
                        <DropdownItem onClick={[first, second] as unknown as (event: MouseEvent) => void}>{() => 'array item'}</DropdownItem>
                        <DropdownItem>{{ default: () => 'empty icon', icon: () => [] }}</DropdownItem>
                        <DropdownItem>{{ default: () => 'hidden icon', icon: () => [createCommentVNode('v-if')] }}</DropdownItem>
                        <DropdownItem>{{ default: () => 'text icon', icon: () => 'i' }}</DropdownItem>
                    </>
                )}
            </DropdownMenu>
        ));
        await screen.findByRole('menu');
        await userEvent.click(item('array item'));
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(item('empty icon').querySelector('.semi-dropdown-item-icon')).toBeNull();
        expect(item('hidden icon').querySelector('.semi-dropdown-item-icon')).toBeNull();
        expect(item('text icon').querySelector('.semi-dropdown-item-icon')).toHaveTextContent('i');
    });

    it('Fragment 与 v-for 产生的 Item 参与方向键导航，v-if 留下的注释节点不占位', async () => {
        renderButton('fragment trigger', { trigger: 'click' }, () => (
            <DropdownMenu>
                {() => [
                    <DropdownItem>{() => 'Solo'}</DropdownItem>,
                    createCommentVNode('v-if'),
                    <>
                        {['One', 'Two'].map((label) => (
                            <DropdownItem key={label}>{() => label}</DropdownItem>
                        ))}
                    </>,
                    createCommentVNode('v-if'),
                ]}
            </DropdownMenu>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'fragment trigger' }));
        await waitFor(() => expect(item('Solo')).toHaveFocus());
        await userEvent.keyboard('{ArrowDown}');
        expect(item('One')).toHaveFocus();
        await userEvent.keyboard('{End}');
        expect(item('Two')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        expect(item('Solo')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        expect(item('Two')).toHaveFocus();
    });

    it('事件载荷：clickOutSide 为原生 MouseEvent，afterClose 无参数', async () => {
        const view = renderButton('payload trigger', { trigger: 'click' });
        await userEvent.click(screen.getByRole('button', { name: 'payload trigger' }));
        await waitFor(() => expect(item('Menu Item 1')).toHaveFocus());
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(portalInner()).toBeNull());
        const outside = view.emitted<[MouseEvent]>('clickOutSide');
        expect(outside).toHaveLength(1);
        expect(outside[0][0]).toBeInstanceOf(MouseEvent);
        expect(view.emitted('afterClose')).toEqual([[]]);
    });

    it('Menu：使用方 @keydown 先于菜单处理执行', async () => {
        const seen: (string | null | undefined)[] = [];
        render(DropdownMenu, {
            attrs: { onKeydown: () => seen.push(document.activeElement?.textContent) },
            slots: {
                default: () => (
                    <>
                        <DropdownItem>{() => 'K1'}</DropdownItem>
                        <DropdownItem>{() => 'K2'}</DropdownItem>
                    </>
                ),
            },
        });
        item('K1').focus();
        await fireEvent.keyDown(item('K1'), { key: 'ArrowDown' });
        expect(seen).toEqual(['K1']);
        expect(item('K2')).toHaveFocus();
    });

    it('Menu：使用方的 role 与 aria-orientation 覆盖默认值', () => {
        render(DropdownMenu, {
            attrs: { role: 'group', 'aria-orientation': 'horizontal', 'aria-label': 'own menu' },
            slots: { default: () => <DropdownItem>{() => 'K1'}</DropdownItem> },
        });
        expect(screen.getByRole('group', { name: 'own menu' })).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('禁用的 DropdownItem 作为子菜单父项时点击不打开子菜单，也不在菜单里插入包裹', async () => {
        const submenu = () => (
            <Dropdown motion={false} trigger="click">
                {{
                    default: () => <DropdownItem disabled>{() => 'Parent'}</DropdownItem>,
                    content: menuOf([['Deep']]),
                }}
            </Dropdown>
        );
        renderDD({ trigger: 'custom', visible: true }, { content: () => <DropdownMenu>{() => submenu()}</DropdownMenu> });
        const parent = await screen.findByRole('menuitem', { name: 'Parent' });
        expect(parent.parentElement).toHaveAttribute('role', 'menu');
        await fireEvent.click(parent);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(screen.queryByRole('menuitem', { name: 'Deep' })).toBeNull();
    });

    it('显式传入的 wrapWhenSpecial 优先于 DropdownItem 父项不包裹的默认值', async () => {
        const submenu = () => (
            <Dropdown motion={false} trigger="click" wrapWhenSpecial>
                {{
                    default: () => <DropdownItem disabled>{() => 'Parent'}</DropdownItem>,
                    content: menuOf([['Deep']]),
                }}
            </Dropdown>
        );
        renderDD({ trigger: 'custom', visible: true }, { content: () => <DropdownMenu>{() => submenu()}</DropdownMenu> });
        const parent = await screen.findByRole('menuitem', { name: 'Parent' });
        expect(parent.parentElement).toHaveClass('semi-tooltip-trigger-wrapper');
    });

    it('文本输入框作触发器时能输入空格', async () => {
        render(Dropdown, {
            props: { motion: false, trigger: 'click' },
            slots: { default: () => <input aria-label="search" />, content: menuOf() },
        });
        const input = screen.getByRole('textbox', { name: 'search' });
        // focused without a click, which would open the menu and move focus into it
        input.focus();
        await userEvent.keyboard('a b');
        expect(input).toHaveValue('a b');
    });
});
