import { type ComponentProps, type JSX, For, createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, type Mock, onTestFinished, vi } from 'vite-plus/test';
import { chatCompletionToMessage } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import type { Annotation, Step } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-solid/_utils/semi-global';
import type { AvatarProps } from '@fibrae/semi-ui-solid/avatar/index';
import LocaleProvider from '@fibrae/semi-ui-solid/locale/locale-provider';
import Modal from '@fibrae/semi-ui-solid/modal/index';
import Toast from '@fibrae/semi-ui-solid/toast/index';
import { countLiveListeners, endLeaveAnimations, sleep } from '@test/utils/solid';
import AIChatDialogue, { type AIChatDialogueElement, type AIChatDialogueProps, type DefaultActionNodeObj, type DialogueRenderConfig, type MarkdownRenderProps, type Message, type Metadata } from '../index';
import { ReferenceWidget } from '../widgets/content-item/reference';

type Props = AIChatDialogueProps;
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

const getRoot = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const getList = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefix}-list`) as HTMLElement;
const getWrappers = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>(`.${prefix}-wrapper`)];
const getActionButton = (wrapper: HTMLElement, icon: string) => wrapper.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-${icon}`)?.closest('button') ?? null;
const focusables = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>('button, input, a, [tabindex="0"]')];

// jsdom has no layout, so scroll metrics are faked on Element.prototype; scrollTop reads back what the component wrote
const scrollProps = ['scrollHeight', 'clientHeight', 'scrollTop'] as const;
let savedDescriptors: Record<string, PropertyDescriptor | undefined> = {};
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

// Props are spread from a signal, as a consumer does with a store: every key is notified on any change
function renderDialogue(props: Partial<Props> & Record<string, unknown> = {}, wrap?: (node: () => JSX.Element) => JSX.Element) {
    const ref = { current: undefined as unknown as AIChatDialogueElement };
    const [current, setCurrent] = createSignal<Props>({ chats: baseChats, roleConfig, ...props });
    const node = () => <AIChatDialogue ref={(el) => (ref.current = el)} {...current()} />;
    const result = render(() => (wrap ? wrap(node) : node()));
    const rerender = (next: Partial<Props> & Record<string, unknown>) => setCurrent({ chats: baseChats, roleConfig, ...next });
    return { ...result, ref, rerender };
}

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
        const wrappers = getWrappers(container);
        expect(getRoot(container)).toHaveClass(prefix);
        expect(wrappers).toHaveLength(2);
        expect(Array.from(container.querySelectorAll(`.${prefix}-title`), (n) => n.textContent)).toEqual(['User', 'Assistant']);
        const avatars = container.querySelectorAll(`.${prefix}-avatar img`);
        expect(Array.from(avatars, (n) => n.getAttribute('src'))).toEqual([roleConfig.user.avatar, roleConfig.assistant.avatar]);
        await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('在根元素上应用 class 与 style', () => {
        const { container } = renderDialogue({ class: 'custom', style: { color: 'red' } });
        expect(getRoot(container)).toHaveClass(prefix, 'custom');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('只有 align="leftRight" 时用户消息才右对齐', () => {
        const { container, rerender } = renderDialogue();
        const containers = container.querySelectorAll(`.${prefix}-container`);
        expect(containers[0]).toHaveClass(`${prefix}-container-right`);
        expect(containers[1]).not.toHaveClass(`${prefix}-container-right`);

        rerender({ align: 'leftAlign' });
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

    it('将 mode 映射为气泡类名', () => {
        const getBubbles = (container: HTMLElement) => Array.from(container.querySelectorAll(`.${contentCls}-inner > div`), (n) => n.className);
        const { container, rerender } = renderDialogue();
        expect(getBubbles(container)[0]).toContain(`${contentCls}-bubble`);
        expect(getBubbles(container)[0]).toContain(`${contentCls}-user`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-bubble`);

        rerender({ mode: 'noBubble' });
        expect(getBubbles(container)[0]).toContain(`${contentCls}-no-bubble`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-no-bubble`);

        rerender({ mode: 'userBubble' });
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
        await waitFor(() => expect(screen.getByText('from output')).toBeInTheDocument());
    });

    it('未声明属性落在根元素上，不落在消息项上', () => {
        const { container } = renderDialogue({ 'data-testid': 'dialogue', id: 'root-id' });
        expect(getRoot(container)).toHaveAttribute('data-testid', 'dialogue');
        expect(getRoot(container)).toHaveAttribute('id', 'root-id');
        for (const wrapper of getWrappers(container)) {
            expect(wrapper).not.toHaveAttribute('data-testid');
        }
    });

    it('渲染时没有控制台报错', async () => {
        const error = vi.spyOn(console, 'error');
        renderDialogue({
            selecting: true,
            hints: ['a hint'],
            showReference: true,
            markdownRenderProps: { class: 'md' },
            onMessageCopy: () => {},
            onMessageShare: () => {},
            dialogueRenderConfig: {},
            renderDialogueContentItem: {},
        });
        await waitFor(() => expect(screen.getByText('world')).toBeInTheDocument());
        expect(error).not.toHaveBeenCalled();
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { AIChatDialogue: { mode: 'noBubble' } };
        onTestFinished(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });
        const { container } = renderDialogue();
        expect(container.querySelector(`.${contentCls}-inner > div`)).toHaveClass(`${contentCls}-no-bubble`);
    });

    it('暴露静态组件与默认 markdown 组件', () => {
        expect(typeof AIChatDialogue.Reasoning).toBe('function');
        expect(typeof AIChatDialogue.Step).toBe('function');
        expect(typeof AIChatDialogue.Annotation).toBe('function');
        expect(typeof AIChatDialogue.defaultComponents.code).toBe('function');
    });

    it('Reasoning、Step、Annotation 把未声明属性透传到根元素', () => {
        const { container } = render(() => (
            <>
                <AIChatDialogue.Reasoning id="r" data-testid="reasoning" status="completed" summary={[]} />
                <AIChatDialogue.Step data-testid="step" aria-label="steps" steps={[]} />
                <AIChatDialogue.Annotation data-testid="annotation" title="sources" annotation={[]} maxCount={3} />
            </>
        ));
        expect(screen.getByTestId('reasoning')).toHaveClass(`${prefix}-reasoning-wrapper`);
        expect(screen.getByTestId('reasoning')).toHaveAttribute('id', 'r');
        expect(screen.getByTestId('step')).toHaveClass(`${prefix}-step-wrapper`);
        expect(screen.getByTestId('step')).toHaveAttribute('aria-label', 'steps');
        expect(screen.getByTestId('annotation')).toHaveClass(`${prefix}-annotation-wrapper`);
        expect(screen.getByTestId('annotation')).toHaveAttribute('title', 'sources');
        expect(container.children).toHaveLength(3);
    });

    it('chats 属性变化时更新，并通过 onChatsChange 上报', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const { container, rerender } = renderDialogue({ onChatsChange });
        expect(onChatsChange).not.toHaveBeenCalled();
        const next = [...baseChats, { id: '3', role: 'user', content: 'more', status: 'completed' }];
        rerender({ chats: next, onChatsChange });
        expect(getWrappers(container)).toHaveLength(3);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onChatsChange).toHaveBeenLastCalledWith(next);
    });
});

