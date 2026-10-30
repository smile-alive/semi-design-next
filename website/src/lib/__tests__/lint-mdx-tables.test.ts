import path from 'node:path';
import { compileError, tableErrors } from '#scripts/lint-mdx-tables.ts';
import { describe, expect, it } from 'vite-plus/test';

const frontmatter = ['---', 'title: 示例', 'brief: 带 { 花括号与 <尖括号 的简介', '---', ''];
// A page with React and Vue demos, so remark-demo resolves demos next to it and the Vue build runs too
const page = path.resolve(import.meta.dirname, '../../../content/basic/icon/index.zh-CN.mdx');

describe('lint-mdx-tables', () => {
    it('表格行的单元格比表头多时报错', () => {
        const source = ['| 属性 | 类型 |', '| --- | --- |', '| type | string | number |'].join('\n');
        expect(tableErrors(source)).toEqual(['3: expected 2 cells (header), found 3']);
    });

    it('编译报出表格里未转义的花括号，行列号按原文件计，frontmatter 不参与解析', async () => {
        const source = [...frontmatter, '| 属性 | 类型 |', '| --- | --- |', '| emoji | { emoji?: string; text?: string } |'].join('\n');
        // acorn reads `emoji?` as the start of a conditional and stops at the `:` after it
        expect(await compileError(source, 'feedback.mdx')).toBe('8:19: Could not parse expression with acorn');
    });

    it('编译报出表格里被当作标签的尖括号', async () => {
        const source = [...frontmatter, '| 事件 | 类型 |', '| --- | --- |', '| onFocus | FocusEvent<HTMLDivElement> |'].join('\n');
        expect(await compileError(source, 'time-picker.mdx')).toMatch(/^8:\d+: /);
    });

    it('frontmatter 不是合法 YAML 时报出所在行', async () => {
        const source = ['---', 'title: a', '  b: c', '---', '', '正文'].join('\n');
        expect(await compileError(source, 'broken.mdx')).toBe('2:8: Nested mappings are not allowed in compact mappings at line 2, column 8:\n\ntitle: a\n       ^\n');
    });

    it('未闭合的标签报出标签所在行', async () => {
        expect(await compileError(['# 标题', '', '<br>', ''].join('\n'), 'unclosed.mdx')).toMatch(/^3:1: /);
    });

    it('demo 文件不存在时报错', async () => {
        const source = [...frontmatter, '<Demo id="missing-infra-demo" />'].join('\n');
        expect(await compileError(source, page)).toBe(`1:1: ${page}: demo "missing-infra-demo" not found, looked for demos/missing-infra-demo.react.tsx`);
    });

    it('有 Vue demo 的页面再按 Vue 编译一遍', async () => {
        const source = [...frontmatter, '<Framework only="vue">', '<Demo id="missing-infra-demo" />', '</Framework>'].join('\n');
        expect(await compileError(source, page)).toContain('looked for demos/missing-infra-demo.vue');
    });

    it('Framework 缺少有效的 only 时报错', async () => {
        const source = [...frontmatter, '<Framework only="angular">', '正文', '</Framework>'].join('\n');
        expect(await compileError(source, page)).toContain('<Framework> needs only="react" or only="vue"');
    });

    it('转义后的花括号与尖括号可以编译', async () => {
        const source = [...frontmatter, '| 属性 | 类型 |', '| --- | --- |', '| emoji | \\{ emoji?: string \\} |', '| onFocus | FocusEvent\\<HTMLDivElement\\> |'].join('\n');
        expect(await compileError(source, 'fixed.mdx')).toBeNull();
    });
});
