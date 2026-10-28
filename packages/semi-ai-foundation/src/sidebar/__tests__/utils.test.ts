import { describe, expect, it, vi } from 'vite-plus/test';
import type { MCPOption } from '../mcp-cof-content-foundation';
import { baseFilter, getFilterResult } from '../utils';

const options: MCPOption[] = [
    { label: 'GitHub', value: 'github', desc: 'Code hosting' },
    { label: 'Figma', value: 'figma', desc: 'Design tool' },
    // label is typed string but callers may pass nodes, which must never match
    { label: { node: true } as unknown as string, value: 'node', desc: { node: true } },
];

describe('sidebar 工具函数', () => {
    it('baseFilter 按子串匹配字符串 label 与 description', () => {
        expect(baseFilter('git', options[0])).toBe(true);
        expect(baseFilter('host', options[0])).toBe(true);
        expect(baseFilter('tool', options[0])).toBe(false);
        expect(baseFilter('', options[2])).toBe(true);
        expect(baseFilter('o', options[2])).toBe(false);
    });

    it('getFilterResult 过滤前先将输入转为小写', () => {
        expect(getFilterResult('DESIGN', options)).toEqual([options[1]]);
        expect(getFilterResult('x')).toEqual([]);
    });

    it('getFilterResult 使用自定义过滤器，传入小写输入', () => {
        const filter = vi.fn<(value: string, option: MCPOption) => boolean>((value, option) => option.value === value);
        expect(getFilterResult('FIGMA', options, filter)).toEqual([options[1]]);
        expect(filter).toHaveBeenCalledWith('figma', options[0]);
    });
});
