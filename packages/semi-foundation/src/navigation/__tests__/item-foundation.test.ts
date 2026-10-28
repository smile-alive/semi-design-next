import { describe, expect, it, vi } from 'vite-plus/test';
import ItemFoundation, { type ItemAdapter, type ItemProps } from '../item-foundation';

function createItem(props: ItemProps, { controlled = false, syncSelected = false } = {}) {
    let selected = false;
    const adapter = {
        getProps: () => props,
        getProp: (key: keyof ItemProps) => props[key],
        cloneDeep: (value: unknown) => structuredClone(value),
        // Vue-like state reads back the new value right after selectSelf
        selectSelf: vi.fn<ItemAdapter['selectSelf']>(() => {
            if (syncSelected) {
                selected = true;
            }
        }),
        getSelectedKeysIsControlled: () => controlled,
        getSelected: () => selected,
        notifyGlobalOnSelect: vi.fn<ItemAdapter['notifyGlobalOnSelect']>(),
        notifyGlobalOnClick: vi.fn<ItemAdapter['notifyGlobalOnClick']>(),
        notifyClick: vi.fn<ItemAdapter['notifyClick']>(),
    };
    return { adapter, foundation: new ItemFoundation(adapter as unknown as ItemAdapter) };
}

describe('ItemFoundation.handleClick', () => {
    it('点击未选中的项时上报 onSelect 与 onClick', () => {
        const { adapter, foundation } = createItem({ itemKey: 'a', text: 'A' });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.selectSelf).toHaveBeenCalledTimes(1);
        expect(adapter.notifyGlobalOnSelect).toHaveBeenCalledTimes(1);
        expect(adapter.notifyGlobalOnClick).toHaveBeenCalledTimes(1);
        expect(adapter.notifyClick).toHaveBeenCalledTimes(1);
    });

    it('选中状态同步更新的框架中，首次点击仍上报 onSelect', () => {
        const { adapter, foundation } = createItem({ itemKey: 'a', text: 'A' }, { syncSelected: true });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.notifyGlobalOnSelect).toHaveBeenCalledTimes(1);
    });

    it('禁用的项不上报任何回调', () => {
        const { adapter, foundation } = createItem({ itemKey: 'a', disabled: true });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.selectSelf).not.toHaveBeenCalled();
        expect(adapter.notifyGlobalOnSelect).not.toHaveBeenCalled();
        expect(adapter.notifyClick).not.toHaveBeenCalled();
    });

    it('子菜单标题只上报自身的点击，不上报全局 onSelect 与 onClick', () => {
        const { adapter, foundation } = createItem({ itemKey: 'a', isSubNav: true });
        foundation.handleClick(new MouseEvent('click'));
        expect(adapter.selectSelf).not.toHaveBeenCalled();
        expect(adapter.notifyGlobalOnSelect).not.toHaveBeenCalled();
        expect(adapter.notifyGlobalOnClick).not.toHaveBeenCalled();
        expect(adapter.notifyClick).toHaveBeenCalledTimes(1);
    });
});
