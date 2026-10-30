import { createRef, StrictMode, type ComponentProps, type SubmitEvent, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, onTestFinished, vi, type Mock } from 'vite-plus/test';
import { chatCompletionToMessage } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import type { Annotation } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { AIChatDialogue } from '@fibrae/semi-ai-react';
import { Modal, Toast } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { AvatarProps } from '@fibrae/semi-ui-react/avatar/index';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { countLiveListeners, endLeaveAnimations, sleep } from '@test/utils/react';
import type { AIChatDialogueHandle, AIChatDialogueProps, DefaultActionNodeObj, DialogueRenderConfig, MarkdownRenderProps, Message, Metadata } from '../interface';
import { ReferenceWidget } from '../widgets/content-item/reference';
import DialogueAvatar from '../widgets/dialogue-avatar';

type Props = AIChatDialogueProps;
const prefix = `${BASE_CLASS_PREFIX}-ai-chat-dialogue`;
const contentCls = `${prefix}-content`;
const actionCls = `${prefix}-action`;

const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
    system: { name: 'System', avatar: 'https://example.com/system.png' },
};

const baseChats: Message[] = [
    { id: '1', role: 'user', content: 'hello', status: 'completed' },
    { id: '2', role: 'assistant', content: 'world', status: 'completed' },
];

