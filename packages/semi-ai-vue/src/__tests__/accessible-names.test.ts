import { type Component, h } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { en_US, zh_CN } from '@fibrae/semi-ui-vue/locale';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import { render } from '@test/utils/vue';
import AIChatDialogue from '../components/ai-chat-dialogue/index';
import AIChatInput from '../components/ai-chat-input/index';
import ChatAttachment from '../components/chat/attachment.vue';
import Sidebar from '../components/sidebar/index';

// Every name below is asserted against en_US, which differs from the zh_CN default
function inEnglish(component: Component, props: Record<string, unknown> = {}, children?: () => string) {
    return render(LocaleProvider, {
        props: { locale: en_US },
        slots: { default: () => h(component, props, children && { default: children }) },
    });
}

describe('AI 组件的可访问名称跟随语言包', () => {
    it('AIChatInput 为发送按钮与上传触发器命名', () => {
        inEnglish(AIChatInput);
        expect(screen.getByRole('button', { name: en_US.AIChatInput.send })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.AIChatInput.upload })).toBeInTheDocument();
    });

    it('AIChatInput 为技能删除按钮命名', async () => {
        inEnglish(AIChatInput, {
            defaultContent: '<skill-slot data-value="w" data-label="Writing" data-template="false"></skill-slot>',
        });
        expect(await screen.findByRole('button', { name: en_US.AIChatInput.removeSkill })).toBeInTheDocument();
    });

    it('AIChatInput 为引用与附件删除按钮命名', async () => {
        inEnglish(AIChatInput, {
            references: [{ id: 'r1', type: 'text', content: 'quoted' }],
            uploadProps: {
                defaultFileList: [{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success', url: 'a.txt' }],
            },
        });
        expect(await screen.findByRole('button', { name: en_US.AIChatInput.removeReference })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.AIChatInput.removeAttachment })).toBeInTheDocument();
    });

    it('Chat attachment 为删除按钮命名', () => {
        inEnglish(ChatAttachment, {
            attachment: [{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success' }],
        });
        expect(screen.getByRole('button', { name: en_US.Chat.removeAttachment })).toBeInTheDocument();
    });

    it('AIChatDialogue 为代码块复制按钮命名', async () => {
        inEnglish(AIChatDialogue, {
            chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }],
            roleConfig: { assistant: { name: 'A' } },
        });
        expect(await screen.findAllByRole('button', { name: en_US.AIChatDialogue.copy })).toHaveLength(2);
    });

    it('Sidebar 容器为关闭按钮命名', () => {
        inEnglish(Sidebar.Container, { title: 't', visible: true }, () => 'content');
        expect(screen.getByRole('button', { name: en_US.Sidebar.close })).toBeInTheDocument();
    });

    it('切换语言包后 AI 组件名称随之更新', async () => {
        expect(zh_CN.AIChatInput.send).not.toBe(en_US.AIChatInput.send);
        const view = inEnglish(AIChatInput);
        expect(screen.getByRole('button', { name: en_US.AIChatInput.send })).toBeInTheDocument();
        await view.rerender({ locale: zh_CN });
        expect(screen.getByRole('button', { name: zh_CN.AIChatInput.send })).toBeInTheDocument();
    });
});
