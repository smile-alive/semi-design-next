import { describe, expect, it } from 'vite-plus/test';
import { followChats, followHints } from '../message-list-foundation';

describe('followChats', () => {
    it('返回新的副本，元素不变', () => {
        const message = { id: '1', content: 'hi' };
        const chats = [message];
        const followed = followChats(chats);
        expect(followed).not.toBe(chats);
        expect(followed).toEqual([message]);
        expect(followed[0]).toBe(message);
    });

    it('缺省时返回空列表', () => {
        expect(followChats(undefined)).toEqual([]);
        expect(followHints(undefined)).toEqual([]);
    });

    it('读取最后一条消息的内容长度，供响应式宿主订阅', () => {
        const reads: string[] = [];
        const content = new Proxy(['a'], {
            get(target, key, receiver) {
                reads.push(String(key));
                return Reflect.get(target, key, receiver);
            },
        });
        followChats([{ id: '1', content }]);
        expect(reads).toContain('length');
    });
});
