<script lang="ts">
    import { tick } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/banner/constants';
    import BannerFoundation, { type BannerAdapter } from '@fibrae/semi-foundation/banner/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { findFocusAfter, handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import '@fibrae/semi-foundation/banner/banner.scss';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { TypographyParagraph, TypographyTitle } from '../typography/index.js';
    import type { BannerProps } from './interface.js';

    interface BannerState {
        visible: boolean;
    }

    type Foundation = BannerFoundation<object, BannerState, MouseEvent>;
    type Adapter = BannerAdapter<object, BannerState, MouseEvent>;

    const defaults = useDefaultProps('Banner');
    const { bordered = defaults('bordered', false), fullMode = defaults('fullMode', true), title = defaults('title'), type = defaults('type', 'info'), onClose, description, icon, closeIcon, children, ...rest }: BannerProps = $props();

    const locale = useLocale('Banner');

    const { foundation, states } = useFoundation<Foundation, Adapter, object, BannerState>(
        BannerFoundation,
        {},
        () => ({ visible: true }),
        (base) => ({
            hide: () => base.setState({ visible: false }),
            notifyClose: (event) => onClose?.(event),
        })
    );

    const prefix = cssClasses.PREFIX;

    const iconMap = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        danger: IconAlertCircle,
    };

    const TypeIcon = $derived(iconMap[type]);

    const remove = async (event: MouseEvent & { currentTarget: HTMLElement }) => {
        event.stopPropagation();
        // Closing removes the whole banner, so the element to land on is read before it goes.
        const root = event.currentTarget.closest(`.${prefix}`);
        const hadFocus = root?.contains(FocusTrapHandle.getActiveElement(root)) ?? false;
        const target = root && findFocusAfter(root);
        foundation.removeBanner(event);
        if (root && hadFocus) {
            await tick();
            handoverFocus(root, target);
        }
    };
</script>

{#if states().visible}
    <div {...rest} class={[prefix, `${prefix}-${type}`, rest.class, fullMode ? `${prefix}-full` : `${prefix}-in-container`, { [`${prefix}-bordered`]: !fullMode && bordered }]} role="alert">
        <div class={`${prefix}-content-wrapper`}>
            <div class={`${prefix}-content`}>
                {#if icon !== null}
                    <div class={`${prefix}-icon`} x-semi-prop="icon">
                        {#if icon}
                            {@render icon()}
                        {:else}
                            <TypeIcon aria-label={locale().locale[type]} size="large" />
                        {/if}
                    </div>
                {/if}
                <div class={`${prefix}-content-body`}>
                    {#if title}
                        <TypographyTitle class={`${prefix}-title`} component="div" heading={5} x-semi-prop="title">
                            {#if typeof title === 'function'}{@render title()}{:else}{title}{/if}
                        </TypographyTitle>
                    {/if}
                    {#if description}
                        <TypographyParagraph class={`${prefix}-description`} component="div" x-semi-prop="description">{@render description()}</TypographyParagraph>
                    {/if}
                </div>
            </div>
            {#if closeIcon !== null}
                {#snippet closeButtonIcon()}
                    {#if closeIcon}
                        {@render closeIcon()}
                    {:else}
                        <IconClose x-semi-prop="closeIcon" />
                    {/if}
                {/snippet}
                <IconButton aria-label={locale().locale.close} class={`${prefix}-close`} icon={closeButtonIcon} size="small" theme="borderless" type="tertiary" onclick={remove} />
            {/if}
        </div>
        {#if children}
            <div class={`${prefix}-extra`} x-semi-prop="children">{@render children()}</div>
        {/if}
    </div>
{/if}
