import { type Component, h } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import { render } from '@test/utils/vue';
import AIChatDialogue from '../ai-chat-dialogue/index';
import AIChatInput from '../ai-chat-input/index';
import ChatAttachment from '../chat/attachment.vue';
import Sidebar from '../sidebar/index';

// Every name below is asserted against the Japanese pack, a locale that is neither the zh_CN default nor English
const ja = ja_JP;
function inJapanese(component: Component, props: Record<string, unknown> = {}, children?: () => string) {
    return render(LocaleProvider, {
        props: { locale: ja_JP },
        slots: { default: () => h(component, props, children && { default: children }) },
    });
}

describe('AI 组件的可访问名称跟随语言包', () => {
    it('AIChatInput 为发送按钮与上传触发器命名', () => {
        inJapanese(AIChatInput);
        expect(screen.getByRole('button', { name: ja.AIChatInput.send })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.AIChatInput.upload })).toBeInTheDocument();
    });

    it('AIChatInput 为技能删除按钮命名', async () => {
        inJapanese(AIChatInput, {
            defaultContent: '<skill-slot data-value="w" data-label="Writing" data-template="false"></skill-slot>',
        });
        expect(await screen.findByRole('button', { name: ja.AIChatInput.removeSkill })).toBeInTheDocument();
    });

    it('AIChatInput 为引用与附件删除按钮命名', async () => {
        inJapanese(AIChatInput, {
            references: [{ id: 'r1', type: 'text', content: 'quoted' }],
            uploadProps: {
                defaultFileList: [{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success', url: 'a.txt' }],
            },
        });
        expect(await screen.findByRole('button', { name: ja.AIChatInput.removeReference })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.AIChatInput.removeAttachment })).toBeInTheDocument();
    });

    it('Chat attachment 为删除按钮命名', () => {
        inJapanese(ChatAttachment, {
            attachment: [{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success' }],
        });
        expect(screen.getByRole('button', { name: ja.Chat.removeAttachment })).toBeInTheDocument();
    });

    it('AIChatDialogue 为代码块复制按钮命名', async () => {
        inJapanese(AIChatDialogue, {
            chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }],
            roleConfig: { assistant: { name: 'A' } },
        });
        // the message action and the code block each carry a copy button
        expect(await screen.findAllByRole('button', { name: ja.AIChatDialogue.copy })).toHaveLength(2);
    });

    it('Sidebar 容器为关闭按钮命名', () => {
        inJapanese(Sidebar.Container, { title: 't', visible: true }, () => 'content');
        expect(screen.getByRole('button', { name: ja.Sidebar.close })).toBeInTheDocument();
    });

    it('切换语言包后 AI 组件名称随之更新', async () => {
        expect(ja_JP.AIChatInput.send).not.toBe(en_US.AIChatInput.send);
        const view = inJapanese(AIChatInput);
        expect(screen.getByRole('button', { name: ja_JP.AIChatInput.send })).toBeInTheDocument();
        await view.rerender({ locale: en_US });
        expect(screen.getByRole('button', { name: en_US.AIChatInput.send })).toBeInTheDocument();
    });
});
