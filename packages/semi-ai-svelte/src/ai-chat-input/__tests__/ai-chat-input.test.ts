import { flushSync, tick } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { Extension, Node, type Editor } from '@tiptap/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Attachment, MessageContent } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import { AIChatInput } from '../index';
import type { AIChatInputProps } from '../interface';
import InputHost, { type InputHostStore } from './input-host.svelte';
import RetryHost from './retry-host.svelte';

const prefix = 'semi-aiChatInput';

// The editor is created on mount and its node views a tick later; tiptap also emits create on a 0ms timer
async function settle(ms = 10) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await tick();
    flushSync();
}

async function setup(props: AIChatInputProps = {}, slots: InputHostStore['slots'] = {}) {
    const store = createStore<InputHostStore>({ props, slots });
    const calls: Record<string, unknown[]> = {};
    const view = render(InputHost, { props: { store, calls } });
    await settle();
    return {
        ...view,
        store,
        calls,
        handle: () => store.handle as NonNullable<InputHostStore['handle']>,
        editor: () => (store.handle as NonNullable<InputHostStore['handle']>).getEditor() as Editor,
        update: async (next: Partial<AIChatInputProps>) => {
            Object.assign(store.props, next);
            await settle();
        },
    };
}

function query<T extends Element = HTMLElement>(selector: string, root: ParentNode = document) {
    const found = root.querySelector<T>(selector);
    if (!found) {
        throw new Error(`missing ${selector}`);
    }
    return found;
}
const root = (container: Element) => query(`.${prefix}`, container);
const pm = (container: Element) => query('.ProseMirror', container);
const sendButton = (container: Element) => query(`.${prefix}-footer-action > .${prefix}-footer-action-button`, container);
const attachments = (container: Element) => [...container.querySelectorAll(`.${prefix}-attachment`)];
const references = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefix}-reference`)];
const suggestionItems = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-suggestion-item`)];
const skillItems = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-skill-item`)];
const paragraphs = (container: Element) => [...pm(container).querySelectorAll('p')].map((p) => p.textContent);
const templateButton = (container: Element) => query(`.${prefix}-footer-configure-button`, container);

async function setContent(handle: () => NonNullable<InputHostStore['handle']>, content: string) {
    handle().setContent(content);
    await settle(0);
}

async function keyDown(container: Element, key: string, init: Record<string, unknown> = {}) {
    await fireEvent.keyDown(pm(container), { key, ...init });
}

const waitForClosed = (selector: string) => waitFor(() => expect(document.querySelector(selector)).toBeNull());

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
        semiGlobal.config.overrideDefaultProps = {};
    });

    describe('渲染', () => {
        it('渲染编辑器，并在根元素上应用 placeholder、class 与 style', async () => {
            const { container } = await setup({ placeholder: 'Ask anything', class: 'mine', style: 'width: 300px' });
            expect(root(container)).toHaveClass(prefix, 'mine');
            expect(root(container).style.width).toBe('300px');
            expect(query(`.${prefix}-editor-content`, container)).toContainElement(pm(container));
            expect(pm(container).querySelector('p')).toHaveAttribute('data-placeholder', 'Ask anything');
            expect(query(`.${prefix}-footer`, container)).toHaveClass(`${prefix}-footer-round`);
        });

        it('showPlaceholderWhenSkillOnly 时只有 skill 的段落仍显示占位，有文字或其他插槽时不显示', async () => {
            const skill = '<skill-slot data-label="Writing" data-value="writing"></skill-slot>';
            const paragraphOf = async (content: string) => {
                const { container } = await setup({ placeholder: 'Ask anything', showPlaceholderWhenSkillOnly: true, defaultContent: `<p>${content}</p>` });
                return pm(container).querySelector('p');
            };
            const skillOnly = await paragraphOf(skill);
            expect(skillOnly).toHaveClass('is-empty', 'is-editor-empty', 'has-skill-slot');
            expect(skillOnly).toHaveAttribute('data-placeholder', 'Ask anything');
            expect(await paragraphOf(`${skill}hi`)).not.toHaveClass('is-empty');
            expect(await paragraphOf(`${skill}<input-slot placeholder="object"></input-slot>`)).not.toHaveClass('is-empty');
        });

        it('渲染 defaultContent', async () => {
            const { container } = await setup({ defaultContent: '<p>hello</p><p>world</p>' });
            expect(paragraphs(container)).toEqual(['hello', 'world']);
        });

        it('round 为 false 时去掉 round 底部类名', async () => {
            const { container } = await setup({ round: false });
            expect(query(`.${prefix}-footer`, container)).not.toHaveClass(`${prefix}-footer-round`);
        });

        it('从 semiGlobal.config.overrideDefaultProps 读取默认值', async () => {
            semiGlobal.config.overrideDefaultProps = { AIChatInput: { round: false, placeholder: 'from global' } };
            const { container } = await setup();
            expect(query(`.${prefix}-footer`, container)).not.toHaveClass(`${prefix}-footer-round`);
            expect(pm(container).querySelector('p')).toHaveAttribute('data-placeholder', 'from global');
        });
    });

    describe('内容', () => {
        it('通过 onContentChange 上报转换后的内容', async () => {
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

        it('把编辑器的 focus、blur 与 paste 事件交给同名回调', async () => {
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
        it('内容为空时发送按钮标记禁用，点击后发送内容', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ onMessageSend, references: refs });
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send`, `${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).not.toHaveBeenCalled();

            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledWith({ references: refs, attachments: [], inputContents: [{ type: 'text', text: 'hi' }], setup: {} });
        });

        it('编辑器创建后允许发送 defaultContent', async () => {
            const { container } = await setup({ defaultContent: '<p>hi</p>' });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
        });

        it('无文本时也能发送附件', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container } = await setup({ onMessageSend, uploadProps: { defaultFileList: files } });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0]).toMatchObject({ attachments: files, inputContents: [] });
        });

        it('默认按 Enter 发送，按 Shift+Enter 换行', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ onMessageSend });
            await setContent(handle, '<p>hi</p>');
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter');
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时交换按键', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ onMessageSend, sendHotKey: 'shift+enter' });
            await setContent(handle, '<p>hi</p>');
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
            expect(paragraphs(container)).toHaveLength(2);
            await keyDown(container, 'Enter', { shiftKey: true });
            expect(onMessageSend).toHaveBeenCalledTimes(1);
        });

        it('sendHotKey="shift+enter" 时，扩展关闭发送快捷键后普通 Enter 交给扩展，不换行', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
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

        it('canSend 覆盖内容检查，变化在同一次更新中生效', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle, update } = await setup({ onMessageSend, canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await update({ canSend: false });
            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-send-disabled`);
            await fireEvent.click(sendButton(container));
            expect(onMessageSend).toHaveBeenCalledTimes(1);

            await update({ canSend: true });
            expect(sendButton(container)).not.toHaveClass(`${prefix}-footer-action-send-disabled`);
        });
    });

    describe('生成中', () => {
        it('显示停止按钮，点击后停止且不发送', async () => {
            const onStopGenerate = vi.fn<() => void>();
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ generating: true, onStopGenerate, onMessageSend });
            await setContent(handle, '<p>hi</p>');
            expect(sendButton(container)).toHaveClass(`${prefix}-footer-action-stop`);
            await fireEvent.click(sendButton(container));
            expect(onStopGenerate).toHaveBeenCalledTimes(1);
            await keyDown(container, 'Enter');
            expect(onMessageSend).not.toHaveBeenCalled();
        });

        it('开始生成时清空内容与附件', async () => {
            const { container, handle, update } = await setup({ uploadProps: { defaultFileList: files } });
            await setContent(handle, '<p>hi</p>');
            await update({ generating: true });
            expect(pm(container).textContent).toBe('');
            expect(attachments(container)).toHaveLength(0);
        });

        it('clearContentOnGenerating 为 false 时保留内容与附件', async () => {
            const { container, handle, update } = await setup({ uploadProps: { defaultFileList: files }, clearContentOnGenerating: false });
            await setContent(handle, '<p>hi</p>');
            await update({ generating: true });
            expect(pm(container).textContent).toBe('hi');
            expect(attachments(container)).toHaveLength(1);
        });
    });

    describe('上传', () => {
        it('渲染默认文件列表，删除项时通知 onUploadChange', async () => {
            const onUploadChange = vi.fn<(change: unknown) => void>();
            const onChange = vi.fn<(change: unknown) => void>();
            const onRemove = vi.fn<(...args: unknown[]) => void>();
            const { container } = await setup({ onUploadChange, uploadProps: { defaultFileList: files, onChange, onRemove } });
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

        it('uploadProps.disabled 时默认上传按钮带 aria-disabled 并保持可聚焦', async () => {
            const { container } = await setup({ uploadProps: { disabled: true } });
            const button = query(`.${prefix}-footer-action-upload`, container);
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button).not.toBeDisabled();
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

        it('不传 uploadProps 时选择文件，仍通知 onUploadChange 并显示附件', async () => {
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
            const { container } = await setup({ showUploadButton: false, showUploadFile: false, uploadProps: { defaultFileList: files } });
            expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
            expect(container.querySelector('.semi-upload')).not.toBeVisible();
            expect(attachments(container)).toHaveLength(0);
        });

        it('uploadButton 替换 Upload 内的按钮，参数带上 defaultNode、disabled 与附件', async () => {
            const { container, calls } = await setup({ uploadProps: { defaultFileList: files } }, { uploadButton: true });
            expect(calls.uploadButton.at(-1)).toMatchObject({ disabled: false, attachments: files, onOpenFileDialog: expect.any(Function) });
            expect(query('.semi-upload .mine', container)).toContainElement(query(`.${prefix}-footer-action-upload`, container));
        });

        it('uploadTipProps 让 Tooltip 直接包住上传按钮，只有一个 Tab 停靠点', async () => {
            const { container } = await setup({ uploadTipProps: { position: 'top' } }, { uploadTip: true });
            const action = query(`.${prefix}-footer-action`, container);
            const button = query(`.${prefix}-footer-action-upload`, action);
            const upload = query('.semi-upload', action);
            expect([...upload.querySelectorAll('[tabindex="0"], button:not([tabindex="-1"])')]).toEqual([button]);
            expect(upload).not.toHaveAttribute('aria-describedby');
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

        it('showReference 为 false 时隐藏引用，reference snippet 替换每一项', async () => {
            const { container, update } = await setup({ references: refs, showReference: false }, { reference: true });
            expect(container.querySelector(`.${prefix}-references`)).toBeNull();
            await update({ showReference: true });
            expect([...container.querySelectorAll(`.${prefix}-references i`)].map((n) => n.textContent)).toEqual(['r1', 'r2']);
        });

        it('引用项主体是按钮，删除按钮不嵌套其中', async () => {
            const { container } = await setup({ references: refs });
            const [first] = references(container);
            const content = query(`.${prefix}-reference-content`, first);
            const remove = query(`.${prefix}-reference-delete`, first);
            expect(content.tagName).toBe('BUTTON');
            expect(content).toHaveAttribute('type', 'button');
            expect(content).not.toContainElement(remove);
            expect(remove.parentElement).toBe(first);
        });

        it('没有 onReferenceDelete 时删除引用不报错', async () => {
            const { container } = await setup({ references: refs });
            await fireEvent.click(query(`.${prefix}-reference-delete`, references(container)[0]));
            expect(references(container)).toHaveLength(2);
        });
    });

    describe('snippet', () => {
        it.each([
            ['top', ['slot', 'references', 'attachments']],
            ['middle', ['references', 'slot', 'attachments']],
            ['bottom', ['references', 'attachments', 'slot']],
        ] as const)('将 topSlot 放在 %s', async (topSlotPosition, order) => {
            const { container } = await setup({ topSlotPosition, references: refs, uploadProps: { defaultFileList: files } }, { topSlot: true });
            const names = [...root(container).children].map((node) => (node.classList.contains('slot') ? 'slot' : node.classList.contains(`${prefix}-references`) ? 'references' : node.querySelector(`.${prefix}-attachment`) ? 'attachments' : null)).filter(Boolean);
            expect(names).toEqual(order);
        });

        it('topSlot 收到引用、附件与当前内容', async () => {
            const { handle, calls } = await setup({ references: refs, uploadProps: { defaultFileList: files } }, { topSlot: true });
            await setContent(handle, '<p>hi</p>');
            expect(calls.topSlot.at(-1)).toMatchObject({
                references: refs,
                attachments: files,
                content: [{ type: 'text', text: 'hi' }],
                onUploadFileDelete: expect.any(Function),
                onReferenceDelete: expect.any(Function),
            });
        });

        it('actionArea 收到上传与发送节点', async () => {
            const { container } = await setup({}, { actionArea: 'default' });
            expect(container.querySelector(`.${prefix}-footer-action.mine .semi-upload`)).not.toBeNull();
            expect(container.querySelector(`.${prefix}-footer-action.mine .${prefix}-footer-action-send`)).not.toBeNull();
        });

        it('actionArea 撤掉重复渲染的上传节点后，粘贴的文件仍加入附件', async () => {
            vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
            const { container, store } = await setup({ uploadProps: { customRequest: () => {} } }, { actionArea: 'twice' });
            expect(container.querySelectorAll('.semi-upload')).toHaveLength(2);
            store.slots.actionArea = 'default';
            await settle();
            expect(container.querySelectorAll('.semi-upload')).toHaveLength(1);
            const file = new File(['x'], 'pasted.txt', { type: 'text/plain' });
            await fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });
            await settle();
            expect(attachments(container)[0]).toHaveTextContent('pasted.txt');
        });
    });

    describe('Configure', () => {
        it('configureArea 的项通知变化，并把值作为 setup 发送', async () => {
            const onConfigureChange = vi.fn<(...args: unknown[]) => void>();
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ onConfigureChange, onMessageSend }, { configure: { model: true, search: true } });
            expect(onConfigureChange).not.toHaveBeenCalled();
            const button = templateButton(container);
            await fireEvent.click(button);
            expect(onConfigureChange).toHaveBeenCalledWith({ model: 'a', search: true }, { search: true });
            expect(button).toHaveClass(`${prefix}-footer-configure-button-active`);
            await setContent(handle, '<p>hi</p>');
            await fireEvent.click(sendButton(container));
            expect(onMessageSend.mock.calls[0][0].setup).toEqual({ model: 'a', search: true });
        });

        it('删除 configure 项后移除其字段，通知剩余的值且 changedValue 为 undefined', async () => {
            const onConfigureChange = vi.fn<(...args: unknown[]) => void>();
            const { store } = await setup({ onConfigureChange }, { configure: { model: true, search: 'init' } });
            store.slots.configure = { model: true };
            await settle();
            expect(onConfigureChange.mock.lastCall).toEqual([{ model: 'a' }, undefined]);
        });

        it('Configure.Button 的 aria-pressed 随值切换', async () => {
            const { container } = await setup({}, { configure: { search: true } });
            const button = templateButton(container);
            expect(button).toHaveAttribute('aria-pressed', 'false');
            await fireEvent.click(button);
            expect(button).toHaveAttribute('aria-pressed', 'true');
        });

        it('Configure.RadioButton 取 target.value，Configure.Item 包装任意组件', async () => {
            const onConfigureChange = vi.fn<(...args: unknown[]) => void>();
            const { container } = await setup({ onConfigureChange }, { configure: { radio: true, custom: true } });
            await settle();
            await fireEvent.click(within(query(`.${prefix}-footer-configure-radio-button`, container)).getByRole('radio', { name: 'Two' }));
            expect(onConfigureChange).toHaveBeenCalledWith({ mode: 2, stars: 2 }, { mode: 2 });
        });

        it('不把 field 与 initValue 传给 DOM', async () => {
            const { container } = await setup({}, { configure: { model: true } });
            expect(container.querySelector('[initvalue]')).toBeNull();
            expect(container.querySelector('[field]')).toBeNull();
        });

        it('Configure.Mcp 传入 num 时显示 num，否则显示 options 数量', async () => {
            const withNum = await setup({}, { configure: { mcp: 7 } });
            expect(query(`.${prefix}-footer-configure-mcp-trigger`, withNum.container)).toHaveTextContent('MCP · 7');
            const without = await setup({}, { configure: { mcp: true } });
            expect(query(`.${prefix}-footer-configure-mcp-trigger`, without.container)).toHaveTextContent('MCP · 2');
        });
    });

    describe('建议项', () => {
        it('建议弹层不是 dialog', async () => {
            const { update } = await setup();
            await update({ suggestions: ['first'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            expect(screen.queryByRole('dialog')).toBeNull();
        });

        it('收到建议时打开面板，并可用键盘选择', async () => {
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, update } = await setup({ onContentChange });
            await update({ suggestions: ['first', 'second'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(2));
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
            const { container, update } = await setup();
            await update({ suggestions: ['first'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-suggestion`);
            await update({ suggestions: ['first'] });
            expect(document.querySelector(`.${prefix}-popover-suggestion`)).toBeNull();
        });

        it('选择对象建议时写入其内容，而不是对象本身', async () => {
            const { container, update } = await setup();
            await update({ suggestions: [{ content: 'object' }] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            await fireEvent.click(suggestionItems()[0]);
            expect(pm(container).textContent).toBe('object');
        });

        it('点击选择建议，外部 mousedown 时关闭', async () => {
            const { container, update } = await setup();
            await update({ suggestions: [{ content: 'object' }, 'plain'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(2));
            expect(suggestionItems().map((n) => n.textContent?.trim())).toEqual(['object', 'plain']);
            await fireEvent.click(suggestionItems()[1]);
            expect(pm(container).textContent).toBe('plain');
            await fireEvent.mouseDown(document.body);
            await waitForClosed(`.${prefix}-popover-suggestion`);
        });

        it('点击编辑器重新打开面板，suggestionItem 渲染各项并带 option 角色与 id', async () => {
            const { container, update, calls } = await setup({}, { suggestionItem: true });
            await update({ suggestions: ['first'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            await fireEvent.mouseDown(document.body);
            await waitForClosed(`.${prefix}-popover-suggestion`);
            await fireEvent.click(pm(container));
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            expect(suggestionItems().map((n) => n.tagName + n.textContent)).toEqual(['BUTTONfirst!']);
            expect(calls.suggestionItem.at(-1)).toMatchObject({ role: 'option', 'aria-selected': true, id: expect.stringContaining('-option-0') });
        });

        it('建议面板是 listbox，活动项经 aria-activedescendant 暴露', async () => {
            const { container, update } = await setup();
            await update({ suggestions: ['a', 'b', 'c'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(3));
            const listbox = query(`.${prefix}-suggestion`);
            expect(listbox).toHaveAttribute('role', 'listbox');
            expect(pm(container)).toHaveAttribute('aria-controls', listbox.id);
            expect(pm(container)).toHaveAttribute('aria-activedescendant', suggestionItems()[0].id);
            await keyDown(container, 'ArrowDown');
            expect(pm(container)).toHaveAttribute('aria-activedescendant', suggestionItems()[1].id);
        });

        it('建议列表变短后高亮回到第一项，Enter 写入该项', async () => {
            const { container, update } = await setup();
            await update({ suggestions: ['a', 'b', 'c'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(3));
            await keyDown(container, 'ArrowDown');
            await keyDown(container, 'ArrowDown');
            await update({ suggestions: ['x'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);
            await keyDown(container, 'Enter');
            expect(pm(container).textContent).toBe('x');
        });
    });

    describe('skill 与模板', () => {
        it('用 skillHotKey 打开 skill 面板，按 Enter 插入 skill，并显示模板按钮', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, editor } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
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
            expect(onSkillChange.mock.calls[0][0]).toEqual(skills[0]);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'skillSlot', label: 'Writing', value: 'writing', hasTemplate: true }]);
            await waitForClosed(`.${prefix}-popover-skill`);
            expect(templateButton(container)).toHaveTextContent('模板');
        });

        it('按 Escape 关闭 skill 面板，点击选择 skill', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const { container } = await setup({ skills, skillHotKey: '/', onSkillChange });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await keyDown(container, 'Escape');
            await waitForClosed(`.${prefix}-popover-skill`);
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await fireEvent.click(skillItems()[1]);
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Coding');
            expect(onSkillChange.mock.calls.at(-1)?.[0]).toEqual(skills[1]);
        });

        it('skill 面板是 listbox，skillItem 与 skillIcon snippet 生效', async () => {
            const { container } = await setup({ skills, skillHotKey: '/' }, { skillIcon: true });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            const listbox = query(`.${prefix}-skill`);
            expect(listbox).toHaveAttribute('role', 'listbox');
            expect(pm(container)).toHaveAttribute('aria-activedescendant', skillItems()[0].id);
            expect([...listbox.querySelectorAll('.icon')].map((n) => n.textContent)).toEqual(['writing', 'coding']);
        });

        it('移除 skill 插槽会清空 skill，并仍上报编辑器里剩下的内容', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const onContentChange = vi.fn<(contents: unknown[]) => void>();
            const { container, handle } = await setup({ skills, skillHotKey: '/', onSkillChange, onContentChange });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await keyDown(container, 'Enter');
            await setContent(handle, '<p>plain</p>');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
            expect(onContentChange).toHaveBeenLastCalledWith([{ type: 'text', text: 'plain' }]);
            expect(container.querySelector(`.${prefix}-footer-configure-button`)).toBeNull();
        });

        it('skill 芯片的删除按钮只删除芯片，保留其后的文字', async () => {
            const onSkillChange = vi.fn<(skill: unknown) => void>();
            const { container } = await setup({ skills, onSkillChange, defaultContent: '<p><skill-slot data-label="Writing" data-value="writing"></skill-slot>hello</p>' });
            await fireEvent.click(query('.skill-slot-delete', container));
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toBeNull();
            expect(pm(container)).toHaveTextContent('hello');
            expect(onSkillChange).toHaveBeenLastCalledWith(undefined);
        });

        it('模板按钮打开 template，并传入 skill 与内容 setter', async () => {
            const { container } = await setup({ skills, skillHotKey: '/', templatesCls: 'tpl-cls', templatesStyle: 'color: red' }, { template: true });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await keyDown(container, 'Enter');
            await fireEvent.click(templateButton(container));
            await waitFor(() => expect(document.querySelector(`.${prefix}-template`)).not.toBeNull());
            const panel = query(`.${prefix}-template`);
            expect(panel).toHaveClass('tpl-cls');
            expect(panel.style.color).toBe('red');
            expect(panel).toHaveTextContent('Writing');
            await fireEvent.click(query('.tpl'));
            expect(pm(container).textContent).toBe('from template');
        });

        it('没有 skill 时 showTemplateButton 仍显示按钮', async () => {
            const { container } = await setup({ showTemplateButton: true }, { template: true });
            expect(templateButton(container)).toHaveTextContent('模板');
        });

        it('keepSkillAfterSend 在开始生成时保留 skill', async () => {
            const { container, editor, update } = await setup({ skills, skillHotKey: '/', keepSkillAfterSend: true });
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await keyDown(container, 'Enter');
            editor().commands.insertContent('more');
            await update({ generating: true });
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).not.toContain('more');
        });

        it('发送后模板按钮回到未按下', async () => {
            const onMessageSend = vi.fn<(message: MessageContent) => void>();
            const { container, handle } = await setup({ showTemplateButton: true, onMessageSend }, { template: true });
            await fireEvent.click(templateButton(container));
            expect(templateButton(container)).toHaveAttribute('aria-pressed', 'true');
            await setContent(handle, '<p>hi</p>');
            await fireEvent.click(sendButton(container));
            expect(templateButton(container)).toHaveAttribute('aria-pressed', 'false');
            expect(onMessageSend.mock.calls[0][0].setup).toEqual({});
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
            const { handle } = await setup({}, { template: true });
            handle().changeTemplateVisible(true);
            await waitFor(() => expect(document.querySelector('.tpl')).not.toBeNull());
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
            await settle(0);
            expect(paragraphs(container)).toEqual(['kept']);
            await setContent(handle, '');
            await keyDown(container, '/');
            await waitFor(() => expect(skillItems()).toHaveLength(2));
            await keyDown(container, 'Enter');
            handle().setContentWhileSaveTool('with skill');
            await settle();
            expect(pm(container).querySelector('.skill-slot')).toHaveTextContent('Writing');
            expect(pm(container).textContent).toContain('with skill');
        });
    });

    describe('属性透传与无障碍', () => {
        it('把 data-* 等未声明属性传给根元素', async () => {
            const { container } = await setup({ 'data-testid': 'chat-input', id: 'input-id' });
            expect(root(container)).toHaveAttribute('data-testid', 'chat-input');
            expect(root(container)).toHaveAttribute('id', 'input-id');
        });

        it('popoverProps.class 与内部类名同时落在弹层上', async () => {
            const { update } = await setup({ popoverProps: { class: 'mine' } });
            await update({ suggestions: ['first'] });
            await waitFor(() => expect(suggestionItems()).toHaveLength(1));
            expect(query(`.${prefix}-popover-suggestion`)).toHaveClass('mine');
        });

        it('发送与停止按钮名称从语言包读取，且不提交外层表单', async () => {
            const form = document.createElement('form');
            const onSubmit = vi.fn<() => void>();
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                onSubmit();
            });
            document.body.append(form);
            try {
                const store = createStore<InputHostStore>({ props: {}, slots: {} });
                const { container } = render(InputHost, { props: { store, calls: {} }, target: form });
                await settle();
                (store.handle as NonNullable<InputHostStore['handle']>).setContent('<p>hi</p>');
                await settle(0);
                expect(sendButton(container)).toHaveAccessibleName(zh_CN.AIChatInput.send);
                await fireEvent.click(sendButton(container));
                store.props.generating = true;
                await settle();
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

        it('默认上传触发器的唯一焦点目标是名为 upload 的 button', async () => {
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

        it('容器不是 Tab 停靠点，textbox 才是', async () => {
            const { container } = await setup();
            expect(root(container)).toHaveAttribute('tabindex', '-1');
            expect(pm(container)).toHaveAttribute('role', 'textbox');
        });

        it('编辑器名称从语言包读取，并暴露字符串 placeholder', async () => {
            const { container } = await setup({ placeholder: 'Ask' });
            expect(pm(container)).toHaveAccessibleName(zh_CN.AIChatInput.input);
            expect(pm(container)).toHaveAttribute('aria-placeholder', 'Ask');
        });
    });
});

describe('AIChatInput 输入法、粘贴与焦点', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    const pasteFile = (container: Element, file: File) => fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile: () => file }], getData: () => '', types: ['Files'] } });
    const mockBlobUrl = () => vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);

    it('输入法上屏后立即卸载，延迟的零宽字符清理不报错', async () => {
        const { container, editor, unmount } = await setup();
        const view = editor().view;
        view.dispatch(view.state.tr.insertText('﻿a', 1));
        vi.useFakeTimers();
        await fireEvent.compositionEnd(pm(container));
        unmount();
        expect(() => vi.advanceTimersByTime(100)).not.toThrow();
        expect(view.isDestroyed).toBe(true);
    });

    it('输入法组合中的方向键与 Enter 不切换也不选中建议项', async () => {
        const { container, update } = await setup();
        await update({ suggestions: ['first', 'second'] });
        await keyDown(container, 'ArrowDown', { isComposing: true });
        expect(suggestionItems()[0]).toHaveClass(`${prefix}-suggestion-item-active`);
        await keyDown(container, 'Enter', { isComposing: true });
        expect(pm(container).textContent).toBe('');
        expect(suggestionItems()).toHaveLength(2);
    });

    it('uploadProps.disabled 时粘贴的文件不加入附件，未禁用时加入', async () => {
        mockBlobUrl();
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
        mockBlobUrl();
        const { container } = await setup({ showUploadButton: false, uploadProps: { customRequest: () => {} } });
        await pasteFile(container, new File(['x'], 'p.txt', { type: 'text/plain' }));
        await settle();
        expect(attachments(container)).toHaveLength(1);
        expect(container.querySelector(`.${prefix}-footer-action-upload`)).toBeNull();
    });

    it('剪贴板同时含正文文本与文件时只插入文本，不上传文件', async () => {
        mockBlobUrl();
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const getAsFile = vi.fn<() => File>(() => new File(['x'], 'preview.png', { type: 'image/png' }));
        await fireEvent.paste(pm(container), { clipboardData: { items: [{ getAsFile }], getData: () => 'cell text', types: ['text/plain', 'Files'] } });
        await settle();
        expect(attachments(container)).toHaveLength(0);
        expect(getAsFile).not.toHaveBeenCalled();
    });

    it('剪贴板的文本只有空白时按纯文件处理：上传文件、阻止默认粘贴，每项只取一次文件', async () => {
        mockBlobUrl();
        const { container } = await setup({ uploadProps: { customRequest: () => {} } });
        const getAsFile = vi.fn<() => File>(() => new File(['x'], 'p.png', { type: 'image/png' }));
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
        const { handle } = await setup({}, { template: 'nested' });
        handle().changeTemplateVisible(true);
        await settle();
        await fireEvent.mouseDown(screen.getByRole('button', { name: 'inside nested' }));
        expect(document.querySelector(`.${prefix}-popover-template`)).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitForClosed(`.${prefix}-popover-template`);
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
        const { calls } = await setup({ defaultContent: 'plain text' }, { topSlot: true });
        expect(calls.topSlot.at(-1)).toEqual(expect.objectContaining({ content: [{ type: 'text', text: 'plain text' }] }));
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
        const { container } = await setup({ showTemplateButton: true }, { template: true });
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

    it('在容器内按下、在编辑器外松开的拖选不把焦点移到编辑器', async () => {
        const { container } = await setup();
        const footer = query(`.${prefix}-footer`, container);
        await fireEvent.mouseDown(footer);
        await fireEvent.click(root(container), { detail: 1 });
        await settle(50);
        expect(pm(container)).not.toHaveFocus();
        // the same press and release on one element still focuses the editor
        await fireEvent.mouseDown(root(container));
        await fireEvent.click(root(container), { detail: 1 });
        await settle(50);
        expect(pm(container)).toHaveFocus();
    });

    it('通过实例方法关闭模板后按钮回到未按下', async () => {
        const { container, handle } = await setup({ showTemplateButton: true }, { template: true });
        handle().changeTemplateVisible(true);
        await settle();
        const button = templateButton(container);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        handle().changeTemplateVisible(false);
        await settle();
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).not.toHaveClass(`${prefix}-footer-configure-button-active`);
    });

    it('skill 的 value 与 label 含 & 时，选择后的第一次内容变化不再次发出 onSkillChange', async () => {
        const special = [{ value: 'a&b', label: 'Q&A' }];
        const onSkillChange = vi.fn<(skill: unknown) => void>();
        const { container, editor } = await setup({ skills: special, skillHotKey: '/', onSkillChange });
        await keyDown(container, '/');
        await keyDown(container, 'Enter');
        editor().commands.insertContent('x');
        await settle();
        expect(onSkillChange).toHaveBeenCalledTimes(1);
        expect(onSkillChange.mock.calls[0][0]).toEqual(special[0]);
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

    it('删除附件、引用与 skill 后焦点交给编辑器，不落到 body', async () => {
        const { container, update } = await setup({ references: refs, uploadProps: { defaultFileList: files }, skills, skillHotKey: '/' });
        const attachmentDelete = query(`.${prefix}-attachment-delete`, container);
        attachmentDelete.focus();
        await fireEvent.click(attachmentDelete);
        await settle(50);
        expect(attachments(container)).toHaveLength(0);
        expect(pm(container)).toHaveFocus();

        query(`.${prefix}-reference-delete`, container).focus();
        await update({ references: [refs[1]] });
        await settle(50);
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
        const store = createStore({ references: refs, retry: true });
        const { container } = render(RetryHost, { props: { store } });
        await settle();
        query('.retry', container).focus();
        store.references = [];
        store.retry = false;
        await settle(50);
        expect(pm(container)).not.toHaveFocus();
    });

    it('附件横向滚动到尽头后，持焦的滚动按钮消失，焦点交给另一侧的按钮', async () => {
        vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500);
        vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100);
        const scrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(50);
        const { container } = await setup({ uploadProps: { defaultFileList: files } });
        const right = query(`.${prefix}-scroll-button-right`, container);
        expect(container.querySelector(`.${prefix}-scroll-button-left`)).not.toBeNull();
        right.focus();
        scrollLeft.mockReturnValue(400);
        await fireEvent.scroll(query(`.${prefix}-scroll-container`, container));
        await settle(50);
        expect(container.querySelector(`.${prefix}-scroll-button-right`)).toBeNull();
        expect(query(`.${prefix}-scroll-button-left`, container)).toHaveFocus();
    });

    it('横向滚动按钮不提交外层表单', async () => {
        vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(500);
        vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100);
        const { container } = await setup({ uploadProps: { defaultFileList: files } });
        expect(query(`.${prefix}-scroll-button-right`, container)).toHaveAttribute('type', 'button');
    });
});

describe('AIChatInput Configure.Mcp 下拉', () => {
    const options = [
        { label: 'one', value: '1' },
        { label: 'two', value: '2', disabled: true },
    ];

    it('悬停触发器打开菜单：标题显示已选数量，列出各选项，禁用项带 aria-disabled', async () => {
        const { container } = render(AIChatInput.Configure.Mcp, { props: { options, num: 5 } });
        await fireEvent.mouseEnter(query(`.${prefix}-footer-configure-mcp-trigger`, container));
        const title = await waitFor(() => query(`.${prefix}-footer-configure-mcp-header-title`));
        expect(title).toHaveTextContent(zh_CN.AIChatInput.selected.replace('${count}', '5'));
        expect(screen.getByRole('menuitem', { name: 'one' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'two' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('点击配置按钮通知 onConfigureButtonClick，showConfigure 为 false 时不渲染该按钮', async () => {
        const onConfigureButtonClick = vi.fn<() => void>();
        const view = render(AIChatInput.Configure.Mcp, { props: { options, onConfigureButtonClick } });
        await fireEvent.mouseEnter(query(`.${prefix}-footer-configure-mcp-trigger`, view.container));
        await fireEvent.click(await screen.findByRole('button', { name: zh_CN.AIChatInput.configure }));
        expect(onConfigureButtonClick).toHaveBeenCalledTimes(1);
        view.unmount();

        const hidden = render(AIChatInput.Configure.Mcp, { props: { options, showConfigure: false } });
        await fireEvent.mouseEnter(query(`.${prefix}-footer-configure-mcp-trigger`, hidden.container));
        await waitFor(() => query(`.${prefix}-footer-configure-mcp-header-title`));
        expect(screen.queryByRole('button', { name: zh_CN.AIChatInput.configure })).toBeNull();
    });

    it('点击触发器的事件不冒泡到外层容器', async () => {
        const { container } = render(AIChatInput.Configure.Mcp, { props: { options } });
        const onClick = vi.fn<() => void>();
        // Svelte delegates clicks to the mount target, so the listener goes on its parent
        container.parentElement?.addEventListener('click', onClick);
        await fireEvent.click(query(`.${prefix}-footer-configure-mcp-trigger`, container));
        expect(onClick).not.toHaveBeenCalled();
    });
});
