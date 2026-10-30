<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, getPanelId, getTabId } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
    import { requireTabsContext } from './context.js';
    import type { TabPaneProps } from './interface.js';

    let { itemKey, children, ...rest }: TabPaneProps = $props();

    const ctx = requireTabsContext('TabPane');

    const view = $derived(ctx.view);
    const active = $derived(view.activeKey === itemKey);

    let activated = $state(untrack(() => active));

    const shouldRender = $derived(!view.lazyRender || active || activated);
    const paneMotion = $derived(TabsFoundation.getPaneMotion({ ...view, itemKey }));

    // split so the effect below runs only when one of the two values changes
    const startClassName = $derived(paneMotion.startClassName);
    const hasMotion = $derived(paneMotion.hasMotion);

    // The overlay stays mounted, so the class is toggled by hand: on when a pane activates with motion, off at its end
    let animating = $state(untrack(() => hasMotion));

    // animation events bubble, and one from the pane's content must not end the overlay's slide
    const handleAnimationEnd = (event: AnimationEvent) => {
        if (event.target === event.currentTarget) {
            animating = false;
        }
    };

    // before the DOM update, so a pane activated by this update renders its content and slide-in class at once
    $effect.pre(() => {
        if (active) {
            activated = true;
        }
    });

    $effect.pre(() => {
        const motion = hasMotion;
        void startClassName;
        untrack(() => {
            animating = motion;
        });
    });
</script>

<!-- Passed-through attributes come first so id, role and aria pairing stay the component's; tabindex stays overridable -->
<div
    {...rest}
    aria-hidden={active ? 'false' : 'true'}
    aria-labelledby={getTabId(view.tabsId, itemKey)}
    class={[cssClasses.TABS_PANE, rest.class, active ? cssClasses.TABS_PANE_ACTIVE : cssClasses.TABS_PANE_INACTIVE]}
    id={getPanelId(view.tabsId, itemKey)}
    role="tabpanel"
    tabindex={rest.tabindex ?? 0}
    x-semi-prop="children"
>
    <div class={[cssClasses.TABS_PANE_MOTION_OVERLAY, animating && startClassName]} x-semi-prop="children" onanimationend={handleAnimationEnd}>
        {#if shouldRender}
            {@render children?.()}
        {/if}
    </div>
</div>
