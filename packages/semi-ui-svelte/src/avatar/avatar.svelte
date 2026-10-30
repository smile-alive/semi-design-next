<script lang="ts">
    import { tick, untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses, strings } from '@fibrae/semi-foundation/avatar/constants';
    import AvatarFoundation, { type AvatarAdapter } from '@fibrae/semi-foundation/avatar/foundation';
    import '@fibrae/semi-foundation/avatar/avatar.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { getPopupLayerContext } from '../_base/popup-layer.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getAvatarGroupMoreContext, setAvatarGroupMoreContext } from './context.js';
    import type { AvatarProps } from './interface.js';
    import TopSlotSvg from './top-slot-svg.svelte';

    interface AvatarState {
        isImgExist: boolean;
        hovered: boolean;
        scale: number;
    }

    type Foundation = AvatarFoundation<AvatarProps, AvatarState, MouseEvent>;
    type Adapter = AvatarAdapter<AvatarProps, AvatarState, MouseEvent>;

    const defaults = useDefaultProps('Avatar');

    // size and shape stay undefined here: the `more` content ranks above the global defaults
    let {
        color = defaults('color', 'grey'),
        shape: ownShape,
        size: ownSize,
        src = defaults('src'),
        srcSet = defaults('srcSet'),
        alt = defaults('alt'),
        gap = defaults('gap', 3),
        imgAttr = defaults('imgAttr'),
        topSlot = defaults('topSlot'),
        bottomSlot = defaults('bottomSlot'),
        border = defaults('border'),
        contentMotion = defaults('contentMotion'),
        onError = defaults('onError'),
        onMouseEnter,
        onMouseLeave,
        children,
        hoverMask,
        topSlotText,
        bottomSlotText,
        ...rest
    }: AvatarProps = $props();

    // The `more` context also reaches avatars in a popup opened from inside it; those are not its items
    const layer = getPopupLayerContext();
    const outerMore = getAvatarGroupMoreContext();

    let avatarEl = $state<HTMLElement>();
    let contentEl = $state<HTMLElement>();
    let labelEl = $state<HTMLElement>();
    let focusEl = $state<HTMLElement>();

    // Children are opaque snippets, so text or element content is read back from the DOM; text is the first guess
    let isText = $state(untrack(() => children !== undefined));
    let text = $state<string>();

    const { foundation, states } = useFoundation<Foundation, Adapter, AvatarProps, AvatarState>(
        AvatarFoundation,
        {
            get gap() {
                return gap;
            },
        },
        () => ({ isImgExist: true, hovered: false, scale: 1 }),
        (base) => ({
            setImgExist: (isImgExist) => base.setState({ isImgExist }),
            setScale: (scale) => base.setState({ scale }),
            notifyError: () => onError?.(),
            notifyEnter: (event) => {
                base.setState({ hovered: true });
                onMouseEnter?.(event);
            },
            notifyLeave: (event) => {
                base.setState({ hovered: false });
                onMouseLeave?.(event);
            },
            getTextWidths: () => (contentEl ? { container: contentEl.parentElement?.offsetWidth ?? 0, text: contentEl.offsetWidth } : null),
        })
    );

    const prefix = cssClasses.PREFIX;
    const more = outerMore?.layer === layer ? outerMore : undefined;

    // An avatar in the `more` content keeps its own size and shape and only falls back to the group's
    const size = $derived(ownSize ?? more?.size ?? defaults('size', 'medium'));
    const shape = $derived(ownShape ?? more?.shape ?? defaults('shape', 'circle'));
    const clickable = $derived(rest.onclick !== undefined);
    const isImg = $derived(Boolean(src) && states().isImgExist);
    const isPresetSize = $derived(strings.SIZE.some((preset) => preset === size));

    // Top and bottom marks have no style for extra-extra-small or custom sizes
    const hasMarkSize = $derived(isPresetSize && size !== 'extra-extra-small');
    const wrapped = $derived(Boolean(topSlot || bottomSlot || topSlotText || bottomSlotText || border));

    // A clickable avatar has its own focus target, so aria-*, tabindex and attachments given to the avatar belong there
    const attrs = $derived(clickable ? splitControlAttrs(rest, (key) => key === 'tabindex' || key.startsWith('aria-')) : { root: rest, control: {} });

    const rootAttrs = $derived.by(() => {
        const { style: _style, ...root } = attrs.root;
        return root;
    });

    const borderClass = $derived([`${prefix}-additionalBorder`, `${prefix}-additionalBorder-${size}`, `${prefix}-${shape}`]);
    const borderColor = $derived(typeof border === 'object' ? border.color : undefined);

    // Avatars nested in this one's content are not items of the group
    setAvatarGroupMoreContext(undefined);

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLElement }) => {
        if (event.key === 'Enter' || event.key === ' ') {
            // Space would otherwise scroll; a real click also reaches a Dropdown or Tooltip around the avatar
            event.preventDefault();
            event.currentTarget.click();
        }
    };

    const focusAttrs = $derived<Record<string, unknown>>(clickable ? { class: `${prefix}-no-focus-visible`, role: 'button', tabindex: 0, ...attrs.control, onkeydown: handleKeyDown } : {});

    const imgProps = $derived({
        src,
        srcset: srcSet,
        alt,
        ...imgAttr,
        ...focusAttrs,
        class: [imgAttr?.class, focusAttrs.class],
        onerror: (event: Event) => {
            (imgAttr?.onerror as ((event: Event) => void) | null | undefined)?.(event);
            foundation.handleImgLoadError();
        },
    });

    const handleEnter = (event: MouseEvent) => foundation.handleEnter(event);

    const handleLeave = (event: MouseEvent) => foundation.handleLeave(event);

    const sync = () => {
        if (!avatarEl || isImg) {
            return;
        }
        const source = isText ? labelEl : clickable ? focusEl : avatarEl;
        // Svelte's comment anchors and the whitespace between template blocks are not content; counting that whitespace as
        // text would render an empty label, which removes the whitespace and flips back, forever
        const nodes = [...(source?.childNodes ?? [])].filter((node) => node.nodeType !== Node.COMMENT_NODE && node.textContent?.trim() !== '' && !(node instanceof HTMLElement && node.classList.contains(`${prefix}-hover`)));
        const next = nodes.map((node) => node.textContent).join('');
        const nextIsText = nodes.length > 0 && nodes.every((node) => node.nodeType === Node.TEXT_NODE) && next !== '';
        const changed = nextIsText !== isText || (nextIsText && next !== text);
        isText = nextIsText;
        text = nextIsText ? next : undefined;
        if (changed) {
            // the scale spans exist after this flush
            void tick().then(foundation.changeScale);
        }
    };

    const observe: Attachment<HTMLElement> = (node) => {
        avatarEl = node;
        untrack(sync);
        const observer = new MutationObserver(() => untrack(sync));
        observer.observe(node, { childList: true, subtree: true, characterData: true });
        return () => {
            observer.disconnect();
            avatarEl = undefined;
        };
    };

    watch(() => src, foundation.handleSrcChange);