const getList = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefix}-list`);
const getWrappers = (container: HTMLElement) => container.querySelectorAll<HTMLElement>(`.${prefix}-wrapper`);
const getActionButton = (wrapper: HTMLElement, icon: string) => wrapper.querySelector(`.${actionCls} .${BASE_CLASS_PREFIX}-icon-${icon}`)?.closest('button') ?? null;

// jsdom has no layout, so scroll metrics are faked on Element.prototype; scrollTop reads back what the component wrote
const scrollProps = ['scrollHeight', 'clientHeight', 'scrollTop'];
let savedDescriptors = {};
function mockListScroll({ scrollHeight = 1000, clientHeight = 300 } = {}) {
    const size = { scrollHeight, clientHeight };
    const tops = new WeakMap();
    const isList = (el) => el.classList?.contains(`${prefix}-list`);
    savedDescriptors = Object.fromEntries(scrollProps.map((key) => [key, Object.getOwnPropertyDescriptor(Element.prototype, key)]));
    Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get() {
            return isList(this) ? size.scrollHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'clientHeight', {
        configurable: true,
        get() {
            return isList(this) ? size.clientHeight : 0;
        },
    });
    Object.defineProperty(Element.prototype, 'scrollTop', {
        configurable: true,
        get() {
            return tops.get(this) ?? 0;
        },
        set(value) {
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

function renderDialogue(props = {}, options?: Parameters<typeof render>[1]) {
    return render(<AIChatDialogue chats={baseChats} roleConfig={roleConfig} {...props} />, options);
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
        expect(container.firstChild).toHaveClass(prefix);
        expect(wrappers).toHaveLength(2);
        expect(Array.from(container.querySelectorAll(`.${prefix}-title`), (n) => n.textContent)).toEqual(['User', 'Assistant']);
        const avatars = container.querySelectorAll(`.${prefix}-avatar img`);
        expect(Array.from(avatars, (n) => n.getAttribute('src'))).toEqual([roleConfig.user.avatar, roleConfig.assistant.avatar]);
        await waitFor(() => expect(screen.getByText('hello')).toBeInTheDocument());
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('在根元素上应用 className 与 style', () => {
        const { container } = renderDialogue({ className: 'custom', style: { color: 'red' } });
        expect(container.firstChild).toHaveClass(prefix, 'custom');
        expect(container.firstChild).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('只有 align="leftRight" 时用户消息才右对齐', () => {
        const { container, rerender } = renderDialogue();
        const containers = container.querySelectorAll(`.${prefix}-container`);
        expect(containers[0]).toHaveClass(`${prefix}-container-right`);
        expect(containers[1]).not.toHaveClass(`${prefix}-container-right`);

        rerender(<AIChatDialogue align="leftAlign" chats={baseChats} roleConfig={roleConfig} />);
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

        rerender(<AIChatDialogue chats={baseChats} mode="noBubble" roleConfig={roleConfig} />);
        expect(getBubbles(container)[0]).toContain(`${contentCls}-no-bubble`);
        expect(getBubbles(container)[1]).toContain(`${contentCls}-no-bubble`);

        rerender(<AIChatDialogue chats={baseChats} mode="userBubble" roleConfig={roleConfig} />);
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
        expect(loading.querySelector(`.${contentCls}-loading`)).toHaveTextContent('请稍候...');
        expect(loading.querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-hidden`);
        expect(failed.querySelector(`.${actionCls}`)).not.toHaveClass(`${actionCls}-hidden`);
    });

    it('对没有字符串 content 的消息渲染 output_text', async () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', output_text: 'from output', status: 'completed' }] });
        await waitFor(() => expect(screen.getByText('from output')).toBeInTheDocument());
    });

    it('不把 data-* 或未知属性放到消息项上', () => {
        const { container } = renderDialogue({ 'data-testid': 'dialogue' });
        for (const wrapper of getWrappers(container)) {
            expect(wrapper).not.toHaveAttribute('data-testid');
        }
    });

    it('渲染时没有 React 警告', async () => {
        const error = vi.spyOn(console, 'error');
        renderDialogue({
            selecting: true,
            hints: ['a hint'],
            showReference: true,
            markdownRenderProps: { className: 'md' },
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
        try {
            const { container } = renderDialogue();
            expect(container.querySelector(`.${contentCls}-inner > div`)).toHaveClass(`${contentCls}-no-bubble`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('暴露静态组件与默认 markdown 组件', () => {
        expect(typeof AIChatDialogue.Reasoning).toBe('function');
        expect(typeof AIChatDialogue.Step).toBe('function');
        expect(typeof AIChatDialogue.Annotation).toBe('function');
        expect(typeof AIChatDialogue.defaultComponents.code).toBe('function');
    });

    it('Reasoning、Step、Annotation 把未声明属性透传到根元素', () => {
        const { container } = render(
            <>
                <AIChatDialogue.Reasoning id="r" data-testid="reasoning" status="completed" summary={[]} />
                <AIChatDialogue.Step data-testid="step" aria-label="steps" steps={[]} />
                <AIChatDialogue.Annotation data-testid="annotation" title="sources" annotation={[]} maxCount={3} />
            </>
        );
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
        rerender(<AIChatDialogue chats={next} roleConfig={roleConfig} onChatsChange={onChatsChange} />);
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
            chats: [
                {
                    id: '1',
                    role: 'assistant',
                    status: 'completed',
                    content: [
                        {
                            type: 'message',
                            content: [{ type: 'output_text', text: 'cited text', annotations }],
                        },
                    ],
                },
            ],
        });
        await waitFor(() => expect(screen.getByText('cited text')).toBeInTheDocument());
        const annotation = container.querySelector(`.${prefix}-annotation-wrapper`);
        expect(annotation).toHaveTextContent('2 篇资料');
        fireEvent.click(annotation);
        expect(onAnnotationClick).toHaveBeenCalledWith([annotations[0], annotations[2]]);
        expectTypeOf<Parameters<NonNullable<Props['onAnnotationClick']>>>().toEqualTypeOf<[Annotation[]]>();
    });

    it('键盘激活 Annotation 时 onClick 收到事件对象', () => {
        const onClick = vi.fn<NonNullable<ComponentProps<typeof AIChatDialogue.Annotation>['onClick']>>();
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(<AIChatDialogue.Annotation annotation={items} maxCount={3} onClick={onClick} />);
        fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`), { key: 'Enter' });
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), items);
    });

    it('Annotation 传入的 onKeyDown 在键盘激活之后照常调用', () => {
        const onClick = vi.fn<NonNullable<ComponentProps<typeof AIChatDialogue.Annotation>['onClick']>>();
        const onKeyDown = vi.fn<NonNullable<ComponentProps<typeof AIChatDialogue.Annotation>['onKeyDown']>>();
        const items = [{ title: 'A', url: 'https://a.example' }];
        const { container } = render(<AIChatDialogue.Annotation annotation={items} maxCount={3} onClick={onClick} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(container.querySelector(`.${prefix}-annotation-wrapper`), { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
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
        await waitFor(() => expect(screen.getByText('cannot do')).toBeInTheDocument());
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
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`);
        const toggle = screen.getByRole('button', { name: '已思考完成' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_down`)).not.toBeNull();
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(reasoning.querySelector(`.${BASE_CLASS_PREFIX}-icon-chevron_up`)).not.toBeNull();
        await waitFor(() => expect(screen.getByText('thought')).toBeInTheDocument());
        fireEvent.click(screen.getByText('thought'));
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(toggle);
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
        const reasoning = container.querySelector(`.${prefix}-reasoning-wrapper`);
        expect(reasoning).toHaveTextContent('正在思考中...');
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
        const img = container.querySelector(`.${contentCls}-img img`);
        expect(img).toHaveAttribute('src', image.image_url);
        fireEvent.click(img);
        expect(onImageClick).toHaveBeenCalledWith(image);

        const link = container.querySelector(`a.${contentCls}-file`);
        expect(link).toHaveAttribute('href', file.file_url);
        expect(link).toHaveTextContent('report.pdf');
        expect(link.querySelector(`.${contentCls}-file-icon-pdf`)).not.toBeNull();
        expect(fireEvent.click(link)).toBe(true);
        expect(onFileClick).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));

        rerender(<AIChatDialogue chats={[{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }]} disabledFileItemClick roleConfig={roleConfig} onFileClick={onFileClick} />);
        expect(fireEvent.click(container.querySelector(`a.${contentCls}-file`))).toBe(false);
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

    it('showReference 时在用户消息上显示引用图标', () => {
        const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
        const { container } = renderDialogue({ showReference: true, onReferenceClick });
        const icons = container.querySelectorAll(`.${contentCls}-icon-reference`);
        expect(icons).toHaveLength(1);
        fireEvent.click(icons[0]);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('除非 escapeHtml 为 false，否则转义用户消息中的 html', async () => {
        const chats = [{ id: '1', role: 'user', content: '<b>bold</b>', status: 'completed' }];
        const { container, rerender } = renderDialogue({ chats });
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`)).toHaveTextContent('<b>bold</b>'));
        rerender(<AIChatDialogue chats={chats} escapeHtml={false} roleConfig={roleConfig} />);
        await waitFor(() => expect(container.querySelector(`.${contentCls}-inner`).textContent).not.toContain('<b>'));
    });

    it('渲染带语言栏的代码块', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }],
        });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js'));
    });

    it('markdownRenderProps.components 与内置代码块组件合并', async () => {
        const Strong = (props: { children?: ReactNode }) => <b data-testid="custom-strong">{props.children}</b>;
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '**hi**\n\n```js\nconst a = 1;\n```', status: 'completed' }],
            markdownRenderProps: { components: { strong: Strong } },
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

        const renderCode = async (ui) => {
            const chats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
            const result = render(ui(chats));
            const button = await waitFor(() => {
                const el = result.container.querySelector<HTMLButtonElement>(`.${prefix}-code-topSlot-copy-wrapper`);
                expect(el).not.toBeNull();
                return el;
            });
            return { ...result, button };
        };

        it('保留焦点按钮，复制后改名，且不提交表单', async () => {
            const onSubmit = vi.fn<(e: SubmitEvent) => void>((e) => e.preventDefault());
            const { button } = await renderCode((chats) => (
                <form onSubmit={onSubmit}>
                    <AIChatDialogue chats={chats} roleConfig={roleConfig} />
                </form>
            ));
            expect(button).toHaveAccessibleName(zh_CN.AIChatDialogue.copy);
            button.focus();
            fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.AIChatDialogue.copySuccess));
            expect(document.activeElement).toBe(button);
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('显示已复制状态时不再次复制', async () => {
            const { button } = await renderCode((chats) => <AIChatDialogue chats={chats} roleConfig={roleConfig} />);
            fireEvent.click(button);
            await waitFor(() => expect(button).toHaveAccessibleName(zh_CN.AIChatDialogue.copySuccess));
            fireEvent.click(button);
            expect(writeText).toHaveBeenCalledTimes(1);
        });
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
                function_call: { search: (item) => <span className="custom-search">{item.name}</span> },
                reasoning: (_item, msg) => <span className="custom-reasoning">{msg.id}</span>,
            },
        });
        expect(container.querySelector('.custom-search')).toHaveTextContent('search');
        expect(container.querySelector('.custom-reasoning')).toHaveTextContent('1');
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('other');
        expect(container.querySelectorAll(`.${contentCls}-custom-renderer`)).toHaveLength(2);

        rerender(<AIChatDialogue chats={[{ id: '2', role: 'assistant', content: 'plain', status: 'completed' }]} roleConfig={roleConfig} renderDialogueContentItem={{ default: (text) => <span className="custom-default">{text}</span> }} />);
        expect(container.querySelector('.custom-default')).toHaveTextContent('plain');
    });

    it('把默认节点传给 dialogueRenderConfig 的渲染函数', () => {
        const renderDialogueTitle = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueTitle']>>(({ defaultTitle, role }) => (
            <div className="custom-title">
                {role.name}
                {defaultTitle}
            </div>
        ));
        const renderDialogueAvatar = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueAvatar']>>(({ defaultAvatar }) => <div className="custom-avatar">{defaultAvatar}</div>);
        const renderDialogueContent = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueContent']>>(({ defaultContent, className }) => <div className={`custom-content ${className}`}>{defaultContent}</div>);
        const renderDialogueAction = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueAction']>>(({ defaultActions, defaultActionsObj, className }) => (
            <div className={`custom-action ${className}`}>
                {defaultActions}
                <span className="keys">{Object.keys(defaultActionsObj).sort().join(',')}</span>
            </div>
        ));
        const { container } = renderDialogue({
            dialogueRenderConfig: {
                renderDialogueTitle,
                renderDialogueAvatar,
                renderDialogueContent,
                renderDialogueAction,
            },
        });
        expect(container.querySelectorAll('.custom-title')).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-title .${prefix}-title`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-avatar .${prefix}-avatar`)).toHaveLength(2);
        expect(container.querySelectorAll(`.custom-content.${contentCls}`)).toHaveLength(2);
        expect(renderDialogueContent).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0] }));
        expect(renderDialogueTitle).toHaveBeenCalledWith(expect.objectContaining({ message: baseChats[0], role: roleConfig.user }));
        const actions = container.querySelectorAll('.custom-action');
        expect(actions[0]).toHaveClass(actionCls);
        expect(actions[0].querySelector('.keys')).toHaveTextContent('copyNode,editNode,moreNode,shareNode');
        expect(actions[1].querySelector('.keys')).toHaveTextContent('copyNode,dislikeNode,likeNode,moreNode,resetNode,shareNode');
        const { AIChatDialogue: text } = zh_CN;
        expect(within(actions[0] as HTMLElement).getByRole('button', { name: text.edit })).toBeInTheDocument();
        expect(within(actions[1] as HTMLElement).getByRole('button', { name: text.share })).toBeInTheDocument();
    });

    it('DefaultActionNodeObj 的键都是可选的，含 shareNode、editNode', () => {
        expectTypeOf<{ moreNode: ReactNode }>().toExtend<DefaultActionNodeObj>();
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('shareNode');
        expectTypeOf<DefaultActionNodeObj>().toHaveProperty('editNode');
    });

    it('renderFullDialogue 替换整个对话主体，并收到默认节点', () => {
        const renderFullDialogue = vi.fn<NonNullable<DialogueRenderConfig['renderFullDialogue']>>(({ defaultNodes, className, role }) => (
            <div className={`full ${className}`} data-role={role.name}>
                {defaultNodes.avatar}
                <div className="full-main">
                    {defaultNodes.title}
                    {defaultNodes.content}
                    {defaultNodes.action}
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

    it('只更新最后一条消息时，之前的消息不重新渲染', () => {
        const rendered: string[] = [];
        const dialogueRenderConfig: DialogueRenderConfig = {
            renderFullDialogue: ({ message, defaultNodes }) => {
                rendered.push(message.id);
                return <div>{defaultNodes.content}</div>;
            },
        };
        const props = { roleConfig, dialogueRenderConfig };
        const { rerender } = render(<AIChatDialogue chats={baseChats} {...props} />);
        rendered.length = 0;
        const streamed = [baseChats[0], { ...baseChats[1], content: 'world!' }];
        rerender(<AIChatDialogue chats={streamed} {...props} />);
        expect(rendered).toContain('2');
        expect(rendered).not.toContain('1');
    });

    it('通过 messageEditRender 渲染编辑视图', () => {
        const messageEditRender = vi.fn<NonNullable<Props['messageEditRender']>>(() => <div className="editor">editor</div>);
        const { container } = renderDialogue({
            messageEditRender,
            chats: [{ id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true }],
        });
        expect(container.querySelector(`.${contentCls}-editing .editor`)).not.toBeNull();
        expect(messageEditRender).toHaveBeenCalledWith(expect.objectContaining({ inputContents: expect.any(Array) }));
    });
});

describe('AIChatDialogue 可访问名称', () => {
    it('根元素带名称且未传 role 时为 group，使用方的 role 优先', () => {
        const { container, rerender } = renderDialogue({ 'aria-label': '对话' });
        const root = container.firstChild as HTMLElement;
        expect(root).toHaveAttribute('role', 'group');
        rerender(<AIChatDialogue aria-labelledby="title" chats={baseChats} roleConfig={roleConfig} />);
        expect(root).toHaveAttribute('role', 'group');
        rerender(<AIChatDialogue chats={baseChats} roleConfig={roleConfig} />);
        expect(root).not.toHaveAttribute('role');
        rerender(<AIChatDialogue aria-label="对话" role="application" chats={baseChats} roleConfig={roleConfig} />);
        expect(root).toHaveAttribute('role', 'application');
    });

    it('选择框的名称从语言包读取', () => {
        renderDialogue({ selecting: true });
        expect(screen.getAllByRole('checkbox', { name: zh_CN.AIChatDialogue.selectMessage })).toHaveLength(2);
    });

    it('无可见标题的头像以其角色命名', () => {
        const { container } = render(<DialogueAvatar role={roleConfig.user} continueSend />);
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
                    content: [
                        {
                            type: 'message',
                            content: [{ type: 'input_image', image_url: 'https://example.com/a.png' }],
                        },
                    ],
                    references: [{ id: 'r', type: 'file', name: 'pic.png', url: 'https://example.com/r.png' }],
                },
            ],
        });
        expect([...container.querySelectorAll(`.${prefix}-avatar img`)].map((img) => img.getAttribute('alt'))).toEqual(['', '']);
        expect(screen.getByRole('img', { name: zh_CN.AIChatDialogue.image })).toHaveAttribute('src', 'https://example.com/a.png');
        expect(container.querySelector('img[src="https://example.com/r.png"]')).toHaveAttribute('alt', '');
    });

    it('大写扩展名的引用按图片渲染', () => {
        const { container } = render(<ReferenceWidget references={[{ id: 'r', type: 'file', name: 'A.PNG', url: 'https://example.com/upper.png' }]} />);
        expect(container.querySelector('img[src="https://example.com/upper.png"]')).not.toBeNull();
    });

    it('没有扩展名或以点开头的引用名不显示文件图标', () => {
        const { container } = render(
            <ReferenceWidget
                references={[
                    { id: 'a', type: 'file', name: 'doc' },
                    { id: 'b', type: 'file', name: '.js' },
                    { id: 'c', type: 'file', name: 'a.docx' },
                ]}
            />
        );
        const refs = container.querySelectorAll(`.${prefix}-reference`);
        expect(Array.from(refs, (ref) => ref.querySelector(`.${prefix}-reference-icon`) !== null)).toEqual([false, false, true]);
    });
});

