<script lang="ts">
    import { settleConfirm } from '@fibrae/semi-foundation/modal/confirm';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import { createId } from '@fibrae/semi-foundation/utils/uuid';
    import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { getConfigContext } from '../config-provider/context.js';
    import type { ConfirmProps, ModalNode } from './interface.js';
    import Modal from './modal.svelte';

    // The options Modal declares itself reach it through `...rest`
    let { type, title, content, icon, closeIcon, header, footer, direction, visible, onOk, onCancel, class: className, ...rest }: ConfirmProps = $props();

    const config = getConfigContext();

    let shown = $state(true);
    let confirmLoading = $state<boolean>();
    let cancelLoading = $state<boolean>();

    // not $props.id: Modal.confirm mounts every dialog as its own root
    const contentId = createId('modal-confirm-content');
    const confirmCls = `${cssClasses.DIALOG}-confirm`;

    // only a Semi icon takes the type's color; `color` inherits into the svg
    const iconCls = $derived(`${confirmCls}-icon ${cssClasses.DIALOG}-${type}-icon`);

    // Modal.confirm renders outside any ConfigProvider and passes the direction itself
    const dir = $derived(direction ?? config.direction);

    const settle = (result: unknown, setLoading: (loading: boolean) => void) =>
        settleConfirm(result, {
            setLoading,
            close: () => {
                shown = false;
            },
        });
</script>

{#snippet node(value: ModalNode | null | undefined)}
    {#if typeof value === 'string'}
        {value}
    {:else if value}
        {@render value()}
    {/if}
{/snippet}

{#snippet titleSlot()}
    <span class={`${confirmCls}-title-text`}>{@render node(title)}</span>
{/snippet}

{#snippet headerSlot()}
    {@render node(header)}
{/snippet}

{#snippet footerSlot()}
    {@render node(footer)}
{/snippet}

{#snippet iconSlot()}
    {#if typeof icon === 'string'}
        {icon}
    {:else if icon}
        <span class={iconCls}>{@render icon()}</span>
    {:else if type === 'info'}
        <IconInfoCircle class={iconCls} size="extra-large" />
    {:else if type === 'success'}
        <IconTickCircle class={iconCls} size="extra-large" />
    {:else if type === 'warning'}
        <IconAlertTriangle class={iconCls} size="extra-large" />
    {:else if type === 'error'}
        <IconAlertCircle class={iconCls} size="extra-large" />
    {:else}
        <IconHelpCircle class={iconCls} size="extra-large" />
    {/if}
{/snippet}

{#snippet closeIconSlot()}
    {@render node(closeIcon)}
{/snippet}

{#snippet contentSlot()}
    <div class={[`${confirmCls}-content`, { [`${confirmCls}-content-withIcon`]: icon !== null }]} id={contentId} x-semi-prop="content">
        {@render node(content)}
    </div>
{/snippet}

<!-- APG alert dialog: described by its message. Closing is decided by settle(), so the dialog's own write is dropped -->
<Modal
    aria-describedby={contentId}
    bind:visible={() => visible ?? shown, () => {}}
    {cancelLoading}
    class={[className, confirmCls]}
    closeIcon={closeIcon ? closeIconSlot : undefined}
    {confirmLoading}
    {dir}
    footer={footer === undefined ? undefined : footer === null ? null : footerSlot}
    header={header === undefined ? undefined : header === null ? null : headerSlot}
    icon={icon === null ? undefined : iconSlot}
    role="alertdialog"
    title={title == null ? undefined : titleSlot}
    {...rest}
    children={contentSlot}
    onCancel={(event) => settle(onCancel?.(event), (loading) => (cancelLoading = loading))}
    onOk={(event) => settle(onOk?.(event), (loading) => (confirmLoading = loading))}
/>
