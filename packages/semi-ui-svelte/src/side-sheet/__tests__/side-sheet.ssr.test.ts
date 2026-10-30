import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import SideSheetFixture from './side-sheet-fixture.svelte';

describe('Svelte SideSheet 服务端首帧', () => {
    it('默认打开的抽屉在服务端不输出：Portal 挂载后才渲染，不访问 document', () => {
        const store = createStore({ props: { visible: true, title: 'Sheet' } });
        const { body } = render(SideSheetFixture, { props: { store } });
        expect(body).not.toContain('semi-sidesheet');
        expect(body).not.toContain('semi-portal');
    });

    it('keepDOM 的抽屉同样不在服务端输出', () => {
        const store = createStore({ props: { visible: false, keepDOM: true } });
        const { body } = render(SideSheetFixture, { props: { store } });
        expect(body).not.toContain('semi-sidesheet');
    });
});
