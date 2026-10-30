import { describe, expect, it, vi } from 'vite-plus/test';
import NavigationFoundation, { type NavigationAdapter, type NavigationState, type NavItemType } from '../foundation';
import SubNavFoundation, { type SubNavAdapter } from '../sub-nav-foundation';

const { getInitialState, getWillOpenKeys, getSelectedKeys, getIsCollapsed, buildItemKeysMap } = NavigationFoundation;

const items = ['home', { itemKey: 'user', items: ['list', { itemKey: 'role', items: ['admin'] }] }, { itemKey: 'job', items: ['query'] }];

describe('NavigationFoundation 静态 state', () => {
    it('规范化子项保留祖先与零值键，items 配置优先', () => {
        const children = [{ itemKey: 0, items: [{ itemKey: '' }] }];
        expect(NavigationFoundation.getFormattedItems({}, children).itemKeysMap).toEqual({ 0: [], '': [0] });
        expect(getInitialState({ defaultSelectedKeys: [''], mode: 'vertical' }, children).openKeys).toEqual([0]);
        expect(NavigationFoundation.getFormattedItems({ items: ['home'] }, children).itemKeysMap).toEqual({ home: [] });
    });

    it('把每个键映射到其祖先', () => {
        const { itemKeysMap } = NavigationFoundation.getFormattedItems({ items });
        expect(itemKeysMap).toEqual({
            home: [],
            user: [],
            list: ['user'],
            role: ['user'],
            admin: ['user', 'role'],
            job: [],
            query: ['job'],
        });
    });

    it('只遍历 items 数组', () => {
        expect(buildItemKeysMap({ itemKey: 'a' } as unknown as NavItemType[])).toEqual({});
    });

    it('选中默认键及其顶层父级，并展开其祖先', () => {
        const state = getInitialState({ items, defaultSelectedKeys: ['admin'], mode: 'vertical' });
        expect(state.selectedKeys).toEqual(['admin', 'user']);
        expect(state.openKeys).toEqual(['user', 'role']);
        expect(state.isCollapsed).toBe(false);
    });

    it('字符串项规整为 text 与 itemKey，对象项递归规整嵌套的 items', () => {
        const { formattedItems } = NavigationFoundation.getFormattedItems({ items });
        expect(formattedItems).toHaveLength(3);
        expect(formattedItems[0]).toEqual({ text: 'home', itemKey: 'home' });
        expect(formattedItems[1]).toEqual({
            itemKey: 'user',
            items: [
                { text: 'list', itemKey: 'list' },
                { itemKey: 'role', items: [{ text: 'admin', itemKey: 'admin' }] },
            ],
        });
        expect(items[0]).toBe('home');
    });

    it('没有 items 或 children 时初始为空', () => {
        expect(getInitialState({ selectedKeys: ['a'], defaultIsCollapsed: true })).toEqual({
            isCollapsed: true,
            openKeys: [],
            selectedKeys: [],
        });
    });

    it('按给定值打开 openKeys 或 defaultOpenKeys，仅在 vertical 模式下展开祖先', () => {
        const { itemKeysMap } = NavigationFoundation.getFormattedItems({ items });
        expect(getWillOpenKeys({ defaultOpenKeys: ['job'], selectedKeys: ['admin'], mode: 'vertical' }, [], itemKeysMap)).toEqual(['job']);
        expect(getWillOpenKeys({ selectedKeys: ['admin'], mode: 'horizontal' }, ['x'], itemKeysMap)).toEqual([]);
        expect(getWillOpenKeys({ selectedKeys: ['query'], mode: 'vertical' }, ['user'], itemKeysMap)).toEqual(['user', 'job']);
    });

    it('从 props 推导受控的 isCollapsed 与 selectedKeys', () => {
        const state = { isCollapsed: true, selectedKeys: ['home'], openKeys: ['a'] } as unknown as NavigationState;
        const itemKeysMap = { admin: ['user', 'role'] };
        expect(getIsCollapsed({}, state)).toBe(true);
        expect(getIsCollapsed({ isCollapsed: false }, state)).toBe(false);
        expect(getSelectedKeys({}, state, itemKeysMap)).toEqual(['home']);
    });

    it('水平模式下忽略 isCollapsed 与内部折叠状态', () => {
        const state = { isCollapsed: true, selectedKeys: [], openKeys: [] } as unknown as NavigationState;
        expect(getIsCollapsed({ mode: 'horizontal' }, state)).toBe(false);
        expect(getIsCollapsed({ mode: 'horizontal', isCollapsed: true }, state)).toBe(false);
        expect(getIsCollapsed({ mode: 'vertical', isCollapsed: true }, state)).toBe(true);
    });

    it('从 props 推导受控的 selectedKeys', () => {
        const state = { isCollapsed: true, selectedKeys: ['home'], openKeys: ['a'] } as unknown as NavigationState;
        const itemKeysMap = { admin: ['user', 'role'] };
        expect(getSelectedKeys({ selectedKeys: ['admin'] }, state, itemKeysMap)).toEqual(['admin', 'user']);
    });

    it('openKeys 只在竖直且展开时受控，null 视为空，其余情况读 state', () => {
        const state = { isCollapsed: false, selectedKeys: [], openKeys: ['a'] } as unknown as NavigationState;
        const vertical = { mode: 'vertical', openKeys: ['b'] };
        expect(NavigationFoundation.isOpenKeysControlled(vertical, false)).toBe(true);
        expect(NavigationFoundation.isOpenKeysControlled(vertical, true)).toBe(false);
        expect(NavigationFoundation.isOpenKeysControlled({ ...vertical, mode: 'horizontal' }, false)).toBe(false);
        expect(NavigationFoundation.isOpenKeysControlled({ mode: 'vertical' }, false)).toBe(false);
        expect(NavigationFoundation.getOpenKeys(vertical, state, false)).toEqual(['b']);
        expect(NavigationFoundation.getOpenKeys(vertical, state, true)).toEqual(['a']);
        expect(NavigationFoundation.getOpenKeys({ mode: 'horizontal', openKeys: ['b'] }, state, false)).toEqual(['a']);
        expect(NavigationFoundation.getOpenKeys({ mode: 'vertical' }, state, false)).toEqual(['a']);
        expect(NavigationFoundation.getOpenKeys({ mode: 'vertical', openKeys: null }, state, false)).toEqual([]);
    });
});

