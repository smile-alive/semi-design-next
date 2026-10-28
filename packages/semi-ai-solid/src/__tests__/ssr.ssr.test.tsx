import { expect, it } from 'vite-plus/test';
import { expectServerCase, uncoveredExports } from '@test/solid/ssr.solid';
import { ssrCases } from './ssr-cases';

const [entrySource] = Object.values(import.meta.glob<string>('../index.ts', { eager: true, query: '?raw', import: 'default' }));

// Value exports that are not components: the message data adapters and a configure-item factory
const nonComponents = ['getConfigureItem', 'chatCompletionToMessage', 'streamingChatCompletionToMessage', 'streamingResponseToMessage', 'responseToMessage', 'chatInputToMessage', 'chatInputToChatCompletion'];

it('守卫：AI 用例表覆盖入口的全部组件导出', () => {
    expect(uncoveredExports(entrySource, ssrCases, nonComponents)).toEqual({ uncovered: [], stale: [] });
});

it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', (_, ssrCase) => expectServerCase(ssrCase));
