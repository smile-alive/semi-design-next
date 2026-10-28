import { describe, expect, it, vi } from 'vite-plus/test';
import TabsFoundation, { type TabsAdapter, type TabsBaseProps } from '../foundation';

const { getDefaultActiveKey } = TabsFoundation;

describe('TabsFoundation.getDefaultActiveKey', () => {
    const list = [null, { itemKey: '1', disabled: true }, { itemKey: '' }, { itemKey: '2' }, { itemKey: '3' }];

    it('先取不为 undefined 的 activeKey，其次取 defaultActiveKey', () => {
        expect(getDefaultActiveKey({ activeKey: '3', defaultActiveKey: '2' }, list)).toBe('3');
        expect(getDefaultActiveKey({ activeKey: undefined, defaultActiveKey: '2' }, list)).toBe('2');
        expect(getDefaultActiveKey({ activeKey: null, defaultActiveKey: '2' }, list)).toBeNull();
        expect(getDefaultActiveKey({ defaultActiveKey: 'missing' }, list)).toBe('missing');
    });

    it('否则取第一个带键且启用的项，若没有则返回空字符串', () => {
        expect(getDefaultActiveKey({}, list)).toBe('2');
        expect(getDefaultActiveKey({}, [{ itemKey: '1', disabled: true }])).toBe('');
        expect(getDefaultActiveKey({}, [])).toBe('');
    });
});

describe('TabsFoundation.getTabbableKey', () => {
    const tabs = [{ itemKey: 'a', disabled: true }, { itemKey: 'b' }, { itemKey: 'c' }];

    it('选中的页签在列表中时由它停靠，返回 undefined', () => {
        expect(TabsFoundation.getTabbableKey(tabs, 'c')).toBeUndefined();
        expect(TabsFoundation.getTabbableKey(tabs, 'a')).toBeUndefined();
    });

    it('没有选中的页签时（null、不命中）由第一个启用的页签停靠，全部禁用时没有', () => {
        expect(TabsFoundation.getTabbableKey(tabs, null)).toBe('b');
        expect(TabsFoundation.getTabbableKey(tabs, 'missing')).toBe('b');
        expect(TabsFoundation.getTabbableKey([{ itemKey: 'a', disabled: true }], null)).toBeUndefined();
    });
});

describe('TabsFoundation.getPaneMotion', () => {
    const base = { activeKey: 'b', prevActiveKey: 'a', paneKeys: ['a', 'b', 'c'], tabPosition: 'top', tabPaneMotion: true, forceDisableMotion: false } as const;
    const motion = (input: Partial<Parameters<typeof TabsFoundation.getPaneMotion>[0]>) => TabsFoundation.getPaneMotion({ ...base, itemKey: 'b', ...input });

    it('所选面板从上一个页签的一侧滑入，垂直标签栏上下滑动', () => {
        expect(motion({})).toEqual({ startClassName: 'semi-tabs-pane-animate-leftShow', hasMotion: true });
        expect(motion({ prevActiveKey: 'c' }).startClassName).toBe('semi-tabs-pane-animate-rightShow');
        expect(motion({ tabPosition: 'left' }).startClassName).toBe('semi-tabs-pane-animate-topShow');
        expect(motion({ tabPosition: 'left', prevActiveKey: 'c' }).startClassName).toBe('semi-tabs-pane-animate-bottomShow');
    });

    it('未选中、首次挂载、上一个面板已删除、关闭动画或强制禁用时不播放', () => {
        expect(motion({ itemKey: 'a' }).hasMotion).toBe(false);
        expect(motion({ prevActiveKey: null }).hasMotion).toBe(false);
        expect(motion({ prevActiveKey: 'gone' }).hasMotion).toBe(false);
        expect(motion({ tabPaneMotion: false }).hasMotion).toBe(false);
        expect(motion({ forceDisableMotion: true }).hasMotion).toBe(false);
    });
});