describe('AIChatDialogue 内容块', () => {
    it('渲染带注释的文本项，并上报注释点击', async () => {
        const onAnnotationClick = vi.fn<NonNullable<Props['onAnnotationClick']>>();
        const annotations = [
            { type: 'url_citation', title: 'A', url: 'https://a.example', logo: 'https://a.example/logo.png' },
            { type: 'file_citation', title: 'F' },
            { type: 'url_citation', title: 'B', url: 'https://b.example' },
        ];
        const { container } = renderDialogue({
            onAnnotationClick,
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'output_text', text: 'cited text', annotations }] }] }],
        });
        await waitFor(() => expect(screen.getByText('cited text')).toBeInTheDocument());
        const annotation = container.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement;
        expect(annotation).toHaveTextContent(`2 ${text.annotationText}`);
        fireEvent.click(annotation);
        expect(onAnnotationClick).toHaveBeenCalledWith([annotations[0], annotations[2]]);
        expectTypeOf<Parameters<NonNullable<Props['onAnnotationClick']>>>().toEqualTypeOf<[Annotation[]]>();
    });

    it('Enter 与 Space 激活 Annotation 时 onClick 收到事件对象，其他键不激活，传入的 onKeyDown 照常调用', () => {
        const onClick = vi.fn<NonNullable<ComponentProps<typeof AIChatDialogue.Annotation>['onClick']>>();
        const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(() => <AIChatDialogue.Annotation annotation={items} maxCount={3} onClick={onClick} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), items);
        expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
        fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement, { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(2);
        fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement, { key: 'a' });
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(onKeyDown).toHaveBeenCalledTimes(3);
    });

    it('渲染拒绝文本', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'refusal', refusal: 'cannot do' }] }] }] });
        await waitFor(() => expect(screen.getByText('cannot do')).toBeInTheDocument());
    });

    it('已完成的推理默认折叠，点击可切换', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'reasoning', status: 'completed', summary: [{ type: 'summary_text', text: 'thought' }] }] }],
        });
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`) as HTMLElement;
        const toggle = screen.getByRole('button', { name: text.reasoning.completed });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).not.toBeNull();
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
        await waitFor(() => expect(screen.getByText('thought')).toBeInTheDocument());
        fireEvent.click(toggle);
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

    it('渲染 function 与自定义 tool 调用', () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        { type: 'function_call', name: 'get_weather', arguments: '{"city":"x"}' },
                        { type: 'custom_tool_call', name: 'custom', input: 'args' },
                    ],
                },
            ],
        });
        const calls = container.querySelectorAll(`.${contentCls}-tool-call`);
        expect(Array.from(calls, (n) => n.textContent)).toEqual(['get_weather {"city":"x"}', 'custom args']);
    });

    it('渲染图片与文件附件，并支持点击回调', () => {
        const onImageClick = vi.fn<NonNullable<Props['onImageClick']>>();
        const onFileClick = vi.fn<NonNullable<Props['onFileClick']>>();
        const image = { type: 'input_image', image_url: 'https://example.com/a.png' };
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf', size: '1KB' };
        const { container, rerender } = renderDialogue({
            onImageClick,
            onFileClick,
            chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [image, file] }] }],
        });
        const img = container.querySelector(`.${contentCls}-img img`) as HTMLElement;
        expect(img).toHaveAttribute('src', image.image_url);
        fireEvent.click(img);
        expect(onImageClick).toHaveBeenCalledWith(image);

        const link = container.querySelector(`a.${contentCls}-file`) as HTMLElement;
        expect(link).toHaveAttribute('href', file.file_url);
        expect(link).toHaveTextContent('report.pdf');
        expect(link.querySelector(`.${contentCls}-file-icon-pdf`)).not.toBeNull();
        expect(fireEvent.click(link)).toBe(true);
        expect(onFileClick).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));

        rerender({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }], disabledFileItemClick: true, onFileClick });
        expect(fireEvent.click(container.querySelector(`a.${contentCls}-file`) as HTMLElement)).toBe(false);
        expect(onFileClick).toHaveBeenCalledTimes(2);
    });

    it('渲染消息引用', () => {
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
        expect(Array.from(refs, (n) => n.textContent)).toEqual(['doc.docx', 'quoted text']);
        expect(refs[0].querySelector(`.${prefix}-reference-icon-word`)).not.toBeNull();
    });

    it('除非 escapeHtml 为 false，否则转义用户消息中的 html', async () => {
        const chats = [{ id: '1', role: 'user', content: '<b>bold</b>', status: 'completed' }];
        const { container, rerender } = renderDialogue({ chats });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)).toHaveTextContent('<b>bold</b>'));
        rerender({ chats, escapeHtml: false });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)?.textContent).not.toContain('<b>'));
    });

    it('渲染带语言栏的代码块，语言含连字符时显示完整语言 id', async () => {
        const { container, rerender } = renderDialogue({ chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }] });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js'));
        rerender({ chats: [{ id: '1', role: 'assistant', content: '```objective-c\nint x = 1;\n```', status: 'completed' }] });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent(/^objective-c$/));
    });

    it('markdownRenderProps.components 与内置代码块组件合并，undefined 项回退到内置组件', async () => {
        const Strong = (props: { children?: JSX.Element }) => <b data-testid="custom-strong">{props.children}</b>;
        const content = '**hi**\n\n```js\nconst a = 1;\n```';
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content, status: 'completed' }],
            markdownRenderProps: { components: { strong: Strong, code: undefined } },
        });
        await waitFor(() => expect(screen.getByTestId('custom-strong')).toHaveTextContent('hi'));
        expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js');
        expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('raw');
        expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('ref');
    });

    describe('代码块复制按钮', () => {
        let writeText: Mock<() => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        });
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });

        const renderCode = async (wrap?: (node: () => JSX.Element) => JSX.Element) => {
            const result = renderDialogue({ chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }] }, wrap);
            const button = await waitFor(() => {
                const el = result.container.querySelector<HTMLButtonElement>(`.${prefix}-code-topSlot-copy-wrapper`);
                expect(el).not.toBeNull();
                return el as HTMLButtonElement;
            });
            return { ...result, button };
        };

        it('保留焦点按钮，复制后改名，且不提交表单', async () => {
            const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
            const { button } = await renderCode((node) => <form onSubmit={onSubmit}>{node()}</form>);
            expect(button).toHaveAccessibleName(text.copy);
            button.focus();
            fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copySuccess));
            expect(document.activeElement).toBe(button);
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('显示已复制状态时不再次复制', async () => {
            const { button } = await renderCode();
            fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copySuccess));
            fireEvent.click(button);
            expect(writeText).toHaveBeenCalledTimes(1);
        });
    });

    it('代码块的子节点不是字符串时不提供复制按钮', () => {
        const Code = AIChatDialogue.defaultComponents.code;
        const { container } = render(() => (
            <Code class="language-js">
                <span>const a = 1;</span>
            </Code>
        ));
        expect(container.querySelector(`.${prefix}-code-topSlot-copy-wrapper`)).toBeNull();
    });
});

describe('AIChatDialogue 自定义渲染', () => {
    it('通过 renderDialogueContentItem 渲染项，包括嵌套的 tool 名称与默认文本渲染器', () => {
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
        const { container, rerender } = renderDialogue({
            chats: [message],
            renderDialogueContentItem: {
                function_call: { search: (item) => <span class="custom-search">{item.name}</span> },
                reasoning: (_, msg) => <span class="custom-reasoning">{msg?.id}</span>,
            },
        });
        expect(container.querySelector('.custom-search')).toHaveTextContent('search');
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('1');
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('other');
        expect(container.querySelectorAll(`.${contentCls}-custom-renderer`)).toHaveLength(2);

        rerender({ chats: [{ id: '2', role: 'assistant', content: 'plain', status: 'completed' }], renderDialogueContentItem: { default: (value) => <span class="custom-default">{value}</span> } });
        expect(container.querySelector('.custom-default')).toHaveTextContent('plain');
    });

    it('同一 message 内多个内层项都可以自定义渲染', () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        {
                            type: 'message',
                            content: [
                                { type: 'output_text', text: 'a' },
                                { type: 'output_text', text: 'b' },
                            ],
                        },
                    ],
                },
            ],
            renderDialogueContentItem: { output_text: (item) => <b>{item.text}</b> },
        });
        expect(Array.from(container.querySelectorAll(`.${contentCls}-custom-renderer`), (n) => n.textContent)).toEqual(['a', 'b']);
    });

    it('把默认节点传给 dialogueRenderConfig 的渲染函数', () => {
        const renderDialogueTitle = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueTitle']>>((p) => (
            <div class="custom-title">
                {p.role?.name}
                {p.defaultTitle?.()}
            </div>
        ));
        const renderDialogueAvatar = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueAvatar']>>((p) => <div class="custom-avatar">{p.defaultAvatar?.()}</div>);
        const renderDialogueContent = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueContent']>>((p) => <div class={`custom-content ${p.class}`}>{p.defaultContent?.()}</div>);
        const renderDialogueAction = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueAction']>>((p) => (
            <div class={`custom-action ${p.class}`}>
                <For each={p.defaultActions}>{(action) => action()}</For>
                {p.defaultActionsObj?.moreNode?.()}
                <span class="keys">
                    {Object.keys(p.defaultActionsObj ?? {})
                        .sort()
                        .join(',')}
                </span>
            </div>
        ));
        const { container } = renderDialogue({ dialogueRenderConfig: { renderDialogueTitle, renderDialogueAvatar, renderDialogueContent, renderDialogueAction } });
        expect(container.querySelectorAll('.custom-title')).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-title .${prefix}-title`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-avatar .${prefix}-avatar`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-content.${contentCls}`)).toHaveLength(2);
        expect(renderDialogueContent).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0], role: roleConfig.user }));
        expect(renderDialogueTitle).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0], role: roleConfig.user }));
        const actions = container.querySelectorAll<HTMLElement>('.custom-action');
        expect(actions[0]).toHaveClass(actionCls);
        expect(actions[0].querySelector('.keys')).toHaveTextContent('copyNode,editNode,moreNode,shareNode');
        expect(actions[1].querySelector('.keys')).toHaveTextContent('copyNode,dislikeNode,likeNode,moreNode,resetNode,shareNode');
        expect(within(actions[0]).getByRole('button', { name: text.edit })).toBeInTheDocument();
        expect(within(actions[1]).getByRole('button', { name: text.share })).toBeInTheDocument();
    });

    it('DefaultActionNodeObj 的键都是可选的，含 shareNode、editNode', () => {
        expectTypeOf<{ moreNode: () => JSX.Element }>().toExtend<DefaultActionNodeObj>();
        expectTypeOf<{ moreNode: JSX.Element }>().not.toExtend<DefaultActionNodeObj>();
        expectTypeOf<NonNullable<Parameters<NonNullable<DialogueRenderConfig['renderDialogueAction']>>[0]['defaultActions']>>().toEqualTypeOf<(() => JSX.Element)[]>();
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('shareNode');
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('editNode');
    });

    it('renderFullDialogue 替换整个对话主体，并收到默认节点', () => {
        const renderFullDialogue = vi.fn<NonNullable<DialogueRenderConfig['renderFullDialogue']>>((p) => (
            <div class={`full ${p.class}`} data-role={p.role?.name}>
                {p.defaultNodes?.avatar?.()}
                <div class="full-main">
                    {p.defaultNodes?.title?.()}
                    {p.defaultNodes?.content?.()}
                    {p.defaultNodes?.action?.()}
                </div>
            </div>
        ));
        const { container } = renderDialogue({ dialogueRenderConfig: { renderFullDialogue } });
        const full = container.querySelectorAll('.full');
        expect(full).toHaveLength(2);
        expect(full[0]).toHaveClass(`${prefix}-container`);
        expect(full[0]).toHaveAttribute('data-role', roleConfig.user.name);
        expect(container.querySelectorAll(`.${prefix}-inner`)).toHaveLength(0);
        expect(full[0].querySelector(`.${prefix}-avatar`)).not.toBeNull();
        expect(full[0].querySelector(`.${prefix}-title`)).not.toBeNull();
        expect(full[0].querySelector(`.${contentCls}`)).not.toBeNull();
        expect(full[0].querySelector(`.${actionCls}`)).not.toBeNull();
        expect(renderFullDialogue).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0] }));
    });

    it('渲染函数只调用一次，参数随消息更新', () => {
        const renderFullDialogue = vi.fn<NonNullable<DialogueRenderConfig['renderFullDialogue']>>((p) => <div class="full">{p.message?.status}</div>);
        const { container, rerender } = renderDialogue({ dialogueRenderConfig: { renderFullDialogue }, chats: [{ ...baseChats[1], status: 'in_progress' }] });
        rerender({ dialogueRenderConfig: { renderFullDialogue }, chats: [baseChats[1]] });
        expect(renderFullDialogue).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.full')).toHaveTextContent('completed');
    });

    it('通过 messageEditRender 渲染编辑视图', () => {
        const messageEditRender = vi.fn<NonNullable<Props['messageEditRender']>>(() => <div class="editor">editor</div>);
        const { container } = renderDialogue({ messageEditRender, chats: [{ id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true }] });
        expect(container.querySelector(`.${contentCls}-editing .editor`)).not.toBeNull();
        expect(messageEditRender).toHaveBeenCalledWith(expect.objectContaining({ inputContents: expect.any(Array) }));
    });

    it('未传 messageEditRender 时，编辑状态的用户消息仍显示正文', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'user', content: 'keep me', status: 'completed', editing: true }] });
        await waitFor(() => expect(screen.getByText('keep me')).toBeInTheDocument());
    });

    it('renderDialogueContent 的 defaultContent 带引用列表与加载指示', () => {
        const chats = [{ id: '1', role: 'assistant', content: '', status: 'queued', references: [{ id: 'r', type: 'file', name: 'doc.pdf', url: 'https://example.com/doc.pdf' }] }];
        const { container } = renderDialogue({ chats, dialogueRenderConfig: { renderDialogueContent: (p) => <div class="custom-content">{p.defaultContent?.()}</div> } });
        expect(container.querySelector(`.custom-content .${prefix}-references`)).not.toBeNull();
        expect(container.querySelector(`.custom-content .${contentCls}-loading`)).not.toBeNull();
    });
});

