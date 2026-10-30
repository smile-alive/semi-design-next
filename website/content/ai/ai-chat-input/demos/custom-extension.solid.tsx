import { For, Show, type Accessor, type Component, type Setter, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import { Dynamic, render } from 'solid-js/web';
import { computePosition, shift } from '@floating-ui/dom';
import { Node, mergeAttributes, posToDOMRect, type Editor } from '@tiptap/core';
import { Mention, type MentionNodeAttrs, type MentionOptions } from '@tiptap/extension-mention';
import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputContent as Content, type AIChatInputElement, type AIChatInputReference as Reference, type AIChatInputRenderTopSlotProps as RenderTopSlotProps } from '@fibrae/semi-ai-solid';
import { IconFile, IconFolder, IconBranch, IconCode, IconGit, IconGlobeStroke, IconChevronRight, IconClose, IconUpload, IconTerminal, IconConnectionPoint2, type IconProps } from '@fibrae/semi-icons-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };

interface PanelItem {
    icon: Component<IconProps>;
    key: string;
    type: string;
    name: string;
    path?: string;
}

const TestAction: Record<string, PanelItem[]> = {
    'Files & Folders': [
        {
            icon: IconFile,
            key: '1-1',
            type: 'file',
            name: 'TagInput.scss',
            path: 'package/semi-founctaion/TagInput.scss',
        },
        {
            icon: IconFolder,
            key: '1-2',
            type: 'folder',
            name: 'package',
            path: '/package',
        },
        {
            icon: IconFolder,
            key: '1-3',
            type: 'folder',
            name: 'semi-ui',
            path: '/package/semi-ui',
        },
    ],
    Git: [
        {
            icon: IconBranch,
            key: '2-1',
            type: 'branch',
            name: 'fix/tag',
        },
        {
            icon: IconCode,
            key: '2-2',
            type: 'code',
            name: 'v2.86.0',
            path: '/package',
        },
        {
            icon: IconGit,
            key: '2-3',
            type: 'git',
            name: 'chore: publish',
        },
    ],
};

const FirstLevel = Object.keys(TestAction);

// A ProseMirror node view that renders plain DOM: tiptap has no Solid binding, and the value is the only state
const ReferSlot = Node.create({
    name: 'referSlot',
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false,
    addAttributes() {
        return {
            value: {
                default: '输入内容',
                parseHTML: (element) => element.getAttribute('data-value'),
                renderHTML: (attributes) => ({
                    'data-value': attributes.value,
                }),
            },
            info: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-info'),
                renderHTML: (attributes) => ({
                    'data-info': attributes.info,
                }),
            },
            type: {
                default: 'text',
                parseHTML: (element) => element.getAttribute('data-type'),
                renderHTML: (attributes) => ({
                    'data-type': attributes.type,
                }),
            },
            uniqueKey: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-unique-key'),
                renderHTML: (attributes) => ({
                    'data-unique-key': attributes.uniqueKey,
                }),
            },
            // Sizes the caret around the custom node; every custom node needs it
            isCustomSlot: AIChatInput.getCustomSlotAttribute(),
        };
    },
    parseHTML() {
        return [
            {
                tag: 'refer-slot',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['refer-slot', mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('span');
            dom.className = 'ai-chat-input-refer-slot-wrapper';
            const slot = document.createElement('span');
            slot.className = 'ai-chat-input-refer-slot';
            slot.textContent = node.attrs.value ? node.attrs.value : '';
            dom.append(slot);
            return {
                dom,
                update: (updated) => {
                    if (updated.type !== node.type) {
                        return false;
                    }
                    slot.textContent = updated.attrs.value ? updated.attrs.value : '';
                    return true;
                },
            };
        };
    },
});

interface ReferSlotAttrs {
    value: string;
    info: string;
    type?: string;
    uniqueKey: string;
}

function updatePosition(editor: Editor, element: HTMLElement) {
    const virtualElement = {
        getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
    };
    void computePosition(virtualElement, element, {
        placement: 'bottom-start',
        strategy: 'absolute',
        middleware: [shift()],
    }).then(({ x, y, strategy }) => {
        element.style.width = 'max-content';
        element.style.position = strategy;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    });
}

type MentionSuggestion = MentionOptions['suggestion'];
type MentionStartProps = Parameters<NonNullable<ReturnType<NonNullable<MentionSuggestion['render']>>['onStart']>>[0];

// Content the panel returns through command, not limited to Mention's own attributes
interface MentionCommandProps extends Partial<MentionNodeAttrs> {
    item?: PanelItem;
    allowHotKeySend?: boolean;
}

interface MentionListHandle {
    onKeyDown: (props: { event: KeyboardEvent; exitCb?: () => void }) => boolean;
}

// tiptap types the command with the node attributes only; the panel also passes its item and hot key flag through it
interface PanelProps extends Omit<MentionStartProps, 'command'> {
    command: (props: MentionCommandProps) => void;
}

interface MentionListProps {
    /** The suggestion plugin pushes a new props object on every update, so the panel reads it through this accessor */
    current: Accessor<PanelProps>;
    register: (handle: MentionListHandle) => void;
}

