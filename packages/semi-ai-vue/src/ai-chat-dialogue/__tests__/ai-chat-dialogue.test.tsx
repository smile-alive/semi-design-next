/** @jsxImportSource vue */
import { type VNode, nextTick, reactive, toRaw } from 'vue';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi, type Mock } from 'vite-plus/test';
import { chatCompletionToMessage } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import type { Annotation } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-vue/_utils/semi-global';
import type { AvatarProps } from '@fibrae/semi-ui-vue/avatar/index';
import { LocaleProvider } from '@fibrae/semi-ui-vue/locale/index';
import Modal from '@fibrae/semi-ui-vue/modal/index';
import Toast from '@fibrae/semi-ui-vue/toast/index';
import { countLiveListeners, endLeaveAnimations, endTransitions, render, sleep } from '@test/utils/vue';
import AIChatDialogue from '..';
import DialogueAvatar from '../dialogue-avatar.vue';
import type { AIChatDialogueEmits, AIChatDialogueHandle, AIChatDialogueProps, DefaultActionNodeObj, MarkdownRenderProps, Message, Metadata } from '../interface';
import ReferenceWidget from '../widgets/content-item/reference.vue';
import ModelHost from './fixtures/model-host.vue';

type Emit<K extends keyof AIChatDialogueEmits> = (...args: AIChatDialogueEmits[K]) => void;
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

type Slots = Record<string, (props: never) => VNode | VNode[] | string>;
function renderDialogue(props: Partial<AIChatDialogueProps> & Record<string, unknown> = {}, slots?: Slots) {
    const view = render(AIChatDialogue, { props: { chats: baseChats, roleConfig, ...props }, slots });
    return {
        container: view.container,
        rerender: (next: Partial<AIChatDialogueProps> & Record<string, unknown>) => view.rerender(next),
        unmount: () => view.unmount(),
    };
}

function renderWithHandle(props: Partial<AIChatDialogueProps> & Record<string, unknown> = {}) {
    let handle: AIChatDialogueHandle | null = null;
    const setHandle = (instance: unknown) => {
        handle = instance as AIChatDialogueHandle | null;
    };
    const view = render(() => <AIChatDialogue ref={setHandle} chats={baseChats} roleConfig={roleConfig} {...props} />);
    return { ...view, handle: () => handle as unknown as AIChatDialogueHandle };
}

