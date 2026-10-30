<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import ModalContentFoundation, { type ModalContentAdapter, type ModalContentProps as FoundationProps, isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
    import type { Size } from '@fibrae/semi-foundation/modal/modal-foundation';
    import { cssClasses as typographyClasses } from '@fibrae/semi-foundation/typography/constants';
    import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import '@fibrae/semi-foundation/typography/typography.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import useShowHide from './use-show-hide.svelte.js';

    type Foundation = ModalContentFoundation<FoundationProps, MouseEvent>;
    type Adapter = ModalContentAdapter<FoundationProps, MouseEvent>;

    // Internal: Modal passes every prop below; the rest are the caller's attributes
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
    const focusScope = new FocusScope();
    const layer = new ReleaseHolder();

    // the body element the first open focused, which a keepDOM reopen focuses again
    let bodyFocus: HTMLElement | null = null;

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
            onClose: (event) => onClose(event),
        },
        () => ({}),
        () => ({
            notifyClose: (event) => onClose(event),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: root as HTMLElement, modal: isModal({ mask, maskFixed, inBody }), onEscape })),
            closeLayer: () => layer.release(),
            trapFocus: () => {
                const el = dialog;
                if (!el) return;
                const footerElement = el.querySelector(`:scope > .${prefix}-footer`);
                const active = FocusTrapHandle.getActiveElement(el);
                // Svelte focuses an autofocus element in a microtask, which may land before or after this runs; pick the
                // body element the first open focused (a component's mount-time focus acts once, so a keepDOM reopen
                // needs it), autofocus, footer button, first. Known limit: keepDOM with lazyRender={false} that starts
                // hidden mounts under display:none, where mount-time focus fails, so nothing is remembered and the
                // default button wins.
                if (el.contains(active)) {
                    if (active !== el && !footerElement?.contains(active)) {
                        bodyFocus ??= active;
                    }
                } else {
                    FocusTrapHandle.pickInitialFocus(el, { remembered: bodyFocus, autofocus: true, footer: footerElement, initialFocus })?.focus({ preventScroll });
                }
                focusScope.engage(el, isModal({ mask, maskFixed, inBody }), preventScroll);
            },
            releaseFocus: () => {
                dialog?.blur();
                focusScope.deactivate();
            },
            restoreFocus: () => focusScope.restoreIfAllowed(dialog, isModal({ mask, maskFixed, inBody }), preventScroll),
        })
    );

    const idPrefix = `dialog-${uid}`;

    // F12: aria-* and role go to the dialog element, style to the .semi-modal box, the rest to the outer element
    const attrs = $derived(splitControlAttrs(rest, (key) => key === 'role' || key.startsWith('aria-')));

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

    // only set keys, so an unset width does not wipe the caller's style
    const sizeStyle = $derived(isFullScreen ? 'width: 100%; height: 100%; margin: unset' : [width ? `width: ${toCssLength(width)}` : '', height ? `height: ${toCssLength(height)}` : ''].filter(Boolean).join('; '));
    const boxStyle = $derived([userStyle, sizeStyle].filter(Boolean).join(';') || undefined);

    // record before the content's components take focus in their mount effects (an autofocusing Input)
    $effect.pre(() => {
        if (visible) {
            untrack(() => focusScope.record());
        }
    });

    // Gated on the dialog being displayed, not on `visible`: it stays displayed through the leave animation, and a
    // keepDOM reopen shows it again before this runs.
    $effect(() => {
        if (!content.displayed || !root || !dialog?.isConnected) return;
        untrack(() => {
            foundation.show();
            warnIfDialogUnnamed(dialog, 'Modal');
        });
        return foundation.hide;
    });

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
    <!-- tabindex lets the dialog itself take focus -->
    <div
        aria-labelledby={labelledby}
        aria-modal={modalDialog ? 'true' : undefined}
        {...attrs.control}
        {@attach (element) => {
            // not cleared on teardown: hide() runs after it and still needs the element to decide the focus restore
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
