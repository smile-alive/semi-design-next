import { createRawSnippet, flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, type Mock, onTestFinished, vi } from 'vite-plus/test';
import { chatCompletionToMessage } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import type { Annotation } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '@fibrae/semi-ui-svelte/_base/__tests__/store.svelte';
import semiGlobal from '@fibrae/semi-ui-svelte/_utils/semi-global';
import type { AvatarProps } from '@fibrae/semi-ui-svelte/avatar/interface';
import { Modal } from '@fibrae/semi-ui-svelte/modal/index';
import { Toast } from '@fibrae/semi-ui-svelte/toast/index';
// the package entry, which also loads the semi-global type augmentation
import { AIChatDialogue } from '../../index';
import type { AIChatDialogueProps, DefaultActionNodeObj, MarkdownRenderProps, Message, Metadata } from '../interface';
import ReferenceWidget from '../widgets/content-item/reference.svelte';
import CustomStrong from './custom-strong.svelte';
import DialogueHost, { type DialogueHostStore } from './dialogue-host.svelte';

const prefix = `${BASE_CLASS_PREFIX}-ai-chat-dialogue`;
const contentCls = `${prefix}-content`;
const actionCls = `${prefix}-action`;
const text = zh_CN.AIChatDialogue;

const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
    system: { name: 'System', avatar: 'https://example.com/system.png' },
};

const baseChats: Message[] = [
    { id: '1', role: 'user', content: 'hello', status: 'completed' },
    { id: '2', role: 'assistant', content: 'world', status: 'completed' },
];

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
const getRoot = (container: Element) => container.firstElementChild as HTMLElement;
const getList = (container: Element) => container.querySelector<HTMLElement>(`.${prefix}-list`) as HTMLElement;
const getWrappers = (container: Element) => container.querySelectorAll<HTMLElement>(`.${prefix}-wrapper`);
const getActionButton = (wrapper: Element, icon: string) => wrapper.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-${icon}`)?.closest('button') ?? null;
const click = (el: Element | null) => fireEvent.click(el as Element);

// jsdom has no layout: scroll metrics are faked on Element.prototype, scrollTop backed by a map
const scrollProps = ['scrollHeight', 'clientHeight', 'scrollTop'] as const;
let savedDescriptors: Partial<Record<(typeof scrollProps)[number], PropertyDescriptor | undefined>> = {};
function mockListScroll({ scrollHeight = 1000, clientHeight = 300 } = {}) {
    const size = { scrollHeight, clientHeight };
    const tops = new WeakMap<Element, number>();
    const isList = (el: Element) => el.classList?.contains(`${prefix}-list`);
    savedDescriptors = Object.fromEntries(scrollProps.map((key) => [key, Object.getOwnPropertyDescriptor(Element.prototype, key)]));
    Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get(this: Element) {
            return isList(this) ? size.scrollHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'clientHeight', {
        configurable: true,
        get(this: Element) {
            return isList(this) ? size.clientHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'scrollTop', {
        configurable: true,
        get(this: Element) {
            return tops.get(this) ?? 0;
        },
        set(this: Element, value: number) {
            tops.set(this, value);
        },
    });
    return size;
}
function restoreListScroll() {
    for (const [key, descriptor] of Object.entries(savedDescriptors)) {
        if (descriptor) {
            Object.defineProperty(Element.prototype, key, descriptor);
        }
    }
    savedDescriptors = {};
}

type Props = Partial<AIChatDialogueProps> & Record<string, unknown>;

function renderDialogue(props: Props = {}) {
    const view = render(AIChatDialogue, { props: { chats: baseChats, roleConfig, ...props } as AIChatDialogueProps });
    return {
        container: view.container,
        handle: view.component,
        rerender: (next: Props) => view.rerender(next as AIChatDialogueProps),
        unmount: () => view.unmount(),
    };
}

function renderHost(initial: Partial<DialogueHostStore> = {}) {
    const store = createStore<DialogueHostStore>({ chats: baseChats, roleConfig, shown: {}, ...initial });
    const view = render(DialogueHost, { props: { store } });
    return { ...view, store };
}

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

afterEach(() => {
    restoreListScroll();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('AIChatDialogue 渲染', () => {
    it('角色 color 的类型是 Avatar 的色板', () => {
        expectTypeOf<Metadata['color']>().toEqualTypeOf<AvatarProps['color']>();
        expectTypeOf<'red'>().toExtend<NonNullable<Metadata['color']>>();
        expectTypeOf<'#ff0000'>().not.toExtend<NonNullable<Metadata['color']>>();
    });

    it('为每条消息渲染头像、标题与 markdown 内容', async () => {
        const { container } = renderDialogue();
        expect(getRoot(container)).toHaveClass(prefix);
        expect(getWrappers(container)).toHaveLength(2);
        expect(Array.from(container.querySelectorAll(`.${prefix}-title`), (n) => n.textContent)).toEqual(['User', 'Assistant']);
        const avatars = container.querySelectorAll(`.${prefix}-avatar img`);
        expect(Array.from(avatars, (n) => n.getAttribute('src'))).toEqual([roleConfig.user.avatar, roleConfig.assistant.avatar]);
        expect(await screen.findByText('hello')).toBeInTheDocument();
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('在根元素上应用 class、style 与未声明属性', () => {
        const { container } = renderDialogue({ class: 'custom', style: 'color: red', 'data-testid': 'dialogue', id: 'root-id' });
        expect(getRoot(container)).toHaveClass(prefix, 'custom');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getRoot(container)).toHaveAttribute('data-testid', 'dialogue');
        expect(getRoot(container)).toHaveAttribute('id', 'root-id');
        for (const wrapper of getWrappers(container)) {
            expect(wrapper).not.toHaveAttribute('data-testid');
        }
    });

    it('只有 align="leftRight" 时用户消息才右对齐', async () => {
        const { container, rerender } = renderDialogue();
        const containers = container.querySelectorAll(`.${prefix}-container`);
        expect(containers[0]).toHaveClass(`${prefix}-container-right`);
        expect(containers[1]).not.toHaveClass(`${prefix}-container-right`);

        await rerender({ align: 'leftAlign' });
        expect(container.querySelectorAll(`.${prefix}-container-right`)).toHaveLength(0);
    });

    it('按消息名称解析 Map 角色', () => {
        const config = { ...roleConfig, assistant: new Map([['bot', { name: 'Bot', avatar: 'bot.png' }]]) };
        const { container } = renderDialogue({
            roleConfig: config,
            chats: [{ id: '1', role: 'assistant', name: 'bot', content: 'hi', status: 'completed' }],
        });
        expect(container.querySelector(`.${prefix}-title`)).toHaveTextContent('Bot');
        expect(container.querySelector(`.${prefix}-avatar img`)).toHaveAttribute('src', 'bot.png');
    });

    it('将 mode 映射为气泡类名', async () => {
        const getBubbles = (container: Element) => Array.from(container.querySelectorAll(`.${contentCls}-inner > div`), (n) => n.className);
        const { container, rerender } = renderDialogue();
        expect(getBubbles(container)[0]).toContain(`${contentCls}-bubble`);
        expect(getBubbles(container)[0]).toContain(`${contentCls}-user`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-bubble`);

        await rerender({ mode: 'noBubble' });
        expect(getBubbles(container)[0]).toContain(`${contentCls}-no-bubble`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-no-bubble`);

        await rerender({ mode: 'userBubble' });
        expect(getBubbles(container)[0]).toContain(`${contentCls}-userBubble`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-no-bubble`);
    });

    it('进行中时显示 status 为 failed 的图标、加载文案，并隐藏操作', () => {
        const { container } = renderDialogue({
            chats: [
                { id: '1', role: 'assistant', content: 'oops', status: 'failed' },
                { id: '2', role: 'assistant', content: '', status: 'in_progress' },
            ],
        });
        const [failed, loading] = getWrappers(container);
        expect(failed.querySelector(`.${contentCls}-failed`)).not.toBeNull();
        expect(failed.querySelector(`.${contentCls}-error`)).not.toBeNull();
        expect(loading.querySelector(`.${contentCls}-loading`)).toHaveTextContent(text.loading);
        expect(loading.querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-hidden`);
        expect(failed.querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-hidden`);
    });

    it('对没有字符串 content 的消息渲染 output_text', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', output_text: 'from output', status: 'completed' }] });
        expect(await screen.findByText('from output')).toBeInTheDocument();
    });

    it('渲染时没有控制台警告与报错', async () => {
        const warn = vi.spyOn(console, 'warn');
        const error = vi.spyOn(console, 'error');
        renderDialogue({
            selecting: true,
            hints: ['a hint'],
            showReference: true,
            markdownRenderProps: { class: 'md' },
            onMessageCopy: () => {},
            onMessageShare: () => {},
        });
        expect(await screen.findByText('world')).toBeInTheDocument();
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-markdownRender.md`)).toHaveLength(2);
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { AIChatDialogue: { mode: 'noBubble' } };
        try {
            const { container } = renderDialogue();
            expect(container.querySelector(`.${contentCls}-inner > div`)).toHaveClass(`${contentCls}-no-bubble`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('暴露静态组件与默认 markdown 组件', () => {
        expect(AIChatDialogue.Reasoning).toBeTypeOf('function');
        expect(AIChatDialogue.Step).toBeTypeOf('function');
        expect(AIChatDialogue.Annotation).toBeTypeOf('function');
        expect(AIChatDialogue.defaultComponents.code).toBeTypeOf('function');
    });

    it('Reasoning、Step、Annotation 把未声明属性透传到根元素', () => {
        render(AIChatDialogue.Reasoning, { props: { id: 'r', 'data-testid': 'reasoning', status: 'completed', summary: [] } as never });
        render(AIChatDialogue.Step, { props: { 'data-testid': 'step', 'aria-label': 'steps', steps: [] } as never });
        render(AIChatDialogue.Annotation, { props: { 'data-testid': 'annotation', title: 'sources', annotation: [], maxCount: 3 } as never });
        expect(screen.getByTestId('reasoning')).toHaveClass(`${prefix}-reasoning-wrapper`);
        expect(screen.getByTestId('reasoning')).toHaveAttribute('id', 'r');
        expect(screen.getByTestId('step')).toHaveClass(`${prefix}-step-wrapper`);
        expect(screen.getByTestId('step')).toHaveAttribute('aria-label', 'steps');
        expect(screen.getByTestId('annotation')).toHaveClass(`${prefix}-annotation-wrapper`);
        expect(screen.getByTestId('annotation')).toHaveAttribute('title', 'sources');
    });

    it('chats 属性变化时更新，并通过 onChatsChange 上报一次', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const { container, rerender } = renderDialogue({ onChatsChange });
        expect(onChatsChange).not.toHaveBeenCalled();
        const next = [...baseChats, { id: '3', role: 'user', content: 'more', status: 'completed' }];
        await rerender({ chats: next });
        expect(getWrappers(container)).toHaveLength(3);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onChatsChange).toHaveBeenLastCalledWith(next);
    });

    it('没有 chats 属性时可重新渲染', async () => {
        const view = render(AIChatDialogue, { props: { roleConfig } });
        await view.rerender({ roleConfig: { ...roleConfig } });
        expect(getRoot(view.container)).toHaveClass(prefix);
        expect(getWrappers(view.container)).toHaveLength(0);
    });

    it('渲染 roleConfig 中缺少角色的消息', () => {
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'tool', content: 'tool output', status: 'completed' }] });
        expect(getWrappers(container)).toHaveLength(1);
    });

    it('角色的 color 落到头像上', () => {
        const { container } = renderDialogue({ roleConfig: { ...roleConfig, user: { name: 'User', color: 'red' } } });
        expect(container.querySelector(`.${prefix}-avatar`)).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-red`);
    });
});