describe('AIChatDialogue 选择', () => {
    it('通过复选框与 ref 方法选择消息', () => {
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const ref = createRef<AIChatDialogueHandle>();
        const { container } = renderDialogue({ selecting: true, onSelect, ref });
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes).toHaveLength(2);

        fireEvent.click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['2']);
        expect(getWrappers(container)[1]).toHaveClass(`${prefix}-wrapper-selected`);
        fireEvent.click(checkboxes[0]);
        expect(onSelect).toHaveBeenLastCalledWith(['2', '1']);
        fireEvent.click(checkboxes[1]);
        expect(onSelect).toHaveBeenLastCalledWith(['1']);

        act(() => ref.current.deselectAll());
        expect(onSelect).toHaveBeenLastCalledWith([]);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);

        act(() => ref.current.selectAll());
        expect(onSelect).toHaveBeenLastCalledWith(['1', '2']);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(2);
        expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'), (n) => n.checked)).toEqual([true, true]);
    });

    it('非选择状态下隐藏复选框与选中样式', () => {
        const ref = createRef<AIChatDialogueHandle>();
        const { container } = renderDialogue({ ref });
        act(() => ref.current.selectAll());
        expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${prefix}-wrapper-selected`)).toHaveLength(0);
    });

    it('ref 上暴露文档中的方法', () => {
        const ref = createRef<AIChatDialogueHandle>();
        renderDialogue({ ref });
        for (const method of ['selectAll', 'deselectAll', 'scrollToBottom', 'scrollToTop']) {
            expect(typeof ref.current[method]).toBe('function');
        }
    });
});

describe('AIChatDialogue 消息操作', () => {
    it('显示每种角色与状态允许的操作', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container);
        const icons = (wrapper: HTMLElement) =>
            Array.from(wrapper.querySelectorAll(`.${actionCls} button .${BASE_CLASS_PREFIX}-icon`), (n) =>
                Array.from(n.classList)
                    .find((c) => c.startsWith(`${BASE_CLASS_PREFIX}-icon-`) && c !== `${BASE_CLASS_PREFIX}-icon-default`)
                    .replace(`${BASE_CLASS_PREFIX}-icon-`, '')
            );
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

    it('对消息点赞与点踩', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageGoodFeedback = vi.fn<NonNullable<Props['onMessageGoodFeedback']>>();
        const onMessageBadFeedback = vi.fn<NonNullable<Props['onMessageBadFeedback']>>();
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

        fireEvent.click(like.closest('button'));
        expect(onMessageGoodFeedback).toHaveBeenCalledWith(chats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: true, dislike: false }]);

        const liked = [{ ...chats[0], like: true, dislike: false }];
        rerender(<AIChatDialogue chats={liked} roleConfig={roleConfig} onChatsChange={onChatsChange} onMessageBadFeedback={onMessageBadFeedback} />);
        const dislikeButton = getWrappers(container)[0].querySelectorAll(`.${actionCls} button`)[4];
        fireEvent.click(dislikeButton);
        expect(onMessageBadFeedback).toHaveBeenCalledWith(liked[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...chats[0], like: false, dislike: true }]);
    });

    it('重置最后一条消息', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageReset = vi.fn<NonNullable<Props['onMessageReset']>>();
        const { container } = renderDialogue({ onChatsChange, onMessageReset });
        fireEvent.click(getActionButton(getWrappers(container)[1], 'redo_stroked'));
        expect(onMessageReset).toHaveBeenCalledWith(baseChats[1]);
        const next = onChatsChange.mock.lastCall[0];
        expect(next).toHaveLength(2);
        expect(next[0]).toBe(baseChats[0]);
        expect(next[1]).toEqual(expect.objectContaining({ role: 'assistant', status: 'in_progress', content: '', createdAt: Date.now() }));
        expect(next[1]).not.toHaveProperty('createAt');
        expect(next[1].id).not.toBe('2');
    });

    it('切换用户消息的编辑状态', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageEdit = vi.fn<NonNullable<Props['onMessageEdit']>>();
        const { container } = renderDialogue({ onChatsChange, onMessageEdit });
        fireEvent.click(getActionButton(getWrappers(container)[0], 'edit_stroked'));
        expect(onMessageEdit).toHaveBeenCalledWith(baseChats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([{ ...baseChats[0], editing: true }, baseChats[1]]);
    });

    it('同一时间只保留一条消息处于编辑模式', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange });
        fireEvent.click(getActionButton(getWrappers(container)[1], 'edit_stroked'));
        const next = onChatsChange.mock.lastCall[0];
        expect(next.map((chat) => chat.editing)).toEqual([false, true]);
    });

    it('分享消息', () => {
        const onMessageShare = vi.fn<NonNullable<Props['onMessageShare']>>();
        const { container } = renderDialogue({ onMessageShare });
        fireEvent.click(getActionButton(getWrappers(container)[1], 'share_stroked'));
        expect(onMessageShare).toHaveBeenCalledWith(baseChats[1]);
    });

    it('分享与编辑按钮和其他操作按钮一样带 btn 类名', () => {
        const { container } = renderDialogue();
        const [user, assistant] = getWrappers(container);
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
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('world');
            await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
            expect(onMessageCopy).toHaveBeenCalledExactlyOnceWith(baseChats[1]);
        });

        it('写入完成前或失败时不触发 onMessageCopy', async () => {
            let resolveWrite;
            writeText.mockImplementation(() => new Promise((resolve) => (resolveWrite = resolve)));
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({ onMessageCopy });
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            expect(onMessageCopy).not.toHaveBeenCalled();
            await act(async () => resolveWrite());
            expect(onMessageCopy).toHaveBeenCalledTimes(1);

            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });
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
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('answer');
        });

        it('复制没有 content 的消息的 output_text，并忽略无文本的消息', async () => {
            vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [
                    { id: '1', role: 'assistant', status: 'completed', output_text: 'from output' },
                    { id: '2', role: 'assistant', status: 'completed', content: { unexpected: true } },
                ],
            });
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledExactlyOnceWith('from output');
            await waitFor(() => expect(onMessageCopy).toHaveBeenCalledTimes(1));
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await act(async () => {
                await Promise.resolve();
            });
            expect(writeText).toHaveBeenCalledTimes(1);
            expect(onMessageCopy).toHaveBeenCalledTimes(1);
        });

        it('空字符串 content 既不写入也不回调', async () => {
            const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
            const { container } = renderDialogue({
                onMessageCopy,
                chats: [{ id: '1', role: 'assistant', status: 'completed', content: '' }],
            });
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            await act(async () => {
                await Promise.resolve();
            });
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
            fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
            expect(writeText).toHaveBeenCalledWith('abc');
        });

        it('剪贴板写入被拒绝时不弹出提示', async () => {
            writeText.mockImplementation(() => Promise.reject(new Error('denied')));
            const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
            const { container } = renderDialogue();
            fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });
            expect(writeText).toHaveBeenCalledTimes(1);
            expect(success).not.toHaveBeenCalled();
        });
    });

    it('确认后删除消息', async () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onMessageDelete = vi.fn<NonNullable<Props['onMessageDelete']>>();
        const { container } = renderDialogue({ onChatsChange, onMessageDelete });
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        const item = await screen.findByText('删除');
        expect(getWrappers(container)[0].querySelector(`.${actionCls}`)).toHaveClass(`${actionCls}-show`);
        fireEvent.click(item);
        const ok = await screen.findByRole('button', { name: '确定' });
        expect(onMessageDelete).not.toHaveBeenCalled();
        fireEvent.click(ok);
        expect(onMessageDelete).toHaveBeenCalledWith(baseChats[0]);
        expect(onChatsChange).toHaveBeenLastCalledWith([baseChats[1]]);
        await act(async () => Modal.destroyAll());
    });

    it('删除确认框与复制提示的文案跟随包住对话框的 LocaleProvider', async () => {
        onTestFinished(async () => {
            await act(async () => Modal.destroyAll());
        });
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const success = vi.spyOn(Toast, 'success').mockImplementation(() => 'id');
        const dialogue = (locale: typeof en_US) => (
            <LocaleProvider locale={locale}>
                <AIChatDialogue chats={baseChats} roleConfig={roleConfig} />
            </LocaleProvider>
        );
        const { container, rerender } = render(dialogue(en_US));

        fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
        await waitFor(() => expect(success).toHaveBeenCalledWith({ content: en_US.AIChatDialogue.copySuccess }));

        rerender(dialogue(ja_JP));
        fireEvent.click(getActionButton(getWrappers(container)[1], 'copy_stroked'));
        await waitFor(() => expect(success).toHaveBeenLastCalledWith({ content: ja_JP.AIChatDialogue.copySuccess }));

        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        fireEvent.click(await screen.findByRole('menuitem', { name: ja_JP.AIChatDialogue.delete }));
        const dialog = await screen.findByRole('alertdialog', { name: ja_JP.AIChatDialogue.deleteConfirm });
        expect(dialog).toHaveTextContent(ja_JP.AIChatDialogue.deleteContent);
    });

    it('在更多菜单内 mousedown 不关闭菜单', async () => {
        const { container } = renderDialogue();
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        fireEvent.mouseDown(await screen.findByText('删除'));
        expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('在外部 mousedown 时关闭更多菜单', async () => {
        const { container } = renderDialogue();
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await screen.findByText('删除');
        fireEvent.mouseDown(document.body);
        await waitFor(() => {
            endLeaveAnimations();
            expect(screen.queryByText('删除')).toBeNull();
        });
    });
});

describe('AIChatDialogue 提示', () => {
    it('渲染提示，点击后追加一条用户消息', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
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

        fireEvent.click(items[1]);
        expect(onHintClick).toHaveBeenCalledWith('second');
        const next = onChatsChange.mock.lastCall[0];
        expect(next.slice(0, 2)).toEqual(baseChats);
        expect(next[2]).toEqual(expect.objectContaining({ role: 'user', content: 'second', createdAt: Date.now() }));

        fireEvent.keyDown(items[0], { key: 'Enter' });
        expect(onHintClick).toHaveBeenLastCalledWith('first');
        expectTypeOf<Message['createdAt']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<Message['editing']>().toEqualTypeOf<boolean | undefined>();
    });

    it('渲染自定义提示框', () => {
        const onHintClick = vi.fn<NonNullable<Props['onHintClick']>>();
        renderDialogue({
            hints: ['custom'],
            onHintClick,
            renderHintBox: ({ content, index, onHintClick: click }) => (
                <button key={index} onClick={click}>
                    {`box-${content}`}
                </button>
            ),
        });
        fireEvent.click(screen.getByText('box-custom'));
        expect(onHintClick).toHaveBeenCalledWith('custom');
    });

    it('选择状态下标记提示', () => {
        const { container } = renderDialogue({ hints: ['a'], selecting: true });
        expect(container.querySelector(`.${prefix}-hints`)).toHaveClass(`${prefix}-hints-selecting`);
    });
});

describe('AIChatDialogue 滚动', () => {
    const streaming = (content) => [baseChats[0], { id: '2', role: 'assistant', content, status: 'in_progress' }];

    it('挂载时、有新消息时以及最后一条消息流式输出时滚动到底部', () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ chats: streaming('a') });
        const list = getList(container);
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        rerender(<AIChatDialogue chats={streaming('ab')} roleConfig={roleConfig} />);
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        const added = [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }];
        rerender(<AIChatDialogue chats={added} roleConfig={roleConfig} />);
        expect(list.scrollTop).toBe(1000);

        list.scrollTop = 0;
        rerender(<AIChatDialogue chats={[...added]} roleConfig={roleConfig} />);
        expect(list.scrollTop).toBe(0);
    });

    it('新增提示时滚动到底部', () => {
        mockListScroll();
        const { container, rerender } = renderDialogue({ hints: ['a'] });
        const list = getList(container);
        list.scrollTop = 0;
        rerender(<AIChatDialogue chats={baseChats} hints={['a', 'b']} roleConfig={roleConfig} />);
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

        rerender(<AIChatDialogue chats={streaming('ab')} roleConfig={roleConfig} />);
        expect(list.scrollTop).toBe(0);

        const added = [...streaming('ab'), { id: '3', role: 'user', content: 'next', status: 'completed' }];
        rerender(<AIChatDialogue chats={added} roleConfig={roleConfig} />);
        expect(list.scrollTop).toBe(1000);
    });

    it('离开底部时显示回到底部按钮，并以动画返回', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const { container } = renderDialogue();
        const list = getList(container);
        const backBottom = () => container.querySelector(`.${prefix}-backBottom-button`);
        expect(backBottom()).toBeNull();

        list.scrollTop = 0;
        fireEvent.scroll(list);
        void act(() => vi.advanceTimersByTime(200));
        expect(backBottom()).not.toBeNull();

        fireEvent.click(backBottom());
        void act(() => vi.advanceTimersByTime(500));
        expect(list.scrollTop).toBe(1000);

        fireEvent.scroll(list);
        void act(() => vi.advanceTimersByTime(200));
        expect(backBottom()).toBeNull();
    });

    it('通过 ref 方法滚动', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
        mockListScroll();
        const ref = createRef<AIChatDialogueHandle>();
        const { container } = renderDialogue({ ref });
        const list = getList(container);

        act(() => ref.current.scrollToTop(false));
        expect(list.scrollTop).toBe(0);
        act(() => ref.current.scrollToBottom(false));
        expect(list.scrollTop).toBe(1000);

        act(() => ref.current.scrollToTop(true));
        void act(() => vi.advanceTimersByTime(16));
        expect(list.scrollTop).toBeGreaterThan(0);
        void act(() => vi.advanceTimersByTime(500));
        expect(list.scrollTop).toBe(0);

        act(() => ref.current.scrollToBottom(true));
        void act(() => vi.advanceTimersByTime(500));
        expect(list.scrollTop).toBe(1000);
    });
});

describe('AIChatDialogue StrictMode', () => {
    it('在 StrictMode 下正常工作', () => {
        mockListScroll();
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const onMessageGoodFeedback = vi.fn<NonNullable<Props['onMessageGoodFeedback']>>();
        const ref = createRef<AIChatDialogueHandle>();
        const { container, rerender } = render(
            <StrictMode>
                <AIChatDialogue ref={ref} chats={baseChats} roleConfig={roleConfig} selecting onMessageGoodFeedback={onMessageGoodFeedback} onSelect={onSelect} />
            </StrictMode>
        );
        const list = getList(container);
        expect(list.scrollTop).toBe(1000);

        fireEvent.click(container.querySelectorAll('input[type="checkbox"]')[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenLastCalledWith(['1']);

        fireEvent.click(getWrappers(container)[1].querySelectorAll(`.${actionCls} button`)[3]);
        expect(onMessageGoodFeedback).toHaveBeenCalledTimes(1);

        act(() => ref.current.selectAll());
        expect(onSelect).toHaveBeenLastCalledWith(['1', '2']);

        const added = [...baseChats, { id: '3', role: 'user', content: 'next', status: 'completed' }];
        rerender(
            <StrictMode>
                <AIChatDialogue chats={added} roleConfig={roleConfig} />
            </StrictMode>
        );
        expect(list.className).toBe(`${prefix}-list`);
    });
});

describe('AIChatDialogue 已修复问题', () => {
    it('把 data-* 属性放到根元素上', () => {
        const { container } = renderDialogue({ 'data-testid': 'dialogue', id: 'root-id' });
        expect(container.firstChild).toHaveAttribute('data-testid', 'dialogue');
        expect(container.firstChild).toHaveAttribute('id', 'root-id');
    });

    it('角色的 color 落到头像上', () => {
        const { container } = renderDialogue({ roleConfig: { ...roleConfig, user: { name: 'User', color: 'red' } } });
        expect(container.querySelector(`.${prefix}-avatar`)).toHaveClass(`${BASE_CLASS_PREFIX}-avatar-red`);
    });

    it('接受挂载后再设置的 hints（挂载时无 hints）', () => {
        const { rerender } = renderDialogue();
        rerender(<AIChatDialogue chats={baseChats} hints={['late']} roleConfig={roleConfig} />);
        expect(screen.getByText('late')).toBeInTheDocument();
    });

    it('没有 chats 属性时可重新渲染', () => {
        const { container, rerender } = render(<AIChatDialogue roleConfig={roleConfig} />);
        rerender(<AIChatDialogue className="again" roleConfig={roleConfig} />);
        expect(container.firstChild).toHaveClass('again');
    });

    it('渲染 roleConfig 中缺少角色的消息', () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'tool', content: 'tool output', status: 'completed' }],
        });
        expect(getWrappers(container)).toHaveLength(1);
    });

    it('未设置 onAnnotationClick 时点击注释不报错', async () => {
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
        const onWindowError = vi.fn<(e: ErrorEvent) => void>((e) => e.preventDefault());
        window.addEventListener('error', onWindowError);
        try {
            fireEvent.click(container.querySelector(`.${prefix}-annotation-wrapper`));
        } finally {
            window.removeEventListener('error', onWindowError);
        }
        expect(onWindowError).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('把角色传给 renderDialogueContent', () => {
        const renderDialogueContent = vi.fn<NonNullable<DialogueRenderConfig['renderDialogueContent']>>(({ defaultContent }) => defaultContent);
        renderDialogue({ dialogueRenderConfig: { renderDialogueContent } });
        expect(renderDialogueContent).toHaveBeenCalledWith(expect.objectContaining({ role: roleConfig.user }));
    });

    it('showReset={false} 时隐藏重置操作', () => {
        const { container } = renderDialogue({ showReset: false });
        expect(getActionButton(getWrappers(container)[1], 'redo_stroked')).toBeNull();
    });

    it('ref 上只暴露文档中的方法', () => {
        const ref = createRef<AIChatDialogueHandle>();
        renderDialogue({ ref });
        expect(Object.keys(ref.current).sort()).toEqual(['deselectAll', 'scrollToBottom', 'scrollToTop', 'selectAll']);
    });

    it('卸载时移除外部 mousedown 监听', async () => {
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const { container, unmount } = render(
            <StrictMode>
                <AIChatDialogue chats={baseChats} roleConfig={roleConfig} />
            </StrictMode>
        );
        fireEvent.click(getActionButton(getWrappers(container)[0], 'more_stroked'));
        await screen.findByText('删除');
        expect(countLiveListeners(added, removed, 'mousedown')).toBeGreaterThan(0);
        unmount();
        expect(countLiveListeners(added, removed, 'mousedown')).toBe(0);
    });

    it('切换编辑消息时不修改传入的 messages', () => {
        const chats = [
            { id: '1', role: 'user', content: 'first', status: 'completed', editing: true },
            { id: '2', role: 'user', content: 'second', status: 'completed' },
        ];
        const { container } = renderDialogue({ chats, onChatsChange: () => {} });
        fireEvent.click(getActionButton(getWrappers(container)[1], 'edit_stroked'));
        expect(chats[0].editing).toBe(true);
    });

    it('纯图标操作按钮的名称从语言包读取', () => {
        const { container } = renderDialogue();
        const [user, assistant] = Array.from(getWrappers(container), (w) => within(w.querySelector(`.${actionCls}`)));
        const { AIChatDialogue: text } = zh_CN;
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
        const log = screen.getByRole('log', { name: zh_CN.AIChatDialogue.messages });
        expect(await within(log).findByText('world')).toBeInTheDocument();
        expect(log).toHaveAttribute('aria-busy', 'false');
        for (const status of ['queued', 'in_progress']) {
            const chats = [baseChats[0], { ...baseChats[1], status }];
            rerender(<AIChatDialogue chats={chats} roleConfig={roleConfig} />);
            expect(log).toHaveAttribute('aria-busy', 'true');
        }
        rerender(<AIChatDialogue chats={[baseChats[0], { ...baseChats[1], status: 'incomplete' }]} roleConfig={roleConfig} />);
        expect(log).toHaveAttribute('aria-busy', 'false');
        rerender(<AIChatDialogue chats={baseChats} roleConfig={roleConfig} />);
        expect(log).toHaveAttribute('aria-busy', 'false');
    });

    it('文本消息的引用图标是原生 button', () => {
        const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
        renderDialogue({ showReference: true, onReferenceClick });
        const quote = screen.getByRole('button', { name: zh_CN.AIChatDialogue.reference });
        expect(quote.tagName).toBe('BUTTON');
        expect(quote).toHaveAttribute('type', 'button');
        fireEvent.click(quote);
        expect(onReferenceClick).toHaveBeenCalledWith({ type: 'text', content: 'hello' });
    });

    it('文件卡片的引用图标支持 Enter 与 Space，且不打开文件', () => {
        const onReferenceClick = vi.fn<NonNullable<Props['onReferenceClick']>>();
        const onFileClick = vi.fn<NonNullable<Props['onFileClick']>>();
        const file = { type: 'input_file', filename: 'report.pdf', file_url: 'https://example.com/r.pdf' };
        const chats = [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }];
        renderDialogue({ chats, showReference: true, onReferenceClick, onFileClick });
        const quote = screen.getByRole('button', { name: zh_CN.AIChatDialogue.reference });
        fireEvent.keyDown(quote, { key: 'Enter' });
        const space = fireEvent.keyDown(quote, { key: ' ' });
        expect(space).toBe(false);
        expect(onReferenceClick).toHaveBeenCalledTimes(2);
        expect(onReferenceClick).toHaveBeenCalledWith({ name: 'report.pdf', url: 'https://example.com/r.pdf' });
        expect(onFileClick).not.toHaveBeenCalled();
    });

    it('步骤标题暴露其操作是否展开', () => {
        render(<AIChatDialogue.Step steps={[{ status: 'completed', summary: 'searched', actions: [{ summary: 'a', description: 'b' }] }]} />);
        const header = screen.getByRole('button', { name: 'searched' });
        expect(header).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(header);
        expect(header).toHaveAttribute('aria-expanded', 'false');
        fireEvent.keyDown(header, { key: 'Enter' });
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
        await waitFor(() => expect(screen.getByText('answer')).toBeInTheDocument());
        expect(container.querySelector(`.${prefix}-annotation-wrapper`)).toHaveTextContent('1 篇资料');
        expect(container.querySelector(`.${contentCls}-tool-call`)).toHaveTextContent('get_weather');
    });

    it('点踩按钮的未选中图标使用本组件的翻转类名', () => {
        const { container } = renderDialogue();
        const [assistant] = Array.from(getWrappers(container)).slice(1);
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
        const error = vi.spyOn(console, 'error');
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
        renderDialogue({ chats, renderDialogueContentItem: { output_text: (item) => <b>{item.text}</b> } });
        expect(error).not.toHaveBeenCalled();
    });

    it('数组 content 只有工具调用时复制既不写入也不回调', async () => {
        const writeText = vi.fn<() => Promise<void>>(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        onTestFinished(() => {
            Reflect.deleteProperty(navigator, 'clipboard');
        });
        const onMessageCopy = vi.fn<NonNullable<Props['onMessageCopy']>>();
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                content: [{ type: 'function_call', name: 'f', arguments: '{}' }],
            },
        ];
        const { container } = renderDialogue({ chats, onMessageCopy });
        fireEvent.click(getActionButton(getWrappers(container)[0], 'copy_stroked'));
        await sleep(20);
        expect(writeText).not.toHaveBeenCalled();
        expect(onMessageCopy).not.toHaveBeenCalled();
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

    it('代码围栏的语言含连字符时语言栏显示完整语言 id', async () => {
        const { container } = renderDialogue({
            chats: [{ id: '1', role: 'assistant', content: '```objective-c\nint x = 1;\n```', status: 'completed' }],
        });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent(/^objective-c$/));
    });

    it('steps 换成同内容的新数组时保留已折叠的步骤，新增步骤展开', () => {
        const step = (summary) => ({ status: 'completed', summary, actions: [{ summary: 'a', description: 'b' }] });
        const { rerender } = render(<AIChatDialogue.Step steps={[step('one')]} />);
        fireEvent.click(screen.getByRole('button', { name: 'one' }));
        rerender(<AIChatDialogue.Step steps={[step('one')]} />);
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        rerender(<AIChatDialogue.Step steps={[step('one'), step('two')]} />);
        expect(screen.getByRole('button', { name: 'one' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'two' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('renderHintBox 返回不带 key 的元素时没有 key 警告', () => {
        const error = vi.spyOn(console, 'error');
        renderDialogue({ hints: ['a', 'b'], renderHintBox: ({ content }) => <span>{content}</span> });
        expect(error).not.toHaveBeenCalled();
    });

    it('更多菜单打开后按 Escape 关闭', async () => {
        renderDialogue();
        const more = screen.getAllByRole('button', { name: zh_CN.AIChatDialogue.more }).at(-1);
        fireEvent.click(more);
        await screen.findByRole('menuitem');
        fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('menuitem')).toBeNull());
    });
});

describe('AIChatDialogue 状态与操作', () => {
    const { AIChatDialogue: text } = zh_CN;
    const userFile = (file) => [{ id: '1', role: 'user', status: 'completed', content: [{ type: 'message', content: [file] }] }];

    it('未传 messageEditRender 时，编辑状态的用户消息仍显示正文', async () => {
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

    it('renderDialogueContent 的 defaultContent 带引用列表与加载指示', () => {
        const chats = [{ id: '1', role: 'assistant', content: '', status: 'queued', references: [{ id: 'r', type: 'file', name: 'doc.pdf', url: 'https://example.com/doc.pdf' }] }];
        const { container } = renderDialogue({ chats, dialogueRenderConfig: { renderDialogueContent: ({ defaultContent }) => <div className="custom-content">{defaultContent}</div> } });
        expect(container.querySelector(`.custom-content .${prefix}-references`)).not.toBeNull();
        expect(container.querySelector(`.custom-content .${contentCls}-loading`)).not.toBeNull();
    });

    it('点赞与点踩按钮用 aria-pressed 表示状态，其余操作不带', () => {
        renderDialogue({ chats: [{ id: '1', role: 'assistant', content: 'a', status: 'completed', like: true }] });
        expect(screen.getByRole('button', { name: text.like })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: text.dislike })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: text.copy })).not.toHaveAttribute('aria-pressed');
    });

    it('重新生成后，新回复不带旧回答的反馈和输出，并显示加载指示', () => {
        const onChatsChange = vi.fn<NonNullable<Props['onChatsChange']>>();
        const chats = [
            {
                id: '1',
                role: 'assistant',
                status: 'completed',
                like: true,
                output_text: 'old',
                content: [{ type: 'message', content: [{ type: 'output_text', text: 'old' }] }],
            },
        ];
        const { container, rerender } = renderDialogue({ chats, onChatsChange });
        fireEvent.click(screen.getByRole('button', { name: text.regenerate }));
        const [reset] = onChatsChange.mock.calls.at(-1)[0];
        expect(reset.like).toBeFalsy();
        expect(reset.output_text).toBeUndefined();
        rerender(<AIChatDialogue chats={[reset]} roleConfig={roleConfig} />);
        expect(container.querySelector(`.${contentCls}-loading`)).not.toBeNull();
    });

    it('选择状态不再报告已被删除的消息', () => {
        const onSelect = vi.fn<NonNullable<Props['onSelect']>>();
        const { rerender } = renderDialogue({ selecting: true, onSelect });
        for (const box of screen.getAllByRole('checkbox')) {
            fireEvent.click(box);
        }
        rerender(<AIChatDialogue chats={[baseChats[0]]} roleConfig={roleConfig} selecting onSelect={onSelect} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onSelect).toHaveBeenLastCalledWith([]);
    });

    it.each([
        ['扩展名大写', { filename: 'Report.PDF', file_url: 'https://example.com/r' }, 'pdf'],
        ['没有扩展名', { filename: 'README', file_url: 'https://example.com/r', fileInstance: { type: 'application/pdf' } }, 'pdf'],
    ])('文件卡片的类型：%s', (_, file, type) => {
        const { container } = renderDialogue({ chats: userFile({ type: 'input_file', size: '1KB', ...file }) });
        expect(container.querySelector(`.${contentCls}-file-type`)).toHaveTextContent(new RegExp(`^${type}$`));
    });

    it('webp 与 bmp 文件卡片显示图片预览', () => {
        for (const filename of ['a.webp', 'a.bmp']) {
            const { container, unmount } = renderDialogue({ chats: userFile({ type: 'input_file', filename, file_url: 'https://example.com/a' }) });
            expect(container.querySelector(`.${contentCls}-file-icon-image`)).not.toBeNull();
            unmount();
        }
    });

    it('没有 actions 的步骤头不是按钮', () => {
        render(
            <AIChatDialogue.Step
                steps={[
                    { status: 'completed', summary: 'plain' },
                    { status: 'completed', summary: 'rich', actions: [{ summary: 'a', description: 'b' }] },
                ]}
            />
        );
        expect(screen.queryByRole('button', { name: 'plain' })).toBeNull();
        expect(screen.getByRole('button', { name: 'rich' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('markdownRenderProps.components 中的 undefined 项回退到内置组件', async () => {
        const chats = [{ id: '1', role: 'assistant', content: '```js\nconst a = 1;\n```', status: 'completed' }];
        const { container } = renderDialogue({ chats, markdownRenderProps: { components: { code: undefined } } });
        await waitFor(() => expect(container.querySelector(`.${prefix}-code-topSlot-type`)).toHaveTextContent('js'));
    });

    it('代码块的子节点不是字符串时不提供复制按钮', () => {
        const Code = AIChatDialogue.defaultComponents.code;
        const { container } = render(
            <Code className="language-js">
                <span>const a = 1;</span>
            </Code>
        );
        expect(container.querySelector(`.${prefix}-code-topSlot-copy-wrapper`)).toBeNull();
    });
});