describe('TabsFoundation.handleKeyDown', () => {
    it('按住 Alt、Ctrl 或 Meta 的按键交给浏览器，不移动焦点也不阻止默认行为', () => {
        const foundation = new TabsFoundation({ getProps: () => ({}), getContext: () => undefined } as unknown as TabsAdapter<TabsBaseProps>);
        const parent = document.createElement('div');
        const [first, second] = ['a', 'b'].map((key) => {
            const tab = document.createElement('div');
            tab.tabIndex = -1;
            tab.setAttribute('data-tabkey', `semiTab${key}`);
            parent.append(tab);
            return tab;
        });
        document.body.append(parent);
        first.focus();
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight', [modifier]: true, cancelable: true });
            Object.defineProperty(event, 'currentTarget', { value: first });
            Object.defineProperty(event, 'target', { value: first });
            foundation.handleKeyDown(event as never, 'a', false);
            expect(document.activeElement).toBe(first);
            expect(event.defaultPrevented).toBe(false);
        }
        foundation.handleKeyDown({ key: 'ArrowRight', target: first, currentTarget: first, preventDefault: () => {}, stopPropagation: () => {} } as never, 'a', false);
        expect(document.activeElement).toBe(second);
        parent.remove();
    });

    it.each(['Delete', 'Backspace'])('%s 关闭可关闭的页签并阻止默认行为，不关闭禁用的页签', (key) => {
        const notifyTabDelete = vi.fn<TabsAdapter['notifyTabDelete']>();
        const foundation = new TabsFoundation({
            getProps: () => ({}),
            notifyTabDelete,
        } as unknown as TabsAdapter<TabsBaseProps>);
        const press = (disabled: boolean) => {
            const parent = document.createElement('div');
            const tab = document.createElement('div');
            tab.setAttribute('data-tabkey', 'semiTabb');
            tab.setAttribute('aria-disabled', String(disabled));
            parent.append(tab);
            const event = new KeyboardEvent('keydown', { key, cancelable: true });
            Object.defineProperty(event, 'currentTarget', { value: tab });
            Object.defineProperty(event, 'target', { value: tab });
            foundation.handleKeyDown(event as never, 'b', true);
            return event.defaultPrevented;
        };
        expect(press(true)).toBe(false);
        expect(notifyTabDelete).not.toHaveBeenCalled();
        // WebKit navigates back on an unhandled Backspace
        expect(press(false)).toBe(true);
        expect(notifyTabDelete).toHaveBeenCalledExactlyOnceWith('b');
    });
});

describe('TabsFoundation.handleTabPanesChange', () => {
    const create = (props: Record<string, any>, activeKey: string) => {
        const setNewActiveKey = vi.fn<TabsAdapter['setNewActiveKey']>();
        const foundation = new TabsFoundation({
            getProp: (key: string) => props[key],
            getProps: () => props,
            getStates: () => ({ activeKey }),
            setNewActiveKey,
        } as unknown as TabsAdapter<TabsBaseProps>);
        return { foundation, setNewActiveKey };
    };

    it('非受控键离开面板后，移到第一个启用的面板', () => {
        const { foundation, setNewActiveKey } = create({}, 'gone');
        foundation.handleTabPanesChange([{ itemKey: 'a', disabled: true }, { itemKey: 'b' }]);
        expect(setNewActiveKey).toHaveBeenCalledExactlyOnceWith('b');
        foundation.handleTabPanesChange([]);
        expect(setNewActiveKey).toHaveBeenLastCalledWith('');
    });

    it('保留仍存在的键，且从不改动受控键', () => {
        const kept = create({}, 'b');
        kept.foundation.handleTabPanesChange([{ itemKey: 'a' }, { itemKey: 'b' }]);
        expect(kept.setNewActiveKey).not.toHaveBeenCalled();
        const controlled = create({ activeKey: 'gone' }, 'gone');
        controlled.foundation.handleTabPanesChange([{ itemKey: 'a' }]);
        expect(controlled.setNewActiveKey).not.toHaveBeenCalled();
    });
});
