import { describe, expect, it } from 'vite-plus/test';
import type { Message } from '../foundation';
import { findContentItemRenderer, getAttachmentLayout, getVisibleAnnotations, isAwaitingOutput, isImageList } from '../message-content';

describe('getVisibleAnnotations', () => {
    it('去掉文件引用，保留其余', () => {
        const url = { type: 'url_citation', url: 'https://example.com' };
        expect(getVisibleAnnotations({ annotations: [{ type: 'file_citation' }, url, { type: 'container_file_citation' }] })).toEqual([url]);
    });

    it('没有引用时返回空数组', () => {
        expect(getVisibleAnnotations({})).toEqual([]);
    });
});

describe('isImageList', () => {
    it('两张及以上的图片才算图片列表', () => {
        expect(isImageList([{ type: 'input_image' }, { type: 'input_file' }])).toBe(false);
        expect(isImageList([{ type: 'input_image' }, { type: 'input_text' }, { type: 'input_image' }])).toBe(true);
    });
});

describe('getAttachmentLayout', () => {
    const parts = [{ type: 'input_image' }, { type: 'input_image' }, { type: 'input_file' }, { type: 'input_file' }, { type: 'input_image' }];

    it.each([
        [0, { isLast: false, breakAfter: false }],
        [1, { isLast: true, breakAfter: true }],
        [2, { isLast: false, breakAfter: false }],
        [3, { isLast: true, breakAfter: true }],
        [4, { isLast: true, breakAfter: false }],
    ])('第 %i 项', (index, layout) => {
        expect(getAttachmentLayout(parts, index)).toEqual(layout);
    });
});

describe('isAwaitingOutput', () => {
    const message = (fields: Partial<Message>): Message => ({ id: '1', role: 'assistant', ...fields });

    it.each<[string, Partial<Message>, boolean]>([
        ['未完成且没有输出', { status: 'in_progress' }, true],
        ['空字符串 content 不算输出', { status: 'queued', content: '' }, true],
        ['有 content', { status: 'in_progress', content: 'a' }, false],
        ['有 output_text', { status: 'in_progress', output_text: 'a' }, false],
        ['已完成', { status: 'completed' }, false],
    ])('%s', (_name, fields, expected) => {
        expect(isAwaitingOutput(message(fields))).toBe(expected);
    });
});

describe('findContentItemRenderer', () => {
    const plain = () => 'plain';
    const nested = () => 'nested';
    const map = { message: plain, function_call: { weather: nested }, mcp_call: plain, other: { weather: nested } };

    it('按类型取函数', () => {
        expect(findContentItemRenderer(map, 'message')).toBe(plain);
    });

    it('工具调用类型按名称取嵌套项', () => {
        expect(findContentItemRenderer(map, 'function_call', { name: 'weather' })).toBe(nested);
        expect(findContentItemRenderer(map, 'function_call', { name: 'none' })).toBeUndefined();
        expect(findContentItemRenderer(map, 'function_call')).toBeUndefined();
    });

    it('工具调用类型的函数项直接使用', () => {
        expect(findContentItemRenderer(map, 'mcp_call', { name: 'weather' })).toBe(plain);
    });

    it('非工具调用类型的对象项被忽略', () => {
        expect(findContentItemRenderer(map, 'other', { name: 'weather' })).toBeUndefined();
        expect(findContentItemRenderer(undefined, 'message')).toBeUndefined();
    });
});
