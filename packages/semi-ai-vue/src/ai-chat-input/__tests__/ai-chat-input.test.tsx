/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowRef, toRaw, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { Extension, Node, type Editor } from '@tiptap/core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import type { Attachment } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { SemiGlobal, semiGlobalKey } from '@fibrae/semi-ui-vue/_utils/semi-global';
import Popover from '@fibrae/semi-ui-vue/popover/index';
import { countLiveListeners, endLeaveAnimations, render } from '@test/utils/vue';
import AIChatInput, { getConfigureItem, type AIChatInputActionAreaSlotProps, type AIChatInputHandle, type AIChatInputSuggestionItemSlotProps, type AIChatInputTemplateSlotProps, type AIChatInputTopSlotProps, type AIChatInputUploadButtonSlotProps } from '../index';
import InputHost from './fixtures/input-host.vue';
import KeepAliveHost from './fixtures/keep-alive-host.vue';

const { Configure } = AIChatInput;
const prefix = 'semi-aiChatInput';

type Slot = (scope: any) => VNode | VNode[] | string;

// The editor is created on mount and its node views a tick later; tiptap also emits create on a 0ms timer
const settle = async (ms = 10) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await nextTick();
};

async function setup(props: Record<string, unknown> = {}, slots: Record<string, Slot> = {}, options: { container?: HTMLElement; global?: Record<string, unknown> } = {}) {
    let handle: AIChatInputHandle | undefined;
    const view = render(InputHost, {
        props: { ...props, onReady: (ready: AIChatInputHandle) => (handle = ready) },
        slots,
        ...options,
    });
    await settle();
    const current = () => handle as AIChatInputHandle;
    return {
        ...view,
        handle: current,
        editor: () => current().getEditor() as Editor,
        unmount: () => view.unmount(),
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender(next);
            await settle();
        },
    };
}

