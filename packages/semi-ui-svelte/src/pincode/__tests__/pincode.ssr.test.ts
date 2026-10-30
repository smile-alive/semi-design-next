import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { PinCodeProps } from '../interface';
import PinCodeFixture from './pincode-fixture.svelte';

describe('Svelte PinCode 服务端首帧', () => {
    it('首帧带 group、按位置命名的格子、已填字符与属性分流', () => {
        const store = createStore<{ props: PinCodeProps }>({
            props: { value: '12', count: 3, size: 'large', id: 'code', 'aria-label': 'Verification code', 'aria-describedby': 'hint', 'data-x': '1' } as PinCodeProps,
        });
        const { body } = render(PinCodeFixture, { props: { store } });
        expect(body).toContain('role="group"');
        expect(body).toMatch(/<div[^>]*aria-label="Verification code"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toContain('aria-label="第 1 位，共 3 位"');
        expect(body).toContain('aria-label="第 3 位，共 3 位"');
        expect(body.match(/<input/g)).toHaveLength(3);
        expect(body).toMatch(/<input[^>]*value="1"/);
        expect(body).toMatch(/<input[^>]*value="2"/);
        expect(body).toMatch(/<input[^>]*id="code"/);
        expect(body.match(/id="code"/g)).toHaveLength(1);
        expect(body.match(/aria-describedby="hint"/g)).toHaveLength(3);
        expect(body).toContain('inputmode="numeric"');
        expect(body).toContain('semi-input-large');
    });

    it('禁用与 mixed 格式首帧', () => {
        const store = createStore<{ props: PinCodeProps }>({ props: { count: 2, disabled: true, format: 'mixed' } });
        const { body } = render(PinCodeFixture, { props: { store } });
        expect(body.match(/disabled/g)?.length).toBeGreaterThanOrEqual(2);
        expect(body).toContain('inputmode="text"');
    });
});