describe('AIChatDialogue 可访问名称', () => {
    it('根元素带名称且未传 role 时为 group，使用方的 role 优先', () => {
        const { container, rerender } = renderDialogue({ 'aria-label': '对话' });
        const root = getRoot(container);
        expect(root).toHaveAttribute('role', 'group');
        rerender({ 'aria-labelledby': 'title' });
        expect(root).toHaveAttribute('role', 'group');
        rerender({});
        expect(root).not.toHaveAttribute('role');
        rerender({ 'aria-label': '对话', role: 'application' });
        expect(root).toHaveAttribute('role', 'application');
    });

    it('选择框的名称从语言包读取', () => {
        renderDialogue({ selecting: true });
        expect(screen.getAllByRole('checkbox', { name: text.selectMessage })).toHaveLength(2);
    });

    it('头像、消息图片与引用图标都带 alt', () => {
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

    it('大写扩展名的引用按图片渲染', () => {
        const { container } = render(() => <ReferenceWidget references={[{ id: 'r', type: 'file', name: 'A.PNG', url: 'https://example.com/upper.png' }]} />);
        expect(container.querySelector('img[src="https://example.com/upper.png"]')).not.toBeNull();
    });

    it('没有扩展名或以点开头的引用名不显示文件图标', () => {
        const references = [
            { id: 'a', type: 'file', name: 'doc' },
            { id: 'b', type: 'file', name: '.js' },
            { id: 'c', type: 'file', name: 'a.docx' },
        ];
        const { container } = render(() => <ReferenceWidget references={references} />);
        const refs = container.querySelectorAll(`.${prefix}-reference`);
        expect(Array.from(refs, (ref) => ref.querySelector(`.${prefix}-reference-icon`) !== null)).toEqual([false, false, true]);
    });

    it('纯图标操作按钮的名称从语言包读取', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container).map((w) => within(w.querySelector(`.${actionCls}`) as HTMLElement));
        for (const name of [text.copy, text.share, text.edit, text.more]) {
            expect(user.getByRole('button', { name })).toBeInTheDocument();
        }
        for (const name of [text.copy, text.regenerate, text.like, text.dislike, text.more]) {
            expect(assistant.getByRole('button', { name })).toBeInTheDocument();
        }
    });
});

