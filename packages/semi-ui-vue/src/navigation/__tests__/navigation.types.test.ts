import { ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import type { NavFooterConfig, NavHeaderConfig, NavItemConfig, NavItems } from '..';

describe('Navigation 类型', () => {
    it('含 dropdownProps.menu 的 items 放进 ref() 后仍可原样使用', () => {
        const onClick = (_event: MouseEvent) => {};
        const items = ref<NavItems>([
            'Home',
            {
                itemKey: 'user',
                text: 'User',
                class: ['a', { b: true }],
                style: { color: 'red' },
                dropdownStyle: 'width: 200px',
                dropdownProps: {
                    class: 'popup',
                    style: { width: '200px' },
                    menu: [{ node: 'item', name: 'A', onClick }],
                },
                linkOptions: { target: '_blank', rel: 'noopener', onClick },
                items: [{ itemKey: 'u1', text: 'U1', 'data-id': 'u1' }],
            },
        ]);
        const plain: NavItems = items.value;
        const header = ref<NavHeaderConfig>({ text: 'Semi', class: 'h', style: { color: 'red' } });
        const footer = ref<NavFooterConfig>({ collapseButton: true, style: 'color: red' });
        expect([plain.length, header.value.text, footer.value.collapseButton]).toEqual([2, 'Semi', true]);
    });

    it('数据项的 style 不接受数组', () => {
        // @ts-expect-error entries take style one level deep, so an array of styles is rejected
        const item: NavItemConfig = { itemKey: 'a', style: [{ color: 'red' }] };
        // @ts-expect-error same for the popup style of a Sub entry
        const sub: NavItemConfig = { itemKey: 'b', dropdownStyle: [{ color: 'red' }] };
        // @ts-expect-error same for the header config
        const header: NavHeaderConfig = { style: [{ color: 'red' }] };
        expect([item.itemKey, sub.itemKey, header.style]).toHaveLength(3);
    });
});
