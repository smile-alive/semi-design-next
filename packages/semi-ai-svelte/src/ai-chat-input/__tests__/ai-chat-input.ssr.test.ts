import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { AIChatInput } from '../index';

describe('AIChatInput 服务端首帧', () => {
    it('输出容器、编辑器占位、上传与发送按钮，面板不输出', () => {
        const { body } = render(AIChatInput, { props: { references: [{ id: 'r1', type: 'text', content: 'quoted' }], suggestions: ['first'], uploadProps: { defaultFileList: [{ uid: '1', name: 'a.png', size: '1KB', status: 'success', url: 'https://semi.design/a.png' }] } } });
        expect(body).toContain('class="semi-aiChatInput');
        expect(body).toContain('semi-aiChatInput-editor-content');
        expect(body).toContain('quoted');
        expect(body).toContain('a.png');
        expect(body).toContain(`aria-label="${zh_CN.AIChatInput.send}"`);
        expect(body).toContain(`aria-label="${zh_CN.AIChatInput.upload}"`);
        expect(body).not.toContain('semi-aiChatInput-suggestion-item');
        expect(body).not.toContain('ProseMirror');
    });
});