describe('AIChatDialogue 选择', () => {
    it('通过复选框与 ref 方法选择消息', () => {
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const { container, ref } = renderDialogue({ selecting: true, onSelect });
        const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);

        fireEvent.click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['2']);
        expect(getWrappers(container)[1]).toHaveClass(`${prefix}-wrapper-selected`);
        fireEvent.click(checkboxes[0]);
        expect(onSelect).toHaveBeenLastCalledWith(['2', '1']);
        fireEvent.click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['1']);

        ref.current.deselectAll();
        expect(onSelect).toHaveBeenLastCalledWith([]);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);

        ref.current.selectAll();
        expect(onSelect).toHaveBeenLastCalledWith(['1', '2']);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(2);
        expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'), (n) => n.checked)).toEqual([true, true]);
    });

    it('非选择状态下隐藏复选框与选中样式', () => {
        const { container, ref } = renderDialogue();
        ref.current.selectAll();
        expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);
    });

    it('ref 是根元素，并带有文档中的方法', () => {
        const { container, ref } = renderDialogue();
        expect(ref.current).toBe(getRoot(container));
        for (const method of ['selectAll', 'deselectAll', 'scrollToBottom', 'scrollToTop'] as const) {
            expect(typeof ref.current[method]).toBe('function');
        }
    });

    it('选择状态不再报告已被删除的消息', () => {
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const { rerender } = renderDialogue({ selecting: true, onSelect });
        for (const box of screen.getAllByRole('checkbox')) {
            fireEvent.click(box);
        }
        rerender({ chats: [baseChats[0]], selecting: true, onSelect });
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onSelect).toHaveBeenLastCalledWith([]);
    });
});

