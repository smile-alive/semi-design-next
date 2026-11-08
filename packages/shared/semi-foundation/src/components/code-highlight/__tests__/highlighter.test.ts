import { describe, expect, it } from 'vite-plus/test';
import { highlight } from '../highlighter';
import { register, type LanguageInput } from '../registry';

const python = () => import('shiki/langs/python.mjs');

describe('highlight 加载失败', () => {
    it('瞬时失败的语法下次调用时重试，期间其他语言仍可高亮', async () => {
        let attempts = 0;
        const flaky: LanguageInput = () => {
            attempts++;
            return attempts === 1 ? Promise.reject(new Error('chunk load failed')) : import('shiki/langs/vala.mjs');
        };
        register({ languages: [python, flaky] });

        expect(await highlight('x = 1', 'python')).toContain('shiki');
        expect(attempts).toBe(1);

        expect(await highlight('int x = 1;', 'vala')).toContain('shiki');
        expect(attempts).toBe(2);
    });

    it('永久失败的语法只影响它自己的语言', async () => {
        register({ languages: [() => Promise.reject(new Error('404'))] });

        expect(await highlight('x = 1', 'python')).toContain('shiki');
        await expect(highlight('x', 'not-loaded')).rejects.toThrow('404');
    });
});

describe('themes 中值为 undefined 的键', () => {
    it('组件传入的 undefined 主题回落到已注册主题', async () => {
        const html = await highlight('x = 1', 'python', { themes: { light: undefined } });
        expect(html).toContain('--shiki-light');
    });

    it('register 传入的 undefined 主题不覆盖已注册主题', async () => {
        register({ themes: { dark: undefined } });
        expect(await highlight('x = 1', 'python')).toContain('--shiki-dark');
    });
});
