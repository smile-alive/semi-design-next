<script lang="ts">
    import { untrack } from 'svelte';
    import type { ChainedCommands, Editor } from '@tiptap/core';
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

    const update = () => {
        menu = readFileMenuState(editor);
    };

    const run = (command: (chain: ChainedCommands) => ChainedCommands) => command(editor.chain().focus()).run();

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

    const unsetLink = () => {
        clearSelectionHighlight(editor);
        run((chain) => chain.unsetLink());
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
    <MenuButton aria-label={text.undo} disabled={!menu.canUndo} onclick={() => run((chain) => chain.undo())}>
        {#snippet icon()}<IconUndo />{/snippet}
    </MenuButton>
    <MenuButton aria-label={text.redo} disabled={!menu.canRedo} onclick={() => run((chain) => chain.redo())}>
        {#snippet icon()}<IconRedo />{/snippet}
    </MenuButton>
    <Divider layout="vertical" />
    <Dropdown>
        {#snippet child({ props })}
            <MenuButton {...props} active={menu.isHeading} aria-label={text.heading}>
                {#snippet icon()}<IconHn />{/snippet}
            </MenuButton>
        {/snippet}
        {#snippet content()}
            <DropdownMenu>
                {#each headingIcons as HeadingIcon, index (index)}
                    <DropdownItem
                        active={menu.headingLevel === index + 1}
                        aria-label={text.headingLevel.replace('${level}', String(index + 1))}
                        class={[`${prefix}-menu-bar-dropdown-item`, { [`${prefix}-menu-bar-dropdown-item-active`]: menu.headingLevel === index + 1 }]}
                        onclick={() => run((chain) => chain.toggleHeading({ level: (index + 1) as Level }))}
                    >
                        <HeadingIcon />
                    </DropdownItem>
                {/each}
            </DropdownMenu>
        {/snippet}
    </Dropdown>
    <MenuButton active={menu.isParagraph} aria-label={text.paragraph} aria-pressed={menu.isParagraph} onclick={() => run((chain) => chain.setParagraph())}>
        {#snippet icon()}<IconText />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isBulletList} aria-label={text.bulletList} aria-pressed={menu.isBulletList} onclick={() => run((chain) => chain.toggleBulletList())}>
        {#snippet icon()}<IconList />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isOrderedList} aria-label={text.orderedList} aria-pressed={menu.isOrderedList} onclick={() => run((chain) => chain.toggleOrderedList())}>
        {#snippet icon()}<IconOrderedList />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isBlockquote} aria-label={text.blockquote} aria-pressed={menu.isBlockquote} onclick={() => run((chain) => chain.toggleBlockquote())}>
        {#snippet icon()}<IconQuote />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isCodeBlock} aria-label={text.codeBlock} aria-pressed={menu.isCodeBlock} onclick={() => run((chain) => chain.toggleCodeBlock())}>
        {#snippet icon()}<IconTerminal />{/snippet}
    </MenuButton>
    <MenuButton aria-label={text.horizontalRule} onclick={() => run((chain) => chain.setHorizontalRule())}>
        {#snippet icon()}<IconMinus />{/snippet}
    </MenuButton>
    <Divider layout="vertical" />
    <MenuButton active={menu.isAlignLeft} aria-label={text.alignLeft} aria-pressed={menu.isAlignLeft} onclick={() => run((chain) => chain.setTextAlign('left'))}>
        {#snippet icon()}<IconAlignLeft />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isAlignCenter} aria-label={text.alignCenter} aria-pressed={menu.isAlignCenter} onclick={() => run((chain) => chain.setTextAlign('center'))}>
        {#snippet icon()}<IconAlignCenter />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isAlignRight} aria-label={text.alignRight} aria-pressed={menu.isAlignRight} onclick={() => run((chain) => chain.setTextAlign('right'))}>
        {#snippet icon()}<IconAlignRight />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isAlignJustify} aria-label={text.alignJustify} aria-pressed={menu.isAlignJustify} onclick={() => run((chain) => chain.setTextAlign('justify'))}>
        {#snippet icon()}<IconAlignJustify />{/snippet}
    </MenuButton>
    <Divider layout="vertical" />
    <MenuButton active={menu.isBold} aria-label={text.bold} aria-pressed={menu.isBold} onclick={() => run((chain) => chain.toggleBold())}>
        {#snippet icon()}<IconBold />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isItalic} aria-label={text.italic} aria-pressed={menu.isItalic} disabled={!menu.canItalic} onclick={() => run((chain) => chain.toggleItalic())}>
        {#snippet icon()}<IconItalic />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isStrike} aria-label={text.strike} aria-pressed={menu.isStrike} disabled={!menu.canStrike} onclick={() => run((chain) => chain.toggleStrike())}>
        {#snippet icon()}<IconStrikeThrough />{/snippet}
    </MenuButton>
    <MenuButton active={menu.isCode} aria-label={text.code} aria-pressed={menu.isCode} disabled={!menu.canCode} onclick={() => run((chain) => chain.toggleCode())}>
        {#snippet icon()}<IconCode />{/snippet}
    </MenuButton>
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
                <Button aria-label={text.removeLink} disabled={!menu.isLink} size="small" theme="borderless" onclick={unsetLink}>
                    {#snippet icon()}<IconDeleteStroked />{/snippet}
                </Button>
            </div>
        {/snippet}
    </Dropdown>
    {#if canUpload}
        <Divider layout="vertical" />
        <MenuButton aria-label={text.image} disabled={!menu.canInsertImage} onclick={() => run((chain) => chain.insertContent({ type: 'imageUpload' }))}>
            {#snippet icon()}<IconImage />{/snippet}
        </MenuButton>
    {/if}
</div>
