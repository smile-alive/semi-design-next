<script lang="ts">
    import { untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { moveFocusToAdjacentTag } from '@fibrae/semi-foundation/tag/focus';
    import '@fibrae/semi-foundation/tag/tag.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import Avatar from '../avatar/avatar.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TagCloseEvent, TagProps } from './interface.js';

    const defaults = useDefaultProps('Tag');

    // No fallback on `visible`: a bound `undefined` would throw with one
    let {
        visible = $bindable(),
        tagKey = defaults('tagKey'),
        size = defaults('size', 'default'),
        color = defaults('color', 'grey'),
        type = defaults('type', 'light'),
        closable = defaults('closable', false),
        avatarSrc = defaults('avatarSrc'),
        colorful = defaults('colorful', false),
        gradient = defaults('gradient', false),
        avatarShape = defaults('avatarShape', 'square'),
        shape = defaults('shape', 'square'),
        tabindex = defaults('tabindex'),
        onClose,
        onkeydown,
        children,
        prefixIcon,
        suffixIcon,
        ...rest
    }: TagProps = $props();

    const locale = useLocale('Tag');

    // The content is an opaque snippet, so whether it is plain text is read back from the DOM; text is the first guess
    let isText = $state(untrack(() => children !== undefined));
    let text = $state<string>();

    const prefix = cssClasses.PREFIX;

    // A click handler or a close action makes the tag a focusable button; tabindex lets TagInput take it out of the tab order
    const interactive = $derived(Boolean(rest.onclick) || closable);

    // Only the button role takes a name; a static tag is text and speaks for itself
    const ariaLabel = $derived.by(() => {
        if (rest['aria-label'] !== undefined) {
            return rest['aria-label'];
        }
        const content = interactive ? text : undefined;
        // a function replacer keeps `$&` and `$$` in the text literal
        return content === undefined ? undefined : (closable ? locale().locale.closableTag : locale().locale.tag).replace('${tag}', () => content);
    });

    const close = (event: TagCloseEvent) => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        onClose?.(event, tagKey);
        if (event.defaultPrevented) {
            return;
        }
        if (event.currentTarget instanceof Element) {
            moveFocusToAdjacentTag(event.currentTarget);
        }
        visible = false;
    };

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (interactive && (event.key === 'Backspace' || event.key === 'Delete')) {
            if (closable) {
                close(event);
            }
            event.preventDefault();
            event.stopPropagation();
        } else if (interactive && (event.key === 'Enter' || event.key === ' ')) {
            // Space would otherwise scroll; the real click also reaches a Dropdown or Tooltip around the tag once
            event.preventDefault();
            event.currentTarget.click();
        }
        onkeydown?.(event);
    };

    const readText: Attachment<HTMLElement> = (node) => {
        const sync = () => {
            // Svelte's comment anchors and empty text nodes are not content
            const nodes = [...node.childNodes].filter((child) => child.nodeType !== Node.COMMENT_NODE && child.textContent !== '');
            isText = nodes.length > 0 && nodes.every((child) => child.nodeType === Node.TEXT_NODE);
            text = isText ? nodes.map((child) => child.textContent).join('') : undefined;
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(node, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    };
</script>

<div
    {...rest}
    aria-label={ariaLabel}
    class={[
        prefix,
        `${prefix}-${size}`,
        `${prefix}-${shape}`,
        `${prefix}-${type}`,
        `${prefix}-${color}-${type}`,
        rest.class,
        {
            [`${prefix}-closable`]: closable,
            [`${prefix}-invisible`]: visible === false,
            [`${prefix}-avatar-${avatarShape}`]: avatarSrc,
            [`${prefix}-colorful`]: colorful,
            [`${prefix}-gradient`]: gradient,
        },
    ]}
    role={interactive ? 'button' : rest.role}
    tabindex={interactive ? (tabindex ?? 0) : tabindex}
    onkeydown={handleKeyDown}
>
    {#if prefixIcon}
        <div class="{prefix}-prefix-icon" x-semi-prop="prefixIcon">{@render prefixIcon()}</div>
    {/if}
    {#if avatarSrc}
        <Avatar alt="" shape={avatarShape} src={avatarSrc} />
    {/if}
    <div {@attach readText} class={[`${prefix}-content`, `${prefix}-content-${isText ? 'ellipsis' : 'center'}`]}>
        {@render children?.()}
    </div>
    {#if suffixIcon}
        <div class="{prefix}-suffix-icon" x-semi-prop="suffixIcon">{@render suffixIcon()}</div>
    {/if}
    {#if closable}
        <!-- a pointer shortcut only: keyboard users close with Backspace and Delete, and the label says Closable -->
        <div aria-hidden="true" class="{prefix}-close" onclick={close}>
            <IconClose size="small" />
        </div>
    {/if}
</div>
