import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Calendar } from '../index';

const displayValue = new Date(2019, 7, 8);

describe('Calendar 服务端渲染', () => {
    it.each(['day', 'week', 'month', 'range'] as const)('%s 视图首帧输出表格语义', (mode) => {
        const { body } = render(Calendar, { props: { displayValue, mode, range: [new Date(2019, 7, 1), new Date(2019, 7, 4)] } });
        expect(body).toContain('role="table"');
        expect(body).toContain('role="row"');
        expect(body).toContain('role="cell"');
    });

    it('today 在挂载前未知，不输出今天的高亮与当前时间线', () => {
        for (const mode of ['day', 'week', 'month'] as const) {
            const { body } = render(Calendar, { props: { displayValue, mode } });
            // `semi-calendar-today-date` is the date label's own class, not the today mark
            expect(body).not.toMatch(/semi-calendar-today(?![-\w])/);
            expect(body).not.toContain('semi-calendar-grid-curr-line');
        }
    });

    it('month 视图首帧把有事件的日期折叠为 "更多"', () => {
        const events = [{ key: 'a', start: new Date(2019, 7, 8, 9), children: 'a' }];
        const { body } = render(Calendar, { props: { displayValue, events, mode: 'month' } });
        expect(body).toContain('还有1项');
    });
});
