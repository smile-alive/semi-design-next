import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { ResponseChunk } from '../data-adapter/interface';
import streamingChatCompletionToMessage from '../data-adapter/streaming-chat-completion-to-message';
import streamingResponseToMessage from '../data-adapter/streaming-response-to-message';
import type { FunctionToolCall } from '../foundation';

const responseChunks: ResponseChunk[] = [
    { type: 'response.output_item.added', sequence_number: 0, output_index: 0, item: { type: 'message', content: [] } },
    {
        type: 'response.content_part.added',
        sequence_number: 1,
        output_index: 0,
        content_index: 0,
        part: { type: 'output_text', text: '' },
    },
    { type: 'response.output_text.delta', sequence_number: 2, output_index: 0, content_index: 0, delta: 'Hel' },
    { type: 'response.output_text.delta', sequence_number: 3, output_index: 0, content_index: 0, delta: 'lo' },
];
const textOf = (message) => message.content[0].content[0].text;

describe('streamingResponseToMessage 纯度', () => {
    it('使用相同 prevState 连续调用两次结果相同', () => {
        const first = streamingResponseToMessage(responseChunks.slice(0, 3), null);
        const a = streamingResponseToMessage(responseChunks, first.nextState);
        const b = streamingResponseToMessage(responseChunks, first.nextState);
        expect(textOf(a.message)).toBe('Hello');
        expect(textOf(b.message)).toBe('Hello');
    });

    it('不修改更早一次调用返回的消息', () => {
        const first = streamingResponseToMessage(responseChunks.slice(0, 3), null);
        streamingResponseToMessage(responseChunks, first.nextState);
        expect(textOf(first.message)).toBe('Hel');
    });
});

describe('streamingResponseToMessage response.completed', () => {
    it('output 为单个条目时 content 归一化为数组', () => {
        const item = { type: 'message', content: [] };
        const { message } = streamingResponseToMessage([{ type: 'response.completed', response: { id: 'r1', output: item } }]);
        expect(message.content).toEqual([item]);
    });
});

describe('streamingResponseToMessage 生命周期状态', () => {
    it.each([
        ['response.queued', 'queued'],
        ['response.failed', 'failed'],
        ['response.incomplete', 'incomplete'],
    ] as const)('%s 事件把状态写为 %s，并保留已收到的文本', (type, status) => {
        const { message } = streamingResponseToMessage([...responseChunks, { type, response: { id: 'r1' } }]);
        expect(message.status).toBe(status);
        expect(textOf(message)).toBe('Hello');
    });

    it('response.failed 的错误写入 error', () => {
        const { message } = streamingResponseToMessage([
            { type: 'response.created', response: { id: 'r1' } },
            { type: 'response.failed', response: { id: 'r1', error: { code: 'server_error', message: 'boom' } } },
        ]);
        expect((message as { error?: unknown }).error).toEqual({ code: 'server_error', message: 'boom' });
    });

    it('error 事件把状态写为 failed，同时保留 error', () => {
        const { message } = streamingResponseToMessage([...responseChunks, { type: 'error', code: 'rate_limit', message: 'slow down' }]);
        expect(message.status).toBe('failed');
        expect((message as { error?: unknown }).error).toEqual({ code: 'rate_limit', message: 'slow down' });
        expect(textOf(message)).toBe('Hello');
    });
});

describe('streamingChatCompletionToMessage finish_reason', () => {
    it.each([
        ['stop', 'completed'],
        ['tool_calls', 'completed'],
        ['length', 'incomplete'],
        ['content_filter', 'incomplete'],
    ])('finish_reason 为 %s 时状态为 %s', (finishReason, status) => {
        const { messages } = streamingChatCompletionToMessage([completionChunk(0, { content: 'Hi' }), completionChunk(0, {}, finishReason)]);
        expect(messages[0].status).toBe(status);
    });
});

