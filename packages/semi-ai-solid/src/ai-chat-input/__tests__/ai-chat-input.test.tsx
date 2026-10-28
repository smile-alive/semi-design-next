import { type ComponentProps, type JSX, Show, createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import { type Editor, Extension, Node } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-solid/_utils/semi-global';
import Popover from '@fibrae/semi-ui-solid/popover/index';
import type { UploadHandle, UploadProps } from '@fibrae/semi-ui-solid/upload/index';
import { countLiveListeners } from '@test/utils/solid';
import AIChatInput, { getConfigureItem, type AIChatInputElement, type AIChatInputHandle, type AIChatInputProps, type Attachment, type LeftMenuChangeProps } from '../index';

type Props = AIChatInputProps;
const { Configure } = AIChatInput;
const prefix = 'semi-aiChatInput';

const tick = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
async function setup(props: Partial<Props> & Record<string, unknown> = {}, wrap?: (node: () => JSX.Element) => JSX.Element) {
    const ref: { current: AIChatInputHandle } = { current: undefined as unknown as AIChatInputHandle };
    const [current, setCurrent] = createSignal<Props>(props);
    const node = () => <AIChatInput ref={(handle) => (ref.current = handle)} {...current()} />;
    const result = render(() => (wrap ? wrap(node) : node()));
    await tick();
    const rerender = async (next: Partial<Props>) => {
        setCurrent({ ...props, ...next });
        await tick();
    };
    return { ...result, ref, rerender, editor: () => ref.current.getEditor() as Editor };
}

const el = (parent: ParentNode, selector: string) => parent.querySelector(selector) as HTMLElement;
const root = (container: HTMLElement) => el(container, `.${prefix}`);
const pm = (container: HTMLElement) => el(container, '.ProseMirror');
const sendButton = (container: HTMLElement) => el(container, `.${prefix}-footer-action > .${prefix}-footer-action-button`);
const attachments = (container: HTMLElement) => [...container.querySelectorAll(`.${prefix}-attachment`)];
const references = (container: HTMLElement) => [...container.querySelectorAll(`.${prefix}-reference`)];
const suggestionItems = () => [...document.querySelectorAll(`.${prefix}-suggestion-item`)];
const skillItems = () => [...document.querySelectorAll(`.${prefix}-skill-item`)];
const paragraphs = (container: HTMLElement) => [...pm(container).querySelectorAll('p')].map((p) => p.textContent);

const setContent = (ref: { current: AIChatInputHandle }, content: string) => ref.current.setContent(content);

const keyDown = (container: HTMLElement, key: string, init = {}) => fireEvent.keyDown(pm(container), { key, ...init });

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
        it('渲染编辑器，并在根元素上应用 placeholder、class 与 style', async () => {
            const { container } = await setup({
                placeholder: 'Ask anything',
                class: 'mine',
                style: { width: '300px' },
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
            view.dispatch(view.state.tr.insertText('﻿a', 1));
            vi.useFakeTimers();
            try {
                fireEvent.compositionEnd(pm(container));
                unmount();
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
            setContent(ref, '<p>hello</p><p>world</p>');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'hello\nworld' }]);
        });

        it('上报在编辑器中输入的内容', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { editor } = await setup({ onContentChange });
            editor().commands.insertContent('typed');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'typed' }]);
        });

        it('把编辑器的 focusin、focusout 与 paste 事件传给属性', async () => {
            const onFocus = vi.fn<NonNullable<Props['onFocus']>>();
            const onBlur = vi.fn<NonNullable<Props['onBlur']>>();
            const onPaste = vi.fn<NonNullable<Props['onPaste']>>();
            const { container } = await setup({ onFocus, onBlur, onPaste });
            fireEvent.focusIn(pm(container));
            fireEvent.focusOut(pm(container));
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

            setContent(ref, '<p>hi</p>');
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
            const { container } = await setup({ onMessageSend, uploadProps: { action: '', defaultFileList: files } });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0]).toMatchObject({ attachments: files, inputContents: [] });
        });

        it('默认按 Enter 发送，按 Shift+Enter 换行', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ onMessageSend });
            setContent(ref, '<p>hi</p>');
            keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时交换按键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref } = await setup({ onMessageSend, sendHotKey: 'shift+enter' });
            setContent(ref, '<p>hi</p>');
            keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时，扩展关闭发送快捷键后普通 Enter 交给扩展，不换行', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const onEnter = vi.fn<() => boolean>(() => true);
            const EnterHandler = Extension.create({ name: 'enterHandler', priority: 1000, addKeyboardShortcuts: () => ({ Enter: onEnter }) });
            const { container, ref, editor } = await setup({ onMessageSend, sendHotKey: 'shift+enter', extensions: [EnterHandler] });
            setContent(ref, '<p>hi</p>');
            const storage = editor().storage as unknown as Record<string, { allowHotKeySend: boolean }>;
            storage.SemiAIChatInput.allowHotKeySend = false;
            keyDown(container, 'Enter');
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(paragraphs(container)).toHaveLength(1);
            expect(onMessageSend).not.toHaveBeenCalled();
            storage.SemiAIChatInput.allowHotKeySend = true;
            keyDown(container, 'Enter');
            expect(onEnter).toHaveBeenCalledTimes(1);
            expect(paragraphs(container)).toHaveLength(2);
        });

        it('扩展可通过编辑器 storage 关闭发送快捷键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, editor } = await setup({ onMessageSend });
            setContent(ref, '<p>hi</p>');
            const storage = editor().storage as unknown as Record<string, { allowHotKeySend: boolean }>;
            storage.SemiAIChatInput.allowHotKeySend = false;
            keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('canSend 覆盖内容检查，变化立即生效', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, rerender } = await setup({ onMessageSend, canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await rerender({ canSend: false });
            setContent(ref, '<p>hi</p>');
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
            setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-stop`);
            fireEvent.click(sendButton(container));
            expect(onStopGenerate).toHaveBeenCalledTimes(1);
            keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('开始生成时清空内容与附件', async () => {
            const { container, ref, rerender } = await setup({ uploadProps: { action: '', defaultFileList: files } });
            setContent(ref, '<p>hi</p>');
            await rerender({ generating: true });
            expect(pm(container).textContent).toBe('');
            expect(attachments(container)).toHaveLength(0);
        });

        it('clearContentOnGenerating={false} 时保留内容与附件', async () => {
            const { container, ref, rerender } = await setup({
                uploadProps: { action: '', defaultFileList: files },
                clearContentOnGenerating: false,
            });
            setContent(ref, '<p>hi</p>');
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
                uploadProps: { action: '', defaultFileList: files, onChange, onRemove },
            });
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0].querySelector('img')).toHaveAttribute('src', files[0].url);
            expect(attachments(container)[0]).toHaveTextContent('a.png');
            fireEvent.click(el(container, `.${prefix}-attachment-delete`));
            await tick(0);
            expect(onRemove).toHaveBeenCalledTimes(1);
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(onChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('非图片附件按扩展名显示对应类型的图标', async () => {
            const names = ['a.js', 'a.xlsx', 'a.mp4', 'a.mp3', 'a.pdf', 'a.docx'];
            const { container } = await setup({
                uploadProps: { action: '', defaultFileList: names.map((name, i) => ({ uid: String(i), name, size: '1KB', status: 'success' as const })) },
            });
            const icons = attachments(container).map((node) => el(node, `.${prefix}-attachment-icon`));
            expect(icons.map((icon) => [...icon.classList].find((c) => c.startsWith(`${prefix}-ref-icon-`)))).toEqual(['code', 'excel', 'video', 'audio', 'pdf', 'word'].map((k) => `${prefix}-ref-icon-${k}`));
            ['code', 'excel', 'video', 'music', 'pdf', 'word'].forEach((name, i) => expect(icons[i].querySelector(`.semi-icon-${name}`)).toBeInTheDocument());
        });

        it('uploadProps.disabled 时附件删除按钮不可用', async () => {
            const { container } = await setup({ uploadProps: { action: '', defaultFileList: files, disabled: true } });
            expect(container.querySelector(`.${prefix}-attachment-delete`)).toBeDisabled();
        });

        it('uploadProps.disabled 时默认上传按钮带 aria-disabled 并保持可聚焦，renderUploadButton 的 defaultNode 同样', async () => {
            const { container } = await setup({ uploadProps: { action: '', disabled: true } });
            const button = container.querySelector(`.${prefix}-footer-action-upload`);
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).not.toBeDisabled();
            const custom = await setup({
                uploadProps: { action: '', disabled: true },
                renderUploadButton: ({ defaultNode }) => defaultNode(),
            });
            expect(custom.container.querySelector(`.${prefix}-footer-action-upload`)).toHaveAttribute('aria-disabled', 'true');
            const enabled = await setup();
            expect(enabled.container.querySelector(`.${prefix}-footer-action-upload`)).not.toHaveAttribute('aria-disabled');
        });

        it('添加在上传输入框中选择的文件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container } = await setup({ onUploadChange, uploadProps: { action: '', customRequest: () => {} } });
            const file = new File(['x'], 'b.txt', { type: 'text/plain' });
            fireEvent.change(el(container, 'input[type=file]'), { target: { files: [file] } });
            await tick(0);
            expect(onUploadChange).toHaveBeenCalled();
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0]).toHaveTextContent('b.txt');
        });

        it('不传 uploadProps 时选择文件，仍通知 onUploadChange 并显示附件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container } = await setup({ onUploadChange });
            const file = new File(['x'], 'c.txt', { type: 'text/plain' });
            fireEvent.change(el(container, 'input[type=file]'), { target: { files: [file] } });
            await tick(0);
            expect(onUploadChange).toHaveBeenCalled();
            expect(attachments(container)[0]).toHaveTextContent('c.txt');
        });

        it('按需隐藏上传按钮与附件列表', async () => {
            const { container } = await setup({
                showUploadButton: false,
                showUploadFile: false,
                uploadProps: { action: '', defaultFileList: files },
            });
            expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
            expect(container.querySelector('.semi-upload')).not.toBeVisible();
            expect(attachments(container)).toHaveLength(0);
        });

        it('renderUploadButton 替换 Upload 内的按钮，参数的 getter 读当前值', async () => {
            const renderUploadButton = vi.fn<NonNullable<Props['renderUploadButton']>>((renderProps) => <span class="mine">{renderProps.defaultNode()}</span>);
            const { container, ref } = await setup({ renderUploadButton, uploadProps: { action: '', defaultFileList: files } });
            expect(renderUploadButton).toHaveBeenCalledTimes(1);
            const received = renderUploadButton.mock.calls[0][0];
            expect(received).toMatchObject({ disabled: false, attachments: files, openFileDialog: expect.any(Function) });
            expect(container.querySelector('.semi-upload .mine')).toContainElement(container.querySelector(`.${prefix}-footer-action-upload`));
            ref.current.deleteUploadFile(files[0]);
            await tick(0);
            expect(received.attachments).toEqual([]);
        });

        it('其他属性变化时保留上传按钮与模板内容，不再调用渲染函数', async () => {
            const renderUploadButton = vi.fn<NonNullable<Props['renderUploadButton']>>((renderProps) => renderProps.defaultNode());
            const renderTemplate = vi.fn<NonNullable<Props['renderTemplate']>>(() => <i class="tpl">tpl</i>);
            const { container, ref, rerender } = await setup({ renderUploadButton, renderTemplate });
            ref.current.changeTemplateVisible(true);
            const upload = el(container, `.${prefix}-footer-action-upload`);
            const template = el(document, '.tpl');
            await rerender({ canSend: true });
            expect(el(container, `.${prefix}-footer-action-upload`)).toBe(upload);
            expect(el(document, '.tpl')).toBe(template);
            expect(renderUploadButton).toHaveBeenCalledTimes(1);
            expect(renderTemplate).toHaveBeenCalledTimes(1);
        });

        it('uploadProps 以含 JSX 的字面量传入时 children 只渲染一份，其他属性变化后保留', async () => {
            const [canSend, setCanSend] = createSignal(false);
            const { container } = render(() => (
                <AIChatInput
                    canSend={canSend()}
                    uploadProps={{
                        action: '',
                        children: (
                            <button type="button" class="mine">
                                up
                            </button>
                        ),
                    }}
                />
            ));
            const mine = [...container.querySelectorAll('.semi-upload .mine')];
            expect(mine).toHaveLength(1);
            setCanSend(true);
            await tick();
            expect([...container.querySelectorAll('.semi-upload .mine')]).toEqual(mine);
        });

        it('其他属性变化时不更新编辑器的选项与占位', async () => {
            const { rerender, editor } = await setup({ placeholder: 'Ask anything' });
            const setOptions = vi.spyOn(editor(), 'setOptions');
            const dispatch = vi.spyOn(editor().view, 'dispatch');
            await rerender({ canSend: true });
            expect(setOptions).not.toHaveBeenCalled();
            expect(dispatch).not.toHaveBeenCalled();
        });

        it('uploadTipProps 让 Tooltip 直接包住上传按钮，aria-describedby 落在它上面且只有一个 Tab 停靠点', async () => {
            const { container } = await setup({ uploadTipProps: { content: 'tip', position: 'top' } });
            const action = el(container, `.${prefix}-footer-action`);
            const upload = el(action, '.semi-upload');
            const button = el(action, `.${prefix}-footer-action-upload`);
            expect(upload.parentElement).toBe(action);
            expect(button.tagName).toBe('BUTTON');
            // jsdom never matches :hover, which a hover-opened tooltip checks before it stays open; focus opens it too
            button.focus();
            await waitFor(() => expect(button).toHaveAccessibleDescription('tip'));
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
            fireEvent.click(el(references(container)[1], `.${prefix}-reference-content`));
            expect(onReferenceClick).toHaveBeenCalledWith(refs[1]);
            fireEvent.click(el(references(container)[0], `.${prefix}-reference-delete`));
            expect(onReferenceDelete).toHaveBeenCalledWith(refs[0]);
            expect(onReferenceClick).toHaveBeenCalledTimes(1);
        });

        it('showReference={false} 时隐藏引用，renderReference 替换每一项', async () => {
            const { container, rerender } = await setup({ references: refs, showReference: false });
            expect(references(container)).toHaveLength(0);
            await rerender({ showReference: true, renderReference: (item) => <i>{item.id}</i> });
            expect([...container.querySelectorAll(`.${prefix}-references i`)].map((n) => n.textContent)).toEqual(['r1', 'r2']);
        });

        it('引用项主体是按钮，删除按钮是它的兄弟元素，图片不重复名称', async () => {
            const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
            const image = { id: 'r3', type: 'image', name: 'a.png', url: 'https://semi.design/a.png' };
            const { container } = await setup({ references: [refs[0], image], onReferenceClick });
            const [first, second] = references(container);
            const content = el(first, `.${prefix}-reference-content`);
            const remove = el(first, `.${prefix}-reference-delete`);
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

        it('引用列表增删时保留其余项的 DOM', async () => {
            const { container, rerender } = await setup({ references: refs });
            const second = references(container)[1];
            await rerender({ references: [refs[1]] });
            expect(references(container)).toEqual([second]);
        });
    });

    describe('插槽', () => {
        it.each([
            ['top', ['slot', 'references', 'attachments']],
            ['middle', ['references', 'slot', 'attachments']],
            ['bottom', ['references', 'attachments', 'slot']],
        ] as const)('将 renderTopSlot 放在 %s', async (topSlotPosition, order) => {
            const { container } = await setup({
                topSlotPosition,
                references: refs,
                uploadProps: { action: '', defaultFileList: files },
                renderTopSlot: () => <div class="slot" />,
            });
            const names = [...root(container).children].map((node) => (node.classList.contains('slot') ? 'slot' : node.classList.contains(`${prefix}-references`) ? 'references' : node.querySelector(`.${prefix}-attachment`) ? 'attachments' : null)).filter(Boolean);
            expect(names).toEqual(order);
        });

        it('renderTopSlot 只调用一次，参数的 getter 读当前的引用、附件与内容', async () => {
            const renderTopSlot = vi.fn<NonNullable<Props['renderTopSlot']>>((slot) => <div class="slot">{slot.content.map((item) => item.text).join()}</div>);
            const { container, ref } = await setup({ renderTopSlot, references: refs, uploadProps: { action: '', defaultFileList: files } });
            setContent(ref, '<p>hi</p>');
            expect(renderTopSlot).toHaveBeenCalledTimes(1);
            const [slot] = renderTopSlot.mock.calls[0];
            expect(slot).toMatchObject({ references: refs, attachments: files, content: [{ type: 'text', text: 'hi' }], handleUploadFileDelete: expect.any(Function), handleReferenceDelete: expect.any(Function) });
            expect(container.querySelector('.slot')).toHaveTextContent('hi');
        });

        it('renderActionArea 收到上传与发送节点', async () => {
            const renderActionArea = vi.fn<NonNullable<Props['renderActionArea']>>((area) => <div class={`${area.class} mine`}>{area.menuItem}</div>);
            const { container } = await setup({ renderActionArea });
            expect(renderActionArea.mock.calls[0][0].menuItem).toHaveLength(2);
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
            const button = el(container, `.${prefix}-footer-configure-button`);
            fireEvent.click(button);
            await tick(0);
            expect(onConfigureChange).toHaveBeenCalledWith({ model: 'a', search: true }, { search: true });
            expect(button).toHaveClass(`${prefix}-footer-configure-button-active`);
            setContent(ref, '<p>hi</p>');
            fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0].setup).toEqual({ model: 'a', search: true });
        });

        it('删除 configure 项后移除其字段，并上报剩余的值', async () => {
            const onConfigureChange = vi.fn<NonNullable<Props['onConfigureChange']>>();
            const [withSearch, setWithSearch] = createSignal(true);
            await setup({
                onConfigureChange,
                renderConfigureArea: () => (
                    <>
                        <Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />
                        <Show when={withSearch()}>
                            <Configure.Button field="search" initValue />
                        </Show>
                    </>
                ),
            });
            setWithSearch(false);
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

        it('父组件挂载时就传入建议，面板打开', async () => {
            function Demo() {
                const [suggestions, setSuggestions] = createSignal<string[]>();
                onMount(() => setSuggestions(['first']));
                return <AIChatInput suggestions={suggestions()} />;
            }
            render(() => <Demo />);
            await tick();
            expect(suggestionItems().map((n) => n.textContent)).toEqual(['first']);
        });

        it('收到建议时打开面板，并可用键盘选择', async () => {
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, rerender } = await setup({ onContentChange });
            await rerender({ suggestions: ['first', 'second'] });
            expect(suggestionItems().map((n) => n.textContent)).toEqual(['first', 'second']);
            expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);

            keyDown(container, 'ArrowDown');
            expect(suggestionItems()[1]).toHaveClass(`${prefix}-suggestion-item-active`);
            keyDown(container, 'Enter');
            expect(pm(container).textContent).toBe('second');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'second' }]);
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('内容深度相等的建议数组不会重新打开已关闭的面板', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            keyDown(container, 'Escape');
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
            await rerender({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('选择对象建议时写入其内容，而不是对象本身', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }] });
            fireEvent.click(suggestionItems()[0]);
            expect(pm(container).textContent).toBe('object');
        });

        it('点击选择建议，外部 mousedown 时关闭', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }, 'plain'] });
            expect(suggestionItems().map((n) => n.textContent)).toEqual(['object', 'plain']);
            fireEvent.click(suggestionItems()[1]);
            expect(pm(container).textContent).toBe('plain');
            fireEvent.mouseDown(document.body);
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('点击编辑器重新打开面板，renderSuggestionItem 渲染各项', async () => {
            const renderSuggestionItem: Props['renderSuggestionItem'] = (item) => (
                <button class={item.class} onClick={item.onClick}>
                    {item.suggestion as string}!
                </button>
            );
            const { container, rerender } = await setup({ renderSuggestionItem });
            await rerender({ suggestions: ['first'] });
            fireEvent.mouseDown(document.body);
            await tick();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
            fireEvent.click(pm(container));
            expect(suggestionItems().map((n) => n.tagName + n.textContent)).toEqual(['BUTTONfirst!']);
        });

        it('popoverProps.class 与内部类名合并', async () => {
            const { rerender } = await setup({ popoverProps: { class: 'mine' } });
            await rerender({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toHaveClass('mine');
        });

        it('内容重复的建议项都渲染，不报错', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { rerender } = await setup();
            await rerender({ suggestions: ['same', 'same'] });
            expect(suggestionItems()).toHaveLength(2);
            expect(error).not.toHaveBeenCalled();
        });
    });

    describe('skill 与模板', () => {
        it('用 skillHotKey 打开 skill 面板，按 Enter 插入 skill，并显示模板按钮', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, editor } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            keyDown(container, '/');
            expect(skillItems().map((n) => n.textContent)).toEqual(['Writing', 'Coding']);
            expect(skillItems()[0]).toHaveClass(`${prefix}-skill-item-active`);

            editor().commands.insertContent('/');
            keyDown(container, 'ArrowDown');
            expect(skillItems()[1]).toHaveClass(`${prefix}-skill-item-active`);
            keyDown(container, 'ArrowUp');
            keyDown(container, 'Enter');
            await tick();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(onSkillChange).toHaveBeenCalledTimes(1);
            expect(onSkillChange.mock.calls[0][0]).toBe(skills[0]);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'skillSlot', label: 'Writing', value: 'writing', hasTemplate: true }]);
            expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toHaveTextContent(zh_CN.AIChatInput.template);
        });

        it('renderSkillIcon 在 skill 面板每项的名称前渲染图标', async () => {
            const { container } = await setup({ skills, skillHotKey: '/', renderSkillIcon: (skill) => <i class="skill-icon">{skill.value}</i> });
            keyDown(container, '/');
            expect(skillItems().map((item) => item.firstElementChild?.outerHTML)).toEqual(['<i class="skill-icon">writing</i>', '<i class="skill-icon">coding</i>']);
        });

        it('按 Escape 关闭 skill 面板，点击选择 skill', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const { container } = await setup({ skills, skillHotKey: '/', onSkillChange });
            keyDown(container, '/');
            keyDown(container, 'Escape');
            await tick();
            expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
            keyDown(container, '/');
            fireEvent.click(skillItems()[1]);
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Coding');
            expect(onSkillChange).toHaveBeenCalledWith(skills[1]);
        });

        it('移除 skill 插槽会清空 skill，并仍上报编辑器里剩下的内容', async () => {
            const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
            const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
            const { container, ref } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            keyDown(container, '/');
            keyDown(container, 'Enter');
            setContent(ref, '<p>plain</p>');
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
            const remove = el(container, '.skill-slot-delete');
            expect(remove).toHaveAccessibleName(zh_CN.AIChatInput.removeSkill);
            fireEvent.click(remove);
            expect(pm(container).querySelector('.skill-slot')).toBeNull();
            expect(pm(container)).toHaveTextContent('hello');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
        });

        it('模板按钮打开 renderTemplate，并传入 skill 与内容 setter', async () => {
            const renderTemplate = vi.fn<NonNullable<Props['renderTemplate']>>((skill, onTemplateClick) => (
                <button class="tpl" onClick={() => onTemplateClick('<p>from template</p>')}>
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
            keyDown(container, '/');
            keyDown(container, 'Enter');
            fireEvent.click(el(container, `.${prefix}-footer-configure-button`));
            const template = el(document, `.${prefix}-template`);
            expect(template).toHaveClass('tpl-cls');
            expect(template.style.color).toBe('red');
            expect(template).toHaveTextContent('Writing');
            fireEvent.click(el(document, '.tpl'));
            expect(pm(container).textContent).toBe('from template');
        });

        it('没有 skill 时 showTemplateButton 仍显示按钮', async () => {
            const { container } = await setup({ showTemplateButton: true, renderTemplate: () => 'tpl' });
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toHaveTextContent(zh_CN.AIChatInput.template);
        });

        it('keepSkillAfterSend 在开始生成时保留 skill', async () => {
            const { container, ref, rerender } = await setup({ skills, skillHotKey: '/', keepSkillAfterSend: true });
            keyDown(container, '/');
            keyDown(container, 'Enter');
            (ref.current.getEditor() as Editor).commands.insertContent('more');
            await rerender({ generating: true });
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).not.toContain('more');
        });
    });

    describe('方法', () => {
        it('setContent、getEditor 与 focusEditor', async () => {
            const { container, ref } = await setup();
            setContent(ref, '<p>set</p>');
            expect(pm(container).textContent).toBe('set');
            expect((ref.current.getEditor() as Editor).getText()).toBe('set');
            ref.current.focusEditor();
            await tick();
            expect((ref.current.getEditor() as Editor).state.selection.from).toBe(4);
            ref.current.focusEditor('start');
            await tick();
            expect((ref.current.getEditor() as Editor).state.selection.from).toBe(1);
        });

        it('changeTemplateVisible 切换模板弹层', async () => {
            const { ref } = await setup({ renderTemplate: () => <i class="tpl">tpl</i> });
            ref.current.changeTemplateVisible(true);
            expect(document.querySelector('.tpl')).not.toBeNull();
            ref.current.changeTemplateVisible(false);
            await tick();
            expect(document.querySelector(`.${prefix}-popover-template`)).toBeNull();
        });

        it('deleteContent 按 uniqueKey 删除自定义插槽', async () => {
            const { container, ref } = await setup({ extensions: [ReferSlot] });
            setContent(ref, '<p>a<refer-slot data-unique-key="k1"></refer-slot>b</p>');
            expect(pm(container).querySelector('refer-slot')).not.toBeNull();
            ref.current.deleteContent({ type: 'referSlot', uniqueKey: 'k1' });
            await tick();
            expect(pm(container).querySelector('refer-slot')).toBeNull();
            expect(pm(container).textContent).toBe('ab');
        });

        it('deleteUploadFile 删除一个附件', async () => {
            const onUploadChange = vi.fn<NonNullable<Props['onUploadChange']>>();
            const { container, ref } = await setup({ onUploadChange, uploadProps: { action: '', defaultFileList: files } });
            ref.current.deleteUploadFile(files[0]);
            await tick(0);
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('setContentWhileSaveTool 保留已选的 skill', async () => {
            const { container, ref } = await setup({ skills, skillHotKey: '/' });
            ref.current.setContentWhileSaveTool('kept');
            expect(paragraphs(container)).toEqual(['kept']);
            setContent(ref, '');
            keyDown(container, '/');
            keyDown(container, 'Enter');
            ref.current.setContentWhileSaveTool('with skill');
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).toContain('with skill');
        });

        it('ref 拿到根元素，只交出一次，挂载后其上的 getEditor 即可用', async () => {
            const received = vi.fn<(element: AIChatInputElement) => void>();
            const { container } = render(() => <AIChatInput ref={received} />);
            expect(received).toHaveBeenCalledTimes(1);
            expect(received.mock.calls[0][0]).toBe(container.firstElementChild);
            expect(received.mock.calls[0][0].getEditor()).not.toBeNull();
        });
    });

    describe('生命周期', () => {
        it('卸载时销毁编辑器', async () => {
            const { editor, unmount } = await setup();
            const instance = editor();
            expect(instance.isDestroyed).toBe(false);
            unmount();
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

        it('删除按钮持焦时整体卸载，焦点交接不读已销毁的编辑器', async () => {
            const errors: unknown[] = [];
            const onError = (event: ErrorEvent) => {
                errors.push(event.error);
                event.preventDefault();
            };
            window.addEventListener('error', onError);
            onTestFinished(() => window.removeEventListener('error', onError));
            const { container, unmount } = await setup({ references: refs });
            el(container, `.${prefix}-reference-delete`).focus();
            unmount();
            await tick(0);
            expect(errors).toEqual([]);
        });

        it('卸载时释放插槽视图', async () => {
            const { container, unmount } = await setup({ defaultContent: '<p><select-slot value="Worker" options=\'["Worker","Student"]\'></select-slot><skill-slot data-label="Writing" data-value="writing"></skill-slot></p>' });
            const skillSlot = el(container, '.skill-slot');
            expect(skillSlot).toHaveTextContent('Writing');
            unmount();
            expect(skillSlot.isConnected).toBe(false);
            expect(document.querySelector('.select-slot')).toBeNull();
        });
    });

    describe('修复与新增行为', () => {
        it('把 data-* 等未知属性传给根元素', async () => {
            const { container } = await setup({ 'data-testid': 'chat-input', id: 'input-id' });
            expect(root(container)).toHaveAttribute('data-testid', 'chat-input');
            expect(root(container)).toHaveAttribute('id', 'input-id');
        });

        it('编辑器挂在宿主元素内，只有一个实例', async () => {
            const { container, ref, editor } = await setup();
            expect(container.querySelectorAll('.ProseMirror')).toHaveLength(1);
            expect(editor().isDestroyed).toBe(false);
            expect(editor().view.dom).toBe(pm(container));
            setContent(ref, '<p>once</p>');
            expect(pm(container).textContent).toBe('once');
        });

        it('插槽内容只规范化一次，重复挂载结果相同', async () => {
            const defaultContent = '<p><select-slot value="Worker" options=\'["Worker","Student"]\'></select-slot> writes <input-slot placeholder="object"></input-slot></p>';
            const mount = async () => {
                const onContentChange = vi.fn<NonNullable<Props['onContentChange']>>();
                const { editor, unmount } = await setup({ defaultContent, onContentChange });
                const result = { json: editor().getJSON(), calls: onContentChange.mock.calls };
                unmount();
                return result;
            };
            const first = await mount();
            const second = await mount();
            expect(JSON.stringify(first.json)).toContain('﻿');
            expect(second.json).toEqual(first.json);
            expect(second.calls).toEqual(first.calls);
        });

        it('不把 configure 的 initValue 传给 DOM', async () => {
            const { container } = await setup({
                renderConfigureArea: () => <Configure.Select field="model" initValue="a" optionList={[{ label: 'A', value: 'a' }]} />,
            });
            expect(container.querySelector('[initvalue]')).toBeNull();
            expect(container.querySelector('[field]')).toBeNull();
        });

        it('无论面板重新打开多少次，外部点击监听只注册一个', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { container, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            for (let i = 0; i < 3; i++) {
                fireEvent.click(pm(container));
            }
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
            keyDown(container, 'Escape');
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        });

        it('未设置 onReferenceDelete 时删除引用不报错', async () => {
            const errors: unknown[] = [];
            const onError = (event: ErrorEvent) => {
                errors.push(event.error);
                event.preventDefault();
            };
            window.addEventListener('error', onError);
            try {
                const { container } = await setup({ references: refs });
                fireEvent.click(el(references(container)[0], `.${prefix}-reference-delete`));
            } finally {
                window.removeEventListener('error', onError);
            }
            expect(errors).toEqual([]);
        });

        it('setAllowHotKeySendForSemiAIChatInput 可开启与关闭发送快捷键', async () => {
            const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
            const { container, ref, editor } = await setup({ onMessageSend });
            setContent(ref, '<p>hi</p>');
            // not declared in tiptap's Commands typing; commands bind the current state, so read it per call
            const commands = () =>
                editor().commands as unknown as {
                    setAllowHotKeySendForSemiAIChatInput: (allow: boolean) => void;
                };
            commands().setAllowHotKeySendForSemiAIChatInput(false);
            keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            commands().setAllowHotKeySendForSemiAIChatInput(true);
            keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });
    });

    describe('无障碍', () => {
        const inForm = (onSubmit: () => void) => (node: () => JSX.Element) => (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                {node()}
            </form>
        );

        it('发送与停止按钮不会提交外层表单，名称从语言包读取', async () => {
            const onSubmit = vi.fn<() => void>();
            const { container, ref, rerender } = await setup({}, inForm(onSubmit));
            setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.send);
            fireEvent.click(sendButton(container));
            expect(onSubmit).not.toHaveBeenCalled();
            await rerender({ generating: true });
            expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.stop);
            fireEvent.click(sendButton(container));
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('附件缩略图是装饰图，文件名只由可见文字提供', async () => {
            const { container } = await setup({ uploadProps: { action: '', defaultFileList: files } });
            const card = attachments(container)[0] as HTMLElement;
            expect(within(card).getByText('a.png')).toBeInTheDocument();
            expect(within(card).queryByRole('img', { name: 'a.png' })).toBeNull();
        });

        it('根元素命名时为 group，未命名时无 role，使用方的 role 优先', async () => {
            const unnamed = await setup();
            expect(root(unnamed.container)).not.toHaveAttribute('role');
            unnamed.unmount();
            const labelled = await setup({ 'aria-label': '输入框' });
            expect(within(labelled.container).getByRole('group', { name: '输入框' })).toBe(root(labelled.container));
            const labelledBy = await setup({ 'aria-labelledby': 'ext-label' }, (node) => (
                <>
                    <span id="ext-label">外部标题</span>
                    {node()}
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
            setContent(ref, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        });

        it('默认上传触发器的唯一焦点目标是名为 upload 的 button，名称从语言包读取', async () => {
            const { container } = await setup();
            const trigger = el(container, '.semi-upload-add');
            const button = el(trigger, 'button');
            await tick(0);
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
            fireEvent.click(button);
            expect(button).toHaveAttribute('aria-pressed', 'true');
        });

        it('横向滚动按钮不会提交外层表单', async () => {
            vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(1000);
            vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100);
            // jsdom has no scrollBy
            HTMLElement.prototype.scrollBy = vi.fn<() => void>();
            const onSubmit = vi.fn<() => void>();
            const { container } = await setup({ uploadProps: { action: '', defaultFileList: files } }, inForm(onSubmit));
            const button = el(container, `.${prefix}-scroll-button-right`);
            expect(button).toHaveAttribute('type', 'button');
            expect(button).toHaveAccessibleName(zh_CN.AIChatInput.scrollRight);
            fireEvent.click(button);
            expect(onSubmit).not.toHaveBeenCalled();
            delete (HTMLElement.prototype as Partial<HTMLElement>).scrollBy;
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
        keyDown(container, 'ArrowDown');
        keyDown(container, 'ArrowDown');
        await rerender({ suggestions: ['x'] });
        expect(suggestionItems()[0]).toHaveClass(activeCls);
        keyDown(container, 'Enter');
        expect(pm(container).textContent).toBe('x');
    });

    it('面板关闭后以更短的列表重新打开，高亮回到第一项', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['a', 'b', 'c'] });
        keyDown(container, 'ArrowDown');
        keyDown(container, 'ArrowDown');
        keyDown(container, 'Escape');
        await tick();
        await rerender({ suggestions: ['x', 'y'] });
        expect(suggestionItems()[0]).toHaveClass(activeCls);
    });

    it('首段为空、后续段落有文字时可以发送', async () => {
        const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
        const { container, ref } = await setup({ onMessageSend });
        setContent(ref, '<p></p><p>hi</p>');
        expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        fireEvent.click(sendButton(container));
        expect(onMessageSend).toHaveBeenCalledTimes(1);
    });

    it('键盘触发的 click 与已聚焦控件上的鼠标点击都不把焦点移到编辑器，点击空白处仍聚焦编辑器', async () => {
        const { container } = await setup({ showTemplateButton: true, renderTemplate: () => null });
        const button = el(container, `.${prefix}-footer-configure-button`);
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
        setContent(ref, '<p>a<custom-slot data-unique-key="k1"></custom-slot>b<custom-slot data-unique-key="k2"></custom-slot>c</p>');
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(2);
        ref.current.deleteContent({ type: 'other', uniqueKey: 'k1' });
        ref.current.deleteContent({ type: 'other', uniqueKey: 'k2' });
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(0);
        expect(pm(container).textContent).toBe('abc');
    });

    it('skill 的 value 与 label 含 & 时，选择后的第一次内容变化不再次触发 onSkillChange', async () => {
        const special = [{ value: 'a&b', label: 'Q&A' }];
        const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        keyDown(container, '/');
        keyDown(container, 'Enter');
        editor().commands.insertContent('x');
        expect(onSkillChange).toHaveBeenCalledTimes(1);
        expect(onSkillChange.mock.calls[0][0]).toBe(special[0]);
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Q&A');
    });

    it('skill 的 value 与 label 含双引号时，插槽完整显示', async () => {
        const special = [{ value: 'say "hi"', label: 'He said "hi"' }];
        const onSkillChange = vi.fn<NonNullable<Props['onSkillChange']>>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        keyDown(container, '/');
        keyDown(container, 'Enter');
        editor().commands.insertContent('x');
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('He said "hi"');
        expect(onSkillChange).toHaveBeenCalledTimes(1);
    });

    it('发送后模板按钮回到未按下，再点一次即可打开，setup 不含 template', async () => {
        const onMessageSend = vi.fn<NonNullable<Props['onMessageSend']>>();
        const { container } = await setup({
            skills,
            skillHotKey: '/',
            onMessageSend,
            renderTemplate: () => <i class="tpl">tpl</i>,
        });
        keyDown(container, '/');
        keyDown(container, 'Enter');
        const button = () => el(container, `.${prefix}-footer-configure-button`);
        fireEvent.click(button());
        expect(button()).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();

        fireEvent.click(sendButton(container));
        expect(onMessageSend.mock.calls[0][0].setup).toEqual({});
        expect(button()).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(button());
        expect(button()).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();
    });

    it('通过 ref 关闭模板后按钮回到未按下', async () => {
        const { container, ref } = await setup({ showTemplateButton: true, renderTemplate: () => 'tpl' });
        ref.current.changeTemplateVisible(true);
        const button = container.querySelector(`.${prefix}-footer-configure-button`);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        ref.current.changeTemplateVisible(false);
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

        keyDown(container, 'ArrowDown');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
        expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true']);

        keyDown(container, 'Escape');
        await tick();
        expect(textbox).not.toHaveAttribute('aria-controls');
        expect(textbox).not.toHaveAttribute('aria-activedescendant');
    });

    it('skill 面板是 listbox，活动项经 aria-activedescendant 暴露', async () => {
        const { container, editor } = await setup({ skills, skillHotKey: '/' });
        keyDown(container, '/');
        editor().commands.insertContent('/');
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-controls', listbox.id);
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        keyDown(container, 'ArrowDown');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
    });

    it('renderSuggestionItem 的参数带上 option 角色与 id，aria-selected 随高亮更新', async () => {
        const renderSuggestionItem = vi.fn<NonNullable<Props['renderSuggestionItem']>>((item) => (
            <button class={item.class} id={item.id} role={item.role} aria-selected={item['aria-selected']} onClick={item.onClick} onMouseEnter={item.onMouseEnter}>
                {item.suggestion as string}
            </button>
        ));
        const { container, rerender } = await setup({ renderSuggestionItem });
        await rerender({ suggestions: ['first', 'second'] });
        const options = screen.getAllByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        keyDown(container, 'ArrowDown');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');
        expect(options[1]).toHaveClass(activeCls);
        expect(renderSuggestionItem).toHaveBeenCalledTimes(2);
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

    it('getConfigureItem 用自定义的值与回调名接入 Configure', async () => {
        const Toggle = (props: { checked?: boolean; onToggle?: (checked: boolean) => void }) => (
            <button type="button" aria-pressed={Boolean(props.checked)} onClick={() => props.onToggle?.(!props.checked)}>
                toggle
            </button>
        );
        const ToggleItem = getConfigureItem(Toggle, { valueKey: 'checked', onKeyChangeFnName: 'onToggle' });
        const onConfigureChange = vi.fn<NonNullable<Props['onConfigureChange']>>();
        const { container } = await setup({ onConfigureChange, renderConfigureArea: () => <ToggleItem field="flag" initValue={false} /> });
        const button = within(container).getByRole('button', { name: 'toggle' });
        expect(button).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(onConfigureChange).toHaveBeenLastCalledWith({ flag: true }, { flag: true });
    });
});

describe('AIChatInput Configure.Mcp 计数', () => {
    const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
    ];

    it('传入 num 时显示 num，否则显示 options 数量', () => {
        const [num, setNum] = createSignal<number | undefined>(5);
        render(() => <Configure.Mcp num={num()} options={options} />);
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 5');
        setNum(undefined);
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 2');
    });

    it('renderOptionIcon 为菜单每项渲染图标', () => {
        render(() => <Configure.Mcp trigger="custom" visible motion={false} options={options} renderOptionIcon={(option) => <i class="mcp-icon">{option.value}</i>} />);
        expect([...document.querySelectorAll('.semi-dropdown-item .mcp-icon')].map((node) => node.textContent)).toEqual(['a', 'b']);
    });
});

describe('AIChatInput 输入法、面板与上传', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const pasteFile = (container: HTMLElement, file: File) => fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });

    it('输入法组合中的方向键与 Enter 不切换也不选中建议项', async () => {
        const { container, rerender } = await setup();
        await rerender({ suggestions: ['first', 'second'] });
        keyDown(container, 'ArrowDown', { isComposing: true });
        expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);
        keyDown(container, 'Enter', { isComposing: true });
        expect(pm(container).textContent).toBe('');
        expect(suggestionItems()).toHaveLength(2);
    });

    it('uploadProps.disabled 时粘贴的文件不加入附件，未禁用时加入', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const file = new File(['x'], 'p.txt', { type: 'text/plain' });
        const disabled = await setup({ uploadProps: { action: '', customRequest: () => {}, disabled: true } });
        pasteFile(disabled.container, file);
        await tick(0);
        expect(attachments(disabled.container)).toHaveLength(0);
        disabled.unmount();

        const enabled = await setup({ uploadProps: { action: '', customRequest: () => {} } });
        pasteFile(enabled.container, file);
        await tick(0);
        expect(attachments(enabled.container)).toHaveLength(1);
    });

    it('skill 面板点击外部关闭，popoverProps.onClickOutSide 仍被调用', async () => {
        const onClickOutSide = vi.fn<() => void>();
        const { container } = await setup({ skills, skillHotKey: '/', popoverProps: { onClickOutSide } });
        keyDown(container, '/');
        expect(skillItems()).toHaveLength(2);
        fireEvent.mouseDown(document.body);
        await tick();
        expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
    });

    it('模板面板内已打开的嵌套 Popover 里按下鼠标不关闭面板，body 上按下才关闭', async () => {
        const { ref } = await setup({
            popoverProps: { stopPropagation: false },
            renderTemplate: () => (
                <Popover content={<button type="button">inside nested</button>} trigger="custom" visible>
                    {(getTriggerProps) => (
                        <button {...getTriggerProps()} type="button">
                            nested trigger
                        </button>
                    )}
                </Popover>
            ),
        });
        ref.current.changeTemplateVisible(true);
        await tick();
        fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(document.querySelector(`.${prefix}-popover-template`)).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await tick();
        expect(document.querySelector(`.${prefix}-popover-template`)).toBeNull();
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板，popoverProps.onEscKeyDown 仍被调用', async () => {
        const onEscKeyDown = vi.fn<() => void>();
        const { container } = await setup({ showTemplateButton: true, renderTemplate: () => <i class="tpl">tpl</i>, popoverProps: { onEscKeyDown } });
        const button = el(container, `.${prefix}-footer-configure-button`);
        fireEvent.click(button);
        expect(document.querySelector(`.${prefix}-template`)).not.toBeNull();
        button.focus();
        fireEvent.keyDown(button, { key: 'Escape' });
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

    it('没有 value 或 value 重复的 skill 都渲染，不报错', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await setup({ skills: [{ label: 'A' }, { label: 'B' }, { value: 'x', label: 'C' }, { value: 'x', label: 'D' }], skillHotKey: '/' });
        keyDown(container, '/');
        expect(skillItems()).toHaveLength(4);
        expect(error).not.toHaveBeenCalled();
    });

    it('focusEditor(false) 不聚焦，不传位置时聚焦到末尾', async () => {
        const { container, ref } = await setup();
        ref.current.focusEditor(false);
        await tick(50);
        expect(pm(container)).not.toHaveFocus();
        ref.current.focusEditor();
        await tick(50);
        expect(pm(container)).toHaveFocus();
    });

    it('showUploadButton 为 false 时粘贴的文件照常加入附件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ showUploadButton: false, uploadProps: { action: '', customRequest: () => {} } });
        pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' }));
        await tick(0);
        expect(attachments(container)).toHaveLength(1);
        expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
    });

    it('剪贴板同时含正文文本与文件时只插入文本，不上传文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { action: '', customRequest: () => {} } });
        const getAsFile = vi.fn<() => File>(() => new File(['x'], 'preview.png', { type: 'image/png' }));
        fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => 'cell text', types: ['text/plain', 'Files'] } });
        await tick(0);
        expect(attachments(container)).toHaveLength(0);
        expect(getAsFile).not.toHaveBeenCalled();
    });

    it('剪贴板的文本只有空白时按纯文件处理：上传文件、阻止默认粘贴，每项只取一次文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { action: '', customRequest: () => {} } });
        const file = new File(['x'], 'p.png', { type: 'image/png' });
        const getAsFile = vi.fn<() => File>(() => file);
        const notPrevented = fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => ' \n', types: ['text/plain', 'Files'] } });
        await tick(0);
        expect(notPrevented).toBe(false);
        expect(attachments(container)).toHaveLength(1);
        expect(getAsFile).toHaveBeenCalledTimes(1);
        expect(pm(container).querySelectorAll('p')).toHaveLength(1);
        expect(pm(container).textContent).toBe('');
    });

    it('uploadProps.ref 拿到 Upload 句柄，内部的粘贴上传仍然有效', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        let uploadHandle: UploadHandle | undefined;
        const { container } = await setup({ uploadProps: { action: '', ref: (handle: UploadHandle) => (uploadHandle = handle), customRequest: () => {} } });
        expect(typeof uploadHandle?.openFileDialog).toBe('function');
        pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' }));
        await tick(0);
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
        expect(renderTopSlot.mock.calls[0][0].content).toEqual([{ type: 'text', text: 'plain text' }]);
    });

    it('删除附件、引用与 skill 后焦点交给编辑器，不落到 body', async () => {
        const { container, rerender } = await setup({ references: refs, uploadProps: { action: '', defaultFileList: files }, skills, skillHotKey: '/' });
        const attachmentDelete = el(container, `.${prefix}-attachment-delete`);
        attachmentDelete.focus();
        fireEvent.click(attachmentDelete);
        await tick(0);
        expect(attachments(container)).toHaveLength(0);
        expect(pm(container)).toHaveFocus();

        const referenceDelete = el(container, `.${prefix}-reference-delete`);
        referenceDelete.focus();
        await rerender({ references: [refs[1]] });
        expect(pm(container)).toHaveFocus();

        keyDown(container, '/');
        keyDown(container, 'Enter');
        const skillDelete = el(container, '.skill-slot-delete');
        skillDelete.focus();
        fireEvent.click(skillDelete);
        await tick(50);
        expect(container.querySelector('.skill-slot')).toBeNull();
        expect(pm(container)).toHaveFocus();
    });

    it('附件横向滚动到尽头后，持焦的滚动按钮消失，焦点交给另一侧的按钮', async () => {
        const metrics = [vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500), vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)];
        const scrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(50);
        try {
            const { container } = await setup({ uploadProps: { action: '', defaultFileList: files } });
            const right = el(container, `.${prefix}-scroll-button-right`);
            expect(container.querySelector(`.${prefix}-scroll-button-left`)).not.toBeNull();
            right.focus();
            scrollLeft.mockReturnValue(400);
            fireEvent.scroll(el(container, `.${prefix}-scroll-container`));
            await tick(0);
            expect(container.querySelector(`.${prefix}-scroll-button-right`)).toBeNull();
            expect(container.querySelector(`.${prefix}-scroll-button-left`)).toHaveFocus();
        } finally {
            metrics.forEach((spy) => spy.mockRestore());
            scrollLeft.mockRestore();
        }
    });

    it('上传中的附件显示进度，删除其他附件时保留它的卡片 DOM', async () => {
        const uploading: Attachment = { uid: '2', name: 'b.txt', size: '1KB', status: 'uploading', percent: 10 };
        const { container, ref } = await setup({ uploadProps: { action: '', defaultFileList: [files[0], uploading] } });
        const card = attachments(container)[1];
        expect(card.querySelector(`.${prefix}-attachment-progress`)).toHaveAccessibleName(zh_CN.AIChatInput.uploadProgress);
        ref.current.deleteUploadFile(files[0]);
        await tick(0);
        expect(attachments(container)).toEqual([card]);
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
