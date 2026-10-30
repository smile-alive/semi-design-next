import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import ButtonCase from './button-case.svelte';
import GroupCase from './group-case.svelte';

type Case = NonNullable<Parameters<typeof ButtonCase>[1]>['store'];
type GroupStore = NonNullable<Parameters<typeof GroupCase>[1]>['store'];

describe('Svelte Button 服务端首帧', () => {
    it('首帧带类名、type、aria-disabled 与文本标记', () => {
        const store = createStore<Case>({ props: { type: 'danger', theme: 'solid', loading: true }, text: 'save' });
        const { body } = render(ButtonCase, { props: { store } });
        expect(body).toContain('semi-button-danger');
        expect(body).toContain('semi-button-solid');
        expect(body).toContain('semi-button-loading');
        expect(body).toContain('type="button"');
        expect(body).toContain('aria-disabled="true"');
        expect(body).toContain('data-icon="spin"');
        expect(body).toContain('x-semi-prop="children"');
    });

    it('组内按钮首帧继承组的属性', () => {
        const store = createStore<GroupStore>({ group: { type: 'warning', disabled: true }, items: [{ label: 'a' }, { label: 'b' }] });
        const { body } = render(GroupCase, { props: { store } });
        expect(body).toContain('role="group"');
        expect(body).toContain('semi-button-warning-disabled');
    });
});
