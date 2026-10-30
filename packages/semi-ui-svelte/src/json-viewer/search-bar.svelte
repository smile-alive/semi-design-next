<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { IconCaseSensitive, IconChevronLeft, IconChevronRight, IconClose, IconRegExp, IconWholeWord } from '@fibrae/semi-icons-svelte';
    import ButtonGroup from '../button/button-group.svelte';
    import Button from '../button/button.svelte';
    import Input from '../input/input.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getJsonViewerContext } from './context.js';

    let { onClose }: { onClose: () => void } = $props();

    const ctx = getJsonViewerContext('SearchBar');
    const locale = useLocale('JsonViewer');

    let searchInput = $state<ReturnType<typeof Input>>();
    let replaceText = $state('');

    const prefix = cssClasses.PREFIX;

    const searchOptionItems = [
        { key: 'caseSensitive', icon: IconCaseSensitive },
        { key: 'regex', icon: IconRegExp },
        { key: 'wholeWord', icon: IconWholeWord },
    ] as const;

    const onSearchInput = (text: string) => {
        ctx.search(text);
        // the editor's layout moves focus to its content area while editable
        searchInput?.focus();
    };

    // every control closes the bar on Escape; the landmark takes no keyboard handler, and the key goes no further, so a
    // Modal or Tooltip around the viewer keeps its own Escape for itself
    const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
        }
    };

    // search and replace move focus to the editor; restore it so Esc and Tab continue from the keyboard user's position
    const keepFocus = (run: () => void) => {
        const active = FocusTrapHandle.getDeepActiveElement();
        run();
        active?.focus();
    };

    onMount(() => searchInput?.focus());
</script>

<search aria-label={locale().locale.search} class={`${prefix}-search-bar-container`} style="position: absolute; top: 20px; right: 20px">
    <div class={`${prefix}-search-bar`}>
        <Input aria-label={locale().locale.search} bind:this={searchInput} class={`${prefix}-search-bar-input`} composition onChange={onSearchInput} onKeyDown={closeOnEscape} placeholder={locale().locale.search} showClear={false} />
        <ul class={`${prefix}-search-options`}>
            {#each searchOptionItems as item (item.key)}
                <li class={[`${prefix}-search-options-item`, { [`${prefix}-search-options-item-active`]: ctx.searchOptions[item.key] }]}>
                    <Button aria-label={locale().locale[item.key]} aria-pressed={ctx.searchOptions[item.key]} theme="borderless" type="tertiary" onclick={() => keepFocus(() => ctx.toggleSearchOption(item.key))} onkeydown={closeOnEscape}>
                        {#snippet icon()}
                            <item.icon />
                        {/snippet}
                    </Button>
                </li>
            {/each}
        </ul>
        <ButtonGroup>
            <Button aria-label={locale().locale.previousMatch} onclick={() => keepFocus(() => ctx.prevSearch())} onkeydown={closeOnEscape}>
                {#snippet icon()}
                    <IconChevronLeft />
                {/snippet}
            </Button>
            <Button aria-label={locale().locale.nextMatch} onclick={() => keepFocus(() => ctx.nextSearch())} onkeydown={closeOnEscape}>
                {#snippet icon()}
                    <IconChevronRight />
                {/snippet}
            </Button>
        </ButtonGroup>
        <Button aria-label={locale().locale.close} size="small" theme="borderless" type="tertiary" onclick={onClose} onkeydown={closeOnEscape}>
            {#snippet icon()}
                <IconClose />
            {/snippet}
        </Button>
    </div>
    <div class={`${prefix}-replace-bar`}>
        <Input aria-label={locale().locale.replace} bind:value={() => replaceText, (next) => (replaceText = String(next ?? ''))} class={`${prefix}-replace-bar-input`} onKeyDown={closeOnEscape} placeholder={locale().locale.replace} showClear={false} />
        <Button disabled={ctx.readOnly} style="width: fit-content" onclick={() => keepFocus(() => ctx.replace(replaceText))} onkeydown={closeOnEscape}>
            {locale().locale.replace}
        </Button>
        <Button disabled={ctx.readOnly} style="width: fit-content" onclick={() => keepFocus(() => ctx.replaceAll(replaceText))} onkeydown={closeOnEscape}>
            {locale().locale.replaceAll}
        </Button>
    </div>
</search>