afterEach(() => {
    restoreListScroll();
    vi.useRealTimers();
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
        expect(await screen.findByText('hello')).toBeInTheDocument();
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('在根元素上应用 class 与 style', () => {
        const { container } = renderDialogue({ class: 'custom', style: { color: 'red' } });
        expect(getRoot(container)).toHaveClass(prefix, 'custom');
        expect(getRoot(container)).toHaveStyle({ color: 'rgb(255, 0, 0)' });
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

    it('不把 data-* 或未知属性放到消息项上', () => {
        const { container } = renderDialogue({ 'data-testid': 'dialogue' });
        for (const wrapper of getWrappers(container)) {
            expect(wrapper).not.toHaveAttribute('data-testid');
        }
    });

    it('渲染时没有 Vue 警告', async () => {
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
        expect(AIChatDialogue.Reasoning).toBeTypeOf('object');
        expect(AIChatDialogue.Step).toBeTypeOf('object');
        expect(AIChatDialogue.Annotation).toBeTypeOf('object');
        expect(AIChatDialogue.defaultComponents.code).toBeTypeOf('object');
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

    it('chats 属性变化时更新，并通过 chatsChange 上报', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const { container, rerender } = renderDialogue({ onChatsChange });
        expect(onChatsChange).not.toHaveBeenCalled();
        const next = [...baseChats, { id: '3', role: 'user', content: 'more', status: 'completed' }];
        await rerender({ chats: next });
        expect(getWrappers(container)).toHaveLength(3);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onChatsChange).toHaveBeenLastCalledWith(next);
    });
});

describe('AIChatDialogue 内容块', () => {
    it('渲染带注释的文本项，并上报注释点击', async () => {
        const onAnnotationClick = vi.fn<Emit<'annotationClick'>>();
        const annotations = [
            { type: 'url_citation', title: 'A', url: 'https://a.example', logo: 'https://a.example/logo.png' },
            { type: 'file_citation', title: 'F' },
            { type: 'url_citation', title: 'B', url: 'https://b.example' },
        ];
        const { container } = renderDialogue({
            onAnnotationClick,
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [{ type: 'message', content: [{ type: 'output_text', text: 'cited text', annotations }] }],
                },
            ],
        });
        expect(await screen.findByText('cited text')).toBeInTheDocument();
        const annotation = container.querySelector(`.${prefix}-annotation-wrapper`);
        expect(annotation).toHaveTextContent(`2 ${text.annotationText}`);
        await click(annotation);
        expect(onAnnotationClick).toHaveBeenCalledWith([annotations[0], annotations[2]]);
        expectTypeOf<AIChatDialogueEmits['annotationClick']>().toEqualTypeOf<[annotations: Annotation[]]>();
    });

    it('键盘激活 Annotation 时 click 收到事件对象', async () => {
        const onClick = vi.fn<(e: MouseEvent | KeyboardEvent, items: unknown[]) => void>();
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(AIChatDialogue.Annotation, { props: { annotation: items, maxCount: 3, onClick } });
        await fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as Element, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), items);
    });

    it('Annotation 传入的 keydown 监听在键盘激活之后照常调用', async () => {
        const order: string[] = [];
        const onClick = vi.fn<() => void>(() => order.push('click'));
        const onKeydown = vi.fn<(e: KeyboardEvent) => void>(() => order.push('keydown'));
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(AIChatDialogue.Annotation, {
            props: { annotation: items, maxCount: 3, onClick },
            attrs: { onKeydown },
        });
        await fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`) as Element, { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onKeydown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
        expect(order).toEqual(['click', 'keydown']);
    });

    it('渲染拒绝文本', async () => {
        renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [{ type: 'message', content: [{ type: 'refusal', refusal: 'cannot do' }] }],
                },
            ],
        });
        expect(await screen.findByText('cannot do')).toBeInTheDocument();
    });

    it('已完成的推理默认折叠，点击可切换', async () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        {
                            type: 'reasoning',
                            status: 'completed',
                            summary: [{ type: 'summary_text', text: 'thought' }],
                        },
                    ],
                },
            ],
        });
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`) as HTMLElement;
        const toggle = screen.getByRole('button', { name: text.reasoning.completed });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).not.toBeNull();
        await click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
        expect(await screen.findByText('thought')).toBeInTheDocument();
        await click(screen.getByText('thought'));
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('展开仍在进行中的推理', () => {
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'in_progress',
                    content: [{ type: 'reasoning', status: 'in_progress', content: [{ text: 'thinking' }] }],
                },
            ],
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
                        { type: 'custom_tool_call', name: 'custom', arguments: 'args' },
                    ],
                },
            ],
        });
        const calls = container.querySelectorAll(`.${contentCls}-tool-call`);
        expect(Array.from(calls, (n) => n.textContent)).toEqual(['get_weather {"city":"x"}', 'custom args']);
    });

    it('渲染图片与文件附件，并支持点击回调', async () => {
        const onImageClick = vi.fn<Emit<'imageClick'>>();
        const onFileClick = vi.fn<Emit<'fileClick'>>();
        const image = { type: 'input_image', image_url: 'https://example.com/a.png' };
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf', size: '1KB' };
        const { container, rerender } = renderDialogue({
            onImageClick,
            onFileClick,
            chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [image, file] }] }],
        });
        const img = container.querySelector(`.${contentCls}-img img`);
        expect(img).toHaveAttribute('src', image.image_url);
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

        await rerender({
            chats: [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }],
            disabledFileItemClick: true,
        });
        const prevented = new MouseEvent('click', { bubbles: true, cancelable: true });
        (container.querySelector(`a.${contentCls}-file`) as HTMLElement).dispatchEvent(prevented);
        expect(prevented.defaultPrevented).toBe(true);
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

    it('showReference 时在用户消息上显示引用图标', async () => {
        const onReferenceClick = vi.fn<Emit<'referenceClick'>>();
        const { container } = renderDialogue({ showReference: true, onReferenceClick });
        const icons = container.querySelectorAll(`.${contentCls}-icon-reference`);
        expect(icons).toHaveLength(1);
        await click(icons[0]);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('除非 escapeHtml 为 false，否则转义用户消息中的 html', async () => {
        const chats = [{ id: '1', role: 'user', content: '<b>bold</b>', status: 'completed' }];
        const { container, rerender } = renderDialogue({ chats });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)).toHaveTextContent('<b>bold</b>'));
        await rerender({ escapeHtml: false });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)?.textContent).not.toContain('<b>'));
    });

    it('渲染带语言栏的代码块', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }],
        });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js'));
    });

    it('markdownRenderProps.components 与内置代码块组件合并', async () => {
        const Strong = (_: unknown, { slots }: { slots: { default?: () => VNode[] } }) => <b data-testid="custom-strong">{slots.default?.()}</b>;
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '**hi**\n\n```js\nconst a = 1;\n```', status: 'completed' }],
            markdownRenderProps: { components: { strong: Strong } },
        });
        await waitFor(() => expect(screen.getByTestId('custom-strong')).toHaveTextContent('hi'));
        expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js');
        expectTypeOf<MarkdownRenderProps>().not.toHaveProperty('raw');
    });

    describe('代码块复制按钮', () => {
        let writeText: Mock<(text: string) => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
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

        it('保留焦点按钮，复制后改名，且不提交表单', async () => {
            const onSubmit = vi.fn<(e: Event) => void>((e) => e.preventDefault());
            render(() => (
                <form onSubmit={onSubmit}>
                    <AIChatDialogue chats={codeChats} roleConfig={roleConfig} />
                </form>
            ));
            const button = await findCopy();
            expect(button).toHaveAccessibleName(text.copy);
            button.focus();
            await click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(text.copySuccess));
            expect(document.activeElement).toBe(button);
            expect(onSubmit).not.toHaveBeenCalled();
            expect(writeText).toHaveBeenCalledWith('const a = 1;\n');
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
    it('通过 #contentItem 渲染项，按 item.name 区分 tool，并用 #messageText 渲染纯文本', async () => {
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
        const { container, rerender } = renderDialogue(
            { chats: [message] },
            {
                contentItem: ({ item, type, message: msg }: { item: { name?: string }; type?: string; message: Message }) => {
                    if (type === 'function_call' && item.name === 'search') {
                        return <span class="custom-search">{item.name}</span>;
                    }
                    return type === 'reasoning' ? <span class="custom-reasoning">{msg.id}</span> : [];
                },
                messageText: ({ text: value }: { text: string }) => <span class="custom-default">{value}</span>,
            }
        );
        expect(container.querySelector('.custom-search')).toHaveTextContent('search');
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('1');
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('other');
        expect(container.querySelectorAll(`.${contentCls}-custom-renderer`)).toHaveLength(2);

        await rerender({ chats: [{ id: '2', role: 'assistant', content: 'plain', status: 'completed' }] });
        expect(container.querySelector('.custom-default')).toHaveTextContent('plain');
    });

    it('把默认节点传给 #title、#avatar、#content、#action 插槽', () => {
        const titleSlot = vi.fn<(p: { defaultTitle: VNode; role?: { name?: string }; message: Message }) => VNode>(({ defaultTitle, role }) => (
            <div class="custom-title">
                {role?.name}
                {defaultTitle}
            </div>
        ));
        const contentSlot = vi.fn<(p: { defaultContent: VNode; class: string; message: Message }) => VNode>(({ defaultContent, class: cls }) => <div class={`custom-content ${cls}`}>{defaultContent}</div>);
        const { container } = renderDialogue(
            {},
            {
                title: titleSlot,
                avatar: ({ defaultAvatar }: { defaultAvatar: VNode }) => <div class="custom-avatar">{defaultAvatar}</div>,
                content: contentSlot,
                action: ({ defaultActions, defaultActionsObj, class: cls }: { defaultActions: VNode[]; defaultActionsObj: DefaultActionNodeObj; class: string }) => (
                    <div class={`custom-action ${cls}`}>
                        {defaultActions}
                        <span class="keys">{Object.keys(defaultActionsObj).sort().join(',')}</span>
                    </div>
                ),
            }
        );
        expect(container.querySelectorAll('.custom-title')).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-title .${prefix}-title`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-avatar .${prefix}-avatar`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-content.${contentCls}`)).toHaveLength(2);
        expect(contentSlot).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0] }));
        expect(titleSlot).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0], role: roleConfig.user }));
        const actions = container.querySelectorAll<HTMLElement>('.custom-action');
        expect(actions[0]).toHaveClass(actionCls);
        expect(actions[0].querySelector('.keys')).toHaveTextContent('copyNode,editNode,moreNode,shareNode');
        expect(actions[1].querySelector('.keys')).toHaveTextContent('copyNode,dislikeNode,likeNode,moreNode,resetNode,shareNode');
        expect(within(actions[0]).getByRole('button', { name: text.edit })).toBeInTheDocument();
        expect(within(actions[1]).getByRole('button', { name: text.share })).toBeInTheDocument();
    });

    it('DefaultActionNodeObj 的键都是可选的，含 shareNode、editNode', () => {
        expectTypeOf<{ moreNode: VNode }>().toExtend<DefaultActionNodeObj>();
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('shareNode');
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('editNode');
    });

    it('#fullDialogue 替换整个对话主体，并收到默认节点', () => {
        const fullSlot = vi.fn<(p: { defaultNodes: Record<'avatar' | 'title' | 'content' | 'action', VNode>; class: string; role?: { name?: string }; message: Message }) => VNode>(({ defaultNodes, class: cls, role }) => (
            <div class={`full ${cls}`} data-role={role?.name}>
                {defaultNodes.avatar}
                <div class="full-main">
                    {defaultNodes.title}
                    {defaultNodes.content}
                    {defaultNodes.action}
                </div>
            </div>
        ));
        const { container } = renderDialogue({}, { fullDialogue: fullSlot });
        const full = container.querySelectorAll('.full');
        expect(full).toHaveLength(2);
        expect(full[0]).toHaveClass(`${prefix}-container`);
        expect(full[0]).toHaveAttribute('data-role', roleConfig.user.name);
        expect(container.querySelectorAll(`.${prefix}-inner`)).toHaveLength(0);
        expect(full[0].querySelector(`.${prefix}-avatar`)).not.toBeNull();
        expect(full[0].querySelector(`.${prefix}-title`)).not.toBeNull();
        expect(full[0].querySelector(`.${contentCls}`)).not.toBeNull();
        expect(full[0].querySelector(`.${actionCls}`)).not.toBeNull();
        expect(fullSlot).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0] }));
    });

    it('通过 #messageEdit 渲染编辑视图', () => {
        const editSlot = vi.fn<(p: { inputContents?: unknown[] }) => VNode>(() => <div class="editor">editor</div>);
        const { container } = renderDialogue({ chats: [{ id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true }] }, { messageEdit: editSlot });
        expect(container.querySelector(`.${contentCls}-editing .editor`)).not.toBeNull();
        expect(editSlot).toHaveBeenCalledWith(expect.objectContaining({ inputContents: expect.any(Array) }));
    });
});

describe('AIChatDialogue 可访问名称', () => {
    it('根元素被命名时为 group，使用方的 role 优先', async () => {
        const { container, rerender } = renderDialogue();
        const rootEl = container.firstElementChild;
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

    it('无可见标题的头像以其角色命名', () => {
        const { container } = render(DialogueAvatar, {
            props: { message: baseChats[0], role: roleConfig.user, continueSend: true },
        });
        expect(container.querySelector('img')).toHaveAttribute('alt', 'User');
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
        const { container } = render(ReferenceWidget, {
            props: { references: [{ id: 'r', type: 'file', name: 'A.PNG', url: 'https://example.com/upper.png' }] },
        });
        expect(container.querySelector('img[src="https://example.com/upper.png"]')).not.toBeNull();
    });

    it('没有扩展名或以点开头的引用名不显示文件图标', () => {
        const references = [
            { id: 'a', type: 'file', name: 'doc' },
            { id: 'b', type: 'file', name: '.js' },
            { id: 'c', type: 'file', name: 'a.docx' },
        ];
        const { container } = render(ReferenceWidget, { props: { references } });
        const refs = container.querySelectorAll(`.${prefix}-reference`);
        expect(Array.from(refs, (ref) => ref.querySelector(`.${prefix}-reference-icon`) !== null)).toEqual([false, false, true]);
    });
});

describe('AIChatDialogue 选择', () => {
    it('通过复选框与 ref 方法选择消息', async () => {
        const onSelect = vi.fn<Emit<'select'>>();
        const { container, handle } = renderWithHandle({ selecting: true, onSelect });
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);

        await click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['2']);
        expect(getWrappers(container)[1]).toHaveClass(`${prefix}-wrapper-selected`);
        await click(checkboxes[0]);
        expect(onSelect).toHaveBeenLastCalledWith(['2', '1']);
        await click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['1']);

        handle().deselectAll();
        await nextTick();
        expect(onSelect).toHaveBeenLastCalledWith([]);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);

        handle().selectAll();
        await nextTick();
        expect(onSelect).toHaveBeenLastCalledWith(['1', '2']);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(2);
        expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'), (n) => n.checked)).toEqual([true, true]);
    });

    it('非选择状态下隐藏复选框与选中样式', async () => {
        const { container, handle } = renderWithHandle();
        handle().selectAll();
        await nextTick();
        expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);
    });

    it('ref 上暴露文档中的方法', () => {
        const { handle } = renderWithHandle();
        for (const method of ['selectAll', 'deselectAll', 'scrollToBottom', 'scrollToTop'] as const) {
            expect(handle()[method]).toBeTypeOf('function');
        }
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
    });

    it('仅在最后一条 assistant 消息上显示重置操作', () => {
        const chats = [
            { id: '1', role: 'assistant', content: 'first', status: 'completed' },
            { id: '2', role: 'assistant', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats });
        const [first, last] = getWrappers(container);
        expect(getActionButton(first, 'redo_stroked')).toBeNull();
        expect(getActionButton(last, 'redo_stroked')).not.toBeNull();
    });

    it('对消息点赞与点踩', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onMessageGoodFeedback = vi.fn<Emit<'messageGoodFeedback'>>();
        const onMessageBadFeedback = vi.fn<Emit<'messageBadFeedback'>>();
        const chats = [{ id: '2', role: 'assistant', content: 'world', status: 'completed', dislike: true }];
        const { container, rerender } = renderDialogue({
            chats,
            onChatsChange,
            onMessageGoodFeedback,
            onMessageBadFeedback,
        });
        const [assistant] = getWrappers(container);
        const [like, dislike] = assistant.querySelectorAll(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-thumb_up_stroked`);
        expect(dislike).toBeUndefined();
        expect(assistant.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-like_thumb`)).toHaveClass(`${actionCls}-icon-flip`);

        await click(like.closest('button'));
        expect(onMessageGoodFeedback).toHaveBeenCalledWith(chats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: true, dislike: false }]);

        const liked = [{ ...chats[0], like: true, dislike: false }];
        await rerender({ chats: liked });
        const dislikeButton = getWrappers(container)[0].querySelectorAll(`.${actionCls} button`)[4];
        await click(dislikeButton);
        expect(onMessageBadFeedback).toHaveBeenCalledWith(liked[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: false, dislike: true }]);
    });

    it('重置最后一条消息', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onMessageReset = vi.fn<Emit<'messageReset'>>();
        const { container } = renderDialogue({ onChatsChange, onMessageReset });
        await click(getActionButton(getWrappers(container)[1], 'redo_stroked'));
        expect(onMessageReset).toHaveBeenCalledWith(baseChats[1]);
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next).toHaveLength(2);
        // the harness passes props reactively, so the untouched message comes back as a proxy of the same object
        expect(toRaw(next[0])).toBe(baseChats[0]);
        expect(next[1]).toEqual(expect.objectContaining({ role: 'assistant', status: 'in_progress', content: '', createdAt: Date.now() }));
        expect(next[1]).not.toHaveProperty('createAt');
        expect(next[1].id).not.toBe('2');
    });

    it('切换用户消息的编辑状态', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onMessageEdit = vi.fn<Emit<'messageEdit'>>();
        const { container } = renderDialogue({ onChatsChange, onMessageEdit });
        await click(getActionButton(getWrappers(container)[0], 'edit_stroked'));
        expect(onMessageEdit).toHaveBeenCalledWith(baseChats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...baseChats[0], editing: true }, baseChats[1]]);
    });

    it('同一时间只保留一条消息处于编辑模式', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange });
        await click(getActionButton(getWrappers(container)[1], 'edit_stroked'));
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next.map((chat) => chat.editing)).toEqual([false, true]);
    });

    it('分享消息', async () => {
        const onMessageShare = vi.fn<Emit<'messageShare'>>();
        const { container } = renderDialogue({ onMessageShare });
        await click(getActionButton(getWrappers(container)[1], 'share_stroked'));
        expect(onMessageShare).toHaveBeenCalledWith(baseChats[1]);
    });

    it('分享与编辑按钮和其他操作按钮一样带 btn 类名', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container);
        expect(getActionButton(assistant, 'share_stroked')).toHaveClass(`${actionCls}-btn`);
        expect(getActionButton(user, 'edit_stroked')).toHaveClass(`${actionCls}-btn`);
    });

    describe('复制', () => {
        let writeText: Mock<(text: string) => Promise<void>>;
        beforeEach(() => {
            writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        });
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const flush = async () => {
            await Promise.resolve();
            await Promise.resolve();
            await nextTick();
        };

        it('复制字符串内容，写入成功后弹出提示', async () => {
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<Emit<'messageCopy'>>();
            const { container } = renderDialogue({ onMessageCopy });
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('world');
            await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
            expect(success).toHaveBeenCalledWith({ content: text.copySuccess });
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(baseChats[1]);
        });

        it('写入完成前或失败时不触发 messageCopy', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            let resolveWrite = () => {};
            writeText.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        resolveWrite = resolve;
                    })
            );
            const onMessageCopy = vi.fn<Emit<'messageCopy'>>();
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
        });

        it('复制的文本不包含推理内容', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const { container } = renderDialogue({
                chats: [
                    {
                        id: '1',
                        role: 'assistant',
                        status: 'completed',
                        content: [
                            { type: 'reasoning', content: [{ type: 'reasoning_text', text: 'thinking' }] },
                            { type: 'message', content: [{ type: 'output_text', text: 'answer' }] },
                        ],
                    },
                ],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('answer');
        });

        it('复制没有 content 的消息的 output_text，并忽略无文本的消息', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<Emit<'messageCopy'>>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [
                    { id: '1', role: 'assistant', status: 'completed', output_text: 'from output' },
                    { id: '2', role: 'assistant', status: 'completed', content: { unexpected: true } as never },
                ],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledExactlyOnceWith('from output');
            await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await flush();
            expect(writeText).toHaveBeenCalledTimes(1);
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
        });

        it('空字符串 content 既不写入也不回调', async () => {
            const onMessageCopy = vi.fn<Emit<'messageCopy'>>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [{ id: '1', role: 'assistant', status: 'completed', content: '' }],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            await flush();
            expect(writeText).not.toHaveBeenCalled();
            expect(onMessageCopy).not.toHaveBeenCalled();
        });

        it('合并数组 content 中的文本', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const { container } = renderDialogue({
                chats: [
                    {
                        id: '1',
                        role: 'assistant',
                        status: 'completed',
                        content: [
                            { type: 'message', content: [{ type: 'output_text', text: 'a' }, { text: 'b' }] },
                            { type: 'message', content: 'c' },
                        ],
                    },
                ],
            });
            await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('abc');
        });

        it('剪贴板写入被拒绝时不弹出提示', async () => {
            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const { container } = renderDialogue();
            await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await flush();
            expect(writeText).toHaveBeenCalledTimes(1);
            expect(success).not.toHaveBeenCalled();
        });
    });

    it('确认后删除消息', async () => {
        onTestFinished(async () => {
            Modal.destroyAll();
            await nextTick();
            // jsdom has no CSS, so Transition finishes the leave two frames later
            await endTransitions();
        });
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onMessageDelete = vi.fn<Emit<'messageDelete'>>();
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
    });

    it('在更多菜单内 mousedown 不关闭菜单', async () => {
        const { container } = renderDialogue();
        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        const item = await screen.findByText(text.delete);
        await fireEvent.mouseDown(item);
        expect(screen.getByText(text.delete)).toBeInTheDocument();
    });

    it('在外部 mousedown 时关闭更多菜单', async () => {
        const { container } = renderDialogue();
        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await screen.findByText(text.delete);
        await fireEvent.mouseDown(document.body);
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByText(text.delete)).toBeNull();
        });
    });
});

describe('AIChatDialogue 提示', () => {
    it('渲染提示，点击后追加一条用户消息', async () => {
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onHintClick = vi.fn<Emit<'hintClick'>>();
        const { container } = renderDialogue({
            hints: ['first', 'second'],
            hintCls: 'hint-cls',
            hintStyle: { color: 'red' },
            onChatsChange,
            onHintClick,
        });
        const section = container.querySelector(`.${prefix}-hints`);
        expect(section).toHaveClass('hint-cls');
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        const items = container.querySelectorAll(`.${prefix}-hint-item`);
        expect(Array.from(items, (n) => n.textContent)).toEqual(['first', 'second']);

        await click(items[1]);
        expect(onHintClick).toHaveBeenCalledWith('second');
        const [next] = onChatsChange.mock.lastCall as [Message[]];
        expect(next.slice(0, 2)).toEqual(baseChats);
        expect(next[2]).toEqual(expect.objectContaining({ role: 'user', content: 'second', createdAt: Date.now() }));

        await fireEvent.keyDown(items[0], { key: 'Enter' });
        expect(onHintClick).toHaveBeenLastCalledWith('first');
        expectTypeOf<Message['createdAt']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<Message['editing']>().toEqualTypeOf<boolean | undefined>();
    });

    it('渲染自定义提示框', async () => {
        const onHintClick = vi.fn<Emit<'hintClick'>>();
        renderDialogue(
            { hints: ['custom'], onHintClick },
            {
                hintBox: ({ content, onHintClick: onClick }: { content: string; onHintClick: () => void }) => <button type="button" onClick={onClick}>{`box-${content}`}</button>,
            }
        );
        await click(screen.getByText('box-custom'));
        expect(onHintClick).toHaveBeenCalledWith('custom');
    });

    it('选择状态下标记提示', () => {
        const { container } = renderDialogue({ hints: ['a'], selecting: true });
        expect(container.querySelector(`.${prefix}-hints`)).toHaveClass(`${prefix}-hints-selecting`);
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

    it('未使用滚轮向上滚动时停止跟随流式输出，直到有新消息', async () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        list.scrollTop = 700;
        await fireEvent.scroll(list);
        list.scrollTop = 0;
        await fireEvent.scroll(list);

        await rerender({ chats: streaming('ab') });
        expect(list.scrollTop).toBe(0);

        const added = [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }];
        await rerender({ chats: added });
        expect(list.scrollTop).toBe(1000);
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
        await nextTick();
        expect(backBottom()).not.toBeNull();

        (backBottom() as HTMLElement).click();
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);

        list.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(200);
        await nextTick();
        expect(backBottom()).toBeNull();
    });

    it('通过 ref 方法滚动', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container, handle } = renderWithHandle();
        const list = getList(container);

        handle().scrollToTop(false);
        expect(list.scrollTop).toBe(0);
        handle().scrollToBottom(false);
        expect(list.scrollTop).toBe(1000);

        handle().scrollToTop(true);
        vi.advanceTimersByTime(16);
        expect(list.scrollTop).toBeGreaterThan(0);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(0);

        handle().scrollToBottom(true);
        vi.advanceTimersByTime(500);
        expect(list.scrollTop).toBe(1000);
    });
});

describe('AIChatDialogue 已修复问题', () => {
    it('把 data-* 属性放到根元素上', () => {
        const { container } = renderDialogue({ 'data-testid': 'dialogue', id: 'root-id' });
        expect(getRoot(container)).toHaveAttribute('data-testid', 'dialogue');
        expect(getRoot(container)).toHaveAttribute('id', 'root-id');
    });

    it('接受挂载后再设置的 hints（挂载时无 hints）', async () => {
        const { rerender } = renderDialogue();
        await rerender({ hints: ['late'] });
        expect(screen.getByText('late')).toBeInTheDocument();
    });

    it('没有 chats 属性时可重新渲染', async () => {
        const view = render(AIChatDialogue, { props: { roleConfig } });
        const { container } = view;
        await view.rerender({ roleConfig: { ...roleConfig } });
        expect(getRoot(container)).toHaveClass(prefix);
        expect(getWrappers(container)).toHaveLength(0);
    });

    it('渲染 roleConfig 中缺少角色的消息', () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'tool', content: 'tool output', status: 'completed' }],
        });
        expect(getWrappers(container)).toHaveLength(1);
    });

    it('未监听 annotationClick 时点击注释不报错', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        {
                            type: 'message',
                            content: [{ type: 'output_text', text: 'x', annotations: [{ type: 'url_citation' }] }],
                        },
                    ],
                },
            ],
        });
        await click(container.querySelector(`.${prefix}-annotation-wrapper`));
        expect(error).not.toHaveBeenCalled();
    });

    it('把角色传给 #content', () => {
        const contentSlot = vi.fn<(p: { defaultContent: VNode; role?: unknown }) => VNode>(({ defaultContent }) => defaultContent);
        renderDialogue({}, { content: contentSlot });
        expect(contentSlot).toHaveBeenCalledWith(expect.objectContaining({ role: roleConfig.user }));
    });

    it('showReset 为 false 时隐藏重置操作', () => {
        const { container } = renderDialogue({ showReset: false });
        expect(getActionButton(getWrappers(container)[1], 'redo_stroked')).toBeNull();
    });

    it('ref 上只暴露文档中的方法', () => {
        const { handle } = renderWithHandle();
        expect(Object.keys(handle()).sort()).toEqual(['deselectAll', 'scrollToBottom', 'scrollToTop', 'selectAll']);
    });

    it('卸载时移除外部 mousedown 监听', async () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const { container, unmount } = renderDialogue();
        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await screen.findByText(text.delete);
        expect(countLiveListeners(added, removed, 'mousedown')).toBeGreaterThan(0);
        unmount();
        expect(countLiveListeners(added, removed, 'mousedown')).toBe(0);
    });

    it('切换编辑消息时不修改传入的 messages', async () => {
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange: () => {} });
        await click(getActionButton(getWrappers(container)[1], 'edit_stroked'));
        expect(chats[0].editing).toBe(true);
    });

    it('纯图标操作按钮的名称从语言包读取', () => {
        const { container } = renderDialogue();
        const [user, assistant] = Array.from(getWrappers(container), (w) => within(w.querySelector(`.${actionCls}`) as HTMLElement));
        for (const name of [text.copy, text.share, text.edit, text.more]) {
            expect(user.getByRole('button', { name })).toBeInTheDocument();
        }
        for (const name of [text.copy, text.regenerate, text.like, text.dislike, text.more]) {
            expect(assistant.getByRole('button', { name })).toBeInTheDocument();
        }
    });
});

describe('AIChatDialogue 键盘与 live region', () => {
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
        await rerender({ chats: baseChats });
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('文本消息的引用图标是原生 button', async () => {
        const onReferenceClick = vi.fn<Emit<'referenceClick'>>();
        renderDialogue({ showReference: true, onReferenceClick });
        const quote = screen.getByRole('button', { name: text.reference });
        expect(quote.tagName).toBe('BUTTON');
        expect(quote).toHaveAttribute('type', 'button');
        await click(quote);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('文件卡片的引用图标支持 Enter 与 Space，且不打开文件', async () => {
        const onReferenceClick = vi.fn<Emit<'referenceClick'>>();
        const onFileClick = vi.fn<Emit<'fileClick'>>();
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf' };
        const chats = [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }];
        renderDialogue({ chats, showReference: true, onReferenceClick, onFileClick });
        const quote = screen.getByRole('button', { name: text.reference });
        await fireEvent.keyDown(quote, { key: 'Enter' });
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        quote.dispatchEvent(space);
        expect(space.defaultPrevented).toBe(true);
        expect(onReferenceClick).toHaveBeenCalledTimes(2);
        expect(onReferenceClick).toHaveBeenCalledWith({ name: 'report.pdf', url: 'https://example.com/r.pdf' });
        expect(onFileClick).not.toHaveBeenCalled();
    });

    it('步骤标题暴露其操作是否展开', async () => {
        render(AIChatDialogue.Step, {
            props: {
                steps: [{ status: 'completed', summary: 'searched', actions: [{ summary: 'a', description: 'b' }] }],
            },
        });
        const header = screen.getByRole('button', { name: 'searched' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        await click(header);
        expect(header).toHaveAttribute('aria-expanded', 'false');
        await fireEvent.keyDown(header, { key: 'Enter' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('AIChatDialogue 代码审计修复', () => {
    it('数组 content 同时带 output_text 时仍渲染推理块', () => {
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                output_text: 'answer',
                content: [
                    { type: 'reasoning', status: 'completed', content: [{ text: 'thinking' }] },
                    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'answer' }] },
                ],
            },
        ];
        const { container } = renderDialogue({ chats });
        expect(container.querySelector(`.${prefix}-reasoning-wrapper`)).not.toBeNull();
    });

    it('数组 content 同时带 output_text 时，注释与工具调用也可见', async () => {
        const annotations = [{ type: 'url_citation', title: 'A', url: 'https://a.example' }];
        const { container } = renderDialogue({
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    output_text: 'answer',
                    content: [
                        {
                            type: 'message',
                            role: 'assistant',
                            content: [{ type: 'output_text', text: 'answer', annotations }],
                        },
                        { type: 'function_call', name: 'get_weather', arguments: '{}' },
                    ],
                },
            ],
        });
        expect(await screen.findByText('answer')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}-annotation-wrapper`)).toHaveTextContent(`1 ${text.annotationText}`);
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('get_weather');
    });

    it('点踩按钮的未选中图标使用本组件的翻转类名', () => {
        const { container } = renderDialogue();
        const assistant = getWrappers(container)[1];
        const icons = assistant.querySelectorAll(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-thumb_up_stroked`);
        expect(icons[1]).toHaveClass(`${actionCls}-icon-flip`);
        expect(icons[1]).not.toHaveClass('semi-chat-chatBox-action-icon-flip');
    });

    it('Chat Completion 的自定义工具调用经适配器转换后可见', () => {
        const [message] = chatCompletionToMessage({
            id: 'c1',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: null,
                        tool_calls: [{ id: 't1', type: 'custom', custom: { name: 'run_script', input: 'ls' } }],
                    },
                    finish_reason: 'tool_calls',
                },
            ],
        });
        const { container } = renderDialogue({ chats: [message] });
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('run_script');
    });

    it('自定义工具调用显示 input', () => {
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                content: [{ type: 'custom_tool_call', name: 'run', input: 'ls -la' }],
            },
        ];
        const { container } = renderDialogue({ chats });
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('run ls -la');
    });

    it('同一 message 内多个内层项配置自定义渲染时没有重复 key 警告', () => {
        const warn = vi.spyOn(console, 'warn');
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
        const { container } = renderDialogue(
            { chats },
            {
                contentItem: ({ item, type }: { item: { text?: string }; type?: string }) => (type === 'output_text' ? <b>{item.text}</b> : []),
            }
        );
        expect(Array.from(container.querySelectorAll(`.${contentCls}-custom-renderer b`), (n) => n.textContent)).toEqual(['a', 'b']);
        expect(warn).not.toHaveBeenCalled();
    });

    it('数组 content 只有工具调用时复制既不写入也不回调', async () => {
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const onMessageCopy = vi.fn<Emit<'messageCopy'>>();
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                content: [{ type: 'function_call', name: 'f', arguments: '{}' }],
            },
        ];
        const { container } = renderDialogue({ chats, onMessageCopy });
        await click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
        await sleep(20);
        expect(writeText).not.toHaveBeenCalled();
        expect(onMessageCopy).not.toHaveBeenCalled();
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

    it('代码围栏的语言含连字符时语言栏显示完整语言 id', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '```objective-c\nint x = 1;\n```', status: 'completed' }],
        });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent(/^objective-c$/));
    });

    it('steps 换成同内容的新数组时保留已折叠的步骤，新增步骤展开', async () => {
        const step = (summary: string) => ({
            status: 'completed',
            summary,
            actions: [{ summary: 'a', description: 'b' }],
        });
        const view = render(AIChatDialogue.Step, { props: { steps: [step('one')] } });
        await click(screen.getByRole('button', { name: 'one' }));
        await view.rerender({ steps: [step('one')] });
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        await view.rerender({ steps: [step('one'), step('two')] });
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('#hintBox 返回不带 key 的元素时没有 key 警告', () => {
        const warn = vi.spyOn(console, 'warn');
        renderDialogue({ hints: ['a', 'b'] }, { hintBox: ({ content }: { content: string }) => <span>{content}</span> });
        expect(screen.getByText('b')).toBeInTheDocument();
        expect(warn).not.toHaveBeenCalled();
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
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByRole('menuitem')).toBeNull();
        });
    });
});

describe('AIChatDialogue Vue 写法', () => {
    it('reactive 数组就地追加文本与 push 时上报 update:chats 与 chatsChange，并跟随滚动', async () => {
        mockListScroll();
        const chats = reactive<Message[]>([baseChats[0], { id: '2', role: 'assistant', content: 'a', status: 'in_progress' }]);
        const onChatsChange = vi.fn<Emit<'chatsChange'>>();
        const onUpdateChats = vi.fn<Emit<'update:chats'>>();
        const { container } = renderDialogue({ chats, onChatsChange, 'onUpdate:chats': onUpdateChats });
        const list = getList(container);

        list.scrollTop = 0;
        chats[1].content += 'b';
        await nextTick();
        expect(list.scrollTop).toBe(1000);
        expect(onChatsChange).toHaveBeenCalledTimes(1);
        expect(onUpdateChats).toHaveBeenCalledTimes(1);
        expect(onUpdateChats.mock.lastCall?.[0]).toBe(onChatsChange.mock.lastCall?.[0]);
        expect(await screen.findByText('ab')).toBeInTheDocument();

        list.scrollTop = 0;
        chats.push({ id: '3', role: 'user', content: 'next', status: 'completed' });
        await nextTick();
        expect(list.scrollTop).toBe(1000);
        expect(onChatsChange).toHaveBeenCalledTimes(2);
        expect(getWrappers(container)).toHaveLength(3);
    });

    it('v-model:chats 收到提示点击追加的消息，v-if 包住的模板插槽切换后不残留', async () => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(ModelHost);
        expect(Array.from(container.querySelectorAll('.custom-title'), (n) => n.textContent)).toEqual(['1', '2']);
        expect(container.querySelectorAll('.custom-text')).toHaveLength(2);

        await click(container.querySelector(`.${prefix}-hint-item`));
        expect(screen.getByTestId('count')).toHaveTextContent('3');
        expect(container.querySelectorAll('.custom-title')).toHaveLength(3);
        expect(container.querySelectorAll('.custom-text')).toHaveLength(3);

        await click(screen.getByText('toggle title'));
        expect(container.querySelectorAll('.custom-title')).toHaveLength(0);
        expect(Array.from(container.querySelectorAll(`.${prefix}-title`), (n) => n.textContent)).toEqual(['User', 'Assistant', 'User']);
        expect(warn).not.toHaveBeenCalled();
    });

    it.each([
        ['avatar', `.${prefix}-avatar`],
        ['content', `.${prefix}-inner > .${contentCls}`],
        ['action', `.${actionCls}`],
        ['fullDialogue', `.${prefix}-container`],
    ])('v-if 包住的 #%s 打开与关闭后不残留', async (part, defaultSelector) => {
        const warn = vi.spyOn(console, 'warn');
        const { container } = render(ModelHost);
        const custom = `.custom-${part === 'fullDialogue' ? 'full' : part}`;
        expect(container.querySelectorAll(custom)).toHaveLength(0);
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(2);

        await click(screen.getByText(`toggle ${part}`));
        expect(Array.from(container.querySelectorAll(custom), (n) => n.textContent)).toEqual(['1', '2']);
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(0);

        await click(screen.getByText(`toggle ${part}`));
        expect(container.querySelectorAll(custom)).toHaveLength(0);
        expect(container.querySelectorAll(defaultSelector)).toHaveLength(2);
        expect(warn).not.toHaveBeenCalled();
    });

    it('使用方注册同名组件时，嵌套消息仍由库自身递归渲染', async () => {
        const hijack = { name: 'DialogueContentItem', render: () => <i class="hijacked" /> };
        const { container } = render(AIChatDialogue, {
            props: {
                roleConfig,
                chats: [{ id: '1', role: 'assistant', status: 'completed', content: [{ type: 'message', content: [{ type: 'output_text', text: 'nested text' }] }] }],
            },
            global: { components: { DialogueContentItem: hijack } },
        });
        expect(await screen.findByText('nested text')).toBeInTheDocument();
        expect(container.querySelector('.hijacked')).toBeNull();
    });

    it('#fullDialogue 的默认节点仍使用自定义 avatar 与 title', () => {
        const fullSlot = vi.fn<(p: { defaultNodes: Record<'avatar' | 'title' | 'content' | 'action', VNode> }) => VNode>(({ defaultNodes }) => (
            <div class="full">
                {defaultNodes.avatar}
                {defaultNodes.title}
            </div>
        ));
        const { container } = renderDialogue({}, { fullDialogue: fullSlot, avatar: () => <b class="custom-avatar" />, title: () => <b class="custom-title" /> });
        expect(container.querySelectorAll('.full .custom-avatar')).toHaveLength(2);
        expect(container.querySelectorAll('.full .custom-title')).toHaveLength(2);
    });

    it('Reasoning 的 #content 替换正文并收到推理数据', () => {
        const content = vi.fn<(p: { status?: string; content?: unknown }) => VNode>(() => <p class="custom-reasoning">custom</p>);
        const { container } = render(AIChatDialogue.Reasoning, {
            props: { status: 'in_progress', content: [{ text: 'raw' }] },
            slots: { content },
        });
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('custom');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-markdownRender`)).toBeNull();
        expect(content).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress', content: [{ text: 'raw' }] }));
    });

    it('Step 的 #actionIcon 为每个操作渲染图标并收到所在步骤', () => {
        const step = { status: 'completed', summary: 's', actions: [{ summary: 'a', description: 'desc' }] };
        const actionIcon = vi.fn<(p: { index: number; stepIndex: number; step: unknown }) => VNode>(() => <i class="custom-icon" />);
        const { container } = render(AIChatDialogue.Step, { props: { steps: [step] }, slots: { actionIcon } });
        expect(container.querySelector(`.${prefix}-step-action-desc .custom-icon`)).not.toBeNull();
        expect(actionIcon).toHaveBeenCalledWith(expect.objectContaining({ index: 0, stepIndex: 0, step, item: step.actions[0] }));
    });

    it('角色的 color 落到头像上', () => {
        const { container } = renderDialogue({ roleConfig: { ...roleConfig, user: { name: 'User', color: 'red' } } });
        expect(container.querySelector(`.${prefix}-avatar`)).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-red`);
    });

    it('删除确认框与复制提示的文案跟随包住对话框的 LocaleProvider', async () => {
        onTestFinished(async () => {
            Modal.destroyAll();
            await nextTick();
            // jsdom has no CSS, so Transition finishes the leave two frames later
            await endTransitions();
        });
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
        const { container } = render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <AIChatDialogue chats={baseChats} roleConfig={roleConfig} /> },
        });

        await click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
        await waitFor(() => expect(success).toHaveBeenCalledWith({ content: en_US.AIChatDialogue.copySuccess }));

        await click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await click(await screen.findByRole('menuitem', { name: en_US.AIChatDialogue.delete }));
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toHaveTextContent(en_US.AIChatDialogue.deleteConfirm);
        expect(dialog).toHaveTextContent(en_US.AIChatDialogue.deleteContent);
    });
});

describe('AIChatDialogue 状态与操作', () => {
    const userFile = (file: Record<string, unknown>) => [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [{ type: 'input_file', size: '1KB', ...file }] }] }];

    it('未提供 #messageEdit 时，编辑状态的用户消息仍显示正文', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'user', content: 'keep me', status: 'completed', editing: true }] });
        await waitFor(() => expect(screen.getByText('keep me')).toBeInTheDocument());
    });

    it('末条回复为 queued 时操作栏隐藏，列表为 busy', () => {
        const chats = [
            { id: '1', role: 'user', content: 'q', status: 'completed' },
            { id: '2', role: 'assistant', content: '', status: 'queued' },
        ];
        const { container } = renderDialogue({ chats });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-hidden`);
        expect(getList(container)).toHaveAttribute('aria-busy', 'true');
    });

    it('末条回复为 incomplete 时操作栏可见，可以复制和重试', () => {
        const chats = [
            { id: '1', role: 'user', content: 'q', status: 'completed' },
            { id: '2', role: 'assistant', content: 'cut off', status: 'incomplete' },
        ];
        const { container } = renderDialogue({ chats });
        expect(getWrappers(container)[1].querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-hidden`);
        expect(getList(container)).toHaveAttribute('aria-busy', 'false');
    });

    it('#content 插槽的 defaultContent 带引用列表与加载指示', () => {
        const chats = [{ id: '1', role: 'assistant', content: '', status: 'queued', references: [{ id: 'r', type: 'file', name: 'doc.pdf', url: 'https://example.com/doc.pdf' }] }];
        const { container } = renderDialogue({ chats }, { content: ({ defaultContent }: { defaultContent: VNode }) => <div class="custom-content">{defaultContent}</div> });
        expect(container.querySelector(`.custom-content .${prefix}-references`)).not.toBeNull();
        expect(container.querySelector(`.custom-content .${contentCls}-loading`)).not.toBeNull();
    });

    it('点赞与点踩按钮用 aria-pressed 表示状态，其余操作不带', () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', content: 'a', status: 'completed', like: true }] });
        expect(screen.getByRole('button', { name: text.like })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: text.dislike })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: text.copy })).not.toHaveAttribute('aria-pressed');
    });

    it('选择状态不再报告已被删除的消息', async () => {
        const onSelect = vi.fn<Emit<'select'>>();
        const { rerender } = renderDialogue({ selecting: true, onSelect });
        for (const box of screen.getAllByRole('checkbox')) {
            await fireEvent.click(box);
        }
        await rerender({ chats: [baseChats[0]] });
        await fireEvent.click(screen.getByRole('checkbox'));
        expect(onSelect).toHaveBeenLastCalledWith([]);
    });

    it.each([
        ['扩展名大写', { filename: 'Report.PDF', file_url: 'https://example.com/r' }, 'pdf'],
        ['没有扩展名', { filename: 'README', file_url: 'https://example.com/r', fileInstance: { type: 'application/pdf' } }, 'pdf'],
    ])('文件卡片的类型：%s', (_, file, type) => {
        const { container } = renderDialogue({ chats: userFile(file) });
        expect(container.querySelector(`.${contentCls}-file-type`)).toHaveTextContent(new RegExp(`^${type}$`));
    });

    it('webp 与 bmp 文件卡片显示图片预览', () => {
        for (const filename of ['a.webp', 'a.bmp']) {
            const { container, unmount } = renderDialogue({ chats: userFile({ filename, file_url: 'https://example.com/a' }) });
            expect(container.querySelector(`.${contentCls}-file-icon-image`)).not.toBeNull();
            unmount();
        }
    });

    it('没有 actions 的步骤头不是按钮', () => {
        render(AIChatDialogue.Step, {
            props: {
                steps: [
                    { status: 'completed', summary: 'plain' },
                    { status: 'completed', summary: 'rich', actions: [{ summary: 'a', description: 'b' }] },
                ],
            },
        });
        expect(screen.queryByRole('button', { name: 'plain' })).toBeNull();
        expect(screen.getByRole('button', { name: 'rich' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('markdownRenderProps.components 中的 undefined 项回退到内置组件', async () => {
        const chats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
        const { container } = renderDialogue({ chats, markdownRenderProps: { components: { code: undefined } as never } });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js'));
    });
});