describe('streamingResponseToMessage 无 sequence_number 的块', () => {
    const added: ResponseChunk = {
        type: 'response.output_item.added',
        sequence_number: 0,
        output_index: 0,
        item: { type: 'message' },
    };
    const part: ResponseChunk = {
        type: 'response.content_part.added',
        sequence_number: 1,
        output_index: 0,
        content_index: 0,
        part: { type: 'output_text', text: '' },
    };
    const delta = (text: string, sequence_number?: number): ResponseChunk => ({
        type: 'response.output_text.delta',
        output_index: 0,
        content_index: 0,
        delta: text,
        ...(sequence_number === undefined ? {} : { sequence_number }),
    });

    it('同一批的多个无序号块按到达顺序全部应用', () => {
        const { message } = streamingResponseToMessage([added, part, delta('A'), delta('B')], null);
        expect(textOf(message)).toBe('AB');
    });

    it('无序号块与序号块交错时保持到达顺序', () => {
        const { message } = streamingResponseToMessage([added, part, delta('X'), delta('Y', 2), delta('Z', 3)], null);
        expect(textOf(message)).toBe('XYZ');
    });

    it('整个流都没有序号时按到达顺序处理', () => {
        const bare = (chunk: ResponseChunk): ResponseChunk => ({ ...chunk, sequence_number: undefined });
        const { message } = streamingResponseToMessage([bare(added), bare(part), delta('Hi')], null);
        expect(textOf(message)).toBe('Hi');
    });

    it('累计列表重复传入时不重复应用', () => {
        const n = delta('N');
        const all = [added, part, n];
        let state = null;
        const texts = [];
        for (let i = 0; i < 3; i++) {
            const result = streamingResponseToMessage(all, state);
            state = result.nextState;
            texts.push(textOf(result.message));
        }
        expect(texts).toEqual(['N', 'N', 'N']);
    });

    it('只传新块的调用方式同样累加', () => {
        const first = streamingResponseToMessage([added, part, delta('N')], null);
        const second = streamingResponseToMessage([delta('M')], first.nextState);
        expect(textOf(second.message)).toBe('NM');
    });

    it('流式中途的 output_text 是 message 项内已收到的文本', () => {
        const reasoning: ResponseChunk = {
            type: 'response.output_item.added',
            sequence_number: 2,
            output_index: 1,
            item: { type: 'reasoning', summary: [{ type: 'summary_text', text: 'think' }] },
        };
        const { message } = streamingResponseToMessage([added, part, reasoning, delta('Hi', 3)], null);
        expect(message.output_text).toBe('Hi');
    });
});

describe('streamingResponseToMessage 缺块与未知事件', () => {
    const textDelta = (sequence_number: number): ResponseChunk => ({
        type: 'response.output_text.delta',
        sequence_number,
        output_index: 0,
        content_index: 0,
        delta: String(sequence_number),
    });
    const head = responseChunks.slice(0, 2);
    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => textDelta(from + i));

    it('缺块后到达的块不超过 MAX_GAP 时继续等待缺失的块', () => {
        const { message } = streamingResponseToMessage([...head, ...range(3, 12)], null);
        expect(textOf(message)).toBe('');
    });

    it('缺块后到达的块超过 MAX_GAP 时跳过缺失的块，继续输出后面的块', () => {
        const { message, nextState } = streamingResponseToMessage([...head, ...range(3, 13)], null);
        expect(textOf(message)).toBe('345678910111213');
        const late = streamingResponseToMessage([textDelta(2), textDelta(14)], nextState);
        expect(textOf(late.message)).toBe('34567891011121314');
        expect(late.nextState.buffer.size).toBe(0);
        expect(late.nextState.processedSeq.has(2)).toBe(true);
    });

    it('未知 type 的块不抛错，也不影响其他块', () => {
        const unknown = JSON.parse('{"type":"response.future_event","sequence_number":2,"output_index":0}');
        const { message } = streamingResponseToMessage([...head, unknown, textDelta(3)], null);
        expect(textOf(message)).toBe('3');
    });

    it('ResponseChunk 按 type 收窄到该事件的字段', () => {
        expectTypeOf<ResponseChunk['type']>().not.toEqualTypeOf<string>();
        expectTypeOf<ResponseChunk & { type: 'error' }>().toHaveProperty('message');
        expectTypeOf<ResponseChunk & { type: 'error' }>().not.toHaveProperty('delta');
    });
});

const completionChunk = (index, delta, finish_reason = null) => ({
    id: 'c1',
    choices: [{ index, delta, finish_reason }],
});