describe('AIChatDialogue 内容块', () => {
    it('渲染带注释的文本项，并上报注释点击', async () => {
        const onAnnotationClick = vi.fn<(annotations: Annotation[]) => void>();
        const annotations = [
            { type: 'url_citation', title: 'A', url: 'https://a.example', logo: 'https://a.example/logo.png' },
            { type: 'file_citation', title: 'F' },
            { type: 'url_citation', title: 'B', url: 'https://b.example' },
        ];
        const { container } = renderDialogue({
            onAnnotationClick,
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'output_text', text: 'cited text', annotations }] }] }],
        });
        expect(await screen.findByText('cited text')).toBeInTheDocument();
        const annotation = container.querySelector(`.${prefix}-annotation-wrapper`);
        expect(annotation).toHaveTextContent(`2 ${text.annotationText}`);
        await click(annotation);
        expect(onAnnotationClick).toHaveBeenCalledWith([annotations[0], annotations[2]]);
    });

    it('键盘激活 Annotation 时 onClick 收到事件对象，传入的 onkeydown 随后照常调用', async () => {
        const order: string[] = [];
        const onClick = vi.fn<(e: MouseEvent | KeyboardEvent, items: unknown[]) => void>(() => order.push('click'));
        const onkeydown = vi.fn<(e: KeyboardEvent) => void>(() => order.push('keydown'));
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(AIChatDialogue.Annotation, { props: { annotation: items, maxCount: 3, onClick, onkeydown } });
        await fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as Element, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), items);
        expect(onkeydown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
        expect(order).toEqual(['click', 'keydown']);
    });

    it('未传 onAnnotationClick 时点击注释不报错', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'output_text', text: 'x', annotations: [{ type: 'url_citation' }] }] }] }],
        });
        await click(container.querySelector(`.${prefix}-annotation-wrapper`));
        expect(error).not.toHaveBeenCalled();
    });

    it('渲染拒绝文本', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'refusal', refusal: 'cannot do' }] }] }] });
        expect(await screen.findByText('cannot do')).toBeInTheDocument();
    });

    it('已完成的推理默认折叠，点击可切换', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'reasoning', status: 'completed', summary: [{ type: 'summary_text', text: 'thought' }] }] }],
        });
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`) as HTMLElement;
        const toggle = screen.getByRole('button', { name: text.reasoning.completed });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).not.toBeNull();
        await click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
        expect(await screen.findByText('thought')).toBeInTheDocument();
        await click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('展开仍在进行中的推理', () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', status: 'in_progress', content: [{ type: 'reasoning', status: 'in_progress', content: [{ text: 'thinking' }] }] }],
        });
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`) as HTMLElement;
        expect(reasoning).toHaveTextContent(text.reasoning.thinking);
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
    });

    it('Reasoning 的 children 替换正文并收到推理数据', () => {
        let received: unknown;
        const children = createRawSnippet((args: () => unknown) => {
            received = args();
            return { render: () => '<p class="custom-reasoning">custom</p>' };
        });
        const { container } = render(AIChatDialogue.Reasoning, { props: { status: 'in_progress', content: [{ text: 'raw' }], children } });
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('custom');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender`)).toBeNull();
        expect(received).toEqual(expect.objectContaining({ status: 'in_progress', content: [{ text: 'raw' }] }));
    });

    it('渲染 function 与自定义 tool 调用，自定义工具调用显示 input', () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        { type: 'function_call', name: 'get_weather', arguments: '{"city":"x"}' },
                        { type: 'custom_tool_call', name: 'custom', arguments: 'args' },
                        { type: 'custom_tool_call', name: 'run', input: 'ls -la' },
                    ],
                },
            ],
        });
        const calls = container.querySelectorAll(`.${contentCls}-tool-call`);
        expect(Array.from(calls, (n) => n.textContent)).toEqual(['get_weather {"city":"x"}', 'custom args', 'run ls -la']);
    });

    it('Chat Completion 的自定义工具调用经适配器转换后可见', () => {
        const [message] = chatCompletionToMessage({
            id: 'c1',
            choices: [{ index: 0, message: { role: 'assistant', content: null, tool_calls: [{ id: 't1', type: 'custom', custom: { name: 'run_script', input: 'ls' } }] }, finish_reason: 'tool_calls' }],
        });
        const { container } = renderDialogue({ chats: [message] });
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('run_script');
    });

    it('数组 content 同时带 output_text 时仍渲染推理块、注释与工具调用', async () => {
        const annotations = [{ type: 'url_citation', title: 'A', url: 'https://a.example' }];
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    output_text: 'answer',
                    content: [
                        { type: 'reasoning', status: 'completed', content: [{ text: 'thinking' }] },
                        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'answer', annotations }] },
                        { type: 'function_call', name: 'get_weather', arguments: '{}' },
                    ],
                },
            ],
        });
        expect(await screen.findByText('answer')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-reasoning-wrapper`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-annotation-wrapper`)).toHaveTextContent(`1 ${text.annotationText}`);
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('get_weather');
    });

    it('渲染图片与文件附件，并支持点击回调', async () => {
        const onImageClick = vi.fn<(image?: unknown) => void>();
        const onFileClick = vi.fn<(file?: unknown) => void>();
        const image = { type: 'input_image', image_url: 'https://example.com/a.png' };
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf', size: '1KB' };
        const { container, rerender } = renderDialogue({
            onImageClick,
            onFileClick,
            chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [image, file] }] }],
        });
        const img = container.querySelector(`.${contentCls}-img img`);
        expect(img).toHaveAttribute('src', image.image_url);
        expect(screen.getByRole('img', { name: text.image })).toBe(img);
        await click(img);
        expect(onImageClick).toHaveBeenCalledWith(image);

        const link = container.querySelector(`a.${contentCls}-file`) as HTMLElement;
        expect(link).toHaveAttribute('href', file.file_url);
        expect(link).toHaveTextContent('report.pdf');
        expect(link.querySelector(`.${contentCls}-file-icon-pdf`)).not.toBeNull();
        const opened = new MouseEvent('click', { bubbles: true, cancelable: true });
        link.dispatchEvent(opened);
        expect(opened.defaultPrevented).toBe(false);
        expect(onFileClick).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));

        await rerender({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }], disabledFileItemClick: true });
        const prevented = new MouseEvent('click', { bubbles: true, cancelable: true });
        (container.querySelector(`a.${contentCls}-file`) as HTMLElement).dispatchEvent(prevented);
        expect(prevented.defaultPrevented).toBe(true);
        expect(onFileClick).toHaveBeenCalledTimes(2);
    });

    it.each([
        ['扩展名大写', { filename: 'Report.PDF', file_url: 'https://example.com/r' }, 'pdf'],
        ['没有扩展名', { filename: 'README', file_url: 'https://example.com/r', fileInstance: { type: 'application/pdf' } }, 'pdf'],
    ])('文件卡片的类型：%s', (_, file, type) => {
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [{ type: 'input_file', size: '1KB', ...file }] }] }] });
        expect(container.querySelector(`.${contentCls}-file-type`)).toHaveTextContent(new RegExp(`^${type}$`));
    });

    it('渲染消息引用，大写扩展名按图片渲染，无扩展名不显示文件图标', () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'user',
                    status: 'completed',
                    content: 'see refs',
                    references: [
                        { id: 'r1', type: 'file', name: 'doc.docx' },
                        { id: 'r2', type: 'text', content: 'quoted text' },
                    ],
                },
            ],
        });
        const refs = container.querySelectorAll(`.${prefix}-reference`);
        expect(Array.from(refs, (n) => n.textContent?.trim())).toEqual(['doc.docx', 'quoted text']);
        expect(refs[0].querySelector(`.${prefix}-reference-icon-word`)).not.toBeNull();

        const widget = render(ReferenceWidget, {
            props: {
                references: [
                    { id: 'a', type: 'file', name: 'A.PNG', url: 'https://example.com/upper.png' },
                    { id: 'b', type: 'file', name: 'doc' },
                    { id: 'c', type: 'file', name: '.js' },
                ],
            },
        });
        expect(widget.container.querySelector('img[src="https://example.com/upper.png"]')).toHaveAttribute('alt', '');
        expect(Array.from(widget.container.querySelectorAll(`.${prefix}-reference`), (ref) => ref.querySelector(`.${prefix}-reference-icon`) !== null)).toEqual([false, false, false]);
    });

    it('showReference 时在用户消息上显示原生 button 引用图标', async () => {
        const onReferenceClick = vi.fn<(item: unknown) => void>();
        renderDialogue({ showReference: true, onReferenceClick });
        const quote = screen.getByRole('button', { name: text.reference });
        expect(quote.tagName).toBe('BUTTON');
        expect(quote).toHaveAttribute('type', 'button');
        await click(quote);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('文件卡片的引用图标支持 Enter 与 Space，且不打开文件', async () => {
        const onReferenceClick = vi.fn<(item: unknown) => void>();
        const onFileClick = vi.fn<(file?: unknown) => void>();
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf' };
        renderDialogue({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }], showReference: true, onReferenceClick, onFileClick });
        const quote = screen.getByRole('button', { name: text.reference });
        await fireEvent.keyDown(quote, { key: 'Enter' });
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        quote.dispatchEvent(space);
        expect(space.defaultPrevented).toBe(true);
        expect(onReferenceClick).toHaveBeenCalledTimes(2);
        expect(onReferenceClick).toHaveBeenCalledWith({ name: 'report.pdf', url: 'https://example.com/r.pdf' });
        expect(onFileClick).not.toHaveBeenCalled();
    });

    it('除非 escapeHtml 为 false，否则转义用户消息中的 html', async () => {
        const { container, rerender } = renderDialogue({ chats: [{ id: '1', role: 'user', content: '<b>bold</b>', status: 'completed' }] });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)).toHaveTextContent('<b>bold</b>'));
        await rerender({ escapeHtml: false });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)?.textContent).not.toContain('<b>'));
    });

    it('渲染带语言栏的代码块，语言含连字符时显示完整语言 id', async () => {
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'assistant', content: '```objective-c\nint x = 1;\n```', status: 'completed' }] });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent(/^objective-c$/));
    });

    it('markdownRenderProps.components 与内置代码块组件合并，undefined 项回退到内置组件', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '**hi**\n\n```js\nconst a = 1;\n```', status: 'completed' }],
            markdownRenderProps: { components: { strong: CustomStrong, code: undefined } },
        });
        await waitFor(() => expect(screen.getByTestId('custom-strong')).toHaveTextContent('hi'));
        expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js');
        expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('raw');
    });

    describe('代码块复制按钮', () => {
        let writeText: Mock<(value: string) => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        });
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });

        const codeChats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
        const findCopy = () =>
            waitFor(() => {
                const el = $(`.${prefix}-code-topSlot-copy-wrapper`);
                expect(el).not.toBeNull();
                return el as HTMLButtonElement;
            });

        it('保留焦点按钮，复制源码后改名', async () => {
            renderDialogue({ chats: codeChats });
            const button = await findCopy();
            expect(button).toHaveAccessibleName(text.copy);
            expect(button).toHaveAttribute('type', 'button');
            button.focus();
            await click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copySuccess));
            expect(document.activeElement).toBe(button);
            expect(writeText).toHaveBeenCalledWith('const a = 1;\n');
            expect($(`.${BASE_CLASS_PREFIX}-codeHighlight`)).toHaveTextContent('const a = 1;');
        });

        it('高亮插件把代码拆成多个元素时，复制的仍是带结尾换行的源码', async () => {
            interface HastNode {
                type: string;
                tagName?: string;
                value?: string;
                children?: HastNode[];
            }
            // splits the code text into spans, as a highlighter does
            const splitCode = () => (tree: HastNode) => {
                const walk = (node: HastNode) => {
                    if (node.tagName === 'code') {
                        node.children = node.children?.flatMap((child) => (child.type === 'text' ? (child.value ?? '').split(/(?<= )/).map((part) => ({ type: 'element', tagName: 'span', children: [{ type: 'text', value: part }] })) : [child]));
                        return;
                    }
                    node.children?.forEach(walk);
                };
                walk(tree);
            };
            const { container } = renderDialogue({ chats: codeChats, markdownRenderProps: { rehypePlugins: [splitCode] } });
            const button = await findCopy();
            expect(container.querySelectorAll(`.${prefix}-code code span`).length).toBeGreaterThan(1);
            await click(button);
            await waitFor(() => expect(writeText).toHaveBeenCalledWith('const a = 1;\n'));
        });

        it('显示已复制状态时不再次复制', async () => {
            renderDialogue({ chats: codeChats });
            const button = await findCopy();
            await click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copySuccess));
            await click(button);
            expect(writeText).toHaveBeenCalledTimes(1);
        });
    });
});

describe('AIChatDialogue 自定义渲染', () => {
    it('contentItem 渲染选中的项、按 item.name 区分 tool，其余渲染 defaultItem；messageText 渲染纯文本', async () => {
        const message = {
            id: '1',
            role: 'assistant',
            status: 'completed',
            content: [
                { type: 'function_call', name: 'search', arguments: '{}' },
                { type: 'function_call', name: 'other', arguments: '{}' },
                { type: 'reasoning', summary: [] },
            ],
        };
        const { container, store } = renderHost({ chats: [message], shown: { contentItem: true, messageText: true } });
        expect(container.querySelector('.custom-search')).toHaveTextContent('search');
        expect(container.querySelector('.custom-search')).toHaveClass(`${contentCls}-custom-renderer`);
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('1');
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('other');
        expect(container.querySelectorAll(`.${contentCls}-custom-renderer`)).toHaveLength(2);

        store.chats = [{ id: '2', role: 'assistant', content: 'plain', status: 'completed' }];
        flushSync();
        expect(container.querySelector('.custom-text')).toHaveTextContent('plain');
    });

    it('contentItem 递归到 message 内层项，同一 message 的多个内层项各自自定义', () => {
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                content: [
                    {
                        type: 'message',
                        role: 'assistant',
                        content: [
                            { type: 'output_text', text: 'a' },
                            { type: 'output_text', text: 'b' },
                        ],
                    },
                ],
            },
        ];
        const { container } = renderHost({ chats, shown: { contentItem: true } });
        expect(Array.from(container.querySelectorAll(`b.${contentCls}-custom-renderer`), (n) => n.textContent)).toEqual(['a', 'b']);
    });

    it('把默认节点传给 title、avatar、content、action snippet', () => {
        const { container } = renderHost({ shown: { title: true, avatar: true, content: true, action: true }, withDefaults: true });
        const titles = container.querySelectorAll<HTMLElement>('.custom-title');
        expect(titles).toHaveLength(2);
        expect(titles[0]).toHaveAttribute('data-role', 'User');
        expect(container.querySelectorAll(`.custom-title .${prefix}-title`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-avatar .${prefix}-avatar`)).toHaveLength(2);
        const contents = container.querySelectorAll<HTMLElement>(`.custom-content.${contentCls}`);
        expect(contents).toHaveLength(2);
        expect(contents[0]).toHaveAttribute('data-role', 'User');
        const actions = container.querySelectorAll<HTMLElement>('.custom-action');
        expect(actions[0]).toHaveClass(actionCls);
        expect(actions[0].querySelector('.keys')).toHaveTextContent('copyNode,editNode,moreNode,shareNode');
        expect(actions[1].querySelector('.keys')).toHaveTextContent('copyNode,dislikeNode,likeNode,moreNode,resetNode,shareNode');
        expect(within(actions[0]).getByRole('button', { name: text.edit })).toBeInTheDocument();
        expect(within(actions[1]).getByRole('button', { name: text.share })).toBeInTheDocument();
    });

    it('DefaultActionNodeObj 的键都是可选的，含 shareNode、editNode', () => {
        expectTypeOf<{ moreNode: ReturnType<typeof snippet> }>().toExtend<DefaultActionNodeObj>();
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('shareNode');
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('editNode');
    });

    it('fullDialogue 替换整个对话主体，收到的默认节点仍使用自定义 avatar 与 title', () => {
        const { container, store } = renderHost({ shown: { fullDialogue: true }, withDefaults: true });
        const full = container.querySelectorAll('.custom-full');
        expect(full).toHaveLength(2);
        expect(full[0]).toHaveClass(`${prefix}-container`);
        expect(full[0]).toHaveAttribute('data-role', roleConfig.user.name);
        expect(container.querySelectorAll(`.${prefix}-inner`)).toHaveLength(0);
        expect(full[0].querySelector(`.${prefix}-avatar`)).not.toBeNull();
        expect(full[0].querySelector(`.${prefix}-title`)).not.toBeNull();
        expect(full[0].querySelector(`.${contentCls}`)).not.toBeNull();
        expect(full[0].querySelector(`.${actionCls}`)).not.toBeNull();

        store.shown = { fullDialogue: true, avatar: true, title: true };
        flushSync();
        expect(container.querySelectorAll('.custom-full .custom-avatar')).toHaveLength(2);
        expect(container.querySelectorAll('.custom-full .custom-title')).toHaveLength(2);
    });

    it('通过 messageEdit 渲染编辑视图；未提供时编辑状态的用户消息仍显示正文', async () => {
        const chats = [{ id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true }];
        const { container, store } = renderHost({ chats, shown: { messageEdit: true } });
        expect(container.querySelector(`.${contentCls}-editing .editor`)).toHaveAttribute('data-count', '1');

        store.shown = {};
        flushSync();
        await waitFor(() => expect(screen.getByText('edit me')).toBeInTheDocument());
    });

    it('content snippet 的 defaultContent 带引用列表与加载指示', () => {
        const chats = [{ id: '1', role: 'assistant', content: '', status: 'queued', references: [{ id: 'r', type: 'file', name: 'doc.pdf', url: 'https://example.com/doc.pdf' }] }];
        const { container } = renderHost({ chats, shown: { content: true }, withDefaults: true });
        expect(container.querySelector(`.custom-content .${prefix}-references`)).not.toBeNull();
        expect(container.querySelector(`.custom-content .${contentCls}-loading`)).not.toBeNull();
    });

    it.each([
        ['avatar', `.${prefix}-avatar`],
        ['content', `.${prefix}-inner > .${contentCls}`],
        ['action', `.${actionCls}`],
        ['fullDialogue', `.${prefix}-container`],
    ] as const)('%s snippet 打开与关闭后不残留', (part, selector) => {
        const { container, store } = renderHost();
        const custom = `.custom-${part === 'fullDialogue' ? 'full' : part}`;
        // the custom node takes the class the snippet receives
        const defaultSelector = `${selector}:not(${custom})`;
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(2);

        store.shown = { [part]: true };
        flushSync();
        expect(Array.from(container.querySelectorAll(`${custom} .id`), (n) => n.textContent)).toEqual(['1', '2']);
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(0);

        store.shown = {};
        flushSync();
        expect(container.querySelectorAll(custom)).toHaveLength(0);
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(2);
    });
});

