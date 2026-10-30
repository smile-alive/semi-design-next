<script lang="ts">
    import type { Component } from 'svelte';
    import { computePosition, shift } from '@floating-ui/dom';
    import { Node, mergeAttributes, posToDOMRect } from '@tiptap/core';
    import { Mention, type MentionNodeAttrs, type MentionOptions } from '@tiptap/extension-mention';
    import { AIChatInput, type AIChatInputAttachment as Attachment, type AIChatInputContent as Content, type AIChatInputReference as Reference } from '@fibrae/semi-ai-svelte';
    import { IconBranch, IconChevronRight, IconClose, IconCode, IconConnectionPoint2, IconFile, IconFolder, IconGit, IconGlobeStroke, IconTerminal, IconUpload } from '@fibrae/semi-icons-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };

    interface PanelItem {
        icon: Component;
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

    // A ProseMirror node view that renders plain DOM: tiptap has no Svelte binding, and the value is the only state
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

    type MentionSuggestion = MentionOptions['suggestion'];
    type MentionStartProps = Parameters<NonNullable<ReturnType<NonNullable<MentionSuggestion['render']>>['onStart']>>[0];

    // Content the panel returns through command, not limited to Mention's own attributes
    interface MentionCommandProps extends Partial<MentionNodeAttrs> {
        item?: PanelItem;
        allowHotKeySend?: boolean;
    }

    type MentionPanelProps = Omit<MentionStartProps, 'command'> & {
        command: (props: MentionCommandProps) => void;
    };

    // Suggestion panel state; null means closed
    let panel = $state.raw<MentionPanelProps | null>(null);
    let level = $state(1);
    let options = $state.raw<(string | PanelItem)[]>(FirstLevel);
    let selectedIndex = $state(0);
    let floating = $state<HTMLElement>();
    let floatingStyle = $state('position: absolute; width: max-content; left: 0px; top: 0px');

    const filterOptions = $derived.by(() => {
        const query = panel?.query;
        return query
            ? options.filter((item) => {
                  const name = typeof item === 'string' ? item : item.name;
                  return name.toLowerCase().includes(query.toLowerCase());
              })
            : options;
    });

    // a new list or query starts again from the first match
    $effect(() => {
        void options;
        void panel?.query;
        selectedIndex = 0;
    });

    // The panel follows the caret; option changes resize it, so reposition
    $effect(() => {
        void filterOptions;
        const current = panel;
        if (!current?.clientRect || !floating) {
            return;
        }
        const virtualElement = {
            getBoundingClientRect: () => posToDOMRect(current.editor.view, current.editor.state.selection.from, current.editor.state.selection.to),
        };
        void computePosition(virtualElement, floating, {
            placement: 'bottom-start',
            strategy: 'absolute',
            middleware: [shift()],
        }).then(({ x, y, strategy }) => {
            floatingStyle = `position: ${strategy}; width: max-content; left: ${x}px; top: ${y}px`;
        });
    });

    // Mounted in the body so no ancestor's overflow clips the panel
    const portal = (element: HTMLElement) => {
        document.body.append(element);
        return () => element.remove();
    };

    const setHotKeySend = (allow: boolean) => {
        // While the panel is open, Enter belongs to it, not to AIChatInput's send
        panel?.command({ allowHotKeySend: allow });
    };

    const closePanel = () => {
        setHotKeySend(true);
        panel = null;
    };

    const selectItem = (item: string | PanelItem) => {
        if (typeof item === 'string') {
            level = 2;
            options = TestAction[item];
        } else {
            panel?.command({ item });
        }
    };

    const onItemClick = (item: string | PanelItem) => {
        selectItem(item);
        // Clicking an option blurs the editor, so return focus after entering the second level
        if (level === 1) {
            panel?.editor.commands.focus();
        }
    };

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
        render: () => ({
            onStart: (props) => {
                level = 1;
                options = FirstLevel;
                panel = props as MentionPanelProps;
                setHotKeySend(false);
            },
            onUpdate: (props) => {
                // After Escape closes the panel it stays closed until this suggestion ends
                if (panel) {
                    panel = props as MentionPanelProps;
                }
            },
            onKeyDown: ({ event }) => {
                if (!panel) {
                    return false;
                }
                if (event.key === 'ArrowUp') {
                    selectedIndex = (selectedIndex + filterOptions.length - 1) % filterOptions.length;
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    selectedIndex = (selectedIndex + 1) % filterOptions.length;
                    return true;
                }
                if (event.key === 'Enter') {
                    const item = filterOptions[selectedIndex];
                    if (item) {
                        selectItem(item);
                    }
                    return true;
                }
                if (event.key === 'Escape') {
                    if (level === 1) {
                        closePanel();
                    } else {
                        level = 1;
                        options = FirstLevel;
                    }
                    return true;
                }
                return false;
            },
            onExit: closePanel,
        }),
    };

    const extensions = [
        ReferSlot,
        Mention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            suggestion,
        }),
    ];

    let references = $state<Reference[]>([
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
    ]);

    const isImageType = ({ name = '', fileInstance }: Attachment) => {
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
    };

    const refTypeToIconMap: Record<string, Component> = {
        file: IconFile,
        folder: IconFolder,
        branch: IconBranch,
        terminal: IconTerminal,
        web: IconGlobeStroke,
        change: IconConnectionPoint2,
        git: IconGit,
        code: IconCode,
    };

    let input = $state<ReturnType<typeof AIChatInput>>();

    const richContent = (content: Content[]) => content.filter((item) => item.type !== 'text');

    const onReferenceDelete = (reference: Reference) => {
        references = references.filter((item) => item.id !== reference.id);
    };

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const transformer = new Map([
        [
            'referSlot',
            ({ attrs }: { attrs: ReferSlotAttrs }) => {
                const { value, info, type = 'text', uniqueKey } = attrs;
                return {
                    type: type,
                    value: value,
                    uniqueKey: uniqueKey,
                    ...JSON.parse(info),
                };
            },
        ],
    ]);
