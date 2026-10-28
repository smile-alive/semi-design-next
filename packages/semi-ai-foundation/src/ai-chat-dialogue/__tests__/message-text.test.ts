import { describe, expect, it } from 'vite-plus/test';
import type { Message } from '../foundation';
import { getMessageText } from '../message-text';

const message = (fields: Partial<Message>): Message => ({ id: '1', role: 'assistant', ...fields });

describe('getMessageText', () => {
    it.each<[string, Message | undefined, string | undefined]>([
        ['字符串 content', message({ content: 'hello', output_text: 'ignored' }), 'hello'],
        ['空字符串 content 视为没有文本', message({ content: '', output_text: 'ignored' }), undefined],
        ['没有 content 时取 output_text', message({ output_text: 'from output' }), 'from output'],
        ['content 既非字符串也非数组时取 output_text', message({ content: { x: 1 } as unknown as Message['content'], output_text: 'o' }), 'o'],
        ['非字符串的 output_text 视为没有文本', message({ output_text: 1 as unknown as string }), undefined],
        ['没有消息', undefined, undefined],
        [
            '数组 content 优先于 output_text，跳过推理',
            message({
                output_text: 'ignored',
                content: [
                    { type: 'reasoning', content: [{ type: 'reasoning_text', text: 'thinking' }] },
                    { type: 'message', content: [{ type: 'output_text', text: 'answer' }] },
                ],
            }),
            'answer',
        ],
        [
            '合并文本、拒答与字符串 content，忽略图片、文件与工具调用',
            message({
                content: [
                    {
                        type: 'message',
                        content: [{ type: 'output_text', text: 'a' }, { text: 'b' }, { type: 'refusal', refusal: 'c' }, { type: 'input_image', image_url: 'https://semi.design/a.png' }],
                    },
                    { content: 'd' },
                    { type: 'function_call', name: 'f', arguments: '{}' },
                ],
            }),
            'abcd',
        ],
        ['数组中没有文本时视为没有文本', message({ content: [{ type: 'function_call', name: 'f' }] }), undefined],
    ])('%s', (_, input, expected) => {
        expect(getMessageText(input)).toBe(expected);
    });
});
