<script lang="ts">
    import { type Component, untrack } from 'svelte';
    import type { ChainedCommands, Editor } from '@tiptap/core';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { type FileMenuButton, type FileMenuButtonKey, type Level, type TextRange, clearSelectionHighlight, confirmLink, getFileMenuItems, readFileMenuState, readLinkEditorOpenState, unsetLink } from '@fibrae/semi-ai-foundation/components/sidebar/file-extensions';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
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
    } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import Divider from '@fibrae/semi-ui-svelte/divider/divider.svelte';
    import { Dropdown, DropdownItem, DropdownMenu } from '@fibrae/semi-ui-svelte/dropdown/index';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Input from '@fibrae/semi-ui-svelte/input/input.svelte';
    import { Toast } from '@fibrae/semi-ui-svelte/toast/index';
    import MenuButton from './menu-button.svelte';

    // FileItem mounts the bar only once its editor exists and keeps that editor for its life
    let { editor, canUpload }: { editor: Editor; canUpload: boolean } = $props();

    const locale = useLocale('Sidebar');

    // Read in the transaction event, so the bar follows every transaction of the editor
    let menu = $state.raw(readFileMenuState(untrack(() => editor)));
    let linkVisible = $state(false);
    let linkInputValue = $state('');
    let linkSelectionRange: TextRange | null = null;

    const text = $derived(locale().locale);
    const prefix = cssClasses.FILE;
    const headingIcons = [IconH1, IconH2, IconH3, IconH4, IconH5, IconH6];

    const icons: Record<FileMenuButtonKey, Component<any>> = {
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

    const items = $derived(getFileMenuItems(canUpload));

    const update = () => {
        menu = readFileMenuState(editor);
    };

    const run = (command: (chain: ChainedCommands) => ChainedCommands) => command(editor.chain().focus()).run();

    const active = (item: FileMenuButton) => (item.activeKey ? menu[item.activeKey] : undefined);

    const disabled = (item: FileMenuButton) => item.enabledKey !== undefined && !menu[item.enabledKey];

    const closeLink = () => {
        linkVisible = false;
        linkSelectionRange = null;
    };

    const handleConfirmLink = () => {
        if (!confirmLink(editor, linkInputValue.trim(), linkSelectionRange)) {
            return;
        }
        Toast.success(text.linkAddSuccess);
        closeLink();
    };

    const handleUnsetLink = () => {
        unsetLink(editor);
        Toast.success(text.linkRemoveSuccess);
        closeLink();
    };

    const onLinkVisibleChange = (visible: boolean) => {
        linkVisible = visible;
        if (visible) {
            const { range, href } = readLinkEditorOpenState(editor);
            linkSelectionRange = range;
            linkInputValue = href;
        } else {
            clearSelectionHighlight(editor);
            linkSelectionRange = null;
        }
    };

    $effect(() => {
        const current = editor;
        current.on('transaction', update);
        return () => current.off('transaction', update);
    });
</script>

<div class={`${prefix}-menu-bar`}>
    {#each items as item, index (index)}
        {#if item.type === 'divider'}
            <Divider layout="vertical" />
        {:else if item.type === 'heading'}
            <Dropdown>
                {#snippet child({ props })}
                    <MenuButton {...props} active={menu.isHeading} aria-label={text.heading}>
                        {#snippet icon()}<IconHn />{/snippet}
                    </MenuButton>
                {/snippet}
                {#snippet content()}
                    <DropdownMenu>
                        {#each headingIcons as HeadingIcon, level (level)}
                            <DropdownItem
                                active={menu.headingLevel === level + 1}
                                aria-label={formatLocale(text.headingLevel, { level: level + 1 })}
                                class={[`${prefix}-menu-bar-dropdown-item`, { [`${prefix}-menu-bar-dropdown-item-active`]: menu.headingLevel === level + 1 }]}
                                onclick={() => run((chain) => chain.toggleHeading({ level: (level + 1) as Level }))}
                            >
                                <HeadingIcon />
                            </DropdownItem>
                        {/each}
                    </DropdownMenu>
                {/snippet}
            </Dropdown>
        {:else if item.type === 'link'}
            <Dropdown bind:visible={linkVisible} onVisibleChange={onLinkVisibleChange} trigger="click">
                {#snippet child({ props })}
                    <MenuButton {...props} active={menu.isLink} aria-label={text.link}>
                        {#snippet icon()}<IconLink />{/snippet}
                    </MenuButton>
                {/snippet}
                {#snippet content()}
                    <div class={`${prefix}-menu-bar-link-dropdown`}>
                        <Input bind:value={linkInputValue} class={`${prefix}-menu-bar-link-input`} onEnterPress={handleConfirmLink} placeholder={text.enterLinkAddress} showClear={false} size="small" />
                        <Button aria-label={text.confirmLink} disabled={!linkInputValue.trim()} size="small" theme="borderless" type="tertiary" onclick={handleConfirmLink}>
                            {#snippet icon()}<IconCheckCircleStroked />{/snippet}
                        </Button>
                        <Button aria-label={text.removeLink} disabled={!menu.isLink} size="small" theme="borderless" onclick={handleUnsetLink}>
                            {#snippet icon()}<IconDeleteStroked />{/snippet}
                        </Button>
                    </div>
                {/snippet}
            </Dropdown>
        {:else}
            {@const Icon = icons[item.key]}
            <MenuButton active={active(item)} aria-label={text[item.key]} aria-pressed={active(item)} disabled={disabled(item)} onclick={() => run(item.command)}>
                {#snippet icon()}<Icon />{/snippet}
            </MenuButton>
        {/if}
    {/each}
</div>
