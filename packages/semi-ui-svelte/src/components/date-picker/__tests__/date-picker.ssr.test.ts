import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './date-picker-fixture.svelte';

const renderBody = (init: Partial<FixtureStore>) => render(Fixture, { props: { store: createStore<FixtureStore>({ target: 'value', mode: 'one-way', accept: true, log: [], props: {}, ...init }) } }).body;

describe('Svelte DatePicker 服务端首帧', () => {
    it('输入框带格式化后的值与 combobox 属性，打开时也不输出面板', () => {
        const body = renderBody({ value: new Date(2021, 5, 1), open: true });
        expect(body).toMatch(/<input[^>]*value="2021-06-01"/);
        expect(body).toMatch(/<input[^>]*role="combobox"/);
        expect(body).toMatch(/<input[^>]*aria-haspopup="dialog"/);
        expect(body).toContain('placeholder="请选择日期"');
        expect(body).not.toContain('semi-datepicker-month-grid');
    });

    it('范围类型首帧输出两个输入框与各自的值', () => {
        const body = renderBody({ value: [new Date(2021, 5, 1), new Date(2021, 5, 15)], props: { type: 'dateRange' } });
        expect(body).toMatch(/<input[^>]*value="2021-06-01"/);
        expect(body).toMatch(/<input[^>]*value="2021-06-15"/);
        expect(body).toMatch(/role="group"/);
    });

    it('inputReadOnly 时首帧输入框带 readonly 属性', () => {
        const body = renderBody({ value: '2021-06-01', props: { inputReadOnly: true } });
        expect(body).toMatch(/<input[^>]*\breadonly\b/);
    });

    it('自定义触发器首帧拿到值', () => {
        const body = renderBody({ value: new Date(2021, 5, 1), trigger: 'button' });
        expect(body).toContain('2021-06-01</button>');
        expect(body).not.toContain('<input');
    });

    it('设置 timeZone 时字符串值按该时区的钟点显示，与运行环境的时区无关', () => {
        const body = renderBody({ value: '2024-05-06 10:00:00', props: { type: 'dateTime', timeZone: 'America/New_York' } });
        expect(body).toMatch(/<input[^>]*value="2024-05-06 10:00:00"/);
    });
});
