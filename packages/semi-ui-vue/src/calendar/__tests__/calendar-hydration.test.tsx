/** @jsxImportSource vue */
import { createSSRApp, nextTick } from 'vue';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Calendar from '..';

afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
});

// The server rendered on the 8th and the browser hydrates on the 9th: the first frame still matches the markup, and
// the marker lands on the 9th once mounted
it('服务端与浏览器跨日时，hydration 无警告且挂载后标记浏览器的今天', async () => {
    const displayValue = new Date(2019, 7, 8);
    const render = () => <Calendar displayValue={displayValue} mode="month" />;
    vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date'] });
    const { html } = await renderOnServer(render);
    expect(html).not.toMatch(/semi-calendar-today(?![-\w])/);

    vi.setSystemTime(new Date(2019, 8 - 1, 9, 0, 1));
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render });
    app.config.warnHandler = (message) => {
        warnings.push(message);
    };
    app.mount(container);
    expect(warnings.filter((message) => message.includes('Hydration'))).toEqual([]);
    await nextTick();
    expect(container.querySelector('.semi-calendar-today')?.textContent).toMatch(/\b9$/);
    app.unmount();
});
