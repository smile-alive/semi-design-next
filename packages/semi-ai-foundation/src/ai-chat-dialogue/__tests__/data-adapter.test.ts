import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import chatCompletionToMessage from '../data-adapter/chat-completion-to-message';
import chatInputToChatCompletion from '../data-adapter/chat-input-to-chat-completion';
import chatInputToMessage, { type ChatInputMessage } from '../data-adapter/chat-input-to-message';
import messageToChatInput from '../data-adapter/message-to-chat-input';
import responseToMessage from '../data-adapter/response-to-message';
import streamingChatCompletionToMessage from '../data-adapter/streaming-chat-completion-to-message';
import type { Message } from '../foundation';

describe('chatCompletionToMessage', () => {
    const completion = (message) => ({ id: 'c1', choices: [{ index: 0, message, finish_reason: 'stop' }] });

    it('自定义工具调用的 type 为 custom_tool_call', () => {
        const [message] = chatCompletionToMessage(
            completion({
                role: 'assistant',
                content: null,
                refusal: null,
                tool_calls: [{ id: 'x', type: 'custom', custom: { name: 'run', input: 'ls' } }],
            })
        );
        expect(message.content).toEqual([{ type: 'custom_tool_call', name: 'run', input: 'ls' }]);
    });

    it.each([
        ['stop', 'completed'],
        ['tool_calls', 'completed'],
        ['length', 'incomplete'],
        ['content_filter', 'incomplete'],
    ])('finish_reason 为 %s 时状态为 %s', (finishReason, status) => {
        const [message] = chatCompletionToMessage({
            id: 'c1',
            choices: [{ index: 0, message: { role: 'assistant', content: 'hi', refusal: null }, finish_reason: finishReason }],
        });
        expect(message.status).toBe(status);
    });

    it('content 与 refusal 为 null 时不产出空项', () => {
        const [message] = chatCompletionToMessage(
            completion({
                role: 'assistant',
                content: null,
                refusal: null,
                tool_calls: [{ id: 'x', type: 'function', function: { name: 'f', arguments: '{}' } }],
            })
        );
        expect((message.content as { type: string }[]).map((item) => item.type)).toEqual(['function_call']);

        const [plain] = chatCompletionToMessage(completion({ role: 'assistant', content: 'hi', refusal: null }));
        expect((plain.content as { type: string }[]).map((item) => item.type)).toEqual(['message']);
        expect((plain.content[0] as { content: unknown[] }).content).toHaveLength(1);
    });
});

describe('streamingChatCompletionToMessage 空值与自定义调用', () => {
    const chunk = (delta, finish_reason?) => ({ id: 'c1', choices: [{ index: 0, delta, finish_reason }] });

    it('缺省 finish_reason 的块状态为 in_progress', () => {
        const { messages } = streamingChatCompletionToMessage([chunk({ content: 'Hi' })]);
        expect(messages[0].status).toBe('in_progress');
    });

    it('旧式 function_call 的后续块缺少 arguments 时不拼出 undefined', () => {
        const { messages } = streamingChatCompletionToMessage([chunk({ function_call: { name: 'f' } }), chunk({ function_call: { arguments: '{}' } })]);
        expect(messages[0].content[0]).toMatchObject({ name: 'f', arguments: '{}' });
    });
});

describe('messageToChatInput', () => {
    it('Message 的 references 与 AIChatInput 的 references 是同一形状', () => {
        expectTypeOf<Message['references']>().toEqualTypeOf<MessageContent['references']>();
        expectTypeOf<{ name: string }>().not.toExtend<NonNullable<Message['references']>[number]>();
    });

    it('message 项的 content 为字符串时转为文本', () => {
        const result = messageToChatInput({
            id: '1',
            role: 'user',
            content: [{ type: 'message', content: 'hi' }],
        });
        expect(result.inputContents).toEqual([{ type: 'text', text: 'hi' }]);
    });

    it('message 项的 content 为数组时转换 input_text 与 input_image', () => {
        const result = messageToChatInput({
            id: '1',
            role: 'user',
            content: [
                {
                    type: 'message',
                    content: [
                        { type: 'input_text', text: 'hello' },
                        { type: 'input_image', image_url: 'blob:x', name: 'a.png' },
                    ],
                },
            ],
        });
        expect(result.inputContents).toEqual([{ type: 'text', text: 'hello' }]);
        expect(result.attachments).toHaveLength(1);
    });

    it('input_file 转为带文件名与地址的附件，未知项被忽略', () => {
        const result = messageToChatInput({
            id: '1',
            role: 'user',
            content: [
                {
                    type: 'message',
                    content: [
                        { type: 'input_file', filename: 'a.pdf', file_url: 'blob:f', uid: 'u1', size: 3 },
                        { type: 'input_audio', data: 'x' },
                    ],
                },
            ],
        });
        expect(result.attachments).toEqual([{ name: 'a.pdf', url: 'blob:f', status: 'success', size: 3, uid: 'u1' }]);
        expect(result.inputContents).toEqual([]);
    });
});

