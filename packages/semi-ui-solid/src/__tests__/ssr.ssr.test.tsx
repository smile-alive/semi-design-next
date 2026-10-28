import { expect, it, vi } from 'vite-plus/test';
import { expectServerCase, renderServer, uncoveredExports } from '@test/solid/ssr.solid';
import { Calendar, Modal, Notification, Toast } from '..';
import { ssrCases } from './ssr-cases';

const [entrySource] = Object.values(import.meta.glob<string>('../index.ts', { eager: true, query: '?raw', import: 'default' }));

// Value exports that are not components: hooks, the field HOC, config objects and the class behind Toast
const nonComponents = ['semiGlobal', 'useConfig', 'defaultResponsiveMap', 'useFieldApi', 'useFieldState', 'useForm', 'useFormApi', 'useFormState', 'withField', 'useLocale', 'ToastFactory'];

it('守卫：用例表覆盖入口的全部组件导出', () => {
    expect(uncoveredExports(entrySource, ssrCases, nonComponents)).toEqual({ uncovered: [], stale: [] });
});

it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', (_, ssrCase) => expectServerCase(ssrCase));

it.each([
    ['toast/服务端调用静态方法', () => Toast.info('Saved')],
    ['notification/服务端调用静态方法', () => Notification.info({ content: 'Saved' })],
    ['modal/服务端调用静态方法', () => Modal.info({ title: 'Saved' })],
])('%s', (_, call) => {
    // The message names the server so the caller learns to move the call into an event or effect
    expect(call).toThrow(/server/i);
});

it('calendar/今天只在挂载后标记', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2019, 7, 8, 12));
    try {
        const { html, errors } = await renderServer({ render: () => <Calendar mode="month" displayValue={new Date(2019, 7, 8, 12)} /> });
        expect(errors).toEqual([]);
        expect(html).not.toContain('aria-current');
        // `-today-date` sits on every date; `-today` alone marks the current one
        expect(html).not.toMatch(/-today(?!-date)/);
    } finally {
        vi.useRealTimers();
    }
});
