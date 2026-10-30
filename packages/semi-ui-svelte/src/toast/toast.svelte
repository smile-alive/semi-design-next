<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, getStackLayerTransform, numbers } from '@fibrae/semi-foundation/toast/constants';
    import ToastFoundation, { type ToastAdapter, type ToastState, type ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
    import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
    import { isAlertType } from '@fibrae/semi-foundation/utils/announcer';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useNoticeClose from '../_base/use-notice-close.js';
    import { getConfigContext } from '../config-provider/context.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getToastListContext } from './context.js';
    import type { ToastItemProps } from './interface.js';

    type Foundation = ToastFoundation<ToastItemProps>;
    type Adapter = ToastAdapter<ToastItemProps>;

    const defaults = useDefaultProps('Toast');

    // `class`, `style` and the other native attributes stay in `rest` and land on the toast element (F2)
    let {
        close,
        content = defaults('content', ''),
        direction = defaults('direction'),
        duration = defaults('duration', numbers.duration),
        icon: customIcon = defaults('icon'),
        id,
        leaving = false,
        motion = defaults('motion', true),
        positionInList,
        showClose = defaults('showClose', true),
        stack = false,
        stackExpanded = false,
        textMaxWidth = defaults('textMaxWidth', 450),
        theme = defaults('theme', 'normal'),
        type = defaults('type'),
        onClose,
        onLeaveEnd,
        ...rest
    }: ToastItemProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Toast');
    const list = getToastListContext();

    let outer = $state<HTMLDivElement>();
    let toastEl = $state<HTMLDivElement>();

    // The enter animation has ended; a toast that starts leaving enters again if the store shows it once more
    let entered = $state(false);

    const foundationProps: ToastItemProps = {
        get id() {
            return id;
        },
        get duration() {
            return duration;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, ToastItemProps, ToastState>(
        ToastFoundation,
        foundationProps,
        () => ({}),
        () => ({
            notifyWrapperToRemove: (toastId) => close?.(toastId),
            notifyClose: () => onClose?.(),
        })
    );

    const prefix = cssClasses.PREFIX;

    const typeIcons: Partial<Record<ToastType, typeof IconInfoCircle>> = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        error: IconAlertCircle,
    };

    const TypeIcon = $derived(type ? typeIcons[type] : undefined);
    const isAlert = $derived(isAlertType(type));
    const ariaLabel = $derived(type ? locale().locale[type] : locale().locale.default);
    const phase = $derived(motion ? (leaving ? 'hide' : entered ? undefined : 'show') : undefined);
    const dir = $derived(rest.dir ?? direction ?? config.direction);

    // A spread, because a bound `dir` of undefined would still write dir="" on the element
    const dirAttr = $derived(dir ? { dir } : {});
    const toastStyle = $derived([rest.style, `transform: ${getStackLayerTransform(positionInList)}`].filter(Boolean).join('; '));

    const announce = () => {
        if (!isAlert && id !== undefined) list?.announce(id, () => (toastEl?.textContent ?? '').replace(/\s+/g, ' ').trim());
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
        // the content's own slide animation bubbles up to here
        if (event.target !== event.currentTarget) return;
        if (!leaving) {
            entered = true;
        } else if (!event.animationName || event.animationName.includes('hide')) {
            // a late enter-animation end must not cut the leave short
            onLeaveEnd?.();
        }
    };

    useNoticeClose(foundation, list, () => id, announce);

    $effect.pre(() => {
        if (leaving) entered = false;
    });

    // The phase class is on the element once this runs. A theme or user CSS that cancels the animation fires no
    // animationend, so a run without an animation ends here, or a leaving toast would never be removed.
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

<div bind:this={outer} class={[stack && `${prefix}-zero-height-wrapper`, stack && stackExpanded && `${prefix}-zero-height-wrapper-expanded`, !motion && `${prefix}-no-motion`, phase && `${prefix}-animation-${phase}`]} onanimationend={handleAnimationEnd}>
    <!-- A status element inserted with its text is announced unreliably; the list's live region announces it -->
    <div bind:this={toastEl} {...rest} aria-label={ariaLabel} aria-live={isAlert ? undefined : 'off'} class={[prefix, rest.class, type && `${prefix}-${type}`, theme === 'light' && `${prefix}-light`]} {...dirAttr} role={isAlert ? 'alert' : 'status'} style={toastStyle}>
        <div class={`${prefix}-content`}>
            {#if customIcon}
                {#if typeof customIcon === 'string'}
                    {customIcon}
                {:else}
                    {@render customIcon()}
                {/if}
            {:else if TypeIcon}
                <TypeIcon class={[`${prefix}-icon`, `${prefix}-icon-${type}`]} size="large" />
            {/if}
            <span class={`${prefix}-content-text`} style:max-width={toCssLength(textMaxWidth)} x-semi-prop="content">
                {#if typeof content === 'string'}
                    {content}
                {:else if content}
                    {@render content()}
                {/if}
            </span>
            {#if showClose}
                <div class={`${prefix}-close-button`}>
                    <IconButton aria-label={locale().locale.close} size="small" theme="borderless" type="tertiary" onclick={foundation.close}>
                        {#snippet icon()}
                            <IconClose x-semi-prop="icon" />
                        {/snippet}
                    </IconButton>
                </div>
            {/if}
        </div>
    </div>
</div>
