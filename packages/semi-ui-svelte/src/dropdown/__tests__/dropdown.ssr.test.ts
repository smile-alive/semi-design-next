import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import DropdownCase from './dropdown-case.svelte';
import MenuCase from './menu-case.svelte';

type Store = NonNullable<Parameters<typeof DropdownCase>[1]>['store'];

const store: Store = { accept: true, log: [], trigger: 'text', content: 'items', entries: [['One']], menu: [], icons: false, value: true };

describe('Svelte Dropdown 服务端渲染', () => {
    it('首帧输出带 data-popupid 的触发器，不输出弹层，即使 visible 为 true', () => {
        const { body } = render(DropdownCase, { props: { mode: 'bind', store: { ...store, log: [], entries: [['One']] } } });
        expect(body).toContain('semi-tooltip-trigger-wrapper');
        expect(body).toMatch(/data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-dropdown-wrapper');
        expect(body).not.toContain('semi-dropdown-menu');
    });

    it('child 触发器首帧带展开的属性，没有包装 span', () => {
        const { body } = render(DropdownCase, { props: { store: { ...store, log: [], entries: [['One']], trigger: 'button' } } });
        expect(body).toMatch(/<button[^>]*data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-tooltip-trigger-wrapper');
    });

    it('单独渲染的 Menu 首帧带 role、aria-orientation 与子项', () => {
        const { body } = render(MenuCase, { props: {} });
        expect(body).toMatch(/<ul[^>]*role="menu"/);
        expect(body).toContain('aria-orientation="vertical"');
        expect(body).toContain('role="separator"');
        expect(body).toContain('role="presentation"');
        expect(body).toMatch(/<li[^>]*role="menuitem"[^>]*>(<!--[^>]*-->|[\s])*K1/);
    });
});
