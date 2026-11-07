import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { Annotation, MCPConfigure, Sidebar } from '@fibrae/semi-ai-react';
import type { Option } from '../interface';

// React reports a spread key or a missing list key once per module for components it cannot tell apart, so these
// checks live in a file of their own and each test renders every place that could warn
const warningsAbout = (spy, text) => spy.mock.calls.filter((args) => String(args[0]).includes(text));

describe('Sidebar 警告', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('带 key 的项不会与 key 一起展开到 JSX 中', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const codes = [{ key: 'a', name: 'a.js', language: 'javascript', content: 'let a;' }];
        render(<Sidebar.CodeContent activeKey={['a']} codes={codes} />);
        render(<Sidebar detailContent={codes[0]} mode="code" visible />);
        render(<Sidebar detailContent={{ key: 'f', name: 'a.md', content: '<p>x</p>' }} mode="file" visible />);
        expect(warningsAbout(error, '"key" prop is being spread')).toEqual([]);
    });

    it('自定义项渲染函数可以返回不带 key 的元素', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const sidebarOptions: Option[] = [
            { name: 'A', key: 'a' },
            { name: 'B', key: 'b' },
        ];
        render(<Sidebar options={sidebarOptions} visible renderOptionItem={(option) => <span>{option.name}</span>} />);
        const info = [{ header: 'h', key: '1', annotations: [{ title: 'a' }, { title: 'b' }] }];
        render(<Annotation activeKey={['1']} info={info} visible renderItem={(item) => <span>{item.title}</span>} />);
        const mcpOptions = [
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
        ];
        render(<MCPConfigure options={mcpOptions} visible renderItem={({ option }) => <span>{option.label}</span>} />);
        expect(warningsAbout(error, 'unique "key"')).toEqual([]);
    });
});