const suggestion: MentionSuggestion = {
    items: () => FirstLevel,
    command: ({ editor, range, props }) => {
        const { item, allowHotKeySend } = props as MentionCommandProps;
        if (typeof allowHotKeySend === 'boolean') {
            // AIChatInput registers its state under the extension name, which tiptap's Storage type does not know
            (editor.storage as Record<string, { allowHotKeySend: boolean }>).SemiAIChatInput.allowHotKeySend = allowHotKeySend;
        }
        if (item) {
            editor
                .chain()
                .focus()
                .insertContentAt(range, {
                    type: 'referSlot',
                    attrs: {
                        type: item.type,
                        value: item.name || '',
                        info: JSON.stringify({ path: item.path }),
                        uniqueKey: item.key,
                    },
                })
                .run();
        }
    },
    render: () => {
        let element: HTMLDivElement | undefined;
        let dispose: (() => void) | undefined;
        let setPanel: Setter<PanelProps> | undefined;
        let handle: MentionListHandle | undefined;

        const onExit = () => {
            dispose?.();
        };

        return {
            onStart: (start) => {
                const [current, setCurrent] = createSignal(start as PanelProps);
                setPanel = setCurrent;
                element = document.createElement('div');
                dispose = render(() => <MentionList current={current} register={(next) => (handle = next)} />, element);
                if (!start.clientRect) return;
                element.style.position = 'absolute';
                document.body.appendChild(element);
                updatePosition(start.editor, element);
            },
            onUpdate(next) {
                setPanel?.(next as PanelProps);
                if (!next.clientRect || !element) return;
                updatePosition(next.editor, element);
            },
            onKeyDown(props) {
                return handle?.onKeyDown({ ...props, exitCb: onExit }) ?? false;
            },
            onExit() {
                element?.remove();
                dispose?.();
            },
        };
    },
};

function MentionList(props: MentionListProps) {
    const [level, setLevel] = createSignal(1);
    const [options, setOptions] = createSignal<(string | PanelItem)[]>(FirstLevel);
    const [selectedIndex, setSelectedIndex] = createSignal(0);

    const filterOptions = createMemo(() => {
        const query = props.current().query;
        if (!query) {
            return options();
        }
        return options().filter((item) => {
            const name = typeof item === 'string' ? item : item.name;
            return name.toLowerCase().includes(query.toLowerCase());
        });
    });

    // a new list or query starts again from the first match
    createEffect(on([options, () => props.current().query], () => setSelectedIndex(0), { defer: true }));

    // While the panel is open, Enter belongs to it, not to AIChatInput's send
    onMount(() => {
        props.current().command({ allowHotKeySend: false });
        onCleanup(() => props.current().command({ allowHotKeySend: true }));
    });

    const selectItem = (item: string | PanelItem) => {
        if (typeof item === 'string') {
            setLevel(2);
            setOptions(TestAction[item]);
        } else {
            props.current().command({ item });
        }
    };

    const onItemClick = (item: string | PanelItem) => {
        const atFirstLevel = level() === 1;
        selectItem(item);
        // Clicking an option blurs the editor, so return focus after entering the second level
        if (atFirstLevel) {
            props.current().editor.commands.focus();
        }
    };

    // registered once mounted: the suggestion plugin forwards key presses to the handle from then on
    onMount(() => {
        props.register({
            onKeyDown: ({ event, exitCb }) => {
                const list = filterOptions();
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((selectedIndex() + list.length - 1) % list.length);
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((selectedIndex() + 1) % list.length);
                    return true;
                }
                if (event.key === 'Enter') {
                    const item = list[selectedIndex()];
                    if (item) {
                        selectItem(item);
                    }
                    return true;
                }
                if (event.key === 'Escape') {
                    if (level() === 1) {
                        exitCb?.();
                    } else {
                        setLevel(1);
                        setOptions(FirstLevel);
                    }
                    return true;
                }
                return false;
            },
        });
    });

    return (
        <div role="menu" class="ai-chat-input-custom-extension-dropdown-menu" style={{ width: level() === 1 ? '200px' : '300px' }}>
            <Show when={filterOptions().length} fallback={<div class="item">No result</div>}>
                <For each={filterOptions()}>
                    {(item, index) => (
                        <div
                            role="menuitem"
                            tabIndex={-1}
                            class={index() === selectedIndex() ? 'is-selected optionItem' : 'optionItem '}
                            onClick={() => onItemClick(item)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onItemClick(item);
                                }
                            }}
                            onMouseEnter={() => setSelectedIndex(index())}
                        >
                            {typeof item === 'string' ? (
                                <span>{item}</span>
                            ) : (
                                <div class="level2Item">
                                    <Dynamic component={item.icon} />
                                    <span class="name">{item.name}</span>
                                    <span class="path">{item.path}</span>
                                </div>
                            )}
                            <Show when={level() === 1}>
                                <IconChevronRight class="option-item-arrow" />
                            </Show>
                        </div>
                    )}
                </For>
            </Show>
        </div>
    );
}

