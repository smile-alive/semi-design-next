import path from 'node:path';
import { expect, it } from 'vite-plus/test';
import { compileSemiAiCss } from '../src/index';

const foundationPath = path.resolve(import.meta.dirname, '../../semi-foundation/src');
const aiFoundationPath = path.resolve(import.meta.dirname, '../../semi-ai-foundation/src');

it('AI 样式表只含 AI 组件样式，包在 @layer semi 中', () => {
    const css = compileSemiAiCss({ foundationPath, aiFoundationPath });
    expect(css).toMatch(/^@layer semi\b/);
    for (const block of ['aiChatInput', 'ai-chat-dialogue', 'chat', 'sidebar']) {
        expect(css).toContain(`.semi-${block}`);
    }
    // the tokens and core components come from the full stylesheet; AI rules do restyle nested buttons, so the probe
    // is a class only DatePicker's own sheet has
    expect(css).not.toMatch(/\.semi-datepicker-month-grid\b/);
    expect(css).not.toContain('--semi-color-primary:');
});

it('AI 样式表跟随 prefixCls 并可去掉 @layer', () => {
    const css = compileSemiAiCss({ foundationPath, aiFoundationPath, prefixCls: 'xprobe', cssLayer: false });
    expect(css).toContain('.xprobe-aiChatInput');
    expect(css).not.toContain('.semi-aiChatInput');
    expect(css).not.toMatch(/@layer semi\b/);
});
