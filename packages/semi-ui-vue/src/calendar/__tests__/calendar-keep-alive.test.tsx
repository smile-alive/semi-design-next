/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Calendar from '../calendar.vue';

const Host = defineComponent({
    props: { active: { type: Boolean, required: true } },
    setup: (props) => () => <KeepAlive>{props.active ? <Calendar displayValue={new Date(2019, 7, 8)} mode="day" /> : <p>other</p>}</KeepAlive>,
});

const currLine = (root: ParentNode) => root.querySelector<HTMLElement>('.semi-calendar-grid-curr-line');

describe('Calendar KeepAlive', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('失活后当前时间线停止更新，激活后恢复', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        // jsdom has no layout: the scroll area is 480px, 20px per hour
        vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(480);
        const view = render(Host, { props: { active: true } });
        await nextTick();
        // the cached DOM stays in memory, so the line is held while the page is away
        const line = currLine(view.container) as HTMLElement;
        expect(parseFloat(line.style.top)).toBe(240);

        await view.rerender({ active: false });
        vi.advanceTimersByTime(90_000);
        await nextTick();
        expect(parseFloat(line.style.top)).toBe(240);

        await view.rerender({ active: true });
        await nextTick();
        expect(parseFloat((currLine(view.container) as HTMLElement).style.top)).toBeCloseTo(240.48, 2);
    });
});
