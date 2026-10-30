import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import GroupFixture from './group-fixture.svelte';
import RadioFixture from './radio-fixture.svelte';

describe('Svelte Radio 服务端首帧', () => {
    it('首帧带选中状态、addon 与 extra 的 id 和 aria 引用', () => {
        const store = createStore({ props: { checked: true, 'aria-label': 'x' }, label: 'label', extra: 'more' });
        const { body } = render(RadioFixture, { props: { store } });
        expect(body).toContain('semi-radio-checked');
        const addonId = body.match(/class="semi-radio-addon"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*class="semi-radio-addon"/);
        const id = addonId?.[1] ?? addonId?.[2];
        expect(id).toBeTruthy();
        expect(body).toContain(`aria-labelledby="${id}"`);
        expect(body).toMatch(/aria-describedby="extra-[^"]+"/);
        expect(body).toContain('x-semi-prop="extra"');
    });

    it('RadioGroup 首帧带选中项、radiogroup 角色与同组 name', () => {
        const store = createStore({ props: { value: 'B' } });
        const { body } = render(GroupFixture, { props: { store } });
        expect(body).toContain('role="radiogroup"');
        const names = [...body.matchAll(/<input[^>]*name="([^"]+)"/g)].map((m) => m[1]);
        expect(names).toHaveLength(3);
        expect(new Set(names).size).toBe(1);
        expect(body.match(/semi-radio-checked/g)).toHaveLength(1);
    });
});
