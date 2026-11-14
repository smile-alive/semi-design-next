<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/components/user-guide/constants';
    import UserGuideFoundation, { type UserGuideAdapter, type UserGuideBaseState } from '@fibrae/semi-foundation/components/user-guide/foundation';
    import '@fibrae/semi-foundation/components/user-guide/user-guide.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { watch } from '../../hooks/index.js';
    import { Button } from '../button/index.js';
    import { useConfig } from '../config-provider/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Modal } from '../modal/index.js';
    import { Popover } from '../popover/index.js';
    import type { UserGuideButtonProps, UserGuideProps, UserGuideStepItem, UserGuideStepSnippetProps } from './interface.js';
    import { anchorStyle, buttonProps } from './utils.js';

    type FoundationProps = Pick<UserGuideProps, 'visible' | 'current' | 'spotlightPadding' | 'mode' | 'mask' | 'getPopupContainer'> & { steps: UserGuideStepItem[] };
    type Foundation = UserGuideFoundation<FoundationProps>;
    type Adapter = UserGuideAdapter<FoundationProps>;

    const defaults = useDefaultProps('UserGuide');

    // No fallback on `visible` and `current`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        visible = $bindable(),
        current = $bindable(),
        class: className,
        style,
        finishText = defaults('finishText'),
        getPopupContainer = defaults('getPopupContainer'),
        mask = defaults('mask', true),
        mode = defaults('mode', 'popup'),
        nextButtonProps = defaults('nextButtonProps'),
        position = defaults('position', 'bottom'),
        prevButtonProps = defaults('prevButtonProps'),
        showPrevButton = defaults('showPrevButton', true),
        showSkipButton = defaults('showSkipButton', true),
        spotlightPadding = defaults('spotlightPadding'),
        steps = defaults('steps', []),
        theme = defaults('theme', 'default'),
        zIndex = defaults('zIndex', numbers.DEFAULT_Z_INDEX),
        onChange,
        onNext,
        onPrev,
        onSkip,
        onFinish,
        nextText,
        prevText,
    }: UserGuideProps = $props();

    const config = useConfig();
    const locale = useLocale('UserGuide');

    // A `current` the parent supplied (at mount or later) survives a hide; one the guide only wrote itself is cleared on
    // hide, so an uncontrolled guide restarts from the first step
    let pinned = untrack(() => current !== undefined);
    let written: number | undefined;
    let popover = $state<Popover>();
    const uid = $props.id();

    const prefix = cssClasses.PREFIX;
    const modalPrefix = cssClasses.PREFIX_MODAL;
    const popupPrefix = `${prefix}-popup-content`;
    const spotlightId = `${prefix}-spotlight-${uid}`;
    const titleId = `${spotlightId}-title`;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get visible() {
            return Boolean(visible ?? defaults('visible', false));
        },
        get current() {
            return current ?? defaults('current');
        },
        get spotlightPadding() {
            return spotlightPadding;
        },
        get steps() {
            return steps;
        },
        get mode() {
            return mode;
        },
        get mask() {
            return mask;
        },
        get getPopupContainer() {
            return getPopupContainer ?? config.getPopupContainer;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, UserGuideBaseState>(
        UserGuideFoundation,
        foundationProps,
        (view) => UserGuideFoundation.getInitialState(view),
        () => ({
            getPopup: () => popover?.getPopup(),
            clearWrittenCurrent: () => {
                if (!pinned) current = undefined;
            },
            // the bindable props are the source of truth: bound, the write reaches the parent; unbound, it overrides locally
            notifyChange: (next) => {
                written = next;
                current = next;
                onChange?.(next);
            },
            notifyFinish: () => {
                visible = false;
                onFinish?.();
            },
            notifyNext: (next) => onNext?.(next),
            notifyPrev: (next) => onPrev?.(next),
            notifySkip: () => {
                visible = false;
                onSkip?.();
            },
        })
    );

    const open = $derived(foundationProps.visible);
    const currentIndex = $derived(UserGuideFoundation.deriveCurrent(foundationProps, states()));
    const step = $derived<UserGuideStepItem | undefined>(steps[currentIndex]);
    const rect = $derived(states().spotlightRect);
    const isFirst = $derived(currentIndex === 0);
    const isLast = $derived(currentIndex === steps.length - 1);
    const showMask = $derived(step?.mask ?? mask);
    const primary = $derived((step?.theme ?? theme) === 'primary');
    const hasTitle = $derived(Boolean(step?.title));
    const hasDescription = $derived(Boolean(step?.description));
    const cardClass = $derived([`${prefix}-popover`, className, step?.class].filter(Boolean).join(' '));
    const cardStyle = $derived(['padding: 0', primary && 'background-color: var(--semi-color-primary)', style].filter(Boolean).join(';'));

    const secondaryProps = $derived<UserGuideButtonProps>({
        style: primary ? 'background-color: var(--semi-color-fill-2)' : undefined,
        theme: primary ? 'solid' : 'light',
        type: primary ? 'primary' : 'tertiary',
    });

    const popupPrevProps = $derived(buttonProps(secondaryProps, prevButtonProps, foundation.handlePrev));
    const popupNextProps = $derived(buttonProps(primary ? { type: 'primary', theme: 'borderless', style: 'background-color: var(--semi-color-white)' } : { type: 'primary', theme: 'solid' }, nextButtonProps, foundation.handleNext));
    const modalPrevProps = $derived(buttonProps({ type: 'tertiary' }, prevButtonProps, foundation.handlePrev));
    const modalNextProps = $derived(buttonProps({ theme: 'solid' }, nextButtonProps, foundation.handleNext));

    watch(
        () => current,
        (value) => {
            if (value === undefined) {
                pinned = false;
            } else if (value !== written) {
                pinned = true;
            }
        }
    );
</script>

{#snippet text(value: string | Snippet<[UserGuideStepSnippetProps]> | undefined, args: UserGuideStepSnippetProps)}
    {#if typeof value === 'function'}
        {@render value(args)}
    {:else}
        {value}
    {/if}
{/snippet}

{#if open && step}
    {@const item = step}
    {@const args = { item, index: currentIndex }}
    {#if mode === 'modal'}
        <Modal
            aria-labelledby={hasTitle ? titleId : undefined}
            bind:visible={() => true, () => {}}
            centered
            class={[modalPrefix, className, item.class]}
            footer={null}
            {getPopupContainer}
            header={null}
            mask={showMask}
            maskClosable={false}
            onCancel={foundation.handleSkip}
            {style}
            styles={{ body: 'padding: 0' }}
            {zIndex}
        >
            {#if item.cover}
                <div class={`${modalPrefix}-cover`} x-semi-prop="cover">{@render item.cover(args)}</div>
                <div aria-hidden="true" class={`${modalPrefix}-indicator`}>
                    {#each steps as _, i (i)}
                        <span class={[`${modalPrefix}-indicator-item`, { [`${modalPrefix}-indicator-item-active`]: i === currentIndex }]} data-index={i}></span>
                    {/each}
                </div>
                <span class={`${modalPrefix}-progress`}>{currentIndex + 1}/{steps.length}</span>
            {/if}
            {#if hasTitle || hasDescription}
                <div class={`${modalPrefix}-body`}>
                    {#if hasTitle}
                        <div class={`${modalPrefix}-body-title`} id={titleId} x-semi-prop="title">{@render text(item.title, args)}</div>
                    {/if}
                    {#if hasDescription}
                        <div class={`${modalPrefix}-body-description`} x-semi-prop="description">{@render text(item.description, args)}</div>
                    {/if}
                </div>
            {/if}
            <div class={`${modalPrefix}-footer`}>
                {#if showSkipButton && !isLast}
                    <Button type="tertiary" onclick={foundation.handleSkip}>{locale().locale.skip}</Button>
                {/if}
                {#if showPrevButton && !isFirst}
                    <Button {...modalPrevProps}>
                        {#if prevText}
                            {@render prevText()}
                        {:else}
                            {locale().locale.prev}
                        {/if}
                    </Button>
                {/if}
                <Button {...modalNextProps} autofocus>
                    {#if isLast}
                        {finishText || locale().locale.finish}
                    {:else if nextText}
                        {@render nextText()}
                    {:else}
                        {locale().locale.next}
                    {/if}
                </Button>
            </div>
        </Modal>
    {:else if rect}
        {#snippet card()}
            <div class={[popupPrefix, { [`${popupPrefix}-primary`]: primary }]}>
                {#if item.cover}
                    <div class={`${popupPrefix}-cover`} x-semi-prop="cover">{@render item.cover(args)}</div>
                {/if}
                <div class={`${popupPrefix}-body`}>
                    {#if hasTitle}
                        <div class={`${popupPrefix}-title`} id={titleId} x-semi-prop="title">{@render text(item.title, args)}</div>
                    {/if}
                    {#if hasDescription}
                        <div class={`${popupPrefix}-description`} x-semi-prop="description">{@render text(item.description, args)}</div>
                    {/if}
                    <div class={`${popupPrefix}-footer`}>
                        {#if steps.length > 1}
                            <div class={`${popupPrefix}-indicator`}>{currentIndex + 1}/{steps.length}</div>
                        {/if}
                        <div class={`${popupPrefix}-buttons`}>
                            {#if showSkipButton && !isLast}
                                <Button {...secondaryProps} onclick={foundation.handleSkip}>{locale().locale.skip}</Button>
                            {/if}
                            {#if showPrevButton && !isFirst}
                                <Button {...popupPrevProps}>
                                    {#if prevText}
                                        {@render prevText()}
                                    {:else}
                                        {locale().locale.prev}
                                    {/if}
                                </Button>
                            {/if}
                            <Button {...popupNextProps} autofocus>
                                {#if isLast}
                                    {finishText || locale().locale.finish}
                                {:else if nextText}
                                    {@render nextText()}
                                {:else}
                                    {locale().locale.next}
                                {/if}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        {/snippet}
        {#key currentIndex}
            <Popover aria-labelledby={hasTitle ? titleId : undefined} bind:this={popover} bind:visible={() => true, () => {}} class={cardClass} content={card} onEscKeyDown={foundation.handleSkip} position={item.position || position} showArrow={item.showArrow !== false} style={cardStyle} trigger="custom">
                <!-- tabindex: Tooltip would add 0, an invisible Tab stop -->
                {#snippet child({ props })}
                    <div {...props} style={anchorStyle(rect)} tabindex="-1"></div>
                {/snippet}
            </Popover>
        {/key}
        <svg class={`${prefix}-spotlight`} style:z-index={zIndex}>
            <defs>
                <mask id={spotlightId}>
                    <rect fill="white" height="100%" width="100%" />
                    <rect class={`${prefix}-spotlight-rect`} fill="black" height={rect.height} rx={4} width={rect.width} x={rect.x} y={rect.y} />
                </mask>
            </defs>
            {#if showMask}
                <rect fill="var(--semi-color-overlay-bg)" height="100%" mask={`url(#${spotlightId})`} width="100%" />
                <rect class={`${prefix}-spotlight-transparent-rect`} fill="transparent" height={rect.y} width="100%" x={0} y={0} />
                <rect class={`${prefix}-spotlight-transparent-rect`} fill="transparent" height={rect.height} width={rect.x} x={0} y={rect.y} />
                <rect class={`${prefix}-spotlight-transparent-rect`} fill="transparent" height={rect.height} width={`calc(100% - ${rect.x + rect.width}px)`} x={rect.x + rect.width} y={rect.y} />
                <rect class={`${prefix}-spotlight-transparent-rect`} fill="transparent" height={`calc(100% - ${rect.y + rect.height}px)`} width="100%" y={rect.y + rect.height} />
            {/if}
        </svg>
    {/if}
{/if}