const query = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => {
    const found = root.querySelector<T>(selector);
    if (!found) {
        throw new Error(`missing ${selector}`);
    }
    return found;
};
const root = (container: Element) => query(`.${prefix}`, container);
const pm = (container: Element) => query('.ProseMirror', container);
const sendButton = (container: Element) => query(`.${prefix}-footer-action > .${prefix}-footer-action-button`, container);
const attachments = (container: Element) => [...container.querySelectorAll(`.${prefix}-attachment`)];
const references = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefix}-reference`)];
const suggestionItems = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-suggestion-item`)];
const skillItems = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-skill-item`)];
const paragraphs = (container: Element) => [...pm(container).querySelectorAll('p')].map((p) => p.textContent);
const templateButton = (container: Element) => query(`.${prefix}-footer-configure-button`, container);

async function setContent(handle: () => AIChatInputHandle, content: string) {
    handle().setContent(content);
    await nextTick();
}

async function keyDown(container: Element, key: string, init: Record<string, unknown> = {}) {
    await fireEvent.keyDown(pm(container), { key, ...init });
}

async function waitForClosed(selector: string) {
    await waitFor(() => {
        endLeaveAnimations();
        expect(document.querySelector(selector)).toBeNull();
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
const modelOptions = [{ label: 'A', value: 'a' }];

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
            expect(query(`.${prefix}-editor-content`, container)).toContainElement(pm(container));
            expect(pm(container).querySelector('p')).toHaveAttribute('data-placeholder', 'Ask anything');
            expect(query(`.${prefix}-footer`, container)).toHaveClass(`${prefix}-footer-round`);
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

        it('输入法上屏后立即卸载，延迟的零宽字符清理不报错', async () => {
            const { container, editor, unmount } = await setup();
            const view = editor().view;
            view.dispatch(view.state.tr.insertText('﻿a', 1));
            vi.useFakeTimers();
            try {
                await fireEvent.compositionEnd(pm(container));
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

        it('select-slot 渲染为带选项的 Select，选择后写回节点属性', async () => {
            const options = JSON.stringify(['a', 'b']).replaceAll('"', '&quot;');
            const { container, editor } = await setup({
                defaultContent: `<p><select-slot value="a" options="${options}"></select-slot></p>`,
            });
            const combobox = query('.node-selectSlot [role="combobox"]', container);
            expect(combobox).toHaveTextContent('a');
            await fireEvent.click(combobox);
            const listbox = query(`#${combobox.getAttribute('aria-controls')}`);
            expect(
                within(listbox)
                    .getAllByRole('option')
                    .map((n) => n.textContent?.trim())
            ).toEqual(['a', 'b']);
            await fireEvent.click(within(listbox).getByRole('option', { name: 'b' }));
            await settle();
            expect(JSON.stringify(editor().getJSON())).toContain('"value":"b"');
        });

        it('round 为 false 时去掉 round 底部类名', async () => {
            const { container } = await setup({ round: false });
            expect(query(`.${prefix}-footer`, container)).not.toHaveClass(`${prefix}-footer-round`);
        });

        it('从 semiGlobal.config.overrideDefaultProps 读取默认值', async () => {
            const semi = new SemiGlobal();
            semi.config.overrideDefaultProps = { AIChatInput: { round: false, placeholder: 'from global' } };
            const { container } = await setup({}, {}, { global: { provide: { [semiGlobalKey]: semi } } });
            expect(query(`.${prefix}-footer`, container)).not.toHaveClass(`${prefix}-footer-round`);
            expect(pm(container).querySelector('p')).toHaveAttribute('data-placeholder', 'from global');
        });
    });

    describe('内容', () => {
        it('通过 contentChange 上报转换后的内容', async () => {
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { handle } = await setup({ onContentChange });
            await setContent(handle, '<p>hello</p><p>world</p>');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'hello\nworld' }]);
        });

        it('上报在编辑器中输入的内容', async () => {
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { editor } = await setup({ onContentChange });
            editor().commands.insertContent('typed');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'typed' }]);
        });

        it('把编辑器的 focus、blur 与 paste 事件作为同名事件发出', async () => {
            const onFocus = vi.fn<(event: FocusEvent) => void>();
            const onBlur = vi.fn<(event: FocusEvent) => void>();
            const onPaste = vi.fn<(event: ClipboardEvent) => void>();
            const { container } = await setup({ onFocus, onBlur, onPaste });
            await fireEvent.focusIn(pm(container));
            await fireEvent.focusOut(pm(container));
            await fireEvent.paste(pm(container));
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onPaste).toHaveBeenCalledTimes(1);
        });
    });

    describe('发送', () => {
        it('内容为空时禁用发送按钮，点击后发送内容', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle } = await setup({ onMessageSend, references: refs });
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send`, `${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).not.toHaveBeenCalled();

            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
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
            const onMessageSend = vi.fn<(message: { attachments?: unknown; inputContents?: unknown }) => void>();
            const { container } = await setup({ onMessageSend, uploadProps: { defaultFileList: files } });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0]).toMatchObject({ attachments: files, inputContents: [] });
        });

        it('默认按 Enter 发送，按 Shift+Enter 换行', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle } = await setup({ onMessageSend });
            await setContent(handle, '<p>hi</p>');
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时交换按键', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle } = await setup({ onMessageSend, sendHotKey: 'shift+enter' });
            await setContent(handle, '<p>hi</p>');
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时，扩展关闭发送快捷键后普通 Enter 交给扩展，不换行', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const onEnter = vi.fn<() => boolean>(() => true);
            const EnterHandler = Extension.create({ name: 'enterHandler', priority: 1000, addKeyboardShortcuts: () => ({ Enter: onEnter }) });
            const { container, handle, editor } = await setup({ onMessageSend, sendHotKey: 'shift+enter', extensions: [EnterHandler] });
            await setContent(handle, '<p>hi</p>');
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
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle, editor } = await setup({ onMessageSend });
            await setContent(handle, '<p>hi</p>');
            const storage = editor().storage as unknown as Record<string, { allowHotKeySend: boolean }>;
            storage.SemiAIChatInput.allowHotKeySend = false;
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('canSend 覆盖内容检查，变化在同一次更新中生效', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle, rerender } = await setup({ onMessageSend, canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await rerender({ canSend: false });
            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await rerender({ canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
        });
    });

    describe('生成中', () => {
        it('显示停止按钮，点击后停止且不发送', async () => {
            const onStopGenerate = vi.fn<() => void>();
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle } = await setup({ generating: true, onStopGenerate, onMessageSend });
            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-stop`);
            await fireEvent.click(sendButton(container));
            expect(onStopGenerate).toHaveBeenCalledTimes(1);
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('开始生成时清空内容与附件', async () => {
            const { container, handle, rerender } = await setup({ uploadProps: { defaultFileList: files } });
            await setContent(handle, '<p>hi</p>');
            await rerender({ generating: true });
            expect(pm(container).textContent).toBe('');
            expect(attachments(container)).toHaveLength(0);
        });

        it('clearContentOnGenerating 为 false 时保留内容与附件', async () => {
            const { container, handle, rerender } = await setup({
                uploadProps: { defaultFileList: files },
                clearContentOnGenerating: false,
            });
            await setContent(handle, '<p>hi</p>');
            await rerender({ generating: true });
            expect(pm(container).textContent).toBe('hi');
            expect(attachments(container)).toHaveLength(1);
        });
    });

    describe('上传', () => {
        it('渲染默认文件列表，删除项时发出 uploadChange', async () => {
            const onUploadChange = vi.fn<(change: unknown) => void>();
            const onChange = vi.fn<(change: unknown) => void>();
            const onRemove = vi.fn<(...args: unknown[]) => void>();
            const { container } = await setup({
                onUploadChange,
                uploadProps: { defaultFileList: files, onChange, onRemove },
            });
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0].querySelector('img')).toHaveAttribute('src', files[0].url);
            expect(attachments(container)[0].querySelector('img')).toHaveAttribute('alt', '');
            expect(attachments(container)[0]).toHaveTextContent('a.png');
            await fireEvent.click(query(`.${prefix}-attachment-delete`, container));
            await settle();
            expect(onRemove).toHaveBeenCalledTimes(1);
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(onChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('uploadProps.disabled 时附件删除按钮不可用', async () => {
            const { container } = await setup({ uploadProps: { defaultFileList: files, disabled: true } });
            expect(query(`.${prefix}-attachment-delete`, container)).toBeDisabled();
        });

        it('uploadProps.disabled 时默认上传按钮带 aria-disabled 并保持可聚焦，#uploadButton 的 defaultNode 同样', async () => {
            const { container } = await setup({ uploadProps: { disabled: true } });
            const button = query(`.${prefix}-footer-action-upload`, container);
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).not.toBeDisabled();
            const custom = await setup({ uploadProps: { disabled: true } }, { uploadButton: ({ defaultNode }: AIChatInputUploadButtonSlotProps) => defaultNode });
            expect(query(`.${prefix}-footer-action-upload`, custom.container)).toHaveAttribute('aria-disabled', 'true');
            const enabled = await setup();
            expect(query(`.${prefix}-footer-action-upload`, enabled.container)).not.toHaveAttribute('aria-disabled');
        });

        it('添加在上传输入框中选择的文件', async () => {
            const onUploadChange = vi.fn<(change: unknown) => void>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container } = await setup({ onUploadChange, uploadProps: { customRequest: () => {} } });
            const file = new File(['x'], 'b.txt', { type: 'text/plain' });
            await fireEvent.change(query('input[type=file]', container), { target: { files: [file] } });
            await settle();
            expect(onUploadChange).toHaveBeenCalled();
            expect(attachments(container)).toHaveLength(1);
            expect(attachments(container)[0]).toHaveTextContent('b.txt');
        });

        it('不传 uploadProps 时选择文件，仍发出 uploadChange 并显示附件', async () => {
            const onUploadChange = vi.fn<(change: unknown) => void>();
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            // keeps the empty action's request out of jsdom's network stack
            vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {});
            const { container } = await setup({ onUploadChange });
            const file = new File(['x'], 'c.txt', { type: 'text/plain' });
            await fireEvent.change(query('input[type=file]', container), { target: { files: [file] } });
            await settle();
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

        it('#uploadButton 替换 Upload 内的按钮', async () => {
            const uploadButton = vi.fn<(scope: AIChatInputUploadButtonSlotProps) => VNode>(({ defaultNode }) => <span class="mine">{defaultNode}</span>);
            const { container } = await setup({ uploadProps: { defaultFileList: files } }, { uploadButton });
            expect(uploadButton).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: false, attachments: files, onOpenFileDialog: expect.any(Function) }));
            expect(query('.semi-upload .mine', container)).toContainElement(query(`.${prefix}-footer-action-upload`, container));
        });

        it('uploadTipProps 让 Tooltip 直接包住上传按钮，aria-describedby 落在它上面且只有一个 Tab 停靠点', async () => {
            const { container } = await setup({ uploadTipProps: { position: 'top' } }, { uploadTip: () => 'tip' });
            const action = query(`.${prefix}-footer-action`, container);
            const button = query(`.${prefix}-footer-action-upload`, action);
            await userEvent.hover(button);
            await waitFor(() => expect(button).toHaveAttribute('aria-describedby'));
            expect(button).toHaveAccessibleDescription('tip');
            expect(query('.semi-upload', action)).not.toHaveAttribute('aria-describedby');
            expect([...query('.semi-upload', action).querySelectorAll('[tabindex="0"], button:not([tabindex="-1"])')]).toEqual([button]);
        });
    });

    describe('引用', () => {
        it('渲染引用，并上报点击与删除', async () => {
            const onReferenceClick = vi.fn<(reference: unknown) => void>();
            const onReferenceDelete = vi.fn<(reference: unknown) => void>();
            const { container } = await setup({ references: refs, onReferenceClick, onReferenceDelete });
            expect(references(container).map((n) => n.textContent?.trim())).toEqual(['quoted text', 'doc.docx']);
            await fireEvent.click(query(`.${prefix}-reference-content`, references(container)[1]));
            expect(onReferenceClick).toHaveBeenCalledWith(refs[1]);
            await fireEvent.click(query(`.${prefix}-reference-delete`, references(container)[0]));
            expect(onReferenceDelete).toHaveBeenCalledWith(refs[0]);
            expect(onReferenceClick).toHaveBeenCalledTimes(1);
        });

        it('showReference 为 false 时隐藏引用，#reference 替换每一项', async () => {
            const { container, rerender } = await setup({ references: refs, showReference: false }, { reference: ({ item }) => <i>{item.id}</i> });
            expect(container.querySelector(`.${prefix}-references`)).toBeNull();
            await rerender({ showReference: true });
            expect([...container.querySelectorAll(`.${prefix}-references i`)].map((n) => n.textContent)).toEqual(['r1', 'r2']);
        });

        it('引用项主体是按钮，Enter 与 Space 发出 referenceClick，删除按钮不嵌套其中', async () => {
            const user = userEvent.setup();
            const onReferenceClick = vi.fn<(reference: unknown) => void>();
            const { container } = await setup({ references: refs, onReferenceClick });
            const [first] = references(container);
            const content = query(`.${prefix}-reference-content`, first);
            const remove = query(`.${prefix}-reference-delete`, first);
            expect(content.tagName).toBe('BUTTON');
            expect(content).toHaveAttribute('type', 'button');
            expect(content).not.toContainElement(remove);
            expect(remove.parentElement).toBe(first);
            content.focus();
            await user.keyboard('{Enter}');
            await user.keyboard(' ');
            expect(onReferenceClick).toHaveBeenCalledTimes(2);
            expect(onReferenceClick).toHaveBeenCalledWith(refs[0]);
        });
    });

    describe('插槽', () => {
        it.each([
            ['top', ['slot', 'references', 'attachments']],
            ['middle', ['references', 'slot', 'attachments']],
            ['bottom', ['references', 'attachments', 'slot']],
        ])('将 #topSlot 放在 %s', async (topSlotPosition, order) => {
            const { container } = await setup({ topSlotPosition, references: refs, uploadProps: { defaultFileList: files } }, { topSlot: () => <div class="slot" /> });
            const names = [...root(container).children].map((node) => (node.classList.contains('slot') ? 'slot' : node.classList.contains(`${prefix}-references`) ? 'references' : node.querySelector(`.${prefix}-attachment`) ? 'attachments' : null)).filter(Boolean);
            expect(names).toEqual(order);
        });

        it('#topSlot 收到引用、附件与当前内容', async () => {
            const topSlot = vi.fn<(scope: AIChatInputTopSlotProps) => VNode[]>(() => []);
            const { handle } = await setup({ references: refs, uploadProps: { defaultFileList: files } }, { topSlot });
            await setContent(handle, '<p>hi</p>');
            expect(topSlot).toHaveBeenLastCalledWith({
                references: refs,
                attachments: files,
                content: [{ type: 'text', text: 'hi' }],
                onUploadFileDelete: expect.any(Function),
                onReferenceDelete: expect.any(Function),
            });
        });

        it('#actionArea 收到上传与发送节点', async () => {
            const actionArea = vi.fn<(scope: AIChatInputActionAreaSlotProps) => VNode>(({ menuItem, class: cls }) => <div class={`${cls} mine`}>{menuItem}</div>);
            const { container } = await setup({}, { actionArea });
            expect(actionArea.mock.lastCall?.[0].menuItem).toHaveLength(2);
            expect(container.querySelector(`.${prefix}-footer-action.mine .semi-upload`)).not.toBeNull();
            expect(container.querySelector(`.${prefix}-footer-action.mine .${prefix}-footer-action-send`)).not.toBeNull();
        });

        it('#actionArea 撤掉重复渲染的上传节点后，粘贴的文件仍加入附件', async () => {
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const twice = shallowRef(true);
            const actionArea = ({ menuItem, class: cls }: AIChatInputActionAreaSlotProps) => <div class={cls}>{twice.value ? [...menuItem, <span>{menuItem[0]}</span>] : menuItem}</div>;
            const { container } = await setup({ uploadProps: { customRequest: () => {} } }, { actionArea });
            expect(container.querySelectorAll('.semi-upload')).toHaveLength(2);
            twice.value = false;
            await settle();
            expect(container.querySelectorAll('.semi-upload')).toHaveLength(1);
            const file = new File(['x'], 'pasted.txt', { type: 'text/plain' });
            await fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });
            await settle();
            expect(attachments(container)[0]).toHaveTextContent('pasted.txt');
        });

        it('Configure 收到 class 时不发出 Vue 警告', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            render(Configure, { attrs: { class: 'mine' }, slots: { default: () => <Configure.Button field="search">{() => 'Search'}</Configure.Button> } });
            expect(warn).not.toHaveBeenCalled();
        });

        it('#configureArea 的项上报变化，并把值作为 setup 发送', async () => {
            const onConfigureChange = vi.fn<(...args: unknown[]) => void>();
            const onMessageSend = vi.fn<(message: { setup?: unknown }) => void>();
            const { container, handle } = await setup(
                { onConfigureChange, onMessageSend },
                {
                    configureArea: () => (
                        <>
                            <Configure.Select field="model" initValue="a" optionList={modelOptions} />
                            <Configure.Button field="search">{() => 'Search'}</Configure.Button>
                        </>
                    ),
                }
            );
            expect(onConfigureChange).not.toHaveBeenCalled();
            const button = templateButton(container);
            await fireEvent.click(button);
            expect(onConfigureChange).toHaveBeenCalledWith({ model: 'a', search: true }, { search: true });
            expect(button).toHaveClass(`${prefix}-footer-configure-button-active`);
            await setContent(handle, '<p>hi</p>');
            await fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0].setup).toEqual({ model: 'a', search: true });
        });

        it('删除 configure 项后移除其字段，上报剩余的值且 changedValue 为 undefined', async () => {
            const onConfigureChange = vi.fn<(...args: unknown[]) => void>();
            const withSearch = shallowRef(true);
            await setup(
                { onConfigureChange },
                {
                    configureArea: () => [<Configure.Select field="model" initValue="a" optionList={modelOptions} />, ...(withSearch.value ? [<Configure.Button field="search" initValue />] : [])],
                }
            );
            withSearch.value = false;
            await settle();
            expect(onConfigureChange.mock.lastCall).toEqual([{ model: 'a' }, undefined]);
        });

        it('Configure.Button 的 aria-pressed 随值切换', async () => {
            const { container } = await setup({}, { configureArea: () => <Configure.Button field="search">{() => 'Search'}</Configure.Button> });
            const button = templateButton(container);
            expect(button).toHaveAttribute('aria-pressed', 'false');
            await fireEvent.click(button);
            expect(button).toHaveAttribute('aria-pressed', 'true');
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
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, rerender } = await setup({ onContentChange });
            await rerender({ suggestions: ['first', 'second'] });
            expect(suggestionItems().map((n) => n.textContent?.trim())).toEqual(['first', 'second']);
            expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);

            await keyDown(container, 'ArrowDown');
            expect(suggestionItems()[1]).toHaveClass(`${prefix}-suggestion-item-active`);
            await keyDown(container, 'Enter');
            expect(pm(container).textContent).toBe('second');
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'second' }]);
            await waitForClosed(`.${prefix}-popover-suggestion`);
        });

        it('内容深度相等的建议数组不会重新打开已关闭的面板', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: ['first'] });
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-suggestion`);
            await rerender({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('选择对象建议时写入其内容，而不是对象本身', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }] });
            await fireEvent.click(suggestionItems()[0]);
            expect(pm(container).textContent).toBe('object');
        });

        it('点击选择建议，外部 mousedown 时关闭', async () => {
            const { container, rerender } = await setup();
            await rerender({ suggestions: [{ content: 'object' }, 'plain'] });
            expect(suggestionItems().map((n) => n.textContent?.trim())).toEqual(['object', 'plain']);
            await fireEvent.click(suggestionItems()[1]);
            expect(pm(container).textContent).toBe('plain');
            await fireEvent.mouseDown(document.body);
            await waitForClosed(`.${prefix}-popover-suggestion`);
        });

        it('点击编辑器重新打开面板，#suggestionItem 渲染各项', async () => {
            const suggestionItem: Slot = ({ suggestion, class: cls, onClick }: AIChatInputSuggestionItemSlotProps) => <button class={cls} onClick={onClick}>{`${String(suggestion)}!`}</button>;
            const { container, rerender } = await setup({}, { suggestionItem });
            await rerender({ suggestions: ['first'] });
            await fireEvent.mouseDown(document.body);
            await waitForClosed(`.${prefix}-popover-suggestion`);
            await fireEvent.click(pm(container));
            expect(suggestionItems().map((n) => n.tagName + n.textContent)).toEqual(['BUTTONfirst!']);
        });
    });

    describe('skill 与模板', () => {
        it('用 skillHotKey 打开 skill 面板，按 Enter 插入 skill，并显示模板按钮', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, editor } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            expect(skillItems().map((n) => n.textContent?.trim())).toEqual(['Writing', 'Coding']);
            expect(skillItems()[0]).toHaveClass(`${prefix}-skill-item-active`);

            editor().commands.insertContent('/');
            await keyDown(container, 'ArrowDown');
            expect(skillItems()[1]).toHaveClass(`${prefix}-skill-item-active`);
            await keyDown(container, 'ArrowUp');
            await keyDown(container, 'Enter');
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(onSkillChange).toHaveBeenCalledTimes(1);
            // the mounted props are reactive, so the skill comes back as a proxy of the same object
            expect(toRaw(onSkillChange.mock.calls[0][0])).toBe(skills[0]);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'skillSlot', label: 'Writing', value: 'writing', hasTemplate: true }]);
            expect(document.querySelector(`.${prefix}-popover-skill`)).toBeNull();
            expect(templateButton(container)).toHaveTextContent('模板');
        });

        it('按 Escape 关闭 skill 面板，点击选择 skill', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const { container } = await setup({ skills, skillHotKey: '/', onSkillChange });
            await keyDown(container, '/');
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-skill`);
            await keyDown(container, '/');
            await fireEvent.click(skillItems()[1]);
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Coding');
            expect(onSkillChange).toHaveBeenCalledWith(skills[1]);
        });

        it('用热键重新打开 skill 面板时高亮回到第一项', async () => {
            const { container, editor } = await setup({ skills, skillHotKey: '/' });
            await keyDown(container, '/');
            editor().commands.insertContent('/');
            await keyDown(container, 'ArrowDown');
            expect(skillItems()[1]).toHaveClass(`${prefix}-skill-item-active`);
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-skill`);
            editor().commands.clearContent();
            await keyDown(container, '/');
            expect(skillItems()[0]).toHaveClass(`${prefix}-skill-item-active`);
        });

        it('skill 面板打开期间文本不只是热键时，方向键仍移动高亮', async () => {
            const { container, editor } = await setup({ skills, skillHotKey: '/' });
            await keyDown(container, '/');
            editor().commands.insertContent('/x');
            await keyDown(container, 'ArrowDown');
            expect(skillItems()[1]).toHaveClass(`${prefix}-skill-item-active`);
        });

        it('移除 skill 插槽会清空 skill，并仍上报编辑器里剩下的内容', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, handle } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await setContent(handle, '<p>plain</p>');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'plain' }]);
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toBeNull();
        });

        it('skill 芯片的删除按钮只删除芯片，保留其后的文字', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const { container } = await setup({
                skills,
                onSkillChange,
                defaultContent: '<p><skill-slot data-label="Writing" data-value="writing"></skill-slot>hello</p>',
            });
            await fireEvent.click(query('.skill-slot-delete', container));
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toBeNull();
            expect(pm(container)).toHaveTextContent('hello');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
        });

        it('模板按钮打开 #template，并传入 skill 与内容 setter', async () => {
            const template = vi.fn<(scope: AIChatInputTemplateSlotProps) => VNode>(({ skill, onTemplateClick }) => (
                <button class="tpl" onClick={() => onTemplateClick('<p>from template</p>')}>
                    {skill?.label ?? 'none'}
                </button>
            ));
            const { container } = await setup({ skills, skillHotKey: '/', templatesCls: 'tpl-cls', templatesStyle: { color: 'red' } }, { template });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            await fireEvent.click(templateButton(container));
            const panel = query(`.${prefix}-template`);
            expect(panel).toHaveClass('tpl-cls');
            expect(panel.style.color).toBe('red');
            expect(panel).toHaveTextContent('Writing');
            await fireEvent.click(query('.tpl'));
            expect(pm(container).textContent).toBe('from template');
        });

        it('没有 skill 时 showTemplateButton 仍显示按钮', async () => {
            const { container } = await setup({ showTemplateButton: true }, { template: () => 'tpl' });
            expect(templateButton(container)).toHaveTextContent('模板');
        });

        it('keepSkillAfterSend 在开始生成时保留 skill', async () => {
            const { container, editor, rerender } = await setup({ skills, skillHotKey: '/', keepSkillAfterSend: true });
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            editor().commands.insertContent('more');
            await rerender({ generating: true });
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).not.toContain('more');
        });
    });

    describe('方法', () => {
        it('setContent、getEditor 与 focusEditor', async () => {
            const { container, handle } = await setup();
            await setContent(handle, '<p>set</p>');
            expect(pm(container).textContent).toBe('set');
            expect(handle().getEditor()?.getText()).toBe('set');
            handle().focusEditor();
            await settle();
            expect(handle().getEditor()?.state.selection.from).toBe(4);
            handle().focusEditor('start');
            await settle();
            expect(handle().getEditor()?.state.selection.from).toBe(1);
        });

        it('changeTemplateVisible 切换模板弹层', async () => {
            const { handle } = await setup({}, { template: () => <i class="tpl">tpl</i> });
            handle().changeTemplateVisible(true);
            await nextTick();
            expect(document.querySelector('.tpl')).not.toBeNull();
            handle().changeTemplateVisible(false);
            await waitForClosed(`.${prefix}-popover-template`);
        });

        it('deleteContent 按 uniqueKey 删除自定义插槽', async () => {
            const { container, handle } = await setup({ extensions: [ReferSlot] });
            await setContent(handle, '<p>a<refer-slot data-unique-key="k1"></refer-slot>b</p>');
            expect(pm(container).querySelector('refer-slot')).not.toBeNull();
            handle().deleteContent({ type: 'referSlot', uniqueKey: 'k1' });
            await settle();
            expect(pm(container).querySelector('refer-slot')).toBeNull();
            expect(pm(container).textContent).toBe('ab');
        });

        it('deleteUploadFile 删除一个附件', async () => {
            const onUploadChange = vi.fn<(change: unknown) => void>();
            const { container, handle } = await setup({ onUploadChange, uploadProps: { defaultFileList: files } });
            handle().deleteUploadFile(files[0]);
            await settle();
            expect(onUploadChange).toHaveBeenCalledWith({ currentFile: files[0], fileList: [] });
            expect(attachments(container)).toHaveLength(0);
        });

        it('setContentWhileSaveTool 保留已选的 skill', async () => {
            const { container, handle } = await setup({ skills, skillHotKey: '/' });
            handle().setContentWhileSaveTool('kept');
            await nextTick();
            expect(paragraphs(container)).toEqual(['kept']);
            await setContent(handle, '');
            await keyDown(container, '/');
            await keyDown(container, 'Enter');
            handle().setContentWhileSaveTool('with skill');
            await settle();
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
            await settle();
            expect(instance.isDestroyed).toBe(true);
        });

        it('卸载时移除外部点击监听', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { unmount, rerender } = await setup();
            const closed = countLiveListeners(add, remove, 'mousedown');
            await rerender({ suggestions: ['first'] });
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(closed + 1);
            unmount();
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        });

        it('KeepAlive 停用时关闭面板，重新激活后保持关闭', async () => {
            const view = render(KeepAliveHost, { props: { shown: true } });
            await settle();
            await view.rerender({ suggestions: ['first'] });
            await settle();
            expect(suggestionItems()).toHaveLength(1);
            await view.rerender({ shown: false });
            await waitForClosed(`.${prefix}-popover-suggestion`);
            await view.rerender({ shown: true });
            await settle();
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
            expect(suggestionItems()).toHaveLength(0);
        });
    });

    describe('修复与新增行为', () => {
        it('把 data-* 等未声明属性传给根元素', async () => {
            const { container } = await setup({ 'data-testid': 'chat-input', id: 'input-id' });
            expect(root(container)).toHaveAttribute('data-testid', 'chat-input');
            expect(root(container)).toHaveAttribute('id', 'input-id');
        });

        it('不把 configure 的 initValue 传给 DOM', async () => {
            const warn = vi.spyOn(console, 'warn');
            const { container } = await setup(
                {},
                {
                    configureArea: () => <Configure.Select field="model" initValue="a" optionList={modelOptions} />,
                }
            );
            expect(container.querySelector('[initvalue]')).toBeNull();
            expect(container.querySelector('[field]')).toBeNull();
            expect(warn.mock.calls.filter((args) => String(args[0]).includes('initValue'))).toEqual([]);
        });

        it('无论面板重新打开多少次，外部点击监听只多一个', async () => {
            const add = vi.spyOn(window, 'addEventListener');
            const remove = vi.spyOn(window, 'removeEventListener');
            const { container, rerender } = await setup();
            const closed = countLiveListeners(add, remove, 'mousedown');
            await rerender({ suggestions: ['first'] });
            for (let i = 0; i < 3; i++) {
                await fireEvent.click(pm(container));
            }
            await settle();
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(closed + 1);
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-suggestion`);
            expect(countLiveListeners(add, remove, 'mousedown')).toBe(closed);
        });

        it('没有 referenceDelete 监听时删除引用不报错', async () => {
            const errors: unknown[] = [];
            const onError = (event: ErrorEvent) => {
                errors.push(event.error);
                event.preventDefault();
            };
            window.addEventListener('error', onError);
            try {
                const { container } = await setup({ references: refs });
                await fireEvent.click(query(`.${prefix}-reference-delete`, references(container)[0]));
            } finally {
                window.removeEventListener('error', onError);
            }
            expect(errors).toEqual([]);
        });

        it('setAllowHotKeySendForSemiAIChatInput 可开启与关闭发送快捷键', async () => {
            const onMessageSend = vi.fn<(message: unknown) => void>();
            const { container, handle, editor } = await setup({ onMessageSend });
            await setContent(handle, '<p>hi</p>');
            // not declared in tiptap's Commands typing; commands bind the current state, so read it per call
            const commands = () => editor().commands as unknown as { setAllowHotKeySendForSemiAIChatInput: (allow: boolean) => void };
            commands().setAllowHotKeySendForSemiAIChatInput(false);
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            commands().setAllowHotKeySendForSemiAIChatInput(true);
            await keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('popoverProps.class 与内部类名同时落在弹层上', async () => {
            const { rerender } = await setup({ popoverProps: { class: 'mine' } });
            await rerender({ suggestions: ['first'] });
            expect(query(`.${prefix}-popover-suggestion`)).toHaveClass('mine');
        });
    });

    describe('无障碍', () => {
        const inForm = () => {
            const form = document.createElement('form');
            const onSubmit = vi.fn<() => void>();
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                onSubmit();
            });
            document.body.append(form);
            return { form, onSubmit };
        };

        it('发送与停止按钮不会提交外层表单，名称从语言包读取', async () => {
            const { form, onSubmit } = inForm();
            try {
                const { container, handle, rerender } = await setup({}, {}, { container: form });
                await setContent(handle, '<p>hi</p>');
                expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.send);
                await fireEvent.click(sendButton(container));
                expect(onSubmit).not.toHaveBeenCalled();
                await rerender({ generating: true });
                expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.stop);
                await fireEvent.click(sendButton(container));
                expect(onSubmit).not.toHaveBeenCalled();
            } finally {
                form.remove();
            }
        });

        it('无法发送时发送按钮标记 aria-disabled，并保持可聚焦', async () => {
            const { container, handle } = await setup();
            expect(sendButton(container)).toHaveAttribute('aria-disabled', 'true');
            expect(sendButton(container)).not.toBeDisabled();
            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        });

        it('默认上传触发器的唯一焦点目标是名为 upload 的 button，名称从语言包读取', async () => {
            const { container } = await setup();
            const trigger = query('.semi-upload-add', container);
            const button = query('button', trigger);
            expect(trigger).not.toHaveAttribute('tabindex');
            expect(trigger).not.toHaveAttribute('role');
            expect(button).toHaveAccessibleName(zh_CN.AIChatInput.upload);
        });

        it('根元素被命名时为 group，使用方的 role 优先', async () => {
            const named = await setup({ 'aria-label': 'composer' });
            expect(named.container.querySelector(`.${prefix}`)).toHaveAttribute('role', 'group');
            const custom = await setup({ 'aria-label': 'composer', role: 'region' });
            expect(custom.container.querySelector(`.${prefix}`)).toHaveAttribute('role', 'region');
            const plain = await setup();
            expect(plain.container.querySelector(`.${prefix}`)).not.toHaveAttribute('role');
        });

        it('横向滚动按钮不会提交外层表单', async () => {
            vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(1000);
            vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100);
            // jsdom has no scrollBy
            Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
                value: vi.fn<() => void>(),
                configurable: true,
            });
            const { form, onSubmit } = inForm();
            try {
                const { container } = await setup({ uploadProps: { defaultFileList: files } }, {}, { container: form });
                const button = query(`.${prefix}-scroll-button-right`, container);
                expect(button).toHaveAttribute('type', 'button');
                await fireEvent.click(button);
                expect(onSubmit).not.toHaveBeenCalled();
            } finally {
                form.remove();
                Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
            }
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
        await waitForClosed(`.${prefix}-popover-suggestion`);
        await rerender({ suggestions: ['x', 'y'] });
        expect(suggestionItems()[0]).toHaveClass(activeCls);
    });

    it('首段为空、后续段落有文字时可以发送', async () => {
        const onMessageSend = vi.fn<(message: unknown) => void>();
        const { container, handle } = await setup({ onMessageSend });
        await setContent(handle, '<p></p><p>hi</p>');
        expect(sendButton(container)).not.toHaveAttribute('aria-disabled');
        await fireEvent.click(sendButton(container));
        expect(onMessageSend).toHaveBeenCalledTimes(1);
    });

    it('键盘触发的 click 与已聚焦控件上的鼠标点击都不把焦点移到编辑器，点击空白处仍聚焦编辑器', async () => {
        const { container } = await setup({ showTemplateButton: true }, { template: () => [] });
        const button = templateButton(container);
        button.focus();
        // fireEvent.click carries detail 0, like a click synthesized from Enter or Space
        await fireEvent.click(button);
        await settle(50);
        expect(button).toHaveFocus();
        // a mouse press has already focused the control, whose open list needs the keyboard
        await fireEvent.click(button, { detail: 1 });
        await settle(50);
        expect(button).toHaveFocus();
        // a press on the blank area focuses the (tabindex -1) root itself
        root(container).focus();
        await fireEvent.click(root(container), { detail: 1 });
        await settle(50);
        expect(pm(container)).toHaveFocus();
        // a mouse press on the send button (which stays mounted) leaves typing where it was
        sendButton(container).focus();
        await fireEvent.click(sendButton(container), { detail: 1 });
        await settle(50);
        expect(pm(container)).toHaveFocus();
    });

    it('deleteContent 只按 uniqueKey 匹配，节点名不限，可同步连续删除', async () => {
        const { container, handle } = await setup({ extensions: [CustomSlot] });
        await setContent(handle, '<p>a<custom-slot data-unique-key="k1"></custom-slot>b<custom-slot data-unique-key="k2"></custom-slot>c</p>');
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(2);
        handle().deleteContent({ type: 'other', uniqueKey: 'k1' });
        handle().deleteContent({ type: 'other', uniqueKey: 'k2' });
        await nextTick();
        expect(pm(container).querySelectorAll('custom-slot')).toHaveLength(0);
        expect(pm(container).textContent).toBe('abc');
    });

    it('skill 的 value 与 label 含 & 时，选择后的第一次内容变化不再次发出 skillChange', async () => {
        const special = [{ value: 'a&b', label: 'Q&A' }];
        const onSkillChange = vi.fn<(skill: unknown) => void>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        editor().commands.insertContent('x');
        await settle();
        expect(onSkillChange).toHaveBeenCalledTimes(1);
        expect(toRaw(onSkillChange.mock.calls[0][0])).toBe(special[0]);
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Q&A');
    });

    it('skill 的 value 与 label 含双引号时，插槽完整显示', async () => {
        const special = [{ value: 'say "hi"', label: 'He said "hi"' }];
        const onSkillChange = vi.fn<(skill: unknown) => void>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        editor().commands.insertContent('x');
        await settle();
        expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('He said "hi"');
        expect(onSkillChange).toHaveBeenCalledTimes(1);
    });

    it('发送后模板按钮回到未按下，再点一次即可打开，setup 不含 template', async () => {
        const onMessageSend = vi.fn<(message: { setup?: unknown }) => void>();
        const { container } = await setup({ skills, skillHotKey: '/', onMessageSend }, { template: () => <i class="tpl">tpl</i> });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        await fireEvent.click(templateButton(container));
        expect(templateButton(container)).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();

        await fireEvent.click(sendButton(container));
        expect(onMessageSend.mock.calls[0][0].setup).toEqual({});
        expect(templateButton(container)).toHaveAttribute('aria-pressed', 'false');
        await fireEvent.click(templateButton(container));
        expect(templateButton(container)).toHaveAttribute('aria-pressed', 'true');
        expect(document.querySelector('.tpl')).not.toBeNull();
    });

    it('通过实例方法关闭模板后按钮回到未按下', async () => {
        const { container, handle } = await setup({ showTemplateButton: true }, { template: () => 'tpl' });
        handle().changeTemplateVisible(true);
        await nextTick();
        const button = templateButton(container);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        handle().changeTemplateVisible(false);
        await nextTick();
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
        await waitForClosed(`.${prefix}-popover-suggestion`);
        expect(textbox).not.toHaveAttribute('aria-controls');
        expect(textbox).not.toHaveAttribute('aria-activedescendant');
    });

    it('skill 面板是 listbox，活动项经 aria-activedescendant 暴露', async () => {
        const { container, editor } = await setup({ skills, skillHotKey: '/' });
        await keyDown(container, '/');
        editor().commands.insertContent('/');
        await nextTick();
        const listbox = screen.getByRole('listbox');
        const options = within(listbox).getAllByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-controls', listbox.id);
        expect(textbox).toHaveAttribute('aria-activedescendant', options[0].id);
        await keyDown(container, 'ArrowDown');
        expect(textbox).toHaveAttribute('aria-activedescendant', options[1].id);
    });

    it('#suggestionItem 的参数带上 option 角色与 id', async () => {
        const suggestionItem: Slot = ({ suggestion, ...attrs }: AIChatInputSuggestionItemSlotProps) => <button {...attrs}>{String(suggestion)}</button>;
        const { rerender } = await setup({}, { suggestionItem });
        await rerender({ suggestions: ['first'] });
        const option = screen.getByRole('option');
        const textbox = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(textbox).toHaveAttribute('aria-activedescendant', option.id);
        expect(option).toHaveAttribute('aria-selected', 'true');
    });

    it('placeholder 变化后可见占位与 aria-placeholder 同步，编辑器实例不变', async () => {
        const { container, rerender, editor } = await setup({ placeholder: 'one' });
        const instance = editor();
        expect(query('p[data-placeholder]', container)).toHaveAttribute('data-placeholder', 'one');
        await rerender({ placeholder: 'two' });
        expect(query('p[data-placeholder]', container)).toHaveAttribute('data-placeholder', 'two');
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
        type SelectItemProps = InstanceType<typeof Configure.Select>['$props'];
        expectTypeOf<{ field: string; optionList: { label: string; value: string }[] }>().toExtend<SelectItemProps>();
        expectTypeOf<{ optionList: { label: string; value: string }[] }>().not.toExtend<SelectItemProps>();
        expectTypeOf<{ field: string; optionList: string }>().not.toExtend<SelectItemProps>();
        type ButtonItemProps = InstanceType<typeof Configure.Button>['$props'];
        expectTypeOf<ButtonItemProps['initValue']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<Parameters<NonNullable<ButtonItemProps['onClick']>>[0]>().toEqualTypeOf<boolean>();

        type RadioItemProps = InstanceType<typeof Configure.RadioButton>['$props'];
        expectTypeOf<{ field: string; options: string[] }>().toExtend<RadioItemProps>();
        expectTypeOf<{ field: string; options: number }>().not.toExtend<RadioItemProps>();
    });

    it('类型：getConfigureItem 按 valueKey 推导 initValue，并保留被包装组件的必填属性', () => {
        const Toggle = defineComponent({
            props: { checked: Boolean, size: { type: Number, required: true } },
            emits: { toggle: (checked: boolean) => typeof checked === 'boolean' },
            setup: (props) => () => <span>{`${props.checked} ${props.size}`}</span>,
        });
        const ToggleItem = getConfigureItem(Toggle, { valueKey: 'checked', onKeyChangeFnName: 'onToggle' });
        type ToggleItemProps = InstanceType<typeof ToggleItem>['$props'];
        expectTypeOf<ToggleItemProps['initValue']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<{ field: string; size: number }>().toExtend<ToggleItemProps>();
        expectTypeOf<{ field: string }>().not.toExtend<ToggleItemProps>();
        expectTypeOf<ToggleItemProps>().not.toHaveProperty('onToggle');
        expectTypeOf<Parameters<NonNullable<ToggleItemProps['onChange']>>>().toEqualTypeOf<[value: unknown]>();
    });

    it('类型：Configure.Mcp 只传 options 即可，showConfigure 与 configureButtonClick 可省略', () => {
        type McpItemProps = InstanceType<typeof Configure.Mcp>['$props'];
        expectTypeOf<{ options: { value: string; label: string }[] }>().toExtend<McpItemProps>();
    });
});

describe('AIChatInput Configure.Mcp 计数', () => {
    const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
    ];

    it('传入 num 时显示 num，否则显示 options 数量', async () => {
        const view = render(Configure.Mcp, { props: { num: 5, options } });
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 5');
        await view.rerender({ num: undefined, options });
        expect(screen.getByRole('button')).toHaveTextContent('MCP · 2');
    });
});

describe('AIChatInput 输入法、面板与上传', () => {
    const pasteFile = (container: Element, file: File) => fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });

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
        await pasteFile(disabled.container, file);
        await settle();
        expect(attachments(disabled.container)).toHaveLength(0);
        disabled.unmount();

        const enabled = await setup({ uploadProps: { customRequest: () => {} } });
        await pasteFile(enabled.container, file);
        await settle();
        expect(attachments(enabled.container)).toHaveLength(1);
    });

    it('showUploadButton 为 false 时粘贴的文件照常加入附件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ showUploadButton: false, uploadProps: { customRequest: () => {} } });
        await pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' }));
        await settle();
        expect(attachments(container)).toHaveLength(1);
        expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
    });

    it('剪贴板同时含正文文本与文件时只插入文本，不上传文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const getAsFile = vi.fn<() => File>(() => new File(['x'], 'preview.png', { type: 'image/png' }));
        await fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => 'cell text', types: ['text/plain', 'Files'] } });
        await settle();
        expect(attachments(container)).toHaveLength(0);
        expect(getAsFile).not.toHaveBeenCalled();
    });

    it('剪贴板的文本只有空白时按纯文件处理：上传文件、阻止默认粘贴，每项只取一次文件', async () => {
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const file = new File(['x'], 'p.png', { type: 'image/png' });
        const getAsFile = vi.fn<() => File>(() => file);
        const event = new Event('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: { items: [{ getAsFile }], getData: () => ' \n', types: ['text/plain', 'Files'] } });
        pm(container).dispatchEvent(event);
        await settle();
        expect(event.defaultPrevented).toBe(true);
        expect(attachments(container)).toHaveLength(1);
        expect(getAsFile).toHaveBeenCalledTimes(1);
        expect(pm(container).querySelectorAll('p')).toHaveLength(1);
        expect(pm(container).textContent).toBe('');
    });

    it('skill 面板点击外部关闭', async () => {
        const { container } = await setup({ skills, skillHotKey: '/' });
        await keyDown(container, '/');
        expect(skillItems()).toHaveLength(2);
        await fireEvent.mouseDown(document.body);
        await waitForClosed(`.${prefix}-popover-skill`);
    });

    it('模板面板内已打开的嵌套 Popover 里按下鼠标不关闭面板，body 上按下才关闭', async () => {
        const nested = () => (
            <Popover trigger="custom" visible motion={false}>
                {{
                    default: () => <button type="button">nested trigger</button>,
                    content: () => <button type="button">inside nested</button>,
                }}
            </Popover>
        );
        const { handle } = await setup({}, { template: nested });
        handle().changeTemplateVisible(true);
        await settle();
        await fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(document.querySelector(`.${prefix}-popover-template`)).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitForClosed(`.${prefix}-popover-template`);
    });

    it('焦点在模板按钮上按 Escape 关闭模板面板', async () => {
        const { container } = await setup({ showTemplateButton: true }, { template: () => <i class="tpl">tpl</i> });
        const button = templateButton(container);
        await fireEvent.click(button);
        await settle();
        expect(document.querySelector(`.${prefix}-template`)).not.toBeNull();
        button.focus();
        await fireEvent.keyDown(button, { key: 'Escape' });
        await waitForClosed(`.${prefix}-template`);
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('focusEditor(false) 不聚焦，不传位置时聚焦到末尾', async () => {
        const { container, handle } = await setup();
        handle().focusEditor(false);
        await settle(50);
        expect(pm(container)).not.toHaveFocus();
        handle().focusEditor();
        await settle(50);
        expect(pm(container)).toHaveFocus();
    });

    it('defaultContent 规范化不产生事务时 topSlot 的 content 仍有初始内容', async () => {
        const topSlot = vi.fn<Slot>(() => []);
        await setup({ defaultContent: 'plain text' }, { topSlot });
        expect(topSlot).toHaveBeenLastCalledWith(expect.objectContaining({ content: [{ type: 'text', text: 'plain text' }] }));
    });

    it('删除附件、引用与 skill 后焦点交给编辑器，不落到 body', async () => {
        const { container, rerender } = await setup({ references: refs, uploadProps: { defaultFileList: files }, skills, skillHotKey: '/' });
        const attachmentDelete = query(`.${prefix}-attachment-delete`, container);
        attachmentDelete.focus();
        await fireEvent.click(attachmentDelete);
        await settle(50);
        expect(attachments(container)).toHaveLength(0);
        expect(pm(container)).toHaveFocus();

        query(`.${prefix}-reference-delete`, container).focus();
        await rerender({ references: [refs[1]] });
        expect(pm(container)).toHaveFocus();

        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        const skillDelete = query('.skill-slot-delete', container);
        skillDelete.focus();
        await fireEvent.click(skillDelete);
        await settle(50);
        expect(container.querySelector('.skill-slot')).toBeNull();
        expect(pm(container)).toHaveFocus();
    });

    it('组件外持焦的按钮与 references 在同一次更新中卸载时，编辑器不获得焦点', async () => {
        const Host = defineComponent({
            props: { references: { type: Array, default: () => [] }, retry: Boolean },
            setup: (props) => () => (
                <div>
                    {props.retry ? <button class="retry">retry</button> : null}
                    <AIChatInput references={props.references as typeof refs} />
                </div>
            ),
        });
        const view = render(Host, { props: { references: refs, retry: true } });
        await settle();
        query('.retry', view.container).focus();
        await view.rerender({ references: [], retry: false });
        await settle();
        expect(pm(view.container)).not.toHaveFocus();
    });

    it('附件横向滚动到尽头后，持焦的滚动按钮消失，焦点交给另一侧的按钮', async () => {
        const metrics = [vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500), vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)];
        const scrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(50);
        try {
            const { container } = await setup({ uploadProps: { defaultFileList: files } });
            const right = query(`.${prefix}-scroll-button-right`, container);
            expect(container.querySelector(`.${prefix}-scroll-button-left`)).not.toBeNull();
            right.focus();
            scrollLeft.mockReturnValue(400);
            await fireEvent.scroll(query(`.${prefix}-scroll-container`, container));
            await settle();
            expect(container.querySelector(`.${prefix}-scroll-button-right`)).toBeNull();
            expect(query(`.${prefix}-scroll-button-left`, container)).toHaveFocus();
        } finally {
            metrics.forEach((spy) => spy.mockRestore());
            scrollLeft.mockRestore();
        }
    });
});

describe('AIChatInput 可访问名称', () => {
    it('编辑器名称从语言包读取，并暴露字符串 placeholder', async () => {
        await setup({ placeholder: 'Ask anything' });
        const editor = screen.getByRole('textbox', { name: zh_CN.AIChatInput.input });
        expect(editor).toHaveAttribute('aria-placeholder', 'Ask anything');
    });
});
