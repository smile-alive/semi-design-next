import { describe, expect, it } from 'vite-plus/test';
import { getCopyConfig } from '../copy';

describe('getCopyConfig', () => {
    it('copyable 为 true 时取默认时长和传入的文本', () => {
        expect(getCopyConfig(true, 'text')).toEqual({ content: 'text', duration: 3 });
    });

    it('配置自带的 content 和 duration 优先，其余字段原样保留', () => {
        expect(getCopyConfig({ content: 'mine', duration: 1, copyTip: 'tip' }, 'text')).toEqual({ content: 'mine', duration: 1, copyTip: 'tip' });
    });

    it('显式 undefined 的 content 和 duration 取回退值，空字符串 content 保留', () => {
        expect(getCopyConfig({ content: undefined, duration: undefined }, 'text')).toEqual({ content: 'text', duration: 3 });
        expect(getCopyConfig({ content: '' }, 'text').content).toBe('');
    });
});