describe('streamingChatCompletionToMessage 纯度', () => {
    const tool = (name) => ({ tool_calls: [{ index: 0, id: 't1', function: { name, arguments: '{}' } }] });
    const firstChunks = [completionChunk(0, { content: 'Hi' }), completionChunk(0, tool('a'))];
    const allChunks = [...firstChunks, completionChunk(0, { content: '!' }), completionChunk(0, tool('b'))];

    it('不写入传入的 state', () => {
        const first = streamingChatCompletionToMessage(firstChunks);
        const snapshot = structuredClone(first.state);
        streamingChatCompletionToMessage(allChunks, first.state);
        expect(first.state).toEqual(snapshot);
    });

    it('使用相同 state 连续调用两次结果相同', () => {
        const first = streamingChatCompletionToMessage(firstChunks);
        const a = streamingChatCompletionToMessage(allChunks, first.state);
        const b = streamingChatCompletionToMessage(allChunks, first.state);
        expect(b.messages).toEqual(a.messages);
        expect((a.messages[0].content as FunctionToolCall[]).at(-1)?.name).toBe('ab');
    });
});

describe('streamingChatCompletionToMessage 工具调用分块', () => {
    const toolChunks = [
        completionChunk(0, {
            tool_calls: [{ index: 0, id: 'call_a', type: 'function', function: { name: 'getWeather', arguments: '' } }],
        }),
        completionChunk(0, { tool_calls: [{ index: 0, function: { arguments: '{"city":' } }] }),
        completionChunk(0, {
            tool_calls: [{ index: 1, id: 'call_b', type: 'function', function: { name: 'getTime', arguments: '' } }],
        }),
        completionChunk(0, { tool_calls: [{ index: 1, function: { arguments: '{"tz":"UTC"}' } }] }),
        completionChunk(0, { tool_calls: [{ index: 0, function: { arguments: '"Paris"}' } }] }),
        completionChunk(0, {
            tool_calls: [{ index: 2, id: 'call_c', type: 'custom', custom: { name: 'run', input: 'ab' } }],
        }),
        completionChunk(0, { tool_calls: [{ index: 2, custom: { input: 'cd' } }] }),
        completionChunk(0, {}, 'tool_calls'),
    ];

    it('后续块只带 index 时参数完整累加', () => {
        const { messages } = streamingChatCompletionToMessage(toolChunks);
        const calls = messages[0].content as any[];
        expect(calls).toHaveLength(3);
        expect(calls[0]).toMatchObject({ id: 'call_a', name: 'getWeather', arguments: '{"city":"Paris"}' });
        expect(calls[1]).toMatchObject({ id: 'call_b', name: 'getTime', arguments: '{"tz":"UTC"}' });
        expect(calls[2]).toMatchObject({ id: 'call_c', name: 'run', input: 'abcd', type: 'custom_tool_call' });
        expect(calls.map((c) => c.status)).toEqual(['completed', 'completed', 'completed']);
    });

    it('首块不带 arguments、input 或 name 时，后续块不拼出 undefined', () => {
        const { messages } = streamingChatCompletionToMessage([
            completionChunk(0, { tool_calls: [{ index: 0, id: 'call_a', type: 'function', function: { name: 'f' } }] }),
            completionChunk(0, { tool_calls: [{ index: 0, function: { arguments: '{}' } }] }),
            completionChunk(0, { tool_calls: [{ index: 1, id: 'call_b', type: 'custom', custom: {} }] }),
            completionChunk(0, { tool_calls: [{ index: 1, custom: { name: 'run', input: 'ls' } }] }),
        ]);
        const calls = messages[0].content as any[];
        expect(calls[0]).toMatchObject({ name: 'f', arguments: '{}' });
        expect(calls[1]).toMatchObject({ name: 'run', input: 'ls' });
    });

    it('逐片带 state 调用与一次性调用结果相同', () => {
        const once = streamingChatCompletionToMessage(toolChunks).messages;
        let state;
        let incremental;
        toolChunks.forEach((_, i) => {
            const result = streamingChatCompletionToMessage(toolChunks.slice(0, i + 1), state);
            state = result.state;
            incremental = result.messages;
        });
        expect(incremental).toEqual(once);
    });
});
