/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Calendar from '..';

it.each(['week', 'month'] as const)('%s 视图服务端不标记今天', async (mode) => {
    const { html, warnings } = await renderOnServer(() => <Calendar displayValue={new Date()} mode={mode} />);
    expect(warnings).toEqual([]);
    // semi-calendar-today-date is on every cell; only the exact class marks a day
    expect(html).not.toMatch(/semi-calendar-today(?![-\w])/);
    expect(html).not.toContain('aria-current');
    expect(html).not.toContain('-curr-line');
});
