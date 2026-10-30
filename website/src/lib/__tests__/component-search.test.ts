import { describe, expect, it } from 'vite-plus/test';
import { searchComponents, type ComponentEntry } from '../component-search';

const entry = (page: string, zh: string, en: string): ComponentEntry => ({
    page,
    titles: { 'zh-CN': zh, 'en-US': en },
    hrefs: { 'zh-CN': `/zh-CN/react/x/${page}`, 'en-US': `/en-US/react/x/${page}` },
});

const entries = [entry('buttonGroup', '按钮组', 'ButtonGroup'), entry('button', '按钮', 'Button'), entry('datePicker', '日期选择器', 'DatePicker'), entry('splitButton', '分裂按钮', 'SplitButton')];
const pages = (query: string) => searchComponents(entries, query).map((e) => e.page);

describe('searchComponents', () => {
    it('中文名和英文名都能匹配，英文不区分大小写', () => {
        expect(pages('日期')).toEqual(['datePicker']);
        expect(pages('DATEPICKER')).toEqual(['datePicker']);
    });

    it('忽略空格和连字符', () => {
        expect(pages('date picker')).toEqual(['datePicker']);
        expect(pages('Date-Picker')).toEqual(['datePicker']);
    });

    it('按完全匹配、前缀匹配、子串匹配排序，同一档内保持侧边栏顺序', () => {
        expect(pages('button')).toEqual(['button', 'buttonGroup', 'splitButton']);
        expect(pages('按钮')).toEqual(['button', 'buttonGroup', 'splitButton']);
    });

    it('空查询或没有匹配时返回空列表', () => {
        expect(pages('  ')).toEqual([]);
        expect(pages('xyz')).toEqual([]);
    });
});
