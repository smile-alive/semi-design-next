import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture, { type FixtureStore } from './time-picker-fixture.svelte';

const renderBody = (init: Partial<FixtureStore>) => render(Fixture, { props: { store: createStore<FixtureStore>({ target: 'value', mode: 'one-way', accept: true, log: [], props: {}, ...init }) } }).body;

describe('Svelte TimePicker 服务端首帧', () => {
    it('输入框带值的文本与 combobox 属性，打开时也不输出面板', () => {
        const body = renderBody({ value: new Date(2021, 5, 1, 10, 23, 15), open: true });
        expect(body).toMatch(/<input[^>]*value="10:23:15"/);
        expect(body).toMatch(/<input[^>]*role="combobox"/);
        expect(body).toMatch(/<input[^>]*aria-expanded="true"/);
        expect(body).toContain('placeholder="请选择时间"');
        expect(body).not.toContain('semi-scrolllist');
    });

    it('inputReadOnly 时首帧输入框带 readonly 属性', () => {
        const body = renderBody({ value: '10:23:15', props: { inputReadOnly: true } });
        expect(body).toMatch(/<input[^>]*\breadonly\b/);
    });

    it('范围值只有一侧时显示分隔符，不标记无效', () => {
        const body = renderBody({ value: ['', '10:00:00'], props: { type: 'timeRange' } });
        expect(body).toMatch(/<input[^>]*value=" ~ 10:00:00"/);
        expect(body).not.toContain('semi-timepicker-input-invalid');
    });

    it('自定义触发器首帧拿到格式化后的文本', () => {
        const body = renderBody({ value: '10:23:15', trigger: 'button' });
        expect(body).toContain('10:23:15</button>');
        expect(body).not.toContain('<input');
    });
});
