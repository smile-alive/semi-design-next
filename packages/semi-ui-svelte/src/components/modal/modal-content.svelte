<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { isNil, omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/modal/constants';
    import ModalContentFoundation, { type ModalContentAdapter, type ModalContentProps as FoundationProps, isModal } from '@fibrae/semi-foundation/components/modal/modal-content-foundation';
    import type { Size } from '@fibrae/semi-foundation/components/modal/modal-foundation';
    import { cssClasses as typographyClasses } from '@fibrae/semi-foundation/components/typography/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/typography/typography.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { useFoundation } from '../../base/index.js';
    import { useOverlayResources } from '../../hooks/index.js';
    import { isAriaKey, splitControlAttrs } from '../../utils/index.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import useShowHide from './hooks/use-show-hide.svelte.js';

    type Foundation = ModalContentFoundation<FoundationProps, MouseEvent>;
    type Adapter = ModalContentAdapter<FoundationProps, MouseEvent>;

    interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
        visible: boolean;
        motion: boolean;
        inBody: boolean;
        onClose: (event: MouseEvent | KeyboardEvent) => void;
        onAfterLeave: () => void;
        /** The footer button that takes focus on open when the content has no autofocus element */
        initialFocus?: 'ok' | 'cancel';
        title?: string | Snippet;
        header?: Snippet | null;
        icon?: Snippet;
        closeIcon?: Snippet;
        footer?: Snippet | null;
        children?: Snippet;
        modal?: Snippet<[{ modal: Snippet }]>;
        bodyStyle?: string;
        maskStyle?: string;
        centered: boolean;
        closable: boolean;
        closeOnEsc: boolean;
        mask: boolean;
        maskClosable: boolean;
        maskFixed: boolean;
        preventScroll?: boolean;
        size: Size;
        width?: string | number;
        height?: string | number;
        isFullScreen: boolean;
        contentClass?: string;
    }

    let { visible, motion, inBody, onClose, onAfterLeave, initialFocus, title, header, icon, closeIcon, footer, children, modal, bodyStyle, maskStyle, centered, closable, closeOnEsc, mask, maskClosable, maskFixed, preventScroll, size, width, height, isFullScreen, contentClass, ...rest }: Props = $props();

    const locale = useLocale('Modal');

    const uid = $props.id();
    let root = $state.raw<HTMLDivElement | null>(null);
    let dialog = $state.raw<HTMLElement | null>(null);

    const prefix = cssClasses.DIALOG;

    const content = useShowHide({
        visible: () => visible,
        motion: () => motion,
        showClass: `${prefix}-content-animate-show`,
        hideClass: `${prefix}-content-animate-hide`,
        onHidden: () => onAfterLeave(),
    });

    const maskAnimation = useShowHide({
        visible: () => visible,
        motion: () => motion,
        showClass: `${prefix}-mask-animate-show`,
        hideClass: `${prefix}-mask-animate-hide`,
    });

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, Record<string, unknown>>(
        ModalContentFoundation,
        {
            get closeOnEsc() {
                return closeOnEsc;
            },
            get inBody() {
                return inBody;
            },
            get mask() {
                return mask;
            },
            get maskFixed() {
                return maskFixed;
            },
            get preventScroll() {
                return preventScroll;
            },
            get initialFocus() {
                return initialFocus;
            },
        },
        () => ({}),
        () => ({
            notifyClose: (event) => onClose(event),
            getRoot: () => root,
            getDialog: () => dialog,
        })
    );

    const idPrefix = `dialog-${uid}`;

    // F12: aria-* and role go to the dialog element, style to the .semi-modal box, the rest to the outer element.
    // Attributes bound to undefined are dropped: they count as unset and keep the generated aria-labelledby, aria-modal.
    const attrs = $derived(splitControlAttrs(omitBy(rest, isNil), (key) => key === 'role' || isAriaKey(key)));

    const rootAttrs = $derived.by(() => {
        const { style: _style, ...others } = attrs.root;
        return others;
    });

    const userStyle = $derived(typeof attrs.root.style === 'string' ? attrs.root.style : undefined);
    const dialogRole = $derived(typeof attrs.control.role === 'string' ? attrs.control.role : 'dialog');
    const isCustomHeader = $derived(header !== undefined);
    const hasTitle = $derived(title != null);

    // the title element exists only in the default header; aria-labelledby would shadow an aria-label
    const labelledby = $derived(!attrs.control['aria-label'] && !isCustomHeader && hasTitle ? `${idPrefix}-title` : undefined);
    const modalDialog = $derived(isModal({ mask, maskFixed, inBody }));
    const heightSet = $derived(Boolean(height) || /(^|;)\s*height\s*:/.test(userStyle ?? ''));
    const sizeStyle = $derived(isFullScreen ? 'width: 100%; height: 100%; margin: unset' : [width ? `width: ${toCssLength(width)}` : '', height ? `height: ${toCssLength(height)}` : ''].filter(Boolean).join('; '));
    const boxStyle = $derived([userStyle, sizeStyle].filter(Boolean).join(';') || undefined);

    // Shown is gated on the dialog being displayed, not on `visible`: it stays displayed through the leave animation,
    // and a keepDOM reopen shows it again before the hold runs.
    useOverlayResources(
        foundation,
        () => visible,
        () => Boolean(content.displayed && root && dialog?.isConnected)
    );

    export function getRoot() {
        return root;
    }
