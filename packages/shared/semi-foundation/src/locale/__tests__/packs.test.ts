import { format } from 'date-fns';
import { describe, expect, it } from 'vite-plus/test';
import en_US from '../source/en_US';
import zh_CN from '../source/zh_CN';

const entries = [
    { name: 'zh_CN', pack: zh_CN },
    { name: 'en_US', pack: en_US },
];

function flatten(value: unknown, path = '', out: Record<string, string> = {}) {
    if (typeof value === 'string') {
        out[path] = value;
    } else if (Array.isArray(value)) {
        value.forEach((item, index) => flatten(item, `${path}[${index}]`, out));
    } else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
            flatten(child, path ? `${path}.${key}` : key, out);
        }
    }
    return out;
}

const placeholders = (text: string) => (text.match(/\$\{\w+\}/g) ?? []).sort();
const zhFlat = flatten(zh_CN);
const enFlat = flatten(en_US);

// English leaves the unit suffixes and the Calendar date template empty
const mayBeEmpty = new Set(['TimePicker.hour', 'TimePicker.minute', 'TimePicker.second', 'Calendar.datestring']);

describe('语言包结构不变量', () => {
    it('code 与文件名一致', () => {
        for (const { name, pack } of entries) {
            expect([name, pack.code]).toEqual([name, name.replace('_', '-')]);
        }
    });

    it('en_US 与 zh_CN 的键集合完全一致', () => {
        expect(Object.keys(enFlat).sort()).toEqual(Object.keys(zhFlat).sort());
    });

    it('每个字符串的占位符集合与 zh_CN 一致', () => {
        const bad = Object.entries(enFlat)
            .filter(([key, text]) => key in zhFlat && placeholders(text).join() !== placeholders(zhFlat[key]).join())
            .map(([key, text]) => `${key}: ${text}`);
        expect(bad).toEqual([]);
    });

    it('除白名单外字符串不为空', () => {
        const empty: string[] = [];
        for (const { name, pack } of entries) {
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (text === '' && !mayBeEmpty.has(key)) {
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

    it('没有零宽字符', () => {
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            for (const [key, text] of Object.entries(flatten(pack))) {
                if (/[​-‍]/.test(text)) {
                    bad.push(`${name} ${key}`);
                }
            }
        }
        expect(bad).toEqual([]);
    });

    it('字符串首尾无空白（Pagination.page 是与页码拼接的后缀）', () => {
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

    it('en_US 不含全角标点', () => {
        const bad = Object.entries(enFlat)
            .filter(([, text]) => /[！-／：-＠［-｀｛-～、。]/.test(text))
            .map(([key, text]) => `${key}: ${text}`);
        expect(bad).toEqual([]);
    });

    it('同一命名空间内，en_US 不同的两个文案在 zh_CN 中仍不同', () => {
        // pairs that label the same thing in different places share a wording in Chinese
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
        const seen = new Map<string, string>();
        for (const key of Object.keys(enFlat).sort()) {
            const text = zhFlat[key];
            // date labels coincide by nature
            if (!text || key.startsWith('DatePicker.')) {
                continue;
            }
            const group = `${key.slice(0, key.indexOf('.'))}\u0000${text}`;
            const first = seen.get(group);
            if (first && enFlat[first] !== enFlat[key] && !sameWord.has(`${first} ${key}`)) {
                bad.push(`${first} == ${key}: ${text}`);
            }
            seen.set(group, first ?? key);
        }
        expect(bad).toEqual([]);
    });

    it('FORMAT_SWITCH_DATE 只输出数字与分隔符，且恰为年月日', () => {
        const date = new Date(2026, 9, 13, 14, 35);
        const bad: string[] = [];
        for (const { name, pack } of entries) {
            const token = pack.DatePicker.localeFormatToken.FORMAT_SWITCH_DATE;
            const text = format(date, token);
            const numbers = text.match(/\d+/g) ?? [];
            if (!/^[\d\s./-]+$/.test(text) || numbers.sort().join() !== ['10', '13', '2026'].join()) {
                bad.push(`${name} ${token} -> ${text}`);
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
