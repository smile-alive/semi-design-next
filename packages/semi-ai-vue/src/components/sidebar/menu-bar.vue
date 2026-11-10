<script setup lang="ts">
    import { type Component, computed, onBeforeUnmount, shallowRef } from 'vue';
    import type { ChainedCommands } from '@tiptap/core';
    import type { Editor } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { type FileMenuButton, type FileMenuButtonKey, type Level, type TextRange, clearSelectionHighlight, confirmLink, getFileMenuItems, readFileMenuState, readLinkEditorOpenState, unsetLink } from '@fibrae/semi-ai-foundation/components/sidebar/file-extensions';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
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
    import { useLocale } from '@fibrae/semi-ui-vue/composables';
    import Divider from '@fibrae/semi-ui-vue/divider/index';
    import Dropdown, { DropdownItem, DropdownMenu } from '@fibrae/semi-ui-vue/dropdown/index';
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

    const icons: Record<FileMenuButtonKey, Component> = {
        undo: IconUndo,
        redo: IconRedo,
        paragraph: IconText,
        bulletList: IconList,
        orderedList: IconOrderedList,
        blockquote: IconQuote,
        codeBlock: IconTerminal,
        horizontalRule: IconMinus,
        alignLeft: IconAlignLeft,
        alignCenter: IconAlignCenter,
        alignRight: IconAlignRight,
        alignJustify: IconAlignJustify,
        bold: IconBold,
        italic: IconItalic,
        strike: IconStrikeThrough,
        code: IconCode,
        image: IconImage,
    };

    const items = computed(() => getFileMenuItems(props.canUpload));

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

    const handleUnsetLink = () => {
        unsetLink(props.editor);
        Toast.success(text.value.linkRemoveSuccess);
        closeLink();
    };

    const active = (item: FileMenuButton) => (item.activeKey ? state.value[item.activeKey] : undefined);

    const disabled = (item: FileMenuButton) => item.enabledKey !== undefined && !state.value[item.enabledKey];

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
        <template v-for="(item, index) in items" :key="index">
            <Divider v-if="item.type === 'divider'" layout="vertical" />
            <Dropdown v-else-if="item.type === 'heading'">
                <MenuButton :active="state.isHeading" :aria-label="text.heading">
                    <template #icon>
                        <IconHn />
                    </template>
                </MenuButton>
                <template #content>
                    <DropdownMenu>
                        <DropdownItem
                            v-for="(icon, level) in headingIcons"
                            :key="level"
                            :active="state.headingLevel === level + 1"
                            :aria-label="formatLocale(text.headingLevel, { level: level + 1 })"
                            :class="[
                                `${prefix}-menu-bar-dropdown-item`,
                                {
                                    [`${prefix}-menu-bar-dropdown-item-active`]: state.headingLevel === level + 1,
                                },
                            ]"
                            @click="run((chain) => chain.toggleHeading({ level: (level + 1) as Level }))"
                        >
                            <component :is="icon" />
                        </DropdownItem>
                    </DropdownMenu>
                </template>
            </Dropdown>
            <Dropdown v-else-if="item.type === 'link'" trigger="click" :visible="linkVisible" @visibleChange="onLinkVisibleChange">
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
                        <Button :aria-label="text.removeLink" :disabled="!state.isLink" size="small" theme="borderless" @click="handleUnsetLink">
                            <template #icon>
                                <IconDeleteStroked />
                            </template>
                        </Button>
                    </div>
                </template>
            </Dropdown>
            <MenuButton v-else :active="active(item)" :aria-label="text[item.key]" :aria-pressed="active(item)" :disabled="disabled(item)" @click="run(item.command)">
                <template #icon>
                    <component :is="icons[item.key]" />
                </template>
            </MenuButton>
        </template>
    </div>
</template>
