import type { ComponentType } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

const demos = import.meta.glob<{ default: ComponentType }>('../../../../../website/content/ai/sidebar/demos/{container,annotation,mcp-configure,file-item}.react.tsx', { eager: true });
const toggles: [string, string][] = [
    ['container', '显示容器'],
    ['annotation', '参考来源'],
    ['mcp-configure', 'MCP 配置'],
    ['file-item', '可编辑'],
];

describe('sidebar 演示切换按钮', () => {
    it.each(toggles)('%s 通过 aria-pressed 表示状态，且标签不变', (name, label) => {
        const Demo = demos[`../../../../../website/content/ai/sidebar/demos/${name}.react.tsx`].default;
        render(<Demo />);
        const button = screen.getByRole('button', { name: label });
        expect(button).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(button);
        expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });
});
