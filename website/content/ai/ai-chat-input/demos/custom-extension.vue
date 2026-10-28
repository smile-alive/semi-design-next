<script setup lang="ts">
    import { computed, defineComponent, h, ref, shallowRef, useTemplateRef, watch, type Component, type CSSProperties } from 'vue';
    import { computePosition, shift } from '@floating-ui/dom';
    import { Node, mergeAttributes } from '@tiptap/core';
    import { Mention, type MentionNodeAttrs, type MentionOptions } from '@tiptap/extension-mention';
    import { NodeViewWrapper, VueNodeViewRenderer, nodeViewProps, posToDOMRect } from '@tiptap/vue-3';
    import { AIChatInput, type AIChatInputHandle, type AIChatInputAttachment as Attachment, type AIChatInputContent as Content, type AIChatInputReference as Reference } from '@fibrae/semi-ai-vue';
    import { IconFile, IconFolder, IconBranch, IconCode, IconGit, IconGlobeStroke, IconChevronRight, IconClose, IconUpload, IconTerminal, IconConnectionPoint2 } from '@fibrae/semi-icons-vue';
    import { useMounted } from '@fibrae/semi-ui-vue/hooks';

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

    // Node views must be components but a demo file holds one SFC, so it is a render function
    const ReferSlotView = defineComponent({
        props: nodeViewProps,
        setup: (props) => () => h(NodeViewWrapper, { as: 'span', class: 'ai-chat-input-refer-slot-wrapper' }, () => h('span', { class: 'ai-chat-input-refer-slot' }, props.node.attrs.value ?? '')),
    });

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
            return VueNodeViewRenderer(ReferSlotView);
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

    // The Teleport target is the browser's body, which the server render and the hydration pass do not have
    const mounted = useMounted();
    // Suggestion panel state; null means closed
    const panel = shallowRef<MentionPanelProps | null>(null);
    const level = ref(1);
    const options = shallowRef<(string | PanelItem)[]>(FirstLevel);
    const selectedIndex = ref(0);
    const floating = useTemplateRef<HTMLElement>('floating');
    const floatingStyle = ref<CSSProperties>({ position: 'absolute', width: 'max-content', left: '0px', top: '0px' });

    const filterOptions = computed(() => {
        const query = panel.value?.query;
        return query
            ? options.value.filter((item) => {
                  const name = typeof item === 'string' ? item : item.name;
                  return name.toLowerCase().includes(query.toLowerCase());
              })
            : options.value;
    });

    watch([options, () => panel.value?.query], () => {
        selectedIndex.value = 0;
    });

    // The panel follows the caret; option changes resize it, so reposition
    watch(
        [panel, filterOptions],
        () => {
            const current = panel.value;
            if (!current?.clientRect || !floating.value) return;
            const virtualElement = {
                getBoundingClientRect: () => posToDOMRect(current.editor.view, current.editor.state.selection.from, current.editor.state.selection.to),
            };
            void computePosition(virtualElement, floating.value, {
                placement: 'bottom-start',
                strategy: 'absolute',
                middleware: [shift()],
            }).then(({ x, y, strategy }) => {
                floatingStyle.value = { position: strategy, width: 'max-content', left: `${x}px`, top: `${y}px` };
            });
        },
        { flush: 'post' }
    );

    const setHotKeySend = (allow: boolean) => {
        // While the panel is open, Enter belongs to it, not to AIChatInput's send
        panel.value?.command({ allowHotKeySend: allow });
    };

    const closePanel = () => {
        setHotKeySend(true);
        panel.value = null;
    };

    const selectItem = (item: string | PanelItem) => {
        if (typeof item === 'string') {
            level.value = 2;
            options.value = TestAction[item];
        } else {
            panel.value?.command({ item });
        }
    };

    const onItemClick = (item: string | PanelItem) => {
        selectItem(item);
        // Clicking an option blurs the editor, so return focus after entering the second level
        if (level.value === 1) {
            panel.value?.editor.commands.focus();
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
                level.value = 1;
                options.value = FirstLevel;
                panel.value = props as MentionPanelProps;
                setHotKeySend(false);
            },
            onUpdate: (props) => {
                // After Escape closes the panel it stays closed until this suggestion ends
                if (panel.value) {
                    panel.value = props as MentionPanelProps;
                }
            },
            onKeyDown: ({ event }) => {
                if (!panel.value) return false;
                if (event.key === 'ArrowUp') {
                    selectedIndex.value = (selectedIndex.value + filterOptions.value.length - 1) % filterOptions.value.length;
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    selectedIndex.value = (selectedIndex.value + 1) % filterOptions.value.length;
                    return true;
                }
                if (event.key === 'Enter') {
                    const item = filterOptions.value[selectedIndex.value];
                    if (item) {
                        selectItem(item);
                    }
                    return true;
                }
                if (event.key === 'Escape') {
                    if (level.value === 1) {
                        closePanel();
                    } else {
                        level.value = 1;
                        options.value = FirstLevel;
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

    const references = ref<Reference[]>([
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

    function isImageType(item: Attachment) {
        const PIC_PREFIX = 'image/';
        const PIC_SUFFIX_ARRAY = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
        const { name = '', fileInstance } = item;
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

    const input = useTemplateRef<AIChatInputHandle>('input');

    const richContent = (content: Content[]) => content.filter((item) => item.type !== 'text');

    const onReferenceDelete = (reference: Reference) => {
        references.value = references.value.filter((item) => item.id !== reference.id);
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

<template>
    <AIChatInput
        ref="input"
        class="aiChatInput-customTopSlot"
        :extensions="extensions"
        placeholder="使用 @ 触发"
        :references="references"
        :showReference="false"
        :showUploadFile="false"
        style="margin: 12px"
        :transformer="transformer"
        :uploadProps="uploadProps"
        @contentChange="onContentChange"
        @referenceDelete="onReferenceDelete"
    >
        <template #topSlot="{ attachments, content, references: items, onReferenceDelete: deleteReference, onUploadFileDelete }">
            <div class="ai-chat-input-topSlot">
                <div v-for="(item, index) in richContent(content)" :key="item.key ?? index" class="item">
                    <span class="item-icon">
                        <component :is="refTypeToIconMap[item.type]" v-if="refTypeToIconMap[item.type]" class="item-left item-icon" size="small" />
                        <button aria-label="删除" class="item-icon-delete" type="button" @click="input?.deleteContent(item)">
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {{ item.name ? item.name : item.value }}
                        <span v-if="item.type === 'branch'" class="detail">{{ item.detail }}</span>
                    </span>
                </div>
                <div v-for="item in items" :key="item.id" class="item">
                    <span class="item-icon">
                        <component :is="refTypeToIconMap[item.type ?? '']" v-if="item.type && refTypeToIconMap[item.type]" class="item-left item-icon" size="small" />
                        <button aria-label="删除" class="item-icon-delete" type="button" @click="deleteReference(item)">
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">
                        {{ item.name }}
                        <span v-if="item.type === 'branch'" class="detail">{{ item.detail }}</span>
                    </span>
                </div>
                <div v-for="item in attachments" :key="item.uid" class="item">
                    <span class="item-icon">
                        <img v-if="isImageType(item)" :alt="item.name" class="item-image item-left" :src="item.url" />
                        <IconUpload v-else class="item-left item-icon" size="small" />
                        <button aria-label="删除" class="item-icon-delete" type="button" @click="onUploadFileDelete(item)">
                            <IconClose size="small" />
                        </button>
                    </span>
                    <span class="item-content">{{ item.name }}</span>
                </div>
            </div>
        </template>
    </AIChatInput>
    <Teleport v-if="mounted" to="body">
        <div v-if="panel" ref="floating" :style="floatingStyle">
            <div class="ai-chat-input-custom-extension-dropdown-menu" role="menu" :style="{ width: level === 1 ? '200px' : '300px' }">
                <template v-if="filterOptions.length">
                    <div v-for="(item, index) in filterOptions" :key="index" :class="['optionItem', { 'is-selected': index === selectedIndex }]" role="menuitem" tabindex="-1" @click="onItemClick(item)" @focusin="selectedIndex = index" @keydown.enter="onItemClick(item)" @mouseenter="selectedIndex = index">
                        <span v-if="typeof item === 'string'">{{ item }}</span>
                        <div v-else class="level2Item">
                            <component :is="item.icon" />
                            <span class="name">{{ item.name }}</span>
                            <span class="path">{{ item.path }}</span>
                        </div>
                        <IconChevronRight v-if="level === 1" class="option-item-arrow" />
                    </div>
                </template>
                <div v-else class="item">No result</div>
            </div>
        </div>
    </Teleport>
</template>