</script>

{#snippet body(outer: boolean)}
    <span
        {...rootAttrs}
        {@attach observe}
        class={[
            prefix,
            `${prefix}-${size}`,
            `${prefix}-${shape}`,
            more?.itemClass,
            rest.class,
            {
                [`${prefix}-${color}`]: color && !isImg,
                [`${prefix}-img`]: isImg,
                [`${prefix}-animated`]: contentMotion,
            },
        ]}
        role={(rootAttrs.role as string | undefined) ?? (more ? 'listitem' : undefined)}
        style={outer ? rest.style : undefined}
        style:height={outer && !isPresetSize ? size : undefined}
        style:width={outer && !isPresetSize ? size : undefined}
        onmouseenter={outer ? handleEnter : undefined}
        onmouseleave={outer ? handleLeave : undefined}
    >
        {#if isImg}
            <img {...imgProps} />
        {:else if isText}
            <span bind:this={contentEl} class="{prefix}-content" style:transform="scale({states().scale})">
                <span aria-label={alt ?? text} bind:this={labelEl} role="img" {...focusAttrs} class={[`${prefix}-label`, focusAttrs.class]}>
                    {@render children?.()}
                </span>
            </span>
        {:else if clickable}
            <span aria-label={alt} bind:this={focusEl} {...focusAttrs}>
                {@render children?.()}
            </span>
        {:else}
            {@render children?.()}
        {/if}
        {#if states().hovered && hoverMask}
            <div class="{prefix}-hover">{@render hoverMask()}</div>
        {/if}
    </span>
{/snippet}

{#if wrapped}
    <span class="{prefix}-wrapper" style={rest.style} style:height={isPresetSize ? undefined : size} style:width={isPresetSize ? undefined : size} onmouseenter={handleEnter} onmouseleave={handleLeave}>
        {#if border}
            <div style="position: relative" style:height={isPresetSize ? undefined : size} style:width={isPresetSize ? undefined : size}>
                {@render body(false)}
                <span class={borderClass} style:border-color={borderColor}></span>
                {#if typeof border === 'object' && border.motion}
                    <span class={[borderClass, `${prefix}-additionalBorder-animated`]} style:border-color={borderColor}></span>
                {/if}
            </div>
        {:else}
            {@render body(false)}
        {/if}
        {#if hasMarkSize && shape === 'circle' && (topSlot || topSlotText)}
            {#if topSlot?.render}
                {@render topSlot.render()}
            {:else}
                <div class={[`${prefix}-top_slot-wrapper`, topSlot?.className, { [`${prefix}-animated`]: contentMotion }]} style={topSlot?.style}>
                    <div class={[`${prefix}-top_slot-bg`, `${prefix}-top_slot-bg-${size}`]}>
                        <div class={[`${prefix}-top_slot-bg-svg`, `${prefix}-top_slot-bg-svg-${size}`]}>
                            <TopSlotSvg gradientEnd={topSlot?.gradientEnd ?? 'var(--semi-color-primary)'} gradientStart={topSlot?.gradientStart ?? 'var(--semi-color-primary)'} />
                        </div>
                    </div>
                    <div class="{prefix}-top_slot">
                        <div class={[`${prefix}-top_slot-content`, `${prefix}-top_slot-content-${size}`]} style:color={topSlot?.textColor}>
                            {@render topSlotText?.()}
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
        {#if hasMarkSize && (bottomSlot || bottomSlotText)}
            {#if bottomSlot?.render}
                {@render bottomSlot.render()}
            {:else}
                <div class="{prefix}-bottom_slot" style={bottomSlot?.style}>
                    <span class={[`${prefix}-bottom_slot-shape_${bottomSlot?.shape}`, `${prefix}-bottom_slot-shape_${bottomSlot?.shape}-${size}`, bottomSlot?.className]} style:background-color={bottomSlot?.bgColor} style:color={bottomSlot?.textColor}>
                        {@render bottomSlotText?.()}
                    </span>
                </div>
            {/if}
        {/if}
    </span>
{:else}
    {@render body(true)}
{/if}
