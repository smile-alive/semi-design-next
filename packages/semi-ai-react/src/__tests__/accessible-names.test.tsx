import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { en_US } from '@fibrae/semi-ui-react/locale';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import type { UploadProps } from '@fibrae/semi-ui-react/upload/index';
import AIChatDialogue from '../components/ai-chat-dialogue';
import AIChatInput from '../components/ai-chat-input';
import ChatAttachment from '../components/chat/attachment';
import Sidebar from '../components/sidebar';

// Every name below is asserted against en_US, which differs from the zh_CN default
const inEnglish = (ui) => render(<LocaleProvider locale={en_US}>{ui}</LocaleProvider>);

describe('AI 组件的可访问名称跟随语言包', () => {
    it('AIChatInput 为发送按钮与上传触发器命名', () => {
        inEnglish(<AIChatInput />);
        expect(screen.getByRole('button', { name: en_US.AIChatInput.send })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.AIChatInput.upload })).toBeInTheDocument();
    });

    it('AIChatInput 为技能删除按钮命名', async () => {
        inEnglish(<AIChatInput defaultContent='<skill-slot data-value="w" data-label="Writing" data-template="false"></skill-slot>' />);
        expect(await screen.findByRole('button', { name: en_US.AIChatInput.removeSkill })).toBeInTheDocument();
    });

    it('AIChatInput 为引用与附件删除按钮命名', async () => {
        inEnglish(
            <AIChatInput
                references={[{ id: 'r1', type: 'text', content: 'quoted' }]}
                // AIChatInput renders its Upload without an action, which UploadProps declares as required
                uploadProps={
                    {
                        defaultFileList: [{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success', url: 'a.txt' }],
                    } as UploadProps
                }
            />
        );
        expect(await screen.findByRole('button', { name: en_US.AIChatInput.removeReference })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: en_US.AIChatInput.removeAttachment })).toBeInTheDocument();
    });

    it('Chat attachment 为删除按钮命名', () => {
        inEnglish(<ChatAttachment attachment={[{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success' }]} />);
        expect(screen.getByRole('button', { name: en_US.Chat.removeAttachment })).toBeInTheDocument();
    });

    it('AIChatDialogue 为代码块复制按钮命名', async () => {
        const chats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
        inEnglish(<AIChatDialogue chats={chats} roleConfig={{ assistant: { name: 'A' } }} />);
        expect(await screen.findAllByRole('button', { name: en_US.AIChatDialogue.copy })).toHaveLength(2);
    });

    it('Sidebar 容器为关闭按钮命名', () => {
        inEnglish(
            <Sidebar.Container title="t" visible>
                content
            </Sidebar.Container>
        );
        expect(screen.getByRole('button', { name: en_US.Sidebar.close })).toBeInTheDocument();
    });
});
