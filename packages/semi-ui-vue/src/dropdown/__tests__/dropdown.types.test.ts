import { ref } from 'vue';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { DropDownMenuItem, DropDownMenuItemDivider, DropDownMenuItemItem, DropDownMenuItemTitle, DropdownProps } from '..';

describe('Dropdown 类型', () => {
    it('menu 数据项只含数据与菜单项接收的属性，不带全局扩展的 HTML 属性', () => {
        type Named<T> = Exclude<keyof T, `data-${string}` | `aria-${string}`>;
        expectTypeOf<Named<DropDownMenuItemItem>>().toEqualTypeOf<'node' | 'name' | 'active' | 'disabled' | 'showTick' | 'type' | 'class' | 'style' | 'onClick' | 'onContextmenu' | 'onMouseenter' | 'onMouseleave'>();
        expectTypeOf<Named<DropDownMenuItemDivider>>().toEqualTypeOf<'node' | 'class' | 'style'>();
        expectTypeOf<Named<DropDownMenuItemTitle>>().toEqualTypeOf<'node' | 'name' | 'class' | 'style'>();
    });

    it('含 menu 的配置放进 ref() 后仍可原样使用', () => {
        const onClick = (_event: MouseEvent) => {};
        const props = ref<DropdownProps>({
            menu: [
                { node: 'title', name: 'Group' },
                { node: 'item', name: 'A', active: true, class: 'a', 'data-id': 'a', onClick },
                { node: 'divider', style: { margin: '4px' } },
            ],
        });
        const plain: DropdownProps = props.value;
        const menu: DropDownMenuItem[] = ref<DropDownMenuItem[]>(plain.menu ?? []).value;
        expect(menu).toHaveLength(3);
    });
});
