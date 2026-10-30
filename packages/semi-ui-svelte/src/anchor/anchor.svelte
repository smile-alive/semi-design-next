<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-foundation/anchor/constants';
    import AnchorFoundation, { type AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
    import { findAnchorTarget } from '@fibrae/semi-foundation/anchor/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/anchor/anchor.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { setAnchorContext } from './context.js';
    import type { AnchorClickEvent, AnchorProps, AnchorState } from './interface.js';
    import LinkItem from './link-item.svelte';
    import { hrefsOf, nodesOf } from './links.js';

    type Foundation = AnchorFoundation<AnchorProps, AnchorState, AnchorClickEvent>;
    type Adapter = AnchorAdapter<AnchorProps, AnchorState, AnchorClickEvent>;

    const defaults = useDefaultProps('Anchor');

    const {
        links = [],
        autoCollapse = defaults('autoCollapse', false),
        defaultAnchor = defaults('defaultAnchor', ''),
        getContainer = defaults('getContainer'),
        maxHeight = defaults('maxHeight', strings.MAX_HEIGHT),
        maxWidth = defaults('maxWidth', strings.MAX_WIDTH),
        offsetTop = defaults('offsetTop', 0),
        position = defaults('position'),
        railTheme = defaults('railTheme', 'primary'),
        scrollMotion = defaults('scrollMotion', false),
        scrollIntoViewOptions = defaults('scrollIntoViewOptions'),
        showTooltip = defaults('showTooltip', false),
        size = defaults('size', 'default'),
        targetOffset = defaults('targetOffset', 0),
        onChange,
        onClick,
        title,
        ...rest
    }: AnchorProps = $props();

    const locale = useLocale('Anchor');

    let root: HTMLDivElement | undefined = $state();
    let linkWrapper: HTMLDivElement | undefined = $state();

    const prefixCls = cssClasses.PREFIX;
    const hrefs = $derived(hrefsOf(links));
    const childMap = $derived(AnchorFoundation.getChildMap(nodesOf(links)));
    const style = $derived([`max-width: ${toCssLength(maxWidth)}`, `max-height: ${toCssLength(maxHeight)}`, rest.style].filter(Boolean).join('; '));

    const foundationProps: AnchorProps = {
        get defaultAnchor() {
            return defaultAnchor;
        },
        get offsetTop() {
            return offsetTop;
        },
        get scrollIntoViewOptions() {
            return scrollIntoViewOptions;
        },
        get scrollMotion() {
            return scrollMotion;
        },
        get targetOffset() {
            return targetOffset;
        },
    };

    let setLinks: (next: string[]) => void = () => {};

    const { foundation, states } = useFoundation<Foundation, Adapter, AnchorProps, AnchorState>(
        AnchorFoundation,
        foundationProps,
        () => ({ activeLink: '', links: hrefs, clickLink: false, slideBarTop: '0' }),
        (base) => {
            setLinks = (next) => base.setState({ links: next });
            return {
                getContainer: () => (getContainer ?? (() => window))() || window,
                getAnchorNode: (selector) => root?.querySelector<HTMLElement>(selector) ?? null,
                getContentNode: (link) => findAnchorTarget(root, link),
                notifyChange: (currentLink, previousLink) => onChange?.(currentLink, previousLink),
                notifyClick: (event, link) => onClick?.(event, link),
            };
        }
    );

    setAnchorContext({
        get activeLink() {
            return states().activeLink;
        },
        get autoCollapse() {
            return autoCollapse;
        },
        get childMap() {
            return childMap;
        },
        get position() {
            return position;
        },
        get showTooltip() {
            return showTooltip;
        },
        get size() {
            return size;
        },
        get title() {
            return title;
        },
        onClick: foundation.handleClick,
    });

    watch(
        () => hrefs,
        (next) => setLinks(next)
    );

    // getContainer may return a later node: the effect tracks the signals it reads, and runs again when the links change
    $effect(() => {
        void hrefs;
        void getContainer?.();
        foundation.handleContainerChange();
    });

    // links above the active one can move it without the active link changing
    $effect(() => {
        void hrefs;
        void states().activeLink;
        foundation.syncSlideBar();
    });

    // a narrower container wraps link titles, which moves the active link without any update
    onMount(() => {
        const observer = new ResizeObserver(foundation.syncSlideBar);
        if (linkWrapper) {
            observer.observe(linkWrapper);
        }
        return () => observer.disconnect();
    });
</script>

<div {...rest} aria-label={rest['aria-label'] || locale().locale.label} bind:this={root} class={[prefixCls, rest.class, `${prefixCls}-size-${size}`]} role="navigation" {style}>
    <div class={`${prefixCls}-rail-wrapper`}>
        <div aria-hidden="true" class={[`${prefixCls}-slide`, `${prefixCls}-slide-${railTheme}`]}>
            <span class={[`${prefixCls}-slide-bar`, `${prefixCls}-slide-bar-${size}`, `${prefixCls}-slide-bar-${railTheme}`, { [`${prefixCls}-slide-bar-active`]: states().activeLink }]} style={`top: ${states().slideBarTop}`}></span>
        </div>
        <div bind:this={linkWrapper} class={`${prefixCls}-link-wrapper`} role="list">
            {#each links as item, index (index)}
                <LinkItem {item} level={1} />
            {/each}
        </div>
    </div>
</div>
