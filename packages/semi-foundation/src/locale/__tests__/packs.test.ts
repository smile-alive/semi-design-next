import { format } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import type { Locale } from '../interface';

const packs = import.meta.glob<Locale>('../source/*.ts', { eager: true, import: 'default' });
const entries = Object.entries(packs).map(([file, pack]) => ({ name: file.slice(10, -3), pack }));
const base = packs['../source/zh_CN.ts'];

function flatten(value: unknown, path = '', out: Record<string, string> = {}) {
    if (typeof value === 'string') {
        out[path] = value;
    } else if (Array.isArray(value)) {
        value.forEach((item, index) => flatten(item, `${path}[${index}]`, out));
    } else if (value && typeof value === 'object' && !('localize' in value)) {
        for (const [key, child] of Object.entries(value)) {
            flatten(child, path ? `${path}.${key}` : key, out);
        }
    }
    return out;
}

const placeholders = (text: string) => (text.match(/\$\{\w+\}/g) ?? []).sort();
const baseFlat = flatten(base);

const dateFnsFallback: Record<string, string> = {
    ga: 'en-IE',
    'my-MM': 'en-US',
    sw: 'en-US',
    ur: 'en-US',
    'fil-PH': 'en-US',
    'ceb-PH': 'en-US',
    'jv-ID': 'id',
};
// unit suffixes and the Calendar date template are legitimately empty in some languages
const mayBeEmpty = new Set(['TimePicker.hour', 'TimePicker.minute', 'TimePicker.second', 'Calendar.datestring']);

describe('语言包结构不变量', () => {
    it('共 57 个语言包，code 与文件名一致', () => {
        expect(entries).toHaveLength(57);
        for (const { name, pack } of entries) {
            expect([name, pack.code]).toEqual([name, name.replace('_', '-')]);
        }
    });

    it('键集合与 zh_CN 完全一致', () => {
        for (const { name, pack } of entries) {
            expect([name, Object.keys(flatten(pack)).sort()]).toEqual([name, Object.keys(baseFlat).sort()]);
        }
    });

    it('每个字符串的占位符集合与 zh_CN 一致', () => {
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (key in baseFlat && placeholders(text).join() !== placeholders(baseFlat[key]).join()) {
                    bad.push(`${name} ${key}: ${text}`);
                }
            }
        }
        expect(bad).toEqual([]);
    });

    it('除白名单外字符串不为空', () => {
        const empty: string[] = [];
        for (const { name, pack } of entries) {
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (text === '' && !mayBeEmpty.has(key) && baseFlat[key] !== '') {
                    empty.push(`${name} ${key}`);
                }
            }
        }
        expect(empty).toEqual([]);
    });

    it('currency 是合法的 ISO 4217 码', () => {
        const valid = new Set(Intl.supportedValuesOf('currency'));
        expect(entries.filter(({ pack }) => !valid.has(pack.currency)).map(({ name }) => name)).toEqual([]);
    });

    it('只有英语、高棉语、拉美西语使用 USD', () => {
        const usd = new Set(['en-US', 'km-KH', 'es-419']);
        expect(entries.filter(({ pack }) => pack.currency === 'USD' && !usd.has(pack.code)).map(({ name }) => name)).toEqual([]);
    });

    it('没有零宽字符（波斯语与高棉语的书写规则需要除外）', () => {
        const needsJoiners = new Set(['fa-IR', 'km-KH']);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            if (needsJoiners.has(pack.code)) {
                continue;
            }
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (/[​-‍]/.test(text)) {
                    bad.push(`${name} ${key}`);
                }
            }
        }
        expect(bad).toEqual([]);
    });

    it('字符串首尾无空白（Pagination.page 是与页码拼接的后缀，法语等需要前导空格）', () => {
        const joined = new Set(['Pagination.page']);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (!joined.has(key) && text !== text.trim()) {
                    bad.push(`${name} ${key}: ${JSON.stringify(text)}`);
                }
            }
        }
        expect(bad).toEqual([]);
    });

    it('非中日韩语言包不含全角标点', () => {
        const cjk = new Set(['zh-CN', 'zh-TW', 'ja-JP', 'ko-KR']);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            if (cjk.has(pack.code)) {
                continue;
            }
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (/[！-／：-＠［-｀｛-～、。]/.test(text)) {
                    bad.push(`${name} ${key}: ${text}`);
                }
            }
        }
        expect(bad).toEqual([]);
    });

    it('同一命名空间内，en_US 不同的两个文案本地化后仍不同', () => {
        const english = flatten(packs['../source/en_US.ts']);
        // pairs that label the same thing in different places share a wording in most languages
        const sameWord = new Set([
            'TimePicker.panel.time TimePicker.placeholder.time',
            'TimePicker.panel.timeRange TimePicker.placeholder.timeRange',
            'TimePicker.hour TimePicker.hourList',
            'TimePicker.minute TimePicker.minuteList',
            'TimePicker.second TimePicker.secondList',
            'Chat.copied Chat.copySuccess',
            'Rating.star Rating.stars',
        ]);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            const flat = flatten(pack);
            const seen = new Map<string, string>();
            for (const key of Object.keys(english).sort()) {
                const text = flat[key];
                // date labels coincide in many languages by nature
                if (!text || key.startsWith('DatePicker.')) {
                    continue;
                }
                const group = `${key.slice(0, key.indexOf('.'))}\u0000${text}`;
                const first = seen.get(group);
                if (first && english[first] !== english[key] && !sameWord.has(`${first} ${key}`)) {
                    bad.push(`${name} ${first} == ${key}: ${text}`);
                }
                seen.set(group, first ?? key);
            }
        }
        expect(bad).toEqual([]);
    });

    it('FORMAT_SWITCH_DATE 只输出数字与分隔符，且恰为年月日', () => {
        const date = new Date(2026, 9, 13, 14, 35);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            const token = pack.DatePicker.localeFormatToken.FORMAT_SWITCH_DATE;
            let text: string;
            try {
                text = format(date, token);
            } catch (error) {
                bad.push(`${name} ${token}: ${(error as Error).message}`);
                continue;
            }
            const numbers = text.match(/\d+/g) ?? [];
            if (!/^[\d\s./-]+$/.test(text) || numbers.sort().join() !== ['10', '13', '2026'].join()) {
                bad.push(`${name} ${token} -> ${text}`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('dateFnsLocale 与语言一致，缺少 date-fns 语言的包按回退表', () => {
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            const code = pack.code;
            const expected = dateFnsFallback[code] ?? code.split('-')[0];
            if (!pack.dateFnsLocale.code?.startsWith(expected)) {
                bad.push(`${name}: ${pack.dateFnsLocale.code} 不匹配 ${expected}`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('月份、星期与上下午文案互不重复', () => {
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            const { months, weeks, fullMonths } = pack.DatePicker as unknown as Record<string, Record<string, string>>;
            for (const [label, group] of Object.entries({ months, weeks, fullMonths })) {
                const values = Object.values(group);
                if (new Set(values).size !== values.length) {
                    bad.push(`${name} ${label}`);
                }
            }
            if (pack.TimePicker.AM === pack.TimePicker.PM) {
                bad.push(`${name} TimePicker.AM == PM`);
            }
            if (pack.Calendar.AM === pack.Calendar.PM) {
                bad.push(`${name} Calendar.AM == PM`);
            }
        }
        expect(bad).toEqual([]);
    });
});
