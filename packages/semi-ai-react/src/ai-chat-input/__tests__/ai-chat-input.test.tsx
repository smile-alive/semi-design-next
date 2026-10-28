import { createRef, StrictMode, Suspense, type ComponentProps } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Extension, Node } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Popover from '@fibrae/semi-ui-react/popover/index';
import type { UploadProps } from '@fibrae/semi-ui-react/upload/index';
import { countLiveListeners } from '@test/utils/react';
import AIChatInput, { getConfigureItem, type AIChatInputHandle, type AIChatInputProps, type Attachment, type LeftMenuChangeProps } from '../index';

type Props = AIChatInputProps;
const { Configure } = AIChatInput;
const prefix = 'semi-aiChatInput';

// tiptap emits create on a 0ms timer and destroys discarded editors 1ms later
const tick = (ms = 10) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

async function setup(props = {}, wrap = (node) => node) {
    const ref = createRef<AIChatInputHandle>();
    const result = render(wrap(<AIChatInput ref={ref} {...props} />));
    await tick();
    const rerender = async (next) => {
        result.rerender(wrap(<AIChatInput ref={ref} {...props} {...next} />));
        await tick();
    };
    return { ...result, ref, rerender, editor: () => ref.current.getEditor() };
}

const root = (container) => container.querySelector(`.${prefix}`);
const pm = (container) => container.querySelector('.ProseMirror');
const sendButton = (container) => container.querySelector(`.${prefix}-footer-action > .${prefix}-footer-action-button`);
const attachments = (container) => [...container.querySelectorAll(`.${prefix}-attachment`)];
const references = (container) => [...container.querySelectorAll(`.${prefix}-reference`)];
const suggestionItems = () => [...document.querySelectorAll(`.${prefix}-suggestion-item`)];
const skillItems = () => [...document.querySelectorAll(`.${prefix}-skill-item`)];
const paragraphs = (container) => [...pm(container).querySelectorAll('p')].map((p) => p.textContent);

async function setContent(ref, content) {
    await act(async () => ref.current.setContent(content));
}

async function keyDown(container, key, init = {}) {
    await act(async () => {
        fireEvent.keyDown(pm(container), { key, ...init });
    });
}

const files: Attachment[] = [{ uid: '1', name: 'a.png', size: '1KB', status: 'success', url: 'https://semi.design/a.png' }];
const refs = [
    { id: 'r1', type: 'text', content: 'quoted text' },
    { id: 'r2', type: 'file', name: 'doc.docx' },
];
const skills = [
    { value: 'writing', label: 'Writing', hasTemplate: true },
    { value: 'coding', label: 'Coding' },
];

const ReferSlot = Node.create({
    name: 'referSlot',
    inline: true,
    group: 'inline',
    atom: true,
    addAttributes: () => ({
        uniqueKey: {
            default: '',
            parseHTML: (element) => element.getAttribute('data-unique-key'),
            renderHTML: (attributes) => ({ 'data-unique-key': attributes.uniqueKey }),
        },
    }),
    parseHTML: () => [{ tag: 'refer-slot' }],
    renderHTML: ({ HTMLAttributes }) => ['refer-slot', HTMLAttributes],
});