describe('chatInputToMessage', () => {
    const convert = (attachments: { name: string; url: string }[], text = 'hi') => chatInputToMessage({ attachments, inputContents: [{ type: 'text', text }] } as unknown);

    it.each([
        ['a.png', 'input_image'],
        ['a.jpg', 'input_image'],
        ['a.jpeg', 'input_image'],
        ['a.gif', 'input_image'],
        ['a.webp', 'input_image'],
        ['a.bmp', 'input_image'],
        ['a.pdf', 'input_file'],
        ['a.png.zip', 'input_file'],
        ['png', 'input_file'],
    ])('%s 的附件类型为 %s', (name, type) => {
        const { content } = convert([{ name, url: 'blob:x' }]);
        expect((content[0].content as { type: string }[]).map((item) => item.type)).toEqual([type, 'input_text']);
    });

    it('扩展名大写的图片同样转为 input_image', () => {
        const { content } = convert([{ name: 'PHOTO.PNG', url: 'blob:x' }]);
        expect(content[0].content[0]).toMatchObject({ type: 'input_image', image_url: 'blob:x' });
    });

    it('没有图片扩展名但 MIME 为图片的附件转为 input_image', () => {
        const result = chatInputToMessage({ attachments: [{ name: 'photo', url: 'blob:x', fileInstance: { type: 'image/heic' } }] } as unknown);
        expect(result.content[0].content[0]).toMatchObject({ type: 'input_image' });
    });

    it('返回值没有 id，不能直接作为 Message 放进 chats', () => {
        expectTypeOf(chatInputToMessage).returns.toEqualTypeOf<ChatInputMessage>();
        expectTypeOf<ChatInputMessage>().not.toExtend<Message>();
    });

    it('没有附件与输入内容时 content 为空数组，setup 缺省为空对象', () => {
        const result = chatInputToMessage({});
        expect(result.content[0].content).toEqual([]);
        expect(result.setup).toEqual({});
        expect(result.model).toBeUndefined();
    });

    it('透传 references，并以 setup.model 作为 model', () => {
        const result = chatInputToMessage({
            inputContents: [{ type: 'text', text: 'x' }],
            references: [{ id: 'r1' }],
            setup: { model: 'gpt' },
        } as unknown);
        expect(result).toMatchObject({ role: 'user', model: 'gpt', references: [{ id: 'r1' }] });
    });
});

describe('chatInputToChatCompletion', () => {
    it('图片附件转为 image_url，其余附件转为 file，文本排在附件之后', () => {
        const result = chatInputToChatCompletion({
            attachments: [
                { name: 'a.png', url: 'blob:a' },
                { name: 'b.pdf', url: 'blob:b', id: 'file-1' },
            ],
            inputContents: [{ type: 'text', text: 'hi' }],
            setup: { model: 'gpt' },
        });
        expect(result.messages[0].content).toEqual([
            { type: 'image_url', image_url: { url: 'blob:a' } },
            { type: 'file', file: { file_data: undefined, filename: 'b.pdf', file_id: 'file-1' } },
            { type: 'text', text: 'hi' },
        ]);
        expect(result.model).toBe('gpt');
    });

    it('扩展名大写的图片同样转为 image_url', () => {
        const result = chatInputToChatCompletion({ attachments: [{ name: 'A.JPG', url: 'blob:a' }] });
        expect(result.messages[0].content[0]).toMatchObject({ type: 'image_url' });
    });

    it('没有内容时 content 为空数组，setup 缺省为空对象', () => {
        const result = chatInputToChatCompletion({});
        expect(result.messages[0].content).toEqual([]);
        expect(result.setup).toEqual({});
    });
});

describe('responseToMessage', () => {
    it('把 Response 的字段映射为 assistant 消息', () => {
        const message = responseToMessage({
            id: 'r1',
            model: 'gpt',
            status: 'completed',
            output: [{ type: 'message', content: [] }],
            output_text: 'hi',
            created_at: 1,
        } as unknown);
        expect(message).toEqual({
            id: 'r1',
            role: 'assistant',
            content: [{ type: 'message', content: [] }],
            createdAt: 1,
            output_text: 'hi',
            model: 'gpt',
            status: 'completed',
        });
    });
});

describe('chatCompletionToMessage 补充', () => {
    const completion = (message) => ({ id: 'c1', choices: [{ index: 0, message, finish_reason: 'stop' }] });

    it('refusal 与 content 同时存在时各产出一项，annotations 展开 url_citation', () => {
        const [message] = chatCompletionToMessage(
            completion({
                role: 'assistant',
                content: 'hi',
                refusal: 'no',
                annotations: [{ type: 'url_citation', url_citation: { url: 'https://a.test', title: 'A' } }],
            })
        );
        const parts = (message.content[0] as { content: { type: string }[] }).content;
        expect(parts).toEqual([
            {
                type: 'output_text',
                text: 'hi',
                annotations: [{ type: 'url_citation', url: 'https://a.test', title: 'A' }],
            },
            { type: 'refusal', refusal: 'no' },
        ]);
    });

    it('只有 refusal 时不产出空的 output_text', () => {
        const [message] = chatCompletionToMessage(completion({ role: 'assistant', content: null, refusal: 'no' }));
        expect((message.content[0] as { content: unknown[] }).content).toEqual([{ type: 'refusal', refusal: 'no' }]);
    });

    it('多个 choice 各产出一条消息，音频作为 audio 项', () => {
        const messages = chatCompletionToMessage({
            id: 'c1',
            choices: [
                { index: 0, message: { role: 'assistant', content: 'a', audio: { id: 'au', data: 'x' } } },
                { index: 1, message: { role: 'assistant', content: 'b' } },
            ],
        } as unknown);
        expect(messages).toHaveLength(2);
        expect((messages[0].content as { type: string }[]).map((item) => item.type)).toEqual(['message', 'audio']);
    });
});