function createNav(props, state) {
    const host = { props, state };
    const adapter = {
        getItemsFromChildren: (): NavItemType[] => [],
        getProps: () => host.props,
        getProp: (key) => host.props[key],
        getStates: () => host.state,
        getState: (key) => host.state[key],
        setIsCollapsed: vi.fn<NavigationAdapter['setIsCollapsed']>((isCollapsed) => (host.state = { ...host.state, isCollapsed })),
        notifyCollapseChange: vi.fn<NavigationAdapter['notifyCollapseChange']>(),
        updateSelectedKeys: vi.fn<NavigationAdapter['updateSelectedKeys']>((selectedKeys) => (host.state = { ...host.state, selectedKeys })),
        updateOpenKeys: vi.fn<NavigationAdapter['updateOpenKeys']>((openKeys) => (host.state = { ...host.state, openKeys })),
    };
    return {
        host,
        adapter,
        foundation: new NavigationFoundation(adapter as unknown as NavigationAdapter),
    };
}

describe('NavigationFoundation 更新', () => {
    it('从 adapter 的规范化子项计算选中项祖先', () => {
        const { adapter, foundation } = createNav({}, getInitialState({}));
        adapter.getItemsFromChildren = () => [{ itemKey: 'parent', items: [{ itemKey: 'child' }] }];
        foundation.updateSelectedKeys(['child']);
        expect(adapter.updateSelectedKeys).toHaveBeenCalledWith(['child', 'parent']);
    });

    it('items 变化时从 props 重新构建', () => {
        const props = { items, defaultSelectedKeys: ['list'], mode: 'vertical' };
        const { host, adapter, foundation } = createNav(props, getInitialState(props));
        host.state = { ...host.state, selectedKeys: ['query'] };
        host.props = { ...props, items: [...items] };
        foundation.handlePropsUpdate(props);
        expect(adapter.updateSelectedKeys).toHaveBeenCalledTimes(1);
        expect(host.state.selectedKeys).toEqual(['list', 'user']);
    });

    it('重建得到的选中与展开状态不变时不写 state', () => {
        const props = { items, defaultSelectedKeys: ['list'], mode: 'vertical' };
        const { host, adapter, foundation } = createNav(props, getInitialState(props));
        host.props = { ...props, items: [...items] };
        foundation.handlePropsUpdate(props);
        expect(adapter.updateSelectedKeys).not.toHaveBeenCalled();
        expect(adapter.updateOpenKeys).not.toHaveBeenCalled();
    });

    it('将深层变化的 selectedKeys 或 openKeys 复制到 state', () => {
        const props = { items, selectedKeys: ['list'], openKeys: ['user'], mode: 'vertical' };
        const { host, adapter, foundation } = createNav(props, getInitialState(props));
        host.props = { ...props, selectedKeys: ['list'], openKeys: ['user'] };
        foundation.handlePropsUpdate(props);
        expect(adapter.updateSelectedKeys).not.toHaveBeenCalled();
        expect(adapter.updateOpenKeys).not.toHaveBeenCalled();

        const prev = host.props;
        host.props = { ...prev, selectedKeys: ['query'], openKeys: ['job'] };
        foundation.handlePropsUpdate(prev);
        expect(host.state.selectedKeys).toEqual(['query', 'job']);
        expect(host.state.openKeys).toEqual(['job']);
    });

    it('受控的 selectedKeys、openKeys 变回 undefined 时清空 state', () => {
        const props = { items, selectedKeys: ['list'], openKeys: ['user'], mode: 'vertical' };
        const { host, foundation } = createNav(props, getInitialState(props));
        expect(host.state.selectedKeys).toEqual(['list', 'user']);
        const prev = host.props;
        host.props = { items, mode: 'vertical' };
        foundation.handlePropsUpdate(prev);
        expect(host.state.selectedKeys).toEqual([]);
        expect(host.state.openKeys).toEqual([]);
    });

    it('openKeys 变回 undefined 时仍展开选中项的祖先', () => {
        const props = { items, defaultSelectedKeys: ['query'], openKeys: ['user'], mode: 'vertical' };
        const { host, foundation } = createNav(props, getInitialState(props));
        const prev = host.props;
        host.props = { items, defaultSelectedKeys: ['query'], mode: 'vertical' };
        foundation.handlePropsUpdate(prev);
        expect(host.state.openKeys).toEqual(['job']);
    });

    it('itemKey 为 0 时仍参与展开键与祖先映射', () => {
        const zeroItems = [{ itemKey: 0, items: [{ itemKey: 1 }] }];
        const { itemKeysMap } = NavigationFoundation.getFormattedItems({ items: zeroItems });
        expect(itemKeysMap).toEqual({ 0: [], 1: [0] });
        expect(NavigationFoundation.getShouldOpenKeys(itemKeysMap, [1])).toEqual([0]);
        expect(NavigationFoundation.getShouldOpenKeys(itemKeysMap, [0])).toEqual([]);
        const { host, foundation } = createNav({}, { openKeys: [] });
        foundation.addOpenKey(0);
        expect(host.state.openKeys).toEqual([0]);
        foundation.removeOpenKey(0);
        expect(host.state.openKeys).toEqual([]);
    });

    it('添加与移除单个展开键', () => {
        const { host, foundation } = createNav({}, { openKeys: ['a'] });
        foundation.addOpenKey('b');
        foundation.addOpenKey('a');
        expect(host.state.openKeys).toEqual(['a', 'b']);
        foundation.removeOpenKey('a');
        expect(host.state.openKeys).toEqual(['b']);
    });

    it('仅非受控时在 state 中切换折叠', () => {
        const uncontrolled = createNav({}, { isCollapsed: false });
        uncontrolled.foundation.handleCollapseChange();
        expect(uncontrolled.host.state.isCollapsed).toBe(true);
        expect(uncontrolled.adapter.notifyCollapseChange).toHaveBeenCalledWith(true);

        const controlled = createNav({ isCollapsed: true }, { isCollapsed: false });
        controlled.foundation.handleCollapseChange();
        expect(controlled.adapter.setIsCollapsed).not.toHaveBeenCalled();
        expect(controlled.adapter.notifyCollapseChange).toHaveBeenCalledWith(false);
    });
});

