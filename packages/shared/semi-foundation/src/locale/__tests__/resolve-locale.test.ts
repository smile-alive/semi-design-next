import { describe, expect, it } from 'vite-plus/test';
import type { LocaleComponentName, LocaleInput } from '../interface';
import { resolveLocale } from '../resolve-locale';
import en_US from '../source/en_US';
import zh_CN from '../source/zh_CN';

const ja: LocaleInput = {
    code: 'ja-JP',
    Modal: { cancel: 'キャンセル' },
    DatePicker: { placeholder: { date: '日付を選択' } },
};

describe('resolveLocale', () => {
    it('ConfigProvider 的语言优先于 LocaleProvider', () => {
        const result = resolveLocale(en_US, zh_CN, 'Pagination');
        expect(result.localeCode).toBe(en_US.code);
        expect(result.locale).toBe(en_US.Pagination);
        expect(result.currency).toBe(en_US.currency);
    });

    it('没有 ConfigProvider 语言时使用 LocaleProvider 的语言', () => {
        expect(resolveLocale(undefined, en_US, 'Tag').locale).toBe(en_US.Tag);
        expect(resolveLocale(null, en_US, 'Tag').localeCode).toBe(en_US.code);
    });

    it('都没有或所选语言没有 code 时回退到 zh_CN', () => {
        expect(resolveLocale(undefined, undefined, 'Tag').locale).toBe(zh_CN.Tag);
        expect(resolveLocale({ ...en_US, code: '' }, en_US, 'Tag').localeCode).toBe(zh_CN.code);
    });

    it('自定义语言包缺的文案、嵌套键与 currency 回退到 en_US', () => {
        const modal = resolveLocale(ja, undefined, 'Modal');
        expect(modal.localeCode).toBe('ja-JP');
        expect(modal.currency).toBe(en_US.currency);
        expect(modal.locale).toEqual({ ...en_US.Modal, cancel: 'キャンセル' });

        const datePicker = resolveLocale(ja, undefined, 'DatePicker').locale;
        expect(datePicker.placeholder).toEqual({ ...en_US.DatePicker.placeholder, date: '日付を選択' });
        expect(datePicker.months).toEqual(en_US.DatePicker.months);

        expect(resolveLocale(ja, undefined, 'Tag').locale).toBe(en_US.Tag);
        expect(en_US.Modal.cancel).not.toBe('キャンセル');
    });

    it('应用经 declaration merging 新增的命名空间原样返回', () => {
        const ComponentA = { customKey: 'semi' };
        const custom = { ...zh_CN, ComponentA } as LocaleInput;
        expect(resolveLocale(custom, undefined, 'ComponentA' as LocaleComponentName).locale).toBe(ComponentA);
    });

    it('同一个自定义语言包对象多次解析返回同一个条目', () => {
        expect(resolveLocale(ja, undefined, 'DatePicker').locale).toBe(resolveLocale(undefined, ja, 'DatePicker').locale);
        expect(resolveLocale({ ...ja }, undefined, 'DatePicker').locale).not.toBe(resolveLocale(ja, undefined, 'DatePicker').locale);
    });
});
