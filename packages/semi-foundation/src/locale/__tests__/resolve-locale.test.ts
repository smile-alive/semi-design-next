import { describe, expect, it } from 'vite-plus/test';
import { resolveLocale } from '../resolve-locale';
import en_US from '../source/en_US';
import ja_JP from '../source/ja_JP';
import zh_CN from '../source/zh_CN';

describe('resolveLocale', () => {
    it('ConfigProvider 的语言优先于 LocaleProvider', () => {
        const result = resolveLocale(en_US, ja_JP, 'Pagination');
        expect(result.localeCode).toBe(en_US.code);
        expect(result.locale).toBe(en_US.Pagination);
        expect(result.dateFnsLocale).toBe(en_US.dateFnsLocale);
        expect(result.currency).toBe(en_US.currency);
    });

    it('没有 ConfigProvider 语言时使用 LocaleProvider 的语言', () => {
        expect(resolveLocale(undefined, ja_JP, 'Tag').localeCode).toBe(ja_JP.code);
        expect(resolveLocale(null, ja_JP, 'Tag').localeCode).toBe(ja_JP.code);
    });

    it('都没有或所选语言没有 code 时回退到 zh_CN', () => {
        expect(resolveLocale(undefined, undefined, 'Tag').locale).toBe(zh_CN.Tag);
        expect(resolveLocale({ ...en_US, code: '' }, ja_JP, 'Tag').localeCode).toBe(zh_CN.code);
    });
});