describe('AIChatDialogue 可访问名称', () => {
    it('根元素被命名时为 group，使用方的 role 优先', async () => {
        const { container, rerender } = renderDialogue();
        const rootEl = getRoot(container);
        expect(rootEl).not.toHaveAttribute('role');
        await rerender({ 'aria-label': 'dialogue' });
        expect(screen.getByRole('group', { name: 'dialogue' })).toBe(rootEl);
        await rerender({ 'aria-labelledby': 'heading', role: 'region' });
        expect(rootEl).toHaveAttribute('role', 'region');
    });

    it('选择框的名称从语言包读取', () => {
        renderDialogue({ selecting: true });
        expect(screen.getAllByRole('checkbox', { name: text.selectMessage })).toHaveLength(2);
    });

    it('头像 alt 为空，消息图片与引用图片带 alt', () => {
        const { container } = renderDialogue({
            showReference: true,
            chats: [
                { id: '1', role: 'user', status: 'completed', content: 'one' },
                {
                    id: '2',
                    role: 'user',
                    status: 'completed',
                    content: [{ type: 'message', content: [{ type: 'input_image', image_url: 'https://example.com/a.png' }] }],
                    references: [{ id: 'r', type: 'file', name: 'pic.png', url: 'https://example.com/r.png' }],
                },
            ],
        });
        expect([...container.querySelectorAll(`.${prefix}-avatar img`)].map((img) => img.getAttribute('alt'))).toEqual(['', '']);
        expect(screen.getByRole('img', { name: text.image })).toHaveAttribute('src', 'https://example.com/a.png');
        expect(container.querySelector('img[src="https://example.com/r.png"]')).toHaveAttribute('alt', '');
    });

    it('纯图标操作按钮的名称从语言包读取，点赞与点踩用 aria-pressed', () => {
        const { container } = renderDialogue();
        const [user, assistant] = Array.from(getWrappers(container), (w) => within(w.querySelector(`.${actionCls}`) as HTMLElement));
        for (const name of [text.copy, text.share, text.edit, text.more]) {
            expect(user.getByRole('button', { name })).toBeInTheDocument();
        }
        for (const name of [text.copy, text.regenerate, text.like, text.dislike, text.more]) {
            expect(assistant.getByRole('button', { name })).toBeInTheDocument();
        }
        expect(assistant.getByRole('button', { name: text.like })).toHaveAttribute('aria-pressed', 'false');
        expect(assistant.getByRole('button', { name: text.copy })).not.toHaveAttribute('aria-pressed');
    });

    it('消息列表是有名称的 log，最后一条回复未完成时为 busy', async () => {
        const { rerender } = renderDialogue();
        const log = screen.getByRole('log', { name: text.messages });
        expect(await within(log).findByText('world')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
        for (const status of ['queued', 'in_progress']) {
            await rerender({ chats: [baseChats[0], { ...baseChats[1], status }] });
            expect(log).toHaveAttribute('aria-busy', 'true');
        }
        await rerender({ chats: [baseChats[0], { ...baseChats[1], status: 'incomplete' }] });
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('步骤标题暴露其操作是否展开，没有 actions 的步骤头不是按钮', async () => {
        render(AIChatDialogue.Step, {
            props: {
                steps: [
                    { status: 'completed', summary: 'plain' },
                    { status: 'completed', summary: 'searched', actions: [{ summary: 'a', description: 'b' }] },
                ],
            },
        });
        expect(screen.queryByRole('button', { name: 'plain' })).toBeNull();
        const header = screen.getByRole('button', { name: 'searched' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        await click(header);
        expect(header).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.keyDown(header, { key: 'Enter' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('steps 换成同内容的新数组时保留已折叠的步骤，新增步骤展开', async () => {
        const step = (summary: string) => ({ status: 'completed', summary, actions: [{ summary: 'a', description: 'b' }] });
        const view = render(AIChatDialogue.Step, { props: { steps: [step('one')] } });
        await click(screen.getByRole('button', { name: 'one' }));
        await view.rerender({ steps: [step('one')] });
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        await view.rerender({ steps: [step('one'), step('two')] });
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('Step 的 actionIcon 为每个操作渲染图标并收到所在步骤', () => {
        const step = { status: 'completed', summary: 's', actions: [{ summary: 'a', description: 'desc' }] };
        let received: unknown;
        const actionIcon = createRawSnippet((args: () => unknown) => {
            received = args();
            return { render: () => '<i class="custom-icon"></i>' };
        });
        const { container } = render(AIChatDialogue.Step, { props: { steps: [step], actionIcon } });
        expect(container.querySelector(`.${prefix}-step-action-desc .custom-icon`)).not.toBeNull();
        expect(received).toEqual({ index: 0, stepIndex: 0, step, item: step.actions[0] });
    });
});

describe('AIChatDialogue 选择', () => {
    it('通过复选框与组件方法选择消息', async () => {
        const onSelect = vi.fn<(ids: string[]) => void>();
        const { container, handle } = renderDialogue({ selecting: true, onSelect });
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);

        await click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['2']);
        expect(getWrappers(container)[1]).toHaveClass(`${prefix}-wrapper-selected`);
        await click(checkboxes[0]);
        expect(onSelect).toHaveBeenLastCalledWith(['2', '1']);
        await click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['1']);

        handle.deselectAll();
        flushSync();
        expect(onSelect).toHaveBeenLastCalledWith([]);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);

        handle.selectAll();
        flushSync();
        expect(onSelect).toHaveBeenLastCalledWith(['1', '2']);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(2);
        expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'), (n) => n.checked)).toEqual([true, true]);
    });

    it('非选择状态下隐藏复选框与选中样式', () => {
        const { container, handle } = renderDialogue();
        handle.selectAll();
        flushSync();
        expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);
    });

    it('组件实例上暴露文档中的方法', () => {
        const { handle } = renderDialogue();
        for (const method of ['selectAll', 'deselectAll', 'scrollToBottom', 'scrollToTop'] as const) {
            expect(handle[method]).toBeTypeOf('function');
        }
    });

    it('选择状态不再报告已被删除的消息', async () => {
        const onSelect = vi.fn<(ids: string[]) => void>();
        const { rerender } = renderDialogue({ selecting: true, onSelect });
        for (const box of screen.getAllByRole('checkbox')) {
            await fireEvent.click(box);
        }
        await rerender({ chats: [baseChats[0]] });
        await fireEvent.click(screen.getByRole('checkbox'));
        expect(onSelect).toHaveBeenLastCalledWith([]);
    });
});

describe('AIChatDialogue 消息操作', () => {
    it('显示每种角色与状态允许的操作', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container);
        const icons = (wrapper: Element) => Array.from(wrapper.querySelectorAll(`.${actionCls} button .${BASE_CLASS_PREFIX}-icon`), (n) => (Array.from(n.classList).find((c) => c.startsWith(`${BASE_CLASS_PREFIX}-icon-`) && c !== `${BASE_CLASS_PREFIX}-icon-default`) as string).replace(`${BASE_CLASS_PREFIX}-icon-`, ''));
        expect(icons(user)).toEqual(['copy_stroked', 'share_stroked', 'edit_stroked', 'more_stroked']);
        expect(icons(assistant)).toEqual(['copy_stroked', 'redo_stroked', 'share_stroked', 'thumb_up_stroked', 'thumb_up_stroked', 'more_stroked']);
        expect(assistant.querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-show`);
        expect(user.querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-show`);
        expect(getActionButton(assistant, 'share_stroked')).toHaveClass(`${actionCls}-btn`);
        expect(getActionButton(user, 'edit_stroked')).toHaveClass(`${actionCls}-btn`);
    });

    it('仅在最后一条 assistant 消息上显示重置操作，showReset 为 false 时隐藏', async () => {
        const chats = [
            { id: '1', role: 'assistant', content: 'first', status: 'completed' },
            { id: '2', role: 'assistant', content: 'second', status: 'completed' },
        ];
        const { container, rerender } = renderDialogue({ chats });
        const [first, last] = getWrappers(container);
        expect(getActionButton(first, 'redo_stroked')).toBeNull();
        expect(getActionButton(last, 'redo_stroked')).not.toBeNull();
        await rerender({ showReset: false });
        expect(getActionButton(getWrappers(container)[1], 'redo_stroked')).toBeNull();
    });

    it('末条回复为 queued 时操作栏隐藏，为 incomplete 时可见', async () => {
        const { container, rerender } = renderDialogue({ chats: [baseChats[0], { id: '2', role: 'assistant', content: '', status: 'queued' }] });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-hidden`);
        await rerender({ chats: [baseChats[0], { id: '2', role: 'assistant', content: 'cut off', status: 'incomplete' }] });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-hidden`);
    });

    it('对消息点赞与点踩，未选中的点踩图标使用本组件的翻转类名', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const onMessageGoodFeedback = vi.fn<(message?: Message) => void>();
        const onMessageBadFeedback = vi.fn<(message?: Message) => void>();
        const chats = [{ id: '2', role: 'assistant', content: 'world', status: 'completed', dislike: true }];
        const { container, rerender } = renderDialogue({ chats, onChatsChange, onMessageGoodFeedback, onMessageBadFeedback });
        const [assistant] = getWrappers(container);
        const [like, dislike] = assistant.querySelectorAll(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-thumb_up_stroked`);
        expect(dislike).toBeUndefined();
        expect(assistant.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-like_thumb`)).toHaveClass(`${actionCls}-icon-flip`);

        await click(like.closest('button'));
        expect(onMessageGoodFeedback).toHaveBeenCalledWith(chats[0]);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: true, dislike: false }]);

        const liked = [{ ...chats[0], like: true, dislike: false }];
        await rerender({ chats: liked });
        const dislikeIcon = getWrappers(container)[0].querySelectorAll(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-thumb_up_stroked`)[0];
        expect(dislikeIcon).toHaveClass(`${actionCls}-icon-flip`);
        await click(dislikeIcon.closest('button'));
        expect(onMessageBadFeedback).toHaveBeenCalledWith(liked[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: false, dislike: true }]);
    });

    it('重置最后一条消息', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const onMessageReset = vi.fn<(message?: Message) => void>();
        const { container } = renderDialogue({ onChatsChange, onMessageReset });
        await click(getActionButton(getWrappers(container)[1], 'redo_stroked'));
        expect(onMessageReset).toHaveBeenCalledWith(baseChats[1]);
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next).toHaveLength(2);
        expect(next[0]).toEqual(baseChats[0]);
        expect(next[1]).toEqual(expect.objectContaining({ role: 'assistant', status: 'in_progress', content: '' }));
        expect(next[1].id).not.toBe('2');
    });

    it('切换用户消息的编辑状态，同一时间只有一条处于编辑，且不修改传入的 messages', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const onMessageEdit = vi.fn<(message?: Message) => void>();
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange, onMessageEdit });
        await click(getActionButton(getWrappers(container)[1], 'edit_stroked'));
        expect(onMessageEdit).toHaveBeenCalledWith(chats[1]);
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next.map((chat) => chat.editing)).toEqual([false, true]);
        expect(chats[0].editing).toBe(true);
    });

    it('分享消息', async () => {
        const onMessageShare = vi.fn<(message?: Message) => void>();
        const { container } = renderDialogue({ onMessageShare });
        await click(getActionButton(getWrappers(container)[1], 'share_stroked'));
        expect(onMessageShare).toHaveBeenCalledWith(baseChats[1]);
    });

    describe('复制', () => {
        let writeText: Mock<(value: string) => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<(value: string) => Promise<void>>(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        });
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const flush = async () => {
            await Promise.resolve();
            await Promise.resolve();
            flushSync();
        };

        it('复制字符串内容，写入成功后弹出提示', async () => {
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<(message?: Message) => void>();
            const { container } = renderDialogue({ onMessageCopy });
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('world');
            await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
            expect(success).toHaveBeenCalledWith({ content: text.copySuccess });
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(baseChats[1]);
        });

        it('写入完成前或失败时不触发 onMessageCopy，也不弹出提示', async () => {
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            let resolveWrite = () => {};
            writeText.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        resolveWrite = resolve;
                    })
            );
            const onMessageCopy = vi.fn<(message?: Message) => void>();
            const { container } = renderDialogue({ onMessageCopy });
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            expect(onMessageCopy).not.toHaveBeenCalled();
            resolveWrite();
            await flush();
            expect(onMessageCopy).toHaveBeenCalledTimes(1);

            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await flush();
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
            expect(success).toHaveBeenCalledTimes(1);
        });

        it('复制的文本不包含推理内容，合并数组 content 中的文本', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const { container } = renderDialogue({
                chats: [
                    {
                        id: '1',
                        role: 'assistant',
                        status: 'completed',
                        content: [
                            { type: 'reasoning', content: [{ type: 'reasoning_text', text: 'thinking' }] },
                            { type: 'message', content: [{ type: 'output_text', text: 'a' }, { text: 'b' }] },
                            { type: 'message', content: 'c' },
                        ],
                    },
                ],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('abc');
        });

        it('没有文本的消息既不写入也不回调', async () => {
            const onMessageCopy = vi.fn<(message?: Message) => void>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [
                    { id: '1', role: 'assistant', status: 'completed', content: '' },
                    { id: '2', role: 'assistant', status: 'completed', content: [{ type: 'function_call', name: 'f', arguments: '{}' }] },
                ],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await flush();
            expect(writeText).not.toHaveBeenCalled();
            expect(onMessageCopy).not.toHaveBeenCalled();
        });
    });

    it('确认后删除消息，onChatsChange 只上报一次', async () => {
        onTestFinished(() => {
            Modal.destroyAll();
            flushSync();
        });
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const onMessageDelete = vi.fn<(message?: Message) => void>();
        const { container } = renderDialogue({ onChatsChange, onMessageDelete });
        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        const item = await screen.findByText(text.delete);
        expect(getWrappers(container)[0].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-show`);
        await click(item.closest('[role="menuitem"]'));
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toHaveTextContent(text.deleteConfirm);
        expect(dialog).toHaveTextContent(text.deleteContent);
        const ok = await screen.findByRole('button', { name: zh_CN.Modal.confirm });
        expect(onMessageDelete).not.toHaveBeenCalled();
        await click(ok);
        expect(onMessageDelete).toHaveBeenCalledWith(baseChats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([baseChats[1]]);
        await waitFor(() => expect(getWrappers(container)).toHaveLength(1));
        expect(onChatsChange).toHaveBeenCalledTimes(1);
    });

    it('在更多菜单内 mousedown 不关闭菜单，在外部 mousedown 时关闭', async () => {
        const { container } = renderDialogue();
        const more = getActionButton(getWrappers(container)[0], 'more_stroked') as HTMLElement;
        await click(more);
        const item = await screen.findByText(text.delete);
        await fireEvent.mouseDown(item);
        expect(screen.getByText(text.delete)).toBeInTheDocument();
        expect(more).toHaveAttribute('aria-expanded', 'true');
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'false'));
    });

    it('更多菜单打开后按 Escape 关闭', async () => {
        renderDialogue();
        const more = screen.getAllByRole('button', { name: text.more }).at(-1) as HTMLElement;
        expect(more).toHaveAttribute('aria-haspopup', 'menu');
        expect(more).toHaveAttribute('aria-expanded', 'false');
        await click(more);
        const item = await screen.findByRole('menuitem');
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'true'));
        await fireEvent.keyDown(item, { key: 'Escape' });
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'false'));
    });

    it('删除确认框与复制提示的文案跟随包住对话框的 LocaleProvider', async () => {
        onTestFinished(() => {
            Modal.destroyAll();
            flushSync();
        });
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
        const { container } = renderHost({ locale: en_US });

        await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
        await waitFor(() => expect(success).toHaveBeenCalledWith({ content: en_US.AIChatDialogue.copySuccess }));

        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await click(await screen.findByRole('menuitem', { name: en_US.AIChatDialogue.delete }));
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toHaveTextContent(en_US.AIChatDialogue.deleteConfirm);
        expect(dialog).toHaveTextContent(en_US.AIChatDialogue.deleteContent);
    });
});