describe('SubNavFoundation', () => {
    const createSub = (props, { openKeys = [], controlled = false } = {}) => {
        const adapter = {
            getProps: () => props,
            getProp: (key) => props[key],
            getOpenKeys: () => openKeys,
            getOpenKeysIsControlled: () => controlled,
            updateOpen: vi.fn<SubNavAdapter['updateOpen']>(),
            notifyGlobalOpenChange: vi.fn<SubNavAdapter['notifyGlobalOpenChange']>(),
            notifyGlobalOnClick: vi.fn<SubNavAdapter['notifyGlobalOnClick']>(),
            getIsOpen: () => openKeys.includes(props.itemKey),
        };
        return { adapter, foundation: new SubNavFoundation(adapter as unknown as SubNavAdapter) };
    };

    it('上报弹层显隐变化，并同时更新展开键', () => {
        const { adapter, foundation } = createSub({ itemKey: 'a' }, { openKeys: ['b'] });
        foundation.handleDropdownVisibleChange(true);
        expect(adapter.updateOpen).toHaveBeenCalledWith(true);
        expect(adapter.notifyGlobalOpenChange).toHaveBeenCalledWith({
            itemKey: 'a',
            openKeys: ['b', 'a'],
            isOpen: true,
        });

        const hidden = createSub({ itemKey: 'a' }, { openKeys: ['a'] });
        hidden.foundation.handleDropdownVisibleChange(false);
        expect(hidden.adapter.updateOpen).toHaveBeenCalledWith(false);
        expect(hidden.adapter.notifyGlobalOpenChange).toHaveBeenCalledWith({
            itemKey: 'a',
            openKeys: [],
            isOpen: false,
        });
    });

    it('点击标题切换展开状态，受控时只上报不更新', () => {
        const event = new MouseEvent('click');
        const open = createSub({ itemKey: 'a' }, { openKeys: ['a'] });
        open.foundation.handleClick(event);
        expect(open.adapter.updateOpen).toHaveBeenCalledWith(false);
        expect(open.adapter.notifyGlobalOnClick).toHaveBeenLastCalledWith({
            itemKey: 'a',
            openKeys: [],
            isOpen: false,
            domEvent: event,
        });
        const closed = createSub({ itemKey: 'a' });
        closed.foundation.handleClick(event);
        expect(closed.adapter.updateOpen).toHaveBeenCalledWith(true);

        const controlled = createSub({ itemKey: 'a' }, { controlled: true });
        controlled.foundation.handleClick(event);
        expect(controlled.adapter.updateOpen).not.toHaveBeenCalled();
        expect(controlled.adapter.notifyGlobalOnClick).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }));
    });

    it('弹层模式的标题点击只报告 onClick，不切换也不发出 openChange', () => {
        const event = new MouseEvent('click');
        const { adapter, foundation } = createSub({ itemKey: 'a' });
        foundation.handlePopupClick(event);
        expect(adapter.updateOpen).not.toHaveBeenCalled();
        expect(adapter.notifyGlobalOpenChange).not.toHaveBeenCalled();
        expect(adapter.notifyGlobalOnClick).toHaveBeenCalledWith({
            itemKey: 'a',
            openKeys: [],
            isOpen: false,
            domEvent: event,
        });

        const disabled = createSub({ itemKey: 'a', disabled: true });
        disabled.foundation.handlePopupClick(event);
        expect(disabled.adapter.notifyGlobalOnClick).not.toHaveBeenCalled();
    });

    it('itemKey 为 0 的子菜单可以展开', () => {
        const { adapter, foundation } = createSub({ itemKey: 0 });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.notifyGlobalOpenChange).toHaveBeenCalledWith(expect.objectContaining({ openKeys: [0] }));
    });

    it('禁用时忽略点击', () => {
        const { adapter, foundation } = createSub({ itemKey: 'a', disabled: true });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.notifyGlobalOpenChange).not.toHaveBeenCalled();
    });
});
