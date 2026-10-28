import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import type { UploadProps } from '@fibrae/semi-ui-react/upload/index';
import AIChatDialogue from '../ai-chat-dialogue';
import AIChatInput from '../ai-chat-input';
import ChatAttachment from '../chat/attachment';
import Sidebar from '../sidebar';

// Every name below is asserted against the Japanese pack, a locale that is neither the zh_CN default nor English
const ja = ja_JP;
const inJapanese = (ui) => render(<LocaleProvider locale={ja_JP}>{ui}</LocaleProvider>);

describe('AI 组件的可访问名称跟随语言包', () => {
    it('AIChatInput 为发送按钮与上传触发器命名', () => {
        inJapanese(<AIChatInput />);
        expect(screen.getByRole('button', { name: ja.AIChatInput.send })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.AIChatInput.upload })).toBeInTheDocument();
    });

    it('AIChatInput 为技能删除按钮命名', async () => {
        inJapanese(<AIChatInput defaultContent='<skill-slot data-value="w" data-label="Writing" data-template="false"></skill-slot>' />);
        expect(await screen.findByRole('button', { name: ja.AIChatInput.removeSkill })).toBeInTheDocument();
    });

    it('AIChatInput 为引用与附件删除按钮命名', async () => {
        inJapanese(
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
        expect(await screen.findByRole('button', { name: ja.AIChatInput.removeReference })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: ja.AIChatInput.removeAttachment })).toBeInTheDocument();
    });

    it('Chat attachment 为删除按钮命名', () => {
        inJapanese(<ChatAttachment attachment={[{ uid: 'a1', name: 'a.txt', size: '1KB', status: 'success' }]} />);
        expect(screen.getByRole('button', { name: ja.Chat.removeAttachment })).toBeInTheDocument();
    });

    it('AIChatDialogue 为代码块复制按钮命名', async () => {
        const chats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
        inJapanese(<AIChatDialogue chats={chats} roleConfig={{ assistant: { name: 'A' } }} />);
        // the message action and the code block share the name
        expect(await screen.findAllByRole('button', { name: ja.AIChatDialogue.copy })).toHaveLength(2);
    });

    it('Sidebar 容器为关闭按钮命名', () => {
        inJapanese(
            <Sidebar.Container title="t" visible>
                content
            </Sidebar.Container>
        );
        expect(screen.getByRole('button', { name: ja.Sidebar.close })).toBeInTheDocument();
    });
});