describe('AIChatDialogue 消息操作', () => {
    it('显示每种角色与状态允许的操作', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container);
        const icons = (wrapper: HTMLElement) => Array.from(wrapper.querySelectorAll(`.${actionCls} button .${BASE_CLASS_PREFIX}-icon`), (n) => (Array.from(n.classList).find((c) => c.startsWith(`${BASE_CLASS_PREFIX}-icon-`) && c !== `${BASE_CLASS_PREFIX}-icon-default`) ?? '').replace(`${BASE_CLASS_PREFIX}-icon-`, ''));
        expect(icons(user)).toEqual(['copy_stroked', 'share_stroked', 'edit_stroked', 'more_stroked']);
        expect(icons(assistant)).toEqual(['copy_stroked', 'redo_stroked', 'share_stroked', 'thumb_up_stroked', 'thumb_up_stroked', 'more_stroked']);
        expect(assistant.querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-show`);
        expect(user.querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-show`);
    });

    it('仅在最后一条 assistant 消息上显示重置操作，showReset={false} 时隐藏', () => {
        const chats = [
            { id: '1', role: 'assistant', content: 'first', status: 'completed' },
            { id: '2', role: 'assistant', content: 'second', status: 'completed' },
        ];
        const { container, rerender } = renderDialogue({ chats });
        const [first, last] = getWrappers(container);
        expect(getActionButton(first, 'redo_stroked')).toBeNull();
        expect(getActionButton(last, 'redo_stroked')).not.toBeNull();
        rerender({ chats, showReset: false });
        expect(getActionButton(last, 'redo_stroked')).toBeNull();
    });

    it('对消息点赞与点踩，按钮用 aria-pressed 表示状态', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageGoodFeedback = vi.fn<NonNullable<Props['onMessageGoodFeedback']>>();
        const onMessageBadFeedback = vi.fn<NonNullable<Props['onMessageBadFeedback']>>();
        const chats = [{ id: '2', role: 'assistant', content: 'world', status: 'completed', dislike: true }];
        const { container, rerender } = renderDialogue({ chats, onChatsChange, onMessageGoodFeedback, onMessageBadFeedback });
        const [assistant] = getWrappers(container);
        expect(assistant.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-like_thumb`)).toHaveClass(`${actionCls}-icon-flip`);
        expect(screen.getByRole('button', { name: text.dislike })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: text.copy })).not.toHaveAttribute('aria-pressed');

        fireEvent.click(screen.getByRole('button', { name: text.like }));
        expect(onMessageGoodFeedback).toHaveBeenCalledWith(chats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: true, dislike: false }]);

        const liked = [{ ...chats[0], like: true, dislike: false }];
        rerender({ chats: liked, onChatsChange, onMessageBadFeedback });
        expect(screen.getByRole('button', { name: text.like })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: text.dislike }));
        expect(onMessageBadFeedback).toHaveBeenCalledWith(liked[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: false, dislike: true }]);
    });

    it('点踩按钮的未选中图标使用本组件的翻转类名', () => {
        const { container } = renderDialogue();
        const icons = getWrappers(container)[1].querySelectorAll(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-thumb_up_stroked`);
        expect(icons[1]).toHaveClass(`${actionCls}-icon-flip`);
    });

    it('重置最后一条消息，新回复不带旧回答的反馈和输出，并显示加载指示', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageReset = vi.fn<NonNullable<Props['onMessageReset']>>();
        const chats = [baseChats[0], { id: '2', role: 'assistant', status: 'completed', like: true, output_text: 'old', content: [{ type: 'message', content: [{ type: 'output_text', text: 'old' }] }] }];
        const { container, rerender } = renderDialogue({ chats, onChatsChange, onMessageReset });
        fireEvent.click(screen.getByRole('button', { name: text.regenerate }));
        expect(onMessageReset).toHaveBeenCalledWith(chats[1]);
        const next = onChatsChange.mock.lastCall?.[0] ?? [];
        expect(next).toHaveLength(2);
        expect(next[0]).toBe(chats[0]);
        expect(next[1]).toEqual(expect.objectContaining({ role: 'assistant', status: 'in_progress', content: '' }));
        expect(next[1].id).not.toBe('2');
        expect(next[1].like).toBeFalsy();
        expect(next[1].output_text).toBeUndefined();
        rerender({ chats: next });
        expect(container.querySelector(`.${contentCls}-loading`)).not.toBeNull();
    });

    it('切换用户消息的编辑状态，同一时间只保留一条且不修改传入的 messages', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageEdit = vi.fn<NonNullable<Props['onMessageEdit']>>();
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange, onMessageEdit });
        fireEvent.click(getActionButton(getWrappers(container)[1], 'edit_stroked') as HTMLElement);
        expect(onMessageEdit).toHaveBeenCalledWith(chats[1]);
        expect(onChatsChange.mock.lastCall?.[0].map((chat) => chat.editing)).toEqual([false, true]);
        expect(chats[0].editing).toBe(true);
    });

    it('分享消息，分享与编辑按钮带 btn 类名', () => {
        const onMessageShare = vi.fn<NonNullable<Props['onMessageShare']>>();
        const { container } = renderDialogue({ onMessageShare });
        const [user, assistant] = getWrappers(container);
        fireEvent.click(getActionButton(assistant, 'share_stroked') as HTMLElement);
        expect(onMessageShare).toHaveBeenCalledWith(baseChats[1]);
        expect(getActionButton(assistant, 'share_stroked')).toHaveClass(`${actionCls}-btn`);
        expect(getActionButton(user, 'edit_stroked')).toHaveClass(`${actionCls}-btn`);
    });

    describe('复制', () => {
        let writeText: Mock<() => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        });
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });

        it('复制字符串内容，写入成功后弹出提示', async () => {
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({ onMessageCopy });
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
            expect(writeText).toHaveBeenCalledWith('world');
            await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(baseChats[1]);
        });

        it('写入完成前或失败时不触发 onMessageCopy，也不弹出提示', async () => {
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            let resolveWrite = () => {};
            writeText.mockImplementation(() => new Promise<void>((resolve) => (resolveWrite = resolve)));
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({ onMessageCopy });
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
            expect(onMessageCopy).not.toHaveBeenCalled();
            resolveWrite();
            await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));

            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
            await sleep(10);
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
            expect(success).toHaveBeenCalledTimes(1);
        });

        it('复制的文本不包含推理内容，并合并数组 content 中的文本', () => {
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
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked') as HTMLElement);
            expect(writeText).toHaveBeenCalledWith('abc');
        });

        it('复制没有 content 的消息的 output_text，并忽略无文本的消息', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [
                    { id: '1', role: 'assistant', status: 'completed', output_text: 'from output' },
                    { id: '2', role: 'assistant', status: 'completed', content: '' },
                    { id: '3', role: 'assistant', status: 'completed', content: [{ type: 'function_call', name: 'f', arguments: '{}' }] },
                ],
            });
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked') as HTMLElement);
            expect(writeText).toHaveBeenCalledExactlyOnceWith('from output');
            await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
            fireEvent.click(getActionButton(getWrappers(container)[2], 'copy_stroked') as HTMLElement);
            await sleep(20);
            expect(writeText).toHaveBeenCalledTimes(1);
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
        });
    });

    it('确认后删除消息', async () => {
        onTestFinished(() => Modal.destroyAll());
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageDelete = vi.fn<NonNullable<Props['onMessageDelete']>>();
        const { container } = renderDialogue({ onChatsChange, onMessageDelete });
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked') as HTMLElement);
        const item = await screen.findByRole('menuitem', { name: text.delete });
        expect(getWrappers(container)[0].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-show`);
        fireEvent.click(item);
        const ok = await screen.findByRole('button', { name: zh_CN.Modal.confirm });
        expect(onMessageDelete).not.toHaveBeenCalled();
        fireEvent.click(ok);
        expect(onMessageDelete).toHaveBeenCalledWith(baseChats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([baseChats[1]]);
    });

    it('删除确认框与复制提示的文案跟随包住对话框的 LocaleProvider', async () => {
        onTestFinished(() => Modal.destroyAll());
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
        const [locale, setLocale] = createSignal(en_US);
        const { container } = renderDialogue({}, (node) => <LocaleProvider locale={locale()}>{node()}</LocaleProvider>);

        fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
        await waitFor(() => expect(success).toHaveBeenCalledWith({ content: en_US.AIChatDialogue.copySuccess }));

        setLocale(ja_JP);
        fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked') as HTMLElement);
        await waitFor(() => expect(success).toHaveBeenLastCalledWith({ content: ja_JP.AIChatDialogue.copySuccess }));

        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked') as HTMLElement);
        fireEvent.click(await screen.findByRole('menuitem', { name: ja_JP.AIChatDialogue.delete }));
        const dialog = await screen.findByRole('alertdialog', { name: ja_JP.AIChatDialogue.deleteConfirm });
        expect(dialog).toHaveTextContent(ja_JP.AIChatDialogue.deleteContent);
    });

    it('在更多菜单内 mousedown 不关闭菜单，在外部 mousedown 时关闭', async () => {
        const { container } = renderDialogue();
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked') as HTMLElement);
        fireEvent.mouseDown(await screen.findByText(text.delete));
        expect(screen.getByText(text.delete)).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByText(text.delete)).toBeNull();
        });
    });

    it('更多菜单打开后按 Escape 关闭', async () => {
        renderDialogue();
        fireEvent.click(screen.getAllByRole('button', { name: text.more }).at(-1) as HTMLElement);
        fireEvent.keyDown(await screen.findByRole('menuitem'), { key: 'Escape' });
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('menuitem')).toBeNull();
        });
    });

    it('卸载时移除外部 mousedown 监听', async () => {
        const added = vi.spyOn(window, 'addEventListener');
        const removed = vi.spyOn(window, 'removeEventListener');
        const { container, unmount } = renderDialogue();
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked') as HTMLElement);
        await screen.findByText(text.delete);
        expect(countLiveListeners(added, removed, 'mousedown')).toBeGreaterThan(0);
        unmount();
        expect(countLiveListeners(added, removed, 'mousedown')).toBe(0);
    });
});

describe('AIChatDialogue 提示', () => {
    it('渲染提示，点击后追加一条用户消息，Enter 与 Space 同样触发，其他键不触发', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
        const { container } = renderDialogue({ hints: ['first', 'second'], hintCls: 'hint-cls', hintStyle: { color: 'red' }, onChatsChange, onHintClick });
        const section = container.querySelector(`.${prefix}-hints`);
        expect(section).toHaveClass('hint-cls');
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        const items = container.querySelectorAll<HTMLElement>(`.${prefix}-hint-item`);
        expect(Array.from(items, (n) => n.textContent)).toEqual(['first', 'second']);

        fireEvent.click(items[1]);
        expect(onHintClick).toHaveBeenCalledWith('second');
        const next = onChatsChange.mock.lastCall?.[0] ?? [];
        expect(next.slice(0, 2)).toEqual(baseChats);
        expect(next[2]).toEqual(expect.objectContaining({ role: 'user', content: 'second' }));

        expect(fireEvent.keyDown(items[0], { key: 'Enter' })).toBe(false);
        expect(onHintClick).toHaveBeenLastCalledWith('first');

        onHintClick.mockClear();
        expect(fireEvent.keyDown(items[1], { key: ' ' })).toBe(false);
        expect(onHintClick).toHaveBeenCalledExactlyOnceWith('second');
        expect(fireEvent.keyDown(items[1], { key: 'a' })).toBe(true);
        expect(onHintClick).toHaveBeenCalledTimes(1);
        expectTypeOf<Message['createdAt']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<Message['editing']>().toEqualTypeOf<boolean | undefined>();
    });

    it('渲染自定义提示框', () => {
        const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
        renderDialogue({
            hints: ['custom'],
            onHintClick,
            renderHintBox: (p) => (
                <button type="button" onClick={() => p.onHintClick()}>
                    {`box-${p.content}`}
                </button>
            ),
        });
        fireEvent.click(screen.getByText('box-custom'));
        expect(onHintClick).toHaveBeenCalledWith('custom');
    });

    it('选择状态下标记提示，挂载后再设置的 hints 照常显示', () => {
        const { container, rerender } = renderDialogue();
        rerender({ hints: ['late'], selecting: true });
        expect(screen.getByText('late')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-hints`)).toHaveClass(`${prefix}-hints-selecting`);
    });
});