</script>

{#snippet iconPart()}
    {#if icon}
        <span class={`${prefix}-icon-wrapper`} x-semi-prop="icon">
            {@render icon()}
        </span>
    {/if}
{/snippet}

{#snippet bodyPart()}
    <div class={[`${prefix}-body`, { [`${prefix}-withIcon`]: icon }]} id={`${idPrefix}-body`} style={bodyStyle} x-semi-prop="children">
        {@render children?.()}
    </div>
{/snippet}

{#snippet closeIconPart()}
    {#if closeIcon}
        {@render closeIcon()}
    {:else}
        <IconClose x-semi-prop="closeIcon" />
    {/if}
{/snippet}

{#snippet closePart()}
    {#if closable}
        <IconButton aria-label={locale().locale.close} class={`${prefix}-close`} icon={closeIconPart} size="small" theme="borderless" type="tertiary" onclick={foundation.close} />
    {/if}
{/snippet}

{#snippet dialogPart()}
    <div
        aria-labelledby={labelledby}
        aria-modal={modalDialog ? 'true' : undefined}
        {...attrs.control}
        {@attach (element) => {
            // not cleared on teardown: afterHide() runs after it and still needs the element to decide the focus restore
            dialog = element;
        }}
        {@attach content.attach}
        class={[`${prefix}-content`, contentClass, content.className, { [`${prefix}-content-fullScreen`]: isFullScreen, [`${prefix}-content-height-set`]: heightSet }]}
        role={dialogRole}
        style:display={content.displayed ? undefined : 'none'}
        tabindex="-1"
    >
        {#if isCustomHeader}
            {@render header?.()}
            {@render bodyPart()}
        {:else if hasTitle}
            <div class={`${prefix}-header`}>
                {@render iconPart()}
                <!-- h5 look, h2 outline: the sheet's title is level 2 as well -->
                <h2 class={[typographyClasses.PREFIX, `${typographyClasses.PREFIX}-h5`, `${prefix}-title`]} id={`${idPrefix}-title`} x-semi-prop="title">
                    {#if typeof title === 'string'}
                        {title}
                    {:else}
                        {@render title?.()}
                    {/if}
                </h2>
                {@render closePart()}
            </div>
            {@render bodyPart()}
        {:else}
            <div class={`${prefix}-body-wrapper`}>
                {@render iconPart()}
                {@render bodyPart()}
                {@render closePart()}
            </div>
        {/if}
        {#if footer}
            <div class={`${prefix}-footer`} x-semi-prop="footer">
                {@render footer()}
            </div>
        {/if}
    </div>
{/snippet}

<div
    {...rootAttrs}
    bind:this={root}
    class={[
        rootAttrs.class,
        {
            [`${prefix}-no-mask`]: !mask,
            [`${prefix}-popup`]: !inBody && !maskFixed,
            [`${prefix}-fixed`]: maskFixed,
        },
    ]}
>
    {#if mask}
        <div {@attach maskAnimation.attach} class={[`${prefix}-mask`, maskAnimation.className]} style={maskStyle} style:display={maskAnimation.displayed ? undefined : 'none'}></div>
    {/if}
    <div class={[`${prefix}-wrap`, { [`${prefix}-wrap-center`]: centered }]} role="none" onclick={maskClosable ? (event) => foundation.handleMaskClick(event) : undefined} onmouseup={maskClosable ? () => foundation.handleMaskMouseUp() : undefined}>
        <!-- marked only while the mask listens, since only its mouseup clears the mark -->
        <div class={[prefix, `${prefix}-${size}`, { [`${prefix}-centered`]: centered }]} id={idPrefix} role="none" style={boxStyle} onmousedown={maskClosable ? () => foundation.handleDialogMouseDown() : undefined}>
            {#if modal}
                {@render modal({ modal: dialogPart })}
            {:else}
                {@render dialogPart()}
            {/if}
        </div>
    </div>
</div>