describe('AIChatInput', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('渲染', () => {
        it('渲染编辑器，并在根元素上应用 placeholder、className 与 style', async () => {
            const { container } = await setup({
                placeholder: 'Ask anything',
                className: 'mine',
                style: { width: 300 },
            });
            expect(root(container)).toHaveClass(prefix, 'mine');
            expect(root(container).style.width).toBe('300px');
            expect(container.querySelector(`.${prefix}-editor-content`)).toContainElement(pm(container));
            expect(pm(container).querySelector('p')).toHaveAttribute('data-placeholder', 'Ask anything');
            expect(container.querySelector(`.${prefix}-footer`)).toHaveClass(`${prefix}-footer-round`);
        });

        it('showPlaceholderWhenSkillOnly 时只有 skill 的段落仍显示占位，有文字或其他插槽时不显示', async () => {
            const skill = '<skill-slot data-label="Writing" data-value="writing"></skill-slot>';
            const paragraphOf = async (content: string) => {
                const { container } = await setup({
                    placeholder: 'Ask anything',
                    showPlaceholderWhenSkillOnly: true,
                    defaultContent: `<p>${content}</p>`,
                });
                return pm(container).querySelector('p');
            };
            const skillOnly = await paragraphOf(skill);
            expect(skillOnly).toHaveClass('is-empty', 'is-editor-empty', 'has-skill-slot');
            expect(skillOnly).toHaveAttribute('data-placeholder', 'Ask anything');
            expect(await paragraphOf(`${skill}hi`)).not.toHaveClass('is-empty');
            expect(await paragraphOf(`${skill}<input-slot placeholder="object"></input-slot>`)).not.toHaveClass('is-empty');
        });

        it('showPlaceholderWhenSkillOnly 只在创建编辑器时读取，之后的变化不生效', async () => {
            const skill = '<skill-slot data-label="Writing" data-value="writing"></skill-slot>';
            const { container, rerender } = await setup({ placeholder: 'Ask anything', showPlaceholderWhenSkillOnly: false, defaultContent: `<p>${skill}</p>` });
            expect(pm(container).querySelector('p')).not.toHaveClass('is-empty');
            await rerender({ showPlaceholderWhenSkillOnly: true });
            expect(pm(container).querySelector('p')).not.toHaveClass('is-empty');
        });

        it('输入法上屏后立即卸载，延迟的零宽字符清理不报错', async () => {
            const { container, editor, unmount } = await setup();
            const view = editor().view;
            act(() => {
                view.dispatch(view.state.tr.insertText('﻿a', 1));
            });
            vi.useFakeTimers();
            try {
                fireEvent.compositionEnd(pm(container));
                unmount();
                // tiptap destroys the editor of an unmounted EditorContent on a timer, before the 60ms cleanup runs
                expect(() => vi.advanceTimersByTime(100)).not.toThrow();
                expect(view.isDestroyed).toBe(true);
            } finally {
                vi.useRealTimers();
            }
        });

        it('渲染 defaultContent', async () => {
            const { container } = await setup({ defaultContent: '<p>hello</p><p>world</p>' });
            expect(paragraphs(container)).toEqual(['hello', 'world']);
        });

        it('round={false} 时去掉 round 底部类名', async () => {
            const { container } = await setup({ round: false });
            expect(container.querySelector(`.${prefix}-footer`)).not.toHaveClass(`${prefix}-footer-round`);
        });

        it('从 semiGlobal.config.overrideDefaultProps 读取默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { AIChatInput: { round: false } };
            try {
                const { container } = await setup();
                expect(container.querySelector(`.${prefix}-footer`)).not.toHaveClass(`${prefix}-footer-round`);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });
    });

    describe('内容', () => {
        it('通过 onContentChange 上报转换后的内容', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { ref } = await setup({ onContentChange });
            await setContent(ref, '<p>hello</p><p>world</p>');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'hello\nworld' }]);
        });

        it('上报在编辑器中输入的内容', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { editor } = await setup({ onContentChange });
            await act(async () => editor().commands.insertContent('typed'));
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'typed' }]);
        });

        it('把编辑器的 focus、blur 与 paste 事件传给属性', async () => {
            const onFocus = vi.fn<NonNullable<Props['onFocus']>>();
            const onBlur = vi.fn<NonNullable<Props['onBlur']>>();
            const onPaste = vi.fn<NonNullable<Props['onPaste']>>();
            const { container } = await setup({ onFocus, onBlur, onPaste });
            fireEvent.focus(pm(container));
            fireEvent.blur(pm(container));
            fireEvent.paste(pm(container));
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onPaste).toHaveBeenCalledTimes(1);
        });
    });

    describe('发送', () => {
        it('内容为空时禁用发送按钮，点击后发送内容', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ onMessageSend, references: refs });
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send`, `${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend).not.toHaveBeenCalled();

            await setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledWith({
                references: refs,
                attachments: [],
                inputContents: [{ type: 'text', text: 'hi' }],
                setup: {},
            });
        });

        it('编辑器创建后允许发送 defaultContent', async () => {
            const { container } = await setup({ defaultContent: '<p>hi</p>' });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
        });

        it('无文本时也能发送附件', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container } = await setup({ onMessageSend, uploadProps: { defaultFileList: files } });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0]).toMatchObject({ attachments: files, inputContents: [] });
        });

        it('默认按 Enter 发送，按 Shift+Enter 换行', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ onMessageSend });
            await setContent(ref, '<p>hi</p>');
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时交换按键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ onMessageSend, sendHotKey: 'shift+enter' });
            await setContent(ref, '<p>hi</p>');
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时，扩展关闭发送快捷键后普通 Enter 交给扩展，不换行', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const onEnter = vi.fn<() => boolean>(() => true);
            const EnterHandler = Extension.create({ name: 'enterHandler', priority: 1000, addKeyboardShortcuts: () => ({ Enter: onEnter }) });
            const { container, ref, editor } = await setup({ onMessageSend, sendHotKey: 'shift+enter', extensions: [EnterHandler] });
            await setContent(ref, '<p>hi</p>');
            const storage = editor().storage as unknown as Record<string, { allowHotKeySend: boolean }>;
            storage.SemiAIChatInput.allowHotKeySend = false;
            await keyDown(container, 'Enter');
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(paragraphs(container)).toHaveLength(1);
            expect(onMessageSend).not.toHaveBeenCalled();
            storage.SemiAIChatInput.allowHotKeySend = true;
            await keyDown(container, 'Enter');
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(paragraphs(container)).toHaveLength(2);
        });

        it('扩展可通过编辑器 storage 关闭发送快捷键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, editor } = await setup({ onMessageSend });
            await setContent(ref, '<p>hi</p>');
            const storage = editor().storage as unknown as Record<string, { allowHotKeySend: boolean }>;
            storage.SemiAIChatInput.allowHotKeySend = false;
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('canSend 覆盖内容检查，变化在同一次渲染中生效', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, rerender } = await setup({ onMessageSend, canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await rerender({ canSend: false });
            await setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await rerender({ canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
        });
    });

    describe('生成中', () => {
        it('显示停止按钮，点击后停止且不发送', async () => {
            const onStopGenerate = vi.fn<NonNullable<Props['onStopGenerate']>>();
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ generating: true, onStopGenerate, onMessageSend });
            await setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-stop`);
            fireEvent.click(sendButton(container));
            expect(onStopGenerate).toHaveBeenCalledTimes(1);
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('开始生成时清空内容与附件', async () => {
            const { container, ref, rerender } = await setup({ uploadProps: { defaultFileList: files } });
            await setContent(ref, '<p>hi</p>');
            await rerender({ generating: true });
            expect(pm(container).textContent).toBe('');
            expect(attachments(container)).toHaveLength(0);
        });

        it('clearContentOnGenerating={false} 时保留内容与附件', async () => {
            const { container, ref, rerender } = await setup({
                uploadProps: { defaultFileList: files },
                clearContentOnGenerating: false,
            });
            await setContent(ref, '<p>hi</p>');
            await rerender({ generating: true });
            expect(pm(container).textContent).toBe('hi');
            expect(attachments(container)).toHaveLength(1);
        });
    });

    describe('上传', () => {
        it('渲染默认文件列表，并通过 onUploadChange 删除项', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            const onChange = vi.fn<NonNullable<UploadProps['onChange']>>();
            const onRemove = vi.fn<NonNullable<UploadProps['onRemove']>>();
            const { container } = await setup({
                onUploadChange,
                uploadProps: { defaultFileList: files, onChange, onRemove },
            });
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0].querySelector('img')).toHaveAttribute('src', files[0].url);
            expect(attachments(container)[0]).toHaveTextContent('a.png');
            await act(async () => {
                fireEvent.click(container.querySelector(`.${prefix}-attachment-delete`));
            });
            expect(onRemove).toHaveBeenCalledTimes(1);
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(onChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('uploadProps.disabled 时附件删除按钮不可用', async () => {
            const { container } = await setup({ uploadProps: { defaultFileList: files, disabled: true } });
            expect(container.querySelector(`.${prefix}-attachment-delete`)).toBeDisabled();
        });

        it('uploadProps.disabled 时默认上传按钮带 aria-disabled 并保持可聚焦，renderUploadButton 的 defaultNode 同样', async () => {
            const { container } = await setup({ uploadProps: { disabled: true } });
            const button = container.querySelector(`.${prefix}-footer-action-upload`);
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).not.toBeDisabled();
            const custom = await setup({
                uploadProps: { disabled: true },
                renderUploadButton: ({ defaultNode }) => defaultNode,
            });
            expect(custom.container.querySelector(`.${prefix}-footer-action-upload`)).toHaveAttribute('aria-disabled', 'true');
            const enabled = await setup();
            expect(enabled.container.querySelector(`.${prefix}-footer-action-upload`)).not.toHaveAttribute('aria-disabled');
        });

        it('添加在上传输入框中选择的文件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container } = await setup({ onUploadChange, uploadProps: { customRequest: () => {} } });
            const file = new File(['x'], 'b.txt', { type: 'text/plain' });
            await act(async () => {
                fireEvent.change(container.querySelector('input[type=file]'), { target: { files: [file] } });
            });
            expect(onUploadChange).toHaveBeenCalled();
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0]).toHaveTextContent('b.txt');
        });

        it('不传 uploadProps 时选择文件，仍通知 onUploadChange 并显示附件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container } = await setup({ onUploadChange });
            const file = new File(['x'], 'c.txt', { type: 'text/plain' });
            await act(async () => {
                fireEvent.change(container.querySelector('input[type=file]'), { target: { files: [file] } });
            });
            expect(onUploadChange).toHaveBeenCalled();
            expect(attachments(container)[0]).toHaveTextContent('c.txt');
        });

        it('按需隐藏上传按钮与附件列表', async () => {
            const { container } = await setup({
                showUploadButton: false,
                showUploadFile: false,
                uploadProps: { defaultFileList: files },
            });
            expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
            expect(container.querySelector('.semi-upload')).not.toBeVisible();
            expect(attachments(container)).toHaveLength(0);
        });

        it('renderUploadButton 替换 Upload 内的按钮', async () => {
            const renderUploadButton = vi.fn<NonNullable<Props['renderUploadButton']>>(({ defaultNode }) => <span className="mine">{defaultNode}</span>);
            const { container } = await setup({ renderUploadButton, uploadProps: { defaultFileList: files } });
            expect(renderUploadButton).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: false, attachments: files, openFileDialog: expect.any(Function) }));
            expect(container.querySelector('.semi-upload .mine')).toContainElement(container.querySelector(`.${prefix}-footer-action-upload`));
        });

        it('uploadTipProps 让 Tooltip 直接包住上传按钮，aria-describedby 落在它上面且只有一个 Tab 停靠点', async () => {
            const { container } = await setup({ uploadTipProps: { content: 'tip', position: 'top' } });
            const action = container.querySelector(`.${prefix}-footer-action`);
            const upload = action.querySelector('.semi-upload');
            const button = action.querySelector(`.${prefix}-footer-action-upload`);
            expect(upload.parentElement).toBe(action);
            expect(button.tagName).toBe('BUTTON');
            await act(async () => {
                fireEvent.mouseEnter(button);
            });
            await tick(200);
            expect(button).toHaveAccessibleDescription('tip');
            expect(upload).not.toHaveAttribute('aria-describedby');
            expect([...upload.querySelectorAll('[tabindex="0"], button:not([tabindex="-1"])')]).toEqual([button]);
        });
    });

    describe('引用', () => {
        it('渲染引用，并上报点击与删除', async () => {
            const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
            const onReferenceDelete = vi.fn<NonNullable<Props['onReferenceDelete']>>();
            const { container } = await setup({ references: refs, onReferenceClick, onReferenceDelete });
            expect(references(container).map((n) => n.textContent)).toEqual(['quoted text', 'doc.docx']);
            fireEvent.click(references(container)[1].querySelector(`.${prefix}-reference-content`));
            expect(onReferenceClick).toHaveBeenCalledWith(refs[1]);
            fireEvent.click(references(container)[0].querySelector(`.${prefix}-reference-delete`));
            expect(onReferenceDelete).toHaveBeenCalledWith(refs[0]);
            expect(onReferenceClick).toHaveBeenCalledTimes(1);
        });

        it('showReference={false} 时隐藏引用，renderReference 替换每一项', async () => {
            const { container, rerender } = await setup({ references: refs, showReference: false });
            expect(references(container)).toHaveLength(0);
            await rerender({ showReference: true, renderReference: (item) => <i key={item.id}>{item.id}</i> });
            expect([...container.querySelectorAll(`.${prefix}-references i`)].map((n) => n.textContent)).toEqual(['r1', 'r2']);
        });

        it('renderReference 返回的节点无需自带 key', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { container } = await setup({ references: refs, renderReference: (item) => <i>{item.id}</i> });
            expect(container.querySelectorAll(`.${prefix}-references i`)).toHaveLength(2);
            expect(error).not.toHaveBeenCalled();
            error.mockRestore();
        });

        it('引用项主体是按钮，删除按钮是它的兄弟元素，图片不重复名称', async () => {
            const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
            const image = { id: 'r3', type: 'image', name: 'a.png', url: 'https://semi.design/a.png' };
            const { container } = await setup({ references: [refs[0], image], onReferenceClick });
            const [first, second] = references(container);
            const content = first.querySelector(`.${prefix}-reference-content`);
            const remove = first.querySelector(`.${prefix}-reference-delete`);
            expect(content.tagName).toBe('BUTTON');
            expect(content).toHaveAttribute('type', 'button');
            expect(content).toHaveAccessibleName('quoted text');
            expect(content).not.toContainElement(remove);
            expect(remove.parentElement).toBe(first);
            fireEvent.click(content);
            expect(onReferenceClick).toHaveBeenCalledWith(refs[0]);
            expect(second.querySelector(`.${prefix}-reference-img`)).toHaveAttribute('alt', '');
            expect(second.querySelector(`.${prefix}-reference-content`)).toHaveAccessibleName('a.png');
        });
    });

    describe('插槽', () => {
        it.each([
            ['top', ['slot', 'references', 'attachments']],
            ['middle', ['references', 'slot', 'attachments']],
            ['bottom', ['references', 'attachments', 'slot']],
        ])('将 renderTopSlot 放在 %s', async (topSlotPosition, order) => {
            const { container } = await setup({
                topSlotPosition,
                references: refs,
                uploadProps: { defaultFileList: files },
                renderTopSlot: () => <div className="slot" />,
            });
            const names = [...root(container).children].map((node) => (node.classList.contains('slot') ? 'slot' : node.classList.contains(`${prefix}-references`) ? 'references' : node.querySelector(`.${prefix}-attachment`) ? 'attachments' : null)).filter(Boolean);
            expect(names).toEqual(order);
        });

        it('renderTopSlot 收到引用、附件与当前内容', async () => {
            const renderTopSlot = vi.fn<NonNullable<Props['renderTopSlot']>>(() => null);
            const { ref } = await setup({ renderTopSlot, references: refs, uploadProps: { defaultFileList: files } });
            await setContent(ref, '<p>hi</p>');
            expect(renderTopSlot).toHaveBeenLastCalledWith({
                references: refs,
                attachments: files,
                content: [{ type: 'text', text: 'hi' }],
                handleUploadFileDelete: expect.any(Function),
                handleReferenceDelete: expect.any(Function),
            });
        });

        it('renderActionArea 收到上传与发送节点', async () => {
            const renderActionArea = vi.fn<NonNullable<Props['renderActionArea']>>(({ menuItem, className }) => <div className={`${className} mine`}>{menuItem}</div>);
            const { container } = await setup({ renderActionArea });
            expect(renderActionArea.mock.calls.at(-1)[0].menuItem).toHaveLength(2);
            expect(container.querySelector(`.${prefix}-footer-action.mine .semi-upload`)).not.toBeNull();
            expect(container.querySelector(`.${prefix}-footer-action.mine .${prefix}-footer-action-send`)).not.toBeNull();
        });

        it('renderConfigureArea 的项上报变化，并把值作为 setup 发送', async () => {
            const onConfigureChange = vi.fn<NonNullable<Props['onConfigureChange']>>();
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({
                onConfigureChange,
                onMessageSend,
                renderConfigureArea: () => (
                    <>
                        <Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />
                        <Configure.Button field="search">Search</Configure.Button>
                    </>
                ),
            });
            expect(onConfigureChange).not.toHaveBeenCalled();
            const button = container.querySelector(`.${prefix}-footer-configure-button`);
            fireEvent.click(button);
            await tick(0);
            expect(onConfigureChange).toHaveBeenCalledWith({ model: 'a', search: true }, { search: true });
            expect(button).toHaveClass(`${prefix}-footer-configure-button-active`);
            await setContent(ref, '<p>hi</p>');
            fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0].setup).toEqual({ model: 'a', search: true });
        });

        it('删除 configure 项后移除其字段，并上报剩余的值', async () => {
            const onConfigureChange = vi.fn<NonNullable<Props['onConfigureChange']>>();
            const area = (withSearch) => () => (
                <>
                    <Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />
                    {withSearch && <Configure.Button field="search" initValue />}
                </>
            );
            const { rerender } = await setup({ onConfigureChange, renderConfigureArea: area(true) });
            await rerender({ renderConfigureArea: area(false) });
            expect(onConfigureChange).toHaveBeenLastCalledWith({ model: 'a' }, undefined);
        });
    });

    describe('建议项', () => {
        it('建议弹层不是 dialog', async () => {
            const { rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            expect(suggestionItems()).toHaveLength(1);
            expect(screen.queryByRole('dialog')).toBeNull();
        });

        it('收到建议时打开面板，并可用键盘选择', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, rerender } = await setup({ onContentChange });
            await rerender({ suggestions: ['first', 'second'] });
            expect(suggestionItems().map((n) => n.textContent)).toEqual(['first', 'second']);
            expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);

            await keyDown(container, 'ArrowDown');
            expect(suggestionItems()[1]).toHaveClass(`${prefix}-suggestion-item-active`);
            await keyDown(container, 'Enter');
            expect(pm(container).textContent).toBe('second');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'second' }]);
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('内容深度相等的建议数组不会重新打开已关闭的面板', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            await keyDown(container, 'Escape');
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
            await rerender({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('选择对象建议时写入其内容，而不是对象本身', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }] });
            await act(async () => {
                fireEvent.click(suggestionItems()[0]);
            });
            expect(pm(container).textContent).toBe('object');
        });

        it('点击选择建议，外部 mousedown 时关闭', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }, 'plain'] });
            expect(suggestionItems().map((n) => n.textContent)).toEqual(['object', 'plain']);
            await act(async () => {
                fireEvent.click(suggestionItems()[1]);
            });
            expect(pm(container).textContent).toBe('plain');
            await act(async () => {
                fireEvent.mouseDown(document.body);
            });
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('点击编辑器重新打开面板，renderSuggestionItem 渲染各项', async () => {
            const renderSuggestionItem = ({ suggestion, className, onClick }) => (
                <button key={suggestion} className={className} onClick={onClick}>
                    {suggestion}!
                </button>
            );
            const { container, rerender } = await setup({ renderSuggestionItem });
            await rerender({ suggestions: ['first'] });
            await act(async () => {
                fireEvent.mouseDown(document.body);
            });
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
            await act(async () => {
                fireEvent.click(pm(container));
            });
            expect(suggestionItems().map((n) => n.tagName + n.textContent)).toEqual(['BUTTONfirst!']);
        });

        it('popoverProps.className 与内部类名合并', async () => {
            const { rerender } = await setup({ popoverProps: { className: 'mine' } });
            await rerender({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toHaveClass('mine');
        });

        it('内容重复的建议项不产生重复 key', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { rerender } = await setup();
            await rerender({ suggestions: ['same', 'same'] });
            expect(suggestionItems()).toHaveLength(2);
            expect(error).not.toHaveBeenCalled();
            error.mockRestore();
        });
    });

    describe('skill 与模板', () => {
        it('用 skillHotKey 打开 skill 面板，按 Enter 插入 skill，并显示模板按钮', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, editor } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            expect(skillItems().map((n) => n.textContent)).toEqual(['Writing', 'Coding']);
            expect(skillItems()[0]).toHaveClass(`${prefix}-skill-item-active`);

            await act(async () => editor().commands.insertContent('/'));
            await keyDown(container, 'ArrowDown');
            expect(skillItems()[1]).toHaveClass(`${prefix}-skill-item-active`);
            await keyDown(container, 'ArrowUp');
            await keyDown(container, 'Enter');
            await tick();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(onSkillChange).toHaveBeenCalledTimes(1);
            expect(onSkillChange.mock.calls[0][0]).toBe(skills[0]);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'skillSlot', label: 'Writing', value: 'writing', hasTemplate: true }]);
            expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toHaveTextContent('模板');
        });

        it('按 Escape 关闭 skill 面板，点击选择 skill', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const { container } = await setup({ skills, skillHotKey: '/', onSkillChange });
            await keyDown(container, '/');
            await keyDown(container, 'Escape');
            await tick();
            expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
            await keyDown(container, '/');
            await act(async () => {
                fireEvent.click(skillItems()[1]);
            });
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Coding');
            expect(onSkillChange).toHaveBeenCalledWith(skills[1]);
        });

        it('移除 skill 插槽会清空 skill，并仍上报编辑器里剩下的内容', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, ref } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await setContent(ref, '<p>plain</p>');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'plain' }]);
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toBeNull();
        });

        it('skill 芯片的删除按钮只删除芯片，保留其后的文字', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const { container } = await setup({
                skills,
                onSkillChange,
                defaultContent: '<p><skill-slot data-label="Writing" data-value="writing"></skill-slot>hello</p>',
            });
            await act(async () => {
                fireEvent.click(container.querySelector('.skill-slot-delete'));
            });
            expect(pm(container).querySelector('.skill-slot')).toBeNull();
            expect(pm(container)).toHaveTextContent('hello');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
        });

        it('模板按钮打开 renderTemplate，并传入 skill 与内容 setter', async () => {
            const renderTemplate = vi.fn<NonNullable<Props['renderTemplate']>>((skill, onTemplateClick) => (
                <button className="tpl" onClick={() => onTemplateClick('<p>from template</p>')}>
                    {skill?.label ?? 'none'}
                </button>
            ));
            const { container } = await setup({
                skills,
                skillHotKey: '/',
                renderTemplate,
                templatesCls: 'tpl-cls',
                templatesStyle: { color: 'red' },
            });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await act(async () => {
                fireEvent.click(container.querySelector(`.${prefix}-footer-configure-button`));
            });
            const template = document.querySelector<HTMLElement>(`.${prefix}-template`);
            expect(template).toHaveClass('tpl-cls');
            expect(template.style.color).toBe('red');
            expect(template).toHaveTextContent('Writing');
            await act(async () => {
                fireEvent.click(document.querySelector('.tpl'));
            });
            expect(pm(container).textContent).toBe('from template');
        });

        it('没有 skill 时 showTemplateButton 仍显示按钮', async () => {
            const { container } = await setup({ showTemplateButton: true, renderTemplate: () => 'tpl' });
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toHaveTextContent('模板');
        });

        it('keepSkillAfterSend 在开始生成时保留 skill', async () => {
            const { container, ref, rerender } = await setup({ skills, skillHotKey: '/', keepSkillAfterSend: true });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await act(async () => ref.current.getEditor().commands.insertContent('more'));
            await rerender({ generating: true });
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).not.toContain('more');
        });
    });

    describe('方法', () => {
        it('setContent、getEditor 与 focusEditor', async () => {
            const { container, ref } = await setup();
            await setContent(ref, '<p>set</p>');
            expect(pm(container).textContent).toBe('set');
            expect(ref.current.getEditor().getText()).toBe('set');
            await act(async () => ref.current.focusEditor());
            await tick();
            expect(ref.current.getEditor().state.selection.from).toBe(4);
            await act(async () => ref.current.focusEditor('start'));
            await tick();
            expect(ref.current.getEditor().state.selection.from).toBe(1);
        });

        it('changeTemplateVisible 切换模板弹层', async () => {
            const { ref } = await setup({ renderTemplate: () => <i className="tpl">tpl</i> });
            await act(async () => ref.current.changeTemplateVisible(true));
            expect(document.querySelector('.tpl')).not.toBeNull();
            await act(async () => ref.current.changeTemplateVisible(false));
            await tick();
            expect(document.querySelector(`.${prefix}-popover-template`)).toBeNull();
        });

        it('deleteContent 按 uniqueKey 删除自定义插槽', async () => {
            const { container, ref } = await setup({ extensions: [ReferSlot] });
            await setContent(ref, '<p>a<refer-slot data-unique-key="k1"></refer-slot>b</p>');
            expect(pm(container).querySelector('refer-slot')).not.toBeNull();
            await act(async () => ref.current.deleteContent({ type: 'referSlot', uniqueKey: 'k1' }));
            await tick();
            expect(pm(container).querySelector('refer-slot')).toBeNull();
            expect(pm(container).textContent).toBe('ab');
        });

        it('deleteUploadFile 删除一个附件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            const { container, ref } = await setup({ onUploadChange, uploadProps: { defaultFileList: files } });
            await act(async () => ref.current.deleteUploadFile(files[0]));
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('setContentWhileSaveTool 保留已选的 skill', async () => {
            const { container, ref } = await setup({ skills, skillHotKey: '/' });
            await act(async () => ref.current.setContentWhileSaveTool('kept'));
            expect(paragraphs(container)).toEqual(['kept']);
            await setContent(ref, '');
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await act(async () => ref.current.setContentWhileSaveTool('with skill'));
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).toContain('with skill');
        });
    });

    describe('生命周期', () => {
        it('卸载时销毁编辑器', async () => {
            const { editor, unmount } = await setup();
            const instance = editor();
            expect(instance.isDestroyed).toBe(false);
            unmount();
            await tick();
            expect(instance.isDestroyed).toBe(true);
        });

        it('卸载时移除外部点击监听', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { unmount, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
            unmount();
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        });
    });

    describe('修复与新增行为', () => {
        it('把 data-* 等未知属性传给根元素', async () => {
            const { container } = await setup({ 'data-testid': 'chat-input', id: 'input-id' });
            expect(root(container)).toHaveAttribute('data-testid', 'chat-input');
            expect(root(container)).toHaveAttribute('id', 'input-id');
        });

        it('StrictMode 下保持编辑器实例有效', async () => {
            const { container, ref, editor } = await setup({}, (node) => <StrictMode>{node}</StrictMode>);
            expect(container.querySelectorAll('.ProseMirror')).toHaveLength(1);
            expect(editor().isDestroyed).toBe(false);
            expect(editor().view.dom).toBe(pm(container));
            await setContent(ref, '<p>strict</p>');
            expect(pm(container).textContent).toBe('strict');
        });

        it('插槽内容只规范化一次，StrictMode 下结果相同', async () => {
            const defaultContent = '<p><select-slot value="Worker" options=\'["Worker","Student"]\'></select-slot> writes <input-slot placeholder="object"></input-slot></p>';
            const mount = async (wrap) => {
                const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
                const { editor, unmount } = await setup({ defaultContent, onContentChange }, wrap);
                const result = { json: editor().getJSON(), calls: onContentChange.mock.calls };
                unmount();
                return result;
            };
            const plain = await mount(undefined);
            const strict = await mount((node) => <StrictMode>{node}</StrictMode>);
            expect(JSON.stringify(plain.json)).toContain('﻿');
            expect(strict.json).toEqual(plain.json);
            expect(strict.calls).toEqual(plain.calls);
        });

        it('immediatelyRender={false} 时交接挂载后创建的编辑器', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, ref } = await setup({
                immediatelyRender: false,
                defaultContent: '<p>later</p>',
                onContentChange,
            });
            expect(pm(container).textContent).toBe('later');
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await setContent(ref, '<p>changed</p>');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'changed' }]);
        });

        it('不从未提交的渲染所对应的编辑器更新 state', async () => {
            const error = vi.spyOn(console, 'error');
            let resolve;
            const pending = new Promise((r) => (resolve = r));
            let ready = false;
            function Suspender() {
                if (!ready) {
                    throw pending;
                }
                return null;
            }
            const { container } = render(
                <Suspense fallback="loading">
                    <AIChatInput defaultContent="<p>hi</p>" />
                    <Suspender />
                </Suspense>
            );
            await tick();
            await act(async () => {
                ready = true;
                resolve();
            });
            await tick();
            expect(pm(container).textContent).toBe('hi');
            expect(error.mock.calls.filter(([message]) => String(message).includes('mounted'))).toEqual([]);
        });

        it('不把 configure 的 initValue 传给 DOM', async () => {
            const error = vi.spyOn(console, 'error');
            const { container } = await setup({
                renderConfigureArea: () => <Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />,
            });
            expect(container.querySelector('[initvalue]')).toBeNull();
            expect(error.mock.calls.filter((args) => args.includes('initValue'))).toEqual([]);
        });

        it('无论面板重新打开多少次，外部点击监听只注册一个', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { container, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            for (let i = 0; i < 3; i++) {
                await act(async () => {
                    fireEvent.click(pm(container));
                });
            }
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
            await keyDown(container, 'Escape');
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        });

        it('未设置 onReferenceDelete 时删除引用不报错', async () => {
            const errors = [];
            const onError = (event) => {
                errors.push(event.error);
                event.preventDefault();
            };
            window.addEventListener('error', onError);
            try {
                const { container } = await setup({ references: refs });
                fireEvent.click(references(container)[0].querySelector(`.${prefix}-reference-delete`));
            } finally {
                window.removeEventListener('error', onError);
            }
            expect(errors).toEqual([]);
        });

        it('setAllowHotKeySendForSemiAIChatInput 可开启与关闭发送快捷键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, editor } = await setup({ onMessageSend });
            await setContent(ref, '<p>hi</p>');
            // not declared in tiptap's Commands typing; commands bind the current state, so read it per call
            const commands = () =>
                editor().commands as unknown as {
                    setAllowHotKeySendForSemiAIChatInput: (allow: boolean) => void;
                };
            commands().setAllowHotKeySendForSemiAIChatInput(false);
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            commands().setAllowHotKeySendForSemiAIChatInput(true);
            await keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });
    });

    describe('无障碍', () => {
        const inForm = (onSubmit) => (node) => (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                {node}
            </form>
        );

        it('发送与停止按钮不会提交外层表单，名称从语言包读取', async () => {
            const onSubmit = vi.fn<() => void>();
            const { container, ref, rerender } = await setup({}, inForm(onSubmit));
            await setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.send);
            fireEvent.click(sendButton(container));
            expect(onSubmit).not.toHaveBeenCalled();
            await rerender({ generating: true });
            expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.stop);
            fireEvent.click(sendButton(container));
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('附件缩略图是装饰图，文件名只由可见文字提供', async () => {
            const { container } = await setup({ uploadProps: { defaultFileList: files } });
            const card = attachments(container)[0];
            expect(within(card).getByText('a.png')).toBeInTheDocument();
            expect(within(card).queryByRole('img', { name: 'a.png' })).toBeNull();
        });

        it('根元素命名时为 group，未命名时无 role，使用方的 role 优先', async () => {
            const unnamed = await setup();
            expect(root(unnamed.container)).not.toHaveAttribute('role');
            unnamed.unmount?.();
            const labelled = await setup({ 'aria-label': '输入框' });
            expect(within(labelled.container).getByRole('group', { name: '输入框' })).toBe(root(labelled.container));
            const labelledBy = await setup({ 'aria-labelledby': 'ext-label' }, (node) => (
                <>
                    <span id="ext-label">外部标题</span>
                    {node}
                </>
            ));
            expect(within(labelledBy.container).getByRole('group', { name: '外部标题' })).toBe(root(labelledBy.container));
            const custom = await setup({ 'aria-label': '输入框', role: 'region' });
            expect(root(custom.container)).toHaveAttribute('role', 'region');
        });

        it('无法发送时发送按钮标记 aria-disabled，并保持可聚焦', async () => {
            const { container, ref } = await setup();
            expect(sendButton(container)).toHaveAttribute('aria-disabled', 'true');
            expect(sendButton(container)).not.toBeDisabled();
            await setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        });

        it('默认上传触发器的唯一焦点目标是名为 upload 的 button，名称从语言包读取', async () => {
            const { container } = await setup();
            const trigger = container.querySelector('.semi-upload-add');
            const button = trigger.querySelector('button');
            expect(trigger).not.toHaveAttribute('tabindex');
            expect(trigger).not.toHaveAttribute('role');
            expect(button).toHaveAttribute('type', 'button');
            expect(button).toHaveAccessibleName(zh_CN.AIChatInput.upload);
        });

        it('Configure.Button 的 aria-pressed 随值切换', async () => {
            const { container } = await setup({
                renderConfigureArea: () => <Configure.Button field="search">Search</Configure.Button>,
            });
            const button = within(container).getByRole('button', { name: 'Search' });
            expect(button).toHaveAttribute('aria-pressed', 'false');
            await act(async () => {
                fireEvent.click(button);
            });
            expect(button).toHaveAttribute('aria-pressed', 'true');
        });

        it('横向滚动按钮不会提交外层表单', async () => {
            vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(1000);
            vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100);
            // jsdom has no scrollBy
            HTMLElement.prototype.scrollBy = vi.fn<() => void>();
            const onSubmit = vi.fn<() => void>();
            const { container } = await setup({ uploadProps: { defaultFileList: files } }, inForm(onSubmit));
            const button = container.querySelector(`.${prefix}-scroll-button-right`);
            expect(button).toHaveAttribute('type', 'button');
            fireEvent.click(button);
            expect(onSubmit).not.toHaveBeenCalled();
            delete HTMLElement.prototype.scrollBy;
        });
    });
});

const CustomSlot = Node.create({
    name: 'customSlot',
    inline: true,
    group: 'inline',
    atom: true,
    addAttributes: () => ({
        uniqueKey: {
            default: '',
            parseHTML: (element) => element.getAttribute('data-unique-key'),
            renderHTML: (attributes) => ({ 'data-unique-key': attributes.uniqueKey }),
        },
    }),
    parseHTML: () => [{ tag: 'custom-slot' }],
    renderHTML: ({ HTMLAttributes }) => ['custom-slot', HTMLAttributes],
});
const customSlotExtensions = [CustomSlot];

describe('AIChatInput 代码审计修复', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const activeCls = `${prefix}-suggestion-item-active`;

    it('建议列表变短后高亮回到第一项，Enter 写入该项', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['a', 'b', 'c'] });
        await keyDown(container, 'ArrowDown');
        await keyDown(container, 'ArrowDown');
        await rerender({ suggestions: ['x'] });
        expect(suggestionItems()[0]).toHaveClass(activeCls);
        await keyDown(container, 'Enter');
        expect(pm(container).textContent).toBe('x');
    });

    it('面板关闭后以更短的列表重新打开，高亮回到第一项', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['a', 'b', 'c'] });
        await keyDown(container, 'ArrowDown');
        await keyDown(container, 'ArrowDown');
        await keyDown(container, 'Escape');
        await tick();
        await rerender({ suggestions: ['x', 'y'] });
        expect(suggestionItems()[0]).toHaveClass(activeCls);
    });

    it('首段为空、后续段落有文字时可以发送', async () => {
        const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
        const { container, ref } = await setup({ onMessageSend });
        await setContent(ref, '<p></p><p>hi</p>');
        expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        fireEvent.click(sendButton(container));
        expect(onMessageSend).toHaveBeenCalledTimes(1);
    });

    it('键盘触发的 click 与已聚焦控件上的鼠标点击都不把焦点移到编辑器，点击空白处仍聚焦编辑器', async () => {
        const { container } = await setup({ showTemplateButton: true, renderTemplate: () => null });
        const button = container.querySelector<HTMLElement>(`.${prefix}-footer-configure-button`);
        button.focus();
        // fireEvent.click carries detail 0, like a click synthesized from Enter or Space
        fireEvent.click(button);
        await tick(50);
        expect(button).toHaveFocus();
        // a mouse press has already focused the control, whose open list needs the keyboard
        fireEvent.click(button, { detail: 1 });
        await tick(50);
        expect(button).toHaveFocus();
        // a press on the blank area focuses the (tabindex -1) root itself
        root(container).focus();
        fireEvent.click(root(container), { detail: 1 });
        await tick(50);
        expect(pm(container)).toHaveFocus();
        // a mouse press on the send button (which stays mounted) leaves typing where it was
        sendButton(container).focus();
        fireEvent.click(sendButton(container), { detail: 1 });
        await tick(50);
        expect(pm(container)).toHaveFocus();
    });

    it('deleteContent 只按 uniqueKey 匹配，节点名不限，可同步连续删除', async () => {
        const { container, ref } = await setup({ extensions: customSlotExtensions });
        await setContent(ref, '<p>a<custom-slot data-unique-key="k1"></custom-slot>b<custom-slot data-unique-key="k2"></custom-slot>c</p>');
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(2);
        await act(async () => {
            ref.current.deleteContent({ type: 'other', uniqueKey: 'k1' });
            ref.current.deleteContent({ type: 'other', uniqueKey: 'k2' });
        });
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(0);
        expect(pm(container).textContent).toBe('abc');
    });

    it('skill 的 value 与 label 含 & 时，选择后的第一次内容变化不再次触发 onSkillChange', async () => {
        const special = [{ value: 'a&b', label: 'Q&A' }];
        const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        await act(async () => editor().commands.insertContent('x'));
        expect(onSkillChange).toHaveBeenCalledTimes(1);
        expect(onSkillChange.mock.calls[0][0]).toBe(special[0]);
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Q&A');
    });

    it('skill 的 value 与 label 含双引号时，插槽完整显示', async () => {
        const special = [{ value: 'say "hi"', label: 'He said "hi"' }];
        const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        await act(async () => editor().commands.insertContent('x'));
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('He said "hi"');
        expect(onSkillChange).toHaveBeenCalledTimes(1);
    });

    it('发送后模板按钮回到未按下，再点一次即可打开，setup 不含 template', async () => {
        const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
        const { container } = await setup({
            skills,
            skillHotKey: '/',
            onMessageSend,
            renderTemplate: () => <i className="tpl">tpl</i>,
        });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        const button = () => container.querySelector(`.${prefix}-footer-configure-button`);
        await act(async () => {
            fireEvent.click(button());
        });
        expect(button()).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();

        fireEvent.click(sendButton(container));
        expect(onMessageSend.mock.calls[0][0].setup).toEqual({});
        expect(button()).toHaveAttribute('aria-pressed', 'false');
        await act(async () => {
            fireEvent.click(button());
        });
        expect(button()).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();
    });

    it('通过 ref 关闭模板后按钮回到未按下', async () => {
        const { container, ref } = await setup({ showTemplateButton: true, renderTemplate: () => 'tpl' });
        await act(async () => ref.current.changeTemplateVisible(true));
        const button = container.querySelector(`.${prefix}-footer-configure-button`);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        await act(async () => ref.current.changeTemplateVisible(false));
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).not.toHaveClass(`${prefix}-footer-configure-button-active`);
    });

    it('建议面板是 listbox，活动项经 aria-activedescendant 暴露', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['first', 'second'] });
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(listbox).toHaveAccessibleName(zh_CN.AIChatInput.input);
        expect(textbox).toHaveAttribute('aria-autocomplete', 'list');
        expect(textbox).toHaveAttribute('aria-controls', listbox.id);
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['true', 'false']);

        await keyDown(container, 'ArrowDown');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
        expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true']);

        await keyDown(container, 'Escape');
        await tick();
        expect(textbox).not.toHaveAttribute('aria-controls');
        expect(textbox).not.toHaveAttribute('aria-activedescendant');
    });

    it('skill 面板是 listbox，活动项经 aria-activedescendant 暴露', async () => {
        const { container, editor } = await setup({ skills, skillHotKey: '/' });
        await keyDown(container, '/');
        await act(async () => editor().commands.insertContent('/'));
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-controls', listbox.id);
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        await keyDown(container, 'ArrowDown');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
    });

    it('renderSuggestionItem 的参数带上 option 角色与 id', async () => {
        const renderSuggestionItem = vi.fn<NonNullable<Props['renderSuggestionItem']>>(({ suggestion, className, onClick, ...aria }) => (
            <button key={suggestion as string} className={className} onClick={onClick} {...aria}>
                {suggestion as string}
            </button>
        ));
        const { rerender } = await setup({ renderSuggestionItem });
        await rerender({ suggestions: ['first'] });
        const option = screen.getByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-activedescendant', option.id);
        expect(option).toHaveAttribute('aria-selected', 'true');
    });

    it('placeholder 变化后可见占位与 aria-placeholder 同步，编辑器实例不变', async () => {
        const { container, rerender, editor } = await setup({ placeholder: 'one' });
        const instance = editor();
        expect(container.querySelector('p[data-placeholder]')).toHaveAttribute('data-placeholder', 'one');
        await rerender({ placeholder: 'two' });
        expect(container.querySelector('p[data-placeholder]')).toHaveAttribute('data-placeholder', 'two');
        expect(pm(container)).toHaveAttribute('aria-placeholder', 'two');
        expect(editor()).toBe(instance);
    });
});

describe('AIChatInput Tab 焦点', () => {
    it('容器不是 Tab 焦点，textbox 才是', async () => {
        const { container } = await setup();
        expect(root(container)).toHaveAttribute('tabindex', '-1');
        expect(pm(container)).toHaveAttribute('contenteditable', 'true');
    });
});

describe('AIChatInput Configure 类型', () => {
    it('类型：子项要求 field，并按被包装组件检查属性', () => {
        type SelectItemProps = ComponentProps<typeof Configure.Select>;
        expectTypeOf<{ field: string; optionList: { label: string; value: string }[] }>().toExtend<SelectItemProps>();
        expectTypeOf<{ optionList: { label: string; value: string }[] }>().not.toExtend<SelectItemProps>();
        expectTypeOf<{ field: string; optionList: string }>().not.toExtend<SelectItemProps>();

        type ButtonItemProps = ComponentProps<typeof Configure.Button>;
        expectTypeOf<ButtonItemProps['initValue']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<Parameters<NonNullable<ButtonItemProps['onClick']>>[0]>().toEqualTypeOf<boolean>();

        type RadioItemProps = ComponentProps<typeof Configure.RadioButton>;
        expectTypeOf<{ field: string; options: string[] }>().toExtend<RadioItemProps>();
        expectTypeOf<{ field: string; options: number }>().not.toExtend<RadioItemProps>();
    });

    it('类型：getConfigureItem 按 valueKey 推导 initValue，并保留被包装组件的必填属性', () => {
        const Toggle = (props: { checked?: boolean; onToggle?: (checked: boolean) => void; size: number }) => <span>{`${props.checked} ${props.size}`}</span>;
        const ToggleItem = getConfigureItem(Toggle, { valueKey: 'checked', onKeyChangeFnName: 'onToggle' });
        type ToggleItemProps = ComponentProps<typeof ToggleItem>;
        expectTypeOf<ToggleItemProps['initValue']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<{ field: string; size: number }>().toExtend<ToggleItemProps>();
        expectTypeOf<{ field: string }>().not.toExtend<ToggleItemProps>();
        expectTypeOf<ToggleItemProps>().not.toHaveProperty('onToggle');
    });

    it('类型：onConfigureChange 的 changedValue 可为 undefined（移除配置项时）', () => {
        type ChangedValue = Parameters<NonNullable<Props['onConfigureChange']>>[1];
        expectTypeOf<undefined>().toExtend<ChangedValue>();
        expectTypeOf<LeftMenuChangeProps>().toExtend<ChangedValue>();
    });

    it('类型：不声明从未触发的 onSuggestClick 与 onTemplateVisibleChange', () => {
        expectTypeOf<Props>().not.toHaveProperty('onSuggestClick');
        expectTypeOf<Props>().not.toHaveProperty('onTemplateVisibleChange');
    });

    it('类型：Configure.Mcp 只传 options 即可，showConfigure 与 onConfigureButtonClick 可省略', () => {
        type McpProps = ComponentProps<typeof Configure.Mcp>;
        expectTypeOf<{ options: { value: string; label: string }[] }>().toExtend<McpProps>();
    });
});

describe('AIChatInput Configure.Mcp 计数', () => {
    const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
    ];

    it('传入 num 时显示 num，否则显示 options 数量', () => {
        const { rerender } = render(<Configure.Mcp num={5} options={options} />);
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 5');
        rerender(<Configure.Mcp options={options} />);
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 2');
    });
});

describe('AIChatInput 输入法、面板与上传', () => {
    const pasteFile = (container, file: File) => fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });

    it('输入法组合中的方向键与 Enter 不切换也不选中建议项', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['first', 'second'] });
        await keyDown(container, 'ArrowDown', { isComposing: true });
        expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);
        await keyDown(container, 'Enter', { isComposing: true });
        expect(pm(container).textContent).toBe('');
        expect(suggestionItems()).toHaveLength(2);
    });

    it('uploadProps.disabled 时粘贴的文件不加入附件，未禁用时加入', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const file = new File(['x'], 'p.txt', { type: 'text/plain' });
        const disabled = await setup({ uploadProps: { customRequest: () => {}, disabled: true } });
        await act(async () => pasteFile(disabled.container, file));
        expect(attachments(disabled.container)).toHaveLength(0);
        disabled.unmount();

        const enabled = await setup({ uploadProps: { customRequest: () => {} } });
        await act(async () => pasteFile(enabled.container, file));
        expect(attachments(enabled.container)).toHaveLength(1);
    });

    it('skill 面板点击外部关闭，popoverProps.onClickOutSide 仍被调用', async () => {
        const onClickOutSide = vi.fn<() => void>();
        const { container } = await setup({ skills, skillHotKey: '/', popoverProps: { onClickOutSide } });
        await keyDown(container, '/');
        expect(skillItems()).toHaveLength(2);
        await act(async () => {
            fireEvent.mouseDown(document.body);
        });
        await tick();
        expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
    });

    it('模板面板内已打开的嵌套 Popover 里按下鼠标不关闭面板，body 上按下才关闭', async () => {
        const { ref } = await setup({
            popoverProps: { stopPropagation: false },
            renderTemplate: () => (
                <Popover content={<button type="button">inside nested</button>} trigger="custom" visible>
                    <button type="button">nested trigger</button>
                </Popover>
            ),
        });
        await act(async () => ref.current.changeTemplateVisible(true));
        await tick();
        await act(async () => {
            fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        });
        expect(document.querySelector(`.${prefix}-popover-template`)).not.toBeNull();
        await act(async () => {
            fireEvent.mouseDown(document.body);
        });
        await tick();
        expect(document.querySelector(`.${prefix}-popover-template`)).toBeNull();
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板，popoverProps.onEscKeyDown 仍被调用', async () => {
        const onEscKeyDown = vi.fn<() => void>();
        const { container } = await setup({ showTemplateButton: true, renderTemplate: () => <i className="tpl">tpl</i>, popoverProps: { onEscKeyDown } });
        const button = container.querySelector<HTMLElement>(`.${prefix}-footer-configure-button`);
        await act(async () => {
            fireEvent.click(button);
        });
        expect(document.querySelector(`.${prefix}-template`)).not.toBeNull();
        button.focus();
        await act(async () => {
            fireEvent.keyDown(button, { key: 'Escape' });
        });
        await tick();
        expect(document.querySelector(`.${prefix}-template`)).toBeNull();
        expect(onEscKeyDown).toHaveBeenCalledTimes(1);
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('建议面板打开时 suggestions 变为 undefined 不抛错', async () => {
        const { rerender } = await setup({ suggestions: ['a'] });
        await rerender({ suggestions: ['a', 'b'] });
        expect(suggestionItems()).toHaveLength(2);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        await rerender({ suggestions: undefined });
        expect(suggestionItems()).toHaveLength(0);
        expect(error).not.toHaveBeenCalled();
    });

    it('没有 value 或 value 重复的 skill 不产生 key 警告', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await setup({ skills: [{ label: 'A' }, { label: 'B' }, { value: 'x', label: 'C' }, { value: 'x', label: 'D' }], skillHotKey: '/' });
        await keyDown(container, '/');
        expect(skillItems()).toHaveLength(4);
        expect(error).not.toHaveBeenCalled();
    });

    it('focusEditor(false) 不聚焦，不传位置时聚焦到末尾', async () => {
        const { container, ref } = await setup();
        await act(async () => ref.current.focusEditor(false));
        await tick(50);
        expect(pm(container)).not.toHaveFocus();
        await act(async () => ref.current.focusEditor());
        await tick(50);
        expect(pm(container)).toHaveFocus();
    });

    it('showUploadButton 为 false 时粘贴的文件照常加入附件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ showUploadButton: false, uploadProps: { customRequest: () => {} } });
        await act(async () => pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' })));
        expect(attachments(container)).toHaveLength(1);
        expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
    });

    it('剪贴板同时含正文文本与文件时只插入文本，不上传文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const getAsFile = vi.fn<() => File>(() => new File(['x'], 'preview.png', { type: 'image/png' }));
        await act(async () => {
            fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => 'cell text', types: ['text/plain', 'Files'] } });
        });
        expect(attachments(container)).toHaveLength(0);
        expect(getAsFile).not.toHaveBeenCalled();
    });

    it('剪贴板的文本只有空白时按纯文件处理：上传文件、阻止默认粘贴，每项只取一次文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const file = new File(['x'], 'p.png', { type: 'image/png' });
        const getAsFile = vi.fn<() => File>(() => file);
        let notPrevented = true;
        await act(async () => {
            notPrevented = fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => ' \n', types: ['text/plain', 'Files'] } });
        });
        expect(notPrevented).toBe(false);
        expect(attachments(container)).toHaveLength(1);
        expect(getAsFile).toHaveBeenCalledTimes(1);
        expect(pm(container).querySelectorAll('p')).toHaveLength(1);
        expect(pm(container).textContent).toBe('');
    });

    it('uploadProps.ref 拿到 Upload 句柄，内部的粘贴上传仍然有效', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const uploadRef = createRef<any>();
        const { container } = await setup({ uploadProps: { ref: uploadRef, customRequest: () => {} } });
        expect(typeof uploadRef.current.openFileDialog).toBe('function');
        await act(async () => pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' })));
        expect(attachments(container)).toHaveLength(1);
    });

    it('根元素的 onClick、onMouseDown 与内部处理一起生效', async () => {
        const onClick = vi.fn<() => void>();
        const onMouseDown = vi.fn<() => void>();
        const { container } = await setup({ onClick, onMouseDown });
        root(container).focus();
        fireEvent.mouseDown(root(container));
        fireEvent.click(root(container), { detail: 1 });
        await tick(50);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(pm(container)).toHaveFocus();
    });

    it('defaultContent 规范化不产生事务时 renderTopSlot 的 content 仍有初始内容', async () => {
        const renderTopSlot = vi.fn<NonNullable<Props['renderTopSlot']>>(() => null);
        await setup({ defaultContent: 'plain text', renderTopSlot });
        expect(renderTopSlot).toHaveBeenLastCalledWith(expect.objectContaining({ content: [{ type: 'text', text: 'plain text' }] }));
    });

    it('删除附件、引用与 skill 后焦点交给编辑器，不落到 body', async () => {
        const { container, rerender } = await setup({ references: refs, uploadProps: { defaultFileList: files }, skills, skillHotKey: '/' });
        const attachmentDelete = container.querySelector<HTMLElement>(`.${prefix}-attachment-delete`);
        attachmentDelete.focus();
        await act(async () => {
            fireEvent.click(attachmentDelete);
        });
        expect(attachments(container)).toHaveLength(0);
        expect(pm(container)).toHaveFocus();

        const referenceDelete = container.querySelector<HTMLElement>(`.${prefix}-reference-delete`);
        referenceDelete.focus();
        await rerender({ references: [refs[1]] });
        expect(pm(container)).toHaveFocus();

        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        const skillDelete = container.querySelector<HTMLElement>('.skill-slot-delete');
        skillDelete.focus();
        await act(async () => {
            fireEvent.click(skillDelete);
        });
        await tick(50);
        expect(container.querySelector('.skill-slot')).toBeNull();
        expect(pm(container)).toHaveFocus();
    });

    it('附件横向滚动到尽头后，持焦的滚动按钮消失，焦点交给另一侧的按钮', async () => {
        const metrics = [vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500), vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)];
        const scrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(50);
        try {
            const { container } = await setup({ uploadProps: { defaultFileList: files } });
            const right = container.querySelector<HTMLElement>(`.${prefix}-scroll-button-right`);
            expect(container.querySelector(`.${prefix}-scroll-button-left`)).not.toBeNull();
            right.focus();
            scrollLeft.mockReturnValue(400);
            await act(async () => {
                fireEvent.scroll(container.querySelector(`.${prefix}-scroll-container`));
            });
            expect(container.querySelector(`.${prefix}-scroll-button-right`)).toBeNull();
            expect(container.querySelector(`.${prefix}-scroll-button-left`)).toHaveFocus();
        } finally {
            metrics.forEach((spy) => spy.mockRestore());
            scrollLeft.mockRestore();
        }
    });

    it('类型：uploadProps 不接受 fileList 与 listType', () => {
        type UploadOptions = NonNullable<Props['uploadProps']>;
        expectTypeOf<UploadOptions>().not.toHaveProperty('fileList');
        expectTypeOf<UploadOptions>().not.toHaveProperty('listType');
        expectTypeOf<UploadOptions>().toHaveProperty('defaultFileList');
        expectTypeOf<UploadOptions>().toHaveProperty('action');
    });

    it('类型：移除 skill 时 onSkillChange 与 renderTemplate 收到 undefined，getEditor 可为 null', () => {
        expectTypeOf<undefined>().toExtend<Parameters<NonNullable<Props['onSkillChange']>>[0]>();
        expectTypeOf<undefined>().toExtend<Parameters<NonNullable<Props['renderTemplate']>>[0]>();
        expectTypeOf<null>().toExtend<ReturnType<AIChatInputHandle['getEditor']>>();
    });

    it('类型：getConfigureItem 用其他回调名时不再接受被包装组件自己的 onChange', () => {
        const Toggle = (props: { checked?: boolean; onToggle?: (checked: boolean) => void; onChange?: (event: Event) => void }) => <span>{String(props.checked)}</span>;
        const ToggleItem = getConfigureItem(Toggle, { valueKey: 'checked', onKeyChangeFnName: 'onToggle' });
        expectTypeOf<ComponentProps<typeof ToggleItem>['onChange']>().toEqualTypeOf<((value: unknown) => void) | undefined>();
    });
});

describe('AIChatInput 可访问名称', () => {
    it('编辑器名称从语言包读取，并暴露字符串 placeholder', async () => {
        await setup({ placeholder: 'Ask anything' });
        const editor = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(editor).toHaveAttribute('aria-placeholder', 'Ask anything');
    });
});