describe('AIChatDialogue 滚动', () => {
    const streaming = (content: string) => [baseChats[0], { id: '2', role: 'assistant', content, status: 'in_progress' }];

    it('挂载时、有新消息时以及最后一条消息流式输出时滚动到底部', () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        rerender({ chats: streaming('ab') });
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        const added = [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }];
        rerender({ chats: added });
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        rerender({ chats: [...added] });
        expect(list.scrollTop).toBe(0);
    });

    it('新增提示时滚动到底部', () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ hints: ['a'] });
        const list = getList(container);
        list.scrollTop = 0;
        rerender({ hints: ['a', 'b'] });
        expect(list.scrollTop).toBe(1000);
    });

    it('未使用滚轮向上滚动时停止跟随流式输出，直到有新消息', () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        list.scrollTop = 700;
        fireEvent.scroll(list);
        list.scrollTop = 0;
        fireEvent.scroll(list);

        rerender({ chats: streaming('ab') });
        expect(list.scrollTop).toBe(0);

        rerender({ chats: [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }] });
        expect(list.scrollTop).toBe(1000);
    });

    it('离开底部时显示回到底部按钮，并以动画返回', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container } = renderDialogue();
        const list = getList(container);
        const backBottom = () => container.querySelector<HTMLElement>(`.${prefix}-backBottom-button`);
        expect(backBottom()).toBeNull();

        list.scrollTop = 0;
        fireEvent.scroll(list);
        vi.advanceTimersByTime(200);
        expect(backBottom()).toHaveAccessibleName(text.backToBottom);

        fireEvent.click(backBottom() as HTMLElement);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);

        fireEvent.scroll(list);
        vi.advanceTimersByTime(200);
        expect(backBottom()).toBeNull();
    });

    it('通过 ref 方法滚动', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container, ref } = renderDialogue();
        const list = getList(container);

        ref.current.scrollToTop(false);
        expect(list.scrollTop).toBe(0);
        ref.current.scrollToBottom(false);
        expect(list.scrollTop).toBe(1000);

        ref.current.scrollToTop(true);
        vi.advanceTimersByTime(16);
        expect(list.scrollTop).toBeGreaterThan(0);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(0);

        ref.current.scrollToBottom(true);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);
    });

    it('卸载时取消待执行的滚动测量', () => {
        const size = mockListScroll();
        const reads = vi.fn<() => number>(() => size.scrollHeight);
        const { container, unmount } = renderDialogue();
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        fireEvent.scroll(getList(container));
        unmount();
        Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: reads });
        vi.advanceTimersByTime(200);
        expect(reads).not.toHaveBeenCalled();
    });
});

