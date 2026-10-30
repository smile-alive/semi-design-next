<script lang="ts">
    import { tick } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import type { HTMLAnchorAttributes } from 'svelte/elements';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import { EllipsisRuntime, canUseCSSEllipsis, getEllipsisOpt, getRenderText, isInsideWidgetItem, isOverflowing } from '@fibrae/semi-foundation/typography/ellipsis';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/typography/typography.scss';
    import useLocale from '../locale/use-locale.svelte.js';
    import Popover from '../popover/popover.svelte';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import { getTypographyContext, setTypographyContext } from './context.js';
    import Copyable from './copyable.svelte';
    import type { TypographyBaseSize } from './interface.js';
    import { type EllipsisView, type TypographyBaseProps, UNMEASURED } from './internal.js';

    const {
        children,
        icon,
        copyIcon,
        copyTip,
        copySuccessTip,
        copyAction,
        ellipsisContent,
        ellipsisTooltip,
        component = 'span',
        copyable = false,
        code = false,
        delete: deleted = false,
        disabled = false,
        ellipsis = false,
        link = false,
        mark = false,
        strong = false,
        type = 'primary',
        underline = false,
        size = 'normal',
        spacing = 'normal',
        weight,
        headingTag,
        format,
        ...rest
    }: TypographyBaseProps = $props();

    const locale = useLocale('Typography');
    const inherited = getTypographyContext();

    let root = $state<HTMLElement>();
    let source = $state.raw<HTMLElement>();
    let iconBox = $state.raw<HTMLElement>();
    let expandButton = $state.raw<HTMLButtonElement>();
    let copyElement = $state<ReturnType<typeof Copyable> & { element: () => Element | null }>();

    // The plain text of the content, read from the DOM after mount: a snippet cannot be read before it renders
    let fullText = $state('');
    let insideWidgetItem = $state(false);
    let view = $state.raw<EllipsisView>(UNMEASURED);
    let seenText = '';
    const formatted = new WeakMap<Text, { raw: string; shown: string }>();
    const runtime = new EllipsisRuntime();
    const widths = new WeakMap<Element, number>();
    const resizedIcons = new WeakSet<Element>();

    const prefix = cssClasses.PREFIX;
    const realSize: TypographyBaseSize = $derived(size === 'inherit' ? (inherited?.size ?? 'normal') : size);
    const hasEllipsis = $derived(Boolean(ellipsis));
    const opt = $derived(getEllipsisOpt(ellipsis, locale().locale.expand, locale().locale.collapse));
    const cssEllipsis = $derived(hasEllipsis && canUseCSSEllipsis(opt, copyable));

    // Primitives, so an inline ellipsis object with the same values does not measure again
    const rows = $derived(opt.rows);
    const pos = $derived(opt.pos);
    const suffix = $derived(hasEllipsis ? opt.suffix : '');
    const expandText = $derived(opt.expandText);
    const tooltipEnabled = $derived(Boolean(opt.showTooltip));
    const weightStyle = $derived(isNaN(Number(weight)) ? undefined : `font-weight: ${weight}`);

    const tooltip = $derived.by(() => {
        if (!opt.showTooltip || opt.expandable || opt.expandText !== undefined) return false;
        const config = typeof opt.showTooltip === 'object' ? opt.showTooltip : {};
        return { popover: config.type === 'popover', opts: config.opts ?? {} };
    });

    const conditionOn = $derived(tooltip !== false && tooltip.opts.condition !== false);
    const linkClass = $derived(link ? [`${prefix}-link-text`, { [`${prefix}-link-underline`]: underline }] : undefined);

    const wrapperClass = $derived({
        [`${prefix}-${type}`]: type && !link,
        [`${prefix}-${realSize}`]: realSize,
        [`${prefix}-link`]: link,
        [`${prefix}-disabled`]: disabled,
        [`${prefix}-${spacing}`]: spacing,
        [`${prefix}-${headingTag}`]: headingTag,
        [`${prefix}-${headingTag}-weight-${weight}`]: headingTag && weight && isNaN(Number(weight)),
    });

    const copyConfig = $derived.by(() => {
        if (!copyable) return false;
        const config = typeof copyable === 'object' ? copyable : {};
        return { content: config.content ?? fullText, duration: config.duration ?? 3, class: config.class, style: config.style, onCopy: config.onCopy };
    });

    const decorations = $derived.by(() => {
        let linkAttrs: HTMLAnchorAttributes = {};
        if (typeof link === 'object') {
            linkAttrs = disabled ? { class: link.class, style: link.style } : { ...link };
        }
        // An anchor without href is neither focusable nor a link; a clickable one needs both to be reached by keyboard
        if (link && !disabled && !linkAttrs.href && (linkAttrs.onclick || rest.onclick)) {
            const own = linkAttrs.onkeydown as ((event: KeyboardEvent) => void) | null | undefined;
            linkAttrs = {
                role: 'link',
                tabindex: 0,
                ...linkAttrs,
                onkeydown: (event: KeyboardEvent & { currentTarget: HTMLElement }) => {
                    own?.(event);
                    if (!event.defaultPrevented && event.key === 'Enter') event.currentTarget.click();
                },
            };
        }
        const tags: ({ tag: string; attrs: HTMLAnchorAttributes } | false)[] = [
            Boolean(link) && { tag: disabled ? 'span' : 'a', attrs: linkAttrs },
            deleted && { tag: 'del', attrs: {} },
            strong && { tag: 'strong', attrs: {} },
            underline && !link && { tag: 'u', attrs: {} },
            code && { tag: 'code', attrs: {} },
            mark && { tag: 'mark', attrs: {} },
        ];
        return tags.filter((tag) => tag !== false);
    });

    // The description goes to the focusable link inside, unless the caller set their own
    const linkDescribes = $derived.by(() => {
        const first = decorations[0];
        return tooltip !== false && !tooltip.popover && first?.tag === 'a' && Boolean(first.attrs.href || first.attrs.role === 'link') && !rest['aria-describedby'];
    });

    // An unmeasured ellipsis counts as truncated, so the expand button is rendered and the measurement takes its width into account
    const truncated = $derived(view.isTruncated ?? hasEllipsis);
    const overflowed = $derived(!view.expanded && (cssEllipsis ? view.isOverflowed : truncated));

    // The children stay in the DOM, hidden, while the truncated text shows: they are where the full text comes from
    const showFull = $derived(view.expanded || !truncated || view.ellipsisContent === undefined);

    const actionText = $derived.by(() => {
        if (!truncated) return undefined;
        return view.expanded ? opt.collapseText : opt.expandText;
    });

    // an expanded text that cannot collapse lost its button, so the text takes its focus
    const focusTarget = $derived(view.expanded && actionText === undefined);
    const ellipsisStyle = $derived(!view.expanded && cssEllipsis && rows > 1 ? `-webkit-line-clamp: ${rows}` : undefined);
    const rootStyle = $derived([weightStyle, rest.style, ellipsisStyle].filter(Boolean).join(';') || undefined);

    const ellipsisClass = $derived.by(() => {
        if (!hasEllipsis) return {};
        const cssActive = !view.expanded && cssEllipsis;
        const inline = component === 'span';
        return {
            [`${prefix}-ellipsis`]: true,
            [`${prefix}-ellipsis-single-line`]: rows === 1,
            [`${prefix}-ellipsis-multiple-line`]: rows > 1,
            [`${prefix}-ellipsis-multiple-line-text`]: rows > 1 && inline,
            [`${prefix}-ellipsis-overflow-ellipsis`]: rows === 1 && cssActive,
            [`${prefix}-ellipsis-overflow-ellipsis-text`]: rows === 1 && cssActive && inline,
        };
    });

    // Switched by condition rather than unmounted, so the text element is not replaced when overflow changes
    const tooltipBinding = $derived({ position: 'top' as const, ...(tooltip && tooltip.opts), condition: overflowed && conditionOn });
    const popoverBinding = $derived({ showArrow: true, ...tooltipBinding, class: [`${prefix}-ellipsis-popover`, tooltip && tooltip.opts.class].filter(Boolean).join(' ') });

    // Tooltip gives its trigger tabindex 0 unless the trigger sets its own; undefined keeps the text out of the tab
    // order until the tip can show, and inside items of composite widgets.
    const triggerTabindex = $derived.by(() => {
        const own = rest.tabindex;
        return own !== undefined || (overflowed && conditionOn && !insideWidgetItem) ? (own ?? 0) : undefined;
    });

    setTypographyContext({
        get size() {
            return realSize;
        },
    });

    const update = (patch: Partial<EllipsisView>) => {
        const prev = view;
        if ((Object.keys(patch) as (keyof EllipsisView)[]).every((key) => Object.is(prev[key], patch[key]))) return;
        view = { ...prev, ...patch };
    };

    const textNodes = (container: Element, skip: (Element | null | undefined)[]) => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!skip.some((box) => box?.contains(node))) nodes.push(node as Text);
        }
        return nodes;
    };

    // Text nodes that already show the formatted text are skipped; a node Svelte rewrote holds new raw text. Empty nodes
    // are Svelte's block anchors, not text: a parser must not turn them into content.
    const formatNodes = (container: Element, skip: (Element | null | undefined)[], run: (value: string) => string) => {
        for (const node of textNodes(container, skip)) {
            if (!node.nodeValue) continue;
            const known = formatted.get(node);
            const raw = known && node.nodeValue === known.shown ? known.raw : (node.nodeValue ?? '');
            const shown = run(raw);
            formatted.set(node, { raw, shown });
            if (node.nodeValue !== shown) node.nodeValue = shown;
        }
    };

    const fixedNodes = () => [iconBox, expandButton, copyElement?.element()];

    const readText = () => {
        if (!root) return '';
        const text = source
            ? (source.textContent ?? '')
            : textNodes(root, fixedNodes())
                  .map((node) => node.nodeValue)
                  .join('');
        return text.trim();
    };

    const sync = () => {
        if (!root) return;
        if (format) formatNodes(source ?? root, source ? [] : fixedNodes(), format);
        fullText = readText();
    };

    const measure = () => {
        const node = root;
        if (!node) return;
        insideWidgetItem = isInsideWidgetItem(node, copyElement?.element());
        if (cssEllipsis) {
            // A text that switched here from an expandable ellipsis must not stay expanded. The Tooltip depends on
            // isOverflowed: measuring only on hover would leave the first hover without it
            update({ isTruncated: false, expanded: false, ...(opt.showTooltip && { isOverflowed: isOverflowing(node, rows) }) });
            return;
        }
        if (!rows || rows < 0 || view.expanded) return;
        const full = readText();
        const text = getRenderText(node, rows, full, { expand: expandButton ?? null, copy: copyElement?.element() ?? null }, suffix, pos, strong);
        update({ isOverflowed: false, ellipsisContent: text, isTruncated: full !== text });
    };

    const onResize = (entries: ResizeObserverEntry[]) => {
        let changed = false;
        for (const { target, contentRect } of entries) {
            if (widths.get(target) !== contentRect.width) {
                widths.set(target, contentRect.width);
                changed = true;
            }
        }
        if (changed) runtime.handleResize();
    };

    const hover = () => {
        if (cssEllipsis && root) update({ isOverflowed: isOverflowing(root, rows), isTruncated: false });
    };

    // A listener rather than an onmouseenter attribute: the span is no control, and the compiler asks a role of it
    const listenHover: Attachment<HTMLElement> = (node) => {
        node.addEventListener('mouseenter', hover);
        return () => node.removeEventListener('mouseenter', hover);
    };

    const toggle = (event: MouseEvent & { currentTarget: HTMLElement }) => {
        const { expanded } = view;
        const onExpand = typeof ellipsis === 'object' ? ellipsis.onExpand : undefined;
        onExpand?.(!expanded, event);
        const { expandable, collapsible, collapseText } = opt;
        if (!((expandable && !expanded) || (collapsible && expanded))) return;
        update({ expanded: !expanded });
        if (!expanded && collapseText === undefined && event.currentTarget === FocusTrapHandle.getActiveElement(event.currentTarget)) {
            void tick().then(() => root?.focus());
        }
    };

    // Semi icons take their size from a prop a snippet cannot pass, so the size class of a child icon is swapped.
    // Shortcut: icons rendered after mount keep their own size; upgrade with an icon-size context in semi-icons-svelte.
    const sizeIcons: Attachment<HTMLElement> = (box) => {
        const small = realSize === 'small';
        const standard = `${BASE_CLASS_PREFIX}-icon-default`;
        const compact = `${BASE_CLASS_PREFIX}-icon-small`;
        for (const element of box.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon`)) {
            if (small && element.classList.contains(standard)) {
                element.classList.replace(standard, compact);
                resizedIcons.add(element);
            } else if (!small && resizedIcons.has(element)) {
                element.classList.replace(compact, standard);
                resizedIcons.delete(element);
            }
        }
    };

    // Runs after the DOM shows new text, so new text never measures with the previous truncation
    $effect(() => {
        if (!root || !(hasEllipsis || copyable || format)) return;
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(root, { characterData: true, childList: true, subtree: true });
        return () => observer.disconnect();
    });

    $effect.pre(() => {
        const text = fullText;
        if (text !== seenText) {
            seenText = text;
            if (hasEllipsis) view = UNMEASURED;
        }
    });

    $effect(() => {
        if (!hasEllipsis) return;
        runtime.connect(measure);
        return () => runtime.disconnect();
    });

    $effect(() => {
        if (!hasEllipsis || !root) return;
        const observer = new ResizeObserver(onResize);
        observer.observe(root);
        if (root.parentElement) observer.observe(root.parentElement);
        return () => observer.disconnect();
    });

    // truncating renders the expand button, so the text is measured again with its width
    $effect(() => {
        void [fullText, truncated, view.expanded, rows, pos, suffix, expandText, tooltipEnabled, Boolean(copyable), strong, root];
        if (hasEllipsis) runtime.schedule();
    });
</script>

{#snippet decorate(index: number, description: string | undefined)}
    {#if index < decorations.length}
        {@const tag = decorations[index]}
        <svelte:element this={tag.tag} aria-describedby={tag.tag === 'a' ? description : undefined} {...tag.attrs}>{@render decorate(index + 1, description)}</svelte:element>
    {:else}
        <!-- Adjacent blocks share a line: whitespace between them would become a visible space inside the text -->
        {#if icon}<span {@attach sizeIcons} bind:this={iconBox} class={`${prefix}-icon`} x-semi-prop="icon">{@render icon()}</span>{/if}{#if linkClass}<span class={linkClass}>{@render body()}</span>{:else}{@render body()}{/if}
    {/if}
{/snippet}

{#snippet body()}
    {#if hasEllipsis}
        <span {@attach listenHover}
            ><span bind:this={source} hidden={!showFull}>{@render children?.()}</span>{#if !showFull}{view.ellipsisContent}{/if}{suffix}</span
        >
    {:else}
        {@render children?.()}
    {/if}
{/snippet}

{#snippet textElement(trigger?: TooltipTriggerProps)}
    <!-- A link inside the text takes the description when the text itself is no tab stop -->
    {@const describedByLink = Boolean(trigger) && linkDescribes}
    <svelte:element
        this={component}
        bind:this={root}
        {...trigger}
        {...rest}
        aria-describedby={describedByLink ? undefined : (rest['aria-describedby'] ?? trigger?.['aria-describedby'])}
        class={[prefix, ellipsisClass, rest.class, wrapperClass]}
        style={rootStyle}
        tabindex={trigger ? triggerTabindex : (rest.tabindex ?? (focusTarget ? -1 : undefined))}
    >
        {@render decorate(0, describedByLink ? trigger?.['aria-describedby'] : undefined)}{#if actionText !== undefined}<button aria-expanded={(view.expanded ? opt.collapsible : opt.expandable) ? view.expanded : undefined} bind:this={expandButton} class={`${prefix}-ellipsis-expand`} type="button" onclick={toggle}
                >{actionText}</button
            >{/if}{#if copyConfig}<Copyable bind:this={copyElement} {...copyConfig} {copyAction} {copyIcon} {copySuccessTip} {copyTip} onCopiedChange={() => hasEllipsis && runtime.schedule()} />{/if}
    </svelte:element>
{/snippet}

{#snippet plainTrigger()}
    {@render textElement()}
{/snippet}

{#snippet child({ props }: { props: TooltipTriggerProps })}
    {@render textElement(props)}
{/snippet}

{#snippet content()}
    {#if ellipsisContent}
        {@render ellipsisContent()}
    {:else}
        {@render children?.()}
    {/if}
{/snippet}

{#if tooltip && !ellipsisTooltip}
    {#if tooltip.popover}
        <Popover {...popoverBinding} {child} {content} />
    {:else}
        <Tooltip {...tooltipBinding} {child} {content} />
    {/if}
{:else if tooltip && overflowed && ellipsisTooltip}
    {@render ellipsisTooltip({ content: fullText, trigger: plainTrigger })}
{:else}
    {@render textElement()}
{/if}
