<script setup lang="ts">
    import { computed, onBeforeUnmount, shallowRef } from 'vue';
    import type { ChainedCommands } from '@tiptap/core';
    import type { Editor } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { type Level, type TextRange, clearSelectionHighlight, confirmLink, readFileMenuState, readLinkEditorOpenState } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
    import {
        IconAlignCenter,
        IconAlignJustify,
        IconAlignLeft,
        IconAlignRight,
        IconBold,
        IconCheckCircleStroked,
        IconCode,
        IconDeleteStroked,
        IconH1,
        IconH2,
        IconH3,
        IconH4,
        IconH5,
        IconH6,
        IconHn,
        IconImage,
        IconItalic,
        IconLink,
        IconList,
        IconMinus,
        IconOrderedList,
        IconQuote,
        IconRedo,
        IconStrikeThrough,
        IconTerminal,
        IconText,
        IconUndo,
    } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Divider from '@fibrae/semi-ui-vue/divider/index';
    import Dropdown, { DropdownItem, DropdownMenu } from '@fibrae/semi-ui-vue/dropdown/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Input from '@fibrae/semi-ui-vue/input/index';
    import Toast from '@fibrae/semi-ui-vue/toast/index';
    import MenuButton from './menu-button.vue';

    // FileItem mounts the bar only once its editor exists and keeps that editor for its life
    const props = defineProps<{ editor: Editor; canUpload: boolean }>();

    const locale = useLocale('Sidebar');

    // Read in the transaction event: the Vue editor's reactive state settles two frames later, so the bar would lag a step.
    const state = shallowRef(readFileMenuState(props.editor));

    const text = computed(() => locale.value.locale);
    const prefix = cssClasses.FILE;
    const headingIcons = [IconH1, IconH2, IconH3, IconH4, IconH5, IconH6];

    const update = () => {
        state.value = readFileMenuState(props.editor);
    };

    props.editor.on('transaction', update);

    const linkVisible = shallowRef(false);
    const linkInputValue = shallowRef('');
    let linkSelectionRange: TextRange | null = null;

    const run = (command: (chain: ChainedCommands) => ChainedCommands) => command(props.editor.chain().focus()).run();

    const closeLink = () => {
        linkVisible.value = false;
        linkSelectionRange = null;
    };

    const handleConfirmLink = () => {
        if (!confirmLink(props.editor, linkInputValue.value.trim(), linkSelectionRange)) {
            return;
        }
        Toast.success(text.value.linkAddSuccess);
        closeLink();
    };

    const unsetLink = () => {
        clearSelectionHighlight(props.editor);
        run((chain) => chain.unsetLink());
        Toast.success(text.value.linkRemoveSuccess);
        closeLink();
    };

    const onLinkVisibleChange = (visible: boolean) => {
        linkVisible.value = visible;
        if (visible) {
            const { range, href } = readLinkEditorOpenState(props.editor);
            linkSelectionRange = range;
            linkInputValue.value = href;
        } else {
            clearSelectionHighlight(props.editor);
            linkSelectionRange = null;
        }
    };

    onBeforeUnmount(() => props.editor.off('transaction', update));
</script>

