<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { focusAfterModeChange } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
    import { IconClose, IconCopyStroked } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import { ToastFactory } from '@fibrae/semi-ui-svelte/toast/index';
    import Container from './container/container.svelte';
    import type { SideBarOption, SideBarProps } from './interface.js';
    import CodeItem from './widget/code-item.svelte';
    import FileItem from './widget/file-item.svelte';
    import type { CodeItemData, FileItemData } from './widget/interface.js';

    const defaults = useDefaultProps('Sidebar');

    // No fallback on the bindables: a bound `undefined` would throw with one
    let {
        visible = $bindable(),
        activeKey = $bindable(),
        title = defaults('title'),
        motion = defaults('motion'),
        resizable = defaults('resizable'),
        minWidth = defaults('minWidth'),
        maxWidth = defaults('maxWidth'),
        defaultSize = defaults('defaultSize'),
        showClose = defaults('showClose'),
        closeOnEsc = defaults('closeOnEsc'),
        mode = defaults('mode', strings.MODE.MAIN),
        options = defaults('options'),
        detailContent = defaults('detailContent'),
        fileEditable = defaults('fileEditable', true),
        imgUploadProps = defaults('imgUploadProps'),
        afterVisibleChange,
        onActiveOptionChange,
        onBackWard,
        onDetailContentCopy,
        onFileContentChange,
        optionIcon,
        optionItem,
        mainContent,
        detailHeader,
        detailBody,
        customRender,
        searchButton,
        ...rest
    }: SideBarProps = $props();

    const locale = useLocale('Sidebar');

    let container: ReturnType<typeof Container> | undefined = $state();

    const prefix = cssClasses.SIDEBAR;
    const optionsCls = cssClasses.OPTIONS;
    const isMain = $derived(mode === strings.MODE.MAIN);

    const detailItem = $derived.by(() => {
        const { key: _key, ...item } = detailContent ?? {};
        return item;
    });

    // The container element is replaced on each hide and show; a toast list left behind would stay in the detached one.
    const toast = ToastFactory.create({ getPopupContainer: () => container?.getRoot() as HTMLElement });

    const onAfterVisibleChange = (isVisible: boolean) => {
        if (!isVisible) {
            toast.destroyAll();
        }
        afterVisibleChange?.(isVisible);
    };

    const selectOption = (event: MouseEvent, option: SideBarOption) => {
        activeKey = option.key;
        onActiveOptionChange?.(event, option.key);
    };

    const copyDetail = (event: MouseEvent) => {
        const content = detailContent?.content as string;
        void copyText(content).then((copied) => {
            // hidden while the clipboard write was pending
            if (copied && container?.getRoot()) {
                toast.success(locale().locale.copySuccess);
            }
            onDetailContentCopy?.(event, content, copied);
        });
    };

    watch(
        () => mode,
        (next) => focusAfterModeChange(container?.getRoot(), next === strings.MODE.MAIN)
    );

    onMount(() => () => toast.destroyAll());

    /** The `.semi-sidebar-container` element; null while hidden */
    export function getRoot() {
        return container?.getRoot() ?? null;
    }
</script>

{#snippet detailHeaderView()}
    {#if detailHeader}
        {@render detailHeader({ mode, detailContent })}
    {:else}
        <div class={`${prefix}-detail-header`}>
            <span class={`${prefix}-detail-header-left`}>
                <Button aria-label={locale().locale.close} theme="borderless" type="tertiary" onclick={(event: MouseEvent) => onBackWard?.(event, strings.MODE.MAIN)}>
                    {#snippet icon()}<IconClose />{/snippet}
                </Button>
                <span class={`${prefix}-detail-header-title`}>{detailContent?.name}</span>
            </span>
            <span class={`${prefix}-detail-header-right`}>
                {#if typeof detailContent?.content === 'string'}
                    <Button aria-label={locale().locale.copy} theme="borderless" type="tertiary" onclick={copyDetail}>
                        {#snippet icon()}<IconCopyStroked />{/snippet}
                    </Button>
                {/if}
            </span>
        </div>
    {/if}
{/snippet}

<Container
    {...rest}
    afterVisibleChange={onAfterVisibleChange}
    bind:this={container}
    bind:visible
    class={[isMain ? `${prefix}-main` : `${prefix}-detail`, rest.class]}
    {closeOnEsc}
    {defaultSize}
    header={isMain ? undefined : detailHeaderView}
    {maxWidth}
    {minWidth}
    {motion}
    {resizable}
    {showClose}
    title={isMain ? title : undefined}
>
    {#if isMain}
        <div class={`${prefix}-main-content-wrapper`}>
            <div class={optionsCls}>
                {#each options ?? [] as option, index (option.key)}
                    {#if optionItem}
                        {@render optionItem({ active: activeKey === option.key, index, item: option, onClick: (event) => selectOption(event, option) })}
                    {:else}
                        {#snippet optionIconView()}
                            {@render optionIcon?.({ item: option, index })}
                        {/snippet}
                        <Button aria-pressed={activeKey === option.key} class={[`${optionsCls}-button`, { [`${optionsCls}-normal`]: activeKey !== option.key }]} icon={optionIcon ? optionIconView : undefined} onclick={(event: MouseEvent) => selectOption(event, option)}>
                            {option.name}
                        </Button>
                    {/if}
                {/each}
            </div>
            <div class={`${prefix}-main-content`}>
                {@render mainContent?.({ activeKey })}
            </div>
        </div>
    {:else if detailBody}
        {@render detailBody({ mode })}
    {:else if mode === strings.MODE.CODE}
        <!-- keyed by the item so another item remounts the editor -->
        {#key detailContent?.key}
            <CodeItem {...detailItem as CodeItemData} {customRender} {searchButton} />
        {/key}
    {:else if mode === strings.MODE.FILE}
        {#key detailContent?.key}
            <FileItem {...detailItem as FileItemData} editable={fileEditable} {imgUploadProps} onContentChange={(content) => onFileContentChange?.(content)} />
        {/key}
    {/if}
</Container>