describe('AIChatDialogue 键盘与 live region', () => {
    it('消息列表是有名称的 log，最后一条回复未完成时为 busy', async () => {
        const { rerender } = renderDialogue();
        const log = screen.getByRole('log', { name: text.messages });
        expect(await within(log).findByText('world')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
        for (const status of ['queued', 'in_progress']) {
            rerender({ chats: [baseChats[0], { ...baseChats[1], status }] });
            expect(log).toHaveAttribute('aria-busy', 'true');
        }
        rerender({ chats: [baseChats[0], { ...baseChats[1], status: 'incomplete' }] });
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('末条回复为 queued 时操作栏隐藏，为 incomplete 时可见', () => {
        const { container, rerender } = renderDialogue({ chats: [baseChats[0], { id: '2', role: 'assistant', content: '', status: 'queued' }] });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-hidden`);
        rerender({ chats: [baseChats[0], { id: '2', role: 'assistant', content: 'cut off', status: 'incomplete' }] });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-hidden`);
    });

    it('文本消息的引用图标是原生 button', () => {
        const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
        renderDialogue({ showReference: true, onReferenceClick });
        const quote = screen.getByRole('button', { name: text.reference });
        expect(quote.tagName).toBe('BUTTON');
        expect(quote).toHaveAttribute('type', 'button');
        fireEvent.click(quote);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('文件卡片的引用图标支持 Enter 与 Space，其他键不响应，且不打开文件', () => {
        const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
        const onFileClick = vi.fn<NonNullable<Props['onFileClick']>>();
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf' };
        renderDialogue({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }], showReference: true, onReferenceClick, onFileClick });
        const quote = screen.getByRole('button', { name: text.reference });
        fireEvent.keyDown(quote, { key: 'Enter' });
        expect(fireEvent.keyDown(quote, { key: ' ' })).toBe(false);
        expect(onReferenceClick).toHaveBeenCalledTimes(2);
        fireEvent.keyDown(quote, { key: 'a' });
        expect(onReferenceClick).toHaveBeenCalledTimes(2);
        expect(onReferenceClick).toHaveBeenCalledWith({ name: 'report.pdf', url: 'https://example.com/r.pdf' });
        expect(onFileClick).not.toHaveBeenCalled();
    });

    it('步骤标题暴露其操作是否展开，Enter 与 Space 切换展开，没有 actions 的步骤头不是按钮', () => {
        render(() => (
            <AIChatDialogue.Step
                steps={[
                    { status: 'completed', summary: 'plain' },
                    { status: 'completed', summary: 'rich', actions: [{ summary: 'a', description: 'b' }] },
                ]}
            />
        ));
        expect(screen.queryByRole('button', { name: 'plain' })).toBeNull();
        const header = screen.getByRole('button', { name: 'rich' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(header);
        expect(header).toHaveAttribute('aria-expanded', 'false');
        fireEvent.keyDown(header, { key: 'Enter' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        fireEvent.keyDown(header, { key: ' ' });
        expect(header).toHaveAttribute('aria-expanded', 'false');
        fireEvent.keyDown(header, { key: 'a' });
        expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('steps 换成同内容的新数组时保留已折叠的步骤和焦点，新增步骤展开', () => {
        const step = (summary: string): Step => ({ status: 'completed', summary, actions: [{ summary: 'a', description: 'b' }] });
        const [steps, setSteps] = createSignal({ steps: [step('one')] });
        render(() => <AIChatDialogue.Step {...steps()} />);
        const one = screen.getByRole('button', { name: 'one' });
        one.focus();
        fireEvent.click(one);
        setSteps({ steps: [step('one')] });
        expect(screen.getByRole('button', { name: 'one' })).toBe(one);
        expect(one).toHaveAttribute('aria-expanded', 'false');
        setSteps({ steps: [step('one'), step('two')] });
        expect(one).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-expanded', 'true');
        expect(document.activeElement).toBe(one);
    });
});

describe('AIChatDialogue 节点与焦点保持', () => {
    const richChats = (answer: string, status = 'completed'): Message[] => [
        {
            id: '1',
            role: 'user',
            status: 'completed',
            content: [
                {
                    type: 'message',
                    content: [
                        { type: 'input_text', text: 'question' },
                        { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf' },
                    ],
                },
            ],
        },
        {
            id: '2',
            role: 'assistant',
            status,
            content: [
                { type: 'reasoning', status: 'completed', summary: [{ text: 'thought' }] },
                { type: 'message', content: [{ type: 'output_text', text: answer, annotations: [{ type: 'url_citation', title: 'A', url: 'https://a.example', logo: 'https://a.example/logo.png' }] }] },
            ],
        },
    ];

    it('无关属性变化时消息行、提示和其中的控件都不重建，焦点保持', async () => {
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const { container, rerender } = renderDialogue({ chats: richChats('answer'), hints: ['a', 'b'], selecting: true, showReference: true, onSelect });
        await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
        const rows = getWrappers(container);
        const controls = focusables(getList(container));
        expect(controls.length).toBeGreaterThan(10);
        const like = screen.getByRole('button', { name: text.like });
        like.focus();

        rerender({ chats: richChats('answer'), hints: ['a', 'b'], selecting: true, showReference: true, onSelect: vi.fn<NonNullable<Props['onSelect']>>(), 'data-x': '1', mode: 'noBubble' });
        expect(getWrappers(container)).toEqual(rows);
        expect(focusables(getList(container))).toEqual(controls);
        expect(document.activeElement).toBe(like);
    });

    it('流式更新最后一条回复时，之前的消息与回复自身的控件不重建，焦点保持', async () => {
        const { container, rerender } = renderDialogue({ chats: richChats('ans', 'in_progress'), showReference: true });
        await waitFor(() => expect(screen.getByText('ans')).toBeInTheDocument());
        const [first, second] = getWrappers(container);
        const firstControls = focusables(first);
        const reasoning = screen.getByRole('button', { name: text.reasoning.completed });
        const annotation = second.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement;
        const logo = annotation.querySelector('img[src="https://a.example/logo.png"]');
        expect(logo).not.toBeNull();
        const quote = screen.getAllByRole('button', { name: text.reference })[0];
        quote.focus();

        rerender({ chats: richChats('answer', 'in_progress'), showReference: true });
        await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
        expect(getWrappers(container)).toEqual([first, second]);
        expect(focusables(first)).toEqual(firstControls);
        expect(screen.getByRole('button', { name: text.reasoning.completed })).toBe(reasoning);
        expect(second.querySelector(`.${prefix}-annotation-wrapper`)).toBe(annotation);
        expect(annotation.querySelector('img[src="https://a.example/logo.png"]')).toBe(logo);
        expect(document.activeElement).toBe(quote);
    });

    it('流式更新时代码块的复制按钮不重建', async () => {
        const chat = (content: string): Message[] => [{ id: '1', role: 'assistant', status: 'in_progress', content }];
        const { container, rerender } = renderDialogue({ chats: chat('```js\nconst a = 1;\n```') });
        const copy = await waitFor(() => {
            const el = container.querySelector<HTMLButtonElement>(`.${prefix}-code-topSlot-copy-wrapper`);
            expect(el).not.toBeNull();
            return el as HTMLButtonElement;
        });
        copy.focus();
        rerender({ chats: chat('```js\nconst a = 1;\n```\n\nmore') });
        await waitFor(() => expect(screen.getByText('more')).toBeInTheDocument());
        expect(container.querySelector(`.${prefix}-code-topSlot-copy-wrapper`)).toBe(copy);
        expect(document.activeElement).toBe(copy);
    });

    it('无关属性变化或编辑中的消息换成新对象时，编辑器不重建，焦点保持', () => {
        const messageEditRender = vi.fn<NonNullable<Props['messageEditRender']>>(() => <input aria-label="editor" />);
        const chats = (): Message[] => [
            { id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true },
            { id: '2', role: 'assistant', content: 'world', status: 'completed' },
        ];
        const { rerender } = renderDialogue({ chats: chats(), messageEditRender });
        const editor = screen.getByRole('textbox', { name: 'editor' });
        editor.focus();

        rerender({ chats: chats(), messageEditRender, mode: 'noBubble', 'data-x': '1' });
        expect(screen.getByRole('textbox', { name: 'editor' })).toBe(editor);
        expect(document.activeElement).toBe(editor);
        expect(messageEditRender).toHaveBeenCalledTimes(1);
    });

    it('自定义渲染函数只在项变化时再次调用', () => {
        const renderer = vi.fn<(item: { name: string }) => JSX.Element>((item) => <button type="button">{item.name}</button>);
        const call = { type: 'function_call', name: 'search', arguments: '{}' };
        const chats = (): Message[] => [{ id: '1', role: 'assistant', status: 'completed', content: [call] }];
        const renderDialogueContentItem = { function_call: renderer };
        const { rerender } = renderDialogue({ chats: chats(), renderDialogueContentItem });
        const button = screen.getByRole('button', { name: 'search' });
        rerender({ chats: chats(), renderDialogueContentItem, mode: 'noBubble' });
        expect(renderer).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'search' })).toBe(button);
    });
});

describe('AIChatDialogue 已修复问题', () => {
    it('角色的 color 落到头像上', () => {
        const { container } = renderDialogue({ roleConfig: { ...roleConfig, user: { name: 'User', color: 'red' } } });
        expect(container.querySelector(`.${prefix}-avatar`)).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-red`);
    });

    it('没有 chats 属性时可重新渲染', () => {
        const [cls, setCls] = createSignal<string>();
        const { container } = render(() => <AIChatDialogue class={cls()} roleConfig={roleConfig} />);
        setCls('again');
        expect(getRoot(container)).toHaveClass('again');
    });

    it('渲染 roleConfig 中缺少角色的消息', () => {
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'tool', content: 'tool output', status: 'completed' }] });
        expect(getWrappers(container)).toHaveLength(1);
    });

    it('未设置 onAnnotationClick 时点击注释不报错', () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'output_text', text: 'x', annotations: [{ type: 'url_citation' }] }] }] }],
        });
        expect(() => fireEvent.click(container.querySelector(`.${prefix}-annotation-wrapper`) as HTMLElement)).not.toThrow();
    });

    it('数组 content 同时带 output_text 时，推理、注释与工具调用都可见', async () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    output_text: 'answer',
                    content: [
                        { type: 'reasoning', status: 'completed', content: [{ text: 'thinking' }] },
                        { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'answer', annotations: [{ type: 'url_citation', title: 'A', url: 'https://a.example' }] }] },
                        { type: 'function_call', name: 'get_weather', arguments: '{}' },
                    ],
                },
            ],
        });
        await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
        expect(container.querySelector(`.${prefix}-reasoning-wrapper`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-annotation-wrapper`)).toHaveTextContent(`1 ${text.annotationText}`);
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('get_weather');
    });

    it('Chat Completion 的自定义工具调用经适配器转换后可见', () => {
        const [message] = chatCompletionToMessage({
            id: 'c1',
            choices: [{ index: 0, message: { role: 'assistant', content: null, tool_calls: [{ id: 't1', type: 'custom', custom: { name: 'run_script', input: 'ls' } }] }, finish_reason: 'tool_calls' }],
        });
        const { container } = renderDialogue({ chats: [message] });
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('run_script ls');
    });

    it.each([
        ['扩展名大写', { filename: 'Report.PDF', file_url: 'https://example.com/r' }, 'pdf'],
        ['没有扩展名', { filename: 'README', file_url: 'https://example.com/r', fileInstance: { type: 'application/pdf' } }, 'pdf'],
    ])('文件卡片的类型：%s', (_, file, type) => {
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [{ type: 'input_file', size: '1KB', ...file }] }] }] });
        expect(container.querySelector(`.${contentCls}-file-type`)).toHaveTextContent(new RegExp(`^${type}$`));
    });

    it('webp 与 bmp 文件卡片显示图片预览', () => {
        for (const filename of ['a.webp', 'a.bmp']) {
            const { container, unmount } = renderDialogue({ chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [{ type: 'input_file', filename, file_url: 'https://example.com/a' }] }] }] });
            expect(container.querySelector(`.${contentCls}-file-icon-image`)).not.toBeNull();
            unmount();
        }
    });
});