<template>
    <div :class="`${prefix}-menu-bar`">
        <MenuButton :aria-label="text.undo" :disabled="!state.canUndo" @click="run((chain) => chain.undo())">
            <template #icon>
                <IconUndo />
            </template>
        </MenuButton>
        <MenuButton :aria-label="text.redo" :disabled="!state.canRedo" @click="run((chain) => chain.redo())">
            <template #icon>
                <IconRedo />
            </template>
        </MenuButton>
        <Divider layout="vertical" />
        <Dropdown>
            <MenuButton :active="state.isHeading" :aria-label="text.heading">
                <template #icon>
                    <IconHn />
                </template>
            </MenuButton>
            <template #content>
                <DropdownMenu>
                    <DropdownItem
                        v-for="(icon, index) in headingIcons"
                        :key="index"
                        :active="state.headingLevel === index + 1"
                        :aria-label="text.headingLevel.replace('${level}', String(index + 1))"
                        :class="[
                            `${prefix}-menu-bar-dropdown-item`,
                            {
                                [`${prefix}-menu-bar-dropdown-item-active`]: state.headingLevel === index + 1,
                            },
                        ]"
                        @click="run((chain) => chain.toggleHeading({ level: (index + 1) as Level }))"
                    >
                        <component :is="icon" />
                    </DropdownItem>
                </DropdownMenu>
            </template>
        </Dropdown>
        <MenuButton :active="state.isParagraph" :aria-label="text.paragraph" :aria-pressed="state.isParagraph" @click="run((chain) => chain.setParagraph())">
            <template #icon>
                <IconText />
            </template>
        </MenuButton>
        <MenuButton :active="state.isBulletList" :aria-label="text.bulletList" :aria-pressed="state.isBulletList" @click="run((chain) => chain.toggleBulletList())">
            <template #icon>
                <IconList />
            </template>
        </MenuButton>
        <MenuButton :active="state.isOrderedList" :aria-label="text.orderedList" :aria-pressed="state.isOrderedList" @click="run((chain) => chain.toggleOrderedList())">
            <template #icon>
                <IconOrderedList />
            </template>
        </MenuButton>
        <MenuButton :active="state.isBlockquote" :aria-label="text.blockquote" :aria-pressed="state.isBlockquote" @click="run((chain) => chain.toggleBlockquote())">
            <template #icon>
                <IconQuote />
            </template>
        </MenuButton>
        <MenuButton :active="state.isCodeBlock" :aria-label="text.codeBlock" :aria-pressed="state.isCodeBlock" @click="run((chain) => chain.toggleCodeBlock())">
            <template #icon>
                <IconTerminal />
            </template>
        </MenuButton>
        <MenuButton :aria-label="text.horizontalRule" @click="run((chain) => chain.setHorizontalRule())">
            <template #icon>
                <IconMinus />
            </template>
        </MenuButton>
        <Divider layout="vertical" />
        <MenuButton :active="state.isAlignLeft" :aria-label="text.alignLeft" :aria-pressed="state.isAlignLeft" @click="run((chain) => chain.setTextAlign('left'))">
            <template #icon>
                <IconAlignLeft />
            </template>
        </MenuButton>
        <MenuButton :active="state.isAlignCenter" :aria-label="text.alignCenter" :aria-pressed="state.isAlignCenter" @click="run((chain) => chain.setTextAlign('center'))">
            <template #icon>
                <IconAlignCenter />
            </template>
        </MenuButton>
        <MenuButton :active="state.isAlignRight" :aria-label="text.alignRight" :aria-pressed="state.isAlignRight" @click="run((chain) => chain.setTextAlign('right'))">
            <template #icon>
                <IconAlignRight />
            </template>
        </MenuButton>
        <MenuButton :active="state.isAlignJustify" :aria-label="text.alignJustify" :aria-pressed="state.isAlignJustify" @click="run((chain) => chain.setTextAlign('justify'))">
            <template #icon>
                <IconAlignJustify />
            </template>
        </MenuButton>
        <Divider layout="vertical" />
        <MenuButton :active="state.isBold" :aria-label="text.bold" :aria-pressed="state.isBold" @click="run((chain) => chain.toggleBold())">
            <template #icon>
                <IconBold />
            </template>
        </MenuButton>
        <MenuButton :active="state.isItalic" :aria-label="text.italic" :aria-pressed="state.isItalic" :disabled="!state.canItalic" @click="run((chain) => chain.toggleItalic())">
            <template #icon>
                <IconItalic />
            </template>
        </MenuButton>
        <MenuButton :active="state.isStrike" :aria-label="text.strike" :aria-pressed="state.isStrike" :disabled="!state.canStrike" @click="run((chain) => chain.toggleStrike())">
            <template #icon>
                <IconStrikeThrough />
            </template>
        </MenuButton>
        <MenuButton :active="state.isCode" :aria-label="text.code" :aria-pressed="state.isCode" :disabled="!state.canCode" @click="run((chain) => chain.toggleCode())">
            <template #icon>
                <IconCode />
            </template>
        </MenuButton>
        <Dropdown trigger="click" :visible="linkVisible" @visibleChange="onLinkVisibleChange">
            <MenuButton :active="state.isLink" :aria-label="text.link">
                <template #icon>
                    <IconLink />
                </template>
            </MenuButton>
            <template #content>
                <div :class="`${prefix}-menu-bar-link-dropdown`">
                    <Input v-model="linkInputValue" :class="`${prefix}-menu-bar-link-input`" :placeholder="text.enterLinkAddress" :showClear="false" size="small" @enterPress="handleConfirmLink" />
                    <Button :aria-label="text.confirmLink" :disabled="!linkInputValue.trim()" size="small" theme="borderless" type="tertiary" @click="handleConfirmLink">
                        <template #icon>
                            <IconCheckCircleStroked />
                        </template>
                    </Button>
                    <Button :aria-label="text.removeLink" :disabled="!state.isLink" size="small" theme="borderless" @click="unsetLink">
                        <template #icon>
                            <IconDeleteStroked />
                        </template>
                    </Button>
                </div>
            </template>
        </Dropdown>
        <template v-if="props.canUpload">
            <Divider layout="vertical" />
            <MenuButton :aria-label="text.image" :disabled="!state.canInsertImage" @click="run((chain) => chain.insertContent({ type: 'imageUpload' }))">
                <template #icon>
                    <IconImage />
                </template>
            </MenuButton>
        </template>
    </div>
</template>
