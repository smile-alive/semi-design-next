import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import InputNumberFixture from './input-number-fixture.svelte';

describe('Svelte InputNumber 服务端首帧', () => {
    it('首帧带格式化后的文本、aria 属性与外置按钮', () => {
        const store = createStore({ props: { value: 1234.5, precision: 2, min: 0, max: 5000, size: 'large' as const, 'aria-label': 'amount', 'data-x': '1' }, slots: false });
        const { body } = render(InputNumberFixture, { props: { store } });
        expect(body).toContain('role="spinbutton"');
        expect(body).toContain('value="1234.50"');
        expect(body).toContain('aria-valuenow="1234.5"');
        expect(body).toContain('aria-valuemin="0"');
        expect(body).toContain('aria-valuemax="5000"');
        expect(body).toContain('semi-input-number-size-large');
        expect(body).toContain('semi-input-number-suffix-btns');
        expect(body).toMatch(/<input[^>]*aria-label="amount"/);
        expect(body).toMatch(/<input[^>]*data-x="1"/);
    });

    it('货币格式、内置按钮不输出（悬停前）与 snippet 内容', () => {
        const store = createStore({ props: { value: 100, currency: 'USD', localeCode: 'en-US', innerButtons: true }, slots: true });
        const { body } = render(InputNumberFixture, { props: { store } });
        expect(body).toContain('value="$100.00"');
        expect(body).not.toContain('semi-input-number-suffix-btns');
        expect(body).toContain('USD');
        expect(body).toContain('before');
    });

    it('禁用与 hideButtons', () => {
        const store = createStore({ props: { value: 1, disabled: true, hideButtons: true }, slots: false });
        const { body } = render(InputNumberFixture, { props: { store } });
        expect(body).toContain('disabled');
        expect(body).toContain('aria-disabled="true"');
        expect(body).not.toContain('semi-input-number-suffix-btns');
    });
});
