<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, getStackItemTransform, numbers } from '@fibrae/semi-foundation/notification/constants';
    import NotificationFoundation, { type NoticeAdapter, type NoticeState, type NoticeType } from '@fibrae/semi-foundation/notification/notification-foundation';
    import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
    import { isAlertType, readNoticeText } from '@fibrae/semi-foundation/utils/announcer';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useNoticeClose from '../_base/use-notice-close.js';
    import { getConfigContext } from '../config-provider/context.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getNoticeListContext } from './context.js';
    import type { NoticeItemProps } from './interface.js';

    // The foundation reads only these two
    type FoundationProps = Pick<NoticeItemProps, 'id' | 'duration'>;
    type Foundation = NotificationFoundation<FoundationProps>;
    type Adapter = NoticeAdapter<FoundationProps>;

    const defaults = useDefaultProps('Notification');

    // `class`, `style` and the other native attributes stay in `rest` and land on the notice element (F2)
    let {
        close,
        content = defaults('content', ''),
        depth = 0,
        direction = defaults('direction'),
        duration = defaults('duration', numbers.duration),
        icon: customIcon = defaults('icon'),
        id,
        layer = 0,
        leaving = false,
        placement,
        showClose = defaults('showClose', true),
        stack = false,
        stackExpanded = false,
        theme = defaults('theme', 'normal'),
        title = defaults('title', ''),
        type = defaults('type'),
        onClick,
        onClose,
        onCloseClick,
        onLeaveEnd,
        ...rest
    }: NoticeItemProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Notification');
    const list = getNoticeListContext();

    const uid = $props.id();
    let outer = $state<HTMLDivElement>();
    let noticeEl = $state<HTMLDivElement>();

    // The enter animation has ended; a notice that starts leaving enters again if the store shows it once more
    let entered = $state(false);

    const foundationProps: FoundationProps = {
        get id() {
            return id;
        },
        get duration() {
            return duration;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, NoticeState>(
        NotificationFoundation,
        foundationProps,
        () => ({}),
        () => ({
            notifyWrapperToRemove: (noticeId) => close?.(noticeId),
            notifyClose: () => onClose?.(),
            notifyCloseClick: (noticeId) => onCloseClick?.(noticeId),
        })
    );

    const prefix = cssClasses.NOTICE;
    const titleId = `${prefix}-title-${uid}`;

    const typeIcons: Partial<Record<NoticeType, typeof IconInfoCircle>> = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        error: IconAlertCircle,
    };

    const TypeIcon = $derived(type ? typeIcons[type] : undefined);
    const isAlert = $derived(isAlertType(type));
    const phase = $derived(leaving ? 'hide' : entered ? undefined : 'show');
    const dir = $derived(rest.dir ?? direction ?? config.direction);

    // A spread, because a bound `dir` of undefined would still write dir="" on the element
    const dirAttr = $derived(dir ? { dir } : {});
    const collapsed = $derived(stack && !stackExpanded);
    const stackStyle = $derived(`z-index: ${layer}${collapsed && depth > 0 ? `; transform: ${getStackItemTransform(depth, placement)}` : ''}`);

    const announce = () => {
        if (!isAlert && id !== undefined) list?.announce(id, () => readNoticeText(noticeEl, prefix));
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
        // the content's own animations bubble up to here
        if (event.target !== event.currentTarget) return;
        if (!leaving) {
            entered = true;
        } else if (!event.animationName || /Hide|collapse/.test(event.animationName)) {
            // a late enter-animation end must not cut the leave short
            onLeaveEnd?.();
        }
    };

    useNoticeClose(foundation, list, () => id, announce);

    $effect.pre(() => {
        if (leaving) entered = false;
    });

    // The phase class is on the element once this runs. A theme or user CSS that cancels the animation fires no
    // animationend, so a run without an animation ends here, or a leaving notice would never be removed.
    $effect(() => {
        if (!outer) return;
        if (phase && outer.getAnimations().some((animation) => 'animationName' in animation)) {
            pinAnimatedHeight(outer);
        } else if (leaving) {
            untrack(() => onLeaveEnd?.());
        } else if (phase) {
            entered = true;
        }
    });

    export function restartCloseTimer() {
        foundation.restartCloseTimer();
    }

    export function pauseCloseTimer() {
        foundation.pauseCloseTimer();
    }

    export function resumeCloseTimer() {
        foundation.resumeCloseTimer();
    }
</script>

<div
    bind:this={outer}
    class={[stack && `${prefix}-stack-item`, stack && stackExpanded && `${prefix}-stack-item-expanded`, collapsed && depth >= numbers.stackVisibleCount && `${prefix}-stack-item-hidden`, phase && `${prefix}-animation-${phase}_${placement}`]}
    style={stack ? stackStyle : undefined}
    onanimationend={handleAnimationEnd}
>
    <!-- A status element inserted with its text is announced unreliably; the list's live region announces it -->
    <div bind:this={noticeEl} {...rest} aria-labelledby={title ? titleId : undefined} aria-live={isAlert ? undefined : 'off'} class={[prefix, rest.class, type && `${prefix}-${type}`, theme === 'light' && `${prefix}-light`]} {...dirAttr} role={isAlert ? 'alert' : 'status'} onclick={onClick}>
        <div>
            {#if customIcon || TypeIcon}
                <div class={[`${prefix}-icon`, type && `${prefix}-${type}`]} x-semi-prop="icon">
                    {#if !customIcon}
                        {#if TypeIcon}
                            <TypeIcon size="large" />
                        {/if}
                    {:else if typeof customIcon === 'string'}
                        {customIcon}
                    {:else}
                        {@render customIcon()}
                    {/if}
                </div>
            {/if}
        </div>
        <div class={`${prefix}-inner`}>
            <div class={`${prefix}-content-wrapper`}>
                {#if title}
                    <div class={`${prefix}-title`} id={titleId} x-semi-prop="title">
                        {#if typeof title === 'string'}
                            {title}
                        {:else}
                            {@render title()}
                        {/if}
                    </div>
                {/if}
                {#if content}
                    <div class={`${prefix}-content`} x-semi-prop="content">
                        {#if typeof content === 'string'}
                            {content}
                        {:else}
                            {@render content()}
                        {/if}
                    </div>
                {/if}
            </div>
            {#if showClose}
                <IconButton aria-label={locale().locale.close} class={`${prefix}-icon-close`} size="small" theme="borderless" type="tertiary" onclick={foundation.clickClose}>
                    {#snippet icon()}
                        <IconClose />
                    {/snippet}
                </IconButton>
            {/if}
        </div>
    </div>
</div>
