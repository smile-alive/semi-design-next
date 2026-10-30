<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { throttle } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/backtop/constants';
    import BackTopFoundation, { type BackTopAdapter, type BackTopBaseProps } from '@fibrae/semi-foundation/backtop/foundation';
    import '@fibrae/semi-foundation/backtop/backtop.scss';
    import { IconBackTop } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import FloatButton from '../float-button/float-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { BackTopProps, BackTopState } from './interface.js';

    type ClickEvent = Parameters<NonNullable<BackTopProps['onclick']>>[0];
    type Foundation = BackTopFoundation<BackTopBaseProps, BackTopState, ClickEvent>;
    type Adapter = BackTopAdapter<BackTopBaseProps, BackTopState, ClickEvent>;

    const defaults = useDefaultProps('BackTop');

    // badge, colorful, shape and size have no fallback here: FloatButton owns their defaults, and a fallback would hide its global ones
    let {
        badge = defaults('badge'),
        colorful = defaults('colorful'),
        duration = defaults('duration', 450),
        shape = defaults('shape'),
        size = defaults('size'),
        // the window is read when the function is called, which the server never does
        target = defaults('target', () => window),
        visibilityHeight = defaults('visibilityHeight', 400),
        badgeCount,
        children,
        icon,
        onclick,
        ...rest
    }: BackTopProps = $props();

    const locale = useLocale('BackTop');

    let button = $state<HTMLElement>();

    // the foundation reads the props through getters, since $props() cannot be handed over as one object
    const { foundation, states } = useFoundation<Foundation, Adapter, BackTopBaseProps, BackTopState>(
        BackTopFoundation,
        {
            get target() {
                return target;
            },
            get visibilityHeight() {
                return visibilityHeight;
            },
            get duration() {
                return duration;
            },
        },
        () => ({ visible: false }),
        (base) => ({
            updateVisible: (visible) => base.setState({ visible }),
            notifyClick: (event) => onclick?.(event),
        })
    );

    const prefix = cssClasses.PREFIX;

    // Static children are the visible name, and a different default would contradict them
    const ariaLabel = $derived(rest['aria-label'] ?? (children ? undefined : locale().locale.backToTop));
    const throttledClick = $derived(throttle((event: ClickEvent) => foundation.onClick(event), duration));

    // FloatButton hands its rest props, attachments included, to the native button
    const captureButton: Attachment<HTMLElement> = (node) => {
        button = node;
        return () => {
            button = undefined;
        };
    };

    watch(() => target, foundation.handleTargetChange);

    $effect(() => {
        // the timer of a replaced or destroyed throttle must not fire
        const pending = throttledClick;
        return () => pending.cancel();
    });

    $effect(() => {
        if (children && button) {
            BackTopFoundation.warnInteractiveChildren(button);
        }
    });
</script>

{#snippet iconPart()}
    {#if children}
        {@render children()}
    {:else if icon}
        {@render icon()}
    {:else}
        <IconBackTop />
    {/if}
{/snippet}

{#if states().visible}
    <FloatButton {...rest} {@attach captureButton} aria-label={ariaLabel} {badge} {badgeCount} class={[prefix, rest.class]} {colorful} icon={iconPart} {shape} {size} x-semi-prop="children" onclick={throttledClick} />
{/if}