describe('AIChatDialogue 提示', () => {
    it('渲染提示，点击后追加一条用户消息', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const onHintClick = vi.fn<(hint: string) => void>();
        const { container } = renderDialogue({ hints: ['first', 'second'], hintCls: 'hint-cls', hintStyle: 'color: red', onChatsChange, onHintClick });
        const section = container.querySelector(`.${prefix}-hints`);
        expect(section).toHaveClass('hint-cls');
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        const items = container.querySelectorAll(`.${prefix}-hint-item`);
        expect(Array.from(items, (n) => n.textContent)).toEqual(['first', 'second']);

        await click(items[1]);
        expect(onHintClick).toHaveBeenCalledWith('second');
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next.slice(0, 2)).toEqual(baseChats);
        expect(next[2]).toEqual(expect.objectContaining({ role: 'user', content: 'second' }));

        await fireEvent.keyDown(container.querySelectorAll(`.${prefix}-hint-item`)[0], { key: 'Enter' });
        expect(onHintClick).toHaveBeenLastCalledWith('first');
    });

    it('渲染自定义提示框', async () => {
        const onHintClick = vi.fn<(hint: string) => void>();
        renderHost({ hints: ['custom'], shown: { hintBox: true }, props: { onHintClick } });
        await click(screen.getByText('box-custom'));
        expect(onHintClick).toHaveBeenCalledWith('custom');
    });

    it('选择状态下标记提示；挂载后再设置的 hints 也会显示', async () => {
        const { container, rerender } = renderDialogue({ selecting: true });
        await rerender({ hints: ['late'] });
        expect(screen.getByText('late')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-hints`)).toHaveClass(`${prefix}-hints-selecting`);
    });

    it('bind:chats 收到提示点击追加的消息，只上报一次', async () => {
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const { container, store } = renderHost({ hints: ['hint'], props: { onChatsChange } });
        await click(container.querySelector(`.${prefix}-hint-item`));
        expect(screen.getByTestId('count')).toHaveTextContent('3');
        expect(store.chats?.[2]).toEqual(expect.objectContaining({ role: 'user', content: 'hint' }));
        expect(getWrappers(container)).toHaveLength(3);
        await Promise.resolve();
        flushSync();
        expect(onChatsChange).toHaveBeenCalledTimes(1);
    });
});

describe('AIChatDialogue 滚动', () => {
    const streaming = (content: string) => [baseChats[0], { id: '2', role: 'assistant', content, status: 'in_progress' }];

    it('挂载时、有新消息时以及最后一条消息流式输出时滚动到底部', async () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        await rerender({ chats: streaming('ab') });
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        const added = [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }];
        await rerender({ chats: added });
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        await rerender({ chats: [...added] });
        expect(list.scrollTop).toBe(0);
    });

    it('新增提示时滚动到底部', async () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ hints: ['a'] });
        const list = getList(container);
        list.scrollTop = 0;
        await rerender({ hints: ['a', 'b'] });
        expect(list.scrollTop).toBe(1000);
    });

    it('向上滚动后停止跟随流式输出，直到有新消息', async () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        list.scrollTop = 700;
        await fireEvent.scroll(list);
        list.scrollTop = 0;
        await fireEvent.scroll(list);

        await rerender({ chats: streaming('ab') });
        expect(list.scrollTop).toBe(0);

        await rerender({ chats: [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }] });
        expect(list.scrollTop).toBe(1000);
    });

    it('$state 列表就地追加文本与 push 时上报 onChatsChange，并跟随滚动', async () => {
        mockListScroll();
        const onChatsChange = vi.fn<(chats: Message[]) => void>();
        const { container, store } = renderHost({ chats: streaming('a'), props: { onChatsChange } });
        const list = getList(container);

        list.scrollTop = 0;
        (store.chats as Message[])[1].content += 'b';
        flushSync();
        expect(list.scrollTop).toBe(1000);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(await screen.findByText('ab')).toBeInTheDocument();

        list.scrollTop = 0;
        store.chats?.push({ id: '3', role: 'user', content: 'next', status: 'completed' });
        flushSync();
        expect(list.scrollTop).toBe(1000);
        expect(onChatsChange).toHaveBeenCalledTimes(2);
        expect(getWrappers(container)).toHaveLength(3);
    });

    it('离开底部时显示回到底部按钮，并以动画返回', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container } = renderDialogue();
        const list = getList(container);
        const backBottom = () => container.querySelector(`.${prefix}-backBottom-button`);
        expect(backBottom()).toBeNull();

        list.scrollTop = 0;
        list.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(200);
        flushSync();
        expect(backBottom()).toHaveAccessibleName(text.backToBottom);

        (backBottom() as HTMLElement).click();
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);

        list.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(200);
        flushSync();
        expect(backBottom()).toBeNull();
    });

    it('回到底部按钮卸载时焦点交给消息列表', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container } = renderDialogue();
        const list = getList(container);
        list.scrollTop = 0;
        list.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(200);
        flushSync();
        (container.querySelector(`.${prefix}-backBottom-button`) as HTMLElement).focus();
        list.scrollTop = 1000;
        list.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(200);
        flushSync();
        expect(document.activeElement).toBe(list);
    });

    it('通过组件方法滚动', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container, handle } = renderDialogue();
        const list = getList(container);

        handle.scrollToTop(false);
        expect(list.scrollTop).toBe(0);
        handle.scrollToBottom(false);
        expect(list.scrollTop).toBe(1000);

        handle.scrollToTop(true);
        vi.advanceTimersByTime(16);
        expect(list.scrollTop).toBeGreaterThan(0);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(0);

        handle.scrollToBottom(true);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);
    });

    it('卸载时取消待执行的滚动测量', () => {
        const size = mockListScroll();
        const reads = vi.fn<() => number>(() => size.scrollHeight);
        const { container, unmount } = renderDialogue();
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        getList(container).dispatchEvent(new Event('scroll'));
        unmount();
        Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: reads });
        vi.advanceTimersByTime(200);
        expect(reads).not.toHaveBeenCalled();
    });
});