</script>

<AIChatInput bind:this={input} class="aiChatInput-customTopSlot" {extensions} {onContentChange} {onReferenceDelete} placeholder="使用 @ 触发" {references} showReference={false} showUploadFile={false} style="margin: 12px" {transformer} {uploadProps}>
    {#snippet topSlot({ attachments, content, references: items, onReferenceDelete: deleteReference, onUploadFileDelete })}
        <div class="ai-chat-input-topSlot">
            {#each richContent(content) as item, index (item.key ?? index)}
                {@const Icon = refTypeToIconMap[item.type]}
                <div class="item">
                    <span class="item-icon">
                        {#if Icon}
                            <Icon class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => input?.deleteContent(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {item.name ? item.name : item.value}
                        {#if item.type === 'branch'}
                            <span class="detail">{item.detail}</span>
                        {/if}
                    </span>
                </div>
            {/each}
            {#each items as item (item.id)}
                {@const Icon = refTypeToIconMap[item.type ?? '']}
                <div class="item">
                    <span class="item-icon">
                        {#if Icon}
                            <Icon class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => deleteReference(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {item.name}
                        {#if item.type === 'branch'}
                            <span class="detail">{item.detail}</span>
                        {/if}
                    </span>
                </div>
            {/each}
            {#each attachments as item (item.uid)}
                <div class="item">
                    <span class="item-icon">
                        {#if isImageType(item)}
                            <img alt={item.name} class="item-image item-left" src={item.url} />
                        {:else}
                            <IconUpload class="item-left item-icon" size="small" />
                        {/if}
                        <button aria-label="删除" class="item-icon-delete" type="button" onclick={() => onUploadFileDelete(item)}>
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">{item.name}</span>
                </div>
            {/each}
        </div>
    {/snippet}
</AIChatInput>
{#if panel}
    <div {@attach portal} bind:this={floating} style={floatingStyle}>
        <div class="ai-chat-input-custom-extension-dropdown-menu" role="menu" style="width: {level === 1 ? '200px' : '300px'}">
            {#if filterOptions.length}
                {#each filterOptions as item, index (index)}
                    <div
                        class={['optionItem', { 'is-selected': index === selectedIndex }]}
                        role="menuitem"
                        tabindex="-1"
                        onclick={() => onItemClick(item)}
                        onfocusin={() => (selectedIndex = index)}
                        onkeydown={(event) => {
                            if (event.key === 'Enter') {
                                onItemClick(item);
                            }
                        }}
                        onmouseenter={() => (selectedIndex = index)}
                    >
                        {#if typeof item === 'string'}
                            <span>{item}</span>
                        {:else}
                            <div class="level2Item">
                                <item.icon />
                                <span class="name">{item.name}</span>
                                <span class="path">{item.path}</span>
                            </div>
                        {/if}
                        {#if level === 1}
                            <IconChevronRight class="option-item-arrow" />
                        {/if}
                    </div>
                {/each}
            {:else}
                <div class="item">No result</div>
            {/if}
        </div>
    </div>
{/if}