function isImageType({ name = '', fileInstance }: Attachment) {
    const PIC_PREFIX = 'image/';
    const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
    const suffix = name.split('.').pop() ?? '';
    let result = false;
    const type = fileInstance?.type ?? '';
    if (type.startsWith(PIC_PREFIX)) {
        result = true;
    } else if (PIC_SUFFIX_ARRAY.includes(suffix)) {
        result = true;
    }
    return result;
}

// Icon components rather than elements: the top slot renders each one through Dynamic, with its own props
const refTypeToIconMap = new Map<string, Component<IconProps>>([
    ['file', IconFile],
    ['folder', IconFolder],
    ['branch', IconBranch],
    ['terminal', IconTerminal],
    ['web', IconGlobeStroke],
    ['change', IconConnectionPoint2],
    ['git', IconGit],
    ['code', IconCode],
]);

const extensions = [
    ReferSlot,
    Mention.configure({
        HTMLAttributes: {
            class: 'mention',
        },
        suggestion,
    }),
];

const customReferences: Reference[] = [
    {
        type: 'file',
        id: '1',
        name: 'horizontalScroller.tsx',
        path: 'packages/semi-ui-react/AIChatInput/horizontalScroller.tsx',
    },
    {
        type: 'folder',
        id: '2',
        name: 'AIChatInput',
        path: 'packages/semi-ui-react/AIChatInput',
    },
    {
        type: 'web',
        id: '3',
        name: 'web',
    },
    {
        type: 'change',
        id: '4',
        name: 'recentChange',
    },
    {
        type: 'branch',
        id: '5',
        name: 'Branch',
        detail: 'Diff with Main Branch',
        branch: 'feat/aichatinput',
        targetBranch: 'feat/targetBranch',
    },
    {
        type: 'terminal',
        id: '6',
        name: 'From 1-2',
        from: 1,
        to: 2,
    },
];

const transformer = new Map([
    [
        'referSlot',
        ({ attrs: { value, info, type = 'text', uniqueKey } }: { attrs: ReferSlotAttrs }) => {
            return {
                type: type,
                value: value,
                uniqueKey: uniqueKey,
                ...JSON.parse(info),
            };
        },
    ],
]);

function onContentChange(content: Content[]) {
    console.log('onContentChange', content);
}

export default function AIChatInputDemo() {
    let input: AIChatInputElement | undefined;
    const [reference, setReference] = createSignal(customReferences);

    const renderTopSlot = (slot: RenderTopSlotProps) => (
        <div class="ai-chat-input-topSlot">
            <For each={slot.content.filter((item) => item.type !== 'text')}>
                {(item) => (
                    <div class="item">
                        <span class="item-icon">
                            <Show when={item.type && refTypeToIconMap.get(item.type)} keyed>
                                {(icon) => <Dynamic component={icon} size="small" class="item-left item-icon" />}
                            </Show>
                            <button type="button" class="item-icon-delete" aria-label="删除" onClick={() => input?.deleteContent(item)}>
                                <IconClose size="small" />
                            </button>
                        </span>
                        <span class="item-content">
                            {item.name ? item.name : item.value}
                            <Show when={item.type === 'branch'}>
                                <span class="detail">{item.detail}</span>
                            </Show>
                        </span>
                    </div>
                )}
            </For>
            <For each={slot.references}>
                {(item) => (
                    <div class="item">
                        <span class="item-icon">
                            <Show when={item.type && refTypeToIconMap.get(item.type)} keyed>
                                {(icon) => <Dynamic component={icon} size="small" class="item-left item-icon" />}
                            </Show>
                            <button type="button" class="item-icon-delete" aria-label="删除" onClick={() => setReference((list) => list.filter((ref) => ref.id !== item.id))}>
                                <IconClose size="small" />
                            </button>
                        </span>
                        <span class="item-content">
                            {item.name}
                            <Show when={item.type === 'branch'}>
                                <span class="detail">{item.detail}</span>
                            </Show>
                        </span>
                    </div>
                )}
            </For>
            <For each={slot.attachments}>
                {(item) => (
                    <div class="item">
                        <span class="item-icon">
                            <Show when={isImageType(item)} fallback={<IconUpload size="small" class="item-left item-icon" />}>
                                <img class="item-image item-left" src={item.url} alt={item.name} />
                            </Show>
                            <button type="button" class="item-icon-delete" aria-label="删除" onClick={() => input?.deleteUploadFile(item)}>
                                <IconClose size="small" />
                            </button>
                        </span>
                        <span class="item-content">{item.name}</span>
                    </div>
                )}
            </For>
        </div>
    );

    return (
        <AIChatInput
            class="aiChatInput-customTopSlot"
            renderTopSlot={renderTopSlot}
            extensions={extensions}
            references={reference()}
            showUploadFile={false}
            showReference={false}
            onContentChange={onContentChange}
            ref={(element) => (input = element)}
            transformer={transformer}
            uploadProps={uploadProps}
            style={outerStyle}
            placeholder="使用 @ 触发"
        />
    );
}
