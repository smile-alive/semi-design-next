import { describe, expect, it } from 'vitest';
import { searchComponents, type ComponentEntry } from '../component-search';

const entry = (page: string, zh: string, en: string): ComponentEntry => ({
    page,
    titles: { 'zh-CN': zh, 'en-US': en },
    hrefs: { 'zh-CN': `/zh-CN/react/x/${page}`, 'en-US': `/en-US/react/x/${page}` },
});

const entries = [entry('buttonGroup', '按钮组', 'ButtonGroup'), entry('button', '按钮', 'Button'), entry('datePicker', '日期选择器', 'DatePicker'), entry('splitButton', '分裂按钮', 'SplitButton')];
const pages = (query: string) => searchComponents(entries, query).map((e) => e.page);

describe('searchComponents', () => {
    it('matches the Chinese and English names case-insensitively', () => {
        expect(pages('日期')).toEqual(['datePicker']);
        expect(pages('DATEPICKER')).toEqual(['datePicker']);
    });

    it('ignores spaces and hyphens', () => {
        expect(pages('date picker')).toEqual(['datePicker']);
        expect(pages('Date-Picker')).toEqual(['datePicker']);
    });

    it('ranks exact, then prefix, then substring matches, keeping sidebar order within a rank', () => {
        expect(pages('button')).toEqual(['button', 'buttonGroup', 'splitButton']);
        expect(pages('按钮')).toEqual(['button', 'buttonGroup', 'splitButton']);
    });

    it('returns nothing for a blank query or no match', () => {
        expect(pages('  ')).toEqual([]);
        expect(pages('xyz')).toEqual([]);
    });
});
